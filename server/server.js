import express from "express";
import cors from "cors";
import "dotenv/config";
import cookieParser from "cookie-parser";
import http from "http";

// Database & Route Imports
import connectDB from "./config/mongodb.js";
import authRouter from "./routes/authRoutes.js";
import userRouter from "./routes/userRoutes.js";
import docRouter from "./routes/docRoutes.js";
import adminRouter from "./routes/adminRoutes.js";

// Socket setup
import setupSocket from "./socket.js";

const app = express();
const PORT = process.env.PORT || 4000;

/**
 * Trust proxy is required when deploying behind services like Render/Vercel.
 * It ensures secure cookies (httpOnly, sameSite) work correctly.
 */
app.set("trust proxy", 1);

/**
 * Establish database connection before handling any requests.
 */
connectDB();

/**
 * Core middlewares:
 * - express.json(): parses incoming JSON request bodies
 * - cookieParser(): allows reading cookies from requests
 */
app.use(express.json());
app.use(cookieParser());

/**
 * CORS configuration:
 * - Allows requests from Vercel deployments (frontend)
 * - Allows tools like Postman (no origin)
 * - Blocks unknown origins silently (no crash)
 */
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow server-to-server or tools like Postman
      if (!origin) return callback(null, true);

      // Allow all Vercel deployments (production + preview)
      if (origin.endsWith(".vercel.app")) {
        return callback(null, true);
      }

      // Reject all other origins
      return callback(null, false);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

/**
 * Basic health check route.
 * Useful for testing server status or deployment checks.
 */
app.get("/", (req, res) => {
  res.status(200).send("Server is running");
});

/**
 * API Routes
 */
app.use("/api/auth", authRouter);
app.use("/api/user", userRouter);
app.use("/api/docs", docRouter);
app.use("/api/admin", adminRouter);

/**
 * Create HTTP server and attach Socket.IO
 * This allows both REST API and real-time communication
 */
const server = http.createServer(app);
setupSocket(server);

/**
 * Start server
 */
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
