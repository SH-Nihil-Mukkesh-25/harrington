const express = require('express');
const router = express.Router();
const TN_GRAPH = require('../data/tnGraph');
const { parcels } = require('../data/store');
const { 
    dijkstra, 
    bestFitTruck, 
    geminiOptimizeClusters, 
    geminiCalculateSavings,
    getCityDistance 
} = require('../utils/dijkstra');

// AUDIT ENDPOINT - Now uses Gemini-powered optimization
router.get('/audit', async (req, res) => {
    try {
        // Use actual parcels from store, or fall back to mock data for demo
        let unassignedParcels = parcels.filter(p => !p.assignedTruckID);
        
        // If no parcels in store, use demo data
        if (unassignedParcels.length === 0) {
            unassignedParcels = [
                { id: 'P-101', destination: 'Madurai', weight: 400, priority: 'standard' },
                { id: 'P-102', destination: 'Madurai', weight: 350, priority: 'standard' },
                { id: 'P-103', destination: 'Madurai', weight: 500, priority: 'express' },
                { id: 'P-104', destination: 'Tuticorin', weight: 600, priority: 'standard' },
                { id: 'P-105', destination: 'Tuticorin', weight: 400, priority: 'standard' },
                { id: 'P-106', destination: 'Trichy', weight: 200, priority: 'standard' },
                { id: 'P-107', destination: 'Coimbatore', weight: 1200, priority: 'bulk' },
                { id: 'P-108', destination: 'Coimbatore', weight: 800, priority: 'bulk' },
                { id: 'P-109', destination: 'Salem', weight: 100, priority: 'standard' },
                { id: 'P-110', destination: 'Erode', weight: 150, priority: 'standard' },
                { id: 'P-111', destination: 'Tirunelveli', weight: 350, priority: 'express' }
            ];
        }

        const origin = req.query.origin || 'Chennai';
        
        // 1. Gemini-powered clustering
        console.log('[Sentinel] Running Gemini optimization for', unassignedParcels.length, 'parcels');
        const clusters = await geminiOptimizeClusters(unassignedParcels, origin);

        // 2. Generate recommendations with savings for each cluster
        const recommendations = await Promise.all(clusters.map(async (cluster) => {
            // Calculate route using Dijkstra if graph nodes exist
            let routeInfo = { path: cluster.routeOrder || [origin, ...cluster.destinations], totalDistance: 0 };
            
            // Try to get distance from graph or calculate
            const finalDest = cluster.destinations[cluster.destinations.length - 1];
            if (TN_GRAPH[origin] && TN_GRAPH[finalDest]) {
                routeInfo = dijkstra(TN_GRAPH, origin, finalDest);
            } else {
                // Sum up distances
                let totalDist = 0;
                let prev = origin;
                for (const dest of cluster.destinations) {
                    const dist = getCityDistance(prev, dest);
                    if (dist) totalDist += dist;
                    prev = dest;
                }
                routeInfo.totalDistance = totalDist;
            }

            // Get Gemini-powered savings calculation
            const savings = await geminiCalculateSavings(cluster, origin);

            return {
                clusterId: cluster.id,
                destinations: cluster.destinations,
                parcelIds: cluster.parcelIds,
                parcelCount: cluster.parcelIds.length,
                totalWeight: cluster.totalWeight,
                recommendedTruck: bestFitTruck(cluster.totalWeight),
                route: routeInfo,
                routeOrder: cluster.routeOrder || [origin, ...cluster.destinations],
                reasoning: cluster.reasoning,
                savings: savings
            };
        }));

        const totalSavings = recommendations.reduce((sum, r) => sum + (r.savings.amount || 0), 0);

        res.json({
            status: 'AUDIT_COMPLETE',
            optimizer: 'GEMINI_POWERED',
            origin: origin,
            parcelCount: unassignedParcels.length,
            clusterCount: clusters.length,
            recommendations,
            totalSavings,
            currency: 'INR',
            message: totalSavings > 0 
                ? `🚀 Sentinel identified ₹${totalSavings.toLocaleString()} in potential savings!`
                : 'Routes are already optimized'
        });

    } catch (error) {
        console.error("[Optimizer Error]:", error);
        res.status(500).json({ 
            error: "Optimization Failed", 
            details: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

// Quick test endpoint
router.get('/test', async (req, res) => {
    const testParcels = [
        { id: 'TEST-1', destination: 'Salem', weight: 200 },
        { id: 'TEST-2', destination: 'Erode', weight: 300 },
        { id: 'TEST-3', destination: 'Tirunelveli', weight: 400 }
    ];
    
    try {
        const clusters = await geminiOptimizeClusters(testParcels, 'Chennai');
        const savings = clusters.length > 0 
            ? await geminiCalculateSavings(clusters[0], 'Chennai')
            : { amount: 0 };
            
        res.json({
            status: 'TEST_COMPLETE',
            input: testParcels,
            clusters,
            sampleSavings: savings,
            message: 'Gemini optimizer is working!'
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
