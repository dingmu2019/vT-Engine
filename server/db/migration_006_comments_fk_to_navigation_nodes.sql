-- ------------------------------------------------------------------------
-- Migration: migration_006_comments_fk_to_navigation_nodes.sql
-- Desc    : comments.module_key 外键改为引用 navigation_nodes.key（功能全景树菜单）
-- ------------------------------------------------------------------------

alter table if exists public.comments
  drop constraint if exists comments_module_key_fkey;

alter table if exists public.comments
  add constraint comments_module_key_fkey
  foreign key (module_key) references public.navigation_nodes(key) on delete cascade;

