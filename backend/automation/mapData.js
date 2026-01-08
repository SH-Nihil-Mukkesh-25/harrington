// TMMR v3.0 Sentinel Engine - Weighted Graph Data
// Nodes represent major logistics hubs in Tamil Nadu.
// Edges contain distance (km) and tollCost ($/INR approx converted or just abstract units).
// "Warehouse" is assumed to be in Chennai.

const mapData = {
    nodes: ["Chennai (Warehouse)", "Vellore", "Trichy", "Salem", "Madurai", "Coimbatore", "Tirunelveli", "Erode"],
    edges: [
        { from: "Chennai (Warehouse)", to: "Vellore", distance: 140, tollCost: 150.00 },
        { from: "Chennai (Warehouse)", to: "Trichy", distance: 330, tollCost: 350.00 },
        { from: "Chennai (Warehouse)", to: "Salem", distance: 340, tollCost: 320.00 },
        { from: "Vellore", to: "Salem", distance: 200, tollCost: 180.00 },
        { from: "Trichy", to: "Madurai", distance: 135, tollCost: 120.00 },
        { from: "Madurai", to: "Tirunelveli", distance: 160, tollCost: 140.00 },
        { from: "Salem", to: "Erode", distance: 65, tollCost: 60.00 },
        { from: "Erode", to: "Coimbatore", distance: 100, tollCost: 90.00 },
        { from: "Trichy", to: "Erode", distance: 140, tollCost: 110.00 }, // Cross-link
        { from: "Madurai", to: "Coimbatore", distance: 210, tollCost: 200.00 } // Southern link
    ]
};

// Store original costs to allow re-opening
const originalCosts = {};

/**
 * Toggles a road segment status (Open/Closed).
 * @param {string} from - Start Node
 * @param {string} to - End Node
 * @param {boolean} isClosed - True to close (Infinity), False to open.
 */
const toggleRoadStatus = (from, to, isClosed) => {
    const edge = mapData.edges.find(e =>
        (e.from === from && e.to === to) || (e.from === to && e.to === from)
    );

    if (!edge) throw new Error("Road segment not found.");

    const key = `${edge.from}-${edge.to}`;

    if (isClosed) {
        // Backup original cost if not already backed up
        if (!originalCosts[key]) {
            originalCosts[key] = { distance: edge.distance, tollCost: edge.tollCost };
        }
        // Set to Infinity (effectively closing the road)
        edge.distance = 999999;
        edge.tollCost = 999999;
    } else {
        // Restore
        if (originalCosts[key]) {
            edge.distance = originalCosts[key].distance;
            edge.tollCost = originalCosts[key].tollCost;
        }
    }
    return { success: true, status: isClosed ? 'CLOSED' : 'OPEN', edge };
};

mapData.toggleRoadStatus = toggleRoadStatus;

module.exports = mapData;
