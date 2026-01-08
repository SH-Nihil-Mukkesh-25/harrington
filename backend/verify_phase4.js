const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';
const AUTO_URL = 'http://localhost:5000/api/v3';

// Helpers
const log = (msg) => console.log(`[TEST] ${msg}`);
const sleep = (ms) => new Promise(res => setTimeout(res, ms));

async function setup() {
    log('Resetting System...');
    await axios.post(`${BASE_URL}/reset`);

    // Create Route: Chennai -> Trichy -> Madurai
    await axios.post(`${BASE_URL}/routes`, { routeID: 'R-SOUTH', stops: 'Chennai (Warehouse), Trichy, Madurai', capacityLimit: 1000 });

    // Create Truck on this route
    await axios.post(`${BASE_URL}/trucks`, { truckID: 'T-TN-EXP', routeID: 'R-SOUTH', maxCapacity: 100 });
}

async function testRoadClosure() {
    log('--- Testing Road Closure (Resiliency) ---');
    // Close road 'Chennai (Warehouse)' to 'Trichy'
    // T-TN-EXP uses this segment. Should be detected.

    const payload = {
        from: 'Chennai (Warehouse)',
        to: 'Trichy',
        isClosed: true
    };

    try {
        const res = await axios.post(`${AUTO_URL}/admin/road-status`, payload);
        const data = res.data;

        log(`Road Update: ${data.roadUpdate.status}`);
        const affected = data.impactAnalysis.find(t => t.truckID === 'T-TN-EXP');

        if (affected && affected.impact.includes('CRITICAL')) {
            log(`✅ PASS: Detected affected truck ${affected.truckID}. Action: ${affected.proposedAction}`);
        } else {
            log('❌ FAIL: Did not detect affected truck.');
            console.log(JSON.stringify(data, null, 2));
        }

        // Re-open road for cleanup
        await axios.post(`${AUTO_URL}/admin/road-status`, { ...payload, isClosed: false });

    } catch (err) {
        log('❌ FAIL: API Error ' + err.message);
        if (err.response) console.log(err.response.data);
    }
}

async function test3PLSecurity() {
    log('--- Testing 3PL API Security ---');

    // 1. Without Key
    try {
        await axios.post(`${AUTO_URL}/external/tender`);
        log('❌ FAIL: Accepted request without key.');
    } catch (err) {
        if (err.response && err.response.status === 403) {
            log('✅ PASS: Rejected request without key (403).');
        } else {
            log(`❌ FAIL: Unexpected error code ${err.response ? err.response.status : err.message}`);
        }
    }

    // 2. With Key
    // Add an unassigned parcel first
    await axios.post(`${BASE_URL}/parcels`, { parcelID: 'P-EXT', destination: 'Chicago', weight: 50 });

    try {
        const res = await axios.post(`${AUTO_URL}/external/tender`, {}, {
            headers: { 'X-API-KEY': 'TMMR-PARTNER-8821' }
        });

        if (res.data.manifestId && res.data.parcels.some(p => p.id === 'P-EXT')) {
            log('✅ PASS: Authorized request returned manifest.');
        } else {
            log('❌ FAIL: Auth request failed or empty.');
            console.log(res.data);
        }
    } catch (err) {
        log('❌ FAIL: Auth request error ' + err.message);
    }
}

async function run() {
    try {
        await setup();
        await testRoadClosure();
        await test3PLSecurity();
    } catch (err) {
        log('CRASH: ' + err.message);
    }
}

run();
