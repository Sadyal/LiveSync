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

// 🔐 REQUIRED for Render (secure cookies behind proxy)
app.set("trust proxy", 1);

const PORT = process.env.PORT || 4000;

// ✅ Connect to MongoDB
connectDB();

// ✅ Middleware
app.use(express.json());
app.use(cookieParser());

// 🔴 FINAL DYNAMIC CORS (NO ORIGIN MISMATCH POSSIBLE)
const allowedOrigins = [
  "https://livesync-eight.vercel.app",
];

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow non-browser requests (Postman, server-to-server)
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      console.error("❌ CORS BLOCKED ORIGIN:", origin);
      return callback(new Error("CORS blocked: " + origin), false);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// 🔎 TEMP DEBUG — SHOW REAL ORIGIN (REMOVE LATER)
app.use((req, res, next) => {
  console.log("🌍 REQUEST ORIGIN:", req.headers.origin);
  next();
});

// ✅ Health check route
app.get("/", (req, res) => {
  res.status(200).send("Welcome to the server!");
});

// ✅ API routes
app.use("/api/auth", authRouter);
app.use("/api/user", userRouter);
app.use("/api/docs", docRouter);
app.use("/api/admin", adminRouter);

// ✅ TEMP DEBUG ROUTE
app.patch("/api/docs/test", (req, res) => {
  res.json({ message: "PATCH /api/docs/test works fine!" });
});

// ✅ Attach socket.io
const server = http.createServer(app);
setupSocket(server);

// ✅ Start server
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
