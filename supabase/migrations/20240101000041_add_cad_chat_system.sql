-- Create private schema if it doesn't exist
create schema if not exists private;

-- Create logging function
create or replace function private.log_cad_action(
    p_action text,
    p_details jsonb
) returns void
security definer
set search_path = public, pg_temp
as $$
begin
    insert into audit_logs (action, details)
    values (p_action, p_details);
end;
$$ language plpgsql;

-- Create audit logs table if it doesn't exist
create table if not exists public.audit_logs (
    id uuid primary key default gen_random_uuid(),
    action text not null,
    details jsonb not null,
    created_at timestamptz default now()
);

-- Enable RLS on tables
alter table public.cad_chats enable row level security;
alter table public.cad_messages enable row level security;
alter table public.audit_logs enable row level security;

-- Add RLS policies for cad_chats
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
    using (user_id = auth.uid())
    with check (user_id = auth.uid());

create policy "Users can delete their own chats"
    on public.cad_chats for delete
    to authenticated
    using (user_id = auth.uid());

-- Add RLS policies for cad_messages
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

create policy "Users can update messages in their chats"
    on public.cad_messages for update
    to authenticated
    using (
        chat_id in (
            select id from public.cad_chats
            where user_id = auth.uid()
        )
    )
    with check (
        chat_id in (
            select id from public.cad_chats
            where user_id = auth.uid()
        )
    );

create policy "Users can delete messages in their chats"
    on public.cad_messages for delete
    to authenticated
    using (
        chat_id in (
            select id from public.cad_chats
            where user_id = auth.uid()
        )
    );

-- Add RLS policies for audit_logs
create policy "Only authenticated users can view audit logs"
    on public.audit_logs for select
    to authenticated
    using (true);

create policy "Only system can insert audit logs"
    on public.audit_logs for insert
    to authenticated
    with check (false);

-- Create RPC function to create a new chat
create or replace function public.create_cad_chat(
    p_title text,
    p_initial_message text default null
) returns uuid as $$
declare
    v_chat_id uuid;
begin
    perform private.log_cad_action('create_cad_chat_start', jsonb_build_object(
        'user_id', auth.uid(),
        'title', p_title,
        'timestamp', now()
    ));

    insert into public.cad_chats (user_id, title)
    values (auth.uid(), p_title)
    returning id into v_chat_id;

    if p_initial_message is not null then
        insert into public.cad_messages (chat_id, user_id, role, content)
        values (v_chat_id, auth.uid(), 'user', p_initial_message);
    end if;

    perform private.log_cad_action('create_cad_chat_success', jsonb_build_object(
        'chat_id', v_chat_id,
        'user_id', auth.uid(),
        'timestamp', now()
    ));

    return v_chat_id;
end;
$$ language plpgsql security definer set search_path = public, pg_temp;

-- Create RPC function to save a message
create or replace function public.save_cad_message(
    p_chat_id uuid,
    p_role text,
    p_content text,
    p_parameters jsonb default '{}'::jsonb
) returns uuid as $$
declare
    v_message_id uuid;
begin
    if p_role not in ('user', 'assistant') then
        raise exception 'Invalid role. Must be either user or assistant';
    end if;

    perform private.log_cad_action('save_cad_message_start', jsonb_build_object(
        'chat_id', p_chat_id,
        'role', p_role,
        'user_id', auth.uid(),
        'timestamp', now()
    ));

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

    insert into public.cad_messages (chat_id, user_id, role, content, parameters)
    values (p_chat_id, auth.uid(), p_role, p_content, p_parameters)
    returning id into v_message_id;

    update public.cad_chats
    set 
        updated_at = now(),
        last_message_at = now()
    where id = p_chat_id;

    perform private.log_cad_action('save_cad_message_success', jsonb_build_object(
        'message_id', v_message_id,
        'chat_id', p_chat_id,
        'user_id', auth.uid(),
        'timestamp', now()
    ));

    return v_message_id;
end;
$$ language plpgsql security definer set search_path = public, pg_temp;

-- Create RPC function to load chat messages
create or replace function public.load_cad_chat(
    p_chat_id uuid
) returns table (
    id uuid,
    role text,
    content text,
    parameters jsonb,
    created_at timestamptz
) as $$
begin
    perform private.log_cad_action('load_cad_chat_start', jsonb_build_object(
        'chat_id', p_chat_id,
        'user_id', auth.uid(),
        'timestamp', now()
    ));

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

    perform private.log_cad_action('load_cad_chat_success', jsonb_build_object(
        'chat_id', p_chat_id,
        'user_id', auth.uid(),
        'timestamp', now()
    ));

    return query
    select m.id, m.role, m.content, m.parameters, m.created_at
    from public.cad_messages m
    where m.chat_id = p_chat_id
    order by m.created_at asc;
end;
$$ language plpgsql security definer set search_path = public, pg_temp;

-- Function to rename a chat
create or replace function public.rename_cad_chat(
    p_chat_id uuid,
    p_title text
) returns void as $$
begin
    perform private.log_cad_action('rename_cad_chat', jsonb_build_object(
        'chat_id', p_chat_id,
        'new_title', p_title,
        'user_id', auth.uid(),
        'timestamp', now()
    ));
    
    update public.cad_chats
    set 
        title = p_title,
        updated_at = now()
    where id = p_chat_id
    and user_id = auth.uid();
end;
$$ language plpgsql security definer set search_path = public, pg_temp;

-- Function to toggle favorite status
create or replace function public.toggle_cad_chat_favorite(
    p_chat_id uuid,
    p_is_favorite boolean
) returns void as $$
begin
    perform private.log_cad_action('toggle_cad_chat_favorite', jsonb_build_object(
        'chat_id', p_chat_id,
        'is_favorite', p_is_favorite,
        'user_id', auth.uid(),
        'timestamp', now()
    ));
    
    update public.cad_chats
    set 
        metadata = jsonb_set(
            coalesce(metadata, '{}'::jsonb),
            '{is_favorite}',
            to_jsonb(p_is_favorite)
        ),
        updated_at = now()
    where id = p_chat_id
    and user_id = auth.uid();
end;
$$ language plpgsql security definer set search_path = public, pg_temp;

-- Function to toggle archive status
create or replace function public.toggle_cad_chat_archive(
    p_chat_id uuid,
    p_is_archived boolean
) returns void as $$
begin
    perform private.log_cad_action('toggle_cad_chat_archive', jsonb_build_object(
        'chat_id', p_chat_id,
        'is_archived', p_is_archived,
        'user_id', auth.uid(),
        'timestamp', now()
    ));
    
    update public.cad_chats
    set 
        is_archived = p_is_archived,
        updated_at = now()
    where id = p_chat_id
    and user_id = auth.uid();
end;
$$ language plpgsql security definer set search_path = public, pg_temp;

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
grant execute on function public.rename_cad_chat to authenticated;
grant execute on function public.toggle_cad_chat_favorite to authenticated;
grant execute on function public.toggle_cad_chat_archive to authenticated; 

-- Function to get archived chats
create or replace function public.get_archived_chats()
returns table (
    id uuid,
    title text,
    created_at timestamptz,
    updated_at timestamptz,
    last_message_at timestamptz,
    last_message text
)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
    perform private.log_cad_action('get_archived_chats', jsonb_build_object(
        'user_id', auth.uid(),
        'timestamp', now()
    ));
    
    return query
    with last_messages as (
        select distinct on (chat_id)
            chat_id,
            content as last_message,
            m.created_at as message_created_at
        from public.cad_messages m
        order by chat_id, m.created_at desc
    )
    select 
        c.id,
        c.title,
        c.created_at,
        c.updated_at,
        c.last_message_at,
        coalesce(lm.last_message, 'No messages yet') as last_message
    from public.cad_chats c
    left join last_messages lm on c.id = lm.chat_id
    where c.user_id = auth.uid()
    and c.is_archived = true
    order by c.last_message_at desc;
end;
$$;

-- Grant execute permission for the new function
grant execute on function public.get_archived_chats to authenticated; 