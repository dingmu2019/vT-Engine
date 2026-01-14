-- -----------------------------------------------------------------------------
-- 数据库迁移脚本: 002_integrations
-- 描述: 创建集成管理 (Integration Management) 所需的数据库表结构及初始数据
-- 作者: T-Engine Team
-- 日期: 2026-01-06
-- -----------------------------------------------------------------------------

-- 1. 启用 UUID 扩展 (如果尚未启用)
-- 用于生成全局唯一的 UUID 主键
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. 创建 integrations 表
-- 用于存储各类第三方服务集成及系统级配置，支持热插拔 (Hot-pluggable)
CREATE TABLE IF NOT EXISTS integrations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),           -- 主键，自动生成 UUID
    key VARCHAR(255) NOT NULL UNIQUE,                         -- 唯一标识符 (Slug)，如 'llm_global', 'email_config'，用于代码中引用
    name VARCHAR(255) NOT NULL,                               -- 显示名称，如 'Global LLM Configuration'
    type VARCHAR(50) NOT NULL,                                -- 集成类型，用于前端分类展示: 'llm' (大模型), 'db' (数据库), 'notification' (通知), 'system' (系统信息)
    config JSONB DEFAULT '{}',                                -- 核心配置数据，使用 JSONB 存储灵活的键值对 (如 API Key, Host, Port 等)
    enabled BOOLEAN DEFAULT true,                             -- 热插拔开关: true=启用, false=禁用。禁用后系统应停止调用该服务
    schema JSONB DEFAULT '{}',                                -- (可选) 配置表单的 JSON Schema 定义，用于前端动态生成校验表单
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),        -- 创建时间
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()         -- 更新时间
);

-- 添加注释
COMMENT ON TABLE integrations IS '集成管理配置表，存储LLM、邮件、数据库等第三方服务的连接信息';
COMMENT ON COLUMN integrations.key IS '业务唯一标识Key，代码通过此Key获取配置';
COMMENT ON COLUMN integrations.config IS 'JSON格式的具体配置信息，不同类型结构不同';
COMMENT ON COLUMN integrations.enabled IS '启用状态开关，控制该集成功能是否生效';

-- 3. 预置初始化数据 (Seed Initial Data)
-- 插入默认的集成配置，如果 key 已存在则跳过 (ON CONFLICT DO NOTHING)

INSERT INTO integrations (key, name, type, config, enabled) VALUES 
-- [LLM 配置] Google Gemini
(
    'llm_global', 
    'Global LLM Configuration', 
    'llm', 
    '{
        "provider": "google", 
        "model": "gemini-3-pro-preview", 
        "baseUrl": "https://generativelanguage.googleapis.com", 
        "apiKey": "", 
        "maxTokens": 20480, 
        "temperature": 0.7
    }', 
    true
),

-- [通知服务] 邮件服务 (默认关闭)
(
    'email_global', 
    'Email Service', 
    'notification', 
    '{
        "host": "smtp.gmail.com", 
        "port": 587, 
        "user": "", 
        "pass": "", 
        "senderName": "RestoSuite Notification"
    }', 
    false
),

-- [通知服务] 企业微信 (默认关闭)
(
    'wechat_global', 
    'WeChat Work', 
    'notification', 
    '{
        "corpId": "", 
        "agentId": "", 
        "secret": ""
    }', 
    false
),

-- [数据库] 业务数据库连接
(
    'db_global', 
    'Database Connection', 
    'db', 
    '{
        "type": "mysql", 
        "host": "localhost", 
        "port": 3306, 
        "database": "restosuite_core", 
        "username": "root", 
        "password": ""
    }', 
    true
),

-- [系统信息] 企业基本信息
(
    'enterprise_info', 
    'Enterprise Information', 
    'system', 
    '{
        "name": "RestoSuite Inc.", 
        "address": "Singapore HQ", 
        "taxId": "", 
        "contact": ""
    }', 
    true
)
ON CONFLICT (key) DO NOTHING;
