-- Decided normalization packets are immutable until HR explicitly reopens the review.
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
    (
      review.status = 'hr_review'::public.review_status
      and review.supervisor_submitted_at is not null
      and coalesce(decision.status, 'pending') = 'pending'
    )
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

create or replace function public.save_normalization_decision(
  p_review_id uuid,
  p_status text,
  p_normalized_rating numeric,
  p_rationale text
)
returns public.normalization_decisions
language plpgsql security definer set search_path = ''
as $$
declare
  target_review public.reviews;
  current_decision public.normalization_decisions;
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
  if p_status = 'approved'
    and (p_normalized_rating is null or p_normalized_rating < 0 or p_normalized_rating > 5)
  then
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

  select * into current_decision
  from public.normalization_decisions
  where review_id = p_review_id;

  if current_decision.status in ('approved', 'changes_requested') then
    raise exception 'This normalization decision is already recorded';
  end if;

  insert into public.normalization_decisions (
    review_id, status, proposed_rating, normalized_rating,
    rationale, decided_by, decided_at
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
    'normalization_decision', p_review_id, p_status, p_review_id,
    target_review.employee_id,
    jsonb_build_object('normalized_rating', saved.normalized_rating)
  );

  return saved;
end;
$$;

revoke all on function public.get_normalization_queue() from public, anon;
grant execute on function public.get_normalization_queue() to authenticated;
revoke all on function public.save_normalization_decision(uuid, text, numeric, text) from public, anon;
grant execute on function public.save_normalization_decision(uuid, text, numeric, text) to authenticated;
