/**
 * TMMR Admin Authentication Middleware
 * Protects critical administrative endpoints from unauthorized access
 * 
 * For production: Replace with JWT/OAuth2 or integrate with your auth provider
 */

/**
 * Admin API Key Authentication
 * Requires X-Admin-Key header for protected operations
 */
const requireAdminAuth = (req, res, next) => {
    const adminKey = req.headers['x-admin-key'];
    
    // Get admin key from environment (REQUIRED in production)
    const VALID_ADMIN_KEY = process.env.ADMIN_API_KEY || 
        (process.env.NODE_ENV !== 'production' ? 'TMMR-ADMIN-DEV-KEY' : null);
    
    // In production, fail if admin key not configured
    if (!VALID_ADMIN_KEY) {
        console.error('[SECURITY] ADMIN_API_KEY not configured in production!');
        return res.status(500).json({ 
            error: 'Server configuration error',
            message: 'Admin authentication not configured'
        });
    }
    
    // Validate the provided key
    if (!adminKey) {
        return res.status(401).json({ 
            error: 'Unauthorized',
            message: 'X-Admin-Key header is required for this operation'
        });
    }
    
    if (adminKey !== VALID_ADMIN_KEY) {
        console.warn(`[SECURITY] Invalid admin key attempt from ${req.ip}`);
        return res.status(403).json({ 
            error: 'Forbidden',
            message: 'Invalid admin key'
        });
    }
    
    // Log admin action for audit
    console.log(`[ADMIN] Authorized action: ${req.method} ${req.path} from ${req.ip}`);
    
    next();
};

/**
 * Optional: Rate limit specifically for admin endpoints
 * More restrictive than general API rate limiting
 */
const adminRateLimiter = (windowMs = 60000, maxRequests = 10) => {
    const requests = new Map();
    
    return (req, res, next) => {
        const key = req.headers['x-admin-key'] || req.ip;
        const now = Date.now();
        const windowStart = now - windowMs;
        
        // Clean old entries
        const existing = requests.get(key) || [];
        const recent = existing.filter(time => time > windowStart);
        
        if (recent.length >= maxRequests) {
            return res.status(429).json({
                error: 'Too Many Requests',
                message: `Admin rate limit exceeded. Try again in ${Math.ceil(windowMs / 1000)} seconds.`
            });
        }
        
        recent.push(now);
        requests.set(key, recent);
        next();
    };
};

/**
 * Middleware for operations that require confirmation
 * Adds an extra safety check for destructive operations
 */
const requireConfirmation = (req, res, next) => {
    const confirmation = req.headers['x-confirm-action'];
    
    if (confirmation !== 'true' && confirmation !== '1') {
        return res.status(400).json({
            error: 'Confirmation Required',
            message: 'This is a destructive operation. Set X-Confirm-Action: true header to proceed.',
            destructive: true
        });
    }
    
    next();
};

module.exports = { 
    requireAdminAuth, 
    adminRateLimiter, 
    requireConfirmation 
};
