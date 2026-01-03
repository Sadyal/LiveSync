import express from "express";
import cors from "cors";
import "dotenv/config";
import cookieParser from "cookie-parser";
import http from "http";

import connectDB from "./config/mongodb.js";
import authRouter from "./routes/authRoutes.js";
import userRouter from "./routes/userRoutes.js";
import docRouter from "./routes/docRoutes.js";
import adminRouter from "./routes/adminRoutes.js";
import setupSocket from "./socket.js";

const app = express();

// REQUIRED for Render (cookies behind proxy)
app.set("trust proxy", 1);

const PORT = process.env.PORT || 4000;

// Connect MongoDB
connectDB();

// Middlewares
app.use(express.json());
app.use(cookieParser());

// ✅ FINAL CORS — NEVER THROWS ERROR
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow Postman, server-to-server, mobile apps
      if (!origin) return callback(null, true);

      // Allow ALL Vercel domains (preview + production)
      if (origin.endsWith(".vercel.app")) {
        return callback(null, true);
      }

      // Block others silently (NO ERROR)
      return callback(null, false);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Health check
app.get("/", (req, res) => {
  res.status(200).send("Welcome to the server!");
});

// API routes
app.use("/api/auth", authRouter);
app.use("/api/user", userRouter);
app.use("/api/docs", docRouter);
app.use("/api/admin", adminRouter);

// Socket.io
const server = http.createServer(app);
setupSocket(server);

// Start server
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
