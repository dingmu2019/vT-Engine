
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import apiRoutes from './routes';
import { store } from './data/store';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.set('trust proxy', true);

app.use(cors());
app.use(express.json());

// API Routes
app.use('/api', apiRoutes);

// Direct endpoints (ensure reachable even if router order changes)
app.get('/api/logs/audit/paged', async (req, res) => {
  const pageSize = req.query.pageSize ? parseInt(String(req.query.pageSize)) : 20;
  const cursor = req.query.cursor ? String(req.query.cursor) : undefined;
  try {
    const result = await store.getAuditLogsCursor(pageSize, cursor);
    res.json(result);
  } catch (e: any) {
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

import { AppError } from './routes';

// Global Error Handler
// This catches all unhandled errors (including sync/async) that are passed to next()
app.use(async (err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('Global Error Handler:', err);

    // Log to Database
    try {
        // Try to extract user info if available (e.g. from auth middleware)
        const userId = (req.headers['x-user-id'] as string) || (req.body?.userId);
        const userName = (req.headers['x-user-name'] as string);

        await store.addSystemError({
            userId: userId,
            userName: userName,
            errorCode: String(err.code || err.statusCode || '500'),
            errorMessage: err.message || String(err),
            stackTrace: err.stack,
            route: req.originalUrl || req.url,
            browser: req.headers['user-agent'] || 'Unknown',
            status: 'open'
        });
    } catch (dbError) {
        console.error('Failed to log error to database:', dbError);
    }

    // Standardized JSON Response
    const statusCode = err instanceof AppError ? err.statusCode : (err.status || 500);
    const errorCode = err instanceof AppError ? err.code : 'INTERNAL_SERVER_ERROR';
    
    res.status(statusCode).json({ 
        success: false,
        code: errorCode,
        message: err.message || 'Internal Server Error',
        details: (process.env.NODE_ENV === 'development' || err instanceof AppError) ? err.details : undefined
    });
});

// Force reseed endpoint (dev only)
app.post('/api/dev/reseed-nav', async (req, res) => {
    await store.forceReseedNavigation();
    res.json({ success: true });
});

// Export the Express API
export default app;

// Only start the server if running directly (not imported)
// In CommonJS (ts-node default), require.main === module works.
// In ESM, import.meta.url === pathToFileURL(process.argv[1]).href
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    // Removed forceReseedNavigation to persist DB state
    // store.forceReseedNavigation().then(() => console.log('Navigation Tree Reseeded per user request'));
  });
}
