
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { NAV_TREE } from '../src/data/initialData';
import { NavNode } from '../src/types';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function seedNormalizedNavigation() {
  console.log('Seeding normalized navigation nodes (Integer IDs)...');
  
  // Clean existing nodes
  // We can't easily truncate due to foreign keys if any, but delete all is fine here.
  const { error: deleteError } = await supabase.from('navigation_nodes').delete().neq('id', 0);
  if (deleteError) {
      console.warn('Warning clearing nodes:', deleteError.message);
  }

  // Recursive insertion to handle parent_id dependency
  // Since we use auto-increment IDs, we must insert parent first, get its ID, then insert children.
  
  const insertNode = async (node: NavNode, parentId: number | null = null, index: number = 0) => {
    // 1. Insert current node
    const { data, error } = await supabase.from('navigation_nodes').insert({
        parent_id: parentId,
        key: node.id, // Semantic string ID
        label: node.label,
        label_zh: node.labelZh,
        type: node.type,
        status: node.status,
        icon: node.icon,
        sort_order: index,
        created_by: 'system',
        updated_by: 'system',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    }).select().single();

    if (error) {
        console.error(`Error inserting node ${node.label}:`, error);
        return;
    }

    const newId = data.id; // Auto-generated integer ID

    // 2. Insert children if any
    if (node.children && node.children.length > 0) {
        for (let i = 0; i < node.children.length; i++) {
            await insertNode(node.children[i], newId, i);
        }
    }
  };

  // Start with root nodes
  for (let i = 0; i < NAV_TREE.length; i++) {
      await insertNode(NAV_TREE[i], null, i);
  }

  console.log('Navigation tree successfully seeded!');
}

seedNormalizedNavigation();
