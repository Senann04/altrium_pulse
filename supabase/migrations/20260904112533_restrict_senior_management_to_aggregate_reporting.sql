-- Senior Management is a reporting role. It can consume organisation-wide
-- aggregate metrics, but it must not browse or edit confidential employee
-- reviews, feedback, goals or development-plan records.

create or replace function private.can_manage_employee(target_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select auth.uid()) is not null
    and exists (
      select 1
      from public.profiles p
      where p.id = target_user_id
        and p.is_active = true
        and (
          (
            (select private.current_user_role()) = 'supervisor'::public.user_role
            and p.manager_id = (select auth.uid())
          )
          or
          (
            (select private.current_user_role()) = 'hr_partner'::public.user_role
            and p.hr_partner_id = (select auth.uid())
          )
        )
    )
$$;

create or replace function private.can_manage_review(target_review_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select auth.uid()) is not null
    and exists (
      select 1
      from public.reviews r
      where r.id = target_review_id
        and (
          r.supervisor_id = (select auth.uid())
          or r.hr_partner_id = (select auth.uid())
        )
    )
$$;

create or replace function private.can_view_review(target_review_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select auth.uid()) is not null
    and exists (
      select 1
      from public.reviews r
      where r.id = target_review_id
        and (
          r.employee_id = (select auth.uid())
          or r.supervisor_id = (select auth.uid())
          or r.hr_partner_id = (select auth.uid())
        )
    )
$$;

drop policy if exists reviews_insert_management on public.reviews;

create policy reviews_insert_management
on public.reviews
for insert
to authenticated
with check (
  created_by = (select auth.uid())
  and (
    (select private.current_user_role()) = 'hr_partner'::public.user_role
    or (
      (select private.current_user_role()) = 'supervisor'::public.user_role
      and supervisor_id = (select auth.uid())
    )
  )
);

create or replace function public.save_supervisor_review(
  p_review_id uuid,
  p_summary text,
  p_rating numeric,
  p_submit boolean default false
)
returns public.reviews
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_review public.reviews;
  result public.reviews;
begin
  if (select auth.uid()) is null then
    raise exception 'Authentication required';
  end if;

  select *
    into current_review
  from public.reviews
  where id = p_review_id;

  if current_review.id is null
    or current_review.supervisor_id is distinct from (select auth.uid())
  then
    raise exception 'You are not authorized to assess this review';
  end if;

  if current_review.status not in (
    'supervisor_review'::public.review_status,
    'reopened'::public.review_status
  ) then
    raise exception 'Review is not at the supervisor assessment stage';
  end if;

  update public.reviews
  set
    supervisor_summary = p_summary,
    supervisor_rating = p_rating,
    status = case
      when p_submit then 'hr_review'::public.review_status
      else 'supervisor_review'::public.review_status
    end,
    supervisor_submitted_at = case
      when p_submit then now()
      else supervisor_submitted_at
    end
  where id = p_review_id
  returning * into result;

  return result;
end;
$$;

create or replace function public.complete_hr_review(
  p_review_id uuid,
  p_comments text,
  p_overall_rating numeric default null
)
returns public.reviews
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_review public.reviews;
  result public.reviews;
begin
  if (select auth.uid()) is null then
    raise exception 'Authentication required';
  end if;

  select *
    into current_review
  from public.reviews
  where id = p_review_id;

  if current_review.id is null
    or current_review.hr_partner_id is distinct from (select auth.uid())
  then
    raise exception 'You are not authorized to complete this review';
  end if;

  if current_review.status not in (
    'hr_review'::public.review_status,
    'reopened'::public.review_status
  ) then
    raise exception 'Review is not at the HR completion stage';
  end if;

  update public.reviews
  set
    hr_comments = p_comments,
    overall_rating = coalesce(p_overall_rating, supervisor_rating),
    status = 'completed'::public.review_status,
    completed_at = now()
  where id = p_review_id
  returning * into result;

  return result;
end;
$$;

create or replace function public.get_senior_management_metrics()
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  with authorized as (
    select 1
    where (select auth.uid()) is not null
      and (select private.current_user_role()) = 'senior_management'::public.user_role
  ),
  active_cycle as (
    select c.id, c.name, c.end_date
    from public.review_cycles c
    cross join authorized
    where c.status = 'active'::public.review_cycle_status
    order by c.start_date desc
    limit 1
  ),
  cycle_reviews as (
    select r.status
    from public.reviews r
    where r.cycle_id = (select id from active_cycle)
  ),
  review_totals as (
    select
      count(*)::integer as total,
      count(*) filter (where status = 'completed'::public.review_status)::integer as completed,
      count(*) filter (
        where status not in (
          'not_started'::public.review_status,
          'completed'::public.review_status
        )
      )::integer as in_progress,
      count(*) filter (where status = 'not_started'::public.review_status)::integer as not_started
    from cycle_reviews
  ),
  goal_totals as (
    select
      count(*)::integer as total,
      count(*) filter (where g.status = 'completed'::public.goal_status)::integer as completed,
      count(*) filter (
        where g.status <> 'completed'::public.goal_status
          and g.target_date < current_date
      )::integer as overdue,
      coalesce(round(avg(g.progress)), 0)::integer as progress
    from public.goals g
    join public.profiles p on p.id = g.employee_id
    where p.role = 'employee'::public.user_role
      and p.is_active = true
  ),
  plan_totals as (
    select
      coalesce(round(avg(p.progress) filter (where p.type = 'pdp'::public.plan_type)), 0)::integer as pdp_progress,
      coalesce(round(avg(p.progress) filter (where p.type = 'pip'::public.plan_type)), 0)::integer as pip_progress
    from public.development_plans p
    join public.profiles employee on employee.id = p.employee_id
    where employee.role = 'employee'::public.user_role
      and employee.is_active = true
  ),
  feedback_totals as (
    select
      count(fr.id)::integer as assigned,
      count(fr.id) filter (where fr.status = 'submitted'::public.feedback_request_status)::integer as submitted
    from public.feedback_requests fr
    join public.reviews r on r.id = fr.review_id
    where r.cycle_id = (select id from active_cycle)
  ),
  completed_ratings as (
    select r.overall_rating
    from public.reviews r
    where r.status = 'completed'::public.review_status
      and r.overall_rating is not null
  ),
  rating_totals as (
    select
      round(avg(overall_rating), 1) as average_rating,
      count(*) filter (where overall_rating >= 4.5)::integer as exceptional,
      count(*) filter (where overall_rating >= 4 and overall_rating < 4.5)::integer as strong,
      count(*) filter (where overall_rating >= 3 and overall_rating < 4)::integer as effective,
      count(*) filter (where overall_rating < 3)::integer as developing
    from completed_ratings
  ),
  employee_totals as (
    select count(*)::integer as total
    from public.profiles p
    where p.role = 'employee'::public.user_role
      and p.is_active = true
  )
  select jsonb_build_object(
    'activeCycleName', (select name from active_cycle),
    'activeCycleEnd', (select end_date from active_cycle),
    'employeeCount', employees.total,
    'reviewTotal', reviews.total,
    'reviewCompleted', reviews.completed,
    'reviewInProgress', reviews.in_progress,
    'reviewNotStarted', reviews.not_started,
    'reviewCompletion', coalesce(round(100.0 * reviews.completed / nullif(reviews.total, 0)), 0)::integer,
    'goalTotal', goals.total,
    'goalCompleted', goals.completed,
    'goalOverdue', goals.overdue,
    'goalProgress', goals.progress,
    'pdpProgress', plans.pdp_progress,
    'pipProgress', plans.pip_progress,
    'feedbackAssigned', feedback.assigned,
    'feedbackSubmitted', feedback.submitted,
    'feedbackParticipation', coalesce(round(100.0 * feedback.submitted / nullif(feedback.assigned, 0)), 0)::integer,
    'averageRating', ratings.average_rating,
    'reviewStatuses', jsonb_build_array(
      jsonb_build_object('label', 'Completed', 'count', reviews.completed),
      jsonb_build_object('label', 'In progress', 'count', reviews.in_progress),
      jsonb_build_object('label', 'Not started', 'count', reviews.not_started)
    ),
    'ratingDistribution', jsonb_build_array(
      jsonb_build_object('label', '4.5–5.0', 'count', ratings.exceptional),
      jsonb_build_object('label', '4.0–4.49', 'count', ratings.strong),
      jsonb_build_object('label', '3.0–3.99', 'count', ratings.effective),
      jsonb_build_object('label', 'Below 3.0', 'count', ratings.developing)
    )
  )
  from authorized
  cross join review_totals reviews
  cross join goal_totals goals
  cross join plan_totals plans
  cross join feedback_totals feedback
  cross join rating_totals ratings
  cross join employee_totals employees
$$;

revoke all on function public.get_senior_management_metrics() from public, anon;
grant execute on function public.get_senior_management_metrics() to authenticated;
