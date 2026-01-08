const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { routes, trucks, parcels, alerts, workflows } = require('../data/store');

// Helper to create robust ID
const generateID = () => crypto.randomUUID();

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

// ... (Health Check omitted, lines 21-24 same)
// Health Check
router.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date(), message: 'TMMR Backend is healthy' });
});

// --- AI Availability Status ---
router.get('/ai/status', (req, res) => {
    const enabled = !!process.env.GEMINI_API_KEY;
    res.json({ enabled });
});

// --- AI Agent Endpoint (Gemini) ---
const { GoogleGenerativeAI } = require('@google/generative-ai');

const SYSTEM_PROMPT = `You are Zudu, an AI logistics assistant for TMMR (Truck, Map, Monitoring & Routing).
You have FULL CONTROL over the logistics system. You can CREATE, READ, UPDATE, and DELETE any resource.

PERSONALITY:
- Be proactive and action-oriented
- Use intelligent defaults (generate IDs like P-001, T-001 if not provided)
- Execute actions immediately when intent is clear
- Confirm destructive actions (delete) before executing

CONTEXT AWARENESS:
You may receive 'Screen Context' JSON containing:
- selectedParcel: Currently selected parcel
- compatibleRoutes: Valid routes for destination
- compatibleTrucks: Valid trucks for selected route

TOOL REFERENCE (use exact format, replace example values):

📊 QUERY (Read):
[TOOL:getSystemStatus]
[TOOL:getAlerts]
[TOOL:listRoutes]
[TOOL:listTrucks]
[TOOL:listParcels]

➕ CREATE:
[TOOL:createParcel:P-001:DELHI:15]       → Parcel P-001 to DELHI, 15kg
[TOOL:createTruck:T-001:R-NORTH:100]     → Truck T-001 on R-NORTH, 100kg cap
[TOOL:createRoute:R-EAST:KOLKATA,PATNA:80] → Route R-EAST with stops

🔄 ACTION:
[TOOL:assignParcel:P-001:T-001]          → Assign parcel to truck

🗑️ DELETE:
[TOOL:deleteParcel:P-001]                → Remove parcel P-001
[TOOL:deleteTruck:T-001]                 → Remove truck T-001
[TOOL:deleteRoute:R-EAST]                → Remove route R-EAST

RULES:
1. ALWAYS use actual values from conversation, never "parcelID" or "weight" literally
2. Generate IDs if user doesn't provide them (P-Gen-001, T-Gen-001)
3. For parcels: destination should be UPPERCASE city name
4. For delete requests: confirm the ID you will delete
5. If something doesn't exist, offer to create it`;

router.post('/ai/agent', async (req, res) => {
    const { message, history, screenContext } = req.body;

    if (!message) {
        return res.status(400).json({ error: 'Message is required' });
    }

    if (!process.env.GEMINI_API_KEY) {
        return res.status(503).json({ error: 'AI service not configured' });
    }

    try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

        // Build conversation context
        const contextMessages = (history || [])
            .filter(h => h.sender && h.text)
            .slice(-8)
            .map(h => `${h.sender === 'user' ? 'User' : 'Assistant'}: ${h.text}`)
            .join('\n');

        const prompt = `${SYSTEM_PROMPT}

Screen Context (Current UI State):
${screenContext ? JSON.stringify(screenContext, null, 2) : 'None'}

Recent conversation:
${contextMessages}

User: ${message}

Respond concisely. Include tool calls using [TOOL:...] format when taking action.`;

        const result = await model.generateContent(prompt);
        const responseText = result.response.text();

        // Parse tool calls from response (supports up to 4 arguments)
        const toolCalls = [];
        const toolMatches = responseText.matchAll(/\[TOOL:(\w+)(?::([^:\]]+))?(?::([^:\]]+))?(?::([^:\]]+))?(?::([^\]]+))?\]/g);
        
        for (const match of toolMatches) {
            const [, toolName, arg1, arg2, arg3, arg4] = match;
            
            switch (toolName) {
                // Query tools
                case 'getSystemStatus':
                case 'getAlerts':
                case 'listRoutes':
                case 'listTrucks':
                case 'listParcels':
                    toolCalls.push({ name: toolName, args: {} });
                    break;
                
                // Create tools
                case 'createParcel':
                    if (arg1 && arg2 && arg3) {
                        toolCalls.push({ name: 'createParcel', args: { parcelID: arg1.trim(), destination: arg2.trim(), weight: arg3.trim() } });
                    }
                    break;
                case 'createTruck':
                    if (arg1 && arg2 && arg3) {
                        toolCalls.push({ name: 'createTruck', args: { truckID: arg1.trim(), routeID: arg2.trim(), maxCapacity: arg3.trim() } });
                    }
                    break;
                case 'createRoute':
                    if (arg1 && arg2 && arg3) {
                        toolCalls.push({ name: 'createRoute', args: { routeID: arg1.trim(), stops: arg2.trim(), capacityLimit: arg3.trim() } });
                    }
                    break;
                
                // Action tools
                case 'assignParcel':
                    if (arg1 && arg2) {
                        toolCalls.push({ name: 'assignParcel', args: { parcelID: arg1.trim(), truckID: arg2.trim() } });
                    }
                    break;
                
                // Delete tools
                case 'deleteParcel':
                    if (arg1) {
                        toolCalls.push({ name: 'deleteParcel', args: { parcelID: arg1.trim() } });
                    }
                    break;
                case 'deleteTruck':
                    if (arg1) {
                        toolCalls.push({ name: 'deleteTruck', args: { truckID: arg1.trim() } });
                    }
                    break;
                case 'deleteRoute':
                    if (arg1) {
                        toolCalls.push({ name: 'deleteRoute', args: { routeID: arg1.trim() } });
                    }
                    break;
            }
        }

        // Clean response (remove tool markers)
        const cleanResponse = responseText.replace(/\[TOOL:[^\]]+\]/g, '').trim();

        res.json({
            response: cleanResponse,
            toolCalls: toolCalls.length > 0 ? toolCalls : undefined
        });

    } catch (err) {
        console.error('AI Agent error:', err);
        res.status(500).json({ 
            error: 'AI processing failed',
            details: err.message 
        });
    }
});

// ... (Debug Log omitted, lines 27-31 same)
// --- Debug Logging ---


router.get('/', (req, res) => {
    res.send('API Root');
});


// ... (reset omitted, lines 34-48 same)
// --- System Reset (DEV/DEMO ONLY) ---
router.post('/reset', (req, res) => {
    // Clear all in-memory data
    routes.length = 0;
    trucks.length = 0;
    parcels.length = 0;
    alerts.length = 0;
    workflows.length = 0;
    
    console.log('[DEV] System reset executed at', new Date().toISOString());
    res.json({ 
        success: true, 
        message: 'System reset successful',
        timestamp: new Date()
    });
});

// --- System Seed (HACKATHON DEMO LOADER) ---
router.post('/seed', (req, res) => {
    // 1. Clear existing
    routes.length = 0;
    trucks.length = 0;
    parcels.length = 0;
    alerts.length = 0;
    workflows.length = 0;

    // 2. Add Routes
    routes.push(
        { routeID: 'R-NORTH', stops: ['DELHI', 'JAIPUR', 'LUCKNOW'], capacityLimit: 50 },
        { routeID: 'R-SOUTH', stops: ['CHENNAI', 'BANGALORE', 'HYDERABAD'], capacityLimit: 40 },
        { routeID: 'R-WEST', stops: ['MUMBAI', 'PUNE', 'AHMEDABAD'], capacityLimit: 60 }
    );

    // 3. Add Trucks
    trucks.push(
        { truckID: 'T-101', routeID: 'R-NORTH', maxCapacity: 20 },
        { truckID: 'T-102', routeID: 'R-SOUTH', maxCapacity: 15 },
        { truckID: 'T-103', routeID: 'R-WEST', maxCapacity: 25 },
        { truckID: 'T-104', routeID: 'R-NORTH', maxCapacity: 20 }
    );

    // 4. Add Parcels
    parcels.push(
        { parcelID: 'P-500', destination: 'DELHI', weight: 5, assignedTruckId: null },
        { parcelID: 'P-501', destination: 'JAIPUR', weight: 8, assignedTruckId: null },
        { parcelID: 'P-502', destination: 'CHENNAI', weight: 12, assignedTruckId: null }, // Heavy
        { parcelID: 'P-503', destination: 'PUNE', weight: 2, assignedTruckId: null }
    );

    console.log('[DEMO] Test data loaded successfully.');
    res.json({
        success: true,
        message: 'Demo data loaded (3 Routes, 4 Trucks, 4 Parcels)',
        stats: {
            routes: 3,
            trucks: 4,
            parcels: 4
        }
    });
});


// --- Alerts API ---
router.get('/alerts', (req, res) => {
    res.json(alerts);
});

// --- Routes API ---
router.get('/routes', (req, res) => {
    // Pagination support
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 1000; // Default to all
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;

    const result = limit === 1000 ? routes : routes.slice(startIndex, endIndex); // Optimized for default


    res.json(result);
});

// ... (POST /routes same)
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

    // --- FIX: Normalize Stops (Always Array) ---
    // If string "Mumbai, Pune", split it. If Array, keep it.
    if (typeof newRoute.stops === 'string') {
        newRoute.stops = newRoute.stops.split(',').map(s => s.trim()).filter(Boolean);
    } else if (!Array.isArray(newRoute.stops)) {
        return res.status(400).json({ error: 'stops must be a comma-separated string or an array of strings' });
    }
    // Now newRoute.stops is guaranteed to be an Array
    
    routes.push(newRoute);
    res.status(201).json(newRoute);
});

// ... (DELETE /routes same)
router.delete('/routes/:routeID', (req, res) => {
    const { routeID } = req.params;
    const index = routes.findIndex(r => r.routeID === routeID);
    
    if (index === -1) {
        return res.status(404).json({ error: `Route '${routeID}' not found` });
    }
    
    // Check if any trucks are using this route
    const trucksOnRoute = trucks.filter(t => t.routeID === routeID);
    if (trucksOnRoute.length > 0) {
        return res.status(400).json({ 
            error: `Cannot delete route '${routeID}': ${trucksOnRoute.length} truck(s) are assigned to this route` 
        });
    }
    
    routes.splice(index, 1);
    res.json({ success: true, message: `Route '${routeID}' deleted successfully` });
});


// --- Trucks API ---
router.get('/trucks', (req, res) => {
    res.json(trucks);
});

// ... (POST /trucks same)
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
    
    // Robust capacity parsing: strip 'kg', spaces, and extract number
    const maxCapStr = String(newTruck.maxCapacity || '').replace(/kg/gi, '').trim();
    const maxCap = parseFloat(maxCapStr);
    if (isNaN(maxCap) || maxCap <= 0) {
        return res.status(400).json({ error: 'Truck maxCapacity must be a positive number' });
    }
    newTruck.maxCapacity = maxCap; // Store as number

    // Enforce string IDs
    newTruck.truckID = String(newTruck.truckID).trim();
    newTruck.routeID = String(newTruck.routeID).trim();

    // --- FIX: Referential Integrity (Does Route Exist?) ---
    const routeExists = routes.find(r => r.routeID === newTruck.routeID);
    if (!routeExists) {
        return res.status(400).json({ error: `Route '${newTruck.routeID}' does not exist` });
    }

    trucks.push(newTruck);
    res.status(201).json(newTruck);
});


// ... (DELETE /trucks same)
router.delete('/trucks/:truckID', (req, res) => {
    const { truckID } = req.params;
    const index = trucks.findIndex(t => t.truckID === truckID);
    
    if (index === -1) {
        return res.status(404).json({ error: `Truck '${truckID}' not found` });
    }
    
    // Check if any parcels are assigned to this truck
    const assignedParcels = parcels.filter(p => p.assignedTruckId === truckID);
    if (assignedParcels.length > 0) {
        return res.status(400).json({ 
            error: `Cannot delete truck '${truckID}': ${assignedParcels.length} parcel(s) are currently assigned to it` 
        });
    }
    
    trucks.splice(index, 1);

    // --- FIX: Ghost Data Cleanup (Remove Alerts) ---
    // Remove alerts associated with this truck
    for (let i = alerts.length - 1; i >= 0; i--) {
        if (alerts[i].truckID === truckID) {
            alerts.splice(i, 1);
        }
    }

    res.json({ success: true, message: `Truck '${truckID}' deleted successfully` });
});


// --- Parcels API ---
router.get('/parcels', (req, res) => {
    // Pagination support
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 1000;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;

    const result = limit === 1000 ? parcels : parcels.slice(startIndex, endIndex);

    res.json(result);
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
    
    // Robust weight parsing: strip 'kg', spaces, and extract number
    const weightStr = String(newParcel.weight || '').replace(/kg/gi, '').trim();
    const weight = parseFloat(weightStr);
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

router.delete('/parcels/:parcelID', (req, res) => {
    const { parcelID } = req.params;
    const index = parcels.findIndex(p => p.parcelID === parcelID);
    
    if (index === -1) {
        return res.status(404).json({ error: `Parcel '${parcelID}' not found` });
    }
    
    // Check if parcel is already assigned
    if (parcels[index].assignedTruckID) {
        return res.status(400).json({ 
            error: `Cannot delete parcel '${parcelID}': It is currently assigned to truck '${parcels[index].assignedTruckID}'` 
        });
    }
    
    parcels.splice(index, 1);

    // --- FIX: Ghost Data Cleanup (Remove Alerts) ---
    // Remove alerts associated with this parcel
    for (let i = alerts.length - 1; i >= 0; i--) {
        if (alerts[i].parcelID === parcelID) {
            alerts.splice(i, 1);
        }
    }

    res.json({ success: true, message: `Parcel '${parcelID}' deleted successfully` });
});

// --- Assignment API (Step-Based Workflow) ---

// Step 1: Validate parcelID & truckID existence
const step1_validateExistence = (parcelID, truckID) => {
    const parcel = parcels.find(p => p.parcelID === String(parcelID));
    const truck = trucks.find(t => t.truckID === String(truckID));
    
    if (!parcel) {
        return { success: false, reason: 'Parcel not found', code: 404, severity: 'SL-3' };
    }
    if (!truck) {
        return { success: false, reason: 'Truck not found', code: 404, severity: 'SL-3' };
    }
    return { success: true, parcel, truck };
};

// Step 2: Check if parcel is already assigned (uniqueness)
const step2_checkUniqueness = (parcel, truckID) => {
    if (parcel.assignedTruckID) {
        return { 
            success: false, 
            reason: `Parcel already assigned to truck ${parcel.assignedTruckID}`,
            code: 400,
            severity: 'SL-1'
        };
    }
    return { success: true };
};

// Step 3: Fetch route and check destination match
const step3_checkDestination = (parcel, truck) => {
    const route = routes.find(r => r.routeID === truck.routeID);
    
    if (!route) {
        return { success: false, reason: 'Truck has no valid route assigned', code: 400, severity: 'SL-3' };
    }
    
    let truckStops = route.stops;
    if (typeof truckStops === 'string') {
        truckStops = truckStops.split(',').map(s => s.trim());
    }
    
    if (!truckStops.includes(parcel.destination)) {
        return { 
            success: false, 
            reason: `Truck's route does not stop at ${parcel.destination}`,
            code: 400,
            severity: 'SL-1'
        };
    }
    return { success: true, route };
};

// Step 4: Check capacity
const step4_checkCapacity = (parcel, truck) => {
    const currentLoad = parcels
        .filter(p => p.assignedTruckID === truck.truckID)
        .reduce((sum, p) => sum + (Number(p.weight) || 0), 0);

    if (currentLoad + (Number(parcel.weight) || 0) > truck.maxCapacity) {
        return { success: false, reason: 'Truck capacity exceeded', code: 400, severity: 'SL-2' };
    }
    return { success: true, currentLoad };
};

// Step 5: Commit assignment
const step5_commitAssignment = (parcel, truck) => {
    parcel.assignedTruckID = truck.truckID;
    return { success: true };
};

// Main Endpoint - Orchestrates the workflow with logging
router.post('/assignParcel', (req, res) => {
    const { parcelID, truckID } = req.body;
    
    // Generate workflow context
    const workflowId = generateID();
    const workflowLog = {
        workflowId,
        type: 'ASSIGN_PARCEL',
        input: { parcelID, truckID },
        startTime: new Date(),
        steps: [],
        status: 'IN_PROGRESS'
    };
    
    const logStep = (stepName, result) => {
        workflowLog.steps.push({
            stepName,
            status: result.success ? 'SUCCESS' : 'FAILED',
            reason: result.reason || null,
            timestamp: new Date()
        });
    };
    
    // Execute workflow steps
    const step1 = step1_validateExistence(parcelID, truckID);
    logStep('validateExistence', step1);
    if (!step1.success) {
        workflowLog.status = 'FAILED';
        workflowLog.endTime = new Date();
        workflows.push(workflowLog);
        createAlert(step1.severity, `Assignment failed: ${step1.reason}`, parcelID, truckID);
        return res.status(step1.code).json({ error: step1.reason, workflowId });
    }
    
    const { parcel, truck } = step1;
    
    const step2 = step2_checkUniqueness(parcel, truckID);
    logStep('checkUniqueness', step2);
    if (!step2.success) {
        workflowLog.status = 'FAILED';
        workflowLog.endTime = new Date();
        workflows.push(workflowLog);
        createAlert(step2.severity, `Assignment failed: ${step2.reason}`, parcelID, truckID);
        return res.status(step2.code).json({ error: step2.reason, workflowId });
    }
    
    const step3 = step3_checkDestination(parcel, truck);
    logStep('checkDestination', step3);
    if (!step3.success) {
        workflowLog.status = 'FAILED';
        workflowLog.endTime = new Date();
        workflows.push(workflowLog);
        createAlert(step3.severity, `Assignment failed: ${step3.reason}`, parcelID, truckID);
        return res.status(step3.code).json({ error: step3.reason, workflowId });
    }
    
    const step4 = step4_checkCapacity(parcel, truck);
    logStep('checkCapacity', step4);
    if (!step4.success) {
        workflowLog.status = 'FAILED';
        workflowLog.endTime = new Date();
        workflows.push(workflowLog);
        createAlert(step4.severity, `Assignment failed: ${step4.reason}`, parcelID, truckID);
        return res.status(step4.code).json({ error: step4.reason, workflowId });
    }
    
    // All checks passed - commit
    const step5 = step5_commitAssignment(parcel, truck);
    logStep('commitAssignment', step5);
    
    workflowLog.status = 'COMPLETED';
    workflowLog.endTime = new Date();
    workflows.push(workflowLog);
    
    res.json({ 
        success: true, 
        message: `Parcel ${parcel.parcelID} assigned to Truck ${truck.truckID}`,
        workflowId,
        parcel
    });
});

// --- Workflows API ---
router.get('/workflows', (req, res) => {
    const limit = parseInt(req.query.limit) || 50; // Default last 50
    
    // Get last N workflows, newest first
    const result = workflows
        .slice(-limit)
        .reverse()
        .map(w => ({
            workflowId: w.workflowId,
            parcelID: w.input?.parcelID,
            truckID: w.input?.truckID,
            steps: w.steps,
            finalStatus: w.status,
            timestamp: w.startTime
        }));
    
    res.json(result);
});



// --- Status API (AI Tooling) ---
router.get('/status', (req, res) => {
    const unassignedCount = parcels.filter(p => !p.assignedTruckId).length;
    res.json({
        totalRoutes: routes.length,
        totalTrucks: trucks.length,
        totalParcels: parcels.length,
        unassignedParcels: unassignedCount,
        activeAlerts: alerts.length
    });
});

// --- Ops Aggregation API (InQuinon-style Observability) ---
router.get('/ops/aggregate', (req, res) => {
    // --- Alert Aggregations ---
    const totalAlerts = alerts.length;
    
    // Group by severity
    const alertsBySeverity = {
        'SL-1': alerts.filter(a => a.severity === 'SL-1').length,
        'SL-2': alerts.filter(a => a.severity === 'SL-2').length,
        'SL-3': alerts.filter(a => a.severity === 'SL-3').length
    };
    
    // --- Workflow Aggregations ---
    const totalWorkflows = workflows.length;
    const successfulWorkflows = workflows.filter(w => w.status === 'COMPLETED').length;
    const failedWorkflows = workflows.filter(w => w.status === 'FAILED').length;
    
    // Most common failure reasons (from failed workflow steps)
    const failureReasons = {};
    workflows
        .filter(w => w.status === 'FAILED')
        .forEach(w => {
            const failedStep = w.steps?.find(s => s.status === 'FAILED');
            if (failedStep?.reason) {
                failureReasons[failedStep.reason] = (failureReasons[failedStep.reason] || 0) + 1;
            }
        });
    
    const mostCommonFailureReasons = Object.entries(failureReasons)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([reason, count]) => ({ reason, count }));
    
    // Most affected trucks (from failed workflows)
    const affectedTrucks = {};
    workflows
        .filter(w => w.status === 'FAILED')
        .forEach(w => {
            const truckID = w.input?.truckID;
            if (truckID) {
                affectedTrucks[truckID] = (affectedTrucks[truckID] || 0) + 1;
            }
        });
    
    const mostAffectedTrucks = Object.entries(affectedTrucks)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([truckID, failureCount]) => ({ truckID, failureCount }));
    
    // Most affected routes (from alerts that reference trucks)
    const affectedRoutes = {};
    alerts.forEach(a => {
        if (a.truckID) {
            const truck = trucks.find(t => t.truckID === a.truckID);
            if (truck?.routeID) {
                affectedRoutes[truck.routeID] = (affectedRoutes[truck.routeID] || 0) + 1;
            }
        }
    });
    
    const mostAffectedRoutes = Object.entries(affectedRoutes)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([routeID, alertCount]) => ({ routeID, alertCount }));
    
    res.json({
        timestamp: new Date(),
        alerts: {
            total: totalAlerts,
            bySeverity: alertsBySeverity
        },
        workflows: {
            total: totalWorkflows,
            successful: successfulWorkflows,
            failed: failedWorkflows,
            successRate: totalWorkflows > 0 ? ((successfulWorkflows / totalWorkflows) * 100).toFixed(1) + '%' : 'N/A'
        },
        insights: {
            mostCommonFailureReasons,
            mostAffectedTrucks,
            mostAffectedRoutes
        }
    });
});

// --- Ops Summary API (Lightweight) ---
router.get('/ops/summary', (req, res) => {
    // Alert counts
    const totalAlerts = alerts.length;
    const alertsBySeverity = {
        'SL-1': alerts.filter(a => a.severity === 'SL-1').length,
        'SL-2': alerts.filter(a => a.severity === 'SL-2').length,
        'SL-3': alerts.filter(a => a.severity === 'SL-3').length
    };
    
    // Top failure reasons from workflows
    const failureReasons = {};
    workflows
        .filter(w => w.status === 'FAILED')
        .forEach(w => {
            const failedStep = w.steps?.find(s => s.status === 'FAILED');
            if (failedStep?.reason) {
                failureReasons[failedStep.reason] = (failureReasons[failedStep.reason] || 0) + 1;
            }
        });
    
    const topFailureReasons = Object.entries(failureReasons)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([reason, count]) => ({ reason, count }));
    
    // Incident Candidates: Same failure reason occurring N+ times within X minutes
    // Defaults: N=3, X=10 minutes
    const minOccurrences = parseInt(req.query.n) || 3;
    const timeWindowMinutes = parseInt(req.query.x) || 10;
    const timeWindowMs = timeWindowMinutes * 60 * 1000;
    const cutoffTime = new Date(Date.now() - timeWindowMs);
    
    // Group failures by reason within time window
    const recentFailures = {};
    workflows
        .filter(w => w.status === 'FAILED' && new Date(w.startTime) >= cutoffTime)
        .forEach(w => {
            const failedStep = w.steps?.find(s => s.status === 'FAILED');
            if (failedStep?.reason) {
                const reason = failedStep.reason;
                if (!recentFailures[reason]) {
                    recentFailures[reason] = {
                        count: 0,
                        firstOccurrence: w.startTime,
                        lastOccurrence: w.startTime,
                        affectedParcels: new Set(),
                        affectedTrucks: new Set()
                    };
                }
                recentFailures[reason].count++;
                recentFailures[reason].lastOccurrence = w.startTime;
                if (w.input?.parcelID) recentFailures[reason].affectedParcels.add(w.input.parcelID);
                if (w.input?.truckID) recentFailures[reason].affectedTrucks.add(w.input.truckID);
            }
        });
    
    const incidentCandidates = Object.entries(recentFailures)
        .filter(([_, data]) => data.count >= minOccurrences)
        .sort((a, b) => b[1].count - a[1].count)
        .map(([reason, data]) => ({
            reason,
            count: data.count,
            timeWindowMinutes,
            firstOccurrence: data.firstOccurrence,
            lastOccurrence: data.lastOccurrence,
            affectedParcels: Array.from(data.affectedParcels),
            affectedTrucks: Array.from(data.affectedTrucks)
        }));
    
    res.json({
        totalAlerts,
        alertsBySeverity,
        topFailureReasons,
        incidentCandidates
    });
});

module.exports = router;
