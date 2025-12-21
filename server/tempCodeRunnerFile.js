import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import cookieParser from 'cookie-parser';
import connectDB from './config/mongodb.js';
import authRouter from './routes/authRoutes.js';

const app = express();
const PORT = process.env.PORT || 4000;

// Connect to MongoDB
connectDB();

// Middleware
app.use(express.json());
app.use(cookieParser());

// ✅ Fix CORS to allow cookies from frontend
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000', // frontend URL
  credentials: true
}));

// API Test Route
app.get('/', (req, res) => {
  res.send('Welcome to the server!');
});

// Auth Routes
app.use('/api/auth', authRouter);

// Server start
app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
