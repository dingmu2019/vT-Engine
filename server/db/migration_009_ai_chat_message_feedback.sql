-- ------------------------------------------------------------------------
-- Migration: migration_009_ai_chat_message_feedback.sql
-- Desc    : AI 助理回复消息反馈(收藏/点赞/不认可)，按用户维度记录
-- ------------------------------------------------------------------------

create table if not exists public.ai_chat_message_feedback (
  id bigint generated always as identity primary key,
  message_id bigint not null references public.ai_chat_messages(id) on delete cascade,
  module_key text not null references public.navigation_nodes(key) on delete cascade,
  user_id text not null,
  favorite boolean not null default false,
  reaction text check (reaction in ('like', 'dislike')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists uniq_ai_chat_message_feedback_message_user
  on public.ai_chat_message_feedback (message_id, user_id);

create index if not exists idx_ai_chat_message_feedback_module_key
  on public.ai_chat_message_feedback (module_key);

create trigger update_ai_chat_message_feedback_updated_at
before update on public.ai_chat_message_feedback
for each row
execute function public.update_updated_at_column();

comment on table public.ai_chat_message_feedback is 'AI 助理回复反馈(收藏/点赞/不认可)，按用户维度记录';
comment on column public.ai_chat_message_feedback.message_id is '关联 ai_chat_messages.id';
comment on column public.ai_chat_message_feedback.module_key is '关联菜单节点业务ID(navigation_nodes.key)';
comment on column public.ai_chat_message_feedback.user_id is '执行反馈的用户ID';
comment on column public.ai_chat_message_feedback.favorite is '是否收藏';
comment on column public.ai_chat_message_feedback.reaction is '点赞/不认可: like/dislike/NULL';

alter table public.ai_chat_message_feedback enable row level security;
create policy "Enable all access for service role" on public.ai_chat_message_feedback for all using (true) with check (true);

