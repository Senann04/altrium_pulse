create index if not exists personal_calendar_events_owner_starts_at_idx
  on public.personal_calendar_events(owner_id, starts_at);
