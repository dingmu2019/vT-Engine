
/// <reference types="vite/client" />
import { UserProfile, NavNode, ModuleData, AuditLogEntry, SystemErrorLogEntry, AIAgent, PromptTemplate, IntegrationConfig } from './types';

// In development (Vite), '/api' is proxied to localhost:3001.
// In production (Docker/Nginx), '/api' should be proxied to the backend container.
// Using a relative path allows it to work in both provided the server/proxy is set up correctly.
const BASE_URL = (import.meta.env.VITE_API_URL || '') + '/api';

interface ApiResponse<T> {
    success?: boolean;
    data?: T;
    code?: string;
    message?: string;
    details?: any;
    // Legacy support
    user?: any;
    token?: string;
    items?: any[];
    total?: number;
    tables?: any[];
}

export class ApiError extends Error {
    constructor(
        public message: string,
        public code?: string,
        public details?: any
    ) {
        super(message);
        Object.setPrototypeOf(this, ApiError.prototype);
    }
}

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options?.headers as any)
  };

  // Add auth header if available (simple mock token for now, or userId)
  // In a real app, we would get token from localStorage
  // const token = localStorage.getItem('token');
  // if (token) { headers['Authorization'] = `Bearer ${token}`; }
  try {
      if (typeof window !== 'undefined' && window.localStorage) {
          const storedUser = localStorage.getItem('t_engine_user');
          if (storedUser) {
              const u = JSON.parse(storedUser);
              if (u?.id) headers['x-user-id'] = String(u.id);
              if (u?.name) headers['x-user-name'] = String(u.name);
          }
      }
  } catch {
  }

  const response = await fetch(`${BASE_URL}${url}`, { ...options, headers });
  
  // Check if response is HTML (likely a 404 or 500 error page from Vercel/Nginx)
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('text/html')) {
      const text = await response.text();
      console.error('Expected JSON but received HTML. Response starts with:', text.substring(0, 200));
      throw new ApiError(
          `Server Error: Received HTML instead of JSON. This usually means the API route was not found or the server crashed. Status: ${response.status}`,
          String(response.status)
      );
  }

  let data: ApiResponse<T> | any;
  try {
      data = await response.json();
  } catch (e) {
      // If JSON parse fails but not HTML, throw status text
      if (!response.ok) {
          const statusText = response.statusText || 'Unknown Error';
          throw new ApiError(`Server Error: ${statusText} (${response.status})`, String(response.status));
      }
      return null as T;
  }

  if (!response.ok) {
      const statusText = response.statusText || 'Unknown Error';
      throw new ApiError(data.message || `Server Error: ${statusText}`, data.code || String(response.status), data.details);
  }

  // Standardize Response: 
  // If backend returns { success: true, data: ... }, return data.data
  // If backend returns raw data (legacy), return data
  if (data && typeof data === 'object' && 'success' in data && 'data' in data) {
      return data.data as T;
  }

  // Fallback for legacy endpoints that return direct object
  return data as T;
}

export const api = {
  // ... (keep auth, users, navigation, modules)
  auth: {
    login: (email: string, password?: string) => fetchJson<{ user: UserProfile, token: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    }),
    sendLoginCode: (email: string) => fetchJson<{ ok: boolean }>('/auth/send-login-code', {
      method: 'POST',
      body: JSON.stringify({ email })
    }),
    loginWithCode: (email: string, code: string) => fetchJson<{ user: UserProfile, token: string }>('/auth/login-code', {
      method: 'POST',
      body: JSON.stringify({ email, code })
    }),
    me: (userId: string) => fetchJson<UserProfile>('/auth/me', {
      headers: { 'x-user-id': userId }
    }),
    changePassword: (userId: string, currentPassword: string, newPassword: string) => fetchJson<{ success: boolean }>('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ userId, currentPassword, newPassword })
    }),
    updateProfile: (userId: string, updates: Partial<UserProfile>) => fetchJson<UserProfile>('/auth/update-profile', {
      method: 'POST',
      body: JSON.stringify({ userId, updates })
    }),
  },
  users: {
    getAll: () => fetchJson<UserProfile[]>('/users'),
    create: (user: Omit<UserProfile, 'id' | 'avatar' | 'status'>) => fetchJson<UserProfile>('/users', {
      method: 'POST',
      body: JSON.stringify(user)
    }),
    update: (userId: string, updates: Partial<UserProfile>) => fetchJson<UserProfile>(`/users/${userId}`, {
      method: 'POST',
      body: JSON.stringify(updates)
    }),
    toggleStatus: (userId: string) => fetchJson<{ success: boolean }>(`/users/${userId}/toggle-status`, {
      method: 'POST'
    }),
    resetPassword: (userId: string) => fetchJson<{ success: boolean }>(`/users/${userId}/reset-password`, {
      method: 'POST'
    }),
  },
  navigation: {
    getTree: () => fetchJson<NavNode[]>(`/navigation?t=${Date.now()}`),
    saveTree: (tree: NavNode[]) => fetchJson<{ success: boolean }>('/navigation', {
      method: 'POST',
      body: JSON.stringify(tree)
    }),
    getGlobalStandards: () => fetchJson<string>('/navigation/standards'),
    saveGlobalStandards: (content: string) => fetchJson<{ success: boolean }>('/navigation/standards', {
      method: 'POST',
      body: JSON.stringify({ content })
    }),
    
    // Atomic Operations
    addNode: (node: Partial<NavNode> & { key: string, parentKey?: string | null }) => 
        fetchJson<NavNode>('/navigation/nodes', { method: 'POST', body: JSON.stringify(node) }),
        
    updateNode: (key: string, updates: Partial<NavNode>) => 
        fetchJson<NavNode>(`/navigation/nodes/${encodeURIComponent(key)}`, { method: 'PATCH', body: JSON.stringify(updates) }),
        
    deleteNode: (key: string) => 
        fetchJson<{ success: boolean }>(`/navigation/nodes/${encodeURIComponent(key)}`, { method: 'DELETE' }),
        
    moveNode: (key: string, parentId: string | null, sortOrder: number) => 
        fetchJson<{ success: boolean }>('/navigation/move', { method: 'POST', body: JSON.stringify({ key, parentId, sortOrder }) }),

    reorderNodes: (parentId: string | null, orderedIds: string[]) => 
        fetchJson<{ success: boolean }>('/navigation/reorder', { method: 'POST', body: JSON.stringify({ parentId, orderedIds }) }),
  },
  modules: {
    get: (id: string) => fetchJson<Partial<ModuleData>>(`/modules/${id}`),
    update: (id: string, data: Partial<ModuleData>) => fetchJson<Partial<ModuleData>>(`/modules/${id}`, {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  },
  agents: {
    getAll: () => fetchJson<AIAgent[]>('/agents'),
    create: (agent: Omit<AIAgent, 'id' | 'status'>) => fetchJson<AIAgent>('/agents', {
      method: 'POST',
      body: JSON.stringify(agent)
    }),
    update: (id: string, updates: Partial<AIAgent>) => fetchJson<AIAgent>(`/agents/${id}`, {
      method: 'POST',
      body: JSON.stringify(updates)
    }),
    delete: (id: string) => fetchJson<{ success: boolean }>(`/agents/${id}`, {
      method: 'DELETE'
    }),
    // Prompt APIs
    getPrompts: (agentId: string) => fetchJson<PromptTemplate[]>(`/agents/${agentId}/prompts`),
    addPrompt: (agentId: string, prompt: PromptTemplate) => fetchJson<PromptTemplate[]>(`/agents/${agentId}/prompts`, {
      method: 'POST',
      body: JSON.stringify(prompt)
    }),
    updatePrompt: (agentId: string, prompt: PromptTemplate) => fetchJson<PromptTemplate[]>(`/agents/${agentId}/prompts/update`, {
      method: 'POST',
      body: JSON.stringify({ prompt })
    }),
    deletePrompt: (agentId: string, promptId: string) => fetchJson<PromptTemplate[]>(`/agents/${agentId}/prompts/${promptId}`, {
      method: 'DELETE'
    })
  },
  logs: {
    getAudit: () => fetchJson<AuditLogEntry[]>('/logs/audit'),
    getAuditPaged: (page: number, pageSize: number) => fetchJson<{ items: AuditLogEntry[], total: number }>(`/logs/audit?page=${page}&pageSize=${pageSize}`),
    getAuditCursor: (pageSize: number, cursor?: string) => fetchJson<{ items: AuditLogEntry[], nextCursor: string | null, hasMore: boolean }>(`/logs/audit/paged?pageSize=${pageSize}${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ''}`),
    addAudit: (log: AuditLogEntry) => fetchJson<AuditLogEntry>('/logs/audit', {
      method: 'POST',
      body: JSON.stringify(log)
    }),
    clearAudit: () => fetchJson<{ deleted: number }>('/logs/audit', { method: 'DELETE' }),
    getSystemErrors: () => fetchJson<SystemErrorLogEntry[]>('/logs/system'),
    clearSystemErrors: () => fetchJson<{ deleted: number }>('/logs/system', { method: 'DELETE' }),
  },
  database: {
    getSchema: () => fetchJson<{ tables: any[] }>('/database/schema'),
    getTableData: (name: string, page: number, pageSize: number) => fetchJson<{ items: any[], total: number }>(`/database/table/${encodeURIComponent(name)}/data?page=${page}&pageSize=${pageSize}`)
  },
  comments: {
    getCursor: (moduleId: string, pageSize: number, cursor?: string) =>
      fetchJson<{ items: any[], nextCursor: string | null, hasMore: boolean }>(`/comments?moduleId=${encodeURIComponent(moduleId)}&pageSize=${pageSize}${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ''}`),
    add: (moduleId: string, moduleName: string, content: string, userAvatar?: string) =>
      fetchJson<any>('/comments', {
        method: 'POST',
        body: JSON.stringify({ moduleId, moduleName, content, userAvatar })
      })
  },
  businessReq: {
    getCursor: (moduleId: string, pageSize: number, cursor?: string, filters?: { q?: string; tags?: string[]; status?: string }) => {
      const q = filters?.q ? `&q=${encodeURIComponent(filters.q)}` : '';
      const tags = filters?.tags && filters.tags.length > 0 ? `&tags=${encodeURIComponent(filters.tags.join(','))}` : '';
      const status = filters?.status ? `&status=${encodeURIComponent(filters.status)}` : '';
      return fetchJson<{ items: any[], nextCursor: string | null, hasMore: boolean }>(`/biz-req?moduleId=${encodeURIComponent(moduleId)}&pageSize=${pageSize}${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ''}${q}${tags}${status}`);
    },
    create: (moduleId: string, title: string, content: string, tags: string[], priority: 'low' | 'medium' | 'high' | 'urgent', proposerName: string, userAvatar?: string) =>
      fetchJson<any>('/biz-req', {
        method: 'POST',
        body: JSON.stringify({ moduleId, title, content, tags, priority, proposerName, userAvatar })
      }),
    get: (id: string) => fetchJson<any>(`/biz-req/${encodeURIComponent(id)}`),
    getCommentsCursor: (id: string, pageSize: number, cursor?: string) =>
      fetchJson<{ items: any[], nextCursor: string | null, hasMore: boolean }>(`/biz-req/${encodeURIComponent(id)}/comments?pageSize=${pageSize}${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ''}`),
    addComment: (id: string, content: string, parentId?: string | null, userAvatar?: string) =>
      fetchJson<any>(`/biz-req/${encodeURIComponent(id)}/comments`, {
        method: 'POST',
        body: JSON.stringify({ content, parentId, userAvatar })
      }),
  },
  aiChat: {
    getCursor: (moduleId: string, pageSize: number, cursor?: string) => fetchJson<{ items: any[], nextCursor: string | null, hasMore: boolean }>(`/ai-chat/messages?moduleId=${encodeURIComponent(moduleId)}&pageSize=${pageSize}${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ''}`),
    addMessage: (moduleId: string, role: 'user' | 'model', content: string, payload?: { userAvatar?: string; actorId?: string; actorName?: string; actorAvatar?: string; agentId?: string; promptLabel?: string }) =>
      fetchJson<any>('/ai-chat/messages', {
        method: 'POST',
        body: JSON.stringify({ moduleId, role, content, ...(payload || {}) })
      }),
    deletePair: (messageId: string) => fetchJson<{ deletedIds: string[] }>(`/ai-chat/messages/${encodeURIComponent(messageId)}`, {
      method: 'DELETE'
    }),
    setFeedback: (messageId: string, payload: { favorite?: boolean; reaction?: 'like' | 'dislike' | null }) =>
      fetchJson<{ favorite: boolean; reaction: 'like' | 'dislike' | null }>(`/ai-chat/messages/${encodeURIComponent(messageId)}/feedback`, {
        method: 'PUT',
        body: JSON.stringify(payload)
      }),
  },
  integrations: {
    getAll: () => fetchJson<IntegrationConfig[]>('/integrations'),
    update: (key: string, updates: Partial<IntegrationConfig>) => fetchJson<IntegrationConfig>(`/integrations/${key}`, {
        method: 'PUT',
        body: JSON.stringify(updates)
    }),
    toggle: (key: string, enabled: boolean) => fetchJson<{ success: boolean }>(`/integrations/${key}/toggle`, {
        method: 'POST',
        body: JSON.stringify({ enabled })
    }),
    // Test endpoints
    testEmail: (config: any) => fetchJson<{ success: boolean, messageId?: string }>('/email/test-send', {
        method: 'POST',
        body: JSON.stringify(config)
    }),
    testWeChat: (config: any) => fetchJson<{ success: boolean }>('/wechat/test-send', {
        method: 'POST',
        body: JSON.stringify(config)
    })
  },
  system: {
    health: () => fetchJson<{ ok: boolean }>('/health'),
    getConfig: (key: string) => fetchJson<string>(`/system/config/${encodeURIComponent(key)}`),
    updateConfig: (key: string, value: string, description?: string) => 
        fetchJson<{ success: boolean }>(`/system/config/${encodeURIComponent(key)}`, {
            method: 'POST',
            body: JSON.stringify({ value, description })
        }),
  },
};
