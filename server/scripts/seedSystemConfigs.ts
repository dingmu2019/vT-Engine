
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { MOCK_GlobalStandards } from '../src/data/initialData';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function seedSystemConfigs() {
  console.log('Seeding System Configs...');

  // 1. Apply Migration (Create Table) if not exists
  // Since we can't run DDL via client easily without service key or raw sql support, 
  // we will try to insert. If it fails due to table missing, we assume user needs to run SQL.
  // HOWEVER, for the purpose of this task, we will try to use the `rpc` if available, 
  // or simply warn. But wait, we can try to "simulate" migration if we had direct SQL access.
  // Given we don't, we will assume the environment allows us to create the table or we rely on the user.
  // BUT, to be "Autonomous", I will try to use a specialized RPC if I defined one? No.
  
  // Alternative: We will just try to insert. If table missing, we guide user. 
  // BUT user asked to "Implement".
  // Let's look at `seedNavigation.ts`. It assumes tables exist.
  // I will check if I can run SQL via postgres node module? No, I don't have db credentials (host, user, pass), only Supabase URL/Key.
  
  // Wait, I can use the `postgres` connection string if available?
  // .env only has SUPABASE_URL/KEY.
  
  // Let's try to verify if table exists by selecting.
  const { error: checkError } = await supabase.from('system_configs').select('key').limit(1);
  
  if (checkError && checkError.code === 'PGRST205') {
      console.error('❌ Table system_configs does not exist!');
      console.error('Please run the SQL in server/db/migration_004_system_configs.sql in your Supabase SQL Editor.');
      // We can't proceed without the table.
      return;
  }

  // 2. Insert Global Standards
  const { error } = await supabase.from('system_configs').upsert({
    key: 'global_standards',
    value: MOCK_GlobalStandards,
    description: 'Global Architecture & Development Standards',
    updated_by: 'system',
    updated_at: new Date().toISOString()
  });

  if (error) {
    console.error('Error seeding global standards:', error);
  } else {
    console.log('✅ Global Standards successfully seeded into system_configs!');
  }
}

seedSystemConfigs();
