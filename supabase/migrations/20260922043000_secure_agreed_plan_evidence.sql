-- Evidence belongs to the plan owner and is accepted only after both parties
-- have agreed to the plan. HRBPs and supervisors retain scoped read access.
create or replace function private.can_submit_plan_evidence(target_plan_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select auth.uid()) is not null
    and exists (
      select 1
      from public.development_plans plan
      where plan.id = target_plan_id
        and plan.employee_id = (select auth.uid())
        and plan.employee_agreement_status = 'agreed'
        and plan.supervisor_agreement_status = 'agreed'
    )
$$;

revoke all on function private.can_submit_plan_evidence(uuid) from public, anon;
grant execute on function private.can_submit_plan_evidence(uuid) to authenticated;

drop policy if exists development_plan_evidence_insert_authorized on public.development_plan_evidence;
create policy development_plan_evidence_insert_authorized
on public.development_plan_evidence
for insert
to authenticated
with check (
  uploaded_by = (select auth.uid())
  and (select private.can_submit_plan_evidence(plan_id))
);

drop policy if exists goal_evidence_objects_insert_authorized on storage.objects;
create policy goal_evidence_objects_insert_authorized
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'goal-evidence'
  and (storage.foldername(name))[2] = (select auth.uid())::text
  and (select private.can_submit_plan_evidence(((storage.foldername(name))[1])::uuid))
);

alter table public.development_plan_evidence
  drop constraint if exists development_plan_evidence_file_type_valid;
alter table public.development_plan_evidence
  add constraint development_plan_evidence_file_type_valid
  check (
    lower(file_name) ~ '\.(pdf|doc|docx|txt)$'
    and mime_type in (
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    )
  ) not valid;

update storage.buckets
set allowed_mime_types = array[
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain'
]
where id = 'goal-evidence';
