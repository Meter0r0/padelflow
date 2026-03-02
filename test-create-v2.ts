import { ClientService } from './src/services/client';

async function test() {
    console.log("Testing club creation via ClientService...");
    const result = await ClientService.createClub('a4f26c61-082f-4257-bd02-1e0192fe3c0c', 'Test Club V2', '123 Test St', 15000);
        
    console.log("Result:", result);
}
test().catch(console.error);
