// Automation Module Routes
const express = require('express');
const router = express.Router();
const { generateProposals } = require('./optimizer');
const { executeBatch } = require('./batchExecutor');
const { findCheapestPath } = require('./routingEngine');
const mapData = require('./mapData');
const { checkAffectedTrucks } = require('./resiliencyEngine');
const { validateExternalKey, createTender, getReplay } = require('./externalHandler');
const { parcels } = require('../data/store');
// VERIFICATION MIDDLEWARE - Enforced at runtime
const { validateAssignment, validateAdminOperation } = require('../middleware/verificationMiddleware');

// GET /api/v3/audit/optimization-proposals
router.get('/audit/optimization-proposals', (req, res) => {
    try {
        const proposals = generateProposals();
        res.json(proposals);
    } catch (err) {
        console.error("Optimization Error:", err);
        res.status(500).json({ error: "Optimization Engine Failed", details: err.message });
    }
});

// POST /api/v3/execute-optimization
// ENFORCED: validateAssignment middleware runs before execution
router.post('/execute-optimization', validateAssignment, async (req, res) => {
    // Payload: { assignments: [{ parcelID, truckID, priority }, ...] }
    const { assignments } = req.body;

    // Validation already passed via middleware
    console.log('[VERIFICATION] Assignment validation PASSED for', assignments.length, 'items');

    const result = await executeBatch(assignments);

    if (!result.success && result.code) {
        // Handle 409 Conflict specifically for race conditions
        return res.status(result.code).json(result);
    }

    res.json(result);
});

// --- Phase 4: Resiliency & External APIs ---

// POST /api/v3/admin/road-status (Simulates Road Closure)
// ENFORCED: validateAdminOperation middleware runs before execution
router.post('/admin/road-status', validateAdminOperation, (req, res) => {
    const { from, to, isClosed } = req.body;
    try {
        const result = mapData.toggleRoadStatus(from, to, isClosed);

        // Trigger Dynamic Recalculation
        const affected = checkAffectedTrucks(from, to);

        res.json({
            roadUpdate: result,
            impactAnalysis: affected
        });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// POST /api/v3/external/tender (Protected 3PL API)
router.post('/external/tender', validateExternalKey, (req, res) => {
    // Audit: Export all unassigned parcels
    const unassigned = parcels.filter(p => !p.assignedTruckID);

    if (unassigned.length === 0) {
        return res.json({ message: "No unassigned parcels to tender." });
    }

    const manifest = createTender(unassigned);
    res.json(manifest);
});

// GET /api/v3/audit/replay/:batchId (Incident Replay)
router.get('/audit/replay/:batchId', (req, res) => {
    const replay = getReplay(req.params.batchId);
    res.json(replay);
});

// GET /api/v3/routing/cost
// Helper to test Dijkstra directly
router.get('/routing/cost', (req, res) => {
    const { from, to } = req.query;
    if (!from || !to) {
        return res.status(400).json({ error: "Missing 'from' or 'to' parameters" });
    }
    const result = findCheapestPath(from, to);
    res.json(result);
});

module.exports = router;
