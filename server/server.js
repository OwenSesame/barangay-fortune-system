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

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});