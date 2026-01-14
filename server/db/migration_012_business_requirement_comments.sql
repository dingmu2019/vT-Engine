-- ------------------------------------------------------------------------
-- Migration: migration_012_business_requirement_comments.sql
-- Desc    : 业务需求评论/回复（支持 parent_id）
-- ------------------------------------------------------------------------

create table if not exists public.business_requirement_comments (
  id bigint generated always as identity primary key,
  requirement_id bigint not null references public.business_requirements(id) on delete cascade,
  parent_id bigint references public.business_requirement_comments(id) on delete cascade,
  user_id text not null,
  user_name text not null,
  user_avatar text not null default '',
  content text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index if not exists idx_business_requirement_comments_req_created_at
  on public.business_requirement_comments (requirement_id, created_at desc);
create index if not exists idx_business_requirement_comments_parent_id
  on public.business_requirement_comments (parent_id);

create trigger update_business_requirement_comments_updated_at
before update on public.business_requirement_comments
for each row
execute function public.update_updated_at_column();

comment on table public.business_requirement_comments is '业务需求评论与回复';

alter table public.business_requirement_comments enable row level security;
create policy "Enable all access for service role" on public.business_requirement_comments for all using (true) with check (true);

