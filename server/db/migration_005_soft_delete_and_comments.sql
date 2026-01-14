
-- -----------------------------------------------------------------------------
-- 数据库迁移脚本: 005_soft_delete_and_comments
-- 描述: 符合全局规范的改造 - 添加软删除字段、完善枚举注释
-- 日期: 2026-01-13
-- -----------------------------------------------------------------------------

-- 1. 为核心表添加 deleted_at 字段 (软删除)
ALTER TABLE modules ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE agents ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE navigation_nodes ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- 2. 添加枚举值注释

-- Users 表状态与性别
COMMENT ON COLUMN users.status IS '用户状态: active(激活), disabled(禁用), pending(待审核)';
COMMENT ON COLUMN users.gender IS '性别: male(男), female(女), secret(保密)';
COMMENT ON COLUMN users.role IS '系统角色: Admin(管理员), PM(产品经理), Expert(行业专家), Dev(开发者)';

-- Modules 表状态
COMMENT ON COLUMN modules.status IS '模块状态: draft(草稿), ready(就绪/已发布), archived(归档)';

-- Navigation Nodes 表类型与状态
COMMENT ON COLUMN navigation_nodes.type IS '节点类型: folder(文件夹), module(业务模块)';
COMMENT ON COLUMN navigation_nodes.status IS '节点状态: draft(草稿), ready(已发布)';

-- Integrations 表类型
COMMENT ON COLUMN integrations.type IS '集成类型: llm(大模型), db(数据库), notification(通知服务), system(系统信息)';

-- Audit Logs 状态
COMMENT ON COLUMN audit_logs.status IS '操作结果: success(成功), failed(失败)';

-- System Errors 状态
COMMENT ON COLUMN system_errors.status IS '错误处理状态: open(未处理), resolved(已解决), ignored(已忽略)';

-- Agents 状态
COMMENT ON COLUMN agents.status IS 'Agent状态: active(启用), disabled(禁用), maintenance(维护中)';
