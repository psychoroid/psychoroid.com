-- Create private schema if it doesn't exist
create schema if not exists private;

-- Create logging function
create or replace function private.log_cad_action(
    p_action text,
    p_details jsonb
) returns void as $$
begin
    insert into audit_logs (action, details)
    values (p_action, p_details);
end;
$$ language plpgsql security definer;

-- Create CAD chat tables if they don't exist
create table if not exists public.cad_chats (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references auth.users(id) on delete cascade,
    title text not null,
    created_at timestamptz default now(),
    updated_at timestamptz default now(),
    last_message_at timestamptz default now(),
    metadata jsonb default '{}'::jsonb
);

create table if not exists public.cad_messages (
    id uuid primary key default gen_random_uuid(),
    chat_id uuid references public.cad_chats(id) on delete cascade,
    role text not null check (role in ('user', 'assistant')),
    content text not null,
    metadata jsonb default '{}'::jsonb,
    created_at timestamptz default now()
);

-- Create audit logs table if it doesn't exist
create table if not exists public.audit_logs (
    id uuid primary key default gen_random_uuid(),
    action text not null,
    details jsonb not null,
    created_at timestamptz default now()
);

-- Create RPC function to create a new chat
create or replace function public.create_cad_chat(
    p_title text,
    p_initial_message text default null
) returns uuid as $$
declare
    v_chat_id uuid;
begin
    -- Log the start of chat creation
    perform private.log_cad_action('create_cad_chat_start', jsonb_build_object(
        'user_id', auth.uid(),
        'title', p_title,
        'timestamp', now()
    ));

    -- Create new chat
    insert into public.cad_chats (user_id, title)
    values (auth.uid(), p_title)
    returning id into v_chat_id;

    -- Add initial message if provided
    if p_initial_message is not null then
        insert into public.cad_messages (chat_id, role, content)
        values (v_chat_id, 'user', p_initial_message);
    end if;

    -- Log successful chat creation
    perform private.log_cad_action('create_cad_chat_success', jsonb_build_object(
        'chat_id', v_chat_id,
        'user_id', auth.uid(),
        'timestamp', now()
    ));

    return v_chat_id;
end;
$$ language plpgsql security definer;

-- Create RPC function to save a message
create or replace function public.save_cad_message(
    p_chat_id uuid,
    p_role text,
    p_content text,
    p_metadata jsonb default '{}'::jsonb
) returns uuid as $$
declare
    v_message_id uuid;
begin
    -- Log message save attempt
    perform private.log_cad_action('save_cad_message_start', jsonb_build_object(
        'chat_id', p_chat_id,
        'role', p_role,
        'user_id', auth.uid(),
        'timestamp', now()
    ));

    -- Verify chat ownership
    if not exists (
        select 1 from public.cad_chats
        where id = p_chat_id and user_id = auth.uid()
    ) then
        perform private.log_cad_action('save_cad_message_error', jsonb_build_object(
            'error', 'unauthorized_access',
            'chat_id', p_chat_id,
            'user_id', auth.uid(),
            'timestamp', now()
        ));
        raise exception 'Unauthorized access to chat';
    end if;

    -- Save message
    insert into public.cad_messages (chat_id, role, content, metadata)
    values (p_chat_id, p_role, p_content, p_metadata)
    returning id into v_message_id;

    -- Update chat's updated_at and last_message_at timestamps
    update public.cad_chats
    set 
        updated_at = now(),
        last_message_at = now()
    where id = p_chat_id;

    -- Log successful message save
    perform private.log_cad_action('save_cad_message_success', jsonb_build_object(
        'message_id', v_message_id,
        'chat_id', p_chat_id,
        'user_id', auth.uid(),
        'timestamp', now()
    ));

    return v_message_id;
end;
$$ language plpgsql security definer;

-- Create RPC function to load chat messages
create or replace function public.load_cad_chat(
    p_chat_id uuid
) returns table (
    id uuid,
    role text,
    content text,
    metadata jsonb,
    created_at timestamptz
) as $$
begin
    -- Log chat load attempt
    perform private.log_cad_action('load_cad_chat_start', jsonb_build_object(
        'chat_id', p_chat_id,
        'user_id', auth.uid(),
        'timestamp', now()
    ));

    -- Verify chat ownership
    if not exists (
        select 1 from public.cad_chats
        where id = p_chat_id and user_id = auth.uid()
    ) then
        perform private.log_cad_action('load_cad_chat_error', jsonb_build_object(
            'error', 'unauthorized_access',
            'chat_id', p_chat_id,
            'user_id', auth.uid(),
            'timestamp', now()
        ));
        raise exception 'Unauthorized access to chat';
    end if;

    -- Log successful chat load
    perform private.log_cad_action('load_cad_chat_success', jsonb_build_object(
        'chat_id', p_chat_id,
        'user_id', auth.uid(),
        'timestamp', now()
    ));

    return query
    select m.id, m.role, m.content, m.metadata, m.created_at
    from public.cad_messages m
    where m.chat_id = p_chat_id
    order by m.created_at asc;
end;
$$ language plpgsql security definer;

-- Create RPC function to get user's chat history
create or replace function public.get_user_cad_chats(
    limit_count int default 10
) returns table (
    id uuid,
    title text,
    created_at timestamptz,
    updated_at timestamptz,
    last_message text
) as $$
begin
    -- Log chat history request
    perform private.log_cad_action('get_user_cad_chats_start', jsonb_build_object(
        'user_id', auth.uid(),
        'limit', limit_count,
        'timestamp', now()
    ));

    return query
    with last_messages as (
        select distinct on (chat_id)
            chat_id,
            content as last_message
        from public.cad_messages
        order by chat_id, created_at desc
    )
    select 
        c.id,
        c.title,
        c.created_at,
        c.updated_at,
        lm.last_message
    from public.cad_chats c
    left join last_messages lm on c.id = lm.chat_id
    where c.user_id = auth.uid()
    order by c.updated_at desc
    limit limit_count;

    -- Log successful chat history retrieval
    perform private.log_cad_action('get_user_cad_chats_success', jsonb_build_object(
        'user_id', auth.uid(),
        'timestamp', now()
    ));
end;
$$ language plpgsql security definer;

-- Add RLS policies
alter table public.cad_chats enable row level security;
alter table public.cad_messages enable row level security;
alter table public.audit_logs enable row level security;

-- Chats policies
create policy "Users can view their own chats"
    on public.cad_chats for select
    to authenticated
    using (user_id = auth.uid());

create policy "Users can create their own chats"
    on public.cad_chats for insert
    to authenticated
    with check (user_id = auth.uid());

create policy "Users can update their own chats"
    on public.cad_chats for update
    to authenticated
    using (user_id = auth.uid());

-- Messages policies
create policy "Users can view messages in their chats"
    on public.cad_messages for select
    to authenticated
    using (
        chat_id in (
            select id from public.cad_chats
            where user_id = auth.uid()
        )
    );

create policy "Users can create messages in their chats"
    on public.cad_messages for insert
    to authenticated
    with check (
        chat_id in (
            select id from public.cad_chats
            where user_id = auth.uid()
        )
    );

-- Audit logs policies (only viewable by system)
create policy "No direct access to audit logs"
    on public.audit_logs for select
    to authenticated
    using (false);

-- Create indexes for better performance
create index if not exists idx_cad_chats_user_id on public.cad_chats(user_id);
create index if not exists idx_cad_messages_chat_id on public.cad_messages(chat_id);
create index if not exists idx_audit_logs_action on public.audit_logs(action);
create index if not exists idx_cad_chats_updated_at on public.cad_chats(updated_at desc);
create index if not exists idx_cad_chats_last_message_at on public.cad_chats(last_message_at desc);

-- Grant necessary permissions
grant usage on schema public to anon, authenticated;

-- Table permissions
grant all on public.cad_chats to authenticated;
grant all on public.cad_messages to authenticated;
grant all on public.audit_logs to authenticated;

-- Sequence permissions
grant usage, select on all sequences in schema public to authenticated;

-- Function permissions
grant execute on function public.create_cad_chat to authenticated;
grant execute on function public.save_cad_message to authenticated;
grant execute on function public.load_cad_chat to authenticated;
grant execute on function public.get_user_cad_chats to authenticated; 