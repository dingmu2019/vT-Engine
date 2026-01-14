"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const routes_1 = __importDefault(require("./routes"));
const store_1 = require("./data/store");
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3001;
app.set('trust proxy', true);
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// API Routes
app.use('/api', routes_1.default);
// Direct endpoints (ensure reachable even if router order changes)
app.get('/api/logs/audit/paged', async (req, res) => {
    const pageSize = req.query.pageSize ? parseInt(String(req.query.pageSize)) : 20;
    const cursor = req.query.cursor ? String(req.query.cursor) : undefined;
    try {
        const result = await store_1.store.getAuditLogsCursor(pageSize, cursor);
        res.json(result);
    }
    catch (e) {
        res.status(500).json({ message: 'Failed to fetch audit logs', details: e.message });
    }
});
app.get('/health', (req, res) => {
    res.send('Server is running');
});
// JSON 404 Handler for unknown API routes
app.use('/api', (req, res) => {
    res.status(404).json({ message: 'API Route not found' });
});
const routes_2 = require("./routes");
// Global Error Handler
// This catches all unhandled errors (including sync/async) that are passed to next()
app.use(async (err, req, res, next) => {
    console.error('Global Error Handler:', err);
    // Log to Database
    try {
        // Try to extract user info if available (e.g. from auth middleware)
        const userId = req.headers['x-user-id'] || (req.body?.userId);
        const userName = req.headers['x-user-name'];
        await store_1.store.addSystemError({
            userId: userId,
            userName: userName,
            errorCode: String(err.code || err.statusCode || '500'),
            errorMessage: err.message || String(err),
            stackTrace: err.stack,
            route: req.originalUrl || req.url,
            browser: req.headers['user-agent'] || 'Unknown',
            status: 'open'
        });
    }
    catch (dbError) {
        console.error('Failed to log error to database:', dbError);
    }
    // Standardized JSON Response
    const statusCode = err instanceof routes_2.AppError ? err.statusCode : (err.status || 500);
    const errorCode = err instanceof routes_2.AppError ? err.code : 'INTERNAL_SERVER_ERROR';
    res.status(statusCode).json({
        success: false,
        code: errorCode,
        message: err.message || 'Internal Server Error',
        details: (process.env.NODE_ENV === 'development' || err instanceof routes_2.AppError) ? err.details : undefined
    });
});
// Force reseed endpoint (dev only)
app.post('/api/dev/reseed-nav', async (req, res) => {
    await store_1.store.forceReseedNavigation();
    res.json({ success: true });
});
// Export the Express API
exports.default = app;
// Only start the server if running directly (not imported)
// In CommonJS (ts-node default), require.main === module works.
// In ESM, import.meta.url === pathToFileURL(process.argv[1]).href
if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
        store_1.store.forceReseedNavigation().then(() => console.log('Navigation Tree Reseeded per user request'));
    });
}
