import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import cookieParser from 'cookie-parser';
import http from 'http';

import connectDB from './config/mongodb.js';
import authRouter from './routes/authRoutes.js';
import userRouter from './routes/userRoutes.js';
import docRouter from './routes/docRoutes.js';
import adminRouter from './routes/adminRoutes.js'; // ✅ Import admin routes
import setupSocket from './socket.js';

const app = express();
const PORT = process.env.PORT || 4000;

// ✅ Connect to MongoDB
connectDB();

// ✅ Middleware
app.use(express.json());
app.use(cookieParser());
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));

// ✅ Health check route
app.get('/', (req, res) => {
  res.send('Welcome to the server!');
});

// ✅ API routes
app.use('/api/auth', authRouter);
app.use('/api/user', userRouter);
app.use('/api/docs', docRouter);
app.use('/api/admin', adminRouter); // ✅ Mount admin routes

// ✅ TEMP DEBUG ROUTE (optional)
app.patch('/api/docs/test', (req, res) => {
  res.json({ message: 'PATCH /api/docs/test works fine!' });
});

// ✅ Attach socket.io to server
const server = http.createServer(app);
setupSocket(server);

// ✅ Start server
server.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
