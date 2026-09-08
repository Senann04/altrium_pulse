-- Let HR partners record real joining dates for people in their own scope.
-- Updating the date triggers automatic cycle eligibility recalculation.

revoke execute on function private.employee_is_eligible_for_cycle(uuid, uuid)
  from authenticated;

create or replace function public.set_employee_joining_date(
  p_employee_id uuid,
  p_joined_on date
)
returns public.profiles
language plpgsql
security definer
set search_path = ''
as $function$
declare
  result public.profiles;
begin
  if (select auth.uid()) is null then
    raise exception 'Authentication required';
  end if;

  if (select private.current_user_role()) <> 'hr_partner'::public.user_role
     or not (select private.can_manage_employee(p_employee_id)) then
    raise exception 'You can only update joining dates for people in your HR scope';
  end if;

  if p_joined_on is null
     or p_joined_on < date '1900-01-01'
     or p_joined_on > current_date then
    raise exception 'Enter a valid joining date that is not in the future';
  end if;

  update public.profiles
  set joined_on = p_joined_on
  where id = p_employee_id
    and is_active
    and role in (
      'employee'::public.user_role,
      'supervisor'::public.user_role
    )
  returning * into result;

  if result.id is null then
    raise exception 'Active employee or supervisor not found';
  end if;

  return result;
end;
$function$;

revoke all on function public.set_employee_joining_date(uuid, date) from public;
grant execute on function public.set_employee_joining_date(uuid, date)
  to authenticated;
