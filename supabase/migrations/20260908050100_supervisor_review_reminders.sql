-- Daily in-app reminders plus a provider-neutral email outbox.
-- The email rows remain pending until an approved email provider processes them.

create table if not exists public.review_reminder_deliveries (
  id uuid primary key default gen_random_uuid(),
  review_id uuid not null references public.reviews(id) on delete cascade,
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  recipient_email text,
  reminder_type text not null,
  channel text not null,
  subject text not null,
  message text not null,
  scheduled_for date not null,
  status text not null default 'pending',
  sent_at timestamptz,
  failure_message text,
  created_at timestamptz not null default now(),
  constraint review_reminder_type_valid check (
    reminder_type in (
      'month_before',
      'two_weeks',
      'one_week',
      'due_today',
      'overdue'
    )
  ),
  constraint review_reminder_channel_valid
    check (channel in ('in_app', 'email')),
  constraint review_reminder_status_valid
    check (status in ('pending', 'sent', 'failed')),
  unique (review_id, recipient_id, reminder_type, channel)
);

create index if not exists review_reminder_deliveries_recipient_idx
  on public.review_reminder_deliveries(recipient_id, scheduled_for desc);

create index if not exists review_reminder_deliveries_pending_email_idx
  on public.review_reminder_deliveries(scheduled_for, created_at)
  where channel = 'email' and status = 'pending';

alter table public.review_reminder_deliveries enable row level security;
revoke all on public.review_reminder_deliveries from anon;
revoke all on public.review_reminder_deliveries from authenticated;
grant select on public.review_reminder_deliveries to authenticated;

drop policy if exists review_reminder_deliveries_select_authorized
  on public.review_reminder_deliveries;
create policy review_reminder_deliveries_select_authorized
on public.review_reminder_deliveries
for select
to authenticated
using (
  recipient_id = (select auth.uid())
  or exists (
    select 1
    from public.reviews review
    where review.id = review_id
      and review.hr_partner_id = (select auth.uid())
      and (select private.current_user_role()) = 'hr_partner'
  )
);

create or replace function private.queue_review_reminders(
  p_today date default current_date
)
returns integer
language plpgsql
security definer
set search_path = ''
as $function$
declare
  in_app_count integer := 0;
  email_count integer := 0;
begin
  with candidates as (
    select
      review.id as review_id,
      review.supervisor_id as recipient_id,
      supervisor.email as recipient_email,
      cycle.name as cycle_name,
      employee.full_name as employee_name,
      coalesce(
        cycle.supervisor_review_due,
        review.due_date,
        cycle.end_date
      ) as due_date,
      case
        when p_today = coalesce(
          cycle.supervisor_review_due,
          review.due_date,
          cycle.end_date
        ) - 30 then 'month_before'
        when p_today = coalesce(
          cycle.supervisor_review_due,
          review.due_date,
          cycle.end_date
        ) - 14 then 'two_weeks'
        when p_today = coalesce(
          cycle.supervisor_review_due,
          review.due_date,
          cycle.end_date
        ) - 7 then 'one_week'
        when p_today = coalesce(
          cycle.supervisor_review_due,
          review.due_date,
          cycle.end_date
        ) then 'due_today'
        when p_today > coalesce(
          cycle.supervisor_review_due,
          review.due_date,
          cycle.end_date
        ) then 'overdue'
      end as reminder_type
    from public.reviews review
    join public.review_cycles cycle on cycle.id = review.cycle_id
    join public.profiles employee on employee.id = review.employee_id
    join public.profiles supervisor on supervisor.id = review.supervisor_id
    where review.supervisor_id is not null
      and review.status not in ('completed', 'hr_review')
      and cycle.status = 'active'
  ), inserted as (
    insert into public.review_reminder_deliveries (
      review_id,
      recipient_id,
      recipient_email,
      reminder_type,
      channel,
      subject,
      message,
      scheduled_for,
      status,
      sent_at
    )
    select
      candidate.review_id,
      candidate.recipient_id,
      candidate.recipient_email,
      candidate.reminder_type,
      'in_app',
      case candidate.reminder_type
        when 'overdue' then 'Employee review overdue'
        when 'due_today' then 'Employee review due today'
        else 'Employee review deadline approaching'
      end,
      case candidate.reminder_type
        when 'month_before' then
          candidate.employee_name || '''s review for ' ||
          candidate.cycle_name || ' is due in one month.'
        when 'two_weeks' then
          candidate.employee_name || '''s review is due in two weeks.'
        when 'one_week' then
          candidate.employee_name || '''s review is due in one week.'
        when 'due_today' then
          candidate.employee_name || '''s review is due today.'
        else
          candidate.employee_name || '''s review is overdue.'
      end,
      p_today,
      'sent',
      now()
    from candidates candidate
    where candidate.reminder_type is not null
    on conflict (review_id, recipient_id, reminder_type, channel) do nothing
    returning
      review_id,
      recipient_id,
      reminder_type,
      subject,
      message
  )
  insert into public.notifications (
    recipient_id,
    type,
    title,
    message,
    entity_type,
    entity_id
  )
  select
    inserted.recipient_id,
    'review_reminder',
    inserted.subject,
    inserted.message,
    'review',
    inserted.review_id
  from inserted;

  get diagnostics in_app_count = row_count;

  with candidates as (
    select
      review.id as review_id,
      review.supervisor_id as recipient_id,
      supervisor.email as recipient_email,
      cycle.name as cycle_name,
      employee.full_name as employee_name,
      coalesce(
        cycle.supervisor_review_due,
        review.due_date,
        cycle.end_date
      ) as due_date,
      case
        when p_today = coalesce(
          cycle.supervisor_review_due,
          review.due_date,
          cycle.end_date
        ) - 30 then 'month_before'
        when p_today = coalesce(
          cycle.supervisor_review_due,
          review.due_date,
          cycle.end_date
        ) - 14 then 'two_weeks'
        when p_today = coalesce(
          cycle.supervisor_review_due,
          review.due_date,
          cycle.end_date
        ) - 7 then 'one_week'
        when p_today = coalesce(
          cycle.supervisor_review_due,
          review.due_date,
          cycle.end_date
        ) then 'due_today'
        when p_today > coalesce(
          cycle.supervisor_review_due,
          review.due_date,
          cycle.end_date
        ) then 'overdue'
      end as reminder_type
    from public.reviews review
    join public.review_cycles cycle on cycle.id = review.cycle_id
    join public.profiles employee on employee.id = review.employee_id
    join public.profiles supervisor on supervisor.id = review.supervisor_id
    where review.supervisor_id is not null
      and supervisor.email is not null
      and review.status not in ('completed', 'hr_review')
      and cycle.status = 'active'
  )
  insert into public.review_reminder_deliveries (
    review_id,
    recipient_id,
    recipient_email,
    reminder_type,
    channel,
    subject,
    message,
    scheduled_for,
    status
  )
  select
    candidate.review_id,
    candidate.recipient_id,
    candidate.recipient_email,
    candidate.reminder_type,
    'email',
    case candidate.reminder_type
      when 'overdue' then 'Employee review overdue'
      when 'due_today' then 'Employee review due today'
      else 'Employee review deadline approaching'
    end,
    case candidate.reminder_type
      when 'month_before' then
        candidate.employee_name || '''s review for ' ||
        candidate.cycle_name || ' is due in one month.'
      when 'two_weeks' then
        candidate.employee_name || '''s review is due in two weeks.'
      when 'one_week' then
        candidate.employee_name || '''s review is due in one week.'
      when 'due_today' then
        candidate.employee_name || '''s review is due today.'
      else
        candidate.employee_name || '''s review is overdue.'
    end,
    p_today,
    'pending'
  from candidates candidate
  where candidate.reminder_type is not null
  on conflict (review_id, recipient_id, reminder_type, channel) do nothing;

  get diagnostics email_count = row_count;
  return in_app_count + email_count;
end;
$function$;

revoke all on function private.queue_review_reminders(date)
  from public, anon, authenticated;

do $schedule$
declare
  existing_job bigint;
begin
  select jobid into existing_job
  from cron.job
  where jobname = 'altrium-review-reminders-daily';

  if existing_job is not null then
    perform cron.unschedule(existing_job);
  end if;

  perform cron.schedule(
    'altrium-review-reminders-daily',
    '5 0 * * *',
    'select private.queue_review_reminders(current_date);'
  );
end
$schedule$;
