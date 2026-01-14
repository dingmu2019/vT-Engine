## 背景与目标
- 目标：将左侧“功能全景树”选中菜单右侧的“功能状态Tab”（功能开发状态、责任人分配、开发排期）的填写结果，稳定落库并同步到该菜单节点的数据记录中，用于后续展示与统计。
- 现状：
  - 菜单树来自表 navigation_nodes（store.getNavigation 已支持 status、icon、label 等）。
  - 功能模块详情来自表 modules（store.getModule / updateModule 已支持 status、owners、timeline、requirements 等）。
  - 前端功能状态 UI 位于 StatusTab.tsx，被 FeatureStudio.tsx 挂载。
- 结论：采用“模块数据为真、菜单显示为衍生”的双表协同方案：Tab 写入 modules，菜单节点的 status 同步更新到 navigation_nodes，用于树上的状态徽标/筛选。

## 数据模型与字段映射
- modules（主记录）：
  - status：功能开发状态（草稿/就绪等），Tab 的单选结果直接写入。
  - owners：{ pmId, devId, expertId }，Tab 的负责人选择写入。
  - timeline：{ plannedStart, plannedEnd }，Tab 的计划时间写入。
- navigation_nodes（展示同步）：
  - status：从 modules.status 同步（例如 draft/ready），用于树节点的状态样式与筛选。
- 关联键：使用菜单节点 key 作为模块 id（现有实现即如此），保证一对一映射。

## 后端接口与服务
- 模块接口（复用）：
  - GET /api/modules/:id → 读取当前 Tab 初始值（status/owners/timeline）。
  - POST /api/modules/:id → 更新 Tab 提交字段（仅写入传入的属性）。
- 新增轻量菜单状态同步接口：
  - PATCH /api/navigation/node/:key/status → body: { status }，将节点 status 与 modules.status 保持一致。
- 服务层变更：
  - store.updateModule(id, updates, ctx) 中成功后触发 status 同步（调用新的导航状态更新方法），并写审计日志（现有 logAction 即可）。
  - 新增 store.updateNavigationNodeStatus(key, status)：只更新 navigation_nodes 的 status 字段（避免整树 upsert）。

## 前端交互与状态管理
- 初始化：FeatureStudio 挂载时，用选中节点 id 调用 GET /api/modules/:id，填充 StatusTab 初始值。
- 保存策略：
  - 事件驱动（推荐）：Tab 每次变更（状态切换、负责人选择、时间选择）触发防抖 500ms 的自动保存；失败回退 UI 并 toast 提示。
  - 或显式“保存”按钮：点击一次 POST 更新；成功后再调用 PATCH 同步菜单 status。
- 乐观更新：
  - 提交前先在本地状态设置临时值，接口成功后确认；接口失败则回滚。
- 同步菜单：
  - modules.status 更新成功后，立即调用 PATCH 导航接口，刷新左侧树该节点的 status（保留当前展开/选中态）。

## 审计与权限
- 每次更新 Tab 字段，写入 audit_logs：
  - action：Update Module
  - module：当前模块 key
  - details：具体变更字段（status/owners/timeline）
- 权限：
  - 仅允许具备 canManageUsers 或相应角色的用户更新（前端按钮/控件禁用；后端可在 RLS 或中间件校验）。

## 失败回退与容错
- Supabase/DB 不可用：store.updateModule catch 后不抛出到前端，返回提示并保持内存/静态数据（现有 INITIAL 数据作为只读回退）。
- 菜单状态同步失败：不影响主记录保存；记录 system_errors，下一次树刷新时再读取最新 modules.status 进行纠偏（可选定时对账）。

## 性能与体验
- 防抖保存（500ms）+ 请求合并：同一字段的频繁变更只发最后一次。
- 分离菜单状态更新为轻量 PATCH，避免整树 upsert 的开销与风险。
- 左树刷新粒度：只刷新被更新节点的 status，不重新拉整棵树（提供前端局部状态更新 API）。

## 验证与演示
- 单元与集成测试：
  - 更新 status → modules.status 改变且 navigation_nodes.status 同步。
  - 更新 owners/timeline → modules 对应字段持久化，审计日志新增记录。
- UI 验证：
  - 改变状态后，左侧节点徽标变化；刷新后仍保持。

## 迭代扩展（可选）
- 为 navigation_nodes 增加 meta JSONB（owners、timeline 摘要），便于树上直接展示负责人/时间概要；当前版本先只同步 status，降低改表复杂度。
- 增加批量更新接口：对选中多个节点批量设置状态/负责人。

## 交付内容与改动点
- 后端：新增 PATCH /api/navigation/node/:key/status；store 增加 updateNavigationNodeStatus，并在 updateModule 成功后触发同步。
- 前端：StatusTab 的自动保存与乐观更新；成功后调用菜单状态同步并局部刷新树节点。
- 审计：沿用 store.logAction；细化 details 字段内容。

请确认该方案，我将开始按上述步骤实现（接口、服务层、前端 Tab 自动保存与树节点同步），并提供验证用例与演示。