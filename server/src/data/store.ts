
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { AppError } from '../errors';
import { 
    INITIAL_USERS, 
    NAV_TREE, 
    INITIAL_AGENTS,
    MOCK_DATABASE,
    MOCK_GlobalStandards,
    INITIAL_INTEGRATIONS
} from './initialData';
import { 
    ModuleData, 
    UserProfile, 
    NavNode, 
    AuditLogEntry, 
    SystemErrorLogEntry, 
    Comment,
    BusinessRequirement,
    BusinessRequirementComment,
    AIAgent,
    PromptTemplate,
    IntegrationConfig
} from '../types';

const PROMPTS_FILE = path.join(__dirname, 'prompts.json');

// --- Encryption Helper ---
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'default_secret_key_must_be_32_bytes_len'; // Should be 32 chars
const IV_LENGTH = 16;

function encrypt(text: string): string {
    if (!text) return text;
    // Ensure key is 32 bytes
    const key = crypto.createHash('sha256').update(String(ENCRYPTION_KEY)).digest();
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return iv.toString('hex') + ':' + encrypted.toString('hex');
}

function decrypt(text: string): string {
    if (!text || !text.includes(':')) return text;
    try {
        const key = crypto.createHash('sha256').update(String(ENCRYPTION_KEY)).digest();
        const textParts = text.split(':');
        const iv = Buffer.from(textParts.shift()!, 'hex');
        const encryptedText = Buffer.from(textParts.join(':'), 'hex');
        const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
        let decrypted = decipher.update(encryptedText);
        decrypted = Buffer.concat([decrypted, decipher.final()]);
        return decrypted.toString();
    } catch (e) {
        console.warn('Decryption failed, returning original:', e);
        return text;
    }
}

// Helper to encrypt sensitive config fields
const SENSITIVE_FIELDS = ['apiKey', 'password', 'secret', 'botToken', 'appSecret', 'pass'];

function encryptConfig(config: any) {
    if (!config) return config;
    const newConfig = { ...config };
    for (const field of SENSITIVE_FIELDS) {
        if (newConfig[field]) {
            newConfig[field] = encrypt(newConfig[field]);
        }
    }
    return newConfig;
}

function decryptConfig(config: any) {
    if (!config) return config;
    const newConfig = { ...config };
    for (const field of SENSITIVE_FIELDS) {
        if (newConfig[field]) {
            newConfig[field] = decrypt(newConfig[field]);
        }
    }
    return newConfig;
}

// --- Helper for File Migration (One-time) ---
// We keep this to read old prompts and seed them to DB if DB is empty
class FilePromptReader {
    static load(): Record<string, PromptTemplate[]> {
        try {
            if (!fs.existsSync(PROMPTS_FILE)) return {};
            const data = fs.readFileSync(PROMPTS_FILE, 'utf-8');
            return JSON.parse(data);
        } catch (e) {
            return {};
        }
    }
}

export interface UserContext {
    userId?: string;
    userName?: string;
    ip?: string;
}

class DataStore {
    private memoryComments: Record<string, Comment[]> = {};
    private memoryBusinessRequirements: Record<string, BusinessRequirement[]> = {};
    private memoryBusinessRequirementComments: Record<string, BusinessRequirementComment[]> = {};
    private memoryAIChat: Record<string, { id: string; role: 'user' | 'model'; content: string; timestamp: string; actorId: string; actorName: string; actorAvatar?: string; agentId?: string; promptLabel?: string | null; deletedAt?: string | null }[]> = {};
    private memoryAIChatFeedback: Record<string, { favorite: boolean; reaction: 'like' | 'dislike' | null; updatedAt: string }> = {};
    private memoryEmailLoginCodes: Record<string, { codeHash: string; expiresAt: string; attempts: number; usedAt?: string | null }> = {};
    // --- Helper for Audit Logging ---
    private async logAction(context: UserContext | undefined, action: string, module: string, details: string, status: 'success' | 'failed' = 'success') {
        // Even if context is missing, we log it as System action if it's a critical DB change
        const userId = context?.userId || 'system';
        const userName = context?.userName || 'System';
        const ip = context?.ip || 'system';

        await this.addAuditLog({
            id: '', 
            userId,
            userName,
            action,
            module,
            details,
            status,
            ip,
            timestamp: new Date().toISOString()
        }).catch(err => console.error('Failed to write audit log:', err));
    }

    // --- Users ---
    async getUsers(): Promise<UserProfile[]> {
        if (!isSupabaseConfigured) {
            console.log('Supabase not configured, returning initial users.');
            return INITIAL_USERS;
        }
        try {
            const { data, error } = await supabase.from('users').select('*').order('created_at', { ascending: true });
            if (error) throw error; // Strict mode: Throw error if DB fails
            
            if (!data) return [];
            
            return data.map(u => ({
                id: u.key,
                name: u.name,
                email: u.email,
                role: u.role as any,
                avatar: u.avatar,
                status: u.status as any,
                gender: u.gender as any,
                phone: u.phone,
                bio: u.bio,
                preferences: u.preferences,
                password_hash: u.password_hash
            }));
        } catch (e) {
            console.error('Crash in getUsers:', e);
            throw e; // Re-throw to let API handler catch it
        }
    }

    async getUserByEmail(email: string): Promise<UserProfile | null> {
        if (!isSupabaseConfigured) {
             const memUser = INITIAL_USERS.find(u => u.email === email);
             if (memUser) {
                 return {
                     id: memUser.id,
                     name: memUser.name,
                     email: memUser.email,
                     role: memUser.role as any,
                     avatar: memUser.avatar,
                     status: memUser.status as any,
                     gender: memUser.gender as any,
                     phone: memUser.phone,
                     bio: memUser.bio,
                     preferences: memUser.preferences,
                     password_hash: memUser.password_hash || '$2b$10$.CO1H3cduPlOskTZH3V9v.saJOlGWDRIcSiLSyxm.HhhqNRUEbOru'
                 };
             }
             return null;
        }
        try {
            const { data, error } = await supabase.from('users').select('*').eq('email', email).maybeSingle();
            if (error) throw error;
            if (!data) return null;

            return {
                id: data.key,
                name: data.name,
                email: data.email,
                role: data.role as any,
                avatar: data.avatar,
                status: data.status as any,
                gender: data.gender as any,
                phone: data.phone,
                bio: data.bio,
                preferences: data.preferences,
                password_hash: data.password_hash
            };
        } catch (e) {
            console.error('Crash in getUserByEmail:', e);
            throw e; // Re-throw
        }
    }

    async getUserById(id: string): Promise<UserProfile | null> {
        try {
            const { data, error } = await supabase.from('users').select('*').eq('key', id).maybeSingle();
            if (error || !data) {
                 // Fallback to memory users
                 const memUser = INITIAL_USERS.find(u => u.id === id); // Use id (string) to match
                 if (memUser) {
                     return {
                         id: memUser.id,
                         name: memUser.name,
                         email: memUser.email,
                         role: memUser.role as any,
                         avatar: memUser.avatar,
                         status: memUser.status as any,
                         gender: memUser.gender as any,
                         phone: memUser.phone,
                         bio: memUser.bio,
                         preferences: memUser.preferences,
                         password_hash: memUser.password_hash
                     };
                 }
                 return null;
            }
            return {
                id: data.key,
                name: data.name,
                email: data.email,
                role: data.role as any,
                avatar: data.avatar,
                status: data.status as any,
                gender: data.gender as any,
                phone: data.phone ? decrypt(data.phone) : data.phone,
                bio: data.bio,
                preferences: data.preferences,
                password_hash: data.password_hash
            };
        } catch (e) {
            console.error('Crash in getUserById:', e);
            const memUser = INITIAL_USERS.find(u => u.id === id);
            if (memUser) {
                 return {
                     id: memUser.id,
                     name: memUser.name,
                     email: memUser.email,
                     role: memUser.role as any,
                     avatar: memUser.avatar,
                     status: memUser.status as any,
                     gender: memUser.gender as any,
                     phone: memUser.phone,
                     bio: memUser.bio,
                     preferences: memUser.preferences,
                     password_hash: memUser.password_hash
                 };
            }
            return null;
        }
    }

    async addUser(user: Partial<UserProfile>, context?: UserContext): Promise<UserProfile> {
        const newKey = user.id || `u${Date.now()}`;
        const defaultHash = '$2b$10$.CO1H3cduPlOskTZH3V9v.saJOlGWDRIcSiLSyxm.HhhqNRUEbOru';

        // Encrypt Phone
        const encryptedPhone = user.phone ? encrypt(user.phone) : undefined;

        const dbUser = {
            key: newKey,
            email: user.email,
            name: user.name,
            role: user.role,
            avatar: user.avatar,
            status: user.status || 'active',
            gender: user.gender,
            phone: encryptedPhone,
            bio: user.bio,
            password_hash: user.password_hash || defaultHash,
            created_by: 'system',
            updated_by: 'system'
        };

        const { error } = await supabase.from('users').insert(dbUser);
        if (error) throw error;
        
        await this.logAction(context, 'Create User', 'User Management', `Created user ${user.email} (${newKey})`);
        
        return { ...user, id: newKey } as UserProfile;
    }

    async updateUserProfile(id: string, updates: Partial<UserProfile>, context?: UserContext): Promise<UserProfile | null> {
        const payload: any = {};
        if (updates.name) payload.name = updates.name;
        if (updates.email) payload.email = updates.email;
        if (updates.role) payload.role = updates.role;
        if (updates.avatar) payload.avatar = updates.avatar;
        if (updates.status) payload.status = updates.status;
        if (updates.gender) payload.gender = updates.gender;
        
        if (updates.phone) payload.phone = encrypt(updates.phone);
        
        if (updates.bio) payload.bio = updates.bio;
        if (updates.preferences) payload.preferences = updates.preferences;

        const { data, error } = await supabase
            .from('users')
            .update(payload)
            .eq('key', id)
            .select('*')
            .maybeSingle();
        if (error) throw error;
        if (!data) return null;
        
        await this.logAction(context, 'Update User', 'User Management', `Updated user ${id}: ${Object.keys(updates).join(', ')}`);

        return {
            id: data.key,
            name: data.name,
            email: data.email,
            role: data.role as any,
            avatar: data.avatar,
            status: data.status as any,
            gender: data.gender as any,
            phone: data.phone ? decrypt(data.phone) : data.phone,
            bio: data.bio,
            preferences: data.preferences,
            password_hash: data.password_hash
        };
    }

    async toggleUserStatus(id: string, context?: UserContext): Promise<boolean> {
        const user = await this.getUserById(id);
        if (!user) return false;
        const newStatus = user.status === 'active' ? 'disabled' : 'active';
        await this.updateUserProfile(id, { status: newStatus }, context); // Pass context down
        return true;
    }

    async resetUserPassword(id: string, context?: UserContext): Promise<boolean> {
        const defaultHash = '$2b$10$.CO1H3cduPlOskTZH3V9v.saJOlGWDRIcSiLSyxm.HhhqNRUEbOru';
        const { error } = await supabase.from('users').update({ password_hash: defaultHash }).eq('key', id);
        
        if (!error) {
            await this.logAction(context, 'Reset Password', 'User Management', `Reset password for user ${id}`);
        }
        return !error;
    }

    async changePassword(id: string, newHash: string, context?: UserContext): Promise<boolean> {
        const { error } = await supabase.from('users').update({ password_hash: newHash }).eq('key', id);
        
        if (!error) {
            await this.logAction(context, 'Change Password', 'User Management', `Changed password for user ${id}`);
        }
        return !error;
    }

    // --- Navigation (Normalized Table Support) ---
    async getNavigation(): Promise<NavNode[]> {
        if (!isSupabaseConfigured) {
            throw new AppError(503, 'NAV_DB_UNAVAILABLE', '导航树数据库不可用', { hint: '当前将使用静态树' });
        }

        const { data: nodes, error } = await supabase
            .from('navigation_nodes')
            .select('*')
            .order('sort_order', { ascending: true });

        if (error) {
            throw new AppError(503, 'NAV_DB_UNAVAILABLE', '导航树数据库不可用', { hint: '当前将使用静态树', supabase: error });
        }

        if (!nodes || nodes.length === 0) {
            throw new AppError(503, 'NAV_DB_EMPTY', '导航树数据库为空', { hint: '当前将使用静态树' });
        }

        // Reconstruct Tree
        const nodeMap = new Map<string, NavNode>();
        const dbIdMap = new Map<number, string>(); // int_id -> key

        // 1. Create NavNode objects
        nodes.forEach((n: any) => {
            nodeMap.set(n.key, {
                id: n.key,
                label: n.label,
                labelZh: n.label_zh || n.label,
                type: n.type,
                status: n.status,
                icon: n.icon,
                description: n.description || '',
                children: n.type === 'folder' ? [] : undefined
            });
            dbIdMap.set(n.id, n.key);
        });

        // 2. Build Hierarchy
        const rootNodes: NavNode[] = [];
        nodes.forEach((n: any) => {
            const node = nodeMap.get(n.key)!;
            if (n.parent_id) {
                const parentKey = dbIdMap.get(n.parent_id);
                if (parentKey && nodeMap.has(parentKey)) {
                    const parent = nodeMap.get(parentKey)!;
                    if (!parent.children) parent.children = [];
                    parent.children.push(node);
                } else {
                    // Parent not found (orphan), treat as root
                    rootNodes.push(node);
                }
            } else {
                rootNodes.push(node);
            }
        });

        return rootNodes;
    }

    async updateNavigation(tree: NavNode[], context?: UserContext): Promise<void> {
        if (!isSupabaseConfigured) {
            return;
        }
        // Strategy: Upsert all nodes by 'key', then update parent relationships.
        // This handles new nodes and updates. 
        // Deletions: We need to delete nodes that are NOT in the new tree.
        
        // 1. Flatten Tree
        const flatNodes: { key: string, parentKey: string | null, node: NavNode, order: number }[] = [];
        
        const traverse = (nodes: NavNode[], parentKey: string | null) => {
            nodes.forEach((node, index) => {
                flatNodes.push({ key: node.id, parentKey, node, order: index });
                if (node.children) {
                    traverse(node.children, node.id);
                }
            });
        };
        traverse(tree, null);

        // 2. Get existing keys to identify deletions
        const { data: existing, error: existingErr } = await supabase.from('navigation_nodes').select('key');
        if (existingErr) throw existingErr;
        const existingKeys = new Set(existing?.map((n: any) => n.key) || []);
        const newKeys = new Set(flatNodes.map(n => n.key));
        
        const toDelete = [...existingKeys].filter(k => !newKeys.has(k));
        
        // 3. Delete removed nodes
        if (toDelete.length > 0) {
            const { error: delErr } = await supabase.from('navigation_nodes').delete().in('key', toDelete);
            if (delErr) throw delErr;
        }

        // 4. Upsert Nodes (without parent_id first to avoid foreign key issues)
        // We do this serially or batched. Since we need IDs for parent mapping, 
        // we might need to query them back or use upsert returning id.
        
        // Supabase upsert can return data.
        const keyToIdMap = new Map<string, number>();

        const userId = context?.userId || 'system';

        for (const item of flatNodes) {
            // Note: description field is optional in DB schema (default ''), so we can safely include it.
            // If the migration hasn't run yet, this might fail if we include a non-existent column.
            // However, Supabase client usually ignores unknown columns OR throws error.
            // Since we updated the frontend to send description, we should try to save it.
            // But to be safe against schema mismatch in `store.ts` which runs in production, 
            // we should only include it if we are sure, or wrap in try-catch?
            // Actually, we added the migration script but it failed to run automatically.
            // The user says "description column already exists" (implied or requested).
            // Let's assume it exists now.
            
            const payload: any = {
                key: item.key,
                label: item.node.label,
                label_zh: item.node.labelZh,
                type: item.node.type,
                status: item.node.status,
                icon: item.node.icon,
                sort_order: item.order,
                updated_at: new Date().toISOString(),
                // Fill metadata
                created_by: userId,
                updated_by: userId
            };
            
            // Only add description if it's not empty, to avoid overwriting with null if that's a concern,
            // but we want to save empty string too.
            // We'll add it to payload. If DB column missing, this might error.
            // But we trust the environment state or we'd need a schema check.
            payload.description = item.node.description || '';

            // We need to fetch existing record to preserve created_by/created_at if it exists
            const { data: existingNode } = await supabase
                .from('navigation_nodes')
                .select('created_by, created_at')
                .eq('key', item.key)
                .maybeSingle();

            if (existingNode) {
                // If updating, preserve original creator info
                payload.created_by = existingNode.created_by;
                // payload.created_at = existingNode.created_at; // Usually auto-generated but good to keep if fetched
            } else {
                // If inserting new, set created_at explicit or let DB handle it (default now())
                // payload.created_at = new Date().toISOString();
            }

            const { data, error } = await supabase.from('navigation_nodes').upsert(payload, { onConflict: 'key' }).select('id').single();

            if (data) {
                keyToIdMap.set(item.key, data.id);
            } else if (error) {
                // If error is "column does not exist", we retry without description?
                if (error.message?.includes('column "description" of relation "navigation_nodes" does not exist')) {
                    console.warn('Column description missing, retrying without it...');
                    delete payload.description;
                    const { data: retryData, error: retryError } = await supabase.from('navigation_nodes').upsert(payload, { onConflict: 'key' }).select('id').single();
                    if (retryError) throw retryError;
                    if (retryData) keyToIdMap.set(item.key, retryData.id);
                } else {
                    throw error;
                }
            }
        }

        // 5. Update Parent IDs
        for (const item of flatNodes) {
            if (item.parentKey) {
                const parentId = keyToIdMap.get(item.parentKey);
                if (parentId) {
                    const { error: pErr } = await supabase.from('navigation_nodes')
                        .update({ parent_id: parentId })
                        .eq('key', item.key);
                    if (pErr) throw pErr;
                }
            } else {
                 // Ensure root nodes have null parent_id
                 const { error: rErr } = await supabase.from('navigation_nodes')
                    .update({ parent_id: null })
                    .eq('key', item.key);
                 if (rErr) throw rErr;
            }
        }
        
        await this.logAction(context, 'Update Navigation', 'System Settings', 'Updated navigation tree');
    }
    
    // --- Force Reseed (For dev) ---
    async forceReseedNavigation(): Promise<void> {
        await this.updateNavigation(NAV_TREE);
    }

    // --- Atomic Navigation Operations ---

    async addNavigationNode(node: Partial<NavNode> & { key: string, parentKey?: string | null }, context?: UserContext): Promise<NavNode> {
        if (!isSupabaseConfigured) throw new AppError(503, 'DB_UNAVAILABLE', 'Database not configured');

        // 1. Resolve Parent ID
        let parentId: number | null = null;
        if (node.parentKey) {
            const { data: pData } = await supabase.from('navigation_nodes').select('id').eq('key', node.parentKey).single();
            if (pData) parentId = pData.id;
        }

        const userId = context?.userId || 'system';
        const payload = {
            key: node.key,
            label: node.label,
            label_zh: node.labelZh,
            type: node.type,
            status: node.status || 'draft',
            icon: node.icon || (node.type === 'folder' ? 'folder' : 'box'),
            description: node.description || '',
            parent_id: parentId,
            sort_order: 9999, // Default to end, or client should provide
            created_by: userId,
            updated_by: userId,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        const { data, error } = await supabase.from('navigation_nodes').insert(payload).select().single();
        if (error) throw error;

        await this.logAction(context, 'Add Node', 'System Settings', `Added node ${node.label} (${node.key})`);

        return {
            id: data.key,
            label: data.label,
            labelZh: data.label_zh,
            type: data.type,
            status: data.status,
            icon: data.icon,
            description: data.description,
            children: data.type === 'folder' ? [] : undefined
        };
    }

    async updateNavigationNode(key: string, updates: Partial<NavNode>, context?: UserContext): Promise<NavNode> {
        if (!isSupabaseConfigured) throw new AppError(503, 'DB_UNAVAILABLE', 'Database not configured');

        const payload: any = {
            updated_by: context?.userId || 'system',
            updated_at: new Date().toISOString()
        };
        if (updates.label) payload.label = updates.label;
        if (updates.labelZh) payload.label_zh = updates.labelZh;
        if (updates.description !== undefined) payload.description = updates.description;
        if (updates.status) payload.status = updates.status;
        if (updates.icon) payload.icon = updates.icon;

        const { data, error } = await supabase.from('navigation_nodes').update(payload).eq('key', key).select().single();
        if (error) throw error;

        await this.logAction(context, 'Update Node', 'System Settings', `Updated node ${key}`);

        return {
            id: data.key,
            label: data.label,
            labelZh: data.label_zh,
            type: data.type,
            status: data.status,
            icon: data.icon,
            description: data.description,
            children: undefined // Caller handles tree structure
        };
    }

    async deleteNavigationNode(key: string, context?: UserContext): Promise<void> {
        if (!isSupabaseConfigured) throw new AppError(503, 'DB_UNAVAILABLE', 'Database not configured');

        // Cascade delete is usually handled by DB foreign keys, but let's be safe or explicit?
        // If DB has ON DELETE CASCADE on parent_id, children vanish.
        // Assuming we want to delete.
        const { error } = await supabase.from('navigation_nodes').delete().eq('key', key);
        if (error) throw error;

        await this.logAction(context, 'Delete Node', 'System Settings', `Deleted node ${key}`);
    }

    async moveNavigationNode(key: string, parentKey: string | null, sortOrder: number, context?: UserContext): Promise<void> {
        if (!isSupabaseConfigured) throw new AppError(503, 'DB_UNAVAILABLE', 'Database not configured');

        let parentId: number | null = null;
        if (parentKey) {
            const { data: pData } = await supabase.from('navigation_nodes').select('id').eq('key', parentKey).single();
            if (!pData) throw new AppError(404, 'PARENT_NOT_FOUND', 'Parent node not found');
            parentId = pData.id;
        }

        const payload = {
            parent_id: parentId,
            sort_order: sortOrder,
            updated_by: context?.userId || 'system',
            updated_at: new Date().toISOString()
        };

        const { error } = await supabase.from('navigation_nodes').update(payload).eq('key', key);
        if (error) throw error;

        await this.logAction(context, 'Move Node', 'System Settings', `Moved node ${key} to parent ${parentKey || 'root'}`);
    }

    async reorderNavigationNodes(parentKey: string | null, orderedKeys: string[], context?: UserContext): Promise<void> {
        if (!isSupabaseConfigured) throw new AppError(503, 'DB_UNAVAILABLE', 'Database not configured');
        if (!Array.isArray(orderedKeys) || orderedKeys.length === 0) return;

        // 1. Resolve Parent ID (if not root)
        // Note: For root, parentKey is null.
        // We verify that the nodes actually belong to this parent? 
        // Or we just trust the client updates? 
        // For reordering, we just update sort_order. But we should also ensure parent_id is consistent if we want robustness.
        // However, usually reorder is called after move, or move implicitly handles reorder.
        // Let's just update sort_order for the given keys.
        
        // Strategy: Batch update using CASE WHEN or multiple updates.
        // Supabase/Postgres doesn't have a native "update many with different values" easily exposed in JS client 
        // without RPC or raw SQL.
        // Loop updates is simplest for now (though not most efficient).
        // Given folder size is usually small (<100), loop is acceptable.
        
        const userId = context?.userId || 'system';
        const now = new Date().toISOString();

        // Parallelize updates for speed
        const updates = orderedKeys.map((key, index) => {
            return supabase.from('navigation_nodes')
                .update({ 
                    sort_order: index, // 0, 1, 2...
                    updated_by: userId,
                    updated_at: now
                })
                .eq('key', key);
        });

        await Promise.all(updates);

        await this.logAction(context, 'Reorder Nodes', 'System Settings', `Reordered ${orderedKeys.length} nodes under ${parentKey || 'root'}`);
    }

    async getGlobalStandards(): Promise<string> {
        // Try new system_configs table first
        const { data, error } = await supabase.from('system_configs').select('value').eq('key', 'global_standards').single();
        if (data && data.value) return data.value;
        
        // Fallback to old navigation table (migration path)
        const { data: oldData } = await supabase.from('navigation').select('tree').eq('id', 'global_standards').single();
        if (oldData && oldData.tree) return oldData.tree.content;

        return MOCK_GlobalStandards;
    }

    async updateGlobalStandards(content: string, context?: UserContext): Promise<void> {
        // Update new system_configs table
        const { error } = await supabase.from('system_configs').upsert({
            key: 'global_standards',
            value: content,
            description: 'Global Architecture & Development Standards',
            updated_by: context?.userId || 'system',
            updated_at: new Date().toISOString()
        });

        if (error) {
             console.error('Failed to update system_configs:', error);
             // Fallback attempt to old table if new one fails (e.g. table missing)
             await supabase.from('navigation').upsert({
                id: 'global_standards',
                tree: { content } as any
            });
        }
        
        await this.logAction(context, 'Update Standards', 'System Settings', 'Updated global standards');
    }

    // --- Modules ---
    async getModule(id: string): Promise<ModuleData | null> {
        const { data } = await supabase.from('modules').select('*').eq('key', id).single();
        if (data) {
             return {
                 id: data.key,
                 name: data.name,
                 status: data.status as any,
                 owners: data.owners,
                 timeline: data.timeline,
                 requirements: data.requirements,
                 expertRequirements: data.expert_requirements,
                 logicRules: data.logic_rules,
                 knowledge: data.knowledge,
                 uiComponents: data.ui_components,
                 figmaLinks: data.figma_links,
                 prototypeImages: data.prototype_images,
                 versions: data.versions,
                 comments: data.comments,
                 updatedAt: data.updated_at
             };
        }
        return MOCK_DATABASE[id] as ModuleData || null;
    }

    async updateModule(id: string, updates: Partial<ModuleData>, context?: UserContext): Promise<ModuleData> {
        const payload: any = {};
        if (updates.requirements) payload.requirements = updates.requirements;
        if (updates.expertRequirements) payload.expert_requirements = updates.expertRequirements;
        if (updates.logicRules) payload.logic_rules = updates.logicRules;
        if (updates.uiComponents) payload.ui_components = updates.uiComponents;
        if (updates.knowledge) payload.knowledge = updates.knowledge;
        if (updates.figmaLinks) payload.figma_links = updates.figmaLinks;
        if (updates.prototypeImages) payload.prototype_images = updates.prototypeImages;
        if (updates.versions) payload.versions = updates.versions;
        if (updates.comments) payload.comments = updates.comments;
        if (updates.owners) payload.owners = updates.owners;
        if (updates.timeline) payload.timeline = updates.timeline;
        if (updates.status) payload.status = updates.status;

        const { error } = await supabase.from('modules').update(payload).eq('key', id);
        if (error) {
             // If update fails, maybe it doesn't exist? Try insert? 
             // For now assume update works or we catch error
             console.error('Update module failed:', error);
        } else {
             await this.logAction(context, 'Update Module', 'Module Management', `Updated module ${id}: ${Object.keys(updates).join(', ')}`);
        }
        return { ...updates, id } as ModuleData;
    }

    // --- Logs ---
    async getAuditLogs(page?: number, pageSize?: number): Promise<AuditLogEntry[] | { items: AuditLogEntry[], total: number }> {
        try {
            if (page && pageSize) {
                const from = (page - 1) * pageSize;
                const to = from + pageSize - 1;
                const { data, error, count } = await supabase
                    .from('audit_logs')
                    .select('*', { count: 'exact' })
                    .order('created_at', { ascending: false })
                    .range(from, to);
                if (error || !data) {
                    return { items: [], total: 0 };
                }
                const items = data.map(l => ({
                    id: l.id.toString(),
                    userId: l.user_id,
                    userName: l.user_name,
                    action: l.action,
                    module: l.module,
                    timestamp: l.created_at,
                    ip: l.ip,
                    details: l.details,
                    status: l.status as any
                }));
                return { items, total: count || 0 };
            } else {
                const { data, error } = await supabase
                    .from('audit_logs')
                    .select('*')
                    .order('created_at', { ascending: false })
                    .limit(100);
                if (error || !data) {
                    return [];
                }
                return data.map(l => ({
                    id: l.id.toString(),
                    userId: l.user_id,
                    userName: l.user_name,
                    action: l.action,
                    module: l.module,
                    timestamp: l.created_at,
                    ip: l.ip,
                    details: l.details,
                    status: l.status as any
                }));
            }
        } catch {
            if (page && pageSize) {
                return { items: [], total: 0 };
            }
            return [];
        }
    }

    async getAuditLogsCursor(pageSize: number = 20, cursor?: string): Promise<{ items: AuditLogEntry[], nextCursor: string | null, hasMore: boolean }> {
        const size = Math.max(1, Math.min(pageSize || 20, 100));
        let q = supabase
            .from('audit_logs')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(size);
        if (cursor) {
            q = q.lt('created_at', cursor);
        }
        const { data, error } = await q;
        if (error || !data) {
            return { items: [], nextCursor: null, hasMore: false };
        }
        const items = data.map(l => ({
            id: l.id.toString(),
            userId: l.user_id,
            userName: l.user_name,
            action: l.action,
            module: l.module,
            timestamp: l.created_at,
            ip: l.ip,
            details: l.details,
            status: l.status as any
        }));
        const hasMore = items.length === size;
        const nextCursor = hasMore ? items[items.length - 1].timestamp : null;
        return { items, nextCursor, hasMore };
    }

    async addAuditLog(log: AuditLogEntry): Promise<AuditLogEntry> {
        const payload = {
            user_id: log.userId,
            user_name: log.userName,
            action: log.action,
            module: log.module,
            details: log.details,
            status: log.status,
            ip: log.ip,
            created_at: new Date().toISOString()
        };
        await supabase.from('audit_logs').insert(payload);
        return log;
    }

    async clearAuditLogs(): Promise<number> {
        const { error, count } = await supabase
            .from('audit_logs')
            .delete({ count: 'exact' })
            .gt('id', 0);
        if (error) throw error;
        return count || 0;
    }

    async clearSystemErrors(): Promise<number> {
        const { error, count } = await supabase
            .from('system_errors')
            .delete({ count: 'exact' })
            .gt('id', 0);
        if (error) throw error;
        return count || 0;
    }

    async getSystemErrors(): Promise<SystemErrorLogEntry[]> {
        try {
            const { data, error } = await supabase.from('system_errors').select('*').order('created_at', { ascending: false }).limit(50);
            if (error || !data) {
                return [];
            }
            return data.map(e => ({
                id: e.id.toString(),
                timestamp: e.created_at,
                userId: e.user_id,
                userName: e.user_name,
                errorCode: e.error_code,
                errorMessage: e.error_message,
                stackTrace: e.stack_trace,
                route: e.route,
                browser: e.browser,
                status: e.status as any
            }));
        } catch (e) {
            console.error('Error fetching system errors:', e);
            return [];
        }
    }
    
    async addSystemError(entry: Omit<SystemErrorLogEntry, 'id' | 'timestamp'>): Promise<SystemErrorLogEntry | null> {
        try {
            const payload = {
                user_id: entry.userId || null,
                user_name: entry.userName || null,
                error_code: entry.errorCode,
                error_message: entry.errorMessage,
                stack_trace: entry.stackTrace || null,
                route: entry.route,
                browser: entry.browser || '',
                status: entry.status || 'open',
                created_at: new Date().toISOString()
            };
            const { data, error } = await supabase.from('system_errors').insert(payload).select().single();
            if (error) {
                console.error('Error inserting system error:', error);
                return null;
            }
            return {
                id: data.id.toString(),
                timestamp: data.created_at,
                userId: data.user_id,
                userName: data.user_name,
                errorCode: data.error_code,
                errorMessage: data.error_message,
                stackTrace: data.stack_trace,
                route: data.route,
                browser: data.browser,
                status: data.status
            };
        } catch (e) {
            console.error('Crash in addSystemError:', e);
            return null;
        }
    }

    async getCommentsCursor(moduleId: string, pageSize: number = 20, cursor?: string): Promise<{ items: Comment[], nextCursor: string | null, hasMore: boolean }> {
        const size = Math.max(1, Math.min(pageSize || 20, 100));
        if (!isSupabaseConfigured) {
            const all = this.memoryComments[moduleId] || [];
            const desc = [...all].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
            const start = 0;
            const slice = cursor ? desc.filter(c => new Date(c.timestamp).getTime() < new Date(cursor).getTime()) : desc;
            const items = slice.slice(start, start + size);
            const hasMore = slice.length > size;
            const nextCursor = hasMore ? items[items.length - 1]?.timestamp || null : null;
            return { items, nextCursor, hasMore };
        }

        let q = supabase
            .from('comments')
            .select('*')
            .eq('module_key', moduleId)
            .order('created_at', { ascending: false })
            .limit(size);
        if (cursor) q = q.lt('created_at', cursor);
        const { data, error } = await q;
        if (error || !data) return { items: [], nextCursor: null, hasMore: false };
        const items = data.map((c: any) => ({
            id: String(c.id),
            userId: c.user_id || '',
            userName: c.user_name || '',
            userAvatar: c.user_avatar || '',
            content: c.content || '',
            timestamp: c.created_at,
            attachments: c.attachments || []
        }));
        const hasMore = items.length === size;
        const nextCursor = hasMore ? items[items.length - 1].timestamp : null;
        return { items, nextCursor, hasMore };
    }

    async addComment(moduleId: string, moduleName: string, content: string, user: { userId: string; userName: string; userAvatar?: string }, context?: UserContext): Promise<Comment> {
        const now = new Date().toISOString();
        const comment: Comment = {
            id: Date.now().toString(),
            userId: user.userId,
            userName: user.userName,
            userAvatar: user.userAvatar || '',
            content,
            timestamp: now,
            attachments: []
        };

        if (!isSupabaseConfigured) {
            this.memoryComments[moduleId] = [...(this.memoryComments[moduleId] || []), comment];
            await this.logAction(context, 'Add Comment', moduleId, `Posted comment (${content.length} chars)`);
            return comment;
        }

        const payload: any = {
            module_key: moduleId,
            user_id: user.userId,
            user_name: user.userName,
            user_avatar: user.userAvatar || '',
            content,
            attachments: [],
            created_at: now
        };

        const { data, error } = await supabase.from('comments').insert(payload).select('*').single();
        if (error) throw error;

        await this.logAction(context, 'Add Comment', moduleId, `Posted comment (${content.length} chars)`);

        return {
            id: String(data.id),
            userId: data.user_id,
            userName: data.user_name,
            userAvatar: data.user_avatar || '',
            content: data.content,
            timestamp: data.created_at,
            attachments: data.attachments || []
        };
    }

    async getBusinessRequirementsCursor(
        moduleId: string,
        pageSize: number = 20,
        cursor?: string,
        filters?: { q?: string; tags?: string[]; status?: string }
    ): Promise<{ items: BusinessRequirement[]; nextCursor: string | null; hasMore: boolean }> {
        const size = Math.max(1, Math.min(pageSize || 20, 100));
        const q = String(filters?.q || '').trim();
        const tags = (filters?.tags || []).map(String).map(s => s.trim()).filter(Boolean);
        const status = filters?.status ? String(filters.status) : '';

        if (!isSupabaseConfigured) {
            const all = (this.memoryBusinessRequirements[moduleId] || []).filter(r => true);
            let desc = [...all].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            if (q) {
                const qLower = q.toLowerCase();
                desc = desc.filter(r => (r.title || '').toLowerCase().includes(qLower) || (r.content || '').toLowerCase().includes(qLower));
            }
            if (tags.length > 0) {
                desc = desc.filter(r => tags.every(t => (r.tags || []).includes(t)));
            }
            if (status) {
                desc = desc.filter(r => r.status === status);
            }
            const slice = cursor ? desc.filter(r => new Date(r.createdAt).getTime() < new Date(cursor).getTime()) : desc;
            const items = slice.slice(0, size);
            const hasMore = slice.length > size;
            const nextCursor = hasMore ? items[items.length - 1]?.createdAt || null : null;
            return { items, nextCursor, hasMore };
        }

        let query = supabase
            .from('business_requirements')
            .select('*')
            .eq('module_key', moduleId)
            .is('deleted_at', null)
            .order('created_at', { ascending: false })
            .limit(size);
        if (cursor) query = query.lt('created_at', cursor);
        if (status) query = query.eq('status', status);
        if (q) query = query.or(`title.ilike.%${q}%,content.ilike.%${q}%`);
        if (tags.length > 0) query = query.contains('tags', tags);

        const { data, error } = await query;
        if (error || !data) return { items: [], nextCursor: null, hasMore: false };
        const items = (data as any[]).map(r => ({
            id: String(r.id),
            moduleId: String(r.module_key),
            title: r.title || '',
            content: r.content || '',
            tags: r.tags || [],
            status: (r.status || 'open') as any,
            priority: (r.priority || 'medium') as any,
            proposerName: r.proposer_name || '',
            createdById: r.created_by_id || '',
            createdByName: r.created_by_name || '',
            createdByAvatar: r.created_by_avatar || '',
            createdAt: r.created_at,
            updatedAt: r.updated_at
        })) as BusinessRequirement[];
        const hasMore = items.length === size;
        const nextCursor = hasMore ? items[items.length - 1].createdAt : null;
        return { items, nextCursor, hasMore };
    }

    async addBusinessRequirement(
        moduleId: string,
        title: string,
        content: string,
        tags: string[],
        priority: 'low' | 'medium' | 'high' | 'urgent',
        proposerName: string,
        user: { userId: string; userName: string; userAvatar?: string },
        context?: UserContext
    ): Promise<BusinessRequirement> {
        const now = new Date().toISOString();
        const req: BusinessRequirement = {
            id: Date.now().toString(),
            moduleId,
            title,
            content,
            tags,
            status: 'open',
            priority,
            proposerName,
            createdById: user.userId,
            createdByName: user.userName,
            createdByAvatar: user.userAvatar || '',
            createdAt: now,
            updatedAt: now
        };

        if (!isSupabaseConfigured) {
            this.memoryBusinessRequirements[moduleId] = [...(this.memoryBusinessRequirements[moduleId] || []), req];
            await this.logAction(context, 'Add Business Requirement', moduleId, `title=${title}`);
            return req;
        }

        const payload: any = {
            module_key: moduleId,
            title,
            content,
            tags,
            status: 'open',
            priority,
            proposer_name: proposerName,
            created_by_id: user.userId,
            created_by_name: user.userName,
            created_by_avatar: user.userAvatar || '',
            created_at: now
        };
        const { data, error } = await supabase.from('business_requirements').insert(payload).select('*').single();
        if (error) throw error;
        await this.logAction(context, 'Add Business Requirement', moduleId, `title=${title}`);
        return {
            id: String(data.id),
            moduleId: String(data.module_key),
            title: data.title || '',
            content: data.content || '',
            tags: data.tags || [],
            status: (data.status || 'open') as any,
            priority: (data.priority || 'medium') as any,
            proposerName: data.proposer_name || '',
            createdById: data.created_by_id || '',
            createdByName: data.created_by_name || '',
            createdByAvatar: data.created_by_avatar || '',
            createdAt: data.created_at,
            updatedAt: data.updated_at
        };
    }

    async getBusinessRequirement(id: string): Promise<BusinessRequirement | null> {
        const idStr = String(id || '');
        if (!idStr) return null;
        if (!isSupabaseConfigured) {
            const all = Object.values(this.memoryBusinessRequirements).flat();
            return all.find(r => r.id === idStr) || null;
        }
        const { data, error } = await supabase.from('business_requirements').select('*').eq('id', idStr).is('deleted_at', null).single();
        if (error || !data) return null;
        return {
            id: String(data.id),
            moduleId: String(data.module_key),
            title: data.title || '',
            content: data.content || '',
            tags: data.tags || [],
            status: (data.status || 'open') as any,
            priority: (data.priority || 'medium') as any,
            proposerName: data.proposer_name || '',
            createdById: data.created_by_id || '',
            createdByName: data.created_by_name || '',
            createdByAvatar: data.created_by_avatar || '',
            createdAt: data.created_at,
            updatedAt: data.updated_at
        };
    }

    async getBusinessRequirementCommentsCursor(requirementId: string, pageSize: number = 30, cursor?: string): Promise<{ items: BusinessRequirementComment[]; nextCursor: string | null; hasMore: boolean }> {
        const size = Math.max(1, Math.min(pageSize || 30, 100));
        if (!isSupabaseConfigured) {
            const all = this.memoryBusinessRequirementComments[requirementId] || [];
            const desc = [...all].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            const slice = cursor ? desc.filter(c => new Date(c.createdAt).getTime() < new Date(cursor).getTime()) : desc;
            const items = slice.slice(0, size);
            const hasMore = slice.length > size;
            const nextCursor = hasMore ? items[items.length - 1]?.createdAt || null : null;
            return { items, nextCursor, hasMore };
        }

        let q = supabase
            .from('business_requirement_comments')
            .select('*')
            .eq('requirement_id', requirementId)
            .is('deleted_at', null)
            .order('created_at', { ascending: false })
            .limit(size);
        if (cursor) q = q.lt('created_at', cursor);
        const { data, error } = await q;
        if (error || !data) return { items: [], nextCursor: null, hasMore: false };
        const items = (data as any[]).map(c => ({
            id: String(c.id),
            requirementId: String(c.requirement_id),
            parentId: c.parent_id != null ? String(c.parent_id) : null,
            userId: c.user_id || '',
            userName: c.user_name || '',
            userAvatar: c.user_avatar || '',
            content: c.content || '',
            createdAt: c.created_at
        })) as BusinessRequirementComment[];
        const hasMore = items.length === size;
        const nextCursor = hasMore ? items[items.length - 1].createdAt : null;
        return { items, nextCursor, hasMore };
    }

    async addBusinessRequirementComment(
        requirementId: string,
        content: string,
        user: { userId: string; userName: string; userAvatar?: string },
        parentId?: string | null,
        context?: UserContext
    ): Promise<BusinessRequirementComment> {
        const now = new Date().toISOString();
        const local: BusinessRequirementComment = {
            id: Date.now().toString(),
            requirementId: String(requirementId),
            parentId: parentId ?? null,
            userId: user.userId,
            userName: user.userName,
            userAvatar: user.userAvatar || '',
            content,
            createdAt: now
        };

        if (!isSupabaseConfigured) {
            const key = String(requirementId);
            this.memoryBusinessRequirementComments[key] = [...(this.memoryBusinessRequirementComments[key] || []), local];
            await this.logAction(context, 'Add Business Requirement Comment', key, `chars=${content.length}`);
            return local;
        }

        const payload: any = {
            requirement_id: Number(requirementId),
            parent_id: parentId ? Number(parentId) : null,
            user_id: user.userId,
            user_name: user.userName,
            user_avatar: user.userAvatar || '',
            content,
            created_at: now
        };
        const { data, error } = await supabase.from('business_requirement_comments').insert(payload).select('*').single();
        if (error) throw error;
        await this.logAction(context, 'Add Business Requirement Comment', String(requirementId), `chars=${content.length}`);
        return {
            id: String(data.id),
            requirementId: String(data.requirement_id),
            parentId: data.parent_id != null ? String(data.parent_id) : null,
            userId: data.user_id || '',
            userName: data.user_name || '',
            userAvatar: data.user_avatar || '',
            content: data.content || '',
            createdAt: data.created_at
        };
    }

    async getAIChatMessagesCursor(moduleId: string, pageSize: number = 20, cursor?: string): Promise<{ items: { id: string; role: 'user' | 'model'; content: string; timestamp: string; actorId?: string; actorName?: string; actorAvatar?: string; agentId?: string; promptLabel?: string | null }[], nextCursor: string | null, hasMore: boolean }> {
        const size = Math.max(1, Math.min(pageSize || 20, 100));
        if (!isSupabaseConfigured) {
            const all = (this.memoryAIChat[moduleId] || []).filter(m => !m.deletedAt);
            const desc = [...all].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
            const slice = cursor ? desc.filter(m => new Date(m.timestamp).getTime() < new Date(cursor).getTime()) : desc;
            const items = slice.slice(0, size).map(m => ({
                id: m.id,
                role: m.role,
                content: m.content,
                timestamp: m.timestamp,
                actorId: m.actorId,
                actorName: m.actorName,
                actorAvatar: m.actorAvatar,
                agentId: m.agentId,
                promptLabel: m.promptLabel ?? null
            }));
            const hasMore = slice.length > size;
            const nextCursor = hasMore ? items[items.length - 1]?.timestamp || null : null;
            return { items, nextCursor, hasMore };
        }

        let q = supabase
            .from('ai_chat_messages')
            .select('*')
            .eq('module_key', moduleId)
            .is('deleted_at', null)
            .order('created_at', { ascending: false })
            .limit(size);
        if (cursor) q = q.lt('created_at', cursor);
        const { data, error } = await q;
        if (error || !data) return { items: [], nextCursor: null, hasMore: false };
        const items = data.map((m: any) => ({
            id: String(m.id),
            role: m.role as 'user' | 'model',
            content: m.content || '',
            timestamp: m.created_at,
            actorId: m.actor_id || '',
            actorName: m.actor_name || '',
            actorAvatar: m.actor_avatar || '',
            agentId: m.agent_id || '',
            promptLabel: m.prompt_label ?? null
        }));
        const hasMore = items.length === size;
        const nextCursor = hasMore ? items[items.length - 1].timestamp : null;
        return { items, nextCursor, hasMore };
    }

    async addAIChatMessage(moduleId: string, agentId: string, promptLabel: string | undefined, role: 'user' | 'model', content: string, actor: { actorId: string; actorName: string; actorAvatar?: string }, context?: UserContext): Promise<{ id: string; role: 'user' | 'model'; content: string; timestamp: string }> {
        const now = new Date().toISOString();
        const local = {
            id: Date.now().toString(),
            role,
            content,
            timestamp: now,
            actorId: actor.actorId,
            actorName: actor.actorName,
            actorAvatar: actor.actorAvatar || '',
            agentId,
            promptLabel: promptLabel ?? null,
            deletedAt: null
        };

        if (!isSupabaseConfigured) {
            this.memoryAIChat[moduleId] = [...(this.memoryAIChat[moduleId] || []), local];
            await this.logAction(context, 'Add AI Chat Message', moduleId, `role=${role}, chars=${content.length}`);
            return { id: local.id, role: local.role, content: local.content, timestamp: local.timestamp };
        }

        const payload: any = {
            module_key: moduleId,
            agent_id: agentId,
            prompt_label: promptLabel ?? null,
            role,
            actor_id: actor.actorId,
            actor_name: actor.actorName,
            actor_avatar: actor.actorAvatar || '',
            content,
            created_at: now
        };
        const { data, error } = await supabase.from('ai_chat_messages').insert(payload).select('*').single();
        if (error) {
            const message = String((error as any)?.message || '');
            if (message.includes('agent_id') || message.includes('prompt_label')) {
                const legacyPayload: any = {
                    module_key: moduleId,
                    role,
                    actor_id: actor.actorId,
                    actor_name: actor.actorName,
                    actor_avatar: actor.actorAvatar || '',
                    content,
                    created_at: now
                };
                const retry = await supabase.from('ai_chat_messages').insert(legacyPayload).select('*').single();
                if (retry.error) throw retry.error;
                await this.logAction(context, 'Add AI Chat Message', moduleId, `role=${role}, chars=${content.length}`);
                return {
                    id: String(retry.data.id),
                    role: retry.data.role,
                    content: retry.data.content,
                    timestamp: retry.data.created_at
                };
            }
            throw error;
        }

        await this.logAction(context, 'Add AI Chat Message', moduleId, `role=${role}, chars=${content.length}`);

        return {
            id: String(data.id),
            role: data.role,
            content: data.content,
            timestamp: data.created_at
        };
    }

    async getAIChatMessageFeedbackMap(userId: string, messageIds: string[], moduleId?: string): Promise<Record<string, { favorite: boolean; reaction: 'like' | 'dislike' | null }>> {
        const ids = (messageIds || []).map(String).filter(Boolean);
        if (!userId || ids.length === 0) return {};
        if (!isSupabaseConfigured) {
            const map: Record<string, { favorite: boolean; reaction: 'like' | 'dislike' | null }> = {};
            for (const id of ids) {
                const key = `${userId}:${id}`;
                const row = this.memoryAIChatFeedback[key];
                if (row) map[id] = { favorite: !!row.favorite, reaction: (row.reaction as any) ?? null };
            }
            return map;
        }

        const numericIds = ids.map(v => Number(v)).filter(n => !Number.isNaN(n));
        if (numericIds.length === 0) return {};
        let q = supabase
            .from('ai_chat_message_feedback')
            .select('message_id,favorite,reaction')
            .eq('user_id', userId)
            .in('message_id', numericIds);
        if (moduleId) q = q.eq('module_key', moduleId);
        const { data, error } = await q;
        if (error || !data) return {};
        const map: Record<string, { favorite: boolean; reaction: 'like' | 'dislike' | null }> = {};
        for (const r of data as any[]) {
            const mid = String(r.message_id);
            map[mid] = { favorite: !!r.favorite, reaction: r.reaction ? (String(r.reaction) as any) : null };
        }
        return map;
    }

    async setAIChatMessageFeedback(
        messageId: string,
        userId: string,
        patch: { favorite?: boolean; reaction?: 'like' | 'dislike' | null },
        context?: UserContext
    ): Promise<{ favorite: boolean; reaction: 'like' | 'dislike' | null }> {
        if (!userId) throw new AppError(401, 'AUTH_REQUIRED', 'Not authenticated');
        const idStr = String(messageId || '');
        if (!idStr) throw new AppError(400, 'ID_REQUIRED', 'id is required');
        const nowIso = new Date().toISOString();

        if (!isSupabaseConfigured) {
            const moduleKeys = Object.keys(this.memoryAIChat);
            let found: { moduleKey: string; msg: any } | null = null;
            for (const mk of moduleKeys) {
                const msg = (this.memoryAIChat[mk] || []).find(m => m.id === idStr && !m.deletedAt);
                if (msg) {
                    found = { moduleKey: mk, msg };
                    break;
                }
            }
            if (!found) throw new AppError(404, 'NOT_FOUND', 'Message not found');
            if (found.msg.role !== 'model') throw new AppError(400, 'ONLY_MODEL', 'Only AI reply can be feedback');

            const key = `${userId}:${idStr}`;
            const prev = this.memoryAIChatFeedback[key] || { favorite: false, reaction: null, updatedAt: nowIso };
            const next = {
                favorite: typeof patch.favorite === 'boolean' ? patch.favorite : prev.favorite,
                reaction: patch.reaction === null || patch.reaction === 'like' || patch.reaction === 'dislike' ? patch.reaction ?? prev.reaction : prev.reaction,
                updatedAt: nowIso
            };
            this.memoryAIChatFeedback[key] = next as any;
            await this.logAction(context, 'AI Chat Feedback', found.moduleKey, `message=${idStr}, favorite=${next.favorite}, reaction=${next.reaction || 'null'}`);
            return { favorite: !!next.favorite, reaction: (next.reaction as any) ?? null };
        }

        const mid = Number(idStr);
        if (Number.isNaN(mid)) throw new AppError(400, 'ID_INVALID', 'Invalid id');
        const { data: msgRow, error: msgErr } = await supabase
            .from('ai_chat_messages')
            .select('id,module_key,role')
            .eq('id', mid)
            .is('deleted_at', null)
            .single();
        if (msgErr || !msgRow) throw new AppError(404, 'NOT_FOUND', 'Message not found');
        if (String((msgRow as any).role) !== 'model') throw new AppError(400, 'ONLY_MODEL', 'Only AI reply can be feedback');

        const payload: any = {
            message_id: mid,
            module_key: (msgRow as any).module_key,
            user_id: userId
        };
        if (typeof patch.favorite === 'boolean') payload.favorite = patch.favorite;
        if (patch.reaction === null || patch.reaction === 'like' || patch.reaction === 'dislike') payload.reaction = patch.reaction;

        const { data: upserted, error: upErr } = await supabase
            .from('ai_chat_message_feedback')
            .upsert(payload, { onConflict: 'message_id,user_id' })
            .select('favorite,reaction')
            .single();
        if (upErr) throw upErr;

        await this.logAction(context, 'AI Chat Feedback', String((msgRow as any).module_key), `message=${idStr}, favorite=${!!upserted.favorite}, reaction=${upserted.reaction || 'null'}`);
        return { favorite: !!upserted.favorite, reaction: upserted.reaction ? (String(upserted.reaction) as any) : null };
    }

    async deleteAIChatMessagePair(messageId: string, context?: UserContext): Promise<{ deletedIds: string[] }> {
        const requesterId = context?.userId;
        if (!requesterId) throw new AppError(401, 'AUTH_REQUIRED', 'Not authenticated');
        const requester = await this.getUserById(requesterId);
        const isAdmin = requester?.role === 'Admin';

        const now = new Date();
        const twelveHoursMs = 12 * 60 * 60 * 1000;

        if (!isSupabaseConfigured) {
            const moduleKeys = Object.keys(this.memoryAIChat);
            let found: { moduleKey: string; msg: any } | null = null;
            for (const mk of moduleKeys) {
                const msg = (this.memoryAIChat[mk] || []).find(m => m.id === messageId && !m.deletedAt);
                if (msg) {
                    found = { moduleKey: mk, msg };
                    break;
                }
            }
            if (!found) throw new AppError(404, 'NOT_FOUND', 'Message not found');

            let question = found.msg;
            if (question.role === 'model') {
                if (!isAdmin) throw new AppError(403, 'FORBIDDEN', 'Only admin can delete this message');
                const all = (this.memoryAIChat[found.moduleKey] || []).filter(m => !m.deletedAt);
                const before = all
                    .filter(m => m.role === 'user' && new Date(m.timestamp).getTime() <= new Date(question.timestamp).getTime())
                    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
                if (before[0]) question = before[0];
            }

            if (!isAdmin) {
                if (question.role !== 'user') throw new AppError(403, 'FORBIDDEN', 'Only your questions can be deleted');
                if (String(question.actorId || '') !== String(requesterId)) throw new AppError(403, 'FORBIDDEN', 'Only your questions can be deleted');
                const ageMs = now.getTime() - new Date(question.timestamp).getTime();
                if (ageMs > twelveHoursMs) throw new AppError(403, 'FORBIDDEN', 'Only messages within 12 hours can be deleted');
            }

            const all = (this.memoryAIChat[found.moduleKey] || []).filter(m => !m.deletedAt);
            const reply = all
                .filter(m => m.role === 'model' && new Date(m.timestamp).getTime() > new Date(question.timestamp).getTime())
                .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())[0];

            const ids = [question.id, reply?.id].filter(Boolean) as string[];
            const deletedAt = now.toISOString();
            this.memoryAIChat[found.moduleKey] = (this.memoryAIChat[found.moduleKey] || []).map(m => (ids.includes(m.id) ? { ...m, deletedAt } : m));
            await this.logAction(context, 'Delete AI Chat Message Pair', found.moduleKey, `deleted=${ids.join(',')}`);
            return { deletedIds: ids };
        }

        const { data: target, error: targetErr } = await supabase
            .from('ai_chat_messages')
            .select('*')
            .eq('id', messageId)
            .is('deleted_at', null)
            .single();
        if (targetErr || !target) throw new AppError(404, 'NOT_FOUND', 'Message not found');

        let question = target;
        if (String(target.role) === 'model') {
            if (!isAdmin) throw new AppError(403, 'FORBIDDEN', 'Only admin can delete this message');
            const { data: qBefore } = await supabase
                .from('ai_chat_messages')
                .select('*')
                .eq('module_key', target.module_key)
                .eq('agent_id', target.agent_id)
                .eq('role', 'user')
                .is('deleted_at', null)
                .lte('created_at', target.created_at)
                .order('created_at', { ascending: false })
                .limit(1);
            if (qBefore && qBefore[0]) question = qBefore[0];
        }

        if (!isAdmin) {
            if (String(question.role) !== 'user') throw new AppError(403, 'FORBIDDEN', 'Only your questions can be deleted');
            if (String(question.actor_id || '') !== String(requesterId)) throw new AppError(403, 'FORBIDDEN', 'Only your questions can be deleted');
            const ageMs = now.getTime() - new Date(String(question.created_at)).getTime();
            if (ageMs > twelveHoursMs) throw new AppError(403, 'FORBIDDEN', 'Only messages within 12 hours can be deleted');
        }

        const { data: replyRows } = await supabase
            .from('ai_chat_messages')
            .select('id')
            .eq('module_key', question.module_key)
            .eq('agent_id', question.agent_id)
            .eq('role', 'model')
            .is('deleted_at', null)
            .gt('created_at', question.created_at)
            .order('created_at', { ascending: true })
            .limit(1);
        const replyId = replyRows && replyRows[0] ? String(replyRows[0].id) : null;

        const ids = [String(question.id), replyId].filter(Boolean) as string[];
        const deletedAt = now.toISOString();
        const { error: delErr } = await supabase
            .from('ai_chat_messages')
            .update({ deleted_at: deletedAt, updated_at: deletedAt })
            .in('id', ids);
        if (delErr) throw delErr;

        await this.logAction(context, 'Delete AI Chat Message Pair', String(question.module_key), `deleted=${ids.join(',')}`);
        return { deletedIds: ids };
    }

    async upsertEmailLoginCode(email: string, codeHash: string, expiresAt: string): Promise<void> {
        const emailNorm = String(email || '').trim().toLowerCase();
        if (!emailNorm) throw new AppError(400, 'EMAIL_REQUIRED', 'email is required');
        if (!codeHash) throw new AppError(400, 'CODE_HASH_REQUIRED', 'code hash is required');
        if (!expiresAt) throw new AppError(400, 'EXPIRES_REQUIRED', 'expiresAt is required');

        if (!isSupabaseConfigured) {
            this.memoryEmailLoginCodes[emailNorm] = { codeHash, expiresAt, attempts: 0, usedAt: null };
            return;
        }

        const payload: any = {
            email: emailNorm,
            code_hash: codeHash,
            expires_at: expiresAt,
            attempts: 0,
            used_at: null,
            updated_at: new Date().toISOString()
        };
        const { error } = await supabase.from('auth_email_login_codes').upsert(payload, { onConflict: 'email' });
        if (error) throw error;
    }

    async consumeEmailLoginCode(email: string, code: string): Promise<boolean> {
        const emailNorm = String(email || '').trim().toLowerCase();
        const codeStr = String(code || '');
        if (!emailNorm || !codeStr) return false;
        const nowIso = new Date().toISOString();

        const sha256 = (v: string) => crypto.createHash('sha256').update(v).digest('hex');
        const safeEqualHex = (a: string, b: string) => {
            try {
                const ba = Buffer.from(String(a || ''), 'hex');
                const bb = Buffer.from(String(b || ''), 'hex');
                if (ba.length !== bb.length) return false;
                return crypto.timingSafeEqual(ba, bb);
            } catch {
                return false;
            }
        };

        if (!isSupabaseConfigured) {
            const row = this.memoryEmailLoginCodes[emailNorm];
            if (!row) return false;
            if (row.usedAt) return false;
            if (new Date(row.expiresAt).getTime() <= Date.now()) return false;
            if ((row.attempts || 0) >= 10) return false;

            const inputHash = sha256(codeStr);
            const ok = safeEqualHex(row.codeHash, inputHash);
            this.memoryEmailLoginCodes[emailNorm] = {
                ...row,
                attempts: (row.attempts || 0) + 1,
                usedAt: ok ? nowIso : row.usedAt ?? null
            };
            return ok;
        }

        const { data, error } = await supabase.from('auth_email_login_codes').select('*').eq('email', emailNorm).single();
        if (error || !data) return false;

        if (data.used_at) return false;
        if (new Date(String(data.expires_at)).getTime() <= Date.now()) return false;
        if (Number(data.attempts || 0) >= 10) return false;

        const inputHash = sha256(codeStr);
        const ok = safeEqualHex(String(data.code_hash || ''), inputHash);

        const updated: any = {
            attempts: Number(data.attempts || 0) + 1,
            updated_at: nowIso
        };
        if (ok) updated.used_at = nowIso;

        const upd = await supabase.from('auth_email_login_codes').update(updated).eq('email', emailNorm);
        if (upd.error) throw upd.error;
        return ok;
    }

    // --- Agents ---
    async getAgents(): Promise<AIAgent[]> {
        try {
            const { data, error } = await supabase.from('agents').select('*');
            let agents: AIAgent[] = [];

            if (!data || data.length === 0) {
                 // Seed Agents
                 // ... seeding logic simplified for brevity in fallback ...
                 // Actually, if DB fails, we should just return INITIAL_AGENTS directly without trying to insert
                 if (error) {
                     // DB Error case
                     return INITIAL_AGENTS;
                 }
                 
                 // Empty DB case - Try seed but inside try-catch
                 const mapped = INITIAL_AGENTS.map(a => ({
                     key: a.id, // Map frontend ID to key column
                     name: a.name,
                     avatar: a.avatar,
                     role: a.role,
                     description: a.description,
                     system_prompt: a.systemPrompt,
                     pm_interaction_example: a.pmInteractionExample,
                     status: a.status,
                     scope: a.scope
                 }));
                 // We don't specify 'id' so Postgres generates it
                 await supabase.from('agents').insert(mapped);

                 // Seed Prompts from Initial Data
                 for (const agent of INITIAL_AGENTS) {
                     if (agent.commonPrompts && agent.commonPrompts.length > 0) {
                         for (const p of agent.commonPrompts) {
                             await this.addAgentPrompt(agent.id, p);
                         }
                     }
                 }

                 agents = INITIAL_AGENTS;
            } else {
                 agents = data.map((a: any) => ({
                    id: a.key, // Use key as the frontend ID
                    name: a.name,
                    avatar: a.avatar,
                    role: a.role,
                    description: a.description,
                    systemPrompt: a.system_prompt,
                    pmInteractionExample: a.pm_interaction_example,
                    status: a.status,
                    scope: a.scope
                })) as AIAgent[];
            }

            return agents;
        } catch (e) {
            console.error('Crash in getAgents:', e);
            return INITIAL_AGENTS;
        }
    }

    async addAgent(agent: AIAgent, context?: UserContext): Promise<AIAgent> {
        // Generate key if missing (e.g. creating new agent)
        const key = agent.id || `agent_${Date.now()}`;
        
        const dbAgent = {
            key: key, 
            name: agent.name,
            avatar: agent.avatar,
            role: agent.role,
            description: agent.description,
            system_prompt: agent.systemPrompt,
            pm_interaction_example: agent.pmInteractionExample,
            status: agent.status || 'active', // Default to active
            scope: agent.scope
        };
        const { error } = await supabase.from('agents').insert(dbAgent);
        if (error) throw error;
        
        // Handle prompts if any provided during creation
        if (agent.commonPrompts && agent.commonPrompts.length > 0) {
            for (const p of agent.commonPrompts) {
                await this.addAgentPrompt(key, p, context); // Pass context
            }
        }
        
        await this.logAction(context, 'Add Agent', 'Agent Management', `Added agent ${agent.name}`);

        return { ...agent, id: key, status: dbAgent.status as any };
    }

    async updateAgent(id: string, updates: Partial<AIAgent>, context?: UserContext): Promise<AIAgent> {
        const payload: any = {};
        if (updates.name) payload.name = updates.name;
        if (updates.avatar) payload.avatar = updates.avatar;
        if (updates.role) payload.role = updates.role;
        if (updates.description) payload.description = updates.description;
        if (updates.systemPrompt) payload.system_prompt = updates.systemPrompt;
        if (updates.pmInteractionExample) payload.pm_interaction_example = updates.pmInteractionExample;
        if (updates.status) payload.status = updates.status;
        if (updates.scope) payload.scope = updates.scope;

        const { error } = await supabase.from('agents').update(payload).eq('key', id); // Update by key
        if (error) throw error;

        await this.logAction(context, 'Update Agent', 'Agent Management', `Updated agent ${id}`);

        return { ...updates, id } as AIAgent;
    }

    async deleteAgent(id: string, context?: UserContext): Promise<boolean> {
        const { error } = await supabase.from('agents').delete().eq('key', id); // Delete by key
        if (error) return false;
        // Cascade delete prompts
        await supabase.from('agent_prompts').delete().eq('agent_id', id);
        
        await this.logAction(context, 'Delete Agent', 'Agent Management', `Deleted agent ${id}`);
        
        return true;
    }

    // --- Prompt Methods (Database) ---
    async getAgentPrompts(agentId: string): Promise<PromptTemplate[]> {
        // Try DB first
        const { data, error } = await supabase
            .from('agent_prompts')
            .select('*')
            .eq('agent_id', agentId)
            .order('created_at', { ascending: true });

        if (error) {
            console.error('Error fetching prompts:', error);
            return [];
        }

        if (data && data.length > 0) {
            return data.map((p: any) => ({
                id: p.id.toString(), // DB ID
                agentId: p.agent_id,
                label: p.label,
                content: p.content,
                createdBy: p.created_by,
                createdAt: p.created_at,
                updatedBy: p.updated_by,
                updatedAt: p.updated_at,
                usageCount: p.usage_count
            })) as PromptTemplate[];
        }

        // If DB empty, check if we need to migrate from file for this agent
        // (Only do this once or if we want to support migration on fly)
        // Let's do a quick check: if table is completely empty? No, per agent.
        // Migration logic: Read file, insert to DB, then return.
        const filePrompts = FilePromptReader.load()[agentId];
        if (filePrompts && filePrompts.length > 0) {
            console.log(`Migrating prompts for agent ${agentId} from file to DB...`);
            const migrated: PromptTemplate[] = [];
            for (const p of filePrompts) {
                const newP = await this.addAgentPrompt(agentId, {
                    ...p,
                    createdBy: 'system', // Migration owner
                    createdAt: new Date().toISOString()
                });
                if (newP) migrated.push(newP);
            }
            return migrated;
        }

        return [];
    }

    async addAgentPrompt(agentId: string, prompt: PromptTemplate, context?: UserContext): Promise<PromptTemplate> {
        const payload = {
            agent_id: agentId,
            label: prompt.label,
            content: prompt.content,
            created_by: prompt.createdBy || 'system',
            updated_by: prompt.updatedBy || 'system',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            usage_count: 0
        };

        const { data, error } = await supabase.from('agent_prompts').insert(payload).select().single();
        
        if (error) {
            console.error('Error adding prompt:', error);
            throw error;
        }
        
        await this.logAction(context, 'Add Prompt', 'Agent Management', `Added prompt ${prompt.label} to agent ${agentId}`);

        return {
            id: data.id.toString(),
            agentId: data.agent_id,
            label: data.label,
            content: data.content,
            createdBy: data.created_by,
            createdAt: data.created_at,
            updatedBy: data.updated_by,
            updatedAt: data.updated_at,
            usageCount: data.usage_count
        };
    }

    async updateAgentPrompt(agentId: string, prompt: PromptTemplate, context?: UserContext): Promise<PromptTemplate> {
        const payload: any = {
            label: prompt.label,
            content: prompt.content,
            updated_at: new Date().toISOString()
        };
        if (prompt.updatedBy) payload.updated_by = prompt.updatedBy;
        if (prompt.usageCount !== undefined) payload.usage_count = prompt.usageCount;

        const { data, error } = await supabase
            .from('agent_prompts')
            .update(payload)
            .eq('id', prompt.id) // DB ID
            .select()
            .single();

        if (error) throw error;
        
        await this.logAction(context, 'Update Prompt', 'Agent Management', `Updated prompt ${prompt.id} for agent ${agentId}`);

        return {
            id: data.id.toString(),
            agentId: data.agent_id,
            label: data.label,
            content: data.content,
            createdBy: data.created_by,
            createdAt: data.created_at,
            updatedBy: data.updated_by,
            updatedAt: data.updated_at,
            usageCount: data.usage_count
        };
    }

    async deleteAgentPrompt(agentId: string, promptId: string, context?: UserContext): Promise<boolean> {
        const { error } = await supabase.from('agent_prompts').delete().eq('id', promptId);
        if (error) return false;
        
        await this.logAction(context, 'Delete Prompt', 'Agent Management', `Deleted prompt ${promptId} from agent ${agentId}`);
        
        return true;
    }

    // --- Integrations (集成管理) ---
    
    // 内存数据回退机制：当数据库表 'integrations' 不存在时，使用此内存变量作为临时存储。
    // 这确保了在未执行数据库迁移的情况下，系统依然可以启动并演示功能。
    private memIntegrations: IntegrationConfig[] = JSON.parse(JSON.stringify(INITIAL_INTEGRATIONS));

    /**
     * 获取所有集成配置
     * 优先从数据库获取，如果失败（如表不存在），则回退到内存数据。
     */
    async getIntegrations(): Promise<IntegrationConfig[]> {
        try {
            const { data, error } = await supabase.from('integrations').select('*').order('type');
            if (error || !data) {
                console.warn('DB Fetch failed (table missing?), using in-memory integrations:', error?.message);
                return this.memIntegrations;
            }
            return data.map((i: any) => ({
                id: i.id,
                key: i.key,
                name: i.name,
                type: i.type,
                config: decryptConfig(i.config),
                enabled: i.enabled,
                schema: i.schema,
                updatedAt: i.updated_at
            }));
        } catch (e) {
            console.error('Crash in getIntegrations:', e);
            return this.memIntegrations;
        }
    }

    /**
     * 更新集成配置
     * @param key 集成唯一标识 (如 'llm_global')
     * @param updates 需要更新的字段 (config 或 enabled)
     */
    async updateIntegration(key: string, updates: Partial<IntegrationConfig>, context?: UserContext): Promise<IntegrationConfig | null> {
        const payload: any = { updated_at: new Date().toISOString() };
        
        if (updates.config) payload.config = encryptConfig(updates.config);
        
        if (updates.enabled !== undefined) payload.enabled = updates.enabled;
        
        // 尝试更新数据库
        const { data, error } = await supabase
            .from('integrations')
            .update(payload)
            .eq('key', key)
            .select()
            .single();
            
        if (error) {
            console.warn('DB Update failed, updating in-memory:', error.message);
            // 数据库更新失败（可能表不存在），回退到内存更新
            const idx = this.memIntegrations.findIndex(i => i.key === key);
            if (idx !== -1) {
                this.memIntegrations[idx] = {
                    ...this.memIntegrations[idx],
                    ...updates,
                    updatedAt: new Date().toISOString()
                };
                return this.memIntegrations[idx];
            }
            return null;
        }
        
        // 如果数据库更新成功，也同步更新内存数据，保持一致性
        const idx = this.memIntegrations.findIndex(i => i.key === key);
        if (idx !== -1) {
             this.memIntegrations[idx] = {
                ...this.memIntegrations[idx],
                ...updates,
                updatedAt: new Date().toISOString()
            };
        }

        await this.logAction(context, 'Update Integration', 'Integration Management', `Updated integration ${key}`);

        return {
            id: data.id,
            key: data.key,
            name: data.name,
            type: data.type,
            config: decryptConfig(data.config),
            enabled: data.enabled,
            schema: data.schema,
            updatedAt: data.updated_at
        };
    }

    /**
     * 切换集成启用/禁用状态 (热插拔)
     * @param key 集成唯一标识
     * @param enabled 目标状态
     */
    async toggleIntegration(key: string, enabled: boolean, context?: UserContext): Promise<boolean> {
        const { error } = await supabase
            .from('integrations')
            .update({ enabled, updated_at: new Date().toISOString() })
            .eq('key', key);
        
        if (error) {
             console.warn('DB Toggle failed, updating in-memory:', error.message);
             // 数据库操作失败，操作内存数据
             const idx = this.memIntegrations.findIndex(i => i.key === key);
             if (idx !== -1) {
                 this.memIntegrations[idx].enabled = enabled;
                 this.memIntegrations[idx].updatedAt = new Date().toISOString();
                 return true;
             }
             return false;
        }
        
        // 同步内存状态
        const idx = this.memIntegrations.findIndex(i => i.key === key);
        if (idx !== -1) {
            this.memIntegrations[idx].enabled = enabled;
            this.memIntegrations[idx].updatedAt = new Date().toISOString();
        }

        await this.logAction(context, 'Toggle Integration', 'Integration Management', `Toggled integration ${key} to ${enabled}`);

        return true;
    }

    async getSystemConfig(key: string): Promise<string | null> {
        const { data, error } = await supabase
            .from('system_configs')
            .select('value')
            .eq('key', key)
            .single();
        if (error) return null; // Return null instead of throw to be safe
        return data?.value ?? null;
    }

    async updateSystemConfig(key: string, value: string, description?: string, context?: UserContext): Promise<void> {
        const payload: any = {
            key,
            value,
            updated_by: context?.userId || 'system',
            updated_at: new Date().toISOString()
        };
        if (description) payload.description = description;

        const { error } = await supabase.from('system_configs').upsert(payload, { onConflict: 'key' });
        if (error) throw error;

        await this.logAction(context, 'Update System Config', 'System Settings', `Updated config ${key}`);
    }
}
export const store = new DataStore();
