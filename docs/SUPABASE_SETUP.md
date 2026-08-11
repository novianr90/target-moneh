# Supabase Setup & Workflow (TargetMoneh)

**Version:** 1.0.0
**Reference:** [PRD-Personal-Savings-Tracker.md](PRD-Personal-Savings-Tracker.md)

This document defines how to initialize, configure, and develop against the Supabase backend for TargetMoneh, adhering to best practices.

---

## 1. Local Development Setup

We use the Supabase CLI for local development to ensure a deterministic database state and to avoid breaking production.

### Prerequisites
1. Docker Desktop installed and running.
2. Supabase CLI installed (`npm i -g supabase` or via brew/choco).

### Initialization
```bash
# Start the local Supabase stack
supabase start

# This will output your local API keys and Studio URL.
# Local Studio is usually at http://127.0.0.1:54323
```

---

## 2. Environment Variables

Create a `.env` or `.env.local` file in your SvelteKit root. **Never commit this file.**

```env
# Client-side accessible variables (Vite requires VITE_ prefix for SvelteKit)
VITE_SUPABASE_URL=http://127.0.0.1:54321
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Server-side ONLY variables
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## 3. Database Migration Workflow (Imperative)

TargetMoneh uses imperative migrations. Do not make schema changes directly in the Supabase Studio UI without generating a migration file.

### Making Changes
1. Create a new migration file:
   ```bash
   supabase migration new <descriptive_name>
   ```
2. Open the newly generated file in `supabase/migrations/<timestamp>_<descriptive_name>.sql`.
3. Write the SQL schema changes.
4. Apply the changes to your local database:
   ```bash
   supabase db reset
   ```
   *(Note: `db reset` applies all migrations from scratch. Use `supabase migration up` if you just want to apply the newest one without wiping data).*

### Using `execute_sql` (Alternative approach during prototyping)
If prototyping via `execute_sql` directly to the DB, once satisfied, you must pull the changes into a migration:
```bash
supabase db pull <descriptive-name> --local
```

---

## 4. Seeding Data

To ensure smooth local development, populate `supabase/seed.sql` with test users, accounts, and targets.
This file automatically executes whenever you run `supabase db reset`.

*Note: Since auth users are handled via the GoTrue auth schema, seeding users requires direct insertion into `auth.users`, which can be complex. Alternatively, create users manually via the local Supabase Studio UI and add their UUIDs to your seed script.*

---

## 5. Deploying to Production

When ready to deploy the schema to your hosted Supabase project:

1. Link your local project to the hosted project:
   ```bash
   supabase link --project-ref <your-project-ref>
   ```
2. Push all migrations:
   ```bash
   supabase db push
   ```
3. Deploy Edge Functions (if using Spreadsheet Sync):
   ```bash
   supabase functions deploy sync-savings
   supabase secrets set --env-file ./supabase/.env.production
   ```
