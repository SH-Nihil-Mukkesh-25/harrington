// TMMR v3.0 Sentinel Engine - External & Debugging Handler
const { workflows } = require('../data/store');

// --- Security Middleware ---
const validateExternalKey = (req, res, next) => {
    const apiKey = req.headers['x-api-key'];
    
    // API key from environment (SECURITY: Never hardcode in production)
    const VALID_KEY = process.env.EXTERNAL_API_KEY || (process.env.NODE_ENV !== 'production' ? 'TMMR-PARTNER-8821' : null);
    
    if (!VALID_KEY) {
        console.error('[SECURITY] EXTERNAL_API_KEY not configured in production!');
        return res.status(500).json({ error: "Server configuration error" });
    }

    if (!apiKey || apiKey !== VALID_KEY) {
        return res.status(403).json({ error: "Access Denied: Invalid or Missing API Key." });
    }
    next();
};

/**
 * Generates a 3PL Tender Manifest for unassigned parcels.
 */
const createTender = (parcels) => {
    const manifestId = `MF-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

    return {
        manifestId,
        timestamp: new Date(),
        carrier: "EXTERNAL_PARTNER_NETWORK",
        parcels: parcels.map(p => ({
            id: p.parcelID,
            weight: p.weight,
            destination: p.destination,
            declaredValue: "$100" // Mock value
        })),
        totalWeight: parcels.reduce((sum, p) => sum + (Number(p.weight) || 0), 0),
        status: "TENDER_SUBMITTED"
    };
};

/**
 * Replays a specific batch execution workflow step-by-step.
 */
const getReplay = (batchId) => {
    // Find workflow entries related to this batch (Assuming generated ID stored in 'details' or similar)
    // For V2, we stored batchID in the workflow object implicitly but usually workflowId != batchId.
    // We will scan for workflows created closest to the batch execution.
    // SIMULATION: We just return the specific workflowId if passed, 
    // or filter by type 'BATCH_ASSIGN' if broad match needed.

    const logs = workflows.filter(w => w.type === 'BATCH_ASSIGN' || w.workflowId === batchId);

    return {
        batchId,
        replayData: logs.map(l => ({
            timestamp: l.timestamp || l.startTime,
            action: l.type,
            input: l.input,
            decision: l.status,
            steps: l.steps
        }))
    };
};

module.exports = { validateExternalKey, createTender, getReplay };
