# Altrium Pulse

Altrium Pulse combines the existing React/Vite frontend with the Supabase performance-review backend.

## Local setup

1. Copy `.env.example` to `.env.local`.
2. Add the Supabase project URL and publishable key.
3. Run `npm install`.
4. Run `npm run dev`.

The browser must only receive the Supabase publishable key. Never put a secret or service-role key in a `VITE_` variable.
