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
    .select("id, title, description, starts_at, ends_at, google_event_id, google_html_link")
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
  }).select("id, title, description, starts_at, ends_at, google_event_id, google_html_link").single();
  if (error) throw error;
  return data;
}

async function invokeGoogleCalendar(body) {
  if (!supabase) throw new Error("Supabase is not configured.");
  const { data, error } = await supabase.functions.invoke("google-calendar-events", { body });
  if (error) {
    let message = error.message;
    try {
      const responseBody = await error.context?.json();
      if (responseBody?.error) message = responseBody.error;
    } catch {
      // Keep Supabase's fallback error when the response body is unavailable.
    }
    throw new Error(message);
  }
  if (data?.error) throw new Error(data.error);
  return data;
}

export async function getGoogleCalendarConnection() {
  try {
    return await invokeGoogleCalendar({ action: "status" });
  } catch (error) {
    return { connected: false, configured: false, error: error.message };
  }
}

export async function beginGoogleCalendarConnection() {
  if (!supabase) throw new Error("Supabase is not configured.");
  const { data, error } = await supabase.functions.invoke("google-calendar-auth", {
    body: { returnOrigin: window.location.origin },
  });
  if (error) throw error;
  if (!data?.url) throw new Error(data?.error || "Google Calendar connection is unavailable.");
  window.location.assign(data.url);
}

export async function syncEventToGoogle(eventId) {
  return invokeGoogleCalendar({ action: "sync", eventId });
}

export async function disconnectGoogleCalendar() {
  return invokeGoogleCalendar({ action: "disconnect" });
}

function googleDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

export function googleCalendarUrl(event) {
  const start = event.starts_at || event.startsAt;
  const startDate = new Date(start);
  const fallbackEnd = Number.isNaN(startDate.getTime()) ? "" : new Date(startDate.getTime() + 60 * 60 * 1000).toISOString();
  const end = event.ends_at || event.endsAt || fallbackEnd;
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: event.title,
    details: event.description || "Scheduled from Altrium Pulse",
  });
  const googleStart = googleDate(start);
  const googleEnd = googleDate(end);
  if (googleStart && googleEnd) params.set("dates", `${googleStart}/${googleEnd}`);
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
