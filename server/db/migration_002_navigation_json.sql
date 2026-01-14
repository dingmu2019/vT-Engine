-- Create navigation table for storing the full JSON tree
create table if not exists navigation (
  id text primary key,
  tree jsonb,
  updated_at timestamptz default now()
);

-- Policy (permissive for dev)
alter table navigation enable row level security;
create policy "Enable all access for service role" on navigation for all using (true) with check (true);
