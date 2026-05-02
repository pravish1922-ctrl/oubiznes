create table if not exists business_profiles (
  id               uuid default gen_random_uuid() primary key,
  email            text not null,
  business_name    text,
  business_type    text,
  industry         text,
  biggest_challenge text,
  created_at       timestamptz default now()
);

alter table business_profiles enable row level security;

create policy "Allow insert" on business_profiles for insert with check (true);
create policy "Allow service read" on business_profiles for select using (true);
