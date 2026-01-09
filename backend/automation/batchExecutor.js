// TMMR v3.0 Sentinel Engine - Atomic Batch Executor
const { parcels, trucks, workflows, alerts } = require('../data/store');

// --- Global Mutex (Module Level) ---
// In a single-threaded Node.js process, this variable acts as a lock
// preventing other requests from entering the critical section while a batch is processing.
let isProcessingBatch = false;

// --- Mutex Control Functions (Exported for use in /assignParcel) ---
const isBatchLocked = () => isProcessingBatch;
const acquireBatchLock = () => { isProcessingBatch = true; };
const releaseBatchLock = () => { isProcessingBatch = false; };

// Priority Map for sorting
const PRIORITY_MAP = {
    'HIGH': 3,
    'MEDIUM': 2,
    'LOW': 1
};

const generateID = () => Math.random().toString(36).substr(2, 9);
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Execute a batch of optimization assignments atomically.
 * @param {Array} assignments - List of { parcelID, truckID, priority }
 */
const executeBatch = async (assignments) => {
    // 1. Fail-Fast Mutex Check
    if (isProcessingBatch) {
        return {
            success: false,
            error: "System Busy: Another optimization batch is currently executing.",
            code: 409 // Conflict
        };
    }

    // Acquire Lock
    isProcessingBatch = true;
    const results = { successCount: 0, failureCount: 0, errors: [] };
    const batchId = generateID();

    try {


        // Simulate DB Transaction Start Latency (to prove Mutex blocks others)
        await sleep(200);

        // 2. Group by Truck (to perform atomic capacity checks per truck)
        const truckGroups = {};
        assignments.forEach(a => {
            if (!truckGroups[a.truckID]) truckGroups[a.truckID] = [];
            truckGroups[a.truckID].push(a);
        });

        // 3. Process Each Truck Group
        // Note: For true atomicity, we'd validate ALL before committing ANY.
        // But for this simulation, per-truck atomicity is sufficient as per requirements.
        for (const truckID of Object.keys(truckGroups)) {
            const group = truckGroups[truckID];

            // Priority Sort: High > Medium > Low
            group.sort((a, b) => {
                const pA = PRIORITY_MAP[a.priority?.toUpperCase()] || 1;
                const pB = PRIORITY_MAP[b.priority?.toUpperCase()] || 1;
                return pB - pA;
            });

            // --- ATOMIC GUARD BLOCK ---
            // Verify Truck Exists
            const truck = trucks.find(t => t.truckID === truckID);
            if (!truck) {
                results.failureCount += group.length;
                results.errors.push(`Truck ${truckID} not found. Skipped ${group.length} assignments.`);
                continue; // Skip this truck
            }

            // Verify Capacity (Current + Proposed Batch)
            const currentLoad = parcels
                .filter(p => p.assignedTruckID === truckID)
                .reduce((sum, p) => sum + (Number(p.weight) || 0), 0);

            let acceptedWeight = 0;
            const validAssignments = [];

            // Tentatively select parcels that fit
            for (const item of group) {
                const parcel = parcels.find(p => p.parcelID === item.parcelID);

                // Verification Checks
                if (!parcel) {
                    results.errors.push(`Parcel ${item.parcelID} not found.`);
                    continue;
                }
                if (parcel.assignedTruckID) {
                    results.errors.push(`Parcel ${item.parcelID} is already assigned.`);
                    continue; // Skip already assigned
                }

                const weight = Number(parcel.weight) || 0;

                // CHECK: Will this specific parcel overflow the truck?
                if (currentLoad + acceptedWeight + weight <= truck.maxCapacity) {
                    acceptedWeight += weight;
                    validAssignments.push(parcel);
                } else {
                    results.errors.push(`Capacity Limit Reached for Truck ${truckID}. Skipped Parcel ${item.parcelID} (Priority: ${item.priority || 'Low'}).`);
                    // Create SL-1 Alert for overflow during optimization
                    alerts.push({
                        alertID: generateID(),
                        severity: 'SL-2',
                        message: `Optimization Skipped: Truck ${truckID} full. Parcel ${item.parcelID} left behind.`,
                        truckID,
                        parcelID: item.parcelID,
                        timestamp: new Date()
                    });
                }
            }

            // COMMIT: Apply changes for this truck
            if (validAssignments.length > 0) {
                // Dynamic Route Assignment: If truck is free, assign it to the destination route
                if (!truck.routeID) {
                    // Simple logic: Create a dynamic route ID based on the cluster's destination
                    // In a real system, we'd find the best matching existing route or create a new one.
                    // Here we assume the first parcel's destination defines the route.
                    const dest = validAssignments[0].destination || "UNKNOWN";
                    const newRouteID = `R-DYNAMIC-${dest.toUpperCase().replace(/\s+/g, '-')}`;

                    truck.routeID = newRouteID;
                    truck.status = 'ACTIVE'; // Mark as active

                    // Ideally, we should also ensure this route exists in 'routes' array 
                    // to satisfy referential integrity for validExistence checks in legacy modules.
                    // We'll lazy-create it if missing.
                    const { routes } = require('../data/store');
                    if (!routes.find(r => r.routeID === newRouteID)) {
                        routes.push({
                            routeID: newRouteID,
                            stops: `Chennai (Warehouse), ${dest}`, // Simple point-to-point
                            capacityLimit: 10000,
                            status: 'DYNAMIC'
                        });
                    }
                }

                validAssignments.forEach(p => {
                    p.assignedTruckID = truckID;
                });
                results.successCount += validAssignments.length;

                // Log Workflow (Audit Trail)
                workflows.push({
                    workflowId: generateID(),
                    type: 'BATCH_ASSIGN',
                    source: 'AUTO_MULE', // Special Flag for Audit
                    input: { truckID, parcelCount: validAssignments.length },
                    status: 'COMPLETED',
                    startTime: new Date(),
                    endTime: new Date(),
                    steps: [{ stepName: 'AtomicCommit', status: 'SUCCESS', details: `Assigned ${validAssignments.length} parcels.` }]
                });
            } else {
                results.failureCount += group.length;
            }
        } // End Loop

    } catch (err) {
        console.error("Batch Execution Error:", err);
        return { success: false, error: err.message, code: 500 };
    } finally {
        // Release Lock
        isProcessingBatch = false;

    }

    return {
        success: true,
        batchId,
        results
    };
};

module.exports = { executeBatch, isBatchLocked, acquireBatchLock, releaseBatchLock };
