import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import requestRoutes from './routes/requests.js';
import staffRoutes from './routes/staff.js';
import queueRoutes from './routes/queue.js';
import adminRoutes from './routes/admin.js'; // <-- ADD THIS LINE

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// Set up routes
app.use('/api/auth', authRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/queue', queueRoutes);
app.use('/api/admin', adminRoutes); // <-- ADD THIS LINE

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});