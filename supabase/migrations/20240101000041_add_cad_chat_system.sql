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
        insert into public.cad_messages (chat_id, user_id, role, content)
        values (v_chat_id, auth.uid(), 'user', p_initial_message);
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
    p_parameters jsonb default '{}'::jsonb
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
    insert into public.cad_messages (chat_id, user_id, role, content, parameters)
    values (p_chat_id, auth.uid(), p_role, p_content, p_parameters)
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
    parameters jsonb,
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
    select m.id, m.role, m.content, m.parameters, m.created_at
    from public.cad_messages m
    where m.chat_id = p_chat_id
    order by m.created_at asc;
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
        exists (
            select 1 from public.cad_chats
            where id = chat_id and user_id = auth.uid()
        )
    );

create policy "Users can insert messages in their chats"
    on public.cad_messages for insert
    to authenticated
    with check (
        exists (
            select 1 from public.cad_chats
            where id = chat_id and user_id = auth.uid()
        )
    );

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

-- Function to rename a chat
create or replace function public.rename_cad_chat(p_chat_id uuid, p_title text)
returns void
language plpgsql
security definer
as $$
begin
    -- Log the action
    perform public.log_action('rename_cad_chat', format('Renaming chat %s to %s', p_chat_id, p_title));
    
    update public.cad_chats
    set title = p_title,
        updated_at = now()
    where id = p_chat_id
    and user_id = auth.uid();
end;
$$;

-- Function to toggle favorite status
create or replace function public.toggle_cad_chat_favorite(p_chat_id uuid, p_is_favorite boolean)
returns void
language plpgsql
security definer
as $$
begin
    -- Log the action
    perform public.log_action('toggle_cad_chat_favorite', format('Toggling favorite status for chat %s to %s', p_chat_id, p_is_favorite));
    
    update public.cad_chats
    set metadata = jsonb_set(
        coalesce(metadata, '{}'::jsonb),
        '{is_favorite}',
        to_jsonb(p_is_favorite)
    ),
    updated_at = now()
    where id = p_chat_id
    and user_id = auth.uid();
end;
$$;

-- Function to toggle archive status
create or replace function public.toggle_cad_chat_archive(p_chat_id uuid, p_is_archived boolean)
returns void
language plpgsql
security definer
as $$
begin
    -- Log the action
    perform public.log_action('toggle_cad_chat_archive', format('Toggling archive status for chat %s to %s', p_chat_id, p_is_archived));
    
    update public.cad_chats
    set is_archived = p_is_archived,
        updated_at = now()
    where id = p_chat_id
    and user_id = auth.uid();
end;
$$;

-- Grant execute permissions to authenticated users
grant execute on function public.rename_cad_chat to authenticated;
grant execute on function public.toggle_cad_chat_favorite to authenticated;
grant execute on function public.toggle_cad_chat_archive to authenticated;

-- Update the get_cad_chat_history_v2 function to include favorite and archive status
create or replace function public.get_cad_chat_history_v2(p_limit int default 20)
returns table (
    id uuid,
    title text,
    created_at timestamptz,
    updated_at timestamptz,
    last_message_at timestamptz,
    last_message text,
    metadata jsonb,
    is_archived boolean,
    is_favorite boolean
)
language plpgsql
security definer
as $$
begin
    -- Log the history request
    perform public.log_action('get_cad_chat_history', format('Fetching chat history with limit %s', p_limit));
    
    return query
    select 
        c.id,
        c.title,
        c.created_at,
        c.updated_at,
        c.last_message_at,
        m.content as last_message,
        c.metadata,
        c.is_archived,
        (c.metadata->>'is_favorite')::boolean as is_favorite
    from public.cad_chats c
    left join lateral (
        select content
        from public.cad_messages
        where chat_id = c.id
        and role = 'assistant'
        order by created_at desc
        limit 1
    ) m on true
    where c.user_id = auth.uid()
    order by c.last_message_at desc
    limit p_limit;
end;
$$; 