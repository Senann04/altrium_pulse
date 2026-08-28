alter table public.review_cycles
  add column review_type text,
  add column applies_to text not null default 'both';

alter table public.review_cycles
  add constraint review_cycles_applies_to_valid
  check (applies_to in ('employee', 'supervisor', 'both'));

alter table public.development_plans
  add column progress smallint not null default 0,
  add column evidence text;

alter table public.development_plans
  add constraint development_plans_progress_valid
  check (progress between 0 and 100);

alter table public.goals
  add column period text;

alter table public.goals
  add constraint goals_period_valid
  check (period is null or period in ('weekly', 'monthly', 'yearly'));

do $$
begin
  if not exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where n.nspname = 'public'
      and t.typname = 'par_meeting_status'
  ) then
    create type public.par_meeting_status as enum (
      'scheduled',
      'completed',
      'cancelled'
    );
  end if;
end;
$$;

create table public.par_meetings (
  id uuid primary key default gen_random_uuid(),
  review_id uuid not null unique references public.reviews(id) on delete cascade,
  employee_id uuid not null references public.profiles(id) on delete cascade,
  supervisor_id uuid not null references public.profiles(id) on delete cascade,
  scheduled_at timestamptz not null,
  status public.par_meeting_status not null default 'scheduled',
  notes text,
  created_by uuid not null default auth.uid() references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index par_meetings_employee_id_idx
  on public.par_meetings(employee_id);
create index par_meetings_supervisor_id_idx
  on public.par_meetings(supervisor_id);
create index par_meetings_scheduled_at_idx
  on public.par_meetings(scheduled_at);

create trigger par_meetings_set_updated_at
before update on public.par_meetings
for each row execute function private.set_updated_at();

create or replace function private.prepare_par_meeting()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  review_employee uuid;
  review_supervisor uuid;
begin
  select r.employee_id, r.supervisor_id
    into review_employee, review_supervisor
  from public.reviews r
  where r.id = new.review_id;

  if review_employee is null then
    raise exception 'Review not found for PAR meeting';
  end if;

  if review_supervisor is null then
    raise exception 'A supervisor must be assigned before scheduling a PAR meeting';
  end if;

  new.employee_id = review_employee;
  new.supervisor_id = review_supervisor;

  if tg_op = 'INSERT' then
    new.created_by = (select auth.uid());
  else
    new.created_by = old.created_by;
    new.created_at = old.created_at;
  end if;

  return new;
end;
$$;

revoke all on function private.prepare_par_meeting()
  from public, anon, authenticated;

create trigger par_meetings_prepare_write
before insert or update on public.par_meetings
for each row execute function private.prepare_par_meeting();

alter table public.par_meetings enable row level security;

revoke all on public.par_meetings from anon;
revoke all on public.par_meetings from authenticated;
grant select, insert, update, delete on public.par_meetings to authenticated;
grant usage on type public.par_meeting_status to authenticated;

create policy par_meetings_select_authorized
on public.par_meetings
for select
to authenticated
using (
  (select auth.uid()) is not null
  and (
    employee_id = (select auth.uid())
    or supervisor_id = (select auth.uid())
    or (select private.can_manage_review(review_id))
  )
);

create policy par_meetings_insert_management
on public.par_meetings
for insert
to authenticated
with check (
  created_by = (select auth.uid())
  and (select private.can_manage_review(review_id))
);

create policy par_meetings_update_management
on public.par_meetings
for update
to authenticated
using ((select private.can_manage_review(review_id)))
with check ((select private.can_manage_review(review_id)));

create policy par_meetings_delete_management
on public.par_meetings
for delete
to authenticated
using ((select private.can_manage_review(review_id)));

grant update (
  title,
  description,
  owner_id,
  due_date,
  status,
  completed_at
) on public.development_plan_actions to authenticated;

drop policy review_feedback_insert_assigned_reviewer
  on public.review_feedback;

create policy review_feedback_insert_assigned_reviewer
on public.review_feedback
for insert
to authenticated
with check (
  reviewer_id = (select auth.uid())
  and exists (
    select 1
    from public.feedback_requests request
    where request.id = review_feedback.request_id
      and request.review_id = review_feedback.review_id
      and request.reviewer_id = (select auth.uid())
      and request.status = 'pending'::public.feedback_request_status
  )
);
