import { MatchService } from './src/services/match';

async function testUpdate() {
    console.log("Testing update...");
    // Put a known clubId here
    // But since we just want to see if it throws an error or what error it gives
    const clubId = "b12bcade-fbfe-41dc-905a-5ba55ec9000a"; // Using a fake one or we need a real one
    const res = await MatchService.updateClub(clubId, { name: 'Test' });
    console.log("Result:", res);
}

testUpdate();
