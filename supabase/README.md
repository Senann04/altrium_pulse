# Altrium Pulse database

This directory tracks the live Supabase database schema as versioned migrations.

## Included

- Core tables, relationships, enums, triggers, functions, and Row Level Security policies
- Security hardening and foreign-key indexes
- No database password, secret/service-role key, Auth users, or production data

## Team workflow

1. Install the Supabase CLI.
2. Start the local Supabase stack.
3. Run `supabase db reset` to recreate the schema from the migrations.
4. Regenerate frontend types after schema changes.

Do not commit `.env`, database passwords, access tokens, or service-role keys.
