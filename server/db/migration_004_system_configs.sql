
-- Create system_configs table for storing global settings and documents
-- 创建系统配置表，用于存储全局设置、文档和长文本配置
CREATE TABLE IF NOT EXISTS system_configs (
  key TEXT PRIMARY KEY,                  -- 配置键 (唯一标识，如 'global_standards')
  value TEXT NOT NULL,                   -- 配置值 (内容，支持长文本/Markdown)
  description TEXT,                      -- 配置描述 (用途说明)
  updated_by TEXT,                       -- 最后修改人 ID
  created_at TIMESTAMPTZ DEFAULT NOW(),  -- 创建时间
  updated_at TIMESTAMPTZ DEFAULT NOW()   -- 最后修改时间
);

-- Enable RLS
-- 启用行级安全策略
ALTER TABLE system_configs ENABLE ROW LEVEL SECURITY;

-- Create policy (permissive for dev, can be tightened later)
-- 创建访问策略 (开发环境下允许所有操作)
CREATE POLICY "Enable all access for service role" ON system_configs FOR ALL USING (true) WITH CHECK (true);

-- Trigger for updated_at
-- 设置自动更新时间戳触发器
CREATE TRIGGER update_system_configs_updated_at
BEFORE UPDATE ON system_configs
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Add Comments
-- 添加详细中文注释
COMMENT ON TABLE system_configs IS '系统全局配置表，存储非结构化的文档、协议及系统级参数';
COMMENT ON COLUMN system_configs.key IS '配置唯一标识键 (Primary Key)';
COMMENT ON COLUMN system_configs.value IS '配置内容 (Text)，通常为 Markdown 或 JSON 字符串';
COMMENT ON COLUMN system_configs.description IS '配置项的用途描述';
COMMENT ON COLUMN system_configs.updated_by IS '最后一次修改该配置的用户ID';
