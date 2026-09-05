-- Cover foreign keys introduced by the performance-workflow migration.
create index if not exists review_cycle_administrators_assigned_by_idx
  on public.review_cycle_administrators(assigned_by);
create index if not exists projects_created_by_idx
  on public.projects(created_by);
create index if not exists project_members_assigned_by_idx
  on public.project_members(assigned_by);
create index if not exists hr_partner_projects_assigned_by_idx
  on public.hr_partner_projects(assigned_by);
create index if not exists normalization_decisions_decided_by_idx
  on public.normalization_decisions(decided_by);

