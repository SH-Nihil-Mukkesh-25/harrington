// TMMR v3.0 Sentinel Engine - Optimization Proposer
const { parcels, trucks } = require('../data/store');
// In a real scenario, we'd import findCheapestPath but for V1 optimization 
// we focus on clustering and capacity first.
const { findCheapestPath } = require('./routingEngine');

/**
 * Audit Function: Generates optimization proposals without modifying data.
 * Logic:
 * 1. Find all unassigned parcels.
 * 2. Group by Destination.
 * 3. Find available trucks with matching capacity.
 * 4. Calculate potential cost savings (vs theoretical separate shipments).
 */
const generateProposals = () => {
    // 1. Scan Pending Parcels
    const pendingParcels = parcels.filter(p => !p.assignedTruckID);

    // 2. Spatial Clustering (Group by Destination)
    const clusters = {};
    pendingParcels.forEach(p => {
        const dest = p.destination;
        if (!clusters[dest]) clusters[dest] = { destination: dest, parcels: [], totalWeight: 0 };
        clusters[dest].parcels.push(p.parcelID);
        clusters[dest].totalWeight += (Number(p.weight) || 0);
    });

    // 3. Match with Trucks (Safe Check)
    const proposals = [];
    const availableTrucks = trucks; // Simplification: Check all trucks

    Object.values(clusters).forEach(cluster => {
        // Find best truck for this cluster
        const candidates = availableTrucks.filter(t => {
            // Check 1: Capacity
            // Simple check: Truck Max >= Cluster Weight (Assuming truck is empty for this proposal)
            // Real logic would be more complex (current load + new load)
            const currentTruckLoad = parcels
                .filter(p => p.assignedTruckID === t.truckID)
                .reduce((sum, p) => sum + (Number(p.weight) || 0), 0);

            return (currentTruckLoad + cluster.totalWeight) <= t.maxCapacity;
        });

        if (candidates.length > 0) {
            // Pick the first candidate for the proposal
            const truck = candidates[0];

            // Calculate Efficiency Score (Mock Cost)
            // Assume starting from a central hub to destination
            // Start node is assumed "Chennai (Warehouse)" for demo if not specified on truck
            const startNode = "Chennai (Warehouse)";
            const routeCost = findCheapestPath(startNode, cluster.destination);

            proposals.push({
                type: "CLUSTER_OPTIMIZATION",
                destination: cluster.destination,
                parcelCount: cluster.parcels.length,
                totalWeight: cluster.totalWeight,
                proposedTruck: truck.truckID,
                parcelIds: cluster.parcels,
                estimatedCost: routeCost.totalCost || "N/A",
                savings: "High ( Consolidated Shipment )",
                status: "READY_TO_OPTIMIZE"
            });
        } else {
            proposals.push({
                type: "UNFULFILLED_CLUSTER",
                destination: cluster.destination,
                parcelCount: cluster.parcels.length,
                reason: "No single truck has enough remaining capacity"
            });
        }
    });

    return {
        timestamp: new Date(),
        pendingParcelsCount: pendingParcels.length,
        proposals
    };
};

module.exports = { generateProposals };
