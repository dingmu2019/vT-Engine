
import { ModuleData, AuditLogEntry, SystemErrorLogEntry, UserProfile, NavNode, AIAgent, PromptTemplate, IntegrationConfig } from '../types';

export const INITIAL_INTEGRATIONS: IntegrationConfig[] = [
    {
        id: 'int_1',
        key: 'llm_global',
        name: 'Global LLM Configuration',
        type: 'llm',
        config: { provider: "google", model: "gemini-3-pro-preview", baseUrl: "https://generativelanguage.googleapis.com", apiKey: "", maxTokens: 20480, temperature: 0.7 },
        enabled: true,
        updatedAt: new Date().toISOString()
    },
    {
        id: 'int_2',
        key: 'email_global',
        name: 'Email Service',
        type: 'notification',
        config: { host: "smtp.gmail.com", port: 587, user: "", pass: "", senderName: "RestoSuite Notification" },
        enabled: false,
        updatedAt: new Date().toISOString()
    },
    {
        id: 'int_3',
        key: 'wechat_global',
        name: 'WeChat Work',
        type: 'notification',
        config: { corpId: "", agentId: "", secret: "" },
        enabled: false,
        updatedAt: new Date().toISOString()
    },
    {
        id: 'int_4',
        key: 'db_global',
        name: 'Database Connection',
        type: 'db',
        config: { type: "mysql", host: "localhost", port: 3306, database: "restosuite_core", username: "root", password: "" },
        enabled: true,
        updatedAt: new Date().toISOString()
    },
    {
        id: 'int_5',
        key: 'enterprise_info',
        name: 'Enterprise Information',
        type: 'system',
        config: { name: "RestoSuite Inc.", address: "Singapore HQ", taxId: "", contact: "" },
        enabled: true,
        updatedAt: new Date().toISOString()
    },
    {
        id: 'int_6',
        key: 'feishu_global',
        name: 'Feishu / Lark',
        type: 'notification',
        config: { appId: "", appSecret: "", webhookUrl: "" },
        enabled: false,
        updatedAt: new Date().toISOString()
    },
    {
        id: 'int_7',
        key: 'slack_global',
        name: 'Slack',
        type: 'notification',
        config: { botToken: "", channelId: "", webhookUrl: "" },
        enabled: false,
        updatedAt: new Date().toISOString()
    }
];

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

export const MOCK_GlobalStandards = `# 全局架构与开发规范 (Global Architecture & Development Standards)

## 1. 核心设计原则 (Core Design Principles)
*   **单一职责 (SRP)**: 每个模块、类或函数只做一件事。
*   **DRY (Don't Repeat Yourself)**: 避免重复代码，抽取公共逻辑为 Utility 或 Hook。
*   **高内聚低耦合**: 模块间通过明确定义的接口交互，减少隐式依赖。
*   **AI 友好性**: 代码应当自解释 (Self-documenting)，注释需解释“为什么”而非“是什么”，便于 AI 理解上下文。

## 2. 技术栈规范 (Tech Stack Standards)
*   **Frontend**: React 18+ (Functional Components), TypeScript, Tailwind CSS, Lucide Icons, Vite.
*   **Backend**: Node.js, Express, TypeScript, Supabase (PostgreSQL).
*   **State Management**: 优先使用 React Context + Hooks，复杂全局状态可考虑 Zustand/Redux。
*   **Communication**: RESTful API, JSON 格式交互。

## 3. 编码规范 (Coding Standards)

### 3.1 命名约定 (Naming Conventions)
*   **Variables/Functions**: \`camelCase\` (e.g., \`fetchUserData\`, \`isLoading\`).
*   **Components/Classes**: \`PascalCase\` (e.g., \`UserProfile\`, \`AuthService\`).
*   **Constants**: \`UPPER_SNAKE_CASE\` (e.g., \`MAX_RETRY_COUNT\`, \`DEFAULT_TIMEOUT\`).
*   **Files**:
    *   React Components: \`PascalCase.tsx\` (e.g., \`Button.tsx\`).
    *   Utilities/Helpers: \`camelCase.ts\` (e.g., \`dateUtils.ts\`).

### 3.2 TypeScript 最佳实践
*   **严禁使用 \`any\`**: 必须定义 Interface 或 Type。
*   **接口定义**: 优先使用 \`interface\` 定义对象结构，使用 \`type\` 定义联合类型。
*   **空值处理**: 优先使用 Optional Chaining (\`?.\`) 和 Nullish Coalescing (\`??\`)。

### 3.3 注释规范
*   **JSDoc**: 核心函数和复杂逻辑必须包含 JSDoc 注释，说明参数、返回值和异常。
*   **TODO**: 使用 \`// TODO: [说明]\` 标记待办事项。

## 4. 前端架构规范 (Frontend Architecture)
*   **组件分层**:
    *   \`components/ui\`: 通用基础组件（按钮、输入框），不包含业务逻辑。
    *   \`components/features\`: 业务功能组件，包含特定业务逻辑。
    *   \`pages\`: 页面级组件，负责路由和布局组合。
*   **Hooks 封装**: 所有数据获取和副作用逻辑必须封装在 Custom Hooks 中 (e.g., \`useAuth\`, \`useFetchOrders\`)。
*   **样式处理**: 优先使用 Tailwind Utility Classes，避免行内样式 (Inline Styles)。

## 5. 后端架构规范 (Backend Architecture)
*   **分层架构**:
    *   \`Routes\`: 定义 API 路径和请求验证。
    *   \`Controllers/Handlers\`: 处理 HTTP 请求/响应，调用 Service。
    *   \`Services/Store\`: 包含核心业务逻辑和数据库交互。
*   **错误处理**:
    *   使用全局异常处理中间件。
    *   所有异步操作必须使用 \`asyncHandler\` 包装或 \`try/catch\` 块。
    *   返回标准的 JSON 错误格式: \`{ success: false, message: "...", code: "..." }\`.
*   **API 设计**:
    *   路径: 名词复数 (e.g., \`/api/users\`, \`/api/orders/:id\`)。
    *   方法: GET (查询), POST (创建), PUT/PATCH (更新), DELETE (删除)。
    *   状态码: 200 (OK), 201 (Created), 400 (Bad Request), 401 (Unauthorized), 403 (Forbidden), 404 (Not Found), 500 (Server Error)。

## 7. 数据库规范 (Database Standards)
*   **命名**: 表名使用 \`snake_case\` 和复数 (e.g., \`user_profiles\`, \`order_items\`)。
*   **主键**: 统一使用 UUID 或自增 ID (根据项目约定)。
*   **审计字段**: 所有表应包含 \`created_at\` 和 \`updated_at\`。
*   **软删除**: 重要数据表应包含 \`deleted_at\` 字段，通过 API 过滤而非物理删除。
*   **中文注释**: 所有 DDL 脚本必须包含详细的中文注释。
    *   表注释: \`COMMENT ON TABLE table_name IS '表用途描述';\`
    *   字段注释: \`COMMENT ON COLUMN table_name.column_name IS '字段含义及枚举值说明';\`
    *   **枚举值注释**: 对于状态（Status）、类型（Type）等枚举字段，必须在注释中列出所有可用值及其含义。
        *   示例: \`COMMENT ON COLUMN users.status IS '用户状态: active(激活), disabled(禁用), pending(待审核)';\`

## 8. 全球化与合规规范 (Globalization & Compliance Standards)

### 8.1 多语言支持 (i18n)
*   **键值管理**: 前端 UI 文本严禁硬编码 (Hardcoding)，必须使用 \`useTranslation\` Hook 调用语言包键值 (e.g., \`t('common.submit')\`)。
*   **后端响应**: API 错误信息应返回错误码 (ErrorCode)，而非直接返回显示文本，由前端根据语言环境映射。
*   **内容存储**: 涉及多语言的业务数据（如商品名称），应在数据库中设计为 JSONB 字段 (e.g., \`name_i18n: { "en": "Apple", "zh": "苹果" }\`) 或独立的翻译表。

### 8.2 时区与日期处理 (Timezone Handling)
*   **存储标准**: 数据库中所有时间字段必须统一使用 **UTC 时间** 存储 (\`TIMESTAMPTZ\`)。
*   **传输格式**: API 交互统一使用 **ISO 8601** 格式 (e.g., \`2023-10-01T12:00:00Z\`)。
*   **展示逻辑**: 前端负责将 UTC 时间转换为用户本地时区或租户设置的时区进行展示 (使用 \`date-fns\` 或 \`dayjs\`)。

### 8.3 数据隐私与合规 (Data Privacy & Compliance)
*   **PII 保护**: 个人敏感信息 (PII) 如手机号、邮箱、身份证号，在数据库中必须加密存储 (Encryption at Rest)。
*   **数据隔离**: 严格执行多租户数据隔离，所有 SQL 查询必须包含 \`tenant_id\` 过滤条件（或通过 RLS 策略强制执行）。
*   **GDPR/CCPA**: 支持用户数据的“导出”与“彻底删除”功能。日志中严禁记录用户的明文密码或敏感支付信息。

## 9. AI 协作指南 (AI Collaboration Guidelines)
*   **上下文明确**: 向 AI 提问时，明确指出相关文件路径和业务背景。
*   **增量开发**: 将大任务拆解为小的子任务 (Step-by-Step)。
*   **代码审查**: AI 生成的代码必须经过人工审查，特别是安全性与边界条件。`;

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
    password_hash: '$2b$10$.CO1H3cduPlOskTZH3V9v.saJOlGWDRIcSiLSyxm.HhhqNRUEbOru',
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
    password_hash: '$2b$10$nUXABtXWm8/FndRBhpW2WODOcrt5iCaXdvoVDAUjjcknyRSLPA40e',
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
    password_hash: '$2b$10$XSNmOSnrrNY7k6.kEJvSvOMub1w6l.OK9fezKzIizODGxgftQIY42',
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
    password_hash: '$2b$10$U7ycghP6GqklDE7HHHnoS.a8JQn1YX9h9G38X.80pHkc4dEDM.3Yq',
    role: 'Dev', 
    avatar: 'D', 
    status: 'active',
    gender: 'male',
    phone: '13600009999',
    bio: 'Full-stack developer loving React.'
  },
];

export const NAV_TREE: NavNode[] = [ 
   { 
     "id": "home", 
     "icon": "home", 
     "type": "module", 
     "label": "Home", 
     "status": "ready", 
     "labelZh": "首页" 
   }, 
   { 
     "id": "product", 
     "icon": "package", 
     "type": "folder", 
     "label": "Product Management", 
     "status": "draft", 
     "labelZh": "商品管理", 
     "children": [ 
       { 
         "id": "prod_type", 
         "icon": "tags", 
         "type": "module", 
         "label": "Product Type", 
         "status": "draft", 
         "labelZh": "商品类型管理" 
       }, 
       { 
         "id": "prod_category", 
         "icon": "library", 
         "type": "module", 
         "label": "Category", 
         "status": "draft", 
         "labelZh": "商品分类管理" 
       }, 
       { 
         "id": "prod_item", 
         "icon": "shopping-bag", 
         "type": "module", 
         "label": "Product Item", 
         "status": "draft", 
         "labelZh": "商品管理" 
       }, 
       { 
         "id": "prod_combo", 
         "icon": "layers", 
         "type": "module", 
         "label": "Combo", 
         "status": "draft", 
         "labelZh": "商品套餐管理" 
       }, 
       { 
         "id": "prod_promotion", 
         "icon": "percent", 
         "type": "module", 
         "label": "Promotion", 
         "status": "draft", 
         "labelZh": "商品促销管理" 
       } 
     ] 
   }, 
   { 
     "id": "market_sales", 
     "icon": "trending-up", 
     "type": "folder", 
     "label": "Market & Sales Management", 
     "status": "ready", 
     "labelZh": "市场&销售管理", 
     "children": [ 
       { 
         "id": "lead", 
         "icon": "user-plus", 
         "type": "module", 
         "label": "Lead", 
         "status": "ready", 
         "labelZh": "线索" 
       }, 
       { 
         "id": "opportunity", 
         "icon": "target", 
         "type": "module", 
         "label": "Opportunity", 
         "status": "ready", 
         "labelZh": "商机" 
       }, 
       { 
         "id": "customer", 
         "icon": "users", 
         "type": "module", 
         "label": "Customer", 
         "status": "ready", 
         "labelZh": "客户" 
       }, 
       { 
         "id": "presales", 
         "icon": "presentation", 
         "type": "module", 
         "label": "Pre-sales", 
         "status": "draft", 
         "labelZh": "售前" 
       }, 
       { 
         "id": "quote", 
         "icon": "file-text", 
         "type": "module", 
         "label": "Quote", 
         "status": "draft", 
         "labelZh": "报价单" 
       }, 
       { 
         "id": "contract", 
         "icon": "file-signature", 
         "type": "module", 
         "label": "Contract", 
         "status": "ready", 
         "labelZh": "合同" 
       }, 
       { 
         "id": "order", 
         "icon": "shopping-cart", 
         "type": "module", 
         "label": "Order", 
         "status": "ready", 
         "labelZh": "订单" 
       }, 
       { 
         "id": "promo_rules", 
         "icon": "settings-2", 
         "type": "module", 
         "label": "Incentive & Promotion", 
         "status": "draft", 
         "labelZh": "激励与促销" 
       } 
     ] 
   }, 
   { 
     "id": "service_delivery", 
     "icon": "truck", 
     "type": "folder", 
     "label": "Delivery & Service Management", 
     "status": "draft", 
     "labelZh": "交付&服务管理", 
     "children": [ 
       { 
         "id": "project", 
         "icon": "briefcase", 
         "type": "module", 
         "label": "Implementation Project", 
         "status": "draft", 
         "labelZh": "实施项目" 
       }, 
       { 
         "id": "hardware_outbound", 
         "icon": "package", 
         "type": "module", 
         "label": "Hardware Outbound", 
         "status": "draft", 
         "labelZh": "硬件出库" 
       }, 
       { 
         "id": "license_issuance", 
         "icon": "key", 
         "type": "module", 
         "label": "License Issuance", 
         "status": "draft", 
         "labelZh": "授权发放" 
       }, 
       { 
         "id": "ticket", 
         "icon": "ticket", 
         "type": "module", 
         "label": "Implementation Ticket", 
         "status": "draft", 
         "labelZh": "实施工单" 
       }, 
       { 
         "id": "resource", 
         "icon": "hard-hat", 
         "type": "module", 
         "label": "Resource Pool", 
         "status": "draft", 
         "labelZh": "资源池" 
       }, 
       { 
         "id": "after_sales_ticket", 
         "icon": "ticket-check", 
         "type": "module", 
         "label": "After-sales Ticket", 
         "status": "draft", 
         "labelZh": "售后工单" 
       }, 
       { 
         "id": "top_issues", 
         "icon": "alert-triangle", 
         "type": "module", 
         "label": "TOP-10 Issues", 
         "status": "draft", 
         "labelZh": "TOP-10问题" 
       } 
     ] 
   }, 
   { 
     "id": "tenant", 
     "icon": "building", 
     "type": "folder", 
     "label": "Tenant & Authorization Management", 
     "status": "draft", 
     "labelZh": "租户&授权管理", 
     "children": [ 
       { 
         "id": "group", 
         "icon": "building-2", 
         "type": "module", 
         "label": "Group", 
         "status": "draft", 
         "labelZh": "集团" 
       }, 
       { 
         "id": "store", 
         "icon": "store", 
         "type": "module", 
         "label": "Store", 
         "status": "ready", 
         "labelZh": "门店" 
       }, 
       { 
         "id": "auth", 
         "icon": "key", 
         "type": "module", 
         "label": "Authorization", 
         "status": "ready", 
         "labelZh": "授权" 
       } 
     ] 
   }, 
   { 
     "id": "operation", 
     "icon": "cpu", 
     "type": "folder", 
     "label": "Operation Management", 
     "status": "ready", 
     "labelZh": "运营管理", 
     "children": [ 
       { 
         "id": "op_project", 
         "icon": "folder-kanban", 
         "type": "module", 
         "label": "Project", 
         "status": "draft", 
         "labelZh": "项目" 
       }, 
       { 
         "id": "op_ticket", 
         "icon": "ticket-check", 
         "type": "module", 
         "label": "Ticket", 
         "status": "draft", 
         "labelZh": "工单" 
       }, 
       { 
         "id": "task", 
         "icon": "check-square", 
         "type": "module", 
         "label": "Task", 
         "status": "draft", 
         "labelZh": "任务" 
       }, 
       { 
         "id": "allocation", 
         "icon": "arrow-left-right", 
         "type": "module", 
         "label": "Allocation", 
         "status": "draft", 
         "labelZh": "划拨" 
       }, 
       { 
         "id": "approval", 
         "icon": "stamp", 
         "type": "module", 
         "label": "Approval", 
         "status": "draft", 
         "labelZh": "审批" 
       }, 
       { 
         "id": "message", 
         "icon": "bell", 
         "type": "module", 
         "label": "Message", 
         "status": "draft", 
         "labelZh": "消息" 
       }, 
       { 
         "id": "feedback", 
         "icon": "message-square", 
         "type": "module", 
         "label": "Feedback", 
         "status": "draft", 
         "labelZh": "反馈" 
       }, 
       { 
         "id": "knowledge", 
         "icon": "book-open", 
         "type": "module", 
         "label": "Knowledge", 
         "status": "draft", 
         "labelZh": "知识" 
       }, 
       { 
         "id": "email", 
         "icon": "mail", 
         "type": "module", 
         "label": "Email", 
         "status": "draft", 
         "labelZh": "邮箱" 
       }, 
       { 
         "id": "chat", 
         "icon": "message-circle", 
         "type": "module", 
         "label": "Chat", 
         "status": "draft", 
         "labelZh": "沟通" 
       } 
     ] 
   }, 
   { 
     "id": "finance", 
     "icon": "badge-dollar-sign", 
     "type": "folder", 
     "label": "Finance Management", 
     "status": "draft", 
     "labelZh": "财务管理", 
     "children": [ 
       { 
         "id": "invoice", 
         "icon": "file-check", 
         "type": "module", 
         "label": "Invoicing", 
         "status": "draft", 
         "labelZh": "开票" 
       }, 
       { 
         "id": "collection", 
         "icon": "wallet", 
         "type": "module", 
         "label": "Payment Collection", 
         "status": "draft", 
         "labelZh": "回款" 
       }, 
       { 
         "id": "settlement", 
         "icon": "scale", 
         "type": "module", 
         "label": "Partner Settlement", 
         "status": "draft", 
         "labelZh": "伙伴结算" 
       }, 
       { 
         "id": "receivable", 
         "icon": "file-text", 
         "type": "module", 
         "label": "Receivables", 
         "status": "draft", 
         "labelZh": "应收" 
       }, 
       { 
         "id": "bad_debt", 
         "icon": "alert-triangle", 
         "type": "module", 
         "label": "Bad Debts", 
         "status": "draft", 
         "labelZh": "坏账" 
       } 
     ] 
   }, 
   { 
     "id": "rnd", 
     "icon": "bug", 
     "type": "folder", 
     "label": "Requirements & BUG", 
     "status": "draft", 
     "labelZh": "需求&BUG管理", 
     "children": [ 
       { 
         "id": "requirement", 
         "icon": "file-code", 
         "type": "module", 
         "label": "Requirement", 
         "status": "draft", 
         "labelZh": "需求" 
       }, 
       { 
         "id": "defect", 
         "icon": "alert-triangle", 
         "type": "module", 
         "label": "BUG", 
         "status": "draft", 
         "labelZh": "BUG" 
       } 
     ] 
   }, 
   { 
     "id": "partner_eco", 
     "icon": "network", 
     "type": "folder", 
     "label": "User & Organization Management", 
     "status": "draft", 
     "labelZh": "用户&组织管理", 
     "children": [ 
       { 
         "id": "partner", 
         "icon": "handshake", 
         "type": "module", 
         "label": "Partner", 
         "status": "draft", 
         "labelZh": "伙伴" 
       }, 
       { 
         "id": "user", 
         "icon": "user-circle", 
         "type": "module", 
         "label": "User", 
         "status": "draft", 
         "labelZh": "用户" 
       }, 
       { 
         "id": "group_mgmt", 
         "icon": "users", 
         "type": "module", 
         "label": "Group Management", 
         "status": "draft", 
         "labelZh": "群组管理" 
       } 
     ] 
   }, 
   { 
     "id": "dashboard", 
     "icon": "bar-chart-3", 
     "type": "folder", 
     "label": "Data Dashboard", 
     "status": "draft", 
     "labelZh": "数据看板", 
     "children": [ 
       { 
         "id": "report_lead", 
         "icon": "line-chart", 
         "type": "module", 
         "label": "Lead Report", 
         "status": "draft", 
         "labelZh": "线索报表" 
       }, 
       { 
         "id": "report_opportunity", 
         "icon": "line-chart", 
         "type": "module", 
         "label": "Opportunity Report", 
         "status": "draft", 
         "labelZh": "商机报表" 
       }, 
       { 
         "id": "report_customer", 
         "icon": "line-chart", 
         "type": "module", 
         "label": "Customer Report", 
         "status": "draft", 
         "labelZh": "客户报表" 
       }, 
       { 
         "id": "report_presales", 
         "icon": "line-chart", 
         "type": "module", 
         "label": "Pre-sales Report", 
         "status": "draft", 
         "labelZh": "售前报表" 
       }, 
       { 
         "id": "report_order", 
         "icon": "line-chart", 
         "type": "module", 
         "label": "Order Report", 
         "status": "draft", 
         "labelZh": "订单报表" 
       }, 
       { 
         "id": "report_collection", 
         "icon": "line-chart", 
         "type": "module", 
         "label": "Collection Report", 
         "status": "draft", 
         "labelZh": "回款报表" 
       }, 
       { 
         "id": "report_invoice", 
         "icon": "line-chart", 
         "type": "module", 
         "label": "Invoice Report", 
         "status": "draft", 
         "labelZh": "开票报表" 
       }, 
       { 
         "id": "report_product_sales", 
         "icon": "line-chart", 
         "type": "module", 
         "label": "Product Sales Report", 
         "status": "draft", 
         "labelZh": "产品销售报表" 
       }, 
       { 
         "id": "report_tenant", 
         "icon": "line-chart", 
         "type": "module", 
         "label": "Tenant Report", 
         "status": "draft", 
         "labelZh": "租户报表" 
       }, 
       { 
         "id": "report_project", 
         "icon": "line-chart", 
         "type": "module", 
         "label": "Project Report", 
         "status": "draft", 
         "labelZh": "项目报表" 
       }, 
       { 
         "id": "report_ticket", 
         "icon": "line-chart", 
         "type": "module", 
         "label": "Ticket Report", 
         "status": "draft", 
         "labelZh": "工单报表" 
       }, 
       { 
         "id": "report_task", 
         "icon": "line-chart", 
         "type": "module", 
         "label": "Task Report", 
         "status": "draft", 
         "labelZh": "任务报表" 
       }, 
       { 
         "id": "report_approval", 
         "icon": "line-chart", 
         "type": "module", 
         "label": "Approval Report", 
         "status": "draft", 
         "labelZh": "审批报表" 
       }, 
       { 
         "id": "report_user", 
         "icon": "line-chart", 
         "type": "module", 
         "label": "User Report", 
         "status": "draft", 
         "labelZh": "用户报表" 
       }, 
       { 
         "id": "report_partner_commission", 
         "icon": "line-chart", 
         "type": "module", 
         "label": "Partner Commission Report", 
         "status": "draft", 
         "labelZh": "伙伴返佣报表" 
       }, 
       { 
         "id": "report_sales_perf", 
         "icon": "line-chart", 
         "type": "module", 
         "label": "Sales Performance Report", 
         "status": "draft", 
         "labelZh": "销售业绩报表" 
       }, 
       { 
         "id": "report_resource", 
         "icon": "line-chart", 
         "type": "module", 
         "label": "Resource Pool Report", 
         "status": "draft", 
         "labelZh": "资源池报表" 
       } 
     ] 
   }, 
   { 
     "id": "system_settings", 
     "icon": "settings", 
     "type": "folder", 
     "label": "System Settings", 
     "status": "draft", 
     "labelZh": "系统设置", 
     "children": [ 
       { 
         "id": "sys_profile", 
         "icon": "user-cog", 
         "type": "module", 
         "label": "Personal Settings", 
         "status": "draft", 
         "labelZh": "个人设置" 
       }, 
       { 
         "id": "sys_role_perm", 
         "icon": "shield", 
         "type": "module", 
         "label": "Role & Permissions", 
         "status": "draft", 
         "labelZh": "系统角色及权限管理" 
       }, 
       { 
         "id": "sys_org", 
         "icon": "building-2", 
         "type": "module", 
         "label": "Organization", 
         "status": "draft", 
         "labelZh": "组织管理" 
       }, 
       { 
         "id": "sys_sensitive", 
         "icon": "lock", 
         "type": "module", 
         "label": "Sensitive Data", 
         "status": "draft", 
         "labelZh": "敏感数据管理" 
       }, 
       { 
         "id": "sys_translation", 
         "icon": "languages", 
         "type": "module", 
         "label": "Translation", 
         "status": "draft", 
         "labelZh": "翻译管理" 
       }, 
       { 
         "id": "sys_template", 
         "icon": "copy", 
         "type": "module", 
         "label": "Sales Templates", 
         "status": "draft", 
         "labelZh": "销售相关模版管理" 
       }, 
       { 
         "id": "sys_task_pool", 
         "icon": "list-todo", 
         "type": "module", 
         "label": "Standard Task Pool", 
         "status": "draft", 
         "labelZh": "标准任务池" 
       }, 
       { 
         "id": "sys_wbs_tpl", 
         "icon": "gantt-chart", 
         "type": "module", 
         "label": "Project WBS Template", 
         "status": "draft", 
         "labelZh": "项目WBS模版" 
       }, 
       { 
         "id": "sys_ticket_tpl", 
         "icon": "ticket", 
         "type": "module", 
         "label": "Ticket Configuration", 
         "status": "draft", 
         "labelZh": "工单配置" 
       }, 
       { 
         "id": "sys_approval_tpl", 
         "icon": "stamp", 
         "type": "module", 
         "label": "Approval Template", 
         "status": "draft", 
         "labelZh": "审批模版" 
       }, 
       { 
         "id": "sys_notification", 
         "icon": "bell", 
         "type": "module", 
         "label": "Notification Config", 
         "status": "draft", 
         "labelZh": "通知配置" 
       }, 
       { 
         "id": "sys_notify_mgr", 
         "icon": "bell-ring", 
         "type": "module", 
         "label": "Message Log Management", 
         "status": "draft", 
         "labelZh": "消息日志管理" 
       }, 
       { 
         "id": "sys_params", 
         "icon": "sliders", 
         "type": "module", 
         "label": "System Parameters", 
         "status": "draft", 
         "labelZh": "系统参数管理" 
       }, 
       { 
         "id": "sys_dict", 
         "icon": "database", 
         "type": "module", 
         "label": "Data Dictionary", 
         "status": "draft", 
         "labelZh": "字典管理" 
       }, 
       { 
         "id": "sys_logs", 
         "icon": "scroll-text", 
         "type": "module", 
         "label": "System Logs", 
         "status": "draft", 
         "labelZh": "日志管理" 
       }, 
       { 
         "id": "sys_integration", 
         "icon": "blocks", 
         "type": "module", 
         "label": "Integration", 
         "status": "draft", 
         "labelZh": "集成管理" 
       }, 
       { 
         "id": "sys_enterprise", 
         "icon": "building", 
         "type": "module", 
         "label": "Enterprise Info", 
         "status": "draft", 
         "labelZh": "企业信息" 
       }, 
       { 
         "id": "sys_agent", 
         "icon": "bot", 
         "type": "module", 
         "label": "Agent Management", 
         "status": "draft", 
         "labelZh": "Agent 管理" 
       }, 
       { 
         "id": "sys_api_keys", 
         "icon": "key", 
         "type": "module", 
         "label": "App & API Keys", 
         "status": "draft", 
         "labelZh": "应用及API Key管理" 
       } 
     ] 
   } 
 ];

export const COMMON_PROMPTS: PromptTemplate[] = [
    { id: 'p1', label: 'Refine Req', content: 'Review the current requirements and suggest improvements for clarity and completeness based on B2B SaaS best practices.' },
    { id: 'p2', label: 'Generate Logic', content: 'Based on the requirements, suggest a list of business logic rules (IF...THEN...) that should be implemented.' },
    { id: 'p3', label: 'Draft API', content: 'Design a RESTful API structure for this module, including endpoints, methods, and request/response bodies.' },
    { id: 'p4', label: 'Edge Cases', content: 'Identify potential edge cases and error scenarios that need to be handled in this feature.' },
];

export const DATA_PROMPTS: PromptTemplate[] = [
    { id: 'dp1', label: 'Suggest Metrics', content: 'Suggest key performance indicators (KPIs) and metrics relevant to this dashboard.' },
    { id: 'dp2', label: 'Chart Types', content: 'Recommend the best chart types (e.g., Line, Bar, Pie) to visualize each metric effectively.' },
    { id: 'dp3', label: 'Data Schema', content: 'Define the data structure/schema required to support these charts and metrics.' },
    { id: 'dp4', label: 'Filter Logic', content: 'Design the filtering and drill-down logic for this report.' },
];

export const INITIAL_AGENTS: AIAgent[] = [
    {
        id: 'agent_1',
        name: 'M&S-A',
        avatar: '🚀',
        role: '市场与销售产品助理',
        description: '负责市场与销售领域的产品设计与需求分析，专精于线索培育、成交策略及营销活动优化。',
        systemPrompt: `Role / 角色定位:
你是一位顶级的 企业级业务架构师 (Enterprise Architect) 与 AI 驱动产品专家。你专注于为 B2B SaaS 公司（如 RestoSuite）设计高效的内部 Marketing 和 Sales 支撑系统。`,
        pmInteractionExample: `“我接到了‘线索全球分配逻辑’功能的开发任务...“`,
        commonPrompts: [
            ...COMMON_PROMPTS,
            { id: 'ms_1', label: 'PRD: 核心功能', content: '为当前选中的功能模块生成标准 PRD，包括功能概述、核心用户故事（User Stories）和验收标准（Acceptance Criteria）。重点关注业务流程闭环和关键数据流转。' },
            { id: 'ms_2', label: 'PRD: 业务规则', content: '设计当前模块的核心业务规则逻辑。包括显性规则（如必填校验、状态流转限制）和隐性规则（如自动触发器、计算公式、权限控制）。' },
            { id: 'ms_3', label: '架构: 数据模型', content: '设计当前模块的数据模型（ER 图描述）。包括核心实体字段定义（类型、约束）、与其他模块（如客户、订单）的关联关系，以及关键索引建议。' },
            { id: 'ms_4', label: '架构: 状态机', content: '定义当前业务对象的全生命周期状态机。列出所有可能的状态（如：新建、审核中、生效、关闭），并详细描述每个状态流转的前置条件和触发动作。' },
            { id: 'ms_5', label: '架构: 接口设计', content: '设计当前模块的 RESTful API 规范。包括增删改查（CRUD）及特定业务操作（如：提交审批、作废）的接口定义，指定路径、HTTP方法及核心入参出参。' },
            { id: 'ms_6', label: '架构: 数据流转', content: '分析当前模块与上下游模块的数据流转关系（LTC/OTC流程）。描述数据是如何从上游（如线索/商机）流入，以及如何向下游（如订单/回款）传递的。' },
            { id: 'ms_7', label: '任务: 开发拆解', content: '将当前模块拆解为具体的全栈开发任务清单。包括后端 API 开发、数据库迁移脚本、前端列表/详情页实现及组件封装。并预估每个任务的复杂度。' },
            { id: 'ms_8', label: '任务: 测试用例', content: '为当前模块的核心业务场景生成验收测试用例。覆盖正常流程、异常流程及边界条件，使用 Gherkin 格式（Given-When-Then）描述。' },
            { id: 'ms_9', label: '合规: 风险分析', content: '分析当前模块在出海场景下的合规风险（如 GDPR、多币种、多时区）。提出针对性的数据合规、审计追踪及本地化技术解决方案。' },
            { id: 'ms_10', label: '桥接: 指令包', content: '作为架构师，将上述生成的数据模型、API 定义及业务规则转化为可直接提供给 AI 编程工具的“工程化指令包”。包含 SQL DDL、TS 接口定义及伪代码逻辑。' }
        ],
        status: 'active',
        scope: ['market_sales', 'lead', 'opportunity', 'contract']
    },
    {
        id: 'agent_2',
        name: 'P&S-A',
        avatar: '🛠️',
        role: '交付与售后产品助理',
        description: '负责实施交付、项目管理及客户售后服务模块的需求设计。确保项目里程碑管理与工单处理流程闭环。',
        systemPrompt: `Role / 角色定位:
你是一位深耕 B2B SaaS 行业的 交付运营 (Delivery Ops) 与服务治理 (Service Governance) 专家。`,
        pmInteractionExample: `“我需要开发‘售后工单管理’模块...“`,
        commonPrompts: COMMON_PROMPTS,
        status: 'active',
        scope: ['service_delivery', 'project', 'ticket', 'resource']
    },
    {
        id: 'agent_3',
        name: 'G&A-A',
        avatar: '🏛️',
        role: '基础功能及职能部门产品助理',
        description: '负责系统底层架构、租户管理、财务结算及生态伙伴管理。专注于多租户隔离策略、权限体系设计及合规性审计。',
        systemPrompt: `Role / 角色定位:
你是一位资深的 SaaS 平台架构师与财务合规专家。你专注于系统底层（System Settings）、租户管理（Tenant）、财务（Finance）及用户权限体系（RBAC）的设计。`,
        pmInteractionExample: `“请设计一套支持全球多税率的财务结算逻辑...“`,
        commonPrompts: COMMON_PROMPTS,
        status: 'active',
        scope: ['system_settings', 'tenant', 'finance', 'partner_eco']
    },
    {
        id: 'agent_4',
        name: 'D&A-A',
        avatar: '📊',
        role: '数据报表与决策分析产品助理',
        description: '负责全系统的数据可视化、BI 报表设计及决策支持分析。确保数据指标体系的准确性与洞察力。',
        systemPrompt: `Role / 角色定位:
你是一位精通数据治理与商业智能 (BI) 的数据产品专家。你专注于设计高价值的数据看板（Dashboard）与分析报表。`,
        pmInteractionExample: `“我需要为销售总监设计一张‘季度业绩预测’的仪表盘...“`,
        commonPrompts: DATA_PROMPTS,
        status: 'active',
        scope: ['dashboard']
    }
];
