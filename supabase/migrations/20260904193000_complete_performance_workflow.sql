-- Complete the project-plan workflow while preserving the existing data model.
-- Company review-cycle definitions are shared. Explicitly authorised HRBPs may
-- administer those definitions, while employee records remain constrained to
-- the union of each HRBP's assigned departments and projects.

create table if not exists public.review_cycle_administrators (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  assigned_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.review_cycle_administrators enable row level security;
grant select on public.review_cycle_administrators to authenticated;
revoke insert, update, delete on public.review_cycle_administrators from anon, authenticated;

drop policy if exists review_cycle_administrators_select_own
  on public.review_cycle_administrators;
create policy review_cycle_administrators_select_own
on public.review_cycle_administrators
for select
to authenticated
using (user_id = (select auth.uid()));

insert into public.review_cycle_administrators (user_id, assigned_by)
select id, id
from public.profiles
where role = 'hr_partner'::public.user_role
  and is_active = true
on conflict (user_id) do nothing;

create or replace function private.can_administer_review_cycles()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select auth.uid()) is not null
    and (select private.current_user_role()) = 'hr_partner'::public.user_role
    and exists (
      select 1
      from public.review_cycle_administrators administrator
      where administrator.user_id = (select auth.uid())
    )
$$;

revoke all on function private.can_administer_review_cycles() from public, anon;
grant execute on function private.can_administer_review_cycles() to authenticated;

-- Projects are optional in the current dataset, but the access model is ready
-- for employees and HRBPs who are assigned to them in future.
create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  description text,
  department_id uuid references public.departments(id) on delete set null,
  status text not null default 'active'
    check (status in ('planned', 'active', 'completed', 'cancelled')),
  start_date date,
  end_date date,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (end_date is null or start_date is null or end_date >= start_date)
);

create table if not exists public.project_members (
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  responsibility text,
  assigned_by uuid references public.profiles(id) on delete set null,
  assigned_at timestamptz not null default now(),
  primary key (project_id, user_id)
);

create table if not exists public.hr_partner_projects (
  hr_partner_id uuid not null references public.profiles(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  assigned_by uuid references public.profiles(id) on delete set null,
  assigned_at timestamptz not null default now(),
  primary key (hr_partner_id, project_id)
);

create index if not exists projects_department_id_idx on public.projects(department_id);
create index if not exists project_members_user_id_idx on public.project_members(user_id);
create index if not exists hr_partner_projects_project_id_idx on public.hr_partner_projects(project_id);

alter table public.projects enable row level security;
alter table public.project_members enable row level security;
alter table public.hr_partner_projects enable row level security;

drop trigger if exists projects_set_updated_at on public.projects;
create trigger projects_set_updated_at
before update on public.projects
for each row execute function private.set_updated_at();

grant select on public.projects, public.project_members, public.hr_partner_projects to authenticated;
revoke insert, update, delete on public.projects, public.project_members, public.hr_partner_projects
  from anon, authenticated;

create or replace function private.hr_partner_manages_project(target_project_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select auth.uid()) is not null
    and (select private.current_user_role()) = 'hr_partner'::public.user_role
    and exists (
      select 1
      from public.hr_partner_projects assignment
      where assignment.hr_partner_id = (select auth.uid())
        and assignment.project_id = target_project_id
    )
$$;

revoke all on function private.hr_partner_manages_project(uuid) from public, anon;
grant execute on function private.hr_partner_manages_project(uuid) to authenticated;

create or replace function private.user_has_project(target_project_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select auth.uid()) is not null
    and exists (
      select 1
      from public.project_members membership
      where membership.project_id = target_project_id
        and membership.user_id = (select auth.uid())
    )
$$;

revoke all on function private.user_has_project(uuid) from public, anon;
grant execute on function private.user_has_project(uuid) to authenticated;

create or replace function private.can_view_project(target_project_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select auth.uid()) is not null
    and (
      (select private.user_has_project(target_project_id))
      or (select private.hr_partner_manages_project(target_project_id))
      or exists (
        select 1
        from public.project_members membership
        join public.profiles employee on employee.id = membership.user_id
        where membership.project_id = target_project_id
          and employee.manager_id = (select auth.uid())
      )
    )
$$;

revoke all on function private.can_view_project(uuid) from public, anon;
grant execute on function private.can_view_project(uuid) to authenticated;

drop policy if exists projects_select_authorized on public.projects;
create policy projects_select_authorized
on public.projects
for select
to authenticated
using ((select private.can_view_project(id)));

drop policy if exists project_members_select_authorized on public.project_members;
create policy project_members_select_authorized
on public.project_members
for select
to authenticated
using ((select private.can_view_project(project_id)));

drop policy if exists hr_partner_projects_select_own on public.hr_partner_projects;
create policy hr_partner_projects_select_own
on public.hr_partner_projects
for select
to authenticated
using (hr_partner_id = (select auth.uid()));

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
      from public.profiles employee
      where employee.id = target_user_id
        and employee.is_active = true
        and employee.role in (
          'employee'::public.user_role,
          'supervisor'::public.user_role
        )
        and (
          (
            (select private.current_user_role()) = 'supervisor'::public.user_role
            and employee.manager_id = (select auth.uid())
          )
          or (select private.hr_partner_manages_department(employee.department_id))
          or (
            (select private.current_user_role()) = 'hr_partner'::public.user_role
            and exists (
              select 1
              from public.project_members membership
              join public.hr_partner_projects assignment
                on assignment.project_id = membership.project_id
              where membership.user_id = employee.id
                and assignment.hr_partner_id = (select auth.uid())
            )
          )
        )
    )
$$;

create or replace function private.can_assign_peer_reviewer(
  target_review_id uuid,
  target_reviewer_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select auth.uid()) is not null
    and exists (
      select 1
      from public.reviews review
      join public.profiles employee on employee.id = review.employee_id
      join public.profiles reviewer on reviewer.id = target_reviewer_id
      where review.id = target_review_id
        and review.status in (
          'not_started'::public.review_status,
          'self_review'::public.review_status,
          'peer_feedback'::public.review_status,
          'reopened'::public.review_status
        )
        and reviewer.is_active = true
        and reviewer.role in (
          'employee'::public.user_role,
          'supervisor'::public.user_role
        )
        and reviewer.id <> employee.id
        and (select private.can_manage_employee(employee.id))
        and (
          reviewer.department_id = employee.department_id
          or exists (
            select 1
            from public.project_members employee_membership
            join public.project_members reviewer_membership
              on reviewer_membership.project_id = employee_membership.project_id
            where employee_membership.user_id = employee.id
              and reviewer_membership.user_id = reviewer.id
              and (
                (select private.hr_partner_manages_project(employee_membership.project_id))
                or review.supervisor_id = (select auth.uid())
              )
          )
        )
    )
$$;

revoke all on function private.can_assign_peer_reviewer(uuid, uuid) from public, anon;
grant execute on function private.can_assign_peer_reviewer(uuid, uuid) to authenticated;

-- Limit the profile directory to people needed for the signed-in user's work.
create or replace function private.can_view_profile(target_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select auth.uid()) is not null
    and exists (
      select 1
      from public.profiles viewer
      join public.profiles target on target.id = target_user_id
      where viewer.id = (select auth.uid())
        and viewer.is_active = true
        and target.is_active = true
        and (
          target.id = viewer.id
          or (
            viewer.role <> 'senior_management'::public.user_role
            and (
              target.id = viewer.manager_id
              or target.id = viewer.hr_partner_id
              or (
                viewer.role in (
                  'employee'::public.user_role,
                  'supervisor'::public.user_role
                )
                and target.department_id = viewer.department_id
              )
              or target.manager_id = viewer.id
              or (select private.can_manage_employee(target.id))
              or exists (
                select 1
                from public.feedback_requests request
                join public.reviews review on review.id = request.review_id
                where request.reviewer_id = viewer.id
                  and review.employee_id = target.id
              )
            )
          )
        )
    )
$$;

revoke all on function private.can_view_profile(uuid) from public, anon;
grant execute on function private.can_view_profile(uuid) to authenticated;

drop policy if exists profiles_select_directory on public.profiles;
drop policy if exists profiles_select_authorized on public.profiles;
create policy profiles_select_authorized
on public.profiles
for select
to authenticated
using ((select private.can_view_profile(id)));

-- Profiles are identity and authorisation records. Browser clients may read
-- them but may not rewrite their role, reporting line or access scope.
drop policy if exists profiles_update_self on public.profiles;
revoke update on public.profiles from authenticated;

-- Immutable, metadata-only workflow audit events. Sensitive answers and
-- comments are intentionally excluded from the JSON payload.
create table if not exists public.workflow_audit_log (
  id bigint generated by default as identity primary key,
  actor_id uuid references public.profiles(id) on delete set null,
  entity_type text not null,
  entity_id uuid,
  review_id uuid references public.reviews(id) on delete set null,
  employee_id uuid references public.profiles(id) on delete set null,
  action text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists workflow_audit_log_actor_id_idx
  on public.workflow_audit_log(actor_id, created_at desc);
create index if not exists workflow_audit_log_review_id_idx
  on public.workflow_audit_log(review_id, created_at desc);
create index if not exists workflow_audit_log_employee_id_idx
  on public.workflow_audit_log(employee_id, created_at desc);

alter table public.workflow_audit_log enable row level security;
grant select on public.workflow_audit_log to authenticated;
revoke insert, update, delete on public.workflow_audit_log from anon, authenticated;

drop policy if exists workflow_audit_log_select_authorized on public.workflow_audit_log;
create policy workflow_audit_log_select_authorized
on public.workflow_audit_log
for select
to authenticated
using (
  actor_id = (select auth.uid())
  or employee_id = (select auth.uid())
  or (review_id is not null and (select private.can_manage_review(review_id)))
  or (
    entity_type = 'review_cycle'
    and (select private.can_administer_review_cycles())
  )
);

create or replace function private.write_workflow_audit(
  audit_entity_type text,
  audit_entity_id uuid,
  audit_action text,
  audit_review_id uuid default null,
  audit_employee_id uuid default null,
  audit_metadata jsonb default '{}'::jsonb
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.workflow_audit_log (
    actor_id,
    entity_type,
    entity_id,
    review_id,
    employee_id,
    action,
    metadata
  ) values (
    (select auth.uid()),
    audit_entity_type,
    audit_entity_id,
    audit_review_id,
    audit_employee_id,
    audit_action,
    coalesce(audit_metadata, '{}'::jsonb)
  );
end;
$$;

revoke all on function private.write_workflow_audit(text, uuid, text, uuid, uuid, jsonb)
  from public, anon, authenticated;

create or replace function private.audit_workflow_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  old_row jsonb := case when tg_op = 'INSERT' then '{}'::jsonb else to_jsonb(old) end;
  new_row jsonb := case when tg_op = 'DELETE' then '{}'::jsonb else to_jsonb(new) end;
  entity_uuid uuid;
  linked_review uuid;
  subject_employee uuid;
begin
  entity_uuid := nullif(coalesce(new_row->>'id', old_row->>'id'), '')::uuid;
  linked_review := nullif(coalesce(new_row->>'review_id', old_row->>'review_id'), '')::uuid;
  if tg_table_name = 'reviews' then
    linked_review := entity_uuid;
  end if;
  subject_employee := nullif(coalesce(new_row->>'employee_id', old_row->>'employee_id'), '')::uuid;

  perform private.write_workflow_audit(
    tg_table_name,
    entity_uuid,
    lower(tg_op),
    linked_review,
    subject_employee,
    jsonb_strip_nulls(jsonb_build_object(
      'old_status', old_row->>'status',
      'new_status', new_row->>'status',
      'feedback_type', new_row->>'feedback_type',
      'plan_type', new_row->>'type'
    ))
  );

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

revoke all on function private.audit_workflow_change() from public, anon, authenticated;

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'review_cycles',
    'reviews',
    'feedback_requests',
    'review_feedback',
    'par_meetings',
    'development_plans',
    'development_plan_actions',
    'development_plan_evidence',
    'goals'
  ]
  loop
    execute format('drop trigger if exists %I_audit_change on public.%I', table_name, table_name);
    execute format(
      'create trigger %I_audit_change after insert or update or delete on public.%I for each row execute function private.audit_workflow_change()',
      table_name,
      table_name
    );
  end loop;
end;
$$;

-- Normalisation is a controlled management workflow. Leadership receives a
-- deliberately narrow queue rather than direct access to confidential tables.
create table if not exists public.normalization_decisions (
  review_id uuid primary key references public.reviews(id) on delete cascade,
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'changes_requested')),
  proposed_rating numeric(5,2),
  normalized_rating numeric(5,2),
  rationale text,
  decided_by uuid references public.profiles(id) on delete set null,
  decided_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (proposed_rating is null or proposed_rating between 0 and 5),
  check (normalized_rating is null or normalized_rating between 0 and 5)
);

alter table public.normalization_decisions enable row level security;
grant select on public.normalization_decisions to authenticated;
revoke insert, update, delete on public.normalization_decisions from anon, authenticated;

drop trigger if exists normalization_decisions_set_updated_at
  on public.normalization_decisions;
create trigger normalization_decisions_set_updated_at
before update on public.normalization_decisions
for each row execute function private.set_updated_at();

drop trigger if exists normalization_decisions_audit_change
  on public.normalization_decisions;
create trigger normalization_decisions_audit_change
after insert or update or delete on public.normalization_decisions
for each row execute function private.audit_workflow_change();

drop policy if exists normalization_decisions_select_hrbp
  on public.normalization_decisions;
create policy normalization_decisions_select_hrbp
on public.normalization_decisions
for select
to authenticated
using ((select private.can_manage_review(review_id)));

create or replace function public.get_normalization_queue()
returns table (
  review_id uuid,
  cycle_name text,
  employee_number text,
  employee_name text,
  department_name text,
  supervisor_rating numeric,
  supervisor_summary text,
  evidence_count integer,
  decision_status text,
  normalized_rating numeric,
  rationale text,
  decided_at timestamptz
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if (select auth.uid()) is null
    or (select private.current_user_role()) <> 'senior_management'::public.user_role
  then
    raise exception 'You are not authorized to access normalization';
  end if;

  return query
  select
    review.id,
    cycle.name,
    employee.employee_number,
    employee.full_name,
    department.name,
    review.supervisor_rating,
    review.supervisor_summary,
    (
      select count(*)::integer
      from public.development_plan_evidence evidence
      join public.development_plans plan on plan.id = evidence.plan_id
      where plan.employee_id = review.employee_id
        and (plan.review_id = review.id or plan.review_id is null)
    ),
    coalesce(decision.status, 'pending'),
    decision.normalized_rating,
    decision.rationale,
    decision.decided_at
  from public.reviews review
  join public.review_cycles cycle on cycle.id = review.cycle_id
  join public.profiles employee on employee.id = review.employee_id
  left join public.departments department on department.id = employee.department_id
  left join public.normalization_decisions decision on decision.review_id = review.id
  where review.status in (
    'hr_review'::public.review_status,
    'completed'::public.review_status
  )
    and review.supervisor_submitted_at is not null
  order by
    case when coalesce(decision.status, 'pending') = 'pending' then 0 else 1 end,
    cycle.start_date desc,
    employee.full_name;
end;
$$;

revoke all on function public.get_normalization_queue() from public, anon;
grant execute on function public.get_normalization_queue() to authenticated;

create or replace function public.save_normalization_decision(
  p_review_id uuid,
  p_status text,
  p_normalized_rating numeric,
  p_rationale text
)
returns public.normalization_decisions
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_review public.reviews;
  saved public.normalization_decisions;
begin
  if (select auth.uid()) is null
    or (select private.current_user_role()) <> 'senior_management'::public.user_role
  then
    raise exception 'You are not authorized to make normalization decisions';
  end if;

  if p_status not in ('approved', 'changes_requested') then
    raise exception 'Choose approved or changes requested';
  end if;
  if p_status = 'approved' and (p_normalized_rating is null or p_normalized_rating < 0 or p_normalized_rating > 5) then
    raise exception 'An approved rating between 0 and 5 is required';
  end if;
  if nullif(btrim(coalesce(p_rationale, '')), '') is null then
    raise exception 'A normalization rationale is required';
  end if;

  select * into target_review
  from public.reviews
  where id = p_review_id
    and status = 'hr_review'::public.review_status
    and supervisor_submitted_at is not null;

  if target_review.id is null then
    raise exception 'This review is not ready for normalization';
  end if;

  insert into public.normalization_decisions (
    review_id,
    status,
    proposed_rating,
    normalized_rating,
    rationale,
    decided_by,
    decided_at
  ) values (
    p_review_id,
    p_status,
    target_review.supervisor_rating,
    case when p_status = 'approved' then p_normalized_rating else null end,
    btrim(p_rationale),
    (select auth.uid()),
    now()
  )
  on conflict (review_id) do update set
    status = excluded.status,
    proposed_rating = excluded.proposed_rating,
    normalized_rating = excluded.normalized_rating,
    rationale = excluded.rationale,
    decided_by = excluded.decided_by,
    decided_at = excluded.decided_at
  returning * into saved;

  perform private.write_workflow_audit(
    'normalization_decision',
    p_review_id,
    p_status,
    p_review_id,
    target_review.employee_id,
    jsonb_build_object('normalized_rating', saved.normalized_rating)
  );

  return saved;
end;
$$;

revoke all on function public.save_normalization_decision(uuid, text, numeric, text)
  from public, anon;
grant execute on function public.save_normalization_decision(uuid, text, numeric, text)
  to authenticated;

-- Plan agreement is explicit and independently timestamped for the employee
-- and their immediate supervisor.
alter table public.development_plans
  add column if not exists employee_agreement_status text not null default 'pending',
  add column if not exists employee_agreed_at timestamptz,
  add column if not exists supervisor_agreement_status text not null default 'pending',
  add column if not exists supervisor_agreed_at timestamptz;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'development_plans_employee_agreement_valid'
  ) then
    alter table public.development_plans
      add constraint development_plans_employee_agreement_valid
      check (employee_agreement_status in ('pending', 'agreed', 'changes_requested'));
  end if;
  if not exists (
    select 1 from pg_constraint where conname = 'development_plans_supervisor_agreement_valid'
  ) then
    alter table public.development_plans
      add constraint development_plans_supervisor_agreement_valid
      check (supervisor_agreement_status in ('pending', 'agreed', 'changes_requested'));
  end if;
end;
$$;

create or replace function public.respond_to_plan_agreement(
  p_plan_id uuid,
  p_decision text
)
returns public.development_plans
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_plan public.development_plans;
  employee_manager uuid;
  saved public.development_plans;
begin
  if (select auth.uid()) is null then
    raise exception 'Authentication required';
  end if;
  if p_decision not in ('agreed', 'changes_requested') then
    raise exception 'Choose agreed or changes requested';
  end if;

  select plan.*
    into target_plan
  from public.development_plans plan
  where plan.id = p_plan_id;

  if target_plan.id is null then
    raise exception 'Development plan not found';
  end if;

  select employee.manager_id
    into employee_manager
  from public.profiles employee
  where employee.id = target_plan.employee_id;

  if target_plan.employee_id = (select auth.uid()) then
    update public.development_plans
    set
      employee_agreement_status = p_decision,
      employee_agreed_at = case when p_decision = 'agreed' then now() else null end
    where id = p_plan_id
    returning * into saved;
  elsif employee_manager = (select auth.uid()) then
    update public.development_plans
    set
      supervisor_agreement_status = p_decision,
      supervisor_agreed_at = case when p_decision = 'agreed' then now() else null end
    where id = p_plan_id
    returning * into saved;
  else
    raise exception 'Only the employee or immediate supervisor can respond';
  end if;

  if saved.employee_agreement_status = 'agreed'
    and saved.supervisor_agreement_status = 'agreed'
  then
    update public.development_plans
    set status = 'active'::public.plan_status
    where id = p_plan_id
    returning * into saved;
  end if;

  perform private.write_workflow_audit(
    'development_plan',
    p_plan_id,
    'agreement_' || p_decision,
    saved.review_id,
    saved.employee_id,
    jsonb_build_object(
      'employee', saved.employee_agreement_status,
      'supervisor', saved.supervisor_agreement_status
    )
  );

  return saved;
end;
$$;

revoke all on function public.respond_to_plan_agreement(uuid, text) from public, anon;
grant execute on function public.respond_to_plan_agreement(uuid, text) to authenticated;

-- HRBPs may correct a draft plan only before either participant responds.
-- Activation and agreement changes stay behind dedicated workflow RPCs.
create or replace function public.update_draft_development_plan(
  p_plan_id uuid,
  p_title text,
  p_progress integer
)
returns public.development_plans
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_plan public.development_plans;
  saved public.development_plans;
begin
  if (select auth.uid()) is null then
    raise exception 'Authentication required';
  end if;
  select * into target_plan from public.development_plans where id = p_plan_id;
  if target_plan.id is null
    or (select private.current_user_role()) <> 'hr_partner'::public.user_role
    or not (select private.can_manage_employee(target_plan.employee_id))
  then
    raise exception 'You are not authorized to edit this development plan';
  end if;
  if target_plan.status <> 'draft'::public.plan_status
    or target_plan.employee_agreement_status <> 'pending'
    or target_plan.supervisor_agreement_status <> 'pending'
  then
    raise exception 'This plan is locked because agreement has started';
  end if;
  if nullif(btrim(coalesce(p_title, '')), '') is null then
    raise exception 'A plan objective is required';
  end if;
  if p_progress is null or p_progress < 0 or p_progress > 100 then
    raise exception 'Progress must be between 0 and 100';
  end if;

  update public.development_plans
  set title = btrim(p_title), progress = p_progress
  where id = p_plan_id
  returning * into saved;

  perform private.write_workflow_audit(
    'development_plan', saved.id, 'draft_updated', saved.review_id, saved.employee_id
  );
  return saved;
end;
$$;

revoke all on function public.update_draft_development_plan(uuid, text, integer)
  from public, anon;
grant execute on function public.update_draft_development_plan(uuid, text, integer)
  to authenticated;

create or replace function public.create_development_plan(
  p_employee_id uuid,
  p_review_id uuid,
  p_type text,
  p_title text,
  p_reason text,
  p_start_date date,
  p_end_date date,
  p_actions jsonb
)
returns public.development_plans
language plpgsql
security definer
set search_path = ''
as $$
declare
  saved public.development_plans;
begin
  if (select auth.uid()) is null
    or (select private.current_user_role()) <> 'hr_partner'::public.user_role
    or not (select private.can_manage_employee(p_employee_id))
  then
    raise exception 'You are not authorized to create this development plan';
  end if;
  if p_type not in ('pdp', 'pip') then raise exception 'Choose PDP or PIP'; end if;
  if nullif(btrim(coalesce(p_title, '')), '') is null
    or nullif(btrim(coalesce(p_reason, '')), '') is null
  then
    raise exception 'An objective and reason are required';
  end if;
  if p_start_date is null or p_end_date is null or p_end_date < p_start_date then
    raise exception 'A valid plan date range is required';
  end if;
  if p_review_id is not null and not exists (
    select 1 from public.reviews review
    where review.id = p_review_id
      and review.employee_id = p_employee_id
      and (select private.can_manage_review(review.id))
  ) then
    raise exception 'The linked review is outside your scope';
  end if;
  if jsonb_typeof(coalesce(p_actions, '[]'::jsonb)) <> 'array'
    or jsonb_array_length(coalesce(p_actions, '[]'::jsonb)) = 0
  then
    raise exception 'At least one dated action is required';
  end if;
  if exists (
    select 1
    from jsonb_array_elements(p_actions) action
    where nullif(btrim(coalesce(action->>'title', '')), '') is null
      or nullif(action->>'dueDate', '') is null
      or (action->>'dueDate')::date < p_start_date
      or (action->>'dueDate')::date > p_end_date
  ) then
    raise exception 'Every action needs a title and a due date inside the plan dates';
  end if;

  insert into public.development_plans (
    employee_id, owner_id, review_id, type, title, reason,
    start_date, end_date, status, progress, created_by
  ) values (
    p_employee_id, p_employee_id, p_review_id,
    p_type::public.plan_type, btrim(p_title), btrim(p_reason),
    p_start_date, p_end_date, 'draft'::public.plan_status, 0,
    (select auth.uid())
  ) returning * into saved;

  insert into public.development_plan_actions (
    plan_id, title, description, owner_id, due_date, status
  )
  select
    saved.id,
    btrim(action->>'title'),
    nullif(btrim(coalesce(action->>'description', '')), ''),
    p_employee_id,
    (action->>'dueDate')::date,
    'not_started'::public.goal_status
  from jsonb_array_elements(p_actions) action;

  perform private.write_workflow_audit(
    'development_plan', saved.id, 'created', saved.review_id, saved.employee_id,
    jsonb_build_object('plan_type', saved.type, 'action_count', jsonb_array_length(p_actions))
  );
  return saved;
end;
$$;

revoke all on function public.create_development_plan(uuid, uuid, text, text, text, date, date, jsonb)
  from public, anon;
grant execute on function public.create_development_plan(uuid, uuid, text, text, text, date, date, jsonb)
  to authenticated;

revoke insert, update, delete on public.development_plans from authenticated;
revoke insert, delete on public.development_plan_actions from authenticated;
revoke update on public.development_plan_actions from authenticated;
grant update (status, completed_at) on public.development_plan_actions to authenticated;

drop policy if exists development_plan_actions_update_owner_or_management
  on public.development_plan_actions;
create policy development_plan_actions_update_owner_or_supervisor
on public.development_plan_actions
for update
to authenticated
using (
  exists (
    select 1
    from public.development_plans plan
    join public.profiles employee on employee.id = plan.employee_id
    where plan.id = development_plan_actions.plan_id
      and plan.employee_agreement_status = 'agreed'
      and plan.supervisor_agreement_status = 'agreed'
      and (
        development_plan_actions.owner_id = (select auth.uid())
        or employee.manager_id = (select auth.uid())
      )
  )
)
with check (
  exists (
    select 1
    from public.development_plans plan
    join public.profiles employee on employee.id = plan.employee_id
    where plan.id = development_plan_actions.plan_id
      and plan.employee_agreement_status = 'agreed'
      and plan.supervisor_agreement_status = 'agreed'
      and (
        development_plan_actions.owner_id = (select auth.uid())
        or employee.manager_id = (select auth.uid())
      )
  )
);

create or replace function private.sync_development_plan_progress()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_plan_id uuid := coalesce(new.plan_id, old.plan_id);
  action_total integer;
  completed_total integer;
begin
  select count(*)::integer,
         count(*) filter (where action.status = 'completed'::public.goal_status)::integer
    into action_total, completed_total
  from public.development_plan_actions action
  where action.plan_id = target_plan_id;

  update public.development_plans plan
  set
    progress = case when action_total = 0 then 0 else round(completed_total * 100.0 / action_total)::integer end,
    status = case
      when plan.status = 'cancelled'::public.plan_status then plan.status
      when plan.employee_agreement_status = 'agreed'
        and plan.supervisor_agreement_status = 'agreed'
        and action_total > 0
        and action_total = completed_total
      then 'completed'::public.plan_status
      when plan.employee_agreement_status = 'agreed'
        and plan.supervisor_agreement_status = 'agreed'
      then 'active'::public.plan_status
      else 'draft'::public.plan_status
    end
  where plan.id = target_plan_id;

  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;

revoke all on function private.sync_development_plan_progress()
  from public, anon, authenticated;
drop trigger if exists development_plan_actions_sync_progress
  on public.development_plan_actions;
create trigger development_plan_actions_sync_progress
after insert or update or delete on public.development_plan_actions
for each row execute function private.sync_development_plan_progress();

-- Assigned reviewers are also allowed to see the one review/profile needed for
-- their request, without exposing the employee's other review history.
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
      from public.reviews review
      where review.id = target_review_id
        and (
          review.employee_id = (select auth.uid())
          or review.supervisor_id = (select auth.uid())
          or (select private.can_manage_employee(review.employee_id))
          or exists (
            select 1
            from public.feedback_requests request
            where request.review_id = review.id
              and request.reviewer_id = (select auth.uid())
          )
        )
    )
$$;

create or replace function private.save_self_review(
  p_review_id uuid,
  p_summary text,
  p_submit boolean default false
)
returns public.reviews
language plpgsql
security definer
set search_path = ''
as $$
declare
  result public.reviews;
begin
  if (select auth.uid()) is null then
    raise exception 'Authentication required';
  end if;

  update public.reviews
  set
    employee_summary = p_summary,
    status = case
      when p_submit then 'peer_feedback'::public.review_status
      else 'self_review'::public.review_status
    end,
    employee_submitted_at = case when p_submit then now() else employee_submitted_at end
  where id = p_review_id
    and employee_id = (select auth.uid())
    and status in (
      'not_started'::public.review_status,
      'self_review'::public.review_status,
      'reopened'::public.review_status
    )
  returning * into result;

  if result.id is null then
    raise exception 'Review is unavailable or cannot be edited at this stage';
  end if;

  perform private.write_workflow_audit(
    'review', result.id,
    case when p_submit then 'self_assessment_submitted' else 'self_assessment_saved' end,
    result.id, result.employee_id
  );
  return result;
end;
$$;

revoke all on function private.save_self_review(uuid, text, boolean)
  from public, anon, authenticated;

create or replace function private.mark_feedback_request_submitted()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_employee uuid;
begin
  update public.feedback_requests
  set status = 'submitted'::public.feedback_request_status,
      responded_at = new.submitted_at
  where id = new.request_id;

  update public.reviews review
  set status = 'supervisor_review'::public.review_status
  where review.id = new.review_id
    and review.status = 'peer_feedback'::public.review_status
    and review.employee_submitted_at is not null
    and exists (
      select 1 from public.feedback_requests request
      where request.review_id = review.id
    )
    and not exists (
      select 1 from public.feedback_requests request
      where request.review_id = review.id
        and request.status = 'pending'::public.feedback_request_status
    );

  select employee_id into target_employee
  from public.reviews where id = new.review_id;
  perform private.write_workflow_audit(
    'review_feedback', new.id, 'peer_feedback_submitted',
    new.review_id, target_employee,
    jsonb_build_object('request_id', new.request_id)
  );
  return new;
end;
$$;

revoke all on function private.mark_feedback_request_submitted()
  from public, anon, authenticated;

-- Do not expose reviewer identifiers through direct table reads. Employees
-- receive anonymized finalized feedback, while accountable managers receive
-- named feedback only for reviews inside their scope.
revoke select on public.review_feedback from authenticated;

create or replace function public.get_employee_visible_feedback()
returns table (
  id uuid,
  review_id uuid,
  strengths text,
  improvements text,
  comments text,
  rating numeric,
  submitted_at timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    feedback.id,
    feedback.review_id,
    feedback.strengths,
    feedback.improvements,
    feedback.comments,
    feedback.rating,
    feedback.submitted_at
  from public.review_feedback feedback
  where feedback.subject_id = (select auth.uid())
    and feedback.visibility = 'employee_and_management'::public.feedback_visibility
    and feedback.submitted_at is not null
  order by feedback.submitted_at desc
$$;

revoke all on function public.get_employee_visible_feedback() from public, anon;
grant execute on function public.get_employee_visible_feedback() to authenticated;

create or replace function public.get_management_review_feedback(p_review_ids uuid[])
returns table (
  id uuid,
  review_id uuid,
  reviewer_id uuid,
  reviewer_name text,
  reviewer_number text,
  strengths text,
  improvements text,
  comments text,
  rating numeric,
  submitted_at timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    feedback.id,
    feedback.review_id,
    feedback.reviewer_id,
    reviewer.full_name,
    reviewer.employee_number,
    feedback.strengths,
    feedback.improvements,
    feedback.comments,
    feedback.rating,
    feedback.submitted_at
  from public.review_feedback feedback
  join public.profiles reviewer on reviewer.id = feedback.reviewer_id
  where feedback.review_id = any(coalesce(p_review_ids, array[]::uuid[]))
    and (select private.can_manage_review(feedback.review_id))
  order by feedback.submitted_at
$$;

revoke all on function public.get_management_review_feedback(uuid[]) from public, anon;
grant execute on function public.get_management_review_feedback(uuid[]) to authenticated;

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
  if p_rating is null or p_rating < 0 or p_rating > 5 then
    raise exception 'Rating must be between 0 and 5';
  end if;
  if nullif(btrim(coalesce(p_summary, '')), '') is null then
    raise exception 'A supervisor summary is required';
  end if;

  select * into current_review
  from public.reviews where id = p_review_id;

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
    supervisor_summary = btrim(p_summary),
    supervisor_rating = p_rating,
    status = case when p_submit then 'hr_review'::public.review_status else status end,
    supervisor_submitted_at = case when p_submit then now() else supervisor_submitted_at end
  where id = p_review_id
  returning * into result;

  if p_submit then
    insert into public.normalization_decisions (review_id, proposed_rating)
    values (p_review_id, p_rating)
    on conflict (review_id) do update set
      proposed_rating = excluded.proposed_rating,
      status = 'pending',
      normalized_rating = null,
      rationale = null,
      decided_by = null,
      decided_at = null;
  end if;

  perform private.write_workflow_audit(
    'review', result.id,
    case when p_submit then 'supervisor_review_submitted' else 'supervisor_review_saved' end,
    result.id, result.employee_id,
    jsonb_build_object('rating', p_rating)
  );
  return result;
end;
$$;

revoke all on function public.save_supervisor_review(uuid, text, numeric, boolean)
  from public, anon;
grant execute on function public.save_supervisor_review(uuid, text, numeric, boolean)
  to authenticated;

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
  decision public.normalization_decisions;
  result public.reviews;
begin
  if (select auth.uid()) is null then
    raise exception 'Authentication required';
  end if;

  select * into current_review from public.reviews where id = p_review_id;
  if current_review.id is null
    or (select private.current_user_role()) <> 'hr_partner'::public.user_role
    or not (select private.can_manage_employee(current_review.employee_id))
  then
    raise exception 'You are not authorized to complete this review';
  end if;
  if current_review.status not in (
    'hr_review'::public.review_status,
    'reopened'::public.review_status
  ) then
    raise exception 'Review is not at the HR completion stage';
  end if;

  select * into decision
  from public.normalization_decisions
  where review_id = p_review_id and status = 'approved';
  if decision.review_id is null then
    raise exception 'An approved normalization decision is required';
  end if;
  if not exists (
    select 1 from public.par_meetings meeting
    where meeting.review_id = p_review_id
      and meeting.status = 'completed'::public.par_meeting_status
      and nullif(btrim(coalesce(meeting.notes, '')), '') is not null
  ) then
    raise exception 'A completed PAR meeting outcome is required';
  end if;

  update public.reviews
  set
    hr_comments = nullif(btrim(coalesce(p_comments, '')), ''),
    overall_rating = coalesce(p_overall_rating, decision.normalized_rating, supervisor_rating),
    status = 'completed'::public.review_status,
    completed_at = now()
  where id = p_review_id
  returning * into result;

  update public.review_feedback
  set visibility = 'employee_and_management'::public.feedback_visibility
  where review_id = p_review_id
    and feedback_type = 'peer'::public.feedback_type;

  perform private.write_workflow_audit(
    'review', result.id, 'hr_review_completed', result.id, result.employee_id,
    jsonb_build_object('overall_rating', result.overall_rating)
  );
  return result;
end;
$$;

revoke all on function public.complete_hr_review(uuid, text, numeric)
  from public, anon;
grant execute on function public.complete_hr_review(uuid, text, numeric)
  to authenticated;

-- Cycle lifecycle RPCs keep elevated writes behind explicit role checks.
create or replace function public.create_review_cycle(
  p_name text,
  p_description text,
  p_start_date date,
  p_end_date date,
  p_self_review_due date,
  p_feedback_due date,
  p_supervisor_review_due date,
  p_review_type text,
  p_applies_to text
)
returns public.review_cycles
language plpgsql
security definer
set search_path = ''
as $$
declare
  saved public.review_cycles;
begin
  if not (select private.can_administer_review_cycles()) then
    raise exception 'You are not authorized to administer review cycles';
  end if;
  if nullif(btrim(coalesce(p_name, '')), '') is null then
    raise exception 'Cycle name is required';
  end if;
  if p_start_date is null or p_end_date is null or p_end_date < p_start_date then
    raise exception 'A valid cycle date range is required';
  end if;
  if p_self_review_due is null
    or p_feedback_due is null
    or p_supervisor_review_due is null
    or p_self_review_due < p_start_date
    or p_feedback_due < p_self_review_due
    or p_supervisor_review_due < p_feedback_due
    or p_supervisor_review_due > p_end_date
  then
    raise exception 'Workflow deadlines must be ordered and remain inside the cycle dates';
  end if;
  if p_applies_to not in ('employee', 'supervisor', 'both') then
    raise exception 'Invalid cycle audience';
  end if;

  insert into public.review_cycles (
    name, description, start_date, end_date,
    self_review_due, feedback_due, supervisor_review_due,
    status, review_type, applies_to, created_by
  ) values (
    btrim(p_name), nullif(btrim(coalesce(p_description, '')), ''),
    p_start_date, p_end_date,
    p_self_review_due, p_feedback_due, p_supervisor_review_due,
    'draft'::public.review_cycle_status,
    nullif(btrim(coalesce(p_review_type, '')), ''), p_applies_to,
    (select auth.uid())
  ) returning * into saved;

  perform private.write_workflow_audit(
    'review_cycle', saved.id, 'created', null, null,
    jsonb_build_object('name', saved.name, 'applies_to', saved.applies_to)
  );
  return saved;
end;
$$;

revoke all on function public.create_review_cycle(text, text, date, date, date, date, date, text, text)
  from public, anon;
grant execute on function public.create_review_cycle(text, text, date, date, date, date, date, text, text)
  to authenticated;

create or replace function public.set_review_cycle_status(
  p_cycle_id uuid,
  p_status text
)
returns public.review_cycles
language plpgsql
security definer
set search_path = ''
as $$
declare
  cycle public.review_cycles;
  saved public.review_cycles;
begin
  if not (select private.can_administer_review_cycles()) then
    raise exception 'You are not authorized to administer review cycles';
  end if;
  if p_status not in ('active', 'closed') then
    raise exception 'Choose active or closed';
  end if;

  select * into cycle from public.review_cycles where id = p_cycle_id;
  if cycle.id is null then raise exception 'Review cycle not found'; end if;
  if cycle.status = 'closed'::public.review_cycle_status then
    raise exception 'A closed review cycle cannot be reopened';
  end if;
  if p_status = 'active' and exists (
    select 1 from public.review_cycles other_cycle
    where other_cycle.id <> p_cycle_id
      and other_cycle.status = 'active'::public.review_cycle_status
  ) then
    raise exception 'Close the current active cycle before starting another';
  end if;
  if p_status = 'closed' and exists (
    select 1 from public.reviews review
    where review.cycle_id = p_cycle_id
      and review.status <> 'completed'::public.review_status
  ) then
    raise exception 'Complete every review before closing this cycle';
  end if;

  update public.review_cycles
  set status = p_status::public.review_cycle_status
  where id = p_cycle_id
  returning * into saved;

  if p_status = 'active' then
    insert into public.reviews (
      cycle_id, employee_id, supervisor_id, hr_partner_id,
      status, due_date, created_by
    )
    select
      saved.id,
      person.id,
      person.manager_id,
      person.hr_partner_id,
      'not_started'::public.review_status,
      coalesce(saved.supervisor_review_due, saved.end_date),
      (select auth.uid())
    from public.profiles person
    where person.is_active = true
      and (
        (saved.applies_to in ('employee', 'both') and person.role = 'employee'::public.user_role)
        or (saved.applies_to in ('supervisor', 'both') and person.role = 'supervisor'::public.user_role)
      )
    on conflict (cycle_id, employee_id) do nothing;

    insert into public.notifications (
      recipient_id, type, title, message, entity_type, entity_id, dedupe_key
    )
    select
      review.employee_id,
      'review_opened',
      'Self-assessment opened',
      saved.name || ' is now open. Complete your self-assessment by ' ||
        coalesce(to_char(saved.self_review_due, 'DD Mon YYYY'), 'the stated deadline') || '.',
      'review',
      review.id,
      'cycle-opened:' || review.id::text
    from public.reviews review
    where review.cycle_id = saved.id
    on conflict (dedupe_key) do nothing;
  end if;

  perform private.write_workflow_audit(
    'review_cycle', saved.id, 'status_' || p_status, null, null,
    jsonb_build_object('name', saved.name)
  );
  return saved;
end;
$$;

revoke all on function public.set_review_cycle_status(uuid, text) from public, anon;
grant execute on function public.set_review_cycle_status(uuid, text) to authenticated;

-- A stable dedupe key makes reminder generation idempotent.
alter table public.notifications add column if not exists dedupe_key text;
create unique index if not exists notifications_dedupe_key_unique
  on public.notifications(dedupe_key)
  where dedupe_key is not null;

create or replace function private.generate_workflow_reminders()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.notifications (
    recipient_id, type, title, message, entity_type, entity_id, dedupe_key
  )
  select
    review.employee_id,
    'self_assessment_due',
    case when cycle.self_review_due < current_date then 'Self-assessment overdue' else 'Self-assessment due soon' end,
    cycle.name || ': submit your self-assessment by ' || to_char(cycle.self_review_due, 'DD Mon YYYY') || '.',
    'review', review.id,
    'self-due:' || review.id::text || ':' || cycle.self_review_due::text
  from public.reviews review
  join public.review_cycles cycle on cycle.id = review.cycle_id
  where review.employee_submitted_at is null
    and cycle.status = 'active'::public.review_cycle_status
    and cycle.self_review_due <= current_date + 3
  on conflict (dedupe_key) do nothing;

  insert into public.notifications (
    recipient_id, type, title, message, entity_type, entity_id, dedupe_key
  )
  select
    request.reviewer_id,
    'peer_feedback_due',
    case when request.due_date < current_date then 'Peer feedback overdue' else 'Peer feedback due soon' end,
    'Submit your assigned peer feedback by ' || to_char(request.due_date, 'DD Mon YYYY') || '.',
    'feedback_request', request.id,
    'peer-due:' || request.id::text || ':' || request.due_date::text
  from public.feedback_requests request
  where request.status = 'pending'::public.feedback_request_status
    and request.due_date is not null
    and request.due_date <= current_date + 3
  on conflict (dedupe_key) do nothing;

  insert into public.notifications (
    recipient_id, type, title, message, entity_type, entity_id, dedupe_key
  )
  select
    review.supervisor_id,
    'supervisor_review_due',
    case when review.due_date < current_date then 'Supervisor review overdue' else 'Supervisor review due soon' end,
    'Complete the assigned supervisor evaluation by ' || to_char(review.due_date, 'DD Mon YYYY') || '.',
    'review', review.id,
    'supervisor-due:' || review.id::text || ':' || review.due_date::text
  from public.reviews review
  where review.status = 'supervisor_review'::public.review_status
    and review.supervisor_id is not null
    and review.due_date is not null
    and review.due_date <= current_date + 3
  on conflict (dedupe_key) do nothing;

  insert into public.notifications (
    recipient_id, type, title, message, entity_type, entity_id, dedupe_key
  )
  select
    action.owner_id,
    'development_action_due',
    case when action.due_date < current_date then 'Development action overdue' else 'Development action due soon' end,
    plan.title || ': ' || action.title || ' is due ' || to_char(action.due_date, 'DD Mon YYYY') || '.',
    'development_plan', plan.id,
    'plan-action-due:' || action.id::text || ':' || action.due_date::text
  from public.development_plan_actions action
  join public.development_plans plan on plan.id = action.plan_id
  where action.status <> 'completed'::public.goal_status
    and action.owner_id is not null
    and action.due_date is not null
    and action.due_date <= current_date + 3
  on conflict (dedupe_key) do nothing;

  insert into public.notifications (
    recipient_id, type, title, message, entity_type, entity_id, dedupe_key
  )
  select distinct
    assignment.hr_partner_id,
    'hr_intervention',
    'Review requires intervention',
    employee.full_name || '''s review is overdue and remains at ' || replace(review.status::text, '_', ' ') || '.',
    'review', review.id,
    'hr-overdue:' || assignment.hr_partner_id::text || ':' || review.id::text || ':' || review.status::text
  from public.reviews review
  join public.profiles employee on employee.id = review.employee_id
  join (
    select department_assignment.hr_partner_id, employee_profile.id as employee_id
    from public.hr_partner_departments department_assignment
    join public.profiles employee_profile
      on employee_profile.department_id = department_assignment.department_id
    union
    select project_assignment.hr_partner_id, membership.user_id
    from public.hr_partner_projects project_assignment
    join public.project_members membership
      on membership.project_id = project_assignment.project_id
  ) assignment on assignment.employee_id = employee.id
  where review.status <> 'completed'::public.review_status
    and review.due_date < current_date
  on conflict (dedupe_key) do nothing;
end;
$$;

revoke all on function private.generate_workflow_reminders()
  from public, anon, authenticated;

create extension if not exists pg_cron;

do $$
begin
  if not exists (
    select 1 from cron.job where jobname = 'altrium-pulse-workflow-reminders'
  ) then
    perform cron.schedule(
      'altrium-pulse-workflow-reminders',
      '15 1 * * *',
      'select private.generate_workflow_reminders();'
    );
  end if;
end;
$$;

-- Keep privileged workflow functions callable only through their checked
-- public entry points or database-owned triggers.
revoke all on function private.save_supervisor_review(uuid, text, numeric, boolean)
  from public, anon, authenticated;
revoke all on function private.complete_hr_review(uuid, text, numeric)
  from public, anon, authenticated;

notify pgrst, 'reload schema';
