-- Keep the active-cycle display scope aligned with the authoritative roster.
-- Historical cycles retain the team snapshot recorded when they ran.
update public.reviews review
set department_id_snapshot = assignment.department_id,
    department_name_snapshot = assignment.department_name,
    updated_at = now()
from public.cycle_employee_assignments assignment
join public.review_cycles cycle on cycle.id = assignment.cycle_id
where review.cycle_id = assignment.cycle_id
  and review.employee_id = assignment.employee_id
  and cycle.status = 'active'
  and (
    review.department_id_snapshot is distinct from assignment.department_id
    or review.department_name_snapshot is distinct from assignment.department_name
  );
