
export type Role = 'Admin' | 'PM' | 'Expert' | 'Dev';
export type Theme = 'light' | 'dark' | 'system';
export type Language = 'en' | 'zh';

export interface UserPreferences {
  theme: Theme;
  language: Language;
  timezoneOffset: number;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatar: string; // Initials used as fallback
  avatarUrl?: string; // URL for image avatar
  status: 'active' | 'disabled';
  gender: 'male' | 'female' | 'secret';
  phone: string;
  bio: string;
  preferences?: UserPreferences;
}

export interface NavNode {
  id: string;
  label: string;
  labelZh: string;
  description?: string; // Added description field
  type: 'folder' | 'module';
  children?: NavNode[];
  status: 'draft' | 'ready';
  icon?: string; // Icon key for mapping
}

// Logic Engine Types
export interface LogicRule {
  id: string;
  name: string;      // New: Human readable name
  condition: string; // Expression
  action: string;    // Function call
  enabled: boolean;  // New: Active toggle
}

// Knowledge Types
export interface KnowledgeItem {
  id: string;
  title: string;
  type: 'doc' | 'api' | 'design' | 'pdf' | 'excel' | 'web' | 'txt' | 'image' | 'video';
  status?: 'uploading' | 'processing' | 'ready' | 'error'; // AI Processing status
  url?: string;
  content?: string; // Inline content for auto-generated docs
  tags?: string[];
  size?: string; // e.g. "2.4 MB"
  updatedAt: string;
}

// UI Blueprint Types
export interface UIComponent {
  id: string;
  name: string;
  checked: boolean;
}

export interface FigmaLink {
  id: string;
  title: string;
  url: string;
  addedAt: string;
}

export interface PrototypeImage {
  id: string;
  name: string;
  url: string; // Blob URL
  size: string;
  uploadedAt: string;
}

// Audit Logs
export interface AuditLogEntry {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  action: string;
  module: string;
  timestamp: string;
  ip: string;
  details?: string;
  status: 'success' | 'failed';
}

export interface SystemErrorLogEntry {
  id: string;
  timestamp: string;
  userId?: string;
  userName?: string;
  errorCode: string;
  errorMessage: string;
  stackTrace?: string;
  route: string;
  browser: string;
  status: 'open' | 'resolved' | 'ignored';
}

// Attachments for Comments
export interface Attachment {
  id: string;
  name: string;
  type: 'image' | 'video' | 'file';
  url: string; // Blob URL or remote URL
  size?: string;
}

// Comments
export interface Comment {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  content: string;
  timestamp: string;
  attachments?: Attachment[]; // New field
}

export type BusinessRequirementStatus = 'open' | 'in_progress' | 'done' | 'closed';
export type BusinessRequirementPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface BusinessRequirement {
  id: string;
  moduleId: string;
  title: string;
  content: string;
  tags: string[];
  status: BusinessRequirementStatus;
  priority: BusinessRequirementPriority;
  proposerName: string;
  createdById: string;
  createdByName: string;
  createdByAvatar: string;
  createdAt: string;
  updatedAt: string;
}

export interface BusinessRequirementComment {
  id: string;
  requirementId: string;
  parentId?: string | null;
  userId: string;
  userName: string;
  userAvatar: string;
  content: string;
  createdAt: string;
}

// Version Snapshot
export interface ModuleVersion {
  id: string;
  tag: string;       // e.g., "v1.0"
  note: string;      // e.g., "MVP Release"
  timestamp: string;
  createdBy: string;
  data: {
    requirements: string;
    logicRules: LogicRule[];
    uiComponents: UIComponent[];
  }
}

export interface PromptTemplate {
  id: string;
  label: string;
  content: string;
  agentId?: string; // Foreign key
  // Audit Fields
  createdBy?: string; // User ID
  createdAt?: string; // ISO Timestamp
  updatedBy?: string; // User ID
  updatedAt?: string; // ISO Timestamp
  usageCount?: number; // Usage counter
}

// AI Agent Types
export interface AIAgent {
  id: string;
  name: string;
  avatar: string; // Emoji or Initials
  role: string;   // e.g. "Sales Copilot"
  description: string;
  systemPrompt: string;
  pmInteractionExample?: string; // New: Example interaction for PM reference
  commonPrompts?: PromptTemplate[]; // New: List of common prompts
  status: 'active' | 'inactive';
  scope: string[]; // List of module IDs or tags
}

// Integration / Plugin Types
export interface IntegrationConfig {
    id: string;
    key: string;       // Unique key: 'llm_global', 'email_global'
    name: string;
    type: 'llm' | 'db' | 'notification' | 'system' | 'other';
    config: any;       // Flexible JSON config
    enabled: boolean;
    schema?: any;      // Optional JSON schema
    updatedAt?: string;
}

export interface ModuleOwners {
  pm: string[];     // User IDs
  dev: string[];    // User IDs
  expert: string[]; // User IDs
}

export interface ModuleTimeline {
  startDate: string; // ISO Date string YYYY-MM-DD
  endDate: string;   // ISO Date string YYYY-MM-DD
}

// Complete Module State
export interface ModuleData {
  id: string;
  name: string;
  status: 'draft' | 'ready'; // Synced with NavNode
  owners: ModuleOwners;
  timeline: ModuleTimeline;
  requirements: string; // Unified field for requirements
  expertRequirements?: string; // Business Expert Requirements
  logicRules: LogicRule[];
  knowledge: KnowledgeItem[];
  uiComponents: UIComponent[];
  figmaLinks: FigmaLink[];
  prototypeImages: PrototypeImage[];
  versions: ModuleVersion[]; // New: History snapshots
  comments: Comment[];
  updatedAt: string; // ISO string
}

// Database Schema Types
export interface TableColumn {
    name: string;
    type: string;
    length?: string;
    nullable: boolean;
    pk: boolean;
    comment: string;
}

export interface TableIndex {
    name: string;
    columns: string[];
    unique: boolean;
}

export interface TableForeignKey {
    name: string;
    column: string;
    refTable: string;
    refColumn: string;
}

export interface TableSchema {
    name: string;
    comment: string;
    columns: TableColumn[];
    indexes: TableIndex[];
    foreignKeys: TableForeignKey[];
}
