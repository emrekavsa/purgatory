SELECT p.id, p.title, p.created_at,
  (select count(*) from public.votes v2 join public.poll_options po2 on po2.id = v2.option_id where po2.poll_id = p.id) as vc
FROM public.polls p
ORDER BY 
  case when 'popular' = 'popular' then (
    select count(*) from public.votes v2 join public.poll_options po2 on po2.id = v2.option_id where po2.poll_id = p.id
  ) end desc nulls last;
