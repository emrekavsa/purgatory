DROP FUNCTION IF EXISTS public.get_poll_cards(text, text, text, uuid, integer, integer);
DROP FUNCTION IF EXISTS public.get_poll_cards(text, text, text, uuid, integer, integer, text);

CREATE OR REPLACE FUNCTION public.get_poll_cards(
  p_category text DEFAULT NULL::text,
  p_search text DEFAULT NULL::text,
  p_profile_username text DEFAULT NULL::text,
  p_poll_id uuid DEFAULT NULL::uuid,
  p_limit integer DEFAULT 10,
  p_offset integer DEFAULT 0,
  p_sort text DEFAULT 'newest'::text
) RETURNS jsonb
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  with base as (
    select p.id, p.title, p.category, p.created_at, p.user_id,
           row_number() over (
             order by
               case when p_sort = 'popular' then (
                 select count(*) from public.votes v2
                 join public.poll_options po2 on po2.id = v2.option_id
                 where po2.poll_id = p.id
               ) end desc nulls last,
               case when p_sort = 'interacted' then (
                 select count(*) from public.comments c2 where c2.poll_id = p.id
               ) end desc nulls last,
               p.created_at desc
           ) as rn
    from public.polls p
    left join public.profiles author on author.id = p.user_id
    where (p_poll_id is null or p.id = p_poll_id)
      and (p_category is null or p.category = p_category)
      and (p_search is null or p.title ilike ('%' || p_search || '%'))
      and (p_profile_username is null or author.username = p_profile_username)
    order by rn asc
    limit greatest(1, least(coalesce(p_limit, 10), 50))
    offset greatest(0, coalesce(p_offset, 0))
  )
  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id', b.id,
        'title', b.title,
        'category', b.category,
        'created_at', b.created_at,
        'user_id', b.user_id,
        'comment_count', (
          select count(*)
          from public.comments c
          where c.poll_id = b.id
        ),
        'profiles', (
          select jsonb_build_object(
            'id', pr.id,
            'username', pr.username,
            'avatar_url', pr.avatar_url
          )
          from public.profiles pr
          where pr.id = b.user_id
        ),
        'poll_options', (
          select coalesce(
            jsonb_agg(
              jsonb_build_object(
                'id', po.id,
                'content', po.content,
                'image_url', po.image_url,
                'option_type', po.option_type,
                'vote_count', (
                  select count(*)
                  from public.votes v_count
                  where v_count.option_id = po.id
                ),
                'votes', case
                  when (select auth.uid()) is null then '[]'::jsonb
                  else (
                    select coalesce(
                      jsonb_agg(jsonb_build_object('user_id', v_user.user_id)),
                      '[]'::jsonb
                    )
                    from public.votes v_user
                    where v_user.option_id = po.id
                      and v_user.user_id = (select auth.uid())
                  )
                end
              )
              order by po.id
            ),
            '[]'::jsonb
          )
          from public.poll_options po
          where po.poll_id = b.id
        )
      )
      order by b.rn asc
    ),
    '[]'::jsonb
  )
  from base b;
$$;
