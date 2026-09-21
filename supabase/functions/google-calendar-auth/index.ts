import { allowedOrigin, authenticatedUser, callbackUrl, corsHeaders, env, errorMessage, json, signState } from "../_shared/google-calendar.ts";

declare const Deno: { serve(handler: (req: Request) => Response | Promise<Response>): void };

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const user = await authenticatedUser(req);
    const { returnOrigin } = await req.json();
    const origin = allowedOrigin(returnOrigin);
    const state = await signState({ userId: user.id, origin, exp: Date.now() + 10 * 60 * 1000, nonce: crypto.randomUUID() });
    const params = new URLSearchParams({
      client_id: env("GOOGLE_CLIENT_ID"), redirect_uri: callbackUrl(), response_type: "code",
      scope: "openid email https://www.googleapis.com/auth/calendar.events",
      access_type: "offline", include_granted_scopes: "true", prompt: "consent", state,
    });
    return json({ url: `https://accounts.google.com/o/oauth2/v2/auth?${params}` });
  } catch (error) { const message = errorMessage(error); return json({ error: message }, message === "Authentication required" ? 401 : 400); }
});
