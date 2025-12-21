// backend/setupSocket.js
import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import Document from "./models/docModel.js";

export default function setupSocket(server) {
  const io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || "http://localhost:5173",
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  // Map userId -> Set of socketIds (handles multi-device)
  const userSockets = new Map();

  // Auth middleware (already in your code) — extracts decoded.id into socket.userId
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    console.log("📥 Received token in socket:", !!token ? "[present]" : "[missing]");

    if (!token) {
      console.log("❌ Missing token");
      return next(new Error("Authentication token missing"));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      // ⚡ FIX: ensure socket.userId is a string to avoid undefined issues
      socket.userId = decoded.id?.toString(); 
      console.log("✅ Socket Auth Success. UserID:", socket.userId);
      next();
    } catch (err) {
      console.log("❌ Socket Auth Failed:", err.message);
      return next(new Error("Authentication failed"));
    }
  });

  // Helper: send event to a socket id OR to all sockets of a userId
  const sendToSocketOrUser = (to, event, payload) => {
    // If 'to' is a valid socket.id in current server
    if (io.sockets.sockets.get(to)) {
      io.to(to).emit(event, payload);
      return;
    }
    // Otherwise treat to as userId and send to all sockets mapped to that user
    const sockets = userSockets.get(to);
    if (sockets && sockets.size) {
      sockets.forEach((sid) => {
        io.to(sid).emit(event, payload);
      });
      return;
    }
    console.warn(`[socket] no destination found for "${to}"`);
  };

  io.on("connection", (socket) => {
    console.log("🔌 Socket connected:", socket.id, "| User:", socket.userId);

    // Add to userSockets map
    if (!userSockets.has(socket.userId)) userSockets.set(socket.userId, new Set());
    userSockets.get(socket.userId).add(socket.id);

    // Send this socket its id (helpful for debugging / manual call testing)
    socket.emit("your-socket-id", { socketId: socket.id, userId: socket.userId });

    // Clean-up on disconnect
    socket.on("disconnect", () => {
      console.log("⛔ Socket disconnected:", socket.id);
      const set = userSockets.get(socket.userId);
      if (set) {
        set.delete(socket.id);
        if (set.size === 0) userSockets.delete(socket.userId);
      }
    });

    // ---------- Document logic (keeps your existing behavior) ----------
    socket.on("get-document", async (documentId) => {
      console.log("📩 get-document event:", documentId);

      if (!documentId || !socket.userId) {
        console.log("❌ Invalid documentId or userId");
        return;
      }

      const doc = await Document.findById(documentId).catch((err) => {
        console.error("❌ Error fetching doc:", err.message);
        return null;
      });

      if (!doc) {
        console.log("❌ Document not found:", documentId);
        socket.emit("access-denied");
        return;
      }

      const isOwner = doc.owner.toString() === socket.userId;
      const isCollaborator = doc.collaborators
        .map((id) => id.toString())
        .includes(socket.userId);

      console.log("🧾 doc.owner:", doc.owner.toString());
      console.log("👤 currentUser:", socket.userId);
      console.log("✅ isOwner:", isOwner, "| 🤝 isCollaborator:", isCollaborator);

      if (!isOwner && !isCollaborator) {
        console.log("❌ Access denied: not owner or collaborator");
        socket.emit("access-denied");
        return;
      }

      socket.join(documentId);
      socket.emit("load-document", doc.content);
      console.log("📤 load-document emitted to client");

      // Collaborative editing
      socket.on("send-changes", (delta) => {
        socket.broadcast.to(documentId).emit("receive-changes", delta);
      });

      socket.on("save-document", async (data) => {
        await Document.findByIdAndUpdate(documentId, { content: data });
      });
    });

    // ---------- WebRTC signaling for video calls ----------
    // data: { to: <socketId|userId>, offer }
    socket.on("call-user", (data) => {
      console.log("📞 call-user from", socket.id, "to", data.to);
      sendToSocketOrUser(data.to, "call-made", {
        offer: data.offer,
        from: socket.id,
        fromUser: socket.userId,
      });
    });

    // data: { to: <socketId|userId>, answer }
    socket.on("make-answer", (data) => {
      console.log("✅ make-answer from", socket.id, "to", data.to);
      sendToSocketOrUser(data.to, "answer-made", {
        answer: data.answer,
        from: socket.id,
        fromUser: socket.userId,
      });
    });

    // data: { to: <socketId|userId>, candidate }
    socket.on("ice-candidate", (data) => {
      // forwarded ICE candidate
      sendToSocketOrUser(data.to, "ice-candidate", {
        candidate: data.candidate,
        from: socket.id,
        fromUser: socket.userId,
      });
    });

    // hang up
    socket.on("hang-up", (data) => {
      sendToSocketOrUser(data.to, "call-ended", { from: socket.id });
    });
  });

  return io;
}
