import { adminClient, authenticatedUser, corsHeaders, decrypt, encrypt, errorMessage, json, refreshAccessToken } from "../_shared/google-calendar.ts";

declare const Deno: { serve(handler: (req: Request) => Response | Promise<Response>): void };

const CALENDAR_SCOPE = "https://www.googleapis.com/auth/calendar.events";
const GOOGLE_EVENTS_URL = "https://www.googleapis.com/calendar/v3/calendars/primary/events";

function googlePayload(event: Record<string, unknown>) {
  return {
    summary: event.title,
    description: event.description || "Scheduled from Altrium Pulse",
    start: { dateTime: event.starts_at },
    end: { dateTime: event.ends_at },
    extendedProperties: { private: { altriumEventId: event.id, altriumSourceKey: event.source_key || "" } },
  };
}

async function accessTokenFor(admin: ReturnType<typeof adminClient>, connection: Record<string, unknown>) {
  let accessToken = await decrypt(String(connection.access_token_ciphertext));
  if (!connection.token_expires_at || new Date(String(connection.token_expires_at)).getTime() < Date.now() + 60_000) {
    if (!connection.refresh_token_ciphertext) throw new Error("Reconnect Google Calendar to continue syncing");
    const refreshed = await refreshAccessToken(await decrypt(String(connection.refresh_token_ciphertext)));
    accessToken = refreshed.access_token;
    const { error } = await admin.from("google_calendar_connections").update({
      access_token_ciphertext: await encrypt(accessToken),
      token_expires_at: new Date(Date.now() + Number(refreshed.expires_in || 3600) * 1000).toISOString(),
      updated_at: new Date().toISOString(),
    }).eq("user_id", connection.user_id);
    if (error) throw error;
  }
  return accessToken;
}

async function sendToGoogle(accessToken: string, event: Record<string, unknown>) {
  const existingId = event.google_event_id ? String(event.google_event_id) : "";
  let response = await fetch(existingId ? `${GOOGLE_EVENTS_URL}/${encodeURIComponent(existingId)}` : GOOGLE_EVENTS_URL, {
    method: existingId ? "PATCH" : "POST",
    headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
    body: JSON.stringify(googlePayload(event)),
  });
  if (existingId && response.status === 404) {
    response = await fetch(GOOGLE_EVENTS_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify(googlePayload(event)),
    });
  }
  const googleEvent = await response.json();
  if (!response.ok) throw new Error(googleEvent.error?.message || "Unable to sync the Google Calendar event");
  return googleEvent;
}

function validSystemEvent(value: unknown) {
  if (!value || typeof value !== "object") return false;
  const event = value as Record<string, unknown>;
  const start = new Date(String(event.startsAt));
  const end = new Date(String(event.endsAt));
  return typeof event.sourceKey === "string" && event.sourceKey.length > 0 && event.sourceKey.length <= 250
    && typeof event.title === "string" && event.title.trim().length > 0 && event.title.trim().length <= 200
    && !Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime()) && end > start;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const user = await authenticatedUser(req);
    const body = await req.json();
    const admin = adminClient();
    const { data: connection, error: connectionError } = await admin.from("google_calendar_connections").select("*").eq("user_id", user.id).maybeSingle();
    if (connectionError) throw connectionError;
    const hasCalendarScope = Boolean(connection?.scopes?.includes(CALENDAR_SCOPE));
    if (body.action === "status") return json({
      configured: true,
      connected: Boolean(connection && hasCalendarScope),
      email: connection?.google_email || null,
      message: connection && !hasCalendarScope ? "Reconnect and grant Google Calendar event access." : null,
    });
    if (body.action === "disconnect") {
      if (connection) {
        const accessToken = await decrypt(connection.access_token_ciphertext);
        await fetch(`https://oauth2.googleapis.com/revoke?token=${encodeURIComponent(accessToken)}`, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" } }).catch(() => null);
        const { error } = await admin.from("google_calendar_connections").delete().eq("user_id", user.id); if (error) throw error;
      }
      return json({ connected: false });
    }
    if (!connection) return json({ error: "Connect Google Calendar first" }, 409);
    if (!hasCalendarScope) return json({ error: "Reconnect Google Calendar and grant permission to manage calendar events." }, 403);
    const accessToken = await accessTokenFor(admin, connection);

    if (body.action === "sync-system") {
      if (!Array.isArray(body.events) || body.events.length > 100 || body.events.some((event: unknown) => !validSystemEvent(event))) {
        return json({ error: "Assigned calendar events are invalid." }, 400);
      }
      const rows = body.events.map((event: Record<string, string>) => ({
        owner_id: user.id,
        source_key: event.sourceKey,
        source_type: String(event.sourceType || "Assignment").slice(0, 100),
        is_system: true,
        title: event.title.trim(),
        description: event.description?.trim() || null,
        starts_at: new Date(event.startsAt).toISOString(),
        ends_at: new Date(event.endsAt).toISOString(),
        updated_at: new Date().toISOString(),
      }));
      const { data: stored, error: storeError } = await admin.from("personal_calendar_events")
        .upsert(rows, { onConflict: "owner_id,source_key" })
        .select("id, title, description, starts_at, ends_at, google_event_id, google_html_link, source_key, source_type, is_system");
      if (storeError) throw storeError;
      const synced = [];
      const failed = [];
      for (const event of stored || []) {
        try {
          const googleEvent = await sendToGoogle(accessToken, event);
          const values = { google_event_id: googleEvent.id, google_html_link: googleEvent.htmlLink, google_synced_at: new Date().toISOString() };
          const { error: updateError } = await admin.from("personal_calendar_events").update(values).eq("id", event.id).eq("owner_id", user.id);
          if (updateError) throw updateError;
          synced.push({ ...event, ...values });
        } catch (syncError) {
          failed.push({ sourceKey: event.source_key, error: errorMessage(syncError) });
        }
      }
      return json({ events: synced, failed });
    }

    if (body.action !== "sync" || !body.eventId) return json({ error: "Unsupported calendar action" }, 400);
    const { data: event, error: eventError } = await admin.from("personal_calendar_events").select("*").eq("id", body.eventId).eq("owner_id", user.id).single();
    if (eventError) throw eventError;
    const googleEvent = await sendToGoogle(accessToken, event);
    const { error: updateError } = await admin.from("personal_calendar_events").update({ google_event_id: googleEvent.id, google_html_link: googleEvent.htmlLink, google_synced_at: new Date().toISOString() }).eq("id", event.id).eq("owner_id", user.id);
    if (updateError) throw updateError;
    return json({ googleEventId: googleEvent.id, htmlLink: googleEvent.htmlLink });
  } catch (error) { const message = errorMessage(error); return json({ error: message }, message === "Authentication required" ? 401 : 400); }
});
