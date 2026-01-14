
-- 启用 UUID 扩展 (用于生成唯一主键)
create extension if not exists "uuid-ossp";

-- 创建自动更新 updated_at 的函数
-- 当记录被更新时，自动将 updated_at 字段设置为当前时间
create or replace function update_updated_at_column()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

-- ==========================================
-- 1. 用户表 (Users)
-- 存储系统所有用户的基本信息
-- ==========================================
create table if not exists users (
  id bigint generated always as identity primary key, -- 用户ID (整型自增)
  key text unique not null,          -- 业务ID (原字符串ID，如 'u1')
  email text unique not null,        -- 邮箱 (唯一标识，用于登录)
  password_hash text not null,       -- 密码哈希值 (BCrypt)
  name text not null,                -- 用户真实姓名或昵称
  role text not null,                -- 角色 (Admin, PM, Expert, Dev 等)
  avatar text,                       -- 头像 URL 或 Base64
  status text default 'active',      -- 状态 (active: 激活, disabled: 禁用)
  gender text,                       -- 性别 (male, female, secret)
  phone text,                        -- 联系电话
  bio text,                          -- 个人简介
  preferences jsonb default '{}'::jsonb, -- 用户偏好设置 (主题, 语言, 时区等)
  created_by text,                   -- 创建人ID (关联 users.key)
  updated_by text,                   -- 修改人ID (关联 users.key)
  created_at timestamptz default now(), -- 创建时间 (带时区，默认为当前时间)
  updated_at timestamptz default now(), -- 最后修改时间
  deleted_at timestamptz             -- 软删除时间 (如果不为空，则表示已删除)
);

create trigger update_users_updated_at
before update on users
for each row
execute function update_updated_at_column();

comment on table users is '用户信息表';
comment on column users.id is '用户主键ID (整型)';
comment on column users.key is '用户业务ID (字符串)';
comment on column users.email is '登录邮箱';
comment on column users.password_hash is '加密后的登录密码';
comment on column users.role is '系统角色权限: Admin(管理员), PM(产品经理), Expert(业务专家), Dev(研发人员)';
comment on column users.status is '账号状态: active(激活), disabled(禁用)';
comment on column users.deleted_at is '软删除时间戳，非空代表已删除';

-- ==========================================
-- 2. 模块表 (Modules)
-- 核心业务模块数据，包含需求、逻辑、UI等所有定义
-- ==========================================
create table if not exists modules (
  id bigint generated always as identity primary key, -- 模块ID (整型自增)
  key text unique not null,          -- 业务ID (原字符串ID，如 'opportunity')
  name text not null,                -- 模块名称
  status text default 'draft',       -- 模块状态 (draft: 草稿, ready: 就绪)
  owners jsonb default '{}'::jsonb,  -- 负责人信息 (JSONB: { pm: [], dev: [], expert: [] })
  timeline jsonb default '{}'::jsonb,-- 时间线 (JSONB: { startDate, endDate })
  requirements text,                 -- 需求描述 (Markdown 格式)
  expert_requirements text,          -- 专家建议/需求 (Markdown 格式)
  logic_rules jsonb default '[]'::jsonb,    -- 业务逻辑规则集合
  knowledge jsonb default '[]'::jsonb,      -- 关联知识库条目
  ui_components jsonb default '[]'::jsonb,  -- UI 组件定义
  figma_links jsonb default '[]'::jsonb,    -- Figma 设计稿链接
  prototype_images jsonb default '[]'::jsonb, -- 原型图链接
  versions jsonb default '[]'::jsonb,       -- 版本历史记录
  logs jsonb default '[]'::jsonb,           -- 模块操作日志 (存量迁移用，新日志建议走 audit_logs)
  comments jsonb default '[]'::jsonb,       -- 评论列表
  created_by text,                   -- 创建人ID
  updated_by text,                   -- 修改人ID
  created_at timestamptz default now(), -- 创建时间
  updated_at timestamptz default now(), -- 最后更新时间 (带时区)
  deleted_at timestamptz             -- 软删除时间
);

-- 为 modules 表添加自动更新 updated_at 的触发器
create trigger update_modules_updated_at
before update on modules
for each row
execute function update_updated_at_column();

comment on table modules is '业务模块定义表';
comment on column modules.id is '模块主键ID (整型)';
comment on column modules.key is '模块业务ID (字符串)';
comment on column modules.status is '模块状态: draft(草稿), ready(已就绪/已发布)';
comment on column modules.owners is '模块负责人列表(PM/Dev/Expert)';
comment on column modules.logic_rules is '业务逻辑规则JSON';
comment on column modules.deleted_at is '软删除时间戳，非空代表已删除';

-- ==========================================
-- 3. 导航节点表 (Navigation Nodes)
-- 存储系统功能全景菜单，采用规范化结构（每节点一条记录）
-- ID 和 父节点ID 均使用整型 (bigint)
-- ==========================================
create table if not exists navigation_nodes (
  id bigint generated always as identity primary key, -- 节点ID (整型自增主键)
  parent_id bigint,                                   -- 父节点ID (整型)
  key text not null unique,                           -- 业务唯一标识 (如 'home', 'product', 用于关联模块)
  label text not null,                                -- 英文名称
  label_zh text,                                      -- 中文名称
  description text,                                   -- 节点描述 (功能说明)
  type text check (type in ('folder', 'module')),     -- 节点类型 (文件夹/模块)
  status text default 'draft',                        -- 状态 (draft: 草稿, ready: 已发布)
  icon text,                                          -- 图标代码 (Lucide Icon Name)
  sort_order integer default 0,                       -- 同级排序权重 (数值越小越靠前)
  created_by text,                                    -- 创建人ID
  updated_by text,                                    -- 修改人ID
  created_at timestamptz default now(),               -- 创建时间
  updated_at timestamptz default now(),               -- 最后修改时间
  deleted_at timestamptz                              -- 软删除时间
);

-- 创建索引以优化层级查询和排序
create index idx_navigation_parent on navigation_nodes(parent_id);
create index idx_navigation_sort on navigation_nodes(sort_order);
create index idx_navigation_key on navigation_nodes(key);

-- 为 navigation_nodes 表添加自动更新 updated_at 的触发器
create trigger update_navigation_nodes_updated_at
before update on navigation_nodes
for each row
execute function update_updated_at_column();

comment on table navigation_nodes is '系统功能全景菜单节点表';
comment on column navigation_nodes.id is '节点主键ID (整型)';
comment on column navigation_nodes.parent_id is '父节点ID (整型)，用于构建树形结构';
comment on column navigation_nodes.key is '业务唯一标识符 (字符串)，用于前端路由和模块关联';
comment on column navigation_nodes.sort_order is '同级节点排序权重(越小越靠前)';
comment on column navigation_nodes.label is '英文显示名称';
comment on column navigation_nodes.label_zh is '中文显示名称';
comment on column navigation_nodes.type is '节点类型: folder(目录文件夹), module(业务模块)';
comment on column navigation_nodes.status is '发布状态: draft(草稿), ready(已发布)';
comment on column navigation_nodes.deleted_at is '软删除时间戳，非空代表已删除';

-- ==========================================
-- 4. 评论表 (Comments)
-- 记录模块下的讨论内容，按 created_at 倒序分页加载
-- ==========================================
create table if not exists comments (
  id bigint generated always as identity primary key, -- 评论ID (整型自增)
  module_key text not null references navigation_nodes(key) on delete cascade, -- 关联菜单节点业务ID
  user_id text not null references users(key), -- 评论作者ID
  user_name text not null, -- 评论作者名称(冗余存储，便于审计追溯)
  user_avatar text default '', -- 作者头像(用于前端展示)
  content text not null, -- 评论内容
  attachments jsonb default '[]'::jsonb, -- 附件列表(预留)
  created_by text, -- 创建人ID
  updated_by text, -- 修改人ID
  created_at timestamptz default now(), -- 创建时间
  updated_at timestamptz default now(), -- 更新时间
  deleted_at timestamptz -- 软删除时间
);

create index if not exists idx_comments_module_created_at on comments(module_key, created_at desc);
create index if not exists idx_comments_user_id on comments(user_id);

create trigger update_comments_updated_at
before update on comments
for each row
execute function update_updated_at_column();

comment on table comments is '模块评论表';
comment on column comments.id is '评论主键ID (整型)';
comment on column comments.module_key is '关联菜单节点业务ID (navigation_nodes.key)';
comment on column comments.user_id is '评论作者业务ID (users.key)';
comment on column comments.content is '评论内容';
comment on column comments.attachments is '附件列表(JSON)，预留扩展';
comment on column comments.created_at is '创建时间(用于倒序分页游标)';

-- ==========================================
-- 5. AI 助理聊天消息表 (AI Chat Messages)
-- 记录 AI 助理对话内容，按 created_at 倒序分页加载
-- ==========================================
create table if not exists ai_chat_messages (
  id bigint generated always as identity primary key, -- 消息ID (整型自增)
  module_key text not null references navigation_nodes(key) on delete cascade, -- 关联菜单节点业务ID
  agent_id text not null references agents(key), -- 当前AI助理(关联 agents.key)
  prompt_label text, -- 当前提示词标签(对应 agent_prompts.label，可为空)
  role text not null check (role in ('user', 'model')), -- 消息角色
  actor_id text not null, -- 发送者ID(用户ID或Agent ID)
  actor_name text not null, -- 发送者名称(用户名称或Agent 名称)
  actor_avatar text default '', -- 发送者头像(用户头像或Agent 头像)
  content text not null, -- 消息内容 (Markdown/纯文本)
  attachments jsonb default '[]'::jsonb, -- 附件(预留扩展)
  created_at timestamptz default now(), -- 创建时间(用于倒序分页游标)
  updated_at timestamptz default now(), -- 更新时间(审计字段)
  deleted_at timestamptz -- 软删除时间(非空表示已删除)
);

create index if not exists idx_ai_chat_messages_module_created_at on ai_chat_messages(module_key, created_at desc);
create index if not exists idx_ai_chat_messages_agent_id on ai_chat_messages(agent_id);

create trigger update_ai_chat_messages_updated_at
before update on ai_chat_messages
for each row
execute function update_updated_at_column();

comment on table ai_chat_messages is 'AI助理聊天消息表';
comment on column ai_chat_messages.module_key is '关联菜单节点业务ID (navigation_nodes.key)';
comment on column ai_chat_messages.agent_id is '当前AI助理业务ID(agents.key)';
comment on column ai_chat_messages.prompt_label is '当前提示词标签: 对应 agent_prompts.label，可为空';
comment on column ai_chat_messages.role is '消息角色: user(用户), model(AI)';
comment on column ai_chat_messages.actor_id is '发送者ID(用户ID或Agent ID)';
comment on column ai_chat_messages.actor_name is '发送者名称(用户名称或Agent 名称)';
comment on column ai_chat_messages.content is '消息内容';
comment on column ai_chat_messages.created_at is '创建时间(用于倒序分页游标)';
comment on column ai_chat_messages.updated_at is '更新时间(审计字段)';
comment on column ai_chat_messages.deleted_at is '软删除时间戳，非空代表已删除';

-- ==========================================
-- 6. 审计日志表 (Audit Logs)
-- 记录用户的所有关键操作，用于安全审计
-- ==========================================
create table if not exists audit_logs (
  id bigint generated always as identity primary key, -- 日志ID (整型自增)
  user_id text not null,             -- 操作用户ID (关联 users.key)
  user_name text not null,           -- 操作用户名 (冗余存储，防止用户删除后无法追溯)
  action text not null,              -- 动作名称 (如: Login, Update Module)
  module text,                       -- 涉及模块名称
  details text,                      -- 详细描述
  status text default 'success',     -- 操作结果 (success, failed)
  ip text,                           -- 操作来源 IP
  created_by text,                   -- 创建人ID (通常与 user_id 相同，但为了统一结构保留)
  updated_by text,                   -- 修改人ID
  created_at timestamptz default now(), -- 创建时间
  updated_at timestamptz default now(), -- 最后修改时间
  timestamp timestamptz default now(), -- 业务发生时间 (保留兼容旧字段，建议迁移使用 created_at)
  deleted_at timestamptz               -- 软删除时间 (日志一般不删除，但保持结构一致性)
);

create trigger update_audit_logs_updated_at
before update on audit_logs
for each row
execute function update_updated_at_column();

comment on table audit_logs is '用户操作审计日志表';
comment on column audit_logs.id is '日志主键ID (整型)';
comment on column audit_logs.status is '操作结果状态: success(成功), failed(失败)';

-- ==========================================
-- 7. 系统错误日志表 (System Errors)
-- 记录后端或前端捕获的异常信息
-- ==========================================
create table if not exists system_errors (
  id bigint generated always as identity primary key, -- 错误日志ID (整型自增)
  error_code text,                   -- 错误代码 (如: 500, 404)
  error_message text,                -- 错误信息
  stack_trace text,                  -- 堆栈追踪
  route text,                        -- 发生错误的 API 路由或页面路径
  browser text,                      -- 客户端环境信息
  user_id text,                      -- 关联用户ID (如果已登录)
  user_name text,                    -- 关联用户名
  status text default 'open',        -- 错误状态 (open: 未处理, resolved: 已解决, ignored: 已忽略)
  created_by text,                   -- 创建人ID
  updated_by text,                   -- 修改人ID
  created_at timestamptz default now(), -- 创建时间
  updated_at timestamptz default now(), -- 最后修改时间
  timestamp timestamptz default now(), -- 错误发生时间 (保留兼容旧字段)
  deleted_at timestamptz               -- 软删除时间
);

create trigger update_system_errors_updated_at
before update on system_errors
for each row
execute function update_updated_at_column();

comment on table system_errors is '系统运行时错误日志表';
comment on column system_errors.id is '错误日志主键ID (整型)';
comment on column system_errors.status is '处理状态: open(待处理), resolved(已解决), ignored(已忽略)';

-- ==========================================
-- 8. AI Agents 表 (Agents)
-- 定义系统中的 AI 智能体及其配置
-- ==========================================
create table if not exists agents (
  id bigint generated always as identity primary key, -- Agent ID (整型自增)
  key text unique not null,          -- 业务ID (如 'agent_1')
  name text not null,                -- Agent 名称 (如: 销售助理)
  avatar text,                       -- 头像
  role text,                         -- 角色定位描述
  description text,                  -- 详细功能描述
  system_prompt text,                -- 系统提示词 (System Prompt)
  pm_interaction_example text,       -- 与 PM 交互的示例
  common_prompts jsonb default '[]'::jsonb, -- 常用提示词模板
  status text default 'active',      -- 状态
  scope jsonb default '[]'::jsonb,   -- 作用域 (可操作的模块列表)
  created_by text,                   -- 创建人ID
  updated_by text,                   -- 修改人ID
  created_at timestamptz default now(), -- 创建时间
  updated_at timestamptz default now(),  -- 最后修改时间
  deleted_at timestamptz                 -- 软删除时间
);

create trigger update_agents_updated_at
before update on agents
for each row
execute function update_updated_at_column();

comment on table agents is 'AI智能体配置表';
comment on column agents.id is 'Agent主键ID (整型)';
comment on column agents.key is 'Agent业务ID (字符串)';
comment on column agents.status is '启用状态: active(启用), inactive(停用)';
comment on column agents.deleted_at is '软删除时间戳，非空代表已删除';

-- ==========================================
-- 9. 行级安全策略 (RLS)
-- 注意：为了演示方便，以下策略允许所有操作 (Permissive)
-- 生产环境应配置更严格的策略 (如仅允许 authenticated 用户访问)
-- ==========================================

-- 启用 RLS
alter table users enable row level security;
alter table modules enable row level security;
alter table navigation_nodes enable row level security;
alter table comments enable row level security;
alter table ai_chat_messages enable row level security;
alter table audit_logs enable row level security;
alter table system_errors enable row level security;
alter table agents enable row level security;

-- 创建策略 (允许所有 Service Role 或 Anon 访问，根据实际 Supabase 配置调整)
-- 这里的 (true) 表示无条件允许所有 CRUD 操作

create policy "Enable all access for service role" on users for all using (true) with check (true);
create policy "Enable all access for service role" on modules for all using (true) with check (true);
create policy "Enable all access for service role" on navigation_nodes for all using (true) with check (true);
create policy "Enable all access for service role" on comments for all using (true) with check (true);
create policy "Enable all access for service role" on ai_chat_messages for all using (true) with check (true);
create policy "Enable all access for service role" on audit_logs for all using (true) with check (true);
create policy "Enable all access for service role" on system_errors for all using (true) with check (true);
create policy "Enable all access for service role" on agents for all using (true) with check (true);

-- ==========================================
-- 10. 初始数据填充 (Seed Data)
-- 自动插入一些默认用户，以便系统启动后即可登录测试
-- 密码均为: TEngine@123 (BCrypt Hashed)
-- Hash: $2a$10$WkXkO.wRjWkF6zH/v.2z.e.x.x.x.x.x.x.x.x.x.x (示例，需真实生成)
-- ==========================================

-- 插入默认用户 (如果不存在)
-- 注意：这里的 password_hash 是 'TEngine@123' 的 bcrypt hash 值
insert into users (key, name, email, password_hash, role, avatar, status, gender, phone, bio, created_by, updated_by)
values 
  ('u1', 'Alice Admin', 'admin@restosuite.com', '$2b$10$.CO1H3cduPlOskTZH3V9v.saJOlGWDRIcSiLSyxm.HhhqNRUEbOru', 'Admin', 'A', 'active', 'female', '13800138000', 'System Administrator and Guardian of T-Engine.', 'system', 'system'),
  ('u2', 'Paul PM', 'pm@restosuite.com', '$2b$10$nUXABtXWm8/FndRBhpW2WODOcrt5iCaXdvoVDAUjjcknyRSLPA40e', 'PM', 'P', 'active', 'male', '13912345678', 'Product Manager focusing on Sales Core.', 'system', 'system'),
  ('u3', 'Emma Expert', 'expert@restosuite.com', '$2b$10$XSNmOSnrrNY7k6.kEJvSvOMub1w6l.OK9fezKzIizODGxgftQIY42', 'Expert', 'E', 'active', 'female', '13787654321', 'Business domain expert in Supply Chain.', 'system', 'system'),
  ('u4', 'Dave Dev', 'dev@restosuite.com', '$2b$10$U7ycghP6GqklDE7HHHnoS.a8JQn1YX9h9G38X.80pHkc4dEDM.3Yq', 'Dev', 'D', 'active', 'male', '13600009999', 'Full-stack developer loving React.', 'system', 'system')
on conflict (key) do nothing;

-- ==========================================
-- 9. Agent Prompts Table (Added for Persistent Prompts)
-- ==========================================
create table if not exists agent_prompts (
  id bigint generated always as identity primary key,
  agent_id text not null references agents(key) on delete cascade,
  label text not null,
  content text not null,
  created_by text,
  updated_by text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  usage_count integer default 0,
  deleted_at timestamptz               -- 软删除时间
);

create trigger update_agent_prompts_updated_at
before update on agent_prompts
for each row
execute function update_updated_at_column();

comment on table agent_prompts is 'AI Agent 常用提示词表';
comment on column agent_prompts.agent_id is '关联 Agent 业务ID';
comment on column agent_prompts.usage_count is '使用次数';
comment on column agent_prompts.deleted_at is '软删除时间戳，非空代表已删除';

-- Enable RLS
alter table agent_prompts enable row level security;
create policy "Enable all access for service role" on agent_prompts for all using (true) with check (true);

-- Create navigation table for storing the full JSON tree
create table if not exists navigation (
  id text primary key,
  tree jsonb,
  updated_at timestamptz default now()
);

-- Policy (permissive for dev)
alter table navigation enable row level security;
create policy "Enable all access for service role" on navigation for all using (true) with check (true);
