-- Run this in Supabase SQL Editor to add subscriber lifecycle columns
alter table subscribers add column if not exists status text default 'active';
alter table subscribers add column if not exists unsubscribed_at timestamptz;
alter table subscribers add column if not exists resubscribed_at timestamptz;
alter table subscribers add column if not exists subscription_count integer default 1;

-- Backfill existing rows
update subscribers set status = 'active' where status is null;
