
import { Client } from 'pg';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Construct connection string if not present, or use DATABASE_URL
let connectionString = process.env.DATABASE_URL;

if (!connectionString && process.env.SUPABASE_URL) {
    // Try to construct from Supabase details if possible, but usually we need the direct connection string (port 5432)
    // Supabase URL is usually https (REST).
    // We need DB_HOST, DB_USER, etc.
    // Let's check if we have them.
    if (process.env.DB_HOST) {
        connectionString = `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`;
    }
}

if (!connectionString) {
    // Fallback for development if local
    console.warn('No DATABASE_URL or DB_* env vars found. Trying default local.');
    connectionString = 'postgresql://postgres:postgres@localhost:5432/tengine_db';
}

async function run() {
    const args = process.argv.slice(2);
    if (args.length < 1) {
        console.error('Usage: ts-node applyMigrationPg.ts <sql-file>');
        process.exit(1);
    }

    const client = new Client({ connectionString });
    
    try {
        await client.connect();
        const sql = fs.readFileSync(args[0], 'utf8');
        console.log(`Executing SQL from ${args[0]}...`);
        await client.query(sql);
        console.log('Success!');
    } catch (e) {
        console.error('Migration failed:', e);
        process.exit(1);
    } finally {
        await client.end();
    }
}

run();
