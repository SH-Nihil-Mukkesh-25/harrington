const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const app = express();
const PORT = process.env.PORT || 5000;

const apiRoutes = require('./routes/api');

// Security & Observability Middleware
app.use(helmet()); // Security Headers
app.use(morgan('dev')); // Request Logging
app.use(cors());
app.use(express.json());

app.use('/api', apiRoutes);

// --- Phase 1: Sentinel Automation Module ---
const automationRoutes = require('./automation/routes');
app.use('/api/v3', automationRoutes);

// --- Phase 2: Sentinel Route Optimizer ---
const tnOptimizerRoutes = require('./routes/tnOptimizer');
app.use('/api/tn-optimizer', tnOptimizerRoutes);

// Global Error Handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        error: 'Internal Server Error',
        message: err.message || 'Something went wrong!'
    });
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
