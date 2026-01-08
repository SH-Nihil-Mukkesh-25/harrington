const express = require('express');
const router = express.Router();
const TN_GRAPH = require('../data/tnGraph');
const { dijkstra, findClusters, bestFitTruck, calculateSavings } = require('../utils/dijkstra');

// Mock Parcel Data for the Audit
const MOCK_PARCELS = [
    { id: 'P-101', destination: 'Madurai', weight: 400, priority: 'standard' },
    { id: 'P-102', destination: 'Madurai', weight: 350, priority: 'standard' },
    { id: 'P-103', destination: 'Madurai', weight: 500, priority: 'express' },
    { id: 'P-104', destination: 'Tuticorin', weight: 600, priority: 'standard' },
    { id: 'P-105', destination: 'Tuticorin', weight: 400, priority: 'standard' },
    { id: 'P-106', destination: 'Trichy', weight: 200, priority: 'standard' },
    { id: 'P-107', destination: 'Coimbatore', weight: 1200, priority: 'bulk' },
    { id: 'P-108', destination: 'Coimbatore', weight: 800, priority: 'bulk' },
    { id: 'P-109', destination: 'Chennai', weight: 100, priority: 'standard' },
    { id: 'P-110', destination: 'Chennai', weight: 150, priority: 'standard' },
    { id: 'P-111', destination: 'Madurai', weight: 50, priority: 'express' },
    { id: 'P-112', destination: 'Unknown', weight: 0, priority: 'low' } // Edge case
];

// AUDIT ENDPOINT (Safe - Read Only)
router.get('/audit', (req, res) => {
    try {
        const unassignedParcels = MOCK_PARCELS; // In real app, filter from DB

        // 1. Cluster by destination proximity
        const clusters = findClusters(unassignedParcels, TN_GRAPH);

        // 2. Optimize truck matching
        const recommendations = clusters.map(cluster => {
            const routeInfo = dijkstra(TN_GRAPH, 'Chennai', cluster.dest); // Assuming Warehouse is in Chennai for this demo
            // OR if start is "Warehouse" and not in graph, we map it? 
            // The prompt says: dijkstra(TN_GRAPH, 'Warehouse', cluster.dest)
            // But 'Warehouse' isn't in our constant graph. Let's assume Warehouse is Chennai for now, 
            // or add a virtual node. Let's use 'Chennai' as the origin Hub suitable for the graph provided.

            return {
                clusterId: cluster.id,
                parcels: cluster.parcels,
                recommendedTruck: bestFitTruck(cluster.totalWeight),
                route: routeInfo,
                savings: calculateSavings(cluster)
            };
        });

        const totalSavings = recommendations.reduce((sum, r) => sum + (r.savings.amount || 0), 0);

        res.json({
            status: 'AUDIT_COMPLETE',
            parcelCount: unassignedParcels.length,
            recommendations,
            totalSavings
        });

    } catch (error) {
        console.error("Optimizer Error:", error);
        res.status(500).json({ error: "Optimization Failed", details: error.message });
    }
});

module.exports = router;
