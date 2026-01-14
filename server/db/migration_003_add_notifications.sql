-- -----------------------------------------------------------------------------
-- 数据库迁移脚本: 003_add_notifications
-- 描述: 新增 飞书 (Feishu/Lark) 和 Slack 的集成配置
-- 作者: T-Engine Team
-- 日期: 2026-01-06
-- -----------------------------------------------------------------------------

INSERT INTO integrations (key, name, type, config, enabled) VALUES 
-- [通知服务] 飞书 / Lark
(
    'feishu_global', 
    'Feishu / Lark', 
    'notification', 
    '{
        "appId": "", 
        "appSecret": "", 
        "webhookUrl": ""
    }', 
    false
),

-- [通知服务] Slack
(
    'slack_global', 
    'Slack', 
    'notification', 
    '{
        "botToken": "", 
        "channelId": "", 
        "webhookUrl": ""
    }', 
    false
)
ON CONFLICT (key) DO NOTHING;
