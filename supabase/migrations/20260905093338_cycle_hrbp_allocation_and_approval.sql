-- Allocation permission is separate from calendar administration.
create table public.hr_assignment_administrators(user_id uuid primary key references public.profiles(id));
alter table public.hr_assignment_administrators enable row level security;
revoke all on public.hr_assignment_administrators from anon,authenticated;
grant select on public.hr_assignment_administrators to authenticated;
create policy own_assignment_permission on public.hr_assignment_administrators for select to authenticated using(user_id=(select auth.uid()));
insert into public.hr_assignment_administrators select id from public.profiles where email='leon.hrhead@example.com' and role='hr_partner' and is_active;
create function private.can_allocate_hr() returns boolean language sql stable security definer set search_path='' as $$
select exists(select 1 from public.hr_assignment_administrators a join public.profiles p on p.id=a.user_id where a.user_id=auth.uid() and p.is_active and p.role='hr_partner')
$$;
revoke all on function private.can_allocate_hr() from public,anon;
grant execute on function private.can_allocate_hr() to authenticated;
create table public.cycle_allocation_batches(cycle_id uuid primary key references public.review_cycles(id) on delete cascade,revision integer not null default 0,approved_by uuid references public.profiles(id),approved_at timestamptz);
create index cycle_allocation_approved_by_idx on public.cycle_allocation_batches(approved_by);
create table public.cycle_hrbp_pool(cycle_id uuid references public.review_cycles(id) on delete cascade,hr_partner_id uuid references public.profiles(id),available boolean not null default true,capacity integer not null default 30 check(capacity between 1 and 10000),department_ids uuid[] not null default '{}',project_ids uuid[] not null default '{}',primary key(cycle_id,hr_partner_id));
create index cycle_hrbp_pool_partner_idx on public.cycle_hrbp_pool(hr_partner_id);
create table public.cycle_employee_assignments(cycle_id uuid references public.review_cycles(id) on delete cascade,employee_id uuid references public.profiles(id),employee_name text not null,employee_number text,department_id uuid references public.departments(id),department_name text,supervisor_id uuid references public.profiles(id),project_ids uuid[] not null default '{}',hr_partner_id uuid references public.profiles(id),reason text not null default 'Awaiting allocation',primary key(cycle_id,employee_id));
create index cycle_assignments_employee_idx on public.cycle_employee_assignments(employee_id);
create index cycle_assignments_hr_idx on public.cycle_employee_assignments(hr_partner_id);
create index cycle_assignments_supervisor_idx on public.cycle_employee_assignments(supervisor_id);
create index cycle_assignments_department_idx on public.cycle_employee_assignments(department_id);
alter table public.cycle_allocation_batches enable row level security;
alter table public.cycle_hrbp_pool enable row level security;
alter table public.cycle_employee_assignments enable row level security;
revoke all on public.cycle_allocation_batches,public.cycle_hrbp_pool,public.cycle_employee_assignments from anon,authenticated;
-- Deliberately no direct-table policies: checked endpoints serve minimal allocation metadata.
create function private.hr_candidate(p_cycle uuid,p_employee uuid,p_hr uuid) returns boolean language sql stable security definer set search_path='' as $$
select exists(select 1 from public.cycle_hrbp_pool pool join public.profiles hr on hr.id=pool.hr_partner_id join public.cycle_employee_assignments a on a.cycle_id=pool.cycle_id and a.employee_id=p_employee where pool.cycle_id=p_cycle and pool.hr_partner_id=p_hr and pool.available and hr.is_active and hr.role='hr_partner' and p_hr<>p_employee and p_hr is distinct from a.supervisor_id and (a.department_id=any(pool.department_ids) or a.project_ids && pool.project_ids))
$$;
revoke all on function private.hr_candidate(uuid,uuid,uuid) from public,anon,authenticated;
create function public.get_cycle_allocation(p_cycle_id uuid) returns jsonb language plpgsql stable security definer set search_path='' as $$
begin
if not private.can_allocate_hr() then raise exception 'Only an assignment administrator can access allocation proposals';end if;
if not exists(select 1 from public.review_cycles where id=p_cycle_id) then raise exception 'Cycle not found';end if;
return jsonb_build_object(
'revision',coalesce((select revision from public.cycle_allocation_batches where cycle_id=p_cycle_id),0),
'approvedAt',(select approved_at from public.cycle_allocation_batches where cycle_id=p_cycle_id),
 'teams',coalesce((select jsonb_agg(jsonb_build_object('id',id,'name',name) order by name) from public.departments),'[]'),
 'projects',coalesce((select jsonb_agg(jsonb_build_object('id',id,'name',name) order by name) from public.projects),'[]'),
 'pool',coalesce((select jsonb_agg(to_jsonb(x) order by x.name) from (select pool.*,p.full_name as name,(select count(*) from public.cycle_employee_assignments a where a.cycle_id=p_cycle_id and a.hr_partner_id=p.id) as assigned from public.cycle_hrbp_pool pool join public.profiles p on p.id=pool.hr_partner_id where pool.cycle_id=p_cycle_id) x),'[]'),
 'employees',coalesce((select jsonb_agg(to_jsonb(x) order by x.employee_name) from (select a.*,coalesce((select jsonb_agg(pool.hr_partner_id) from public.cycle_hrbp_pool pool where pool.cycle_id=p_cycle_id and private.hr_candidate(p_cycle_id,a.employee_id,pool.hr_partner_id)),'[]') as eligible_hr_ids from public.cycle_employee_assignments a where a.cycle_id=p_cycle_id) x),'[]'));
end $$;
revoke all on function public.get_cycle_allocation(uuid) from public,anon;
grant execute on function public.get_cycle_allocation(uuid) to authenticated;
create function private.validate_cycle_allocation(p_cycle uuid) returns void language plpgsql security definer set search_path='' as $$
declare c public.review_cycles;
begin
select * into c from public.review_cycles where id=p_cycle;
if not exists(select 1 from public.cycle_employee_assignments where cycle_id=p_cycle) then raise exception 'Prepare a non-empty employee roster first';end if;
if exists(select 1 from public.profiles p where p.is_active and ((c.applies_to in ('employee','both') and p.role='employee') or (c.applies_to in ('supervisor','both') and p.role='supervisor')) and not exists(select 1 from public.cycle_employee_assignments a where a.cycle_id=p_cycle and a.employee_id=p.id)) then raise exception 'The eligible roster changed; refresh the roster before approving';end if;
if exists(select 1 from public.cycle_employee_assignments a join public.profiles p on p.id=a.employee_id where a.cycle_id=p_cycle and (not p.is_active or not ((c.applies_to in ('employee','both') and p.role='employee') or (c.applies_to in ('supervisor','both') and p.role='supervisor')) or a.supervisor_id is distinct from p.manager_id)) then raise exception 'An employee or supervisor changed; refresh the roster';end if;
if exists(select 1 from public.cycle_employee_assignments a where a.cycle_id=p_cycle and (a.hr_partner_id is null or not private.hr_candidate(p_cycle,a.employee_id,a.hr_partner_id))) then raise exception 'Resolve every missing or ineligible HRBP assignment first';end if;
if exists(select 1 from public.cycle_hrbp_pool p where p.cycle_id=p_cycle and (select count(*) from public.cycle_employee_assignments a where a.cycle_id=p_cycle and a.hr_partner_id=p.hr_partner_id)>p.capacity) then raise exception 'An HRBP exceeds their cycle capacity';end if;
end $$;
revoke all on function private.validate_cycle_allocation(uuid) from public,anon,authenticated;
create function public.update_cycle_allocation(p_cycle_id uuid,p_revision integer,p_action text,p_payload jsonb default '{}') returns jsonb language plpgsql security definer set search_path='' as $$
declare c public.review_cycles;b public.cycle_allocation_batches;person record;chosen uuid;previous uuid;hr uuid;dep uuid;ds uuid[];ps uuid[];
begin
if not private.can_allocate_hr() then raise exception 'Only an assignment administrator can change allocations';end if;
if p_action is null or p_payload is null then raise exception 'Action and payload required';end if;
select * into c from public.review_cycles where id=p_cycle_id for update;
if c.id is null or c.status<>'draft' then raise exception 'Only draft cycles can be allocated';end if;
insert into public.cycle_allocation_batches(cycle_id) values(p_cycle_id) on conflict do nothing;
select * into b from public.cycle_allocation_batches where cycle_id=p_cycle_id;
if p_revision is distinct from b.revision then raise exception 'The proposal changed in another session. Reload before continuing';end if;
if p_action='prepare' then
insert into public.cycle_hrbp_pool(cycle_id,hr_partner_id,department_ids,project_ids)
select p_cycle_id,p.id,array(select d.department_id from public.hr_partner_departments d where d.hr_partner_id=p.id),array(select j.project_id from public.hr_partner_projects j where j.hr_partner_id=p.id) from public.profiles p where p.is_active and p.role='hr_partner' on conflict do nothing;
delete from public.cycle_employee_assignments where cycle_id=p_cycle_id;
insert into public.cycle_employee_assignments(cycle_id,employee_id,employee_name,employee_number,department_id,department_name,supervisor_id,project_ids)
select p_cycle_id,p.id,p.full_name,p.employee_number,p.department_id,d.name,p.manager_id,array(select m.project_id from public.project_members m where m.user_id=p.id) from public.profiles p left join public.departments d on d.id=p.department_id where p.is_active and ((c.applies_to in ('employee','both') and p.role='employee') or (c.applies_to in ('supervisor','both') and p.role='supervisor'));
elsif p_action='pool' then
hr:=(p_payload->>'hr_partner_id')::uuid;
ds:=array(select value::uuid from jsonb_array_elements_text(coalesce(p_payload->'department_ids','[]')));
ps:=array(select value::uuid from jsonb_array_elements_text(coalesce(p_payload->'project_ids','[]')));
if exists(select 1 from unnest(ds) x(value) where not exists(select 1 from public.departments d where d.id=x.value)) or exists(select 1 from unnest(ps) x(value) where not exists(select 1 from public.projects j where j.id=x.value)) then raise exception 'Choose existing teams and projects';end if;
update public.cycle_hrbp_pool set available=(p_payload->>'available')::boolean,capacity=(p_payload->>'capacity')::integer,department_ids=ds,project_ids=ps where cycle_id=p_cycle_id and hr_partner_id=hr;
if not found then raise exception 'HRBP not in cycle pool';end if;
update public.cycle_employee_assignments set hr_partner_id=null,reason='Rules changed; regenerate proposal' where cycle_id=p_cycle_id;
elsif p_action='employee' then
dep:=nullif(p_payload->>'department_id','')::uuid;hr:=nullif(p_payload->>'hr_partner_id','')::uuid;
if dep is not null and not exists(select 1 from public.departments where id=dep) then raise exception 'Team not found';end if;
update public.cycle_employee_assignments set department_id=dep,department_name=(select name from public.departments where id=dep),hr_partner_id=null,reason='Team changed; regenerate or select an HRBP' where cycle_id=p_cycle_id and employee_id=(p_payload->>'employee_id')::uuid;
if not found then raise exception 'Employee not in this cycle';end if;
if hr is not null then
if not private.hr_candidate(p_cycle_id,(p_payload->>'employee_id')::uuid,hr) then raise exception 'HRBP is unavailable or outside this team/project scope';end if;
if (select count(*) from public.cycle_employee_assignments where cycle_id=p_cycle_id and hr_partner_id=hr)>=(select capacity from public.cycle_hrbp_pool where cycle_id=p_cycle_id and hr_partner_id=hr) then raise exception 'HRBP capacity reached';end if;
update public.cycle_employee_assignments set hr_partner_id=hr,reason='Selected by Head of HR' where cycle_id=p_cycle_id and employee_id=(p_payload->>'employee_id')::uuid;
end if;
elsif p_action not in ('generate','approve') then raise exception 'Unknown allocation action';end if;
if p_action in ('prepare','generate') then
update public.cycle_employee_assignments set hr_partner_id=null,reason='No eligible HRBP with remaining capacity' where cycle_id=p_cycle_id;
for person in select a.* from public.cycle_employee_assignments a where a.cycle_id=p_cycle_id order by (select count(*) from public.cycle_hrbp_pool pool where pool.cycle_id=p_cycle_id and private.hr_candidate(p_cycle_id,a.employee_id,pool.hr_partner_id)),a.employee_id loop
select r.hr_partner_id into previous from public.reviews r join public.review_cycles rc on rc.id=r.cycle_id where r.employee_id=person.employee_id and rc.start_date<c.start_date order by rc.start_date desc limit 1;
select pool.hr_partner_id into chosen from public.cycle_hrbp_pool pool where pool.cycle_id=p_cycle_id and private.hr_candidate(p_cycle_id,person.employee_id,pool.hr_partner_id) and (select count(*) from public.cycle_employee_assignments a where a.cycle_id=p_cycle_id and a.hr_partner_id=pool.hr_partner_id)<pool.capacity
order by (select count(*) from public.cycle_employee_assignments a where a.cycle_id=p_cycle_id and a.hr_partner_id=pool.hr_partner_id)::numeric/pool.capacity,case when pool.hr_partner_id=previous then 0 else 1 end,pool.hr_partner_id limit 1;
if chosen is not null then update public.cycle_employee_assignments set hr_partner_id=chosen,reason=case when chosen=previous then 'Eligible; balanced workload; previous HRBP retained' else 'Eligible team/project; balanced workload' end where cycle_id=p_cycle_id and employee_id=person.employee_id;end if;
end loop;
end if;
if p_action='approve' then perform private.validate_cycle_allocation(p_cycle_id);end if;
update public.cycle_allocation_batches set revision=revision+1,approved_by=case when p_action='approve' then auth.uid() end,approved_at=case when p_action='approve' then now() end where cycle_id=p_cycle_id;
perform private.write_workflow_audit('review_cycle',p_cycle_id,'allocation_'||p_action,null,null,jsonb_build_object('revision',b.revision+1,'changes',p_payload));
return public.get_cycle_allocation(p_cycle_id);
end $$;
revoke all on function public.update_cycle_allocation(uuid,integer,text,jsonb) from public,anon;
grant execute on function public.update_cycle_allocation(uuid,integer,text,jsonb) to authenticated;
-- Existing HRBP owners are retained; pre-feature team names use available directory data.
alter table public.reviews add column department_id_snapshot uuid,add column department_name_snapshot text;
update public.reviews r set department_id_snapshot=p.department_id,department_name_snapshot=d.name from public.profiles p left join public.departments d on d.id=p.department_id where p.id=r.employee_id;
create or replace function private.can_manage_review(target_review_id uuid) returns boolean language sql stable security definer set search_path='' as $$
select exists(select 1 from public.reviews r join public.profiles actor on actor.id=auth.uid() where r.id=target_review_id and actor.is_active and ((actor.role='supervisor' and r.supervisor_id=actor.id) or (actor.role='hr_partner' and r.hr_partner_id=actor.id)))
$$;
create or replace function private.can_view_review(target_review_id uuid) returns boolean language sql stable security definer set search_path='' as $$
select exists(select 1 from public.reviews r where r.id=target_review_id and (r.employee_id=auth.uid() or private.can_manage_review(r.id) or exists(select 1 from public.feedback_requests f where f.review_id=r.id and f.reviewer_id=auth.uid())))
$$;
create function private.guard_cycle_activation() returns trigger language plpgsql security definer set search_path='' as $$
begin
if new.status='active' and (tg_op='INSERT' or old.status is distinct from new.status) then
if not exists(select 1 from public.cycle_allocation_batches where cycle_id=new.id and approved_at is not null) then raise exception 'Approve HR allocations before starting the cycle';end if;
perform private.validate_cycle_allocation(new.id);end if;return new;
end $$;
revoke all on function private.guard_cycle_activation() from public,anon,authenticated;
create trigger enforce_cycle_allocation before insert or update of status on public.review_cycles for each row execute function private.guard_cycle_activation();
create or replace function private.can_manage_employee(target_user_id uuid) returns boolean language sql stable security definer set search_path='' as $$
select exists(select 1 from public.profiles actor join public.profiles employee on employee.id=target_user_id where actor.id=auth.uid() and actor.is_active and employee.is_active and (
(actor.role='supervisor' and employee.manager_id=actor.id) or (actor.role='hr_partner' and case when exists(select 1 from public.reviews r join public.review_cycles c on c.id=r.cycle_id where r.employee_id=employee.id and c.status='active') then exists(select 1 from public.reviews r join public.review_cycles c on c.id=r.cycle_id where r.employee_id=employee.id and r.hr_partner_id=actor.id and c.status='active') else private.hr_partner_manages_department(employee.department_id) or exists(select 1 from public.project_members m join public.hr_partner_projects h on h.project_id=m.project_id where m.user_id=employee.id and h.hr_partner_id=actor.id) end)))
$$;
create function private.can_manage_cycle_record(p_employee uuid,p_review uuid) returns boolean language sql stable security definer set search_path='' as $$
select case when p_review is null then private.can_manage_employee(p_employee) else exists(select 1 from public.reviews r where r.id=p_review and r.employee_id=p_employee and private.can_manage_review(r.id)) end
$$;
revoke all on function private.can_manage_cycle_record(uuid,uuid) from public,anon;
grant execute on function private.can_manage_cycle_record(uuid,uuid) to authenticated;
create or replace function private.can_manage_plan(target_plan_id uuid) returns boolean language sql stable security definer set search_path='' as $$
select exists(select 1 from public.development_plans p where p.id=target_plan_id and private.can_manage_cycle_record(p.employee_id,p.review_id))
$$;
create or replace function private.can_view_plan(target_plan_id uuid) returns boolean language sql stable security definer set search_path='' as $$
select exists(select 1 from public.development_plans p where p.id=target_plan_id and (p.employee_id=auth.uid() or private.can_manage_cycle_record(p.employee_id,p.review_id)))
$$;
create or replace function private.can_assign_peer_reviewer(target_review_id uuid,target_reviewer_id uuid) returns boolean language sql stable security definer set search_path='' as $$
select exists(select 1 from public.reviews r join public.profiles reviewer on reviewer.id=target_reviewer_id where r.id=target_review_id and r.hr_partner_id=auth.uid() and private.current_user_role()='hr_partner' and private.can_manage_review(r.id) and r.status in ('not_started','self_review','peer_feedback','reopened') and reviewer.is_active and reviewer.role in ('employee','supervisor') and reviewer.id<>r.employee_id and (
exists(select 1 from public.cycle_employee_assignments a join public.cycle_employee_assignments b on b.cycle_id=a.cycle_id where a.cycle_id=r.cycle_id and a.employee_id=r.employee_id and b.employee_id=reviewer.id and (a.department_id=b.department_id or a.project_ids && b.project_ids))
or (not exists(select 1 from public.cycle_employee_assignments a where a.cycle_id=r.cycle_id) and (reviewer.department_id=r.department_id_snapshot or exists(select 1 from public.project_members a join public.project_members b on b.project_id=a.project_id where a.user_id=r.employee_id and b.user_id=reviewer.id)))))
$$;
create function public.get_eligible_cycle_peers(p_review_id uuid) returns table(id uuid,full_name text,employee_number text,team text) language plpgsql stable security definer set search_path='' as $$
begin
if not private.can_manage_review(p_review_id) or private.current_user_role()<>'hr_partner' then raise exception 'Assigned HRBP required';end if;
return query select p.id,p.full_name,p.employee_number,coalesce(a.department_name,d.name,'Unassigned') from public.profiles p left join public.departments d on d.id=p.department_id left join public.cycle_employee_assignments a on a.employee_id=p.id and a.cycle_id=(select r.cycle_id from public.reviews r where r.id=p_review_id) where private.can_assign_peer_reviewer(p_review_id,p.id) order by p.full_name;
end $$;
revoke all on function public.get_eligible_cycle_peers(uuid) from public,anon;
grant execute on function public.get_eligible_cycle_peers(uuid) to authenticated;
create function private.prepare_new_cycle_allocation() returns trigger language plpgsql security definer set search_path='' as $$
begin
if new.status='draft' and private.can_allocate_hr() then perform public.update_cycle_allocation(new.id,0,'prepare','{}');end if;return new;
end $$;
revoke all on function private.prepare_new_cycle_allocation() from public,anon,authenticated;
create trigger prepare_cycle_hr_proposal after insert on public.review_cycles for each row execute function private.prepare_new_cycle_allocation();

create or replace function public.set_review_cycle_status(
  p_cycle_id uuid,
  p_status text
)
returns public.review_cycles
language plpgsql
security definer
set search_path = ''
as $$
declare
  cycle public.review_cycles;
  saved public.review_cycles;
begin
  perform pg_advisory_xact_lock(742019);
  if not (select private.can_administer_review_cycles()) then
    raise exception 'You are not authorized to administer review cycles';
  end if;
  if p_status not in ('active', 'closed') then
    raise exception 'Choose active or closed';
  end if;

  select * into cycle from public.review_cycles where id = p_cycle_id for update;
  if cycle.id is null then raise exception 'Review cycle not found'; end if;
  if cycle.status = 'closed'::public.review_cycle_status then
    raise exception 'A closed review cycle cannot be reopened';
  end if;
  if p_status = 'active' and cycle.status = 'active' then return cycle; end if;
  if p_status = 'active' then
    if not exists(select 1 from public.cycle_allocation_batches where cycle_id=p_cycle_id and approved_at is not null) then raise exception 'Head of HR must approve allocations before starting'; end if;
    perform private.validate_cycle_allocation(p_cycle_id);
  end if;
  if p_status = 'active' and exists (
    select 1 from public.review_cycles other_cycle
    where other_cycle.id <> p_cycle_id
      and other_cycle.status = 'active'::public.review_cycle_status
  ) then
    raise exception 'Close the current active cycle before starting another';
  end if;
  if p_status = 'closed' and exists (
    select 1 from public.reviews review
    where review.cycle_id = p_cycle_id
      and review.status <> 'completed'::public.review_status
  ) then
    raise exception 'Complete every review before closing this cycle';
  end if;

  update public.review_cycles
  set status = p_status::public.review_cycle_status
  where id = p_cycle_id
  returning * into saved;

  if p_status = 'active' then
    insert into public.reviews(cycle_id,employee_id,supervisor_id,hr_partner_id,status,due_date,created_by,department_id_snapshot,department_name_snapshot)
    select saved.id,a.employee_id,a.supervisor_id,a.hr_partner_id,'not_started'::public.review_status,coalesce(saved.supervisor_review_due,saved.end_date),auth.uid(),a.department_id,a.department_name
    from public.cycle_employee_assignments a where a.cycle_id=saved.id;

    insert into public.notifications (
      recipient_id, type, title, message, entity_type, entity_id, dedupe_key
    )
    select
      review.employee_id,
      'review_opened',
      'Self-assessment opened',
      saved.name || ' is now open. Complete your self-assessment by ' ||
        coalesce(to_char(saved.self_review_due, 'DD Mon YYYY'), 'the stated deadline') || '.',
      'review',
      review.id,
      'cycle-opened:' || review.id::text
    from public.reviews review
    where review.cycle_id = saved.id
    on conflict (dedupe_key) where dedupe_key is not null do nothing;
  end if;

  perform private.write_workflow_audit(
    'review_cycle', saved.id, 'status_' || p_status, null, null,
    jsonb_build_object('name', saved.name)
  );
  return saved;
end;
$$;

revoke all on function public.set_review_cycle_status(uuid, text) from public, anon;
grant execute on function public.set_review_cycle_status(uuid, text) to authenticated;

create or replace function public.complete_hr_review(
  p_review_id uuid,
  p_comments text,
  p_overall_rating numeric default null
)
returns public.reviews
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_review public.reviews;
  decision public.normalization_decisions;
  result public.reviews;
begin
  if (select auth.uid()) is null then
    raise exception 'Authentication required';
  end if;

  select * into current_review from public.reviews where id = p_review_id;
  if current_review.id is null
    or (select private.current_user_role()) <> 'hr_partner'::public.user_role
    or not (select private.can_manage_review(current_review.id))
  then
    raise exception 'You are not authorized to complete this review';
  end if;
  if current_review.status not in (
    'hr_review'::public.review_status,
    'reopened'::public.review_status
  ) then
    raise exception 'Review is not at the HR completion stage';
  end if;

  select * into decision
  from public.normalization_decisions
  where review_id = p_review_id and status = 'approved';
  if decision.review_id is null then
    raise exception 'An approved normalization decision is required';
  end if;
  if not exists (
    select 1 from public.par_meetings meeting
    where meeting.review_id = p_review_id
      and meeting.status = 'completed'::public.par_meeting_status
      and nullif(btrim(coalesce(meeting.notes, '')), '') is not null
  ) then
    raise exception 'A completed PAR meeting outcome is required';
  end if;

  update public.reviews
  set
    hr_comments = nullif(btrim(coalesce(p_comments, '')), ''),
    overall_rating = coalesce(p_overall_rating, decision.normalized_rating, supervisor_rating),
    status = 'completed'::public.review_status,
    completed_at = now()
  where id = p_review_id
  returning * into result;

  update public.review_feedback
  set visibility = 'employee_and_management'::public.feedback_visibility
  where review_id = p_review_id
    and feedback_type = 'peer'::public.feedback_type;

  perform private.write_workflow_audit(
    'review', result.id, 'hr_review_completed', result.id, result.employee_id,
    jsonb_build_object('overall_rating', result.overall_rating)
  );
  return result;
end;
$$;

create or replace function public.update_draft_development_plan(
  p_plan_id uuid,
  p_title text,
  p_progress integer
)
returns public.development_plans
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_plan public.development_plans;
  saved public.development_plans;
begin
  if (select auth.uid()) is null then
    raise exception 'Authentication required';
  end if;
  select * into target_plan from public.development_plans where id = p_plan_id;
  if target_plan.id is null
    or (select private.current_user_role()) <> 'hr_partner'::public.user_role
    or not (select private.can_manage_plan(target_plan.id))
  then
    raise exception 'You are not authorized to edit this development plan';
  end if;
  if target_plan.status <> 'draft'::public.plan_status
    or target_plan.employee_agreement_status <> 'pending'
    or target_plan.supervisor_agreement_status <> 'pending'
  then
    raise exception 'This plan is locked because agreement has started';
  end if;
  if nullif(btrim(coalesce(p_title, '')), '') is null then
    raise exception 'A plan objective is required';
  end if;
  if p_progress is null or p_progress < 0 or p_progress > 100 then
    raise exception 'Progress must be between 0 and 100';
  end if;

  update public.development_plans
  set title = btrim(p_title), progress = p_progress
  where id = p_plan_id
  returning * into saved;

  perform private.write_workflow_audit(
    'development_plan', saved.id, 'draft_updated', saved.review_id, saved.employee_id
  );
  return saved;
end;
$$;

create or replace function private.can_view_profile(target_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select auth.uid()) is not null
    and exists (
      select 1
      from public.profiles viewer
      join public.profiles target on target.id = target_user_id
      where viewer.id = (select auth.uid())
        and viewer.is_active = true
        and target.is_active = true
        and (
          target.id = viewer.id
          or (
            viewer.role <> 'senior_management'::public.user_role
            and (
              target.id = viewer.manager_id
              or target.id = viewer.hr_partner_id
              or (
                viewer.role in (
                  'employee'::public.user_role,
                  'supervisor'::public.user_role
                )
                and target.department_id = viewer.department_id
              )
              or target.manager_id = viewer.id
              or (select private.can_manage_employee(target.id))
              or exists(select 1 from public.reviews r where r.employee_id=target.id and private.can_manage_review(r.id))
              or exists(select 1 from public.reviews r where r.employee_id=viewer.id and (r.hr_partner_id=target.id or r.supervisor_id=target.id))
              or exists (
                select 1
                from public.feedback_requests request
                join public.reviews review on review.id = request.review_id
                where request.reviewer_id = viewer.id
                  and review.employee_id = target.id
              )
            )
          )
        )
    )
$$;

drop policy goals_select_authorized on public.goals;

drop policy goals_insert_authorized on public.goals;

drop policy goals_update_authorized on public.goals;

drop policy goals_delete_authorized on public.goals;

drop policy development_plans_select_authorized on public.development_plans;

drop policy development_plans_insert_management on public.development_plans;

drop policy development_plans_update_management on public.development_plans;

drop policy development_plans_delete_management on public.development_plans;
create policy goals_select_authorized
on public.goals
for select
to authenticated
using ((select (employee_id = (select auth.uid()) or private.can_manage_cycle_record(employee_id,review_id))));

create policy goals_insert_authorized
on public.goals
for insert
to authenticated
with check (
  created_by = (select auth.uid())
  and (
    employee_id = (select auth.uid())
    or (select private.can_manage_cycle_record(employee_id,review_id))
  )
);

create policy goals_update_authorized
on public.goals
for update
to authenticated
using (
  employee_id = (select auth.uid())
  or (select private.can_manage_cycle_record(employee_id,review_id))
)
with check (
  employee_id = (select auth.uid())
  or (select private.can_manage_cycle_record(employee_id,review_id))
);

create policy goals_delete_authorized
on public.goals
for delete
to authenticated
using (
  employee_id = (select auth.uid())
  or (select private.can_manage_cycle_record(employee_id,review_id))
);

create policy development_plans_select_authorized
on public.development_plans
for select
to authenticated
using (
  employee_id = (select auth.uid())
  or (select private.can_manage_cycle_record(employee_id,review_id))
);

create policy development_plans_insert_management
on public.development_plans
for insert
to authenticated
with check (
  created_by = (select auth.uid())
  and (select private.can_manage_cycle_record(employee_id,review_id))
);

create policy development_plans_update_management
on public.development_plans
for update
to authenticated
using ((select private.can_manage_cycle_record(employee_id,review_id)))
with check ((select private.can_manage_cycle_record(employee_id,review_id)));

create policy development_plans_delete_management
on public.development_plans
for delete
to authenticated
using ((select private.can_manage_cycle_record(employee_id,review_id)));

