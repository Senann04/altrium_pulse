-- The reminder scheduler starts at the 30-day checkpoint. When this feature
-- is first introduced, also notify supervisors whose deadline is already
-- inside that window so nobody misses the initial reminder.

with candidates as (
  select
    review.id as review_id,
    review.supervisor_id as recipient_id,
    supervisor.email as recipient_email,
    cycle.name as cycle_name,
    employee.full_name as employee_name
  from public.reviews review
  join public.review_cycles cycle on cycle.id = review.cycle_id
  join public.profiles employee on employee.id = review.employee_id
  join public.profiles supervisor on supervisor.id = review.supervisor_id
  where review.supervisor_id is not null
    and review.status not in ('completed', 'hr_review')
    and cycle.status = 'active'
    and coalesce(
      cycle.supervisor_review_due,
      review.due_date,
      cycle.end_date
    ) between current_date + 1 and current_date + 30
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
    'month_before',
    'in_app',
    'Employee review deadline approaching',
    candidate.employee_name || '''s review for ' ||
      candidate.cycle_name || ' is due within one month.',
    current_date,
    'sent',
    now()
  from candidates candidate
  on conflict (review_id, recipient_id, reminder_type, channel) do nothing
  returning review_id, recipient_id, subject, message
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

with candidates as (
  select
    review.id as review_id,
    review.supervisor_id as recipient_id,
    supervisor.email as recipient_email,
    cycle.name as cycle_name,
    employee.full_name as employee_name
  from public.reviews review
  join public.review_cycles cycle on cycle.id = review.cycle_id
  join public.profiles employee on employee.id = review.employee_id
  join public.profiles supervisor on supervisor.id = review.supervisor_id
  where review.supervisor_id is not null
    and supervisor.email is not null
    and review.status not in ('completed', 'hr_review')
    and cycle.status = 'active'
    and coalesce(
      cycle.supervisor_review_due,
      review.due_date,
      cycle.end_date
    ) between current_date + 1 and current_date + 30
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
  'month_before',
  'email',
  'Employee review deadline approaching',
  candidate.employee_name || '''s review for ' ||
    candidate.cycle_name || ' is due within one month.',
  current_date,
  'pending'
from candidates candidate
on conflict (review_id, recipient_id, reminder_type, channel) do nothing;
