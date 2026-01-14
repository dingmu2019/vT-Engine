
-- ------------------------------------------------------------------------
-- Migration: migration_014_business_requirement_priority.sql
-- Desc    : 业务需求增加优先级字段
-- ------------------------------------------------------------------------

alter table if exists public.business_requirements
  add column if not exists priority text not null default 'medium'
  check (priority in ('low', 'medium', 'high', 'urgent'));

create index if not exists idx_business_requirements_priority
  on public.business_requirements (priority);

comment on column public.business_requirements.priority is '优先级: low/medium/high/urgent';

