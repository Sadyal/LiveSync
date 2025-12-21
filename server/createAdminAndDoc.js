// createAdminAndDoc.js
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { v4 as uuidv4 } from "uuid";

dotenv.config();

import User from "./models/userModel.js";
import Document from "./models/docModel.js";

const adminEmail = "nikhilsadyal00@gmail.com";
const adminName = "Nikhil Sadyal";
const adminUsername = "admin";
const hashedPassword = "$2b$10$GaI30RGhCZmKYGil3v7Tq.UfZe7LMGRnh5yqC2tJstvAU51NDF50S";

const run = async () => {
  try {
    // 1️⃣ Connect to MongoDB Atlas with explicit dbName
    await mongoose.connect(process.env.MONGODB_URI, {
      dbName: "mern-auth", // ✅ specify database name
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("MongoDB connected");

    // 2️⃣ Check if admin exists
    let admin = await User.findOne({ email: adminEmail });

    if (!admin) {
      // 3️⃣ Create admin with role: "admin"
      admin = new User({
        name: adminName,
        username: adminUsername,
        email: adminEmail,
        password: hashedPassword,
        role: "admin", // ✅ important change
      });

      await admin.save();
      console.log("Admin user created:", admin._id);
    } else {
      console.log("Admin already exists:", admin._id);
    }

    // 4️⃣ Create a document for admin with UUID _id
    const docId = uuidv4();
    const doc = new Document({
      _id: docId,
      title: "Admin Test Document",
      content: { ops: [] }, // empty Quill content
      owner: admin._id,
    });

    const savedDoc = await doc.save();
    console.log("Document created:", savedDoc._id);

    // 5️⃣ Generate JWT for admin
    const token = jwt.sign({ id: admin._id }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });

    console.log("Admin JWT token:", token);

    process.exit(0);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
};

run();
