
import { supabase } from '../src/lib/supabase';

const newIntegrations = [
    {
        key: 'feishu_global',
        name: 'Feishu / Lark',
        type: 'notification',
        config: { appId: "", appSecret: "", webhookUrl: "" },
        enabled: false
    },
    {
        key: 'slack_global',
        name: 'Slack',
        type: 'notification',
        config: { botToken: "", channelId: "", webhookUrl: "" },
        enabled: false
    }
];

async function seed() {
    console.log('Seeding new integrations...');
    
    // Check if table exists first by a simple fetch
    const { error: checkError } = await supabase.from('integrations').select('count').limit(1);
    
    if (checkError) {
        console.warn("Integrations table might not exist or connection failed. Skipping DB seed.");
        console.warn("Error:", checkError.message);
        return;
    }

    for (const item of newIntegrations) {
        // We use insert with onConflict to avoid overwriting existing config if user already set it manually
        // But here we use upsert with ignoreDuplicates behavior if possible?
        // Supabase upsert: { onConflict: 'key', ignoreDuplicates: true }
        
        const { error } = await supabase
            .from('integrations')
            .upsert(item, { onConflict: 'key', ignoreDuplicates: true }) 
            .select();
            
        if (error) {
            console.error(`Failed to seed ${item.key}:`, error.message);
        } else {
            console.log(`Seeded ${item.key} (if not existed)`);
        }
    }
    console.log('Seeding process completed.');
}

seed();
