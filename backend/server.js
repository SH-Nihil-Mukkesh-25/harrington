require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.PORT || 5000;
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

const apiRoutes = require('./routes/api');

// ===========================================
// SECURITY MIDDLEWARE
// ===========================================

// 1. Helmet - Security headers
app.use(helmet());

// 2. Rate Limiting - Prevent brute force/DDoS
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: IS_PRODUCTION ? 100 : 1000, // 100 requests per 15min in prod, 1000 in dev
    message: { error: 'Too many requests, please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
});
app.use('/api', limiter);

// 3. CORS - Restrict origins in production
const corsOptions = {
    origin: IS_PRODUCTION 
        ? (process.env.ALLOWED_ORIGINS || 'https://your-frontend.vercel.app').split(',')
        : true, // Allow all in development
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-API-KEY'],
    credentials: true,
    maxAge: 86400 // Cache preflight for 24 hours
};
app.use(cors(corsOptions));

// 4. Body size limits - Prevent large payload attacks
app.use(express.json({ limit: '10kb' })); // Max 10KB JSON body
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// 5. Request logging
app.use(morgan(IS_PRODUCTION ? 'combined' : 'dev'));

// ===========================================
// ROUTES
// ===========================================

app.use('/api', apiRoutes);

// Phase 1: Sentinel Automation Module
const automationRoutes = require('./automation/routes');
app.use('/api/v3', automationRoutes);

// Phase 2: Sentinel Route Optimizer
const tnOptimizerRoutes = require('./routes/tnOptimizer');
app.use('/api/tn-optimizer', tnOptimizerRoutes);

// ===========================================
// ERROR HANDLING
// ===========================================

// Global Error Handler - Never leak stack traces in production
app.use((err, req, res, next) => {
    const statusCode = err.statusCode || 500;
    
    // Log full error for debugging
    console.error(`[ERROR] ${err.message}`, IS_PRODUCTION ? '' : err.stack);
    
    res.status(statusCode).json({
        error: statusCode === 500 ? 'Internal Server Error' : err.message,
        // Only include details in development
        ...(IS_PRODUCTION ? {} : { 
            message: err.message,
            stack: err.stack 
        })
    });
});

// 404 Handler
app.use((req, res) => {
    res.status(404).json({ error: 'Not Found', path: req.path });
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT} (${IS_PRODUCTION ? 'PRODUCTION' : 'DEVELOPMENT'})`);
    if (!IS_PRODUCTION) {
        console.log('[DEV] Rate limiting relaxed for development');
        console.log('[DEV] CORS allowing all origins');
    }
});
