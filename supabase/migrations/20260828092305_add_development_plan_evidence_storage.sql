create table public.development_plan_evidence (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.development_plans(id) on delete cascade,
  action_id uuid references public.development_plan_actions(id) on delete set null,
  uploaded_by uuid not null default auth.uid() references public.profiles(id),
  kind text not null,
  bucket_id text not null default 'goal-evidence',
  object_path text not null unique,
  file_name text not null,
  mime_type text,
  size_bytes bigint not null,
  created_at timestamptz not null default now(),
  constraint development_plan_evidence_kind_valid
    check (kind in ('action_item', 'evidence')),
  constraint development_plan_evidence_bucket_valid
    check (bucket_id = 'goal-evidence'),
  constraint development_plan_evidence_size_valid
    check (size_bytes between 0 and 10485760)
);

create index development_plan_evidence_plan_id_idx
  on public.development_plan_evidence(plan_id);
create index development_plan_evidence_uploaded_by_idx
  on public.development_plan_evidence(uploaded_by);

alter table public.development_plan_evidence enable row level security;

revoke all on public.development_plan_evidence from anon;
revoke all on public.development_plan_evidence from authenticated;
grant select, insert, delete on public.development_plan_evidence to authenticated;

create policy development_plan_evidence_select_authorized
on public.development_plan_evidence
for select
to authenticated
using ((select private.can_view_plan(plan_id)));

create policy development_plan_evidence_insert_authorized
on public.development_plan_evidence
for insert
to authenticated
with check (
  uploaded_by = (select auth.uid())
  and (select private.can_view_plan(plan_id))
);

create policy development_plan_evidence_delete_authorized
on public.development_plan_evidence
for delete
to authenticated
using (
  uploaded_by = (select auth.uid())
  or (select private.can_manage_plan(plan_id))
);

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'goal-evidence',
  'goal-evidence',
  false,
  10485760,
  array[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'image/jpeg',
    'image/png',
    'text/plain'
  ]
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy goal_evidence_objects_insert_authorized
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'goal-evidence'
  and (storage.foldername(name))[2] = (select auth.uid())::text
  and (select private.can_view_plan(((storage.foldername(name))[1])::uuid))
);

create policy goal_evidence_objects_select_authorized
on storage.objects
for select
to authenticated
using (
  bucket_id = 'goal-evidence'
  and (select private.can_view_plan(((storage.foldername(name))[1])::uuid))
);

create policy goal_evidence_objects_delete_authorized
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'goal-evidence'
  and (
    (storage.foldername(name))[2] = (select auth.uid())::text
    or (select private.can_manage_plan(((storage.foldername(name))[1])::uuid))
  )
);
