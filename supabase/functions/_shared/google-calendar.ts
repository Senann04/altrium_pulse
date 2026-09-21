// @ts-ignore Deno resolves URL imports at Edge Function deployment time.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.112.4";

declare const Deno: { env: { get(name: string): string | undefined } };

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

export function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}

export function env(name: string) {
  const value = Deno.env.get(name);
  if (!value) throw new Error(`${name} is not configured`);
  return value;
}

export function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Unexpected calendar integration error";
}

export function adminClient() {
  return createClient(env("SUPABASE_URL"), env("SUPABASE_SERVICE_ROLE_KEY"), { auth: { persistSession: false } });
}

export async function authenticatedUser(req: Request) {
  const authorization = req.headers.get("Authorization");
  if (!authorization) throw new Error("Authentication required");
  const client = createClient(env("SUPABASE_URL"), env("SUPABASE_ANON_KEY"), {
    global: { headers: { Authorization: authorization } }, auth: { persistSession: false },
  });
  const { data, error } = await client.auth.getUser();
  if (error || !data.user) throw new Error("Authentication required");
  return data.user;
}

function bytesToBase64(bytes: Uint8Array) {
  return btoa(String.fromCharCode(...bytes));
}
function base64ToBytes(value: string) {
  return Uint8Array.from(atob(value), (character) => character.charCodeAt(0));
}
async function encryptionKey() {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(env("GOOGLE_TOKEN_ENCRYPTION_KEY")));
  return crypto.subtle.importKey("raw", digest, "AES-GCM", false, ["encrypt", "decrypt"]);
}
export async function encrypt(value: string) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv }, await encryptionKey(), new TextEncoder().encode(value)));
  return `${bytesToBase64(iv)}.${bytesToBase64(ciphertext)}`;
}
export async function decrypt(value: string) {
  const [iv, ciphertext] = value.split(".").map(base64ToBytes);
  const plaintext = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, await encryptionKey(), ciphertext);
  return new TextDecoder().decode(plaintext);
}

function base64Url(bytes: Uint8Array) {
  return bytesToBase64(bytes).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}
async function stateKey() {
  return crypto.subtle.importKey("raw", new TextEncoder().encode(env("GOOGLE_OAUTH_STATE_SECRET")), { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"]);
}
export async function signState(payload: Record<string, unknown>) {
  const encoded = base64Url(new TextEncoder().encode(JSON.stringify(payload)));
  const signature = new Uint8Array(await crypto.subtle.sign("HMAC", await stateKey(), new TextEncoder().encode(encoded)));
  return `${encoded}.${base64Url(signature)}`;
}
export async function verifyState(value: string) {
  const [encoded, signature] = value.split(".");
  if (!encoded || !signature) throw new Error("Invalid OAuth state");
  const padded = signature.replaceAll("-", "+").replaceAll("_", "/") + "=".repeat((4 - signature.length % 4) % 4);
  const valid = await crypto.subtle.verify("HMAC", await stateKey(), base64ToBytes(padded), new TextEncoder().encode(encoded));
  if (!valid) throw new Error("Invalid OAuth state");
  const body = encoded.replaceAll("-", "+").replaceAll("_", "/") + "=".repeat((4 - encoded.length % 4) % 4);
  const payload = JSON.parse(new TextDecoder().decode(base64ToBytes(body)));
  if (!payload.exp || Date.now() > payload.exp) throw new Error("OAuth state expired");
  return payload;
}

export function allowedOrigin(origin: string) {
  const origins = env("APP_ORIGINS").split(",").map((item: string) => item.trim()).filter(Boolean);
  if (!origins.includes(origin)) throw new Error("Return origin is not allowed");
  return origin;
}

export function callbackUrl() {
  return `${env("SUPABASE_URL")}/functions/v1/google-calendar-callback`;
}

export async function refreshAccessToken(refreshToken: string) {
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ client_id: env("GOOGLE_CLIENT_ID"), client_secret: env("GOOGLE_CLIENT_SECRET"), refresh_token: refreshToken, grant_type: "refresh_token" }),
  });
  const body = await response.json();
  if (!response.ok) throw new Error(body.error_description || "Google authorization expired. Reconnect Google Calendar.");
  return body;
}
