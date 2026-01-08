const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';
const AUTO_URL = 'http://localhost:5000/api/v3';

// Helpers
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
const log = (msg) => console.log(`[TEST] ${msg}`);

async function setup() {
    log('Resetting System...');
    await axios.post(`${BASE_URL}/reset`);

    log('Creating Test Data...');
    // Create Route
    await axios.post(`${BASE_URL}/routes`, { routeID: 'R-TEST', stops: 'A,B,C', capacityLimit: 1000 });

    // Create Truck (Small Capacity for Priority Test)
    await axios.post(`${BASE_URL}/trucks`, { truckID: 'T-PRIO', routeID: 'R-TEST', maxCapacity: 20 });

    // Create Parcels for Priority Test (High=15kg, Low=10kg) - Only High should fit
    await axios.post(`${BASE_URL}/parcels`, { parcelID: 'P-HIGH', destination: 'A', weight: 15 });
    await axios.post(`${BASE_URL}/parcels`, { parcelID: 'P-LOW', destination: 'A', weight: 10 });

    // Create Parcel for Race Condition
    await axios.post(`${BASE_URL}/parcels`, { parcelID: 'P-RACE', destination: 'A', weight: 5 });
}

async function testPriority() {
    log('--- Testing Priority Sorting ---');
    // Truck has 20 capacity. P-HIGH (15) + P-LOW (10) = 25. Only one fits.
    // We send payload with LOW first in array, but engine should pick HIGH first.

    const payload = {
        assignments: [
            { parcelID: 'P-LOW', truckID: 'T-PRIO', priority: 'LOW' },
            { parcelID: 'P-HIGH', truckID: 'T-PRIO', priority: 'HIGH' }
        ]
    };

    const res = await axios.post(`${AUTO_URL}/execute-optimization`, payload);
    const results = res.data.results;

    log(`Success: ${results.successCount}, Failures: ${results.failureCount}`);
    results.errors.forEach(e => log(`Error: ${e}`));

    // Check which one got assigned
    const parcels = await axios.get(`${BASE_URL}/parcels`);
    const pHigh = parcels.data.find(p => p.parcelID === 'P-HIGH');
    const pLow = parcels.data.find(p => p.parcelID === 'P-LOW');

    if (pHigh.assignedTruckID === 'T-PRIO' && !pLow.assignedTruckID) {
        log('✅ PASS: High priority assigned, Low skipped due to capacity.');
    } else {
        log('❌ FAIL: Priority logic failed.');
        console.log('High:', pHigh, 'Low:', pLow);
    }
}

async function testRaceCondition() {
    log('--- Testing Race Condition (Mutex) ---');
    // Send 5 concurrent requests to assign P-RACE. Only 1 can succeed (even theoretically if valid).
    // Mutex should return 409 for the overlapping ones.

    const payload = {
        assignments: [{ parcelID: 'P-RACE', truckID: 'T-PRIO', priority: 'MEDIUM' }]
    };

    const promises = [];
    for (let i = 0; i < 5; i++) {
        promises.push(
            axios.post(`${AUTO_URL}/execute-optimization`, payload)
                .catch(err => err.response)
        );
    }

    const responses = await Promise.all(promises);
    const statusCodes = responses.map(r => r.status);

    const successes = statusCodes.filter(c => c === 200).length;
    const conflicts = statusCodes.filter(c => c === 409).length;

    log(`Results: ${successes} OK, ${conflicts} Conflicts (409)`);

    if (successes === 1 && conflicts >= 1) {
        log('✅ PASS: Mutex prevented concurrent execution.');
    } else {
        log('❌ FAIL: Race condition checking invalid or mutex failed.');
        console.log(statusCodes);
    }
}

async function run() {
    try {
        await setup();
        await testPriority();
        await testRaceCondition();
    } catch (err) {
        log('CRASH: ' + err.message);
    }
}

run();
