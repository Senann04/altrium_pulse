-- The normalization decision table is keyed by review_id and has no id column.
-- Keep historical decided reviews visible without referencing a non-existent key.
create or replace function public.get_normalization_queue()
returns table (
  review_id uuid, cycle_name text, employee_number text, employee_name text,
  department_name text, supervisor_rating numeric, supervisor_summary text,
  evidence_count integer, decision_status text, normalized_rating numeric,
  rationale text, decided_at timestamptz, review_status text, can_decide boolean
)
language plpgsql stable security definer set search_path = ''
as $$
begin
  if (select auth.uid()) is null
    or (select private.current_user_role()) <> 'senior_management'::public.user_role
  then
    raise exception 'You are not authorized to access normalization';
  end if;

  return query
  select review.id, cycle.name, employee.employee_number, employee.full_name,
    department.name, review.supervisor_rating, review.supervisor_summary,
    (
      select count(*)::integer
      from public.development_plan_evidence evidence
      join public.development_plans plan on plan.id = evidence.plan_id
      where plan.employee_id = review.employee_id
        and (plan.review_id = review.id or plan.review_id is null)
    ),
    coalesce(decision.status, 'pending'), decision.normalized_rating,
    decision.rationale, decision.decided_at, review.status::text,
    (review.status = 'hr_review'::public.review_status and review.supervisor_submitted_at is not null)
  from public.reviews review
  join public.review_cycles cycle on cycle.id = review.cycle_id
  join public.profiles employee on employee.id = review.employee_id
  left join public.departments department on department.id = employee.department_id
  left join public.normalization_decisions decision on decision.review_id = review.id
  where review.supervisor_submitted_at is not null
    and (
      review.status = 'hr_review'::public.review_status
      or decision.review_id is not null
    )
  order by
    case
      when review.status = 'hr_review'::public.review_status
        and coalesce(decision.status, 'pending') = 'pending'
      then 0
      else 1
    end,
    cycle.start_date desc,
    employee.full_name;
end;
$$;

revoke all on function public.get_normalization_queue() from public, anon;
grant execute on function public.get_normalization_queue() to authenticated;
