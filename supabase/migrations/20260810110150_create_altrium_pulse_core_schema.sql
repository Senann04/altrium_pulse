create schema if not exists private;

create type public.user_role as enum (
  'employee',
  'supervisor',
  'hr_partner',
  'senior_management'
);

create type public.review_cycle_status as enum (
  'draft',
  'active',
  'closed'
);

create type public.review_status as enum (
  'not_started',
  'self_review',
  'supervisor_review',
  'peer_feedback',
  'hr_review',
  'completed',
  'reopened'
);

create type public.feedback_type as enum (
  'peer',
  'supervisor',
  'project_manager',
  'hr'
);

create type public.feedback_visibility as enum (
  'employee_and_management',
  'management_only',
  'confidential'
);

create type public.feedback_request_status as enum (
  'pending',
  'submitted',
  'declined',
  'cancelled'
);

create type public.plan_type as enum (
  'pdp',
  'pip'
);

create type public.plan_status as enum (
  'draft',
  'active',
  'completed',
  'cancelled'
);

create type public.goal_status as enum (
  'not_started',
  'in_progress',
  'completed',
  'blocked'
);

create table public.departments (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  employee_number text unique,
  full_name text not null,
  email text unique,
  role public.user_role not null default 'employee',
  job_title text,
  department_id uuid references public.departments(id) on delete set null,
  manager_id uuid references public.profiles(id) on delete set null,
  hr_partner_id uuid references public.profiles(id) on delete set null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profile_cannot_manage_self check (manager_id is null or manager_id <> id),
  constraint profile_cannot_be_own_hr_partner check (hr_partner_id is null or hr_partner_id <> id)
);

create table public.review_cycles (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  start_date date not null,
  end_date date not null,
  self_review_due date,
  supervisor_review_due date,
  feedback_due date,
  status public.review_cycle_status not null default 'draft',
  rating_scale_max numeric(5,2),
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint review_cycle_dates_valid check (end_date >= start_date),
  constraint review_cycle_rating_scale_valid check (
    rating_scale_max is null or rating_scale_max > 0
  )
);

create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  cycle_id uuid not null references public.review_cycles(id) on delete cascade,
  employee_id uuid not null references public.profiles(id),
  supervisor_id uuid references public.profiles(id),
  hr_partner_id uuid references public.profiles(id),
  status public.review_status not null default 'not_started',
  employee_summary text,
  employee_submitted_at timestamptz,
  supervisor_summary text,
  supervisor_rating numeric(5,2),
  supervisor_submitted_at timestamptz,
  hr_comments text,
  overall_rating numeric(5,2),
  completed_at timestamptz,
  due_date date,
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (cycle_id, employee_id),
  constraint supervisor_rating_nonnegative check (
    supervisor_rating is null or supervisor_rating >= 0
  ),
  constraint overall_rating_nonnegative check (
    overall_rating is null or overall_rating >= 0
  )
);

create table public.feedback_requests (
  id uuid primary key default gen_random_uuid(),
  review_id uuid not null references public.reviews(id) on delete cascade,
  reviewer_id uuid not null references public.profiles(id),
  feedback_type public.feedback_type not null default 'peer',
  visibility public.feedback_visibility not null default 'management_only',
  status public.feedback_request_status not null default 'pending',
  due_date date,
  assigned_by uuid not null default auth.uid() references public.profiles(id),
  responded_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (review_id, reviewer_id, feedback_type)
);

create table public.review_feedback (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null unique references public.feedback_requests(id) on delete cascade,
  review_id uuid not null references public.reviews(id) on delete cascade,
  reviewer_id uuid not null references public.profiles(id),
  subject_id uuid not null references public.profiles(id),
  feedback_type public.feedback_type not null,
  visibility public.feedback_visibility not null,
  strengths text,
  improvements text,
  comments text,
  rating numeric(5,2),
  submitted_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  constraint feedback_rating_nonnegative check (
    rating is null or rating >= 0
  )
);

create table public.goals (
  id uuid primary key default gen_random_uuid(),
  review_id uuid references public.reviews(id) on delete set null,
  employee_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  description text,
  target_date date,
  status public.goal_status not null default 'not_started',
  progress smallint not null default 0,
  created_by uuid not null default auth.uid() references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint goal_progress_valid check (progress between 0 and 100)
);

create table public.development_plans (
  id uuid primary key default gen_random_uuid(),
  review_id uuid references public.reviews(id) on delete set null,
  employee_id uuid not null references public.profiles(id) on delete cascade,
  owner_id uuid references public.profiles(id) on delete set null,
  type public.plan_type not null,
  title text not null,
  reason text,
  start_date date not null,
  end_date date,
  status public.plan_status not null default 'draft',
  created_by uuid not null default auth.uid() references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint development_plan_dates_valid check (
    end_date is null or end_date >= start_date
  )
);

create table public.development_plan_actions (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.development_plans(id) on delete cascade,
  title text not null,
  description text,
  owner_id uuid references public.profiles(id) on delete set null,
  due_date date,
  status public.goal_status not null default 'not_started',
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  type text not null default 'general',
  title text not null,
  message text not null,
  entity_type text,
  entity_id uuid,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index profiles_department_id_idx on public.profiles(department_id);
create index profiles_manager_id_idx on public.profiles(manager_id);
create index profiles_hr_partner_id_idx on public.profiles(hr_partner_id);
create index reviews_cycle_id_idx on public.reviews(cycle_id);
create index reviews_employee_id_idx on public.reviews(employee_id);
create index reviews_supervisor_id_idx on public.reviews(supervisor_id);
create index reviews_hr_partner_id_idx on public.reviews(hr_partner_id);
create index feedback_requests_review_id_idx on public.feedback_requests(review_id);
create index feedback_requests_reviewer_id_idx on public.feedback_requests(reviewer_id);
create index review_feedback_review_id_idx on public.review_feedback(review_id);
create index review_feedback_reviewer_id_idx on public.review_feedback(reviewer_id);
create index review_feedback_subject_id_idx on public.review_feedback(subject_id);
create index goals_employee_id_idx on public.goals(employee_id);
create index goals_review_id_idx on public.goals(review_id);
create index development_plans_employee_id_idx on public.development_plans(employee_id);
create index development_plans_review_id_idx on public.development_plans(review_id);
create index development_plan_actions_plan_id_idx on public.development_plan_actions(plan_id);
create index development_plan_actions_owner_id_idx on public.development_plan_actions(owner_id);
create index notifications_recipient_id_idx on public.notifications(recipient_id);
create index notifications_unread_idx
  on public.notifications(recipient_id, created_at desc)
  where read_at is null;

create or replace function private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger departments_set_updated_at
before update on public.departments
for each row execute function private.set_updated_at();

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function private.set_updated_at();

create trigger review_cycles_set_updated_at
before update on public.review_cycles
for each row execute function private.set_updated_at();

create trigger reviews_set_updated_at
before update on public.reviews
for each row execute function private.set_updated_at();

create trigger feedback_requests_set_updated_at
before update on public.feedback_requests
for each row execute function private.set_updated_at();

create trigger goals_set_updated_at
before update on public.goals
for each row execute function private.set_updated_at();

create trigger development_plans_set_updated_at
before update on public.development_plans
for each row execute function private.set_updated_at();

create trigger development_plan_actions_set_updated_at
before update on public.development_plan_actions
for each row execute function private.set_updated_at();

create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(
      nullif(new.raw_user_meta_data ->> 'full_name', ''),
      nullif(split_part(coalesce(new.email, ''), '@', 1), ''),
      'New employee'
    )
  )
  on conflict (id) do update
    set email = excluded.email;

  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function private.handle_new_user();

create or replace function private.current_user_role()
returns public.user_role
language sql
stable
security definer
set search_path = ''
as $$
  select p.role
  from public.profiles p
  where p.id = (select auth.uid())
    and p.is_active = true
$$;

create or replace function private.is_hr_or_senior()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (select private.current_user_role()) in (
      'hr_partner'::public.user_role,
      'senior_management'::public.user_role
    ),
    false
  )
$$;

create or replace function private.can_manage_employee(target_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select auth.uid()) is not null
    and (
      (select private.current_user_role()) = 'senior_management'::public.user_role
      or exists (
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
    )
$$;

create or replace function private.can_view_employee(target_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select auth.uid()) is not null
    and (
      target_user_id = (select auth.uid())
      or (select private.can_manage_employee(target_user_id))
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
          or (select private.current_user_role()) = 'senior_management'::public.user_role
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
          or (select private.current_user_role()) = 'senior_management'::public.user_role
        )
    )
$$;

create or replace function private.can_manage_plan(target_plan_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.development_plans p
    where p.id = target_plan_id
      and (
        p.owner_id = (select auth.uid())
        or (select private.can_manage_employee(p.employee_id))
      )
  )
$$;

create or replace function private.can_view_plan(target_plan_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.development_plans p
    where p.id = target_plan_id
      and (
        p.employee_id = (select auth.uid())
        or p.owner_id = (select auth.uid())
        or (select private.can_manage_employee(p.employee_id))
      )
  )
$$;

create or replace function private.prepare_review_insert()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  employee_manager uuid;
  employee_hr_partner uuid;
begin
  select p.manager_id, p.hr_partner_id
    into employee_manager, employee_hr_partner
  from public.profiles p
  where p.id = new.employee_id;

  if new.supervisor_id is null then
    new.supervisor_id = employee_manager;
  end if;

  if new.hr_partner_id is null then
    new.hr_partner_id = employee_hr_partner;
  end if;

  if (select auth.uid()) is not null then
    new.created_by = (select auth.uid());
  end if;

  return new;
end;
$$;

create trigger reviews_prepare_insert
before insert on public.reviews
for each row execute function private.prepare_review_insert();

create or replace function private.prepare_feedback_insert()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  request_row public.feedback_requests%rowtype;
  review_employee uuid;
begin
  select *
    into request_row
  from public.feedback_requests
  where id = new.request_id
    and status = 'pending'::public.feedback_request_status;

  if not found then
    raise exception 'Feedback request is invalid or no longer pending';
  end if;

  select employee_id
    into review_employee
  from public.reviews
  where id = request_row.review_id;

  if review_employee is null then
    raise exception 'Review not found for feedback request';
  end if;

  new.review_id = request_row.review_id;
  new.reviewer_id = request_row.reviewer_id;
  new.subject_id = review_employee;
  new.feedback_type = request_row.feedback_type;
  new.visibility = request_row.visibility;
  new.submitted_at = now();

  return new;
end;
$$;

create trigger review_feedback_prepare_insert
before insert on public.review_feedback
for each row execute function private.prepare_feedback_insert();

create or replace function private.mark_feedback_request_submitted()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.feedback_requests
  set
    status = 'submitted'::public.feedback_request_status,
    responded_at = new.submitted_at
  where id = new.request_id;

  return new;
end;
$$;

create trigger review_feedback_mark_request_submitted
after insert on public.review_feedback
for each row execute function private.mark_feedback_request_submitted();

create or replace function private.protect_created_fields()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    if (select auth.uid()) is not null then
      new.created_by = (select auth.uid());
    end if;
  else
    new.created_by = old.created_by;
    new.created_at = old.created_at;
  end if;

  return new;
end;
$$;

create trigger goals_protect_created_fields
before insert or update on public.goals
for each row execute function private.protect_created_fields();

create trigger development_plans_protect_created_fields
before insert or update on public.development_plans
for each row execute function private.protect_created_fields();

alter table public.departments enable row level security;
alter table public.profiles enable row level security;
alter table public.review_cycles enable row level security;
alter table public.reviews enable row level security;
alter table public.feedback_requests enable row level security;
alter table public.review_feedback enable row level security;
alter table public.goals enable row level security;
alter table public.development_plans enable row level security;
alter table public.development_plan_actions enable row level security;
alter table public.notifications enable row level security;

revoke all on schema private from public, anon, authenticated;
grant usage on schema private to authenticated;

revoke all on all tables in schema public from anon;
revoke all on all tables in schema public from authenticated;

grant select, insert, update, delete on public.departments to authenticated;
grant select on public.profiles to authenticated;
grant update (full_name, job_title) on public.profiles to authenticated;
grant select, insert, update, delete on public.review_cycles to authenticated;
grant select, insert on public.reviews to authenticated;
grant select, insert, delete on public.feedback_requests to authenticated;
grant update (status, responded_at) on public.feedback_requests to authenticated;
grant select, insert on public.review_feedback to authenticated;
grant select, insert, update, delete on public.goals to authenticated;
grant select, insert, update, delete on public.development_plans to authenticated;
grant select, insert, delete on public.development_plan_actions to authenticated;
grant update (status, completed_at) on public.development_plan_actions to authenticated;
grant select on public.notifications to authenticated;
grant update (read_at) on public.notifications to authenticated;

revoke all on all functions in schema private from public;
grant execute on function private.current_user_role() to authenticated;
grant execute on function private.is_hr_or_senior() to authenticated;
grant execute on function private.can_manage_employee(uuid) to authenticated;
grant execute on function private.can_view_employee(uuid) to authenticated;
grant execute on function private.can_manage_review(uuid) to authenticated;
grant execute on function private.can_view_review(uuid) to authenticated;
grant execute on function private.can_manage_plan(uuid) to authenticated;
grant execute on function private.can_view_plan(uuid) to authenticated;

create policy departments_select_authenticated
on public.departments
for select
to authenticated
using (true);

create policy departments_insert_hr_or_senior
on public.departments
for insert
to authenticated
with check ((select private.is_hr_or_senior()));

create policy departments_update_hr_or_senior
on public.departments
for update
to authenticated
using ((select private.is_hr_or_senior()))
with check ((select private.is_hr_or_senior()));

create policy departments_delete_hr_or_senior
on public.departments
for delete
to authenticated
using ((select private.is_hr_or_senior()));

create policy profiles_select_directory
on public.profiles
for select
to authenticated
using (is_active = true or id = (select auth.uid()));

create policy profiles_update_self
on public.profiles
for update
to authenticated
using (id = (select auth.uid()))
with check (id = (select auth.uid()));

create policy review_cycles_select_visible
on public.review_cycles
for select
to authenticated
using (
  status <> 'draft'::public.review_cycle_status
  or (select private.is_hr_or_senior())
);

create policy review_cycles_insert_hr_or_senior
on public.review_cycles
for insert
to authenticated
with check (
  (select private.is_hr_or_senior())
  and created_by = (select auth.uid())
);

create policy review_cycles_update_hr_or_senior
on public.review_cycles
for update
to authenticated
using ((select private.is_hr_or_senior()))
with check ((select private.is_hr_or_senior()));

create policy review_cycles_delete_hr_or_senior
on public.review_cycles
for delete
to authenticated
using ((select private.is_hr_or_senior()));

create policy reviews_select_participants
on public.reviews
for select
to authenticated
using ((select private.can_view_review(id)));

create policy reviews_insert_management
on public.reviews
for insert
to authenticated
with check (
  created_by = (select auth.uid())
  and (
    (select private.current_user_role()) in (
      'hr_partner'::public.user_role,
      'senior_management'::public.user_role
    )
    or (
      (select private.current_user_role()) = 'supervisor'::public.user_role
      and supervisor_id = (select auth.uid())
    )
  )
);

create policy feedback_requests_select_reviewer_or_management
on public.feedback_requests
for select
to authenticated
using (
  reviewer_id = (select auth.uid())
  or (select private.can_manage_review(review_id))
);

create policy feedback_requests_insert_management
on public.feedback_requests
for insert
to authenticated
with check (
  assigned_by = (select auth.uid())
  and (select private.can_manage_review(review_id))
);

create policy feedback_requests_update_reviewer_or_management
on public.feedback_requests
for update
to authenticated
using (
  reviewer_id = (select auth.uid())
  or (select private.can_manage_review(review_id))
)
with check (
  reviewer_id = (select auth.uid())
  or (select private.can_manage_review(review_id))
);

create policy feedback_requests_delete_management
on public.feedback_requests
for delete
to authenticated
using ((select private.can_manage_review(review_id)));

create policy review_feedback_select_authorized
on public.review_feedback
for select
to authenticated
using (
  reviewer_id = (select auth.uid())
  or (select private.can_manage_review(review_id))
  or (
    subject_id = (select auth.uid())
    and visibility = 'employee_and_management'::public.feedback_visibility
    and submitted_at is not null
  )
);

create policy review_feedback_insert_assigned_reviewer
on public.review_feedback
for insert
to authenticated
with check (
  reviewer_id = (select auth.uid())
  and exists (
    select 1
    from public.feedback_requests request
    where request.id = request_id
      and request.review_id = review_id
      and request.reviewer_id = (select auth.uid())
      and request.status = 'pending'::public.feedback_request_status
  )
);

create policy goals_select_authorized
on public.goals
for select
to authenticated
using ((select private.can_view_employee(employee_id)));

create policy goals_insert_authorized
on public.goals
for insert
to authenticated
with check (
  created_by = (select auth.uid())
  and (
    employee_id = (select auth.uid())
    or (select private.can_manage_employee(employee_id))
  )
);

create policy goals_update_authorized
on public.goals
for update
to authenticated
using (
  employee_id = (select auth.uid())
  or (select private.can_manage_employee(employee_id))
)
with check (
  employee_id = (select auth.uid())
  or (select private.can_manage_employee(employee_id))
);

create policy goals_delete_authorized
on public.goals
for delete
to authenticated
using (
  employee_id = (select auth.uid())
  or (select private.can_manage_employee(employee_id))
);

create policy development_plans_select_authorized
on public.development_plans
for select
to authenticated
using (
  employee_id = (select auth.uid())
  or owner_id = (select auth.uid())
  or (select private.can_manage_employee(employee_id))
);

create policy development_plans_insert_management
on public.development_plans
for insert
to authenticated
with check (
  created_by = (select auth.uid())
  and (select private.can_manage_employee(employee_id))
);

create policy development_plans_update_management
on public.development_plans
for update
to authenticated
using ((select private.can_manage_employee(employee_id)))
with check ((select private.can_manage_employee(employee_id)));

create policy development_plans_delete_management
on public.development_plans
for delete
to authenticated
using ((select private.can_manage_employee(employee_id)));

create policy development_plan_actions_select_authorized
on public.development_plan_actions
for select
to authenticated
using (
  owner_id = (select auth.uid())
  or (select private.can_view_plan(plan_id))
);

create policy development_plan_actions_insert_management
on public.development_plan_actions
for insert
to authenticated
with check ((select private.can_manage_plan(plan_id)));

create policy development_plan_actions_update_owner_or_management
on public.development_plan_actions
for update
to authenticated
using (
  owner_id = (select auth.uid())
  or (select private.can_manage_plan(plan_id))
)
with check (
  owner_id = (select auth.uid())
  or (select private.can_manage_plan(plan_id))
);

create policy development_plan_actions_delete_management
on public.development_plan_actions
for delete
to authenticated
using ((select private.can_manage_plan(plan_id)));

create policy notifications_select_own
on public.notifications
for select
to authenticated
using (recipient_id = (select auth.uid()));

create policy notifications_update_own
on public.notifications
for update
to authenticated
using (recipient_id = (select auth.uid()))
with check (recipient_id = (select auth.uid()));

create or replace function public.save_self_review(
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
      when p_submit then 'supervisor_review'::public.review_status
      else 'self_review'::public.review_status
    end,
    employee_submitted_at = case
      when p_submit then now()
      else employee_submitted_at
    end
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

  return result;
end;
$$;

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
    or not (
      current_review.supervisor_id = (select auth.uid())
      or (select private.current_user_role()) = 'senior_management'::public.user_role
    )
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
    or not (
      current_review.hr_partner_id = (select auth.uid())
      or (select private.current_user_role()) = 'senior_management'::public.user_role
    )
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

revoke all on function public.save_self_review(uuid, text, boolean) from public, anon;
revoke all on function public.save_supervisor_review(uuid, text, numeric, boolean) from public, anon;
revoke all on function public.complete_hr_review(uuid, text, numeric) from public, anon;

grant execute on function public.save_self_review(uuid, text, boolean) to authenticated;
grant execute on function public.save_supervisor_review(uuid, text, numeric, boolean) to authenticated;
grant execute on function public.complete_hr_review(uuid, text, numeric) to authenticated;
