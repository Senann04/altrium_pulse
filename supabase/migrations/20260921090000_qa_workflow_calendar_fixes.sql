-- QA workflow corrections: personal calendar, authoritative progress,
-- controlled plan revision, and normalization eligibility.

create table if not exists public.personal_calendar_events (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  title text not null check (length(btrim(title)) between 1 and 200),
  description text,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint personal_calendar_events_time_order check (ends_at > starts_at)
);

alter table public.personal_calendar_events enable row level security;
revoke all on public.personal_calendar_events from public, anon;
grant select, insert, update, delete on public.personal_calendar_events to authenticated;

drop policy if exists personal_calendar_events_own_select on public.personal_calendar_events;
create policy personal_calendar_events_own_select on public.personal_calendar_events
for select to authenticated using (owner_id = (select auth.uid()));
drop policy if exists personal_calendar_events_own_insert on public.personal_calendar_events;
create policy personal_calendar_events_own_insert on public.personal_calendar_events
for insert to authenticated with check (owner_id = (select auth.uid()));
drop policy if exists personal_calendar_events_own_update on public.personal_calendar_events;
create policy personal_calendar_events_own_update on public.personal_calendar_events
for update to authenticated using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));
drop policy if exists personal_calendar_events_own_delete on public.personal_calendar_events;
create policy personal_calendar_events_own_delete on public.personal_calendar_events
for delete to authenticated using (owner_id = (select auth.uid()));

-- Employees may read their progress but cannot author their official rating.
drop policy if exists goals_update_authorized on public.goals;
create policy goals_update_authorized on public.goals
for update to authenticated
using ((select private.can_manage_cycle_record(employee_id, review_id)))
with check ((select private.can_manage_cycle_record(employee_id, review_id)));

-- Peer reviewers may be assigned before the employee submits. Do not let that
-- administrative action block the employee's first self-assessment submission.
create or replace function private.save_self_review(p_review_id uuid, p_summary text, p_submit boolean default false)
returns public.reviews language plpgsql security definer set search_path = '' as $$
declare result public.reviews;
begin
  if (select auth.uid()) is null then raise exception 'Authentication required'; end if;
  update public.reviews set
    employee_summary=p_summary,
    status=case when p_submit then 'peer_feedback'::public.review_status else 'self_review'::public.review_status end,
    employee_submitted_at=case when p_submit then now() else employee_submitted_at end
  where id=p_review_id and employee_id=(select auth.uid()) and employee_submitted_at is null
    and status in ('not_started'::public.review_status,'self_review'::public.review_status,'peer_feedback'::public.review_status,'reopened'::public.review_status)
  returning * into result;
  if result.id is null then raise exception 'Review is unavailable or cannot be edited at this stage'; end if;
  perform private.write_workflow_audit('review',result.id,case when p_submit then 'self_assessment_submitted' else 'self_assessment_saved' end,result.id,result.employee_id);
  return result;
end;
$$;
revoke all on function private.save_self_review(uuid,text,boolean) from public,anon,authenticated;
grant execute on function private.save_self_review(uuid,text,boolean) to postgres;

create or replace function public.reopen_development_plan_for_revision(p_plan_id uuid, p_reason text)
returns public.development_plans
language plpgsql
security definer
set search_path = ''
as $$
declare
  target public.development_plans;
  saved public.development_plans;
begin
  if (select auth.uid()) is null then raise exception 'Authentication required'; end if;
  if nullif(btrim(coalesce(p_reason, '')), '') is null then raise exception 'A reason is required'; end if;
  select * into target from public.development_plans where id = p_plan_id;
  if target.id is null or not (select private.can_manage_cycle_record(target.employee_id, target.review_id)) then
    raise exception 'You are not authorized to reopen this plan';
  end if;
  if (select private.current_user_role()) <> 'hr_partner'::public.user_role then
    raise exception 'Only an assigned HRBP can reopen an agreement';
  end if;
  update public.development_plans set
    status = 'draft'::public.plan_status,
    employee_agreement_status = 'pending', employee_agreed_at = null,
    supervisor_agreement_status = 'pending', supervisor_agreed_at = null,
    updated_at = now()
  where id = p_plan_id returning * into saved;
  perform private.write_workflow_audit('development_plan', saved.id, 'agreement_reopened', saved.review_id, saved.employee_id, jsonb_build_object('reason', btrim(p_reason)));
  return saved;
end;
$$;
revoke all on function public.reopen_development_plan_for_revision(uuid,text) from public, anon;
grant execute on function public.reopen_development_plan_for_revision(uuid,text) to authenticated;

-- Historical normalized reviews remain visible but cannot be resubmitted.
drop function if exists public.get_normalization_queue();
create function public.get_normalization_queue()
returns table (
  review_id uuid, cycle_name text, employee_number text, employee_name text,
  department_name text, supervisor_rating numeric, supervisor_summary text,
  evidence_count integer, decision_status text, normalized_rating numeric,
  rationale text, decided_at timestamptz, review_status text, can_decide boolean
)
language plpgsql stable security definer set search_path = ''
as $$
begin
  if (select auth.uid()) is null or (select private.current_user_role()) <> 'senior_management'::public.user_role then
    raise exception 'You are not authorized to access normalization';
  end if;
  return query
  select review.id, cycle.name, employee.employee_number, employee.full_name,
    department.name, review.supervisor_rating, review.supervisor_summary,
    (select count(*)::integer from public.development_plan_evidence evidence join public.development_plans plan on plan.id=evidence.plan_id where plan.employee_id=review.employee_id and (plan.review_id=review.id or plan.review_id is null)),
    coalesce(decision.status,'pending'), decision.normalized_rating, decision.rationale, decision.decided_at,
    review.status::text, (review.status='hr_review'::public.review_status and review.supervisor_submitted_at is not null)
  from public.reviews review
  join public.review_cycles cycle on cycle.id=review.cycle_id
  join public.profiles employee on employee.id=review.employee_id
  left join public.departments department on department.id=employee.department_id
  left join public.normalization_decisions decision on decision.review_id=review.id
  where review.supervisor_submitted_at is not null
    and (review.status='hr_review'::public.review_status or decision.id is not null)
  order by case when review.status='hr_review'::public.review_status and coalesce(decision.status,'pending')='pending' then 0 else 1 end, cycle.start_date desc, employee.full_name;
end;
$$;
revoke all on function public.get_normalization_queue() from public, anon;
grant execute on function public.get_normalization_queue() to authenticated;
