// TMMR v3.0 Sentinel Engine - Dynamic Resiliency Module
const mapData = require('./mapData');
const { findCheapestPath } = require('./routingEngine');
const { trucks, routes } = require('../data/store');

/**
 * Checks which trucks are affected by a road closure and proposes reroutes.
 * @param {string} from - Road Start
 * @param {string} to - Road End
 */
const checkAffectedTrucks = (from, to) => {
    const affectedTrucks = [];

    // Scan all trucks
    trucks.forEach(truck => {
        // Find truck's route
        const route = routes.find(r => r.routeID === truck.routeID);
        if (!route) return;

        // Simplified Logic: Current route definition is just a list of stops.
        // We assume the truck travels sequentially between stops.
        // If the closed segment (from-to) is part of this sequence, the truck is affected.

        let stops = route.stops;
        if (typeof stops === 'string') stops = stops.split(',').map(s => s.trim());

        // Check if [from, to] or [to, from] exists in consecutive stops
        let isAffected = false;
        for (let i = 0; i < stops.length - 1; i++) {
            const A = stops[i];
            const B = stops[i + 1];
            if ((A === from && B === to) || (A === to && B === from)) {
                isAffected = true;
                break;
            }
        }

        if (isAffected) {
            // Calculate Alternative Path
            // We assume truck is at the start of the route for this recalculation (simplification)
            // A real engine would know exact GPS location.
            const startNode = stops[0];
            const endNode = stops[stops.length - 1];

            const reroute = findCheapestPath(startNode, endNode);

            affectedTrucks.push({
                truckID: truck.truckID,
                currentRoute: route.routeID,
                impact: "CRITICAL - Road Closed",
                proposedAction: reroute.error ? "RETURN_TO_DEPOT" : "REROUTE",
                alternatePath: reroute.path || "None",
                newCost: reroute.totalCost || "N/A"
            });
        }
    });

    return affectedTrucks;
};

module.exports = { checkAffectedTrucks };
