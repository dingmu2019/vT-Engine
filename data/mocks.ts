
import { ModuleData, KnowledgeItem, ModuleVersion, AuditLogEntry, SystemErrorLogEntry, UserProfile } from '../types';

const REQ_OPPORTUNITY = `### 1. 业务概述
**商机管理 (Opportunity Management)** 是销售流程的核心环节，用于管理从“意向确认”到“成交签约”的全过程。核心目标是提高赢单率 (Win Rate) 并精准预测销售业绩 (Forecast)。

---
### 2. 核心用户故事 (User Stories)
#### US-001: 商机创建与关联
> 销售可以将合格线索 (SQL) 一键转化为商机，或手动创建新商机，并关联对应的客户 (Account) 和联系人。
**验收标准:**
- [ ] 必填字段：商机名称、预计金额、预计成交日期、当前阶段。
- [ ] 自动继承线索中的客户背景信息。

#### US-002: 销售阶段推进 (Stage Pipeline)
> 销售需要按照标准销售漏斗推进商机，系统需根据阶段自动计算赢单概率。
**验收标准:**
- [ ] 标准阶段：Discovery (10%) -> Proposal (30%) -> Negotiation (60%) -> Contract Sent (80%) -> Closed Won (100%) / Closed Lost (0%)。
- [ ] 进入“Negotiation”阶段前，必须上传报价单。

#### US-003: 销售预测 (Forecasting)
> 销售总监需要查看本季度预计成交总额 (Weighted Pipeline)。
**验收标准:**
- [ ] 预测金额 = 商机金额 * 阶段概率。
- [ ] 支持按部门、区域、时间维度汇总。

---
### 3. 数据模型
| 字段名 | 类型 | 描述 |
| :--- | :--- | :--- |
| \`amount\` | Currency | 商机预计金额 (多币种) |
| \`stage\` | Enum | 销售阶段 |
| \`close_date\` | Date | 预计成交日 |
| \`probability\` | Int | 赢单概率 (0-100) |
| \`competitor\` | String | 主要竞争对手 |
`;

const REQ_CONTRACT = `### 1. 业务概述
**合同管理 (Contract Management)** 负责管理客户签约、续约及合同归档。确保财务合规与法律风险控制。

---
### 2. 核心用户故事
#### US-001: 合同生成与审批
> 销售基于商机生成合同草稿，系统自动填充条款，并触发法务与财务审批流。
**验收标准:**
- [ ] 支持基于模板生成 PDF 合同。
- [ ] 金额 > 50万 需触发 CFO 审批。

#### US-002: 多期回款计划 (Payment Schedule)
> 合同需定义分期付款节点（如：首付30%，上线30%，验收40%）。
**验收标准:**
- [ ] 回款计划总额必须等于合同总额。
- [ ] 自动生成对应的应收账款 (Receivable) 记录。

---
### 3. 逻辑规则
- IF \`contract.amount > 500000\` THEN \`require_approval("CFO")\`
- IF \`contract.type == "RENEWAL"\` THEN \`apply_discount("LOYALTY_5%")\`
`;

const REQ_PROJECT = `### 1. 业务概述
**实施项目管理 (Implementation Project)** 用于管理客户签约后的交付落地过程，涵盖启动、规划、执行、监控与收尾。

---
### 2. 核心用户故事
#### US-001: 项目立项与交接
> 合同签订后自动触发项目立项，销售信息自动同步给实施经理。
**验收标准:**
- [ ] 自动创建项目，状态为“待启动”。
- [ ] 继承合同中的“实施人天”作为预算。

#### US-002: 里程碑管理 (Milestones)
> 实施经理需维护关键里程碑（如：环境部署、UAT 验收、正式上线）。
**验收标准:**
- [ ] 关键里程碑完成需客户签字确认 (E-Signature)。
- [ ] 里程碑延期超过 3 天自动触发风险预警。

---
### 3. 数据模型
| 字段名 | 类型 | 描述 |
| :--- | :--- | :--- |
| \`pm_id\` | UUID | 项目经理 |
| \`progress\` | Int | 进度百分比 |
| \`health\` | Enum | 健康度 (Green, Yellow, Red) |
| \`go_live_date\` | Date | 上线日期 |
`;

const REQ_TICKET = `### 1. 业务概述
**工单管理 (Ticket Management)** 用于处理客户在实施或售后阶段遇到的问题。

---
### 2. 核心用户故事
#### US-001: 工单提交与分派
> 客户可通过邮件或 Portal 提交工单，系统自动根据类型分派给技术支持。
**验收标准:**
- [ ] 支持富文本描述与截图上传。
- [ ] P0 级工单需在 15分钟内响应。

#### US-002: SLA 监控
> 客服经理需监控 SLA 达成率。
**验收标准:**
- [ ] 即将超时的工单需高亮显示。
- [ ] 工单关闭后自动发送满意度调查。
`;

const EXP_REQ_OPPORTUNITY = `### 专家深度洞察 (Expert Insights)

**1. 赢单率模型优化**
目前系统的赢单概率仅根据阶段（Stage）静态匹配（如 Proposal=30%），这在实际业务中极其不准。
*   **建议**：引入“关键动作确认”逻辑。例如，只有在上传了“客户盖章的意向书”后，概率才能人工调整至 50% 以上，否则锁定在 30%。

**2. 竞争对手 (Competitor) 模块增强**
*   现状：仅有一个文本字段。
*   **需求**：需要关联“竞争对手库”。在输单（Closed Lost）时，强制选择“赢单对手”并填写“主要差距分析”（价格、功能、关系等），以便市场部做 Win/Loss 分析。

**3. 币种汇率风控**
*   在跨国商机中，从创建到成交可能历时数月。
*   **需求**：系统应记录“商机创建日汇率”和“预计成交日汇率”，并计算汇率波动带来的潜在金额差异 (Currency Risk Exposure)。`;

const EXP_REQ_CONTRACT = `### 法务与合规专家意见

**1. 电子签章 (E-Signature) 合规性**
*   针对北美客户，必须集成 DocuSign 或 Adobe Sign，并确保存储 Audit Trail（审计追踪日志）。
*   针对欧洲客户，需满足 GDPR 关于合同中个人信息存储的要求。

**2. 条款库 (Clause Library) 管理**
*   销售不应随意修改合同正文。
*   **需求**：将合同拆解为“标准条款”和“特别条款”。销售只能从库中选择“特别条款”，手动修改必须触发法务审批。`;

export const MOCK_GlobalStandards = `1. **Terminology / 术语**:
   - Use "Lead" for potential customers.
   - Use "Opportunity" for qualified leads.
   - Currency: All monetary values must be stored in cents (integer).

2. **UI/UX Patterns / 交互规范**:
   - Primary Action buttons: Positioned top-right or bottom-right.
   - Destructive actions: Must have a confirmation modal.
   - Date Format: YYYY-MM-DD for display.

3. **API Standards / 接口规范**:
   - RESTful conventions.
   - Pagination: Use cursor-based pagination for large datasets.
   - Error Handling: Return standard HTTP status codes with structured JSON error messages.

4. **Database (Supabase/Postgres) / 数据库规范**:
   - Naming: use snake_case for tables and columns.
   - Timestamps: use timestamptz; created_at for cursor pagination.
   - Module-scoped data: must include module_key for partitioning and indexing.

   **SQL Snippet: comments table (模块评论，倒序分页 + 上滑加载更多)**

   \`\`\`sql
   create table if not exists public.comments (
     id bigint generated always as identity primary key,
     module_key text not null references public.navigation_nodes(key) on delete cascade,
     user_id text not null references public.users(key),
     user_name text not null,
     user_avatar text not null default '',
     content text not null,
     attachments jsonb not null default '[]'::jsonb,
     created_at timestamptz not null default now()
   );

   create index if not exists idx_comments_module_created_at
     on public.comments (module_key, created_at desc);
   \`\`\`

   **SQL Snippet: ai_chat_messages table (AI 助理聊天记录，倒序分页 + 回放)**

   \`\`\`sql
   create table if not exists public.ai_chat_messages (
     id bigint generated always as identity primary key,
     module_key text not null references public.navigation_nodes(key) on delete cascade,
     agent_id text not null references public.agents(key),
     prompt_label text,
     role text not null check (role in ('user', 'model')),
     actor_id text not null,
     actor_name text not null,
     actor_avatar text not null default '',
     content text not null,
     attachments jsonb not null default '[]'::jsonb,
     created_at timestamptz not null default now(),
     updated_at timestamptz not null default now(),
     deleted_at timestamptz
   );

   create index if not exists idx_ai_chat_messages_module_created_at
     on public.ai_chat_messages (module_key, created_at desc);
   \`\`\`
`;

export const MOCK_DATABASE: Record<string, Partial<ModuleData>> = {
  'opportunity': {
    requirements: REQ_OPPORTUNITY,
    expertRequirements: EXP_REQ_OPPORTUNITY,
    logicRules: [
      { id: '1', name: 'Auto-Probability', condition: 'stage == "Proposal"', action: 'set_probability(30)', enabled: true },
      { id: '2', name: 'Close Date Check', condition: 'close_date < today()', action: 'alert("Date in past")', enabled: true },
    ]
  },
  'contract': {
    requirements: REQ_CONTRACT,
    expertRequirements: EXP_REQ_CONTRACT,
    logicRules: [
      { id: '1', name: 'Approval Trigger', condition: 'amount > 500000', action: 'start_workflow("CFO_APPROVAL")', enabled: true }
    ]
  },
  'project': {
    requirements: REQ_PROJECT,
    expertRequirements: `### 交付专家建议\n*   **资源预占**：在项目状态变为“启动”前，允许项目经理在资源池中进行“软预占 (Soft Booking)”。\n*   **工时填报**：需支持移动端填报，且与钉钉/飞书打通。`,
    logicRules: []
  },
  'ticket': {
    requirements: REQ_TICKET,
    expertRequirements: `### 客户成功专家建议\n*   **知识库联动**：工单提交时，根据关键字自动向客户推荐知识库文章 (KB Article)，尝试自助解决，减少人工工单量。`,
    logicRules: [
      { id: '1', name: 'SLA Warning', condition: 'priority == "P0" && wait_time > 15m', action: 'escalate("Support_Lead")', enabled: true }
    ]
  }
};

export const MOCK_DB_SCHEMA = {
  tables: [
    {
      name: 't_user',
      comment: 'User Information / 用户信息表',
      columns: [
        { name: 'id', type: 'BIGINT', length: '20', nullable: false, pk: true, comment: 'Primary Key' },
        { name: 'username', type: 'VARCHAR', length: '50', nullable: false, pk: false, comment: 'Login Name' },
        { name: 'password', type: 'VARCHAR', length: '100', nullable: false, pk: false, comment: 'Encrypted Password' },
        { name: 'email', type: 'VARCHAR', length: '100', nullable: true, pk: false, comment: 'Email Address' },
        { name: 'phone', type: 'VARCHAR', length: '20', nullable: true, pk: false, comment: 'Phone Number' },
        { name: 'status', type: 'TINYINT', length: '4', nullable: false, pk: false, comment: '1: Active, 0: Disabled' },
        { name: 'created_at', type: 'DATETIME', length: '0', nullable: false, pk: false, comment: 'Creation Time' },
      ],
      indexes: [
        { name: 'idx_user_username', columns: ['username'], unique: true },
        { name: 'idx_user_email', columns: ['email'], unique: true },
      ],
      foreignKeys: []
    },
    {
      name: 't_order',
      comment: 'Sales Order / 销售订单表',
      columns: [
        { name: 'id', type: 'BIGINT', length: '20', nullable: false, pk: true, comment: 'Primary Key' },
        { name: 'order_no', type: 'VARCHAR', length: '32', nullable: false, pk: false, comment: 'Order Number' },
        { name: 'user_id', type: 'BIGINT', length: '20', nullable: false, pk: false, comment: 'Customer ID' },
        { name: 'total_amount', type: 'DECIMAL', length: '12,2', nullable: false, pk: false, comment: 'Total Amount' },
        { name: 'status', type: 'VARCHAR', length: '20', nullable: false, pk: false, comment: 'PENDING, PAID, SHIPPED' },
        { name: 'created_at', type: 'DATETIME', length: '0', nullable: false, pk: false, comment: 'Creation Time' },
      ],
      indexes: [
        { name: 'idx_order_no', columns: ['order_no'], unique: true },
        { name: 'idx_order_user', columns: ['user_id'], unique: false },
      ],
      foreignKeys: [
        { name: 'fk_order_user', column: 'user_id', refTable: 't_user', refColumn: 'id' }
      ]
    },
    {
      name: 't_order_item',
      comment: 'Order Items / 订单明细表',
      columns: [
        { name: 'id', type: 'BIGINT', length: '20', nullable: false, pk: true, comment: 'Primary Key' },
        { name: 'order_id', type: 'BIGINT', length: '20', nullable: false, pk: false, comment: 'Order ID' },
        { name: 'product_id', type: 'BIGINT', length: '20', nullable: false, pk: false, comment: 'Product ID' },
        { name: 'quantity', type: 'INT', length: '11', nullable: false, pk: false, comment: 'Quantity' },
        { name: 'price', type: 'DECIMAL', length: '12,2', nullable: false, pk: false, comment: 'Unit Price' },
      ],
      indexes: [
        { name: 'idx_item_order', columns: ['order_id'], unique: false },
      ],
      foreignKeys: [
        { name: 'fk_item_order', column: 'order_id', refTable: 't_order', refColumn: 'id' },
        { name: 'fk_item_product', column: 'product_id', refTable: 't_product', refColumn: 'id' }
      ]
    },
    {
      name: 't_product',
      comment: 'Product / 商品表',
      columns: [
        { name: 'id', type: 'BIGINT', length: '20', nullable: false, pk: true, comment: 'Primary Key' },
        { name: 'sku', type: 'VARCHAR', length: '50', nullable: false, pk: false, comment: 'SKU Code' },
        { name: 'name', type: 'VARCHAR', length: '100', nullable: false, pk: false, comment: 'Product Name' },
        { name: 'price', type: 'DECIMAL', length: '12,2', nullable: false, pk: false, comment: 'List Price' },
        { name: 'stock', type: 'INT', length: '11', nullable: false, pk: false, comment: 'Stock Quantity' },
      ],
      indexes: [
        { name: 'idx_product_sku', columns: ['sku'], unique: true },
      ],
      foreignKeys: []
    }
  ]
};

export const MOCK_AUDIT_LOGS: AuditLogEntry[] = [
  {
    id: 'log_1',
    userId: 'u1',
    userName: 'Alice Admin',
    action: 'Login',
    module: 'Auth',
    timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(), // 5 mins ago
    ip: '192.168.1.10',
    status: 'success',
    details: 'Logged in via email/password'
  },
  {
    id: 'log_2',
    userId: 'u2',
    userName: 'Paul PM',
    action: 'Update Requirements',
    module: 'Opportunity',
    timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(), // 45 mins ago
    ip: '10.0.0.5',
    status: 'success',
    details: 'Modified US-001 acceptance criteria'
  },
  {
    id: 'log_3',
    userId: 'u3',
    userName: 'Emma Expert',
    action: 'Add Logic Rule',
    module: 'Contract',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
    ip: '172.16.0.23',
    status: 'success',
    details: 'Added approval trigger rule'
  },
  {
    id: 'log_4',
    userId: 'u2',
    userName: 'Paul PM',
    action: 'Delete Module',
    module: 'Legacy Report',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(), // 5 hours ago
    ip: '10.0.0.5',
    status: 'success',
    details: 'Deleted node id: report_legacy'
  },
  {
    id: 'log_5',
    userId: 'u4',
    userName: 'Dave Dev',
    action: 'Export Context',
    module: 'Order',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
    ip: '192.168.1.105',
    status: 'success',
    details: 'Exported context for AI coding'
  },
  {
    id: 'log_6',
    userId: 'u1',
    userName: 'Alice Admin',
    action: 'Update User Role',
    module: 'User Management',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 26).toISOString(), // 1 day 2 hours ago
    ip: '192.168.1.10',
    status: 'success',
    details: 'Promoted u3 to Expert'
  },
  {
    id: 'log_7',
    userId: 'u5',
    userName: 'Unknown',
    action: 'Login Attempt',
    module: 'Auth',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 28).toISOString(), 
    ip: '203.0.113.42',
    status: 'failed',
    details: 'Invalid password for admin@restosuite.com'
  }
];

export const MOCK_SYSTEM_ERRORS: SystemErrorLogEntry[] = [
  {
    id: 'err_1',
    timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    errorCode: '500',
    errorMessage: 'Database connection timeout',
    stackTrace: `Error: Connection lost
    at PoolConnection.onClose (node_modules/mysql2/lib/connection.js:150:15)
    at Socket.emit (events.js:315:20)
    at TCP.onStreamRead (internal/stream_base_commons.js:209:20)`,
    route: '/api/v1/orders/create',
    browser: 'Chrome 120.0.0',
    status: 'open'
  },
  {
    id: 'err_2',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
    userId: 'u2',
    userName: 'Paul PM',
    errorCode: '403',
    errorMessage: 'Permission denied: Cannot delete root node',
    stackTrace: `Error: Forbidden
    at checkPermission (services/auth.ts:45:10)
    at deleteNode (controllers/nodeController.ts:22:5)`,
    route: '/api/v1/nodes/root',
    browser: 'Firefox 121.0',
    status: 'resolved'
  },
  {
    id: 'err_3',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
    errorCode: '400',
    errorMessage: 'Invalid JSON payload in AI response',
    stackTrace: `SyntaxError: Unexpected token < in JSON at position 0
    at JSON.parse (<anonymous>)
    at handleAIResponse (services/ai.ts:88:20)`,
    route: '/api/v1/ai/generate',
    browser: 'System Worker',
    status: 'ignored'
  }
];

export const INITIAL_USERS: UserProfile[] = [
  { 
    id: 'u1', 
    name: 'Alice Admin', 
    email: 'admin@restosuite.com', 
    role: 'Admin', 
    avatar: 'A', 
    status: 'active',
    gender: 'female',
    phone: '13800138000',
    bio: 'System Administrator and Guardian of T-Engine.'
  },
  { 
    id: 'u2', 
    name: 'Paul PM', 
    email: 'pm@restosuite.com', 
    role: 'PM', 
    avatar: 'P', 
    status: 'active',
    gender: 'male',
    phone: '13912345678',
    bio: 'Product Manager focusing on Sales Core.'
  },
  { 
    id: 'u3', 
    name: 'Emma Expert', 
    email: 'expert@restosuite.com', 
    role: 'Expert', 
    avatar: 'E', 
    status: 'active',
    gender: 'female',
    phone: '13787654321',
    bio: 'Business domain expert in Supply Chain.'
  },
  { 
    id: 'u4', 
    name: 'Dave Dev', 
    email: 'dev@restosuite.com', 
    role: 'Dev', 
    avatar: 'D', 
    status: 'active',
    gender: 'male',
    phone: '13600009999',
    bio: 'Full-stack developer loving React.'
  },
];

export const LLM_PROVIDERS = [
  {
    id: 'google',
    name: 'Google Gemini (Official)',
    baseUrl: 'https://generativelanguage.googleapis.com',
    models: [
      'gemini-2.0-flash-exp',
      'gemini-1.5-pro-latest',
      'gemini-1.5-flash-latest',
      'gemini-1.5-pro',
      'gemini-1.5-flash',
      'gemini-3-pro-preview',
      'gemini-3-flash-preview'
    ]
  },
  {
    id: 'openai',
    name: 'OpenAI (Official)',
    baseUrl: 'https://api.openai.com/v1',
    models: [
      'gpt-4o',
      'gpt-4-turbo',
      'gpt-4',
      'gpt-3.5-turbo'
    ]
  },
  {
    id: 'azure',
    name: 'Azure OpenAI',
    baseUrl: 'https://{resource}.openai.azure.com/openai/deployments/{deployment}/chat/completions?api-version=2024-02-15-preview',
    models: [
      'gpt-4o',
      'gpt-4',
      'gpt-35-turbo'
    ]
  },
  {
    id: 'anthropic',
    name: 'Anthropic Claude',
    baseUrl: 'https://api.anthropic.com/v1',
    models: [
      'claude-3-5-sonnet-20240620',
      'claude-3-opus-20240229',
      'claude-3-sonnet-20240229',
      'claude-3-haiku-20240307'
    ]
  },
  {
    id: 'deepseek',
    name: 'DeepSeek (深度求索)',
    baseUrl: 'https://api.deepseek.com',
    models: [
      'deepseek-chat',
      'deepseek-coder'
    ]
  },
  {
    id: 'moonshot',
    name: 'Moonshot AI (Kimi)',
    baseUrl: 'https://api.moonshot.cn/v1',
    models: [
      'moonshot-v1-8k',
      'moonshot-v1-32k',
      'moonshot-v1-128k'
    ]
  },
  {
    id: 'zhipu',
    name: 'Zhipu AI (智谱GLM)',
    baseUrl: 'https://open.bigmodel.cn/api/paas/v4',
    models: [
      'glm-4',
      'glm-4-air',
      'glm-4-flash',
      'glm-3-turbo'
    ]
  },
  {
    id: 'groq',
    name: 'Groq (Ultra Fast)',
    baseUrl: 'https://api.groq.com/openai/v1',
    models: [
      'llama3-70b-8192',
      'llama3-8b-8192',
      'mixtral-8x7b-32768',
      'gemma-7b-it'
    ]
  }
];

export const DB_PROVIDERS = [
  { id: 'mysql', name: 'MySQL', defaultPort: 3306 },
  { id: 'postgres', name: 'PostgreSQL', defaultPort: 5432 },
  { id: 'supabase', name: 'Supabase', defaultPort: 5432 },
  { id: 'oracle', name: 'Oracle DB', defaultPort: 1521 },
  { id: 'mssql', name: 'SQL Server', defaultPort: 1433 },
  { id: 'mongo', name: 'MongoDB', defaultPort: 27017 },
  { id: 'redis', name: 'Redis', defaultPort: 6379 },
];
