-- Run this in the Supabase SQL editor (Project > SQL Editor > New query).
-- Not applied automatically — there's no migration runner wired up yet.

create table if not exists events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  event_type text not null,
  metadata jsonb,
  created_at timestamptz not null default now()
);

create index if not exists events_user_id_created_at_idx on events (user_id, created_at);
create index if not exists events_event_type_created_at_idx on events (event_type, created_at);

alter table events enable row level security;

create policy "Users can insert their own events"
  on events for insert
  with check (auth.uid() = user_id);

create policy "Users can read their own events"
  on events for select
  using (auth.uid() = user_id);
