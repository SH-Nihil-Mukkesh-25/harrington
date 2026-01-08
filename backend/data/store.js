// TMMR v3.0 - In-Memory Data Store (Preloaded with Tamil Nadu Data)

const routes = [];

const trucks = [
    // Type 1: Small (500kg) - Free Roaming
    { truckID: 'T-SM-001', routeID: null, maxCapacity: 500, status: 'IDLE' },
    { truckID: 'T-SM-002', routeID: null, maxCapacity: 500, status: 'IDLE' },

    // Type 2: Medium (1500kg) - Free Roaming
    { truckID: 'T-MD-001', routeID: null, maxCapacity: 1500, status: 'IDLE' },
    { truckID: 'T-MD-002', routeID: null, maxCapacity: 1500, status: 'IDLE' },

    // Type 3: Large (5000kg) - Free Roaming
    { truckID: 'T-LG-001', routeID: null, maxCapacity: 5000, status: 'IDLE' },
    { truckID: 'T-LG-002', routeID: null, maxCapacity: 5000, status: 'IDLE' }
];

const parcels = [];
const alerts = [];
const workflows = [];

module.exports = {
    routes,
    trucks,
    parcels,
    alerts,
    workflows
};
