# T-Engine 验证-002 (AI-Powered Architecture Studio)

<div align="center">
  <img src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" alt="Banner" width="100%" />
</div>

## 概览
**T-Engine** 是一套面向“需求 → 逻辑 → UI → 实施”的一体化软件需求与架构设计工作台，并内置多角色 AI 助理协同能力。它把业务需求、系统逻辑、UI 蓝图、实施任务、知识库与团队讨论放到同一处，帮助 PM/架构/研发在同一份结构化资产上高效对齐与迭代。

## 功能全景
- **Feature Studio（功能工作室）**：围绕单个模块（菜单节点）进行结构化编辑与协作（需求/逻辑/UI/实施/知识/讨论/AI）。
- **AI 助理与多 Agent**：不同领域/角色的 AI 助理，支持选择提示词、上下文回放、内容导出等。
- **动态导航树**：可配置的树形导航，按节点沉淀模块资产；支持全局标准（Global Standards）。
- **角色与权限（RBAC）**：Admin / PM / Expert / Dev 不同权限边界与操作能力。
- **集成中心**：对接外部 LLM、数据库、邮件等能力，并提供“数据库 Schema 获取”能力。
- **审计与运维可观测**：审计日志、系统错误日志、软删除等。

## 核心概念
- **导航节点（Navigation Node）**：树形菜单里的一个节点，对应一个业务模块（module_key）。
- **模块资产（Module Data）**：围绕节点沉淀的结构化内容（需求、逻辑、UI、实施等）。
- **AI 聊天消息（AI Chat Messages）**：按模块节点存储、分页回放的对话消息（user/model）。
- **反馈与互动（Feedback）**：对 AI 回复进行收藏/点赞/不认可的用户维度记录。

## 角色与权限
系统内置四种角色（示例种子用户：Admin/PM/Expert/Dev）：
- **Admin**
  - 用户管理（创建/更新/启用禁用/重置密码）
  - 全局标准与结构管理
  - 内容编辑
  - 系统运维能力（如清理日志、删除任意用户/任意时间的 AI 聊天记录等）
- **PM**
  - 全局标准与结构管理
  - 内容编辑（需求/逻辑/UI 等）
- **Expert**
  - 内容编辑（通常用于专业审阅/知识补齐）
- **Dev**
  - 以消费与落地为主（浏览、实施、协作），权限受限于 RBAC 配置

## Feature Studio（功能工作室）
Feature Studio 是围绕“一个模块节点”的主工作区，核心能力如下：
- **需求（Requirements）**：结构化记录背景、目标、范围、验收、边界等。
- **业务逻辑（Business Logic）**：流程、状态机、规则、异常路径等逻辑资产沉淀。
- **UI 蓝图（UI Blueprint）**：页面/组件/交互说明与视图资产。
- **实施任务（Implementation Tasks）**：从需求/逻辑/UI 拆解出的研发任务与落地计划。
- **知识库（Knowledge）**：沉淀模块相关的规范、FAQ、经验、约束。
- **讨论区（Discussion）**：团队围绕模块的讨论与反馈。
- **AI 助理（AI Assistant）**：对该模块进行问答、生成/优化内容、沉淀可复用提示词。

## AI 助理（AIAssistant）
AI 助理以“模块节点”为作用域，支持对话回放与多种增强能力：
- **多 Agent 切换**：可选择不同 AI 助理（不同角色/领域），切换后继续围绕同模块工作。
- **提示词管理**
  - 常用提示词面板（检索、选择）
  - 可将当前内容保存为提示词，形成团队可复用资产
- **对话记录**
  - 按模块节点分页加载历史消息（游标分页）
  - 删除对话（需确认，且建议成对删除提问+回复）
    - 普通用户：仅能删除近 12 小时内的本人提问（同时删除对应回复）
    - Admin：可删除任意时间、任意用户（同样成对删除）
- **AI 回复互动**
  - **收藏 / 点赞 / 不认可**（与“复制”在同一排，位于回复下方）
  - 互动操作会记录到数据库，并在历史回放时回显当前用户的反馈状态
- **导出与复用**
  - 复制内容
  - 截图到剪贴板
  - 导出 PDF（打印方式）
  - 导出 Word（.doc）
  - 一键应用到需求区（把 AI 输出沉淀为模块资产）
- **附件（预留扩展）**
  - 支持粘贴/上传图片、视频、文件等（前端展示与消息结构已预留）

## 集成中心（Integrations）
- **LLM 集成**：用于驱动 AI 助理生成/优化能力。
- **数据库集成与 Schema 获取**：启用后可从配置的数据库获取表结构信息（用于理解与设计）。
- **邮件集成**：支持配置邮件服务并进行发送（用于通知/联络等场景）。

## 审计与错误日志
- **审计日志（Audit Logs）**：关键操作会记录审计轨迹。
- **系统错误日志（System Errors）**：全局错误处理器会写入系统错误记录，便于排查问题。
- **软删除（Soft Delete）**：AI 聊天记录删除为软删除（`deleted_at`），避免误删导致的数据不可恢复。

## Project Structure

This project follows a client-server architecture:

- **[`/server`](./server/README.md)**: Node.js/Express backend handling API, DB, and Auth.
- **[`/components`](./components/README.md)**: React frontend components and UI logic.
- **[`/data`](./data/README.md)**: Static configurations, mock data, and initial seeds.
- **Root Files**: Frontend entry points (`index.tsx`, `App.tsx`) and build config (`vite.config.ts`).

## Getting Started

### Prerequisites
- Node.js (v16+)
- PostgreSQL (or Supabase account)

### Quick Start

1.  **Install Dependencies** (Root & Server):
    ```bash
    # Install frontend deps
    npm install

    # Install backend deps
    cd server
    npm install
    cd ..
    ```

2.  **Configure Environment**:
    - Create `.env` in the root (for frontend keys like `VITE_SUPABASE_URL`).
    - Create `.env` in `server/` (see [`server/README.md`](./server/README.md)).

3.  **Start Development Servers**:
    You need to run both frontend and backend.

    **Terminal 1 (Backend):**
    ```bash
    cd server
    npm run dev
    ```

    **Terminal 2 (Frontend):**
    ```bash
    npm run dev
    ```

4.  **Access the App**:
    Open http://localhost:5173 (or the port shown in your terminal).

## 数据库与迁移（Supabase/PostgreSQL）
后端通过 Supabase 客户端访问 PostgreSQL。数据库结构与功能增量通过 `server/db/` 下的 SQL 脚本维护：
- `schema.sql`：核心表结构
- `migration_*.sql`：功能增量（例如：AI 聊天消息、软删除、评论/讨论、AI 回复反馈等）

如果你启用了 Supabase，请将这些 SQL 迁移按顺序在 Supabase SQL Editor 中执行（或用你自己的迁移工具执行）。

## Documentation
- [Backend Documentation](./server/README.md)
- [Component Documentation](./components/README.md)
- [Data & Configuration](./data/README.md)
