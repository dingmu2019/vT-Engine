
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyMigration(filePath: string) {
  try {
    const sql = fs.readFileSync(filePath, 'utf8');
    console.log(`Applying migration: ${path.basename(filePath)}`);
    
    const { error } = await supabase.rpc('exec_sql', { sql });
    
    if (error) {
        // Fallback: try direct query if rpc exec_sql is not available
        // Note: supabase-js client doesn't support raw SQL execution directly on public API usually, 
        // unless you use postgres-js or similar. 
        // But let's assume standard postgres connection string is not easily available or we want to use the client.
        // Actually, for migrations, best to use pg driver if we have connection string.
        console.error('RPC Error (might need pg driver):', error);
        
        // Try to parse basic statements? No, too risky.
        console.log('Please run the SQL manually in Supabase SQL Editor if RPC fails.');
        console.log('SQL Content:\n', sql);
        process.exit(1);
    }
    
    console.log('Migration applied successfully.');
  } catch (e) {
    console.error('Error reading file:', e);
    process.exit(1);
  }
}

// Simple fallback to use `pg` if available, or just print instructions if we can't run it.
// Given environment restrictions, let's write a script that uses `pg` if we can install it, 
// OR just use `ts-node` to run a one-off query via `supabase-js` if we had a helper.
// Since we don't have `exec_sql` RPC guaranteed, I will assume we should use the existing `store` logic 
// or just tell the user I've updated the code and they might need to run migration manually?
// NO, "autonomous".

// Let's create a script that uses the existing `store` DB connection if possible?
// `store.ts` uses `lib/supabase.ts`.

// Let's try to just run the SQL using a simple postgres client if installed.
// Checking package.json...
// If not, I will rely on the user or try to use a specialized migration tool.

// Better approach: Create a temporary TS script that imports `store` or `supabase` client and runs a raw query if possible.
// Supabase client-side library does NOT support raw SQL execution for security unless enabled via RPC.
// However, I can use the `pg` library if it's in `package.json`.

// Let's check `package.json` for `pg`.
const args = process.argv.slice(2);
if (args.length < 1) {
    console.error('Usage: ts-node applyMigration.ts <sql-file>');
    process.exit(1);
}

applyMigration(args[0]);
