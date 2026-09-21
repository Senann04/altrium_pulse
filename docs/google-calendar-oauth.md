# Google Calendar OAuth setup

Altrium Pulse uses per-user Google OAuth. Users connect any Google account from the Calendar page; Altrium never receives their Google password.

## Google Cloud

1. Create or select a Google Cloud project and enable **Google Calendar API**.
2. Configure the Google Auth Platform branding and audience.
   - Use **Internal** only when every user belongs to the same Google Workspace organization.
   - Use **External** to allow personal Gmail accounts. During QA, add each tester under **Test users**.
3. Add these scopes:
   - `openid`
   - `email`
   - `https://www.googleapis.com/auth/calendar.events`
4. Create an OAuth client with application type **Web application**.
5. Add this authorized redirect URI exactly:

   `https://ubtxyglbbhtgxdyxiizo.supabase.co/functions/v1/google-calendar-callback`

## Supabase Edge Function secrets

Configure these without committing their values:

- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_OAUTH_STATE_SECRET` — a random value of at least 32 bytes
- `GOOGLE_TOKEN_ENCRYPTION_KEY` — a different random value of at least 32 bytes
- `APP_ORIGINS` — comma-separated exact production and preview origins

Deploy the functions with JWT verification enabled for `google-calendar-auth` and `google-calendar-events`. Deploy `google-calendar-callback` with JWT verification disabled because Google calls it directly after consent.

## Security behavior

- OAuth state is signed and expires after ten minutes.
- Redirect origins must match `APP_ORIGINS` exactly.
- Access and refresh tokens are AES-GCM encrypted before database storage.
- The browser has no direct privileges on the connection table.
- Each function validates the current Supabase user and event ownership.
- Disconnect revokes the Google token and removes the stored connection.
