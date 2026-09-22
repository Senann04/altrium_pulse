import { adminClient, allowedOrigin, callbackUrl, encrypt, env, errorMessage, verifyState } from "../_shared/google-calendar.ts";

declare const Deno: { serve(handler: (req: Request) => Response | Promise<Response>): void };

const CALENDAR_SCOPE = "https://www.googleapis.com/auth/calendar.events";

function redirect(origin: string, status: string, message?: string) {
  const url = new URL("/", origin); url.searchParams.set("google_calendar", status);
  if (message) url.searchParams.set("message", message.slice(0, 160));
  return Response.redirect(url.toString(), 302);
}

Deno.serve(async (req) => {
  let fallback = env("APP_ORIGINS").split(",")[0].trim();
  try {
    const url = new URL(req.url);
    const state = await verifyState(url.searchParams.get("state") || "");
    const origin = allowedOrigin(state.origin); fallback = origin;
    if (url.searchParams.get("error")) return redirect(origin, "cancelled", url.searchParams.get("error_description") || "Connection cancelled");
    const code = url.searchParams.get("code"); if (!code) throw new Error("Google did not return an authorization code");
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ code, client_id: env("GOOGLE_CLIENT_ID"), client_secret: env("GOOGLE_CLIENT_SECRET"), redirect_uri: callbackUrl(), grant_type: "authorization_code" }),
    });
    const tokens = await tokenResponse.json();
    if (!tokenResponse.ok) throw new Error(tokens.error_description || "Google authorization failed");
    let grantedScopes = String(tokens.scope || "").split(" ").filter(Boolean);
    if (!grantedScopes.includes(CALENDAR_SCOPE)) {
      const tokenInfoResponse = await fetch(`https://oauth2.googleapis.com/tokeninfo?access_token=${encodeURIComponent(tokens.access_token)}`);
      const tokenInfo = await tokenInfoResponse.json();
      if (tokenInfoResponse.ok) grantedScopes = String(tokenInfo.scope || "").split(" ").filter(Boolean);
    }
    if (!grantedScopes.includes(CALENDAR_SCOPE)) throw new Error("Google Calendar event access was not granted. Add the Calendar events scope and reconnect.");
    const userResponse = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", { headers: { Authorization: `Bearer ${tokens.access_token}` } });
    const googleUser = await userResponse.json();
    if (!userResponse.ok || !googleUser.email) throw new Error("Unable to read the connected Google account");
    const admin = adminClient();
    const record: Record<string, unknown> = {
      user_id: state.userId, google_email: googleUser.email,
      access_token_ciphertext: await encrypt(tokens.access_token),
      token_expires_at: new Date(Date.now() + Number(tokens.expires_in || 3600) * 1000).toISOString(),
      scopes: grantedScopes, updated_at: new Date().toISOString(),
    };
    if (tokens.refresh_token) record.refresh_token_ciphertext = await encrypt(tokens.refresh_token);
    const { error } = await admin.from("google_calendar_connections").upsert(record, { onConflict: "user_id" });
    if (error) throw error;
    return redirect(origin, "connected");
  } catch (error) { return redirect(fallback, "error", errorMessage(error)); }
});
