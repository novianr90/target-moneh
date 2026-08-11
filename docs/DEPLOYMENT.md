# Deployment & Release Guide (TargetMoneh)

**Version:** 1.0.0
**Reference:** [PRD-Personal-Savings-Tracker.md](PRD-Personal-Savings-Tracker.md)

This document covers the end-to-end deployment strategy for TargetMoneh to a production environment.

---

## 1. Hosting Infrastructure

- **Frontend / Meta-framework:** Vercel (recommended for SvelteKit zero-config deployments) or Node.js Docker container (if self-hosting).
- **Backend / Database:** Supabase Cloud (hosted).

---

## 2. Environment Configuration

### Supabase Production Variables
You must set up your Supabase project in the Supabase Dashboard and obtain your production keys.

### Vercel Environment Variables
In your Vercel Project Settings, add the following Environment Variables:

```env
PUBLIC_SUPABASE_URL=https://<your-project-id>.supabase.co
PUBLIC_SUPABASE_ANON_KEY=eyJhb...
# Note: In SvelteKit, use the prefix expected by your config (e.g. VITE_ or PUBLIC_)
```

---

## 3. Deployment Sequence

### Step 1: Database Deployment
1. Link your local project to production:
   ```bash
   supabase link --project-ref <production-ref>
   ```
2. Push migrations to apply the schema, views, and RLS policies:
   ```bash
   supabase db push
   ```

### Step 2: Edge Function Deployment
1. Set the Google Apps Script secrets on the Supabase production environment:
   ```bash
   supabase secrets set GAS_WEB_APP_URL="https://script.google.com/..."
   supabase secrets set GAS_API_KEY="YOUR_KEY"
   ```
2. Deploy the edge function:
   ```bash
   supabase functions deploy sync-savings
   ```

### Step 3: Frontend Deployment (Vercel)
1. Push your code to GitHub.
2. Connect your GitHub repository to Vercel.
3. Ensure the Build Command is `npm run build` and the Output Directory is `.svelte-kit` (Vercel auto-detects SvelteKit).
4. Vercel will build and deploy the application.

---

## 4. Disaster Recovery (DR)

### Database Backups
- Supabase provides automated daily backups for Pro tier projects.
- Point-in-Time Recovery (PITR) is highly recommended to roll back accidental transaction deletions.

### Manual Data Export
Since the Google Sheet synchronization is essentially a full-state export of balances and transaction logs, the Google Sheet inherently acts as a continuous, human-readable off-site backup. If the Supabase database is completely lost, the Google Sheet logs can be used to re-seed the transaction table.
