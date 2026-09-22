create table if not exists public.google_calendar_connections (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  google_email text not null,
  access_token_ciphertext text not null,
  refresh_token_ciphertext text,
  token_expires_at timestamptz,
  scopes text[] not null default '{}',
  connected_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.google_calendar_connections enable row level security;
revoke all on public.google_calendar_connections from public, anon, authenticated;
grant all on public.google_calendar_connections to service_role;

alter table public.personal_calendar_events
  add column if not exists google_event_id text,
  add column if not exists google_html_link text,
  add column if not exists google_synced_at timestamptz;

create unique index if not exists personal_calendar_events_google_event_idx
  on public.personal_calendar_events(owner_id, google_event_id)
  where google_event_id is not null;
