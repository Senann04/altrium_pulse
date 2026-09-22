-- Q3 predates cycle allocation approval. Its generated review owners must
-- follow the active roster so current supervisor and HRBP scope is consistent.
update public.reviews review
set supervisor_id = assignment.supervisor_id,
    hr_partner_id = assignment.hr_partner_id,
    updated_at = now()
from public.cycle_employee_assignments assignment
join public.review_cycles cycle on cycle.id = assignment.cycle_id
where review.cycle_id = assignment.cycle_id
  and review.employee_id = assignment.employee_id
  and cycle.status = 'active'
  and assignment.supervisor_id is not null
  and assignment.hr_partner_id is not null
  and (
    review.supervisor_id is distinct from assignment.supervisor_id
    or review.hr_partner_id is distinct from assignment.hr_partner_id
  );
