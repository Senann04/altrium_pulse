-- Accept new evidence uploads only when their filenames use a supported extension.
-- Keep the constraint NOT VALID so an older QA-only PNG row does not block rollout;
-- PostgreSQL still enforces the rule for every new or updated row.
alter table public.development_plan_evidence
  drop constraint if exists development_plan_evidence_new_extension_valid;

alter table public.development_plan_evidence
  add constraint development_plan_evidence_new_extension_valid
  check (
    lower(file_name) like '%.pdf'
    or lower(file_name) like '%.docx'
    or lower(file_name) like '%.txt'
  )
  not valid;
