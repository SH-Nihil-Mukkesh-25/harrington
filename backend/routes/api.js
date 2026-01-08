const express = require('express');
const router = express.Router();
const { routes, trucks, parcels, alerts } = require('../data/store');

// Helper to create simple ID
const generateID = () => Math.random().toString(36).substr(2, 9);

const createAlert = (severity, message, parcelID = null, truckID = null) => {
    const alert = {
        alertID: generateID(),
        severity,
        message,
        parcelID,
        truckID,
        timestamp: new Date()
    };
    alerts.push(alert);
    return alert;
};

// Health Check
router.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date(), message: 'TMMR Backend is healthy' });
});

// --- Debug Logging ---
console.log("Loading API Routes...");

router.get('/', (req, res) => {
    res.send('API Root');
});

// --- Alerts API ---
router.get('/alerts', (req, res) => {
    res.json(alerts);
});

// --- Routes API ---
router.get('/routes', (req, res) => {
    console.log("GET /routes hit");
    console.log("Routes data:", routes);
    res.json(routes);
});

router.post('/routes', (req, res) => {
    // Expected: { routeID, stops, capacityLimit }
    const newRoute = req.body;
    
    // Validation
    if (!newRoute.routeID || typeof newRoute.routeID !== 'string' || !newRoute.routeID.trim()) {
        return res.status(400).json({ error: 'routeID is required and must be a non-empty string' });
    }
    
    const cap = Number(newRoute.capacityLimit);
    if (isNaN(cap) || cap <= 0) {
        return res.status(400).json({ error: 'capacityLimit must be a positive number' });
    }
    newRoute.capacityLimit = cap; // Store as number

    // Enforce string ID
    newRoute.routeID = String(newRoute.routeID).trim();
    
    routes.push(newRoute);
    res.status(201).json(newRoute);
});

// --- Trucks API ---
router.get('/trucks', (req, res) => {
    res.json(trucks);
});

router.post('/trucks', (req, res) => {
    // Expected: { truckID, routeID, maxCapacity }
    const newTruck = req.body;
    
    // Validation
    if (!newTruck.truckID || typeof newTruck.truckID !== 'string' || !newTruck.truckID.trim()) {
        return res.status(400).json({ error: 'truckID is required and must be a non-empty string' });
    }
    if (!newTruck.routeID || typeof newTruck.routeID !== 'string' || !newTruck.routeID.trim()) {
        return res.status(400).json({ error: 'routeID is required and must be a non-empty string' });
    }
    
    const maxCap = Number(newTruck.maxCapacity);
    if (isNaN(maxCap) || maxCap <= 0) {
        return res.status(400).json({ error: 'maxCapacity must be a positive number' });
    }
    newTruck.maxCapacity = maxCap; // Store as number

    // Enforce string IDs
    newTruck.truckID = String(newTruck.truckID).trim();
    newTruck.routeID = String(newTruck.routeID).trim();

    trucks.push(newTruck);
    res.status(201).json(newTruck);
});

// --- Parcels API ---
router.get('/parcels', (req, res) => {
    res.json(parcels);
});

router.post('/parcels', (req, res) => {
    // Expected: { parcelID, destination, weight }
    const newParcel = req.body;
    
    // Validation
    if (!newParcel.parcelID || typeof newParcel.parcelID !== 'string' || !newParcel.parcelID.trim()) {
        return res.status(400).json({ error: 'parcelID is required and must be a non-empty string' });
    }
    if (!newParcel.destination || typeof newParcel.destination !== 'string' || !newParcel.destination.trim()) {
        return res.status(400).json({ error: 'destination is required and must be a non-empty string' });
    }
    
    const weight = Number(newParcel.weight);
    if (isNaN(weight) || weight <= 0) {
        return res.status(400).json({ error: 'weight must be a positive number' });
    }
    newParcel.weight = weight; // Store as number
    
    // Enforce string ID
    newParcel.parcelID = String(newParcel.parcelID).trim();
    newParcel.destination = String(newParcel.destination).trim();

    parcels.push(newParcel);
    res.status(201).json(newParcel);
});

// --- Assignment API ---
router.post('/assignParcel', (req, res) => {
    const { parcelID, truckID } = req.body;
    
    // 1. Validate Existence
    const parcel = parcels.find(p => p.parcelID === String(parcelID));
    const truck = trucks.find(t => t.truckID === String(truckID));

    if (!parcel) {
        createAlert('SL-3', `Assignment failed: Parcel ${parcelID} not found`, parcelID, truckID);
        return res.status(404).json({ error: 'Parcel not found' });
    }
    if (!truck) {
        createAlert('SL-3', `Assignment failed: Truck ${truckID} not found`, parcelID, truckID);
        return res.status(404).json({ error: 'Truck not found' });
    }

    // 2. Uniqueness: Check if already assigned
    if (parcel.assignedTruckId) {
        createAlert('SL-1', `Assignment failed: Parcel ${parcelID} already assigned to ${parcel.assignedTruckId}`, parcelID, truckID);
        return res.status(400).json({ error: `Parcel already assigned to truck ${parcel.assignedTruckId}` });
    }

    // 3. Destination: Check if truck's route supports parcel's destination
    const route = routes.find(r => r.routeID === truck.routeID);
    if (!route) {
        createAlert('SL-3', `Assignment failed: Truck ${truck.truckID} has no valid route`, parcelID, truckID);
        return res.status(400).json({ error: 'Truck has no valid route assigned' });
    }

    // Handle stops being array or string (based on earlier implementation)
    let truckStops = route.stops;
    if (typeof truckStops === 'string') {
        truckStops = truckStops.split(',').map(s => s.trim());
    }
    
    if (!truckStops.includes(parcel.destination)) {
        createAlert('SL-1', `Assignment failed: Truck ${truck.truckID} route does not include ${parcel.destination}`, parcelID, truckID);
        return res.status(400).json({ error: `Truck's route does not stop at ${parcel.destination}` });
    }

    // 4. Capacity: Check total load
    const currentLoad = parcels
        .filter(p => p.assignedTruckId === truck.truckID)
        .reduce((sum, p) => sum + (Number(p.weight) || 0), 0);

    if (currentLoad + (Number(parcel.weight) || 0) > truck.maxCapacity) {
        createAlert('SL-2', `Assignment failed: Capacity exceeded for Truck ${truck.truckID}`, parcelID, truckID);
        return res.status(400).json({ error: 'Truck capacity exceeded' });
    }

    // Success: Assign
    parcel.assignedTruckId = truck.truckID;
    res.json({ 
        success: true, 
        message: `Parcel ${parcel.parcelID} assigned to Truck ${truck.truckID}`,
        parcel
    });
});

module.exports = router;
