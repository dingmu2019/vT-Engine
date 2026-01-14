import { AIAgent, PromptTemplate } from '../types';

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
        commonPrompts: COMMON_PROMPTS,
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
