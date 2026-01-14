
import { supabase } from '../src/lib/supabase';

async function run() {
    console.log('Checking navigation_nodes for system_optimization_agent...');
    const { data, error } = await supabase
        .from('navigation_nodes')
        .select('*')
        .eq('key', 'system_optimization_agent');
    
    if (error) {
        console.error('Error:', error);
    } else {
        if (data && data.length > 0) {
            console.log('Found:', data[0]);
        } else {
            console.log('NOT FOUND');
        }
    }
    process.exit(0);
}

run();
