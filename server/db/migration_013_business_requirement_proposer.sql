-- ------------------------------------------------------------------------
-- Migration: migration_013_business_requirement_proposer.sql
-- Desc    : 业务需求补充“提出人”字段，用于记录业务口提出人（可与创建人不同）
-- ------------------------------------------------------------------------

alter table if exists public.business_requirements
  add column if not exists proposer_name text not null default '';

comment on column public.business_requirements.proposer_name is '需求提出人（业务口提出人，可与创建人不同）';

