"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppError = void 0;
const express_1 = __importDefault(require("express"));
const store_1 = require("../data/store");
const dbSchema_1 = require("../lib/dbSchema");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const nodemailer_1 = __importDefault(require("nodemailer"));
const crypto_1 = __importDefault(require("crypto"));
const errors_1 = require("../errors");
Object.defineProperty(exports, "AppError", { enumerable: true, get: function () { return errors_1.AppError; } });
const router = express_1.default.Router();
// Helper to wrap async routes
const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};
// --- Middleware ---
const getClientIp = (req) => {
    const xf = req.headers['x-forwarded-for'];
    const vercel = req.headers['x-vercel-forwarded-for'];
    const realIp = req.headers['x-real-ip'];
    const cfIp = req.headers['cf-connecting-ip'];
    const pickFirst = (value) => {
        if (typeof value === 'string')
            return value.split(',')[0]?.trim();
        if (Array.isArray(value))
            return String(value[0] || '').split(',')[0]?.trim();
        return undefined;
    };
    let ip = pickFirst(vercel) ||
        pickFirst(xf) ||
        pickFirst(realIp) ||
        pickFirst(cfIp) ||
        (Array.isArray(req.ips) && req.ips.length ? String(req.ips[0]) : undefined) ||
        req.ip;
    if (ip && ip.startsWith('::ffff:'))
        ip = ip.slice(7);
    return ip || 'unknown';
};
// Helper to extract user context from request
const getContext = (req) => {
    return {
        userId: req.headers['x-user-id'] || (req.body?.userId),
        userName: req.headers['x-user-name'],
        ip: getClientIp(req)
    };
};
// --- Routes ---
router.get('/health', asyncHandler(async (req, res) => {
    res.json({ success: true, data: { ok: true } });
}));
router.get('/system/config/:key', asyncHandler(async (req, res) => {
    const value = await store_1.store.getSystemConfig(String(req.params.key));
    res.json({ success: true, data: value });
}));
// Auth
router.post('/auth/login', asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    // 1. Find user
    const user = await store_1.store.getUserByEmail(email);
    if (!user) {
        throw new errors_1.AppError(401, 'AUTH_INVALID_CREDENTIALS', 'Invalid credentials');
    }
    // 2. Verify password
    if (!user.password_hash) {
        throw new errors_1.AppError(401, 'AUTH_CONFIG_ERROR', 'User configuration error');
    }
    const isValid = await bcryptjs_1.default.compare(password, user.password_hash);
    if (isValid) {
        // Audit Log Success
        store_1.store.addAuditLog({
            id: '',
            timestamp: '',
            ip: getClientIp(req),
            userId: user.id,
            userName: user.name,
            action: 'Login',
            module: 'Auth',
            details: 'User logged in successfully',
            status: 'success'
        }).catch(console.error);
        // Return user profile WITHOUT hash
        const { password_hash, ...userProfile } = user;
        res.json({ success: true, data: { user: userProfile, token: 'mock-jwt-token' } });
    }
    else {
        // Audit Log Failure
        store_1.store.addAuditLog({
            id: '',
            timestamp: '',
            ip: getClientIp(req),
            userId: user.id,
            userName: user.name,
            action: 'Login',
            module: 'Auth',
            details: 'Invalid password',
            status: 'failed'
        }).catch(console.error);
        throw new errors_1.AppError(401, 'AUTH_FAILED', '用户名或密码错误');
    }
}));
router.post('/auth/send-login-code', asyncHandler(async (req, res) => {
    const email = String(req.body?.email || '').trim().toLowerCase();
    if (!email)
        throw new errors_1.AppError(400, 'EMAIL_REQUIRED', 'email is required');
    const user = await store_1.store.getUserByEmail(email);
    if (!user)
        throw new errors_1.AppError(404, 'USER_NOT_FOUND', 'User not found');
    const integrations = await store_1.store.getIntegrations();
    const emailConfig = integrations.find(i => i.key === 'email_global');
    if (!emailConfig || !emailConfig.enabled) {
        throw new errors_1.AppError(400, 'EMAIL_SERVICE_DISABLED', 'Email service is disabled or not configured');
    }
    const { host, port, user: smtpUser, pass, senderName } = emailConfig.config || {};
    if (!host || !port || !smtpUser || !pass) {
        throw new errors_1.AppError(400, 'EMAIL_CONFIG_INVALID', 'Incomplete email configuration');
    }
    const letters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const digits = '0123456789';
    const specials = '!@#$%^&*';
    const all = letters + digits + specials;
    const pick = (s) => s[crypto_1.default.randomInt(0, s.length)];
    const codeArr = [pick(letters), pick(digits), pick(specials)];
    for (let i = 0; i < 5; i++)
        codeArr.push(pick(all));
    for (let i = codeArr.length - 1; i > 0; i--) {
        const j = crypto_1.default.randomInt(0, i + 1);
        [codeArr[i], codeArr[j]] = [codeArr[j], codeArr[i]];
    }
    const code = codeArr.join('');
    const codeHash = crypto_1.default.createHash('sha256').update(code).digest('hex');
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
    await store_1.store.upsertEmailLoginCode(email, codeHash, expiresAt);
    const transporter = nodemailer_1.default.createTransport({
        host,
        port: Number(port),
        secure: Number(port) === 465,
        auth: { user: smtpUser, pass },
    });
    const html = `
      <div style="font-family: -apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica,Arial,sans-serif; line-height:1.6;">
        <h2 style="margin:0 0 12px 0;">T-Engine 登录验证码</h2>
        <p style="margin:0 0 12px 0;">你的登录验证码为：</p>
        <div style="font-size:28px;font-weight:800;letter-spacing:2px;margin:12px 0 16px 0;">${code}</div>
        <p style="margin:0 0 12px 0;">验证码 10 分钟内有效。如非本人操作请忽略。</p>
      </div>
    `;
    try {
        await transporter.sendMail({
            from: `"${senderName || smtpUser}" <${smtpUser}>`,
            to: email,
            subject: 'T-Engine 登录验证码',
            text: `你的登录验证码为：${code}\n\n验证码 10 分钟内有效。如非本人操作请忽略。`,
            html
        });
    }
    catch (e) {
        throw new errors_1.AppError(500, 'EMAIL_SEND_FAILED', 'Failed to send email', e.message);
    }
    res.json({ success: true, data: { ok: true } });
}));
router.post('/auth/login-code', asyncHandler(async (req, res) => {
    const email = String(req.body?.email || '').trim().toLowerCase();
    const code = String(req.body?.code || '');
    if (!email || !code)
        throw new errors_1.AppError(400, 'INVALID_REQUEST', 'Missing required fields');
    const isValidFormat = (() => {
        if (code.length !== 8)
            return false;
        const hasLetter = /[A-Za-z]/.test(code);
        const hasDigit = /[0-9]/.test(code);
        const hasSpecial = /[!@#$%^&*]/.test(code);
        const onlyAllowed = /^[A-Za-z0-9!@#$%^&*]{8}$/.test(code);
        return hasLetter && hasDigit && hasSpecial && onlyAllowed;
    })();
    if (!isValidFormat)
        throw new errors_1.AppError(400, 'CODE_FORMAT_INVALID', 'Invalid code format');
    const user = await store_1.store.getUserByEmail(email);
    if (!user)
        throw new errors_1.AppError(401, 'AUTH_INVALID_CREDENTIALS', 'Invalid credentials');
    const ok = await store_1.store.consumeEmailLoginCode(email, code);
    if (!ok)
        throw new errors_1.AppError(401, 'AUTH_CODE_INVALID', '验证码错误或已过期');
    store_1.store.addAuditLog({
        id: '',
        timestamp: '',
        ip: getClientIp(req),
        userId: user.id,
        userName: user.name,
        action: 'Login',
        module: 'Auth',
        details: 'User logged in successfully (email code)',
        status: 'success'
    }).catch(console.error);
    const { password_hash, ...userProfile } = user;
    res.json({ success: true, data: { user: userProfile, token: 'mock-jwt-token' } });
}));
// Users
router.get('/users', asyncHandler(async (req, res) => {
    const users = await store_1.store.getUsers();
    res.json({ success: true, data: users });
}));
router.post('/users', asyncHandler(async (req, res) => {
    const { email } = req.body;
    // Check for duplicate email
    const existingUser = await store_1.store.getUserByEmail(email);
    if (existingUser) {
        throw new errors_1.AppError(409, 'USER_EMAIL_EXISTS', 'Email already exists');
    }
    const newUser = await store_1.store.addUser(req.body, getContext(req));
    if (newUser) {
        res.json({ success: true, data: newUser });
    }
    else {
        throw new errors_1.AppError(500, 'USER_CREATE_FAILED', 'Failed to create user');
    }
}));
router.post('/users/:id', asyncHandler(async (req, res) => {
    // Admin user update endpoint (allows role changes)
    const userId = req.params.id;
    const updates = req.body;
    // Check for duplicate email if email is being updated
    if (updates.email) {
        const existingUser = await store_1.store.getUserByEmail(updates.email);
        // Check if found user is NOT the current user
        if (existingUser && existingUser.id !== userId) {
            throw new errors_1.AppError(409, 'USER_EMAIL_EXISTS', 'Email already exists');
        }
    }
    const updatedUser = await store_1.store.updateUserProfile(userId, updates, getContext(req));
    if (updatedUser) {
        res.json(updatedUser);
    }
    else {
        throw new errors_1.AppError(500, 'USER_UPDATE_FAILED', 'Failed to update user');
    }
}));
router.post('/users/:id/toggle-status', asyncHandler(async (req, res) => {
    const success = await store_1.store.toggleUserStatus(req.params.id, getContext(req));
    if (success) {
        res.json({ success: true });
    }
    else {
        throw new errors_1.AppError(500, 'USER_STATUS_UPDATE_FAILED', 'Failed to toggle status');
    }
}));
router.post('/users/:id/reset-password', asyncHandler(async (req, res) => {
    const userId = req.params.id;
    // 1. Get User
    const user = await store_1.store.getUserById(userId);
    if (!user) {
        throw new errors_1.AppError(404, 'USER_NOT_FOUND', 'User not found');
    }
    // 2. Get Email Config
    const integrations = await store_1.store.getIntegrations();
    const emailConfig = integrations.find(i => i.key === 'email_global');
    if (!emailConfig || !emailConfig.enabled) {
        throw new errors_1.AppError(400, 'EMAIL_SERVICE_DISABLED', 'Email service is disabled or not configured');
    }
    const { host, port, user: smtpUser, pass, senderName } = emailConfig.config || {};
    if (!host || !port || !smtpUser || !pass) {
        throw new errors_1.AppError(400, 'EMAIL_CONFIG_INVALID', 'Incomplete email configuration');
    }
    // 3. Generate Random Password (>= 8 chars, mixed letters & numbers)
    const generatePassword = () => {
        const length = 10;
        const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        // Ensure at least one number and one letter
        let pwd = [
            'A', 'z', '2', // Ensure complexity
            ...Array(length - 3).fill(null).map(() => chars.charAt(Math.floor(Math.random() * chars.length)))
        ];
        // Shuffle
        return pwd.sort(() => 0.5 - Math.random()).join('');
    };
    const newPassword = generatePassword();
    // 4. Send Email
    const transporter = nodemailer_1.default.createTransport({
        host,
        port: Number(port),
        secure: Number(port) === 465,
        auth: { user: smtpUser, pass },
    });
    try {
        await transporter.sendMail({
            from: `"${senderName || smtpUser}" <${smtpUser}>`,
            to: user.email,
            subject: 'Password Reset Notification',
            text: `Your password has been reset by administrator.\n\nYour new password is: ${newPassword}\n\nPlease login and change it immediately.`,
        });
    }
    catch (e) {
        console.error('Failed to send password reset email:', e);
        throw new errors_1.AppError(500, 'EMAIL_SEND_FAILED', 'Failed to send email. Password not changed.', e.message);
    }
    // 5. Update Database
    const newHash = await bcryptjs_1.default.hash(newPassword, 10);
    const success = await store_1.store.changePassword(userId, newHash, getContext(req));
    if (success) {
        res.json({ success: true, message: 'Password reset and sent via email.' });
    }
    else {
        throw new errors_1.AppError(500, 'PASSWORD_UPDATE_FAILED', 'Failed to update password in database');
    }
}));
router.post('/auth/change-password', asyncHandler(async (req, res) => {
    const { userId, currentPassword, newPassword } = req.body;
    if (!userId || !currentPassword || !newPassword) {
        throw new errors_1.AppError(400, 'INVALID_REQUEST', 'Missing required fields');
    }
    // 1. Find user
    const user = await store_1.store.getUserById(userId);
    if (!user) {
        throw new errors_1.AppError(404, 'USER_NOT_FOUND', 'User not found');
    }
    if (!user.password_hash) {
        throw new errors_1.AppError(400, 'AUTH_CONFIG_ERROR', 'User configuration error');
    }
    // 2. Verify current password
    const isValid = await bcryptjs_1.default.compare(currentPassword, user.password_hash);
    if (!isValid) {
        throw new errors_1.AppError(401, 'AUTH_INVALID_PASSWORD', 'Incorrect current password');
    }
    // 3. Hash new password
    const newPasswordHash = await bcryptjs_1.default.hash(newPassword, 10);
    // 4. Update in DB
    const success = await store_1.store.changePassword(userId, newPasswordHash, getContext(req));
    if (success) {
        res.json({ success: true });
    }
    else {
        throw new errors_1.AppError(500, 'PASSWORD_UPDATE_FAILED', 'Failed to update password');
    }
}));
router.post('/auth/update-profile', asyncHandler(async (req, res) => {
    const { userId, updates } = req.body;
    if (!userId || !updates) {
        throw new errors_1.AppError(400, 'INVALID_REQUEST', 'Missing required fields');
    }
    // Prevent role update if not admin
    if (updates.role) {
        delete updates.role;
    }
    const updatedUser = await store_1.store.updateUserProfile(userId, updates, getContext(req));
    if (updatedUser) {
        res.json(updatedUser);
    }
    else {
        throw new errors_1.AppError(500, 'PROFILE_UPDATE_FAILED', 'Failed to update profile');
    }
}));
router.get('/auth/me', asyncHandler(async (req, res) => {
    const userId = req.headers['x-user-id'];
    if (userId) {
        const user = await store_1.store.getUserById(userId);
        if (user) {
            return res.json(user);
        }
    }
    throw new errors_1.AppError(401, 'AUTH_REQUIRED', 'Not authenticated');
}));
// Navigation
router.get('/navigation', asyncHandler(async (req, res) => {
    res.json(await store_1.store.getNavigation());
}));
router.post('/navigation', asyncHandler(async (req, res) => {
    await store_1.store.updateNavigation(req.body, getContext(req));
    res.json({ success: true });
}));
router.get('/navigation/standards', asyncHandler(async (req, res) => {
    const content = await store_1.store.getGlobalStandards();
    res.json(content);
}));
router.post('/navigation/standards', asyncHandler(async (req, res) => {
    await store_1.store.updateGlobalStandards(req.body.content, getContext(req));
    res.json({ success: true });
}));
// Modules
router.get('/modules/:id', asyncHandler(async (req, res) => {
    const module = await store_1.store.getModule(req.params.id);
    if (module) {
        res.json(module);
    }
    else {
        // Return default structure as requested by frontend logic
        res.json({ id: req.params.id, name: 'New Module', requirements: '', logicRules: [] });
    }
}));
router.post('/modules/:id', asyncHandler(async (req, res) => {
    const updated = await store_1.store.updateModule(req.params.id, req.body, getContext(req));
    res.json(updated);
}));
// Agents
router.get('/agents', asyncHandler(async (req, res) => {
    res.json(await store_1.store.getAgents());
}));
router.post('/agents', asyncHandler(async (req, res) => {
    try {
        const newAgent = await store_1.store.addAgent(req.body, getContext(req));
        res.json(newAgent);
    }
    catch (e) {
        throw new errors_1.AppError(500, 'AGENT_CREATE_FAILED', 'Failed to add agent', e);
    }
}));
router.post('/agents/:id', asyncHandler(async (req, res) => {
    const updatedAgent = await store_1.store.updateAgent(req.params.id, req.body, getContext(req));
    res.json(updatedAgent);
}));
router.delete('/agents/:id', asyncHandler(async (req, res) => {
    const success = await store_1.store.deleteAgent(req.params.id, getContext(req));
    if (success)
        res.json({ success: true });
    else
        throw new errors_1.AppError(500, 'AGENT_DELETE_FAILED', 'Failed to delete agent');
}));
// Agent Prompts
router.get('/agents/:id/prompts', asyncHandler(async (req, res) => {
    const prompts = await store_1.store.getAgentPrompts(req.params.id);
    res.json(prompts);
}));
router.post('/agents/:id/prompts', asyncHandler(async (req, res) => {
    const context = getContext(req);
    const userId = context.userId || 'system';
    const promptData = {
        ...req.body,
        createdBy: userId,
        updatedBy: userId
    };
    const newPrompt = await store_1.store.addAgentPrompt(req.params.id, promptData, context);
    res.json(newPrompt);
}));
router.post('/agents/:id/prompts/update', asyncHandler(async (req, res) => {
    const context = getContext(req);
    const userId = context.userId || 'system';
    const promptData = {
        ...req.body.prompt,
        updatedBy: userId
    };
    const updatedPrompt = await store_1.store.updateAgentPrompt(req.params.id, promptData, context);
    res.json(updatedPrompt);
}));
router.delete('/agents/:id/prompts/:promptId', asyncHandler(async (req, res) => {
    const success = await store_1.store.deleteAgentPrompt(req.params.id, req.params.promptId, getContext(req));
    if (success) {
        const prompts = await store_1.store.getAgentPrompts(req.params.id);
        res.json(prompts);
    }
    else {
        throw new errors_1.AppError(500, 'PROMPT_DELETE_FAILED', 'Failed to delete prompt');
    }
}));
// Logs
router.get('/logs/audit', asyncHandler(async (req, res) => {
    const page = req.query.page ? parseInt(String(req.query.page)) : undefined;
    const pageSize = req.query.pageSize ? parseInt(String(req.query.pageSize)) : undefined;
    const result = await store_1.store.getAuditLogs(page, pageSize);
    if (Array.isArray(result)) {
        return res.json({ items: result, total: result.length });
    }
    res.json(result);
}));
router.get('/logs/audit/paged', asyncHandler(async (req, res) => {
    const pageSize = req.query.pageSize ? parseInt(String(req.query.pageSize)) : 20;
    const cursor = req.query.cursor ? String(req.query.cursor) : undefined;
    const result = await store_1.store.getAuditLogsCursor(pageSize, cursor);
    res.json(result);
}));
router.post('/logs/audit', asyncHandler(async (req, res) => {
    const log = await store_1.store.addAuditLog(req.body);
    res.json(log);
}));
router.delete('/logs/audit', asyncHandler(async (req, res) => {
    const context = getContext(req);
    const userId = context.userId;
    if (!userId) {
        throw new errors_1.AppError(401, 'AUTH_REQUIRED', 'Not authenticated');
    }
    const actor = await store_1.store.getUserById(String(userId));
    if (!actor || actor.role !== 'Admin') {
        throw new errors_1.AppError(403, 'FORBIDDEN', 'Admin permission required');
    }
    const deleted = await store_1.store.clearAuditLogs();
    await store_1.store.addAuditLog({
        id: '',
        timestamp: '',
        ip: context.ip || 'unknown',
        userId: actor.id,
        userName: actor.name,
        action: 'Clear Audit Logs',
        module: 'System',
        details: `Cleared ${deleted} audit log entries`,
        status: 'success'
    });
    res.json({ success: true, data: { deleted } });
}));
router.get('/logs/system', asyncHandler(async (req, res) => {
    res.json(await store_1.store.getSystemErrors());
}));
router.delete('/logs/system', asyncHandler(async (req, res) => {
    const context = getContext(req);
    const userId = context.userId;
    if (!userId) {
        throw new errors_1.AppError(401, 'AUTH_REQUIRED', 'Not authenticated');
    }
    const actor = await store_1.store.getUserById(String(userId));
    if (!actor || actor.role !== 'Admin') {
        throw new errors_1.AppError(403, 'FORBIDDEN', 'Admin permission required');
    }
    const deleted = await store_1.store.clearSystemErrors();
    await store_1.store.addAuditLog({
        id: '',
        timestamp: '',
        ip: context.ip || 'unknown',
        userId: actor.id,
        userName: actor.name,
        action: 'Clear System Errors',
        module: 'System',
        details: `Cleared ${deleted} system error entries`,
        status: 'success'
    });
    res.json({ success: true, data: { deleted } });
}));
router.get('/comments', asyncHandler(async (req, res) => {
    const moduleId = req.query.moduleId ? String(req.query.moduleId) : '';
    if (!moduleId)
        throw new errors_1.AppError(400, 'MODULE_REQUIRED', 'moduleId is required');
    const pageSize = req.query.pageSize ? parseInt(String(req.query.pageSize)) : 20;
    const cursor = req.query.cursor ? String(req.query.cursor) : undefined;
    const result = await store_1.store.getCommentsCursor(moduleId, pageSize, cursor);
    res.json({ success: true, data: result });
}));
router.post('/comments', asyncHandler(async (req, res) => {
    const context = getContext(req);
    const userId = context.userId;
    const userName = context.userName;
    if (!userId || !userName)
        throw new errors_1.AppError(401, 'AUTH_REQUIRED', 'Not authenticated');
    const moduleId = String(req.body?.moduleId || '');
    const moduleName = String(req.body?.moduleName || '');
    const content = String(req.body?.content || '');
    const userAvatar = String(req.body?.userAvatar || '');
    if (!moduleId)
        throw new errors_1.AppError(400, 'MODULE_REQUIRED', 'moduleId is required');
    if (!content.trim())
        throw new errors_1.AppError(400, 'CONTENT_REQUIRED', 'content is required');
    const comment = await store_1.store.addComment(moduleId, moduleName, content, { userId, userName, userAvatar }, context);
    res.json({ success: true, data: comment });
}));
router.get('/biz-req', asyncHandler(async (req, res) => {
    const moduleId = req.query.moduleId ? String(req.query.moduleId) : '';
    if (!moduleId)
        throw new errors_1.AppError(400, 'MODULE_REQUIRED', 'moduleId is required');
    const pageSize = req.query.pageSize ? parseInt(String(req.query.pageSize)) : 20;
    const cursor = req.query.cursor ? String(req.query.cursor) : undefined;
    const q = req.query.q ? String(req.query.q) : undefined;
    const tags = req.query.tags ? String(req.query.tags).split(',').map(s => s.trim()).filter(Boolean) : undefined;
    const status = req.query.status ? String(req.query.status) : undefined;
    const result = await store_1.store.getBusinessRequirementsCursor(moduleId, pageSize, cursor, { q, tags, status });
    res.json({ success: true, data: result });
}));
router.post('/biz-req', asyncHandler(async (req, res) => {
    const context = getContext(req);
    const userId = context.userId;
    const userName = context.userName;
    if (!userId || !userName)
        throw new errors_1.AppError(401, 'AUTH_REQUIRED', 'Not authenticated');
    const moduleId = String(req.body?.moduleId || '');
    const title = String(req.body?.title || '');
    const content = String(req.body?.content || '');
    const tags = Array.isArray(req.body?.tags) ? req.body.tags.map((t) => String(t)) : [];
    const priority = req.body?.priority != null ? String(req.body.priority) : 'medium';
    const proposerName = String(req.body?.proposerName || '').trim();
    const userAvatar = String(req.body?.userAvatar || '');
    if (!moduleId)
        throw new errors_1.AppError(400, 'MODULE_REQUIRED', 'moduleId is required');
    if (!title.trim())
        throw new errors_1.AppError(400, 'TITLE_REQUIRED', 'title is required');
    if (!['low', 'medium', 'high', 'urgent'].includes(priority))
        throw new errors_1.AppError(400, 'PRIORITY_INVALID', 'priority must be low/medium/high/urgent');
    const created = await store_1.store.addBusinessRequirement(moduleId, title.trim(), content, tags, priority, proposerName || userName, { userId, userName, userAvatar }, context);
    res.json({ success: true, data: created });
}));
router.get('/biz-req/:id', asyncHandler(async (req, res) => {
    const id = String(req.params.id || '');
    if (!id)
        throw new errors_1.AppError(400, 'ID_REQUIRED', 'id is required');
    const item = await store_1.store.getBusinessRequirement(id);
    if (!item)
        throw new errors_1.AppError(404, 'NOT_FOUND', 'Not found');
    res.json({ success: true, data: item });
}));
router.get('/biz-req/:id/comments', asyncHandler(async (req, res) => {
    const id = String(req.params.id || '');
    if (!id)
        throw new errors_1.AppError(400, 'ID_REQUIRED', 'id is required');
    const pageSize = req.query.pageSize ? parseInt(String(req.query.pageSize)) : 30;
    const cursor = req.query.cursor ? String(req.query.cursor) : undefined;
    const result = await store_1.store.getBusinessRequirementCommentsCursor(id, pageSize, cursor);
    res.json({ success: true, data: result });
}));
router.post('/biz-req/:id/comments', asyncHandler(async (req, res) => {
    const context = getContext(req);
    const userId = context.userId;
    const userName = context.userName;
    if (!userId || !userName)
        throw new errors_1.AppError(401, 'AUTH_REQUIRED', 'Not authenticated');
    const requirementId = String(req.params.id || '');
    const content = String(req.body?.content || '');
    const parentId = req.body?.parentId != null ? String(req.body.parentId) : null;
    const userAvatar = String(req.body?.userAvatar || '');
    if (!requirementId)
        throw new errors_1.AppError(400, 'ID_REQUIRED', 'id is required');
    if (!content.trim())
        throw new errors_1.AppError(400, 'CONTENT_REQUIRED', 'content is required');
    const created = await store_1.store.addBusinessRequirementComment(requirementId, content, { userId, userName, userAvatar }, parentId, context);
    res.json({ success: true, data: created });
}));
router.get('/ai-chat/messages', asyncHandler(async (req, res) => {
    const context = getContext(req);
    const moduleId = req.query.moduleId ? String(req.query.moduleId) : '';
    if (!moduleId)
        throw new errors_1.AppError(400, 'MODULE_REQUIRED', 'moduleId is required');
    const pageSize = req.query.pageSize ? parseInt(String(req.query.pageSize)) : 20;
    const cursor = req.query.cursor ? String(req.query.cursor) : undefined;
    const result = await store_1.store.getAIChatMessagesCursor(moduleId, pageSize, cursor);
    const userId = context.userId;
    if (userId && result.items && result.items.length > 0) {
        const ids = result.items.map((m) => String(m.id));
        const map = await store_1.store.getAIChatMessageFeedbackMap(String(userId), ids, moduleId);
        result.items = result.items.map((m) => {
            if (String(m.role) !== 'model')
                return m;
            const fb = map[String(m.id)];
            return { ...m, favorite: !!fb?.favorite, reaction: fb?.reaction ?? null };
        });
    }
    else if (result.items && result.items.length > 0) {
        result.items = result.items.map((m) => (String(m.role) === 'model' ? { ...m, favorite: false, reaction: null } : m));
    }
    res.json({ success: true, data: result });
}));
router.post('/ai-chat/messages', asyncHandler(async (req, res) => {
    const context = getContext(req);
    const userId = context.userId;
    const userName = context.userName;
    if (!userId || !userName)
        throw new errors_1.AppError(401, 'AUTH_REQUIRED', 'Not authenticated');
    const moduleId = String(req.body?.moduleId || '');
    const role = String(req.body?.role || '');
    const content = String(req.body?.content || '');
    const agentId = String(req.body?.agentId || '');
    const promptLabel = req.body?.promptLabel != null ? String(req.body?.promptLabel) : undefined;
    const actorId = String(req.body?.actorId || '');
    const actorName = String(req.body?.actorName || '');
    const actorAvatar = String(req.body?.actorAvatar || '');
    if (!moduleId)
        throw new errors_1.AppError(400, 'MODULE_REQUIRED', 'moduleId is required');
    if (!content.trim())
        throw new errors_1.AppError(400, 'CONTENT_REQUIRED', 'content is required');
    if (role !== 'user' && role !== 'model')
        throw new errors_1.AppError(400, 'ROLE_INVALID', 'role must be user or model');
    if (!agentId)
        throw new errors_1.AppError(400, 'AGENT_REQUIRED', 'agentId is required');
    const actor = role === 'user'
        ? { actorId: userId, actorName: userName, actorAvatar: String(req.body?.userAvatar || '') }
        : { actorId: actorId || 'model', actorName: actorName || 'AI', actorAvatar };
    const msg = await store_1.store.addAIChatMessage(moduleId, agentId, promptLabel, role, content, actor, context);
    res.json({ success: true, data: msg });
}));
router.delete('/ai-chat/messages/:id', asyncHandler(async (req, res) => {
    const context = getContext(req);
    const userId = context.userId;
    const userName = context.userName;
    if (!userId || !userName)
        throw new errors_1.AppError(401, 'AUTH_REQUIRED', 'Not authenticated');
    const id = String(req.params.id || '');
    if (!id)
        throw new errors_1.AppError(400, 'ID_REQUIRED', 'id is required');
    const result = await store_1.store.deleteAIChatMessagePair(id, context);
    res.json({ success: true, data: result });
}));
router.put('/ai-chat/messages/:id/feedback', asyncHandler(async (req, res) => {
    const context = getContext(req);
    const userId = context.userId;
    const userName = context.userName;
    if (!userId || !userName)
        throw new errors_1.AppError(401, 'AUTH_REQUIRED', 'Not authenticated');
    const id = String(req.params.id || '');
    if (!id)
        throw new errors_1.AppError(400, 'ID_REQUIRED', 'id is required');
    const favorite = req.body?.favorite;
    const reaction = req.body?.reaction;
    if (favorite !== undefined && typeof favorite !== 'boolean')
        throw new errors_1.AppError(400, 'FAVORITE_INVALID', 'favorite must be boolean');
    if (reaction !== undefined && reaction !== null && reaction !== 'like' && reaction !== 'dislike')
        throw new errors_1.AppError(400, 'REACTION_INVALID', 'reaction must be like/dislike/null');
    const result = await store_1.store.setAIChatMessageFeedback(id, String(userId), { favorite, reaction }, context);
    res.json({ success: true, data: result });
}));
// Integrations
router.get('/integrations', asyncHandler(async (req, res) => {
    res.json(await store_1.store.getIntegrations());
}));
router.put('/integrations/:key', asyncHandler(async (req, res) => {
    const updated = await store_1.store.updateIntegration(req.params.key, req.body, getContext(req));
    if (updated)
        res.json(updated);
    else
        throw new errors_1.AppError(500, 'INTEGRATION_UPDATE_FAILED', 'Failed to update integration');
}));
router.post('/integrations/:key/toggle', asyncHandler(async (req, res) => {
    const { enabled } = req.body;
    const success = await store_1.store.toggleIntegration(req.params.key, enabled, getContext(req));
    if (success)
        res.json({ success: true });
    else
        throw new errors_1.AppError(500, 'INTEGRATION_TOGGLE_FAILED', 'Failed to toggle integration');
}));
// Database Schema Query
router.get('/database/schema', asyncHandler(async (req, res) => {
    const integrations = await store_1.store.getIntegrations();
    const dbConfig = integrations.find(i => i.key === 'db_global');
    if (!dbConfig || !dbConfig.enabled) {
        throw new errors_1.AppError(400, 'DB_INTEGRATION_DISABLED', 'Database integration is disabled or not configured');
    }
    if (dbConfig.config.type === 'mysql') {
        const required = ['host', 'port', 'username', 'password', 'database'];
        const missing = required.filter(k => !dbConfig.config[k]);
        if (missing.length > 0) {
            throw new errors_1.AppError(400, 'DB_CONFIG_INCOMPLETE', 'Database config incomplete', { missing });
        }
    }
    try {
        if (!dbConfig.config.password && dbConfig.config.type === 'supabase' && process.env.SUPABASE_URL) {
            try {
                const url = new URL(process.env.SUPABASE_URL);
                if (url.password) {
                    dbConfig.config.password = url.password;
                    if (!dbConfig.config.host)
                        dbConfig.config.host = url.hostname;
                    if (!dbConfig.config.username)
                        dbConfig.config.username = url.username;
                    if (!dbConfig.config.database)
                        dbConfig.config.database = url.pathname.substring(1);
                }
            }
            catch (e) {
                // Ignore
            }
            if (!dbConfig.config.password) {
                throw new errors_1.AppError(400, 'DB_PASSWORD_MISSING', 'Please enter Database Password');
            }
        }
        const schema = await dbSchema_1.DbSchemaService.fetchSchema(dbConfig.config);
        res.json({ tables: schema });
    }
    catch (e) {
        if (e instanceof errors_1.AppError)
            throw e;
        throw new errors_1.AppError(500, 'DB_SCHEMA_FETCH_FAILED', 'Failed to fetch database schema', e.message);
    }
}));
// WeChat Work test send
router.post('/wechat/test-send', asyncHandler(async (req, res) => {
    const { corpId, secret, agentId, content, toUser } = req.body || {};
    if (!corpId || !secret || !agentId || !content) {
        throw new errors_1.AppError(400, 'INVALID_REQUEST', 'Missing corpId/secret/agentId/content');
    }
    const tokenUrl = new URL('https://qyapi.weixin.qq.com/cgi-bin/gettoken');
    tokenUrl.searchParams.set('corpid', String(corpId));
    tokenUrl.searchParams.set('corpsecret', String(secret));
    try {
        const tokenResp = await fetch(tokenUrl.toString(), { method: 'GET' });
        const tokenData = await tokenResp.json();
        if (!tokenResp.ok || (tokenData && tokenData.errcode)) {
            // Log Error
            await store_1.store.addSystemError({
                userId: req.headers['x-user-id'],
                userName: req.headers['x-user-name'],
                errorCode: String(tokenData?.errcode || tokenResp.status),
                errorMessage: String(tokenData?.errmsg || tokenResp.statusText),
                route: '/api/wechat/test-send',
                browser: String(req.headers['user-agent'] || ''),
                status: 'open'
            });
            const message = tokenData.errcode === 60020
                ? `IP地址未授权: 请将此服务器IP (${tokenData.errmsg.match(/from ip: ([\d\.]+)/)?.[1] || '未知'}) 添加到企业微信后台的可信IP白名单中`
                : 'Failed to get access_token';
            throw new errors_1.AppError(400, 'WECHAT_TOKEN_FAILED', message, {
                errcode: tokenData?.errcode,
                errmsg: tokenData?.errmsg || tokenResp.statusText
            });
        }
        const accessToken = tokenData.access_token;
        const sendUrl = new URL('https://qyapi.weixin.qq.com/cgi-bin/message/send');
        sendUrl.searchParams.set('access_token', String(accessToken));
        const payload = {
            touser: toUser || '@all',
            agentid: parseInt(String(agentId)),
            msgtype: 'text',
            text: { content: String(content) },
            safe: 0
        };
        const sendResp = await fetch(sendUrl.toString(), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const sendData = await sendResp.json();
        if (!sendResp.ok || (sendData && sendData.errcode)) {
            await store_1.store.addSystemError({
                userId: req.headers['x-user-id'],
                userName: req.headers['x-user-name'],
                errorCode: String(sendData?.errcode || sendResp.status),
                errorMessage: String(sendData?.errmsg || sendResp.statusText),
                route: '/api/wechat/test-send',
                browser: String(req.headers['user-agent'] || ''),
                status: 'open'
            });
            throw new errors_1.AppError(400, 'WECHAT_SEND_FAILED', 'Send failed', {
                errcode: sendData?.errcode,
                errmsg: sendData?.errmsg || sendResp.statusText
            });
        }
        res.json({ success: true });
    }
    catch (e) {
        if (e instanceof errors_1.AppError)
            throw e;
        throw new errors_1.AppError(500, 'WECHAT_EXCEPTION', 'WeChat send error', e.message);
    }
}));
// Database Table Data
router.get('/database/table/:name/data', asyncHandler(async (req, res) => {
    const integrations = await store_1.store.getIntegrations();
    const dbConfig = integrations.find(i => i.key === 'db_global');
    if (!dbConfig || !dbConfig.enabled) {
        throw new errors_1.AppError(400, 'DB_INTEGRATION_DISABLED', 'Database integration is disabled or not configured');
    }
    const tableName = String(req.params.name || '');
    const page = req.query.page ? parseInt(String(req.query.page)) : 1;
    const pageSize = req.query.pageSize ? parseInt(String(req.query.pageSize)) : 20;
    try {
        const result = await dbSchema_1.DbSchemaService.fetchTableData(dbConfig.config, tableName, page, pageSize);
        res.json(result);
    }
    catch (e) {
        throw new errors_1.AppError(500, 'DB_DATA_FETCH_FAILED', 'Failed to fetch table data', e.message);
    }
}));
// Email Test
router.post('/email/test-send', asyncHandler(async (req, res) => {
    const { host, port, user, pass, senderName, to, subject, text } = req.body;
    if (!host || !port || !user || !pass || !to || !subject || !text) {
        throw new errors_1.AppError(400, 'INVALID_REQUEST', 'Missing required fields');
    }
    const transporter = nodemailer_1.default.createTransport({
        host,
        port: Number(port),
        secure: Number(port) === 465,
        auth: {
            user,
            pass,
        },
    });
    try {
        const info = await transporter.sendMail({
            from: `"${senderName || user}" <${user}>`,
            to,
            subject,
            text,
        });
        res.json({ success: true, messageId: info.messageId });
    }
    catch (error) {
        throw new errors_1.AppError(500, 'EMAIL_SEND_FAILED', 'Failed to send email', error.message);
    }
}));
exports.default = router;
