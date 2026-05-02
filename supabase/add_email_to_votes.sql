-- Run this in the Supabase SQL editor (one-time migration)
-- Adds email-based dedup to feature_votes

alter table feature_votes add column if not exists email text;
