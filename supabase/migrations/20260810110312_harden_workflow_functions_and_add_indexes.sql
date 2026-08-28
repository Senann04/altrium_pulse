create index development_plans_created_by_idx
  on public.development_plans(created_by);

create index development_plans_owner_id_idx
  on public.development_plans(owner_id);

create index feedback_requests_assigned_by_idx
  on public.feedback_requests(assigned_by);

create index goals_created_by_idx
  on public.goals(created_by);

create index review_cycles_created_by_idx
  on public.review_cycles(created_by);

create index reviews_created_by_idx
  on public.reviews(created_by);

revoke all on function public.rls_auto_enable() from public, anon, authenticated;

alter function public.save_self_review(uuid, text, boolean)
  set schema private;

alter function public.save_supervisor_review(uuid, text, numeric, boolean)
  set schema private;

alter function public.complete_hr_review(uuid, text, numeric)
  set schema private;

revoke all on function private.save_self_review(uuid, text, boolean)
  from public, anon;
revoke all on function private.save_supervisor_review(uuid, text, numeric, boolean)
  from public, anon;
revoke all on function private.complete_hr_review(uuid, text, numeric)
  from public, anon;

grant execute on function private.save_self_review(uuid, text, boolean)
  to authenticated;
grant execute on function private.save_supervisor_review(uuid, text, numeric, boolean)
  to authenticated;
grant execute on function private.complete_hr_review(uuid, text, numeric)
  to authenticated;

create or replace function public.save_self_review(
  p_review_id uuid,
  p_summary text,
  p_submit boolean default false
)
returns public.reviews
language sql
security invoker
set search_path = ''
as $$
  select private.save_self_review(p_review_id, p_summary, p_submit)
$$;

create or replace function public.save_supervisor_review(
  p_review_id uuid,
  p_summary text,
  p_rating numeric,
  p_submit boolean default false
)
returns public.reviews
language sql
security invoker
set search_path = ''
as $$
  select private.save_supervisor_review(
    p_review_id,
    p_summary,
    p_rating,
    p_submit
  )
$$;

create or replace function public.complete_hr_review(
  p_review_id uuid,
  p_comments text,
  p_overall_rating numeric default null
)
returns public.reviews
language sql
security invoker
set search_path = ''
as $$
  select private.complete_hr_review(
    p_review_id,
    p_comments,
    p_overall_rating
  )
$$;

revoke all on function public.save_self_review(uuid, text, boolean)
  from public, anon;
revoke all on function public.save_supervisor_review(uuid, text, numeric, boolean)
  from public, anon;
revoke all on function public.complete_hr_review(uuid, text, numeric)
  from public, anon;

grant execute on function public.save_self_review(uuid, text, boolean)
  to authenticated;
grant execute on function public.save_supervisor_review(uuid, text, numeric, boolean)
  to authenticated;
grant execute on function public.complete_hr_review(uuid, text, numeric)
  to authenticated;
