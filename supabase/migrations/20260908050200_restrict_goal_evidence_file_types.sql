-- Existing evidence remains available. New uploads are restricted to PDF,
-- modern Word documents, and plain text files.

update storage.buckets
set
  public = false,
  file_size_limit = 10485760,
  allowed_mime_types = array[
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain'
  ]
where id = 'goal-evidence';

do $migration$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'development_plan_evidence_new_file_type_valid'
      and conrelid = 'public.development_plan_evidence'::regclass
  ) then
    alter table public.development_plan_evidence
      add constraint development_plan_evidence_new_file_type_valid
      check (
        mime_type is null
        or mime_type in (
          'application/pdf',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'text/plain'
        )
      ) not valid;
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'development_plan_evidence_new_extension_valid'
      and conrelid = 'public.development_plan_evidence'::regclass
  ) then
    alter table public.development_plan_evidence
      add constraint development_plan_evidence_new_extension_valid
      check (file_name ~* '\\.(pdf|docx|txt)$') not valid;
  end if;
end
$migration$;
