import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

import authRoutes from './routes/auth.js';
import requestRoutes from './routes/requests.js';
import staffRoutes from './routes/staff.js';
import queueRoutes from './routes/queue.js';
import adminRoutes from './routes/admin.js';
import settingsRoutes from './routes/settings.js';

const app = express();

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads')); // Grants access to view uploaded images

// Set up routes
app.use('/api/auth', authRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/queue', queueRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/settings', settingsRoutes);

// Global error handling middleware for Express
app.use((err, req, res, next) => {
    console.error('Express Error:', err.stack);
    res.status(500).json({ error: 'Something went wrong on the server!' });
});

// Prevent Node.js from crashing on uncaught exceptions
process.on('uncaughtException', (err) => {
    console.error('CRITICAL ERROR - Uncaught Exception:', err);
    // You can optionally log this to a file instead of crashing
});

// Prevent Node.js from crashing on unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
    console.error('CRITICAL ERROR - Unhandled Rejection at:', promise, 'reason:', reason);
});

const PORT = process.env.PORT || 5000;

// Only listen if not in a test environment
if (process.env.NODE_ENV !== 'test') {
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
}

export default app;