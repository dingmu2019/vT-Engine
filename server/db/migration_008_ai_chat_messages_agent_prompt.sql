-- ------------------------------------------------------------------------
-- Migration: migration_008_ai_chat_messages_agent_prompt.sql
-- Desc    : AI聊天消息补齐 agent_id / prompt_label 字段以记录当前AI助理与提示词标签
-- ------------------------------------------------------------------------

alter table if exists public.ai_chat_messages
  add column if not exists agent_id text not null default 'agent_1' references public.agents(key);

alter table if exists public.ai_chat_messages
  add column if not exists prompt_label text;

create index if not exists idx_ai_chat_messages_agent_id
  on public.ai_chat_messages (agent_id);

comment on column public.ai_chat_messages.agent_id is '当前AI助理业务ID(agents.key)';
comment on column public.ai_chat_messages.prompt_label is '当前提示词标签: 对应 agent_prompts.label，可为空';

