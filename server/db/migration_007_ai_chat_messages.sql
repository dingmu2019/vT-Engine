-- ------------------------------------------------------------------------
-- Migration: migration_007_ai_chat_messages.sql
-- Desc    : 新增 AI 助理聊天消息表，用于按菜单节点分页回放聊天记录
-- ------------------------------------------------------------------------

create table if not exists public.ai_chat_messages (
  id bigint generated always as identity primary key, -- 消息ID (整型自增)
  module_key text not null references public.navigation_nodes(key) on delete cascade, -- 关联菜单节点业务ID
  agent_id text not null references public.agents(key), -- 当前AI助理(关联 agents.key)
  prompt_label text, -- 当前提示词标签(对应 agent_prompts.label，可为空)
  role text not null check (role in ('user', 'model')), -- 消息角色
  actor_id text not null, -- 发送者ID(用户ID或Agent ID)
  actor_name text not null, -- 发送者名称(用户名称或Agent 名称)
  actor_avatar text not null default '', -- 发送者头像(用户头像或Agent 头像)
  content text not null, -- 消息内容 (Markdown/纯文本)
  attachments jsonb not null default '[]'::jsonb, -- 附件(预留扩展)
  created_at timestamptz not null default now(), -- 创建时间(用于倒序分页游标)
  updated_at timestamptz not null default now(), -- 更新时间(审计字段)
  deleted_at timestamptz -- 软删除时间(非空表示已删除)
);

create index if not exists idx_ai_chat_messages_module_created_at
  on public.ai_chat_messages (module_key, created_at desc);
create index if not exists idx_ai_chat_messages_agent_id
  on public.ai_chat_messages (agent_id);

create trigger update_ai_chat_messages_updated_at
before update on public.ai_chat_messages
for each row
execute function public.update_updated_at_column();

comment on table public.ai_chat_messages is 'AI助理聊天消息表(按菜单节点分区存储，可倒序分页回放)';
comment on column public.ai_chat_messages.id is '消息主键ID(整型自增)';
comment on column public.ai_chat_messages.module_key is '关联菜单节点业务ID(navigation_nodes.key)';
comment on column public.ai_chat_messages.agent_id is '当前AI助理业务ID(agents.key)';
comment on column public.ai_chat_messages.prompt_label is '当前提示词标签: 对应 agent_prompts.label，可为空';
comment on column public.ai_chat_messages.role is '消息角色: user(用户消息), model(AI消息)';
comment on column public.ai_chat_messages.actor_id is '发送者ID(用户ID或Agent ID)';
comment on column public.ai_chat_messages.actor_name is '发送者名称(用户名称或Agent 名称)';
comment on column public.ai_chat_messages.actor_avatar is '发送者头像(用户头像或Agent 头像)';
comment on column public.ai_chat_messages.content is '消息内容(Markdown/纯文本)';
comment on column public.ai_chat_messages.attachments is '附件列表(JSON)，预留扩展';
comment on column public.ai_chat_messages.created_at is '创建时间(用于倒序分页游标)';
comment on column public.ai_chat_messages.updated_at is '更新时间(审计字段)';
comment on column public.ai_chat_messages.deleted_at is '软删除时间戳，非空代表已删除';

alter table public.ai_chat_messages enable row level security;
create policy "Enable all access for service role" on public.ai_chat_messages for all using (true) with check (true);
