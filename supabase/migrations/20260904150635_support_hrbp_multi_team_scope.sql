-- HR business partners are assigned to one or more departments. The mapping is
-- independent of the HRBP's own profile department so their scope can grow
-- without hardcoding team names or copying employee assignments.

create table if not exists public.hr_partner_departments (
  hr_partner_id uuid not null references public.profiles(id) on delete cascade,
  department_id uuid not null references public.departments(id) on delete cascade,
  assigned_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  primary key (hr_partner_id, department_id)
);

create index if not exists hr_partner_departments_department_id_idx
on public.hr_partner_departments(department_id);

create index if not exists hr_partner_departments_assigned_by_idx
on public.hr_partner_departments(assigned_by);

alter table public.hr_partner_departments enable row level security;

grant select on public.hr_partner_departments to authenticated;
revoke insert, update, delete on public.hr_partner_departments from anon, authenticated;

drop policy if exists hr_partner_departments_select_own on public.hr_partner_departments;

create policy hr_partner_departments_select_own
on public.hr_partner_departments
for select
to authenticated
using (hr_partner_id = (select auth.uid()));

-- Preserve the current assignments while changing from person-by-person scope
-- to reusable department scope.
insert into public.hr_partner_departments (hr_partner_id, department_id, assigned_by)
select distinct employee.hr_partner_id, employee.department_id, employee.hr_partner_id
from public.profiles employee
join public.profiles hr_partner on hr_partner.id = employee.hr_partner_id
where employee.department_id is not null
  and employee.hr_partner_id is not null
  and hr_partner.role = 'hr_partner'::public.user_role
  and hr_partner.is_active = true
on conflict (hr_partner_id, department_id) do nothing;

create or replace function private.hr_partner_manages_department(target_department_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select auth.uid()) is not null
    and target_department_id is not null
    and (select private.current_user_role()) = 'hr_partner'::public.user_role
    and exists (
      select 1
      from public.hr_partner_departments assignment
      where assignment.hr_partner_id = (select auth.uid())
        and assignment.department_id = target_department_id
    )
$$;

revoke all on function private.hr_partner_manages_department(uuid) from public, anon;
grant execute on function private.hr_partner_manages_department(uuid) to authenticated;

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
      from public.reviews review
      where review.id = target_review_id
        and (
          review.supervisor_id = (select auth.uid())
          or (select private.can_manage_employee(review.employee_id))
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
      from public.reviews review
      where review.id = target_review_id
        and (
          review.employee_id = (select auth.uid())
          or review.supervisor_id = (select auth.uid())
          or (select private.can_manage_employee(review.employee_id))
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
      join public.profiles reviewer on reviewer.id = target_reviewer_id
      where review.id = target_review_id
        and reviewer.is_active = true
        and reviewer.role = 'employee'::public.user_role
        and reviewer.id <> review.employee_id
        and (
          (
            review.supervisor_id = (select auth.uid())
            and (select private.can_manage_employee(reviewer.id))
          )
          or (
            (select private.hr_partner_manages_department(reviewer.department_id))
            and (select private.can_manage_employee(review.employee_id))
          )
        )
    )
$$;

revoke all on function private.can_assign_peer_reviewer(uuid, uuid) from public, anon;
grant execute on function private.can_assign_peer_reviewer(uuid, uuid) to authenticated;

drop policy if exists reviews_insert_management on public.reviews;

create policy reviews_insert_management
on public.reviews
for insert
to authenticated
with check (
  created_by = (select auth.uid())
  and (
    (
      (select private.current_user_role()) = 'hr_partner'::public.user_role
      and hr_partner_id = (select auth.uid())
      and (select private.can_manage_employee(employee_id))
    )
    or (
      (select private.current_user_role()) = 'supervisor'::public.user_role
      and supervisor_id = (select auth.uid())
      and (select private.can_manage_employee(employee_id))
    )
  )
);

drop policy if exists feedback_requests_insert_management on public.feedback_requests;

create policy feedback_requests_insert_management
on public.feedback_requests
for insert
to authenticated
with check (
  assigned_by = (select auth.uid())
  and feedback_type = 'peer'::public.feedback_type
  and (select private.can_assign_peer_reviewer(review_id, reviewer_id))
);

-- Review-cycle definitions are company schedules. HRBPs administer only the
-- review records inside their assigned departments; company cycle creation,
-- mutation and deletion stay outside the browser client.
drop policy if exists review_cycles_insert_hr_or_senior on public.review_cycles;
drop policy if exists review_cycles_update_hr_or_senior on public.review_cycles;
drop policy if exists review_cycles_delete_hr_or_senior on public.review_cycles;
revoke insert, update, delete on public.review_cycles from authenticated;

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
