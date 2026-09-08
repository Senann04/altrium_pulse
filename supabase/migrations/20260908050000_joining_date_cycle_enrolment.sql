-- Automatically enrol active employees in eligible review cycles.
-- Existing cycles keep their current roster behaviour. New cycles require
-- 90 days of service by the cycle end unless HR changes the cycle setting.

alter table public.profiles
  add column if not exists joined_on date;

alter table public.profiles
  alter column joined_on set default current_date;

alter table public.review_cycles
  add column if not exists minimum_service_days integer;

update public.review_cycles
set minimum_service_days = 0
where minimum_service_days is null;

alter table public.review_cycles
  alter column minimum_service_days set default 90,
  alter column minimum_service_days set not null;

do $migration$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'profiles_joined_on_reasonable'
      and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles
      add constraint profiles_joined_on_reasonable
      check (joined_on is null or joined_on >= date '1900-01-01') not valid;
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'review_cycles_minimum_service_days_valid'
      and conrelid = 'public.review_cycles'::regclass
  ) then
    alter table public.review_cycles
      add constraint review_cycles_minimum_service_days_valid
      check (minimum_service_days between 0 and 730);
  end if;
end
$migration$;

create or replace function private.employee_is_eligible_for_cycle(
  p_cycle_id uuid,
  p_employee_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $function$
  select exists (
    select 1
    from public.review_cycles cycle
    join public.profiles employee on employee.id = p_employee_id
    where cycle.id = p_cycle_id
      and employee.is_active
      and (
        (cycle.applies_to in ('employee', 'both') and employee.role = 'employee')
        or (cycle.applies_to in ('supervisor', 'both') and employee.role = 'supervisor')
      )
      and (
        employee.joined_on is null
        or employee.joined_on <= cycle.end_date - cycle.minimum_service_days
      )
  );
$function$;

revoke all on function private.employee_is_eligible_for_cycle(uuid, uuid) from public;
grant execute on function private.employee_is_eligible_for_cycle(uuid, uuid) to authenticated;

create or replace function private.filter_ineligible_cycle_assignment()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
begin
  if not private.employee_is_eligible_for_cycle(new.cycle_id, new.employee_id) then
    return null;
  end if;
  return new;
end;
$function$;

drop trigger if exists filter_ineligible_cycle_assignment
  on public.cycle_employee_assignments;
create trigger filter_ineligible_cycle_assignment
before insert on public.cycle_employee_assignments
for each row execute function private.filter_ineligible_cycle_assignment();

create or replace function private.validate_cycle_allocation(p_cycle uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $function$
declare
  cycle public.review_cycles;
begin
  select * into cycle
  from public.review_cycles
  where id = p_cycle;

  if cycle.id is null then
    raise exception 'Review cycle not found';
  end if;

  if not exists (
    select 1 from public.cycle_employee_assignments
    where cycle_id = p_cycle
  ) then
    raise exception 'Prepare a non-empty eligible employee roster first';
  end if;

  if exists (
    select 1
    from public.profiles employee
    where private.employee_is_eligible_for_cycle(p_cycle, employee.id)
      and not exists (
        select 1
        from public.cycle_employee_assignments assignment
        where assignment.cycle_id = p_cycle
          and assignment.employee_id = employee.id
      )
  ) then
    raise exception 'The eligible roster changed; refresh the roster before approving';
  end if;

  if exists (
    select 1
    from public.cycle_employee_assignments assignment
    join public.profiles employee on employee.id = assignment.employee_id
    where assignment.cycle_id = p_cycle
      and (
        not private.employee_is_eligible_for_cycle(p_cycle, assignment.employee_id)
        or assignment.supervisor_id is distinct from employee.manager_id
      )
  ) then
    raise exception 'An employee, joining date, or supervisor changed; refresh the roster';
  end if;

  if exists (
    select 1
    from public.cycle_employee_assignments assignment
    where assignment.cycle_id = p_cycle
      and (
        assignment.hr_partner_id is null
        or not private.hr_candidate(
          p_cycle,
          assignment.employee_id,
          assignment.hr_partner_id
        )
      )
  ) then
    raise exception 'Resolve every missing or ineligible HRBP assignment first';
  end if;

  if exists (
    select 1
    from public.cycle_hrbp_pool pool
    where pool.cycle_id = p_cycle
      and (
        select count(*)
        from public.cycle_employee_assignments assignment
        where assignment.cycle_id = p_cycle
          and assignment.hr_partner_id = pool.hr_partner_id
      ) > pool.capacity
  ) then
    raise exception 'An HRBP exceeds their cycle capacity';
  end if;
end;
$function$;

create or replace function private.enrol_profile_in_review_cycles()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
declare
  cycle public.review_cycles;
  assigned_hr uuid;
begin
  if tg_op = 'UPDATE' then
    delete from public.cycle_employee_assignments assignment
    using public.review_cycles draft_cycle
    where assignment.cycle_id = draft_cycle.id
      and assignment.employee_id = new.id
      and draft_cycle.status = 'draft'
      and not private.employee_is_eligible_for_cycle(draft_cycle.id, new.id);
  end if;

  for cycle in
    select *
    from public.review_cycles
    where status in ('draft', 'active')
      and private.employee_is_eligible_for_cycle(id, new.id)
  loop
    insert into public.cycle_employee_assignments (
      cycle_id,
      employee_id,
      employee_name,
      employee_number,
      department_id,
      department_name,
      supervisor_id,
      project_ids,
      hr_partner_id,
      reason
    )
    values (
      cycle.id,
      new.id,
      new.full_name,
      new.employee_number,
      new.department_id,
      (select department.name
       from public.departments department
       where department.id = new.department_id),
      new.manager_id,
      array(
        select member.project_id
        from public.project_members member
        where member.user_id = new.id
      ),
      new.hr_partner_id,
      'Automatically enrolled from joining date'
    )
    on conflict (cycle_id, employee_id) do update
    set
      employee_name = excluded.employee_name,
      employee_number = excluded.employee_number,
      department_id = excluded.department_id,
      department_name = excluded.department_name,
      supervisor_id = excluded.supervisor_id,
      project_ids = excluded.project_ids,
      hr_partner_id = coalesce(
        cycle_employee_assignments.hr_partner_id,
        excluded.hr_partner_id
      );

    if cycle.status = 'active' then
      select assignment.hr_partner_id into assigned_hr
      from public.cycle_employee_assignments assignment
      where assignment.cycle_id = cycle.id
        and assignment.employee_id = new.id;

      insert into public.reviews (
        cycle_id,
        employee_id,
        supervisor_id,
        hr_partner_id,
        status,
        due_date,
        created_by
      )
      values (
        cycle.id,
        new.id,
        new.manager_id,
        coalesce(assigned_hr, new.hr_partner_id),
        'not_started',
        coalesce(cycle.self_review_due, cycle.end_date),
        cycle.created_by
      )
      on conflict (cycle_id, employee_id) do nothing;
    end if;
  end loop;

  return new;
end;
$function$;

drop trigger if exists enrol_profile_in_review_cycles on public.profiles;
create trigger enrol_profile_in_review_cycles
after insert or update of
  joined_on,
  is_active,
  role,
  manager_id,
  hr_partner_id,
  department_id,
  full_name,
  employee_number
on public.profiles
for each row execute function private.enrol_profile_in_review_cycles();

create or replace function private.create_reviews_for_activated_cycle()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
begin
  if new.status = 'active'
     and (tg_op = 'INSERT' or old.status is distinct from new.status) then
    insert into public.reviews (
      cycle_id,
      employee_id,
      supervisor_id,
      hr_partner_id,
      status,
      due_date,
      created_by
    )
    select
      new.id,
      assignment.employee_id,
      assignment.supervisor_id,
      assignment.hr_partner_id,
      'not_started',
      coalesce(new.self_review_due, new.end_date),
      new.created_by
    from public.cycle_employee_assignments assignment
    where assignment.cycle_id = new.id
      and private.employee_is_eligible_for_cycle(new.id, assignment.employee_id)
    on conflict (cycle_id, employee_id) do nothing;
  end if;

  return new;
end;
$function$;

drop trigger if exists create_reviews_for_activated_cycle
  on public.review_cycles;
create trigger create_reviews_for_activated_cycle
after insert or update of status on public.review_cycles
for each row execute function private.create_reviews_for_activated_cycle();

insert into public.reviews (
  cycle_id,
  employee_id,
  supervisor_id,
  hr_partner_id,
  status,
  due_date,
  created_by
)
select
  cycle.id,
  assignment.employee_id,
  assignment.supervisor_id,
  assignment.hr_partner_id,
  'not_started',
  coalesce(cycle.self_review_due, cycle.end_date),
  cycle.created_by
from public.review_cycles cycle
join public.cycle_employee_assignments assignment
  on assignment.cycle_id = cycle.id
where cycle.status = 'active'
  and private.employee_is_eligible_for_cycle(cycle.id, assignment.employee_id)
on conflict (cycle_id, employee_id) do nothing;
