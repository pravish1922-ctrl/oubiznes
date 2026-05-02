create table if not exists tool_suggestions (
  id             uuid default gen_random_uuid() primary key,
  email          text not null,
  title          text not null,
  problem        text,
  target_user    text,
  willing_to_pay text,
  votes          integer default 1,
  status         text default 'pending',
  created_at     timestamptz default now()
);

alter table tool_suggestions enable row level security;

create policy "Allow insert" on tool_suggestions for insert with check (true);
create policy "Allow service read" on tool_suggestions for select using (true);
create policy "Allow vote update" on tool_suggestions for update using (true) with check (true);

-- Tracks one vote per email per suggestion
create table if not exists tool_suggestion_votes (
  id            uuid default gen_random_uuid() primary key,
  suggestion_id uuid references tool_suggestions(id) on delete cascade,
  email         text not null,
  created_at    timestamptz default now(),
  unique(suggestion_id, email)
);

alter table tool_suggestion_votes enable row level security;
create policy "Allow insert" on tool_suggestion_votes for insert with check (true);
create policy "Allow select" on tool_suggestion_votes for select using (true);
