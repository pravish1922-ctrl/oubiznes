alter table feature_votes add column if not exists email text;
drop policy if exists "Allow anon insert" on feature_votes;
drop policy if exists "Allow anon select" on feature_votes;
create policy "Allow anon insert" on feature_votes
  for insert to anon with check (true);
create policy "Allow anon select" on feature_votes
  for select to anon using (true);
