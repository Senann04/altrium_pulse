-- Track Altrium-owned calendar entries separately from personal events so
-- reconnecting or re-syncing updates the same Google event instead of
-- creating duplicates.
alter table public.personal_calendar_events
  add column if not exists source_key text,
  add column if not exists source_type text,
  add column if not exists is_system boolean not null default false;

create unique index if not exists personal_calendar_events_owner_source_idx
  on public.personal_calendar_events(owner_id, source_key);

drop policy if exists personal_calendar_events_own_insert on public.personal_calendar_events;
create policy personal_calendar_events_own_insert on public.personal_calendar_events
for insert to authenticated
with check (
  owner_id = (select auth.uid())
  and not is_system
  and source_key is null
  and source_type is null
);

drop policy if exists personal_calendar_events_own_update on public.personal_calendar_events;
create policy personal_calendar_events_own_update on public.personal_calendar_events
for update to authenticated
using (owner_id = (select auth.uid()) and not is_system)
with check (
  owner_id = (select auth.uid())
  and not is_system
  and source_key is null
  and source_type is null
);

drop policy if exists personal_calendar_events_own_delete on public.personal_calendar_events;
create policy personal_calendar_events_own_delete on public.personal_calendar_events
for delete to authenticated
using (owner_id = (select auth.uid()) and not is_system);

grant select, insert, update on table public.personal_calendar_events to service_role;
