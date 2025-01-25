-- Function to get formatted chat history for the sidebar
create or replace function public.get_cad_chat_history_v2(
    p_limit int default 20
) returns table (
    id uuid,
    title text,
    created_at timestamptz,
    updated_at timestamptz,
    last_message_at timestamptz,
    last_message text,
    parameters jsonb
) as $$
begin
    -- Log history request
    perform private.log_cad_action('get_cad_chat_history_start', jsonb_build_object(
        'user_id', auth.uid(),
        'limit', p_limit,
        'timestamp', now()
    ));

    return query
    with last_messages as (
        select distinct on (chat_id)
            chat_id,
            content as last_message,
            parameters,
            m.created_at as message_created_at
        from public.cad_messages m
        where role = 'assistant' -- Only get assistant messages as preview
        order by chat_id, m.created_at desc
    )
    select 
        c.id,
        c.title,
        c.created_at,
        c.updated_at,
        c.last_message_at,
        coalesce(lm.last_message, 'No messages yet') as last_message,
        lm.parameters
    from public.cad_chats c
    left join last_messages lm on c.id = lm.chat_id
    where c.user_id = auth.uid()
    order by c.last_message_at desc
    limit p_limit;

    -- Log successful retrieval
    perform private.log_cad_action('get_cad_chat_history_success', jsonb_build_object(
        'user_id', auth.uid(),
        'timestamp', now()
    ));
end;
$$ language plpgsql security definer;

-- Grant execute permission
grant execute on function public.get_cad_chat_history_v2 to authenticated; 