
-- Migration to add description column to navigation_nodes table
ALTER TABLE navigation_nodes ADD COLUMN IF NOT EXISTS description TEXT DEFAULT '';
COMMENT ON COLUMN navigation_nodes.description IS 'Module or folder description';
