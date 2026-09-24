-- The numbers a lead shows a client and a specialist reads about themselves.
--
-- Every function is security invoker: the aggregates are computed over the
-- rows the caller can already see. A specialist asking for a brand's trend
-- gets a trend of their own reviews, never anyone else's scores, and a lead
-- asking about a brand they do not lead gets nothing.
--
-- Only sampled reviews count. Hand-picked reviews are chosen for looking bad,
-- so including them would make every trend worse than the work.

-- Where "the last N weeks" starts: the Monday N-1 calendar weeks ago, so the
-- current week counts as one of them. Every function below uses this one
-- definition, so numbers that sit side by side cover the same days.
create function private.weeks_back(p_weeks int) returns timestamptz
language sql stable set search_path = '' as $fn$
  select date_trunc('week', now()) - make_interval(weeks => p_weeks - 1)
$fn$;

-- Weekly average of sampled scores, for a brand or one specialist on it.
create function public.weekly_scores(p_brand_id uuid, p_specialist_id uuid default null, p_weeks int default 12)
returns table (week date, reviews bigint, avg_score numeric, met_standard numeric)
language sql stable set search_path = '' as $$
  select date_trunc('week', rp.sent_at)::date,
         count(*),
         round(avg(rv.score), 2),
         round(avg((rv.score >= 4)::int), 3)
    from public.reviews rv
    join public.replies rp on rp.id = rv.reply_id
   where rv.brand_id = p_brand_id
     and rv.selection = 'sample'
     and (p_specialist_id is null or rp.specialist_id = p_specialist_id)
     and rp.sent_at >= private.weeks_back(p_weeks)
   group by 1
   order by 1
$$;

-- How often each of the brand's criteria was missed, as a share of sampled
-- reviews: the last p_weeks against the p_weeks before them.
create function public.criterion_miss_rates(p_brand_id uuid, p_specialist_id uuid default null, p_weeks int default 4)
returns table (
  criterion_id uuid, label text, category text, severity text,
  recent_misses bigint, recent_rate numeric, previous_rate numeric
)
language sql stable set search_path = '' as $$
  with sampled as (
    select rv.id, rp.sent_at >= private.weeks_back(p_weeks) as recent
      from public.reviews rv
      join public.replies rp on rp.id = rv.reply_id
     where rv.brand_id = p_brand_id
       and rv.selection = 'sample'
       and (p_specialist_id is null or rp.specialist_id = p_specialist_id)
       and rp.sent_at >= private.weeks_back(2 * p_weeks)
  ),
  totals as (
    select count(*) filter (where recent) as recent_n,
           count(*) filter (where not recent) as previous_n
      from sampled
  )
  select c.id, c.label, c.category, c.severity,
         count(s.id) filter (where s.recent),
         round(count(s.id) filter (where s.recent)::numeric / nullif(t.recent_n, 0), 3),
         round(count(s.id) filter (where not s.recent)::numeric / nullif(t.previous_n, 0), 3)
    from public.criteria c
    cross join totals t
    left join public.review_flags f on f.criterion_id = c.id
    left join sampled s on s.id = f.review_id
   where c.brand_id = p_brand_id
     and c.retired_at is null
   group by c.id, c.label, c.category, c.severity, c.position, t.recent_n, t.previous_n
   order by 6 desc nulls last, c.position
$$;

-- Each specialist's sampled average on a brand: the last p_weeks and the p_weeks before.
create function public.specialist_scores(p_brand_id uuid, p_weeks int default 4)
returns table (specialist_id uuid, full_name text, recent_reviews bigint, recent_avg numeric, previous_avg numeric)
language sql stable set search_path = '' as $$
  select p.id, p.full_name,
         count(*) filter (where rp.sent_at >= private.weeks_back(p_weeks)),
         round(avg(rv.score) filter (where rp.sent_at >= private.weeks_back(p_weeks)), 2),
         round(avg(rv.score) filter (where rp.sent_at < private.weeks_back(p_weeks)), 2)
    from public.reviews rv
    join public.replies rp on rp.id = rv.reply_id
    join public.people p on p.id = rp.specialist_id
   where rv.brand_id = p_brand_id
     and rv.selection = 'sample'
     and rp.sent_at >= private.weeks_back(2 * p_weeks)
   group by p.id, p.full_name
   order by 4 nulls last, 2
$$;

-- How much of the sample actually got reviewed. A trend over 20% of the
-- sample is a trend over whatever the lead felt like opening.
create function public.sample_coverage(p_brand_id uuid, p_weeks int default 4)
returns table (sampled_replies bigint, reviewed bigint)
language sql stable set search_path = '' as $$
  select count(*),
         count(*) filter (where exists (
           select 1 from public.reviews rv where rv.reply_id = r.id and rv.selection = 'sample'
         ))
    from public.replies r
   where r.brand_id = p_brand_id
     and public.in_sample(r)
     and r.sent_at >= private.weeks_back(p_weeks)
     and r.sent_at < date_trunc('day', now())
$$;

revoke execute on function
  public.weekly_scores(uuid, uuid, int),
  public.criterion_miss_rates(uuid, uuid, int),
  public.specialist_scores(uuid, int),
  public.sample_coverage(uuid, int)
  from public, anon;

revoke execute on function private.weeks_back(int) from public;
grant execute on function private.weeks_back(int) to authenticated;

grant execute on function
  public.weekly_scores(uuid, uuid, int),
  public.criterion_miss_rates(uuid, uuid, int),
  public.specialist_scores(uuid, int),
  public.sample_coverage(uuid, int)
  to authenticated;
