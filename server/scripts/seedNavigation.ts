
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { NAV_TREE } from '../src/data/initialData';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function seedNavigation() {
  console.log('Seeding navigation tree...');
  
  const { error } = await supabase.from('navigation').upsert({
    id: 'main_tree',
    tree: NAV_TREE,
    updated_at: new Date().toISOString()
  });

  if (error) {
    console.error('Error seeding navigation:', error);
  } else {
    console.log('Navigation tree successfully seeded to database!');
  }
}

seedNavigation();
