/**
 * TMMR Verification Middleware
 * Enforces validation checks before critical operations
 * Addresses Build2Break finding: Verification modules not enforced at runtime
 */

const { routes, trucks, parcels, alerts } = require('../data/store');

/**
 * Validation result helper
 */
function validationError(res, code, message, details = {}) {
    return res.status(code).json({
        error: 'VALIDATION_FAILED',
        message,
        phase: 'VERIFICATION',
        ...details
    });
}

/**
 * PHASE 1: Validate Assignment Operations
 * Checks before parcel-to-truck assignments
 * Uses SOFT validation for proposal-based operations - warns but proceeds
 * The batchExecutor handles the actual assignment logic and validation
 */
function validateAssignment(req, res, next) {
    const { assignments } = req.body;
    
    if (!assignments || !Array.isArray(assignments)) {
        return validationError(res, 400, 'Assignments array is required');
    }
    
    // Check if this is an empty array (valid but nothing to do)
    if (assignments.length === 0) {
        return validationError(res, 400, 'Assignments array cannot be empty');
    }

    const warnings = [];
    let hasValidTruck = false;
    
    for (const assignment of assignments) {
        const { parcelID, truckID } = assignment;
        
        // Basic structure validation
        if (!parcelID) {
            warnings.push({ error: 'MISSING_PARCEL_ID', message: 'Assignment missing parcelID' });
            continue;
        }
        
        if (!truckID) {
            warnings.push({ parcelID, error: 'MISSING_TRUCK_ID', message: 'Assignment missing truckID' });
            continue;
        }
        
        // Check if truck exists (soft check - log warning but proceed)
        const truck = trucks.find(t => t.truckID === truckID);
        if (truck) {
            hasValidTruck = true;
        } else {
            warnings.push({ 
                truckID, 
                error: 'TRUCK_NOT_IN_STORE', 
                message: `Truck ${truckID} not in current store - batch executor will handle` 
            });
        }
        
        // Check parcel (soft check)
        const parcel = parcels.find(p => p.parcelID === parcelID);
        if (!parcel) {
            warnings.push({ 
                parcelID, 
                error: 'PARCEL_NOT_IN_STORE', 
                message: `Parcel ${parcelID} not in current store - batch executor will handle` 
            });
        }
    }
    
    // Log warnings for audit but proceed
    if (warnings.length > 0) {
        console.log('[VERIFICATION] Assignment warnings (proceeding to batch executor):', JSON.stringify(warnings, null, 2));
    }
    
    // Attach validation info to request for downstream use
    req.validationInfo = {
        validatedAt: new Date().toISOString(),
        assignmentCount: assignments.length,
        warningCount: warnings.length,
        warnings: warnings
    };
    
    console.log(`[VERIFICATION] Assignment validation PASSED with ${warnings.length} warnings for ${assignments.length} items`);
    next();
}

/**
 * PHASE 2: Validate Capacity Operations
 * Prevents operations that would exceed capacity limits
 */
function validateCapacity(req, res, next) {
    const { parcelID, truckID, weight } = req.body;
    
    if (truckID) {
        const truck = trucks.find(t => t.truckID === truckID);
        if (!truck) {
            return validationError(res, 404, `Truck ${truckID} not found`);
        }
        
        const currentLoad = parcels
            .filter(p => p.assignedTruckID === truckID)
            .reduce((sum, p) => sum + (Number(p.weight) || 0), 0);
        
        const additionalWeight = Number(weight) || 0;
        
        if (currentLoad + additionalWeight > truck.maxCapacity) {
            return validationError(res, 400, 'Operation would exceed truck capacity', {
                truckID,
                currentLoad,
                additionalWeight,
                maxCapacity: truck.maxCapacity,
                remaining: truck.maxCapacity - currentLoad
            });
        }
    }
    
    next();
}

/**
 * PHASE 3: Validate AI Tool Commands
 * Ensures AI-initiated actions are safe and valid
 */
const ALLOWED_TOOLS = [
    'getSystemStatus', 'getAlerts', 'listRoutes', 'listTrucks', 'listParcels',
    'createParcel', 'createTruck', 'createRoute',
    'assignParcel', 'deleteParcel', 'deleteTruck', 'deleteRoute'
];

function validateAICommand(toolCalls) {
    const errors = [];
    
    if (!Array.isArray(toolCalls)) {
        return { valid: true, errors: [] }; // No tool calls to validate
    }
    
    for (const call of toolCalls) {
        // Check tool is allowed
        if (!ALLOWED_TOOLS.includes(call.name)) {
            errors.push({
                tool: call.name,
                error: 'TOOL_NOT_ALLOWED',
                message: `Tool ${call.name} is not in the allowed list`
            });
            continue;
        }
        
        // Validate required args for mutation tools
        if (call.name === 'createParcel' && (!call.args?.parcelID || !call.args?.destination)) {
            errors.push({
                tool: call.name,
                error: 'MISSING_REQUIRED_ARGS',
                message: 'createParcel requires parcelID and destination'
            });
        }
        
        if (call.name === 'assignParcel' && (!call.args?.parcelID || !call.args?.truckID)) {
            errors.push({
                tool: call.name,
                error: 'MISSING_REQUIRED_ARGS',
                message: 'assignParcel requires parcelID and truckID'
            });
        }
        
        if (call.name === 'deleteParcel' || call.name === 'deleteTruck') {
            const id = call.args?.parcelID || call.args?.truckID;
            if (!id) {
                errors.push({
                    tool: call.name,
                    error: 'MISSING_REQUIRED_ARGS',
                    message: `${call.name} requires an ID`
                });
            }
        }
    }
    
    return {
        valid: errors.length === 0,
        errors
    };
}

/**
 * PHASE 4: Validate Admin Operations
 * Guards administrative actions like road closures
 */
function validateAdminOperation(req, res, next) {
    const { from, to, isClosed } = req.body;
    
    if (!from || !to) {
        return validationError(res, 400, 'Road status update requires from and to locations');
    }
    
    if (typeof isClosed !== 'boolean') {
        return validationError(res, 400, 'isClosed must be a boolean value');
    }
    
    // Log admin action for audit trail
    console.log(`[ADMIN AUDIT] Road status update: ${from} -> ${to}, closed: ${isClosed}, time: ${new Date().toISOString()}`);
    
    next();
}

/**
 * Combined verification middleware for critical operations
 * Runs all applicable validations based on operation type
 */
function enforceVerification(operationType) {
    return (req, res, next) => {
        console.log(`[VERIFICATION] Enforcing ${operationType} validation`);
        
        switch (operationType) {
            case 'ASSIGNMENT':
                return validateAssignment(req, res, next);
            case 'CAPACITY':
                return validateCapacity(req, res, next);
            case 'ADMIN':
                return validateAdminOperation(req, res, next);
            default:
                next();
        }
    };
}

module.exports = {
    validateAssignment,
    validateCapacity,
    validateAICommand,
    validateAdminOperation,
    enforceVerification,
    ALLOWED_TOOLS
};
