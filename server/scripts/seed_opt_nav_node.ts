
import { supabase } from '../src/lib/supabase';

async function run() {
    console.log('Seeding Navigation Node for Optimization Agent...');
    
    const NODE = {
        key: 'system_optimization_agent',
        label: 'System Optimization',
        label_zh: '系统功能优化',
        description: 'System-level optimization agent context node.',
        type: 'module',
        status: 'ready', // or 'hidden' if supported, but let's use ready to ensure it works
        parent_id: null // Root level for now, or find a System folder
    };

    try {
        // Check if exists
        const { data: existing } = await supabase
            .from('navigation_nodes')
            .select('id')
            .eq('key', NODE.key)
            .single();

        if (existing) {
            console.log('Node already exists.');
        } else {
            const { error } = await supabase.from('navigation_nodes').insert(NODE);
            if (error) throw error;
            console.log('Node added successfully.');
        }

    } catch (err: any) {
        console.error('Failed:', err.message);
    }
    process.exit(0);
}

run();
