import { supabase } from "../lib/supabase";

async function currentUser() {
  if (!supabase) throw new Error("Supabase is not configured.");
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  if (!data.user) throw new Error("Authentication required.");
  return data.user;
}

export async function listPersonalCalendarEvents() {
  const user = await currentUser();
  const { data, error } = await supabase
    .from("personal_calendar_events")
    .select("id, title, description, starts_at, ends_at")
    .eq("owner_id", user.id)
    .order("starts_at");
  if (error) throw error;
  return data || [];
}

export async function createPersonalCalendarEvent(event) {
  const user = await currentUser();
  const startsAt = new Date(event.startsAt);
  const endsAt = event.endsAt ? new Date(event.endsAt) : new Date(startsAt.getTime() + 60 * 60 * 1000);
  if (!event.title?.trim() || Number.isNaN(startsAt.getTime())) throw new Error("Add a title and valid start time.");
  if (endsAt <= startsAt) throw new Error("The end time must be after the start time.");
  const { data, error } = await supabase.from("personal_calendar_events").insert({
    owner_id: user.id,
    title: event.title.trim(),
    description: event.description?.trim() || null,
    starts_at: startsAt.toISOString(),
    ends_at: endsAt.toISOString(),
  }).select("id, title, description, starts_at, ends_at").single();
  if (error) throw error;
  return data;
}

function googleDate(value) {
  return new Date(value).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

export function googleCalendarUrl(event) {
  const start = event.starts_at || event.startsAt;
  const end = event.ends_at || event.endsAt || new Date(new Date(start).getTime() + 60 * 60 * 1000).toISOString();
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: event.title,
    dates: `${googleDate(start)}/${googleDate(end)}`,
    details: event.description || "Scheduled from Altrium Pulse",
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
