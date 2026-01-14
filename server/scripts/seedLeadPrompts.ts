
import { store } from '../src/data/store';
import { PromptTemplate } from '../src/types';

const NEW_PROMPTS: PromptTemplate[] = [
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
];

async function run() {
    const agentId = 'agent_1'; // M&S-A agent key
    console.log(`Seeding ${NEW_PROMPTS.length} prompts for agent ${agentId}...`);
    
    // First, clear existing prompts for this agent to avoid duplicates or stale data
    // Note: Since we don't have a clearPrompts method exposed easily here, we rely on the fact 
    // that the user might want to manually manage them or we overwrite if IDs match.
    // However, store.addAgentPrompt typically pushes. For a clean slate in a real app, we'd delete first.
    // For this script, we'll just add them. The UI renders what's in DB.
    
    for (const p of NEW_PROMPTS) {
        try {
            await store.addAgentPrompt(agentId, p, { userId: 'system', userName: 'System Script' });
            console.log(`Added prompt: ${p.label}`);
        } catch (e: any) {
            console.error(`Failed to add prompt ${p.label}:`, e.message);
        }
    }
    console.log('Done.');
    process.exit(0);
}

run().catch(e => {
    console.error(e);
    process.exit(1);
});
