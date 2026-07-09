# Metrics

Setup: run `supabase/migrations/001_events.sql` once in the Supabase SQL editor
(Project → SQL Editor → New query) before any of this works — it's not applied
automatically.

The app logs two event types to the `events` table via `lib/analytics.ts`:

- `upload` — fired after a batch of screenshots finishes processing (activation signal)
- `search` — fired after a successful search (retention/depth signal)

Signups aren't a custom event — they're read straight from `auth.users`, since
Supabase populates that table (including anonymous/guest sessions) regardless
of whether email confirmation is pending.

Run these directly in the Supabase SQL editor.

## Signups

```sql
select count(*) as total_signups from auth.users;

-- by week
select date_trunc('week', created_at) as week, count(*) as signups
from auth.users
group by 1
order by 1;
```

## Activation rate (% of signups that uploaded at least one screenshot)

```sql
select
  count(distinct u.id) filter (where e.user_id is not null) * 100.0
    / nullif(count(distinct u.id), 0) as activation_rate_pct
from auth.users u
left join events e on e.user_id = u.id and e.event_type = 'upload';
```

## Weekly retention (% who came back and searched a week after signing up)

```sql
select
  count(*) filter (
    where exists (
      select 1 from events e
      where e.user_id = u.id
        and e.event_type = 'search'
        and e.created_at >= u.created_at + interval '7 days'
    )
  ) * 100.0 / nullif(count(*), 0) as weekly_retention_pct
from auth.users u
where u.created_at <= now() - interval '7 days';
```

## Searches per active user per week

```sql
select
  date_trunc('week', created_at) as week,
  count(*) * 1.0 / count(distinct user_id) as searches_per_active_user
from events
where event_type = 'search'
group by 1
order by 1;
```

## Search accuracy

Tracked separately — see `evals/README.md` and `npm run eval`.
