// TMMR v3.0 Sentinel Engine - Dijkstra Routing
const mapData = require('./mapData');

// Fuel Rate ($/km) - assumed average for heavy trucks
const FUEL_RATE = 1.25;

/**
 * Calculates the cost of an edge based on formula:
 * Cost = (Distance * FuelRate) + Toll
 */
const calculateEdgeCost = (distance, toll) => {
    if (distance < 0 || toll < 0) return Infinity; // Adversarial check
    return (distance * FUEL_RATE) + toll;
};

/**
 * Finds the cheapest path between two nodes using Dijkstra's Algorithm.
 * Returns: { path: [], totalCost: number, breakdown: {} }
 */
const findCheapestPath = (startNode, endNode) => {
    // 1. Validation
    if (!mapData.nodes.includes(startNode) || !mapData.nodes.includes(endNode)) {
        return { error: 'Invalid start or end node', code: 'INVALID_NODE' };
    }

    // 2. Initialization
    const costs = {};
    const parents = {};
    const queue = [];

    mapData.nodes.forEach(node => {
        costs[node] = Infinity;
        parents[node] = null;
    });

    costs[startNode] = 0;
    queue.push({ node: startNode, cost: 0 });

    // 3. Main Loop
    while (queue.length > 0) {
        // Sort queue by cost (min-priority queue simulation)
        queue.sort((a, b) => a.cost - b.cost);
        const current = queue.shift();
        const u = current.node;

        if (u === endNode) break; // Found destination

        // Get neighbors
        const neighbors = mapData.edges.filter(e => e.from === u || e.to === u);

        for (const edge of neighbors) {
            const v = edge.from === u ? edge.to : edge.from;
            const edgeWeight = calculateEdgeCost(edge.distance, edge.tollCost);
            const newCost = costs[u] + edgeWeight;

            if (newCost < costs[v]) {
                costs[v] = newCost;
                parents[v] = u;
                queue.push({ node: v, cost: newCost });
            }
        }
    }

    // 4. Reconstruct Path
    if (costs[endNode] === Infinity) {
        return { error: 'No path found', code: 'NO_PATH' };
    }

    const path = [];
    let step = endNode;
    while (step) {
        path.unshift(step);
        step = parents[step];
    }

    return {
        path,
        totalCost: Number(costs[endNode].toFixed(2)),
        currency: 'USD',
        algorithm: 'Cost-Aware Dijkstra',
        fuelRate: FUEL_RATE
    };
};

module.exports = { findCheapestPath };
