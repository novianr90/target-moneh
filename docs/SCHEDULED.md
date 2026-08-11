# Scheduled Background Sync (TargetMoneh)

**Version:** 1.0.0
**Target Release:** v1.1
**Reference:** [PRD-Personal-Savings-Tracker.md](PRD-Personal-Savings-Tracker.md)

While v1.0 relies on a manual user-triggered sync via the "Sync to Sheets" button, v1.1 introduces optional automated background syncs.

---

## 1. Automated Sync Mechanism

Supabase provides the `pg_cron` extension to run scheduled tasks directly from the PostgreSQL database. We will use `pg_cron` to call the `sync-savings` Edge Function via the `pg_net` extension on a nightly basis.

### Requirements
- Supabase Project with `pg_cron` and `pg_net` extensions enabled.
- The `sync-savings` Edge Function must be deployed and configured to accept requests authorized via a service role key.

---

## 2. Enabling Extensions

```sql
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;
```

---

## 3. Creating the Cron Job

This job will execute every night at 00:00 (Midnight) UTC.

```sql
SELECT cron.schedule(
  'nightly-spreadsheet-sync',
  '0 0 * * *',
  $$
    SELECT net.http_post(
      url:='https://<project_ref>.supabase.co/functions/v1/sync-savings',
      headers:='{"Authorization": "Bearer <SERVICE_ROLE_KEY>", "Content-Type": "application/json"}'::jsonb,
      body:='{"automated": true}'::jsonb
    );
  $$
);
```

### Security Considerations for Edge Function
When the Edge Function is triggered by `pg_cron`, it does not have a user's JWT. 
The Edge Function must be modified in v1.1 to:
1. Detect that the call is from an admin (using the Service Role key).
2. Fetch *all* users who have opted into background sync.
3. Iterate through them, fetching their balances and pushing to their respective Google Sheets (if multi-user sheet URLs are stored), or just the owner's sheet.

---

## 4. Monitoring & Management

### Viewing Scheduled Jobs
```sql
SELECT * FROM cron.job;
```

### Un-scheduling the Job
```sql
SELECT cron.unschedule('nightly-spreadsheet-sync');
```
