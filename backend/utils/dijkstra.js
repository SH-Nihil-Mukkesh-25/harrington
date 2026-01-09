// TMMR v4.0 Sentinel Engine - Gemini-Powered Route Optimizer
// Replaces hardcoded demo logic with AI-driven dynamic optimization

const { GoogleGenerativeAI } = require("@google/generative-ai");

// Initialize Gemini
let genAI = null;
let model = null;

function initializeGemini() {
    if (!genAI && process.env.GEMINI_API_KEY) {
        genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    }
    return model;
}

// Tamil Nadu major cities with approximate coordinates for distance estimation
const TN_CITY_COORDS = {
    "Chennai": { lat: 13.0827, lng: 80.2707 },
    "Madurai": { lat: 9.9252, lng: 78.1198 },
    "Coimbatore": { lat: 11.0168, lng: 76.9558 },
    "Tiruchirappalli": { lat: 10.7905, lng: 78.7047 },
    "Trichy": { lat: 10.7905, lng: 78.7047 },
    "Salem": { lat: 11.6643, lng: 78.1460 },
    "Tirunelveli": { lat: 8.7139, lng: 77.7567 },
    "Tuticorin": { lat: 8.7642, lng: 78.1348 },
    "Thoothukudi": { lat: 8.7642, lng: 78.1348 },
    "Erode": { lat: 11.3410, lng: 77.7172 },
    "Vellore": { lat: 12.9165, lng: 79.1325 },
    "Thanjavur": { lat: 10.7870, lng: 79.1378 },
    "Dindigul": { lat: 10.3624, lng: 77.9695 },
    "Kanyakumari": { lat: 8.0883, lng: 77.5385 },
    "Hosur": { lat: 12.7400, lng: 77.8253 },
    "Nagercoil": { lat: 8.1833, lng: 77.4119 },
    "Karur": { lat: 10.9601, lng: 78.0766 },
    "Theni": { lat: 10.0104, lng: 77.4768 },
    "Kumbakonam": { lat: 10.9617, lng: 79.3881 },
    "Pondicherry": { lat: 11.9416, lng: 79.8083 },
    "Puducherry": { lat: 11.9416, lng: 79.8083 }
};

// Haversine distance calculation
function haversineDistance(lat1, lng1, lat2, lng2) {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}

// Get distance between two cities
function getCityDistance(city1, city2) {
    const c1 = TN_CITY_COORDS[city1];
    const c2 = TN_CITY_COORDS[city2];
    if (!c1 || !c2) return null;
    return Math.round(haversineDistance(c1.lat, c1.lng, c2.lat, c2.lng));
}

/**
 * Gemini-powered cluster optimization
 * Analyzes parcels and suggests optimal groupings based on geography
 */
async function geminiOptimizeClusters(parcels, origin = "Chennai") {
    const geminiModel = initializeGemini();
    
    // Build destination summary
    const destinationMap = {};
    parcels.forEach(p => {
        if (!destinationMap[p.destination]) {
            destinationMap[p.destination] = { count: 0, totalWeight: 0, parcelIds: [] };
        }
        destinationMap[p.destination].count++;
        destinationMap[p.destination].totalWeight += (p.weight || 0);
        destinationMap[p.destination].parcelIds.push(p.id || p.parcelID);
    });

    const destinations = Object.keys(destinationMap);
    
    // Calculate distances from origin and between cities
    const distanceInfo = {};
    destinations.forEach(dest => {
        const distFromOrigin = getCityDistance(origin, dest);
        distanceInfo[dest] = {
            fromOrigin: distFromOrigin || "unknown",
            ...destinationMap[dest]
        };
    });

    // If no Gemini available, fallback to distance-based clustering
    if (!geminiModel) {
        console.log("[Optimizer] Gemini not available, using distance-based fallback");
        return distanceBasedClustering(destinationMap, origin);
    }

    const prompt = `You are a logistics route optimizer for Tamil Nadu, India.

ORIGIN: ${origin} (warehouse/hub)

PARCEL DESTINATIONS:
${JSON.stringify(distanceInfo, null, 2)}

TASK: Group these destinations into efficient delivery clusters. Consider:
1. Geographic proximity - cities within 100km should cluster together
2. Route efficiency - cities along the same highway corridor
3. Tamil Nadu geography - coastal routes, hill stations, major highways (NH44, NH48, NH32)

IMPORTANT ROUTES IN TAMIL NADU:
- Chennai → Madurai → Tirunelveli → Kanyakumari (southern corridor)
- Chennai → Trichy → Madurai (central route)  
- Chennai → Salem → Coimbatore → Erode (western corridor)
- Madurai → Tuticorin/Thoothukudi (southeastern)

Return ONLY valid JSON (no markdown):
{
  "clusters": [
    {
      "id": "CLUSTER-001",
      "destinations": ["City1", "City2"],
      "parcelIds": ["P-101", "P-102"],
      "totalWeight": 1200,
      "routeOrder": ["${origin}", "City1", "City2"],
      "reasoning": "Brief explanation"
    }
  ]
}`;

    try {
        const result = await geminiModel.generateContent(prompt);
        const responseText = result.response.text();
        
        // Parse JSON from response
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            return parsed.clusters || [];
        }
    } catch (error) {
        console.error("[Optimizer] Gemini clustering failed:", error.message);
    }

    // Fallback to distance-based
    return distanceBasedClustering(destinationMap, origin);
}

/**
 * Fallback: Distance-based clustering when Gemini is unavailable
 */
function distanceBasedClustering(destinationMap, origin) {
    const clusters = [];
    const destinations = Object.keys(destinationMap);
    const clustered = new Set();

    destinations.forEach(dest => {
        if (clustered.has(dest)) return;

        const cluster = {
            id: `CLUSTER-${Math.random().toString(36).substr(2, 5).toUpperCase()}`,
            destinations: [dest],
            parcelIds: destinationMap[dest].parcelIds,
            totalWeight: destinationMap[dest].totalWeight,
            routeOrder: [origin, dest],
            reasoning: "Distance-based clustering"
        };

        // Find nearby cities to add to cluster
        destinations.forEach(other => {
            if (other === dest || clustered.has(other)) return;
            const distance = getCityDistance(dest, other);
            if (distance && distance < 100) { // Within 100km
                cluster.destinations.push(other);
                cluster.parcelIds.push(...destinationMap[other].parcelIds);
                cluster.totalWeight += destinationMap[other].totalWeight;
                cluster.routeOrder.push(other);
                cluster.reasoning = `Cities within ${distance}km grouped together`;
                clustered.add(other);
            }
        });

        clustered.add(dest);
        clusters.push(cluster);
    });

    return clusters;
}

/**
 * Gemini-powered savings calculation
 * Estimates realistic savings based on route consolidation
 */
async function geminiCalculateSavings(cluster, origin = "Chennai") {
    const geminiModel = initializeGemini();
    
    // Calculate base distances
    let separateTripsDistance = 0;
    let consolidatedDistance = 0;
    
    cluster.destinations.forEach(dest => {
        const dist = getCityDistance(origin, dest);
        if (dist) separateTripsDistance += dist * 2; // Round trip for each
    });

    // Consolidated route distance (simplified: sequential)
    let prevCity = origin;
    for (const dest of cluster.routeOrder || cluster.destinations) {
        if (dest === origin) continue;
        const dist = getCityDistance(prevCity, dest);
        if (dist) consolidatedDistance += dist;
        prevCity = dest;
    }
    // Add return to origin
    const returnDist = getCityDistance(prevCity, origin);
    if (returnDist) consolidatedDistance += returnDist;

    const distanceSaved = Math.max(0, separateTripsDistance - consolidatedDistance);
    
    // Base calculation (without Gemini)
    const fuelCostPerKm = 12; // ₹12 per km for trucks
    const baseFuelSavings = distanceSaved * fuelCostPerKm;
    const tollSavings = cluster.destinations.length > 1 ? 400 * (cluster.destinations.length - 1) : 0;
    const timeSavings = Math.round(distanceSaved * 1.5); // ₹1.5 per km in driver time

    const baseSavings = {
        amount: Math.round(baseFuelSavings + tollSavings + timeSavings),
        breakdown: {
            fuel: Math.round(baseFuelSavings),
            tolls: tollSavings,
            time: timeSavings,
            distanceSavedKm: distanceSaved
        },
        explanation: `Consolidated ${cluster.destinations.length} destinations, saved ${distanceSaved}km of travel`
    };

    // If no Gemini or single destination, return base calculation
    if (!geminiModel || cluster.destinations.length <= 1) {
        return baseSavings;
    }

    // Use Gemini for more nuanced estimation
    const prompt = `Calculate logistics cost savings for this Tamil Nadu delivery route:

CLUSTER: ${cluster.id}
ORIGIN: ${origin}
ROUTE: ${(cluster.routeOrder || [origin, ...cluster.destinations]).join(' → ')} → ${origin}
DESTINATIONS: ${cluster.destinations.join(', ')}
PARCELS: ${cluster.parcelIds.length} items, ${cluster.totalWeight}kg total

COMPARED TO: Sending separate trucks to each destination

My distance calculation shows:
- Separate trips total: ${separateTripsDistance}km
- Consolidated route: ${consolidatedDistance}km  
- Distance saved: ${distanceSaved}km

Estimate realistic savings in Indian Rupees (INR):
- Fuel: ~₹12/km for delivery trucks
- Tolls: Tamil Nadu highway tolls (₹100-500 per segment)
- Driver time/wages

Return ONLY valid JSON (no markdown):
{
  "amount": 5000,
  "breakdown": { "fuel": 3000, "tolls": 1200, "time": 800 },
  "explanation": "Brief explanation of savings"
}`;

    try {
        const result = await geminiModel.generateContent(prompt);
        const responseText = result.response.text();
        
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            return {
                amount: parsed.amount || baseSavings.amount,
                breakdown: parsed.breakdown || baseSavings.breakdown,
                explanation: parsed.explanation || baseSavings.explanation
            };
        }
    } catch (error) {
        console.error("[Optimizer] Gemini savings calculation failed:", error.message);
    }

    return baseSavings;
}

// Simple Priority Queue for Dijkstra
class SimplePriorityQueue {
    constructor() {
        this.values = [];
    }
    enqueue(val, priority) {
        this.values.push({ val, priority });
        this.sort();
    }
    dequeue() {
        return this.values.shift();
    }
    sort() {
        this.values.sort((a, b) => a.priority - b.priority);
    }
    isEmpty() {
        return this.values.length === 0;
    }
}

function dijkstra(graph, start, end) {
    const distances = {};
    const previous = {};
    const pq = new SimplePriorityQueue();

    Object.keys(graph).forEach(node => distances[node] = Infinity);
    distances[start] = 0;
    pq.enqueue(start, 0);

    while (!pq.isEmpty()) {
        const current = pq.dequeue();
        const currentNode = current.val;

        if (currentNode === end) break;

        if (graph[currentNode]) {
            for (let neighbor in graph[currentNode]) {
                const edge = graph[currentNode][neighbor];
                const alt = distances[currentNode] + edge.dist;
                if (alt < distances[neighbor]) {
                    distances[neighbor] = alt;
                    previous[neighbor] = currentNode;
                    pq.enqueue(neighbor, alt);
                }
            }
        }
    }

    return reconstructPath(start, end, previous, distances[end]);
}

function reconstructPath(start, end, previous, totalDist) {
    const path = [];
    let current = end;
    while (current) {
        path.unshift(current);
        if (current === start) break;
        current = previous[current];
    }
    return { path, totalDistance: totalDist };
}

// Best-fit truck matcher (kept from original)
function bestFitTruck(totalWeight) {
    if (totalWeight > 10000) return { type: 'Heavy Duty', id: 'T-99' };
    if (totalWeight > 5000) return { type: 'Bulk (10-ton)', id: 'T-BULK-10' };
    if (totalWeight > 2000) return { type: 'Regional (5-ton)', id: 'T-REG-05' };
    return { type: 'Express (2-ton)', id: 'T-EXP-02' };
}

// Legacy wrapper functions for backward compatibility
function findClusters(parcels, graph) {
    // Synchronous fallback - use distance-based clustering
    const destinationMap = {};
    parcels.forEach(p => {
        if (!destinationMap[p.destination]) {
            destinationMap[p.destination] = { count: 0, totalWeight: 0, parcelIds: [] };
        }
        destinationMap[p.destination].count++;
        destinationMap[p.destination].totalWeight += (p.weight || 0);
        destinationMap[p.destination].parcelIds.push(p.id || p.parcelID);
    });
    
    // Convert to legacy format
    const clusters = distanceBasedClustering(destinationMap, "Chennai");
    return clusters.map(c => ({
        id: c.id,
        dest: c.destinations[c.destinations.length - 1],
        stops: c.destinations,
        parcels: parcels.filter(p => c.destinations.includes(p.destination)),
        totalWeight: c.totalWeight
    }));
}

function calculateSavings(cluster) {
    // Synchronous fallback
    const distanceSaved = cluster.stops.length > 1 ? cluster.stops.length * 50 : 0;
    const fuelSavings = distanceSaved * 12;
    const tollSavings = cluster.stops.length > 1 ? 400 * (cluster.stops.length - 1) : 0;
    const amount = Math.round(fuelSavings + tollSavings);
    
    return {
        amount: amount,
        details: amount > 0 
            ? `Combined ${cluster.stops.join('+')} saved ₹${amount.toLocaleString()} (Fuel + Tolls)`
            : "Standard routing"
    };
}

module.exports = {
    dijkstra,
    findClusters,
    bestFitTruck,
    calculateSavings,
    // New async Gemini-powered functions
    geminiOptimizeClusters,
    geminiCalculateSavings,
    getCityDistance,
    TN_CITY_COORDS
};
