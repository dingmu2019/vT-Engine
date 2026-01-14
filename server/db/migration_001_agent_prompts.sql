-- ==========================================
-- 9. Agent Prompts Table (Added for Persistent Prompts)
-- 说明：用于持久化存储 AI Agent 的常用提示词，支持多版本管理与复用
-- ==========================================
create table if not exists agent_prompts (
  id bigint generated always as identity primary key,               -- 主键，自增
  agent_id text not null references agents(key) on delete cascade, -- 所属 Agent 的业务主键，级联删除
  label text not null,                                             -- 提示词标签，便于快速识别
  content text not null,                                           -- 提示词正文，支持长文本
  created_by text,                                                 -- 创建人，记录操作者身份
  updated_by text,                                                 -- 最后更新人，便于审计
  created_at timestamptz default now(),                            -- 创建时间，默认当前时间
  updated_at timestamptz default now(),                            -- 更新时间，默认当前时间
  usage_count integer default 0                                    -- 被调用次数，用于热度统计
);

-- 自动更新 updated_at 触发器
create trigger update_agent_prompts_updated_at
before update on agent_prompts
for each row
execute function update_updated_at_column();

-- 中文注释
comment on table agent_prompts is 'AI Agent 常用提示词表';
comment on column agent_prompts.id is '主键，自增';
comment on column agent_prompts.agent_id is '关联 Agent 业务ID';
comment on column agent_prompts.label is '提示词标签，便于快速识别';
comment on column agent_prompts.content is '提示词正文，支持长文本';
comment on column agent_prompts.created_by is '创建人，记录操作者身份';
comment on column agent_prompts.updated_by is '最后更新人，便于审计';
comment on column agent_prompts.created_at is '创建时间，默认当前时间';
comment on column agent_prompts.updated_at is '更新时间，默认当前时间';
comment on column agent_prompts.usage_count is '使用次数，用于热度统计';

-- 启用行级安全（RLS）
alter table agent_prompts enable row level security;
-- 为 service role 开启所有权限，便于后台服务全量读写
create policy "Enable all access for service role" on agent_prompts for all using (true) with check (true);
