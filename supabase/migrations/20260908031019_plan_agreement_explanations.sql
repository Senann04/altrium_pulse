alter table public.development_plans add column employee_agreement_note text, add column supervisor_agreement_note text;
create or replace function public.respond_to_plan_agreement(
  p_plan_id uuid,
  p_decision text,
  p_explanation text
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

  if p_decision = 'changes_requested' and nullif(btrim(p_explanation), '') is null then raise exception 'Explain the changes you are requesting'; end if;
  if length(p_explanation) > 2000 then raise exception 'Explanation must be 2000 characters or fewer'; end if;

  select plan.*
    into target_plan
  from public.development_plans plan
  where plan.id = p_plan_id for update;

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
      employee_agreement_note = nullif(btrim(p_explanation), ''),
      employee_agreed_at = case when p_decision = 'agreed' then now() else null end
    where id = p_plan_id
    returning * into saved;
  elsif employee_manager = (select auth.uid()) then
    update public.development_plans
    set
      supervisor_agreement_status = p_decision,
      supervisor_agreement_note = nullif(btrim(p_explanation), ''),
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
      'explanation', p_explanation,
      'employee', saved.employee_agreement_status,
      'supervisor', saved.supervisor_agreement_status
    )
  );

  return saved;
end;
$$;


revoke all on function public.respond_to_plan_agreement(uuid,text,text) from public, anon;
grant execute on function public.respond_to_plan_agreement(uuid,text,text) to authenticated;
-- Existing clients may still agree, but change requests now require an explanation.
create or replace function public.respond_to_plan_agreement(p_plan_id uuid,p_decision text)
returns public.development_plans language sql security invoker set search_path='' as $$
 select public.respond_to_plan_agreement(p_plan_id,p_decision,null::text);
$$;
