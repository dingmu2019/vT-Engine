
import { supabase } from '../src/lib/supabase';

async function run() {
    console.log('Checking AI Chat Messages for Optimization Agent...');
    
    const MODULE_ID = 'system_optimization_agent';

    try {
        const { data, error, count } = await supabase
            .from('ai_chat_messages')
            .select('*', { count: 'exact' })
            .eq('module_key', MODULE_ID);

        if (error) {
            console.error('DB Error:', error);
        } else {
            console.log(`Found ${count} messages for module '${MODULE_ID}'`);
            if (data && data.length > 0) {
                console.log('Last 3 messages:');
                data.slice(-3).forEach(m => {
                    console.log(`[${m.created_at}] ${m.role}: ${m.content.substring(0, 50)}... (Agent: ${m.agent_id})`);
                });
            } else {
                console.log('No messages found. Trying to list ALL messages to check module_keys...');
                const { data: all } = await supabase.from('ai_chat_messages').select('module_key').limit(20);
                console.log('Sample module_keys in DB:', [...new Set(all?.map(m => m.module_key))]);
            }
        }

    } catch (err: any) {
        console.error('Failed:', err.message);
    }
    process.exit(0);
}

run();
