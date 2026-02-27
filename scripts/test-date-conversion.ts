
// Mocking minimal Supabase just to avoid crashes if imported, 
// but we will test the pure functions exposed or we will have to mock the service entirely.
// Since AIService imports supabase, we can't easily unit test it without proper mocks.
// However, the critical logic we changed is date handling.
// Let's create a small script that copies the logic of extractDateFromMessage and executeAction-like parsing
// to verify it behaves as expected.

function extractDateFromMessage(text: string): string | undefined {
    const lowerText = text.toLowerCase();

    // Helper to get Argentina Date Object
    const getArgentinaDateObj = () => {
        const now = new Date();
        // Convert current UTC time to Argentina time components
        const options: Intl.DateTimeFormatOptions = { timeZone: 'America/Argentina/Buenos_Aires', year: 'numeric', month: 'numeric', day: 'numeric' };
        const formatter = new Intl.DateTimeFormat('en-US', options);
        const parts = formatter.formatToParts(now);
        const year = parseInt(parts.find(p => p.type === 'year')!.value);
        const month = parseInt(parts.find(p => p.type === 'month')!.value) - 1; // 0-indexed
        const day = parseInt(parts.find(p => p.type === 'day')!.value);
        return new Date(year, month, day);
    };

    const nowArgentina = getArgentinaDateObj();

    // Helper string format YYYY-MM-DD
    const formatDate = (date: Date) => {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    }

    if (lowerText.includes('hoy')) return formatDate(nowArgentina);

    if (lowerText.includes('mañana')) {
        const tomorrow = new Date(nowArgentina);
        tomorrow.setDate(nowArgentina.getDate() + 1);
        return formatDate(tomorrow);
    }

    // Regex for DD/MM
    const dateMatch = text.match(/(\d{1,2})\/(\d{1,2})/);
    if (dateMatch) {
        const day = parseInt(dateMatch[1]);
        const month = parseInt(dateMatch[2]) - 1;
        const targetDate = new Date(nowArgentina.getFullYear(), month, day);

        const sixMonthsAgo = new Date(nowArgentina);
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

        if (targetDate < sixMonthsAgo) {
            targetDate.setFullYear(nowArgentina.getFullYear() + 1);
        }
        return formatDate(targetDate);
    }

    return undefined;
}

function processBookingTime(dateTimeStr: string): string {
    let targetDateTime = dateTimeStr;

    if (!targetDateTime.includes('T')) {
        targetDateTime = targetDateTime.replace(' ', 'T');
    }
    if (targetDateTime.split(':').length === 2) {
        targetDateTime += ':00';
    }

    if (!targetDateTime.endsWith('Z') && !targetDateTime.match(/[+-]\d{2}:?\d{2}$/)) {
        targetDateTime += '-03:00';
    }
    return targetDateTime;
}

console.log('--- TEST 1: extractDateFromMessage ---');
console.log(`Current Time (System): ${new Date().toISOString()}`);
// We can't easily change system time for the test, but we can see what "hoy" returns relative to now.
console.log(`"hoy": ${extractDateFromMessage("Quiero reservar hoy")}`);
console.log(`"mañana": ${extractDateFromMessage("Quiero para mañana")}`);
console.log(`"18/02": ${extractDateFromMessage("Reservar el 18/02")}`);

console.log('\n--- TEST 2: processBookingTime (Timezone Appending) ---');
const input1 = "2026-02-18T22:00:00";
const output1 = processBookingTime(input1);
console.log(`Input: "${input1}" -> Output: "${output1}"`);
if (output1.endsWith("-03:00")) console.log("PASS: Appended -03:00");
else console.log("FAIL: Did not append offset");

const input2 = "2026-02-18 22:00";
const output2 = processBookingTime(input2);
console.log(`Input: "${input2}" -> Output: "${output2}"`);
if (output2 === "2026-02-18T22:00:00-03:00") console.log("PASS: Formatted and appended offset");
else console.log("FAIL: Formatting error");

const input3 = "2026-02-18T22:00:00Z";
const output3 = processBookingTime(input3);
console.log(`Input: "${input3}" -> Output: "${output3}"`);
if (output3 === input3) console.log("PASS: Respected existing Z");
else console.log("FAIL: Modified existing timezone");
