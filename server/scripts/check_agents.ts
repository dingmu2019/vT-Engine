
import { store } from '../src/data/store';

async function run() {
    console.log('Checking agents in DB...');
    try {
        const agents = await store.getAgents();
        console.log(`Found ${agents.length} agents:`);
        agents.forEach(a => {
            console.log(`- [${a.id}] ${a.name} (Status: ${a.status})`);
        });
        
        const opt = agents.find(a => a.id === 'opt_expert');
        if (opt) {
            console.log('\nFOUND opt_expert:', opt);
        } else {
            console.log('\nNOT FOUND opt_expert');
        }
    } catch (err) {
        console.error('Error:', err);
    }
    process.exit(0);
}

run();
