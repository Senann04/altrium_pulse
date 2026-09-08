-- Restore the Data API table grant required by authenticated profile loading.
-- Row-level security remains the authorization boundary for visible feedback rows.

alter table public.review_feedback enable row level security;

grant select on table public.review_feedback to authenticated;
