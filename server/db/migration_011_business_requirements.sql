-- ------------------------------------------------------------------------
-- Migration: migration_011_business_requirements.sql
-- Desc    : 业务需求表：按菜单节点记录业务口需求条目
-- ------------------------------------------------------------------------

create table if not exists public.business_requirements (
  id bigint generated always as identity primary key,
  module_key text not null references public.navigation_nodes(key) on delete cascade,
  title text not null,
  content text not null default '',
  tags text[] not null default '{}'::text[],
  status text not null default 'open' check (status in ('open','in_progress','done','closed')),
  created_by_id text not null,
  created_by_name text not null,
  created_by_avatar text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index if not exists idx_business_requirements_module_created_at
  on public.business_requirements (module_key, created_at desc);
create index if not exists idx_business_requirements_tags
  on public.business_requirements using gin (tags);

create trigger update_business_requirements_updated_at
before update on public.business_requirements
for each row
execute function public.update_updated_at_column();

comment on table public.business_requirements is '业务需求表：按菜单节点记录业务口需求条目';

alter table public.business_requirements enable row level security;
create policy "Enable all access for service role" on public.business_requirements for all using (true) with check (true);

