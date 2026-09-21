import { adminClient, authenticatedUser, corsHeaders, decrypt, encrypt, errorMessage, json, refreshAccessToken } from "../_shared/google-calendar.ts";

declare const Deno: { serve(handler: (req: Request) => Response | Promise<Response>): void };

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const user = await authenticatedUser(req);
    const body = await req.json();
    const admin = adminClient();
    const { data: connection, error: connectionError } = await admin.from("google_calendar_connections").select("*").eq("user_id", user.id).maybeSingle();
    if (connectionError) throw connectionError;
    if (body.action === "status") return json({ configured: true, connected: Boolean(connection), email: connection?.google_email || null });
    if (body.action === "disconnect") {
      if (connection) {
        const accessToken = await decrypt(connection.access_token_ciphertext);
        await fetch(`https://oauth2.googleapis.com/revoke?token=${encodeURIComponent(accessToken)}`, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" } }).catch(() => null);
        const { error } = await admin.from("google_calendar_connections").delete().eq("user_id", user.id); if (error) throw error;
      }
      return json({ connected: false });
    }
    if (body.action !== "sync" || !body.eventId) return json({ error: "Unsupported calendar action" }, 400);
    if (!connection) return json({ error: "Connect Google Calendar first" }, 409);
    const { data: event, error: eventError } = await admin.from("personal_calendar_events").select("*").eq("id", body.eventId).eq("owner_id", user.id).single();
    if (eventError) throw eventError;
    if (event.google_event_id) return json({ googleEventId: event.google_event_id, htmlLink: event.google_html_link });
    let accessToken = await decrypt(connection.access_token_ciphertext);
    if (!connection.token_expires_at || new Date(connection.token_expires_at).getTime() < Date.now() + 60_000) {
      if (!connection.refresh_token_ciphertext) throw new Error("Reconnect Google Calendar to continue syncing");
      const refreshed = await refreshAccessToken(await decrypt(connection.refresh_token_ciphertext));
      accessToken = refreshed.access_token;
      await admin.from("google_calendar_connections").update({ access_token_ciphertext: await encrypt(accessToken), token_expires_at: new Date(Date.now() + Number(refreshed.expires_in || 3600) * 1000).toISOString(), updated_at: new Date().toISOString() }).eq("user_id", user.id);
    }
    const response = await fetch("https://www.googleapis.com/calendar/v3/calendars/primary/events", {
      method: "POST", headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({ summary: event.title, description: event.description || "Scheduled from Altrium Pulse", start: { dateTime: event.starts_at }, end: { dateTime: event.ends_at }, extendedProperties: { private: { altriumEventId: event.id } } }),
    });
    const googleEvent = await response.json();
    if (!response.ok) throw new Error(googleEvent.error?.message || "Unable to create the Google Calendar event");
    const { error: updateError } = await admin.from("personal_calendar_events").update({ google_event_id: googleEvent.id, google_html_link: googleEvent.htmlLink, google_synced_at: new Date().toISOString() }).eq("id", event.id).eq("owner_id", user.id);
    if (updateError) throw updateError;
    return json({ googleEventId: googleEvent.id, htmlLink: googleEvent.htmlLink });
  } catch (error) { const message = errorMessage(error); return json({ error: message }, message === "Authentication required" ? 401 : 400); }
});
