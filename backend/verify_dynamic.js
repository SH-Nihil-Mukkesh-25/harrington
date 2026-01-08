const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';
const AUTO_URL = 'http://localhost:5000/api/v3';

// Helpers
const log = (msg) => console.log(`[TEST] ${msg}`);
const sleep = (ms) => new Promise(res => setTimeout(res, ms));

async function setupAndVerify() {
    log('System Check (Skipping Reset to preserve Preloaded Data)...');
    // await axios.post(`${BASE_URL}/reset`);

    // Note: Reset clears everything including updated store.js in-memory cache?
    // Wait, the store.js is "require"d. The reset endpoint (routes/api.js) does:
    // routes.length = 0; trucks.length = 0;
    // THIS IS BAD for our persistent "Preloaded" store test if we rely on "store.js" 
    // but the array references are cleared.
    // However, since we restarted the server, the store is fresh.
    // BUT the reset endpoint CLEARS IT.

    // SO: We should NOT call reset if we want to test the preloaded trucks.
    // OR we re-create them.
    // Let's check api/trucks first.

    const trucksRes = await axios.get(`${BASE_URL}/trucks`);
    let trucks = trucksRes.data;
    log(`Trucks Count: ${trucks.length}`);

    // Find a free truck
    const freeTruck = trucks.find(t => t.routeID === null);
    if (!freeTruck) {
        log('❌ FAIL: No free trucks found. Did store.js update apply?');
        // console.log(trucks);
        return;
    }
    log(`Found Free Truck: ${freeTruck.truckID}`);

    // Create a Parcel to MADURAI
    // This packet effectively "defines" the route for the free truck.
    await axios.post(`${BASE_URL}/parcels`, { parcelID: 'P-DYN-01', destination: 'Madurai', weight: 50 });

    // Execute Batch
    log('Executing Optimization Batch...');
    const payload = {
        assignments: [
            { parcelID: 'P-DYN-01', truckID: freeTruck.truckID, priority: 'HIGH' }
        ]
    };

    try {
        const res = await axios.post(`${AUTO_URL}/execute-optimization`, payload);
        log(`Batch Result: Success=${res.data.results.successCount}`);

        // Verify Truck Status Update
        const updatedTrucksRes = await axios.get(`${BASE_URL}/trucks`);
        const updatedTruck = updatedTrucksRes.data.find(t => t.truckID === freeTruck.truckID);

        log(`Truck Route After: ${updatedTruck.routeID}`);

        if (updatedTruck.routeID && updatedTruck.routeID.includes('DYNAMIC')) {
            log('✅ PASS: Truck assigned Dynamic Route.');
        } else {
            log('❌ FAIL: Truck route not updated.');
        }

    } catch (err) {
        log('❌ FAIL: Execution Error ' + err.message);
        if (err.response) console.log(err.response.data);
    }
}

setupAndVerify();
