import express from "express";
import { adminAuth } from "../middleware/adminAuth.js";
import {
  getAllUsers,
  getAllDocs,
  getDocByIdAdmin,
  deleteDocAdmin,
  deleteUserAdmin,
  updateUserRole,
} from "../controllers/adminController.js";

const router = express.Router();

// ✅ Admin-only routes
router.get("/users", adminAuth, getAllUsers);           // Get all users
router.get("/docs", adminAuth, getAllDocs);            // Get all documents
router.get("/docs/:id", adminAuth, getDocByIdAdmin);   // Get one document by ID
router.delete("/docs/:id", adminAuth, deleteDocAdmin); // Delete document by ID
router.delete("/users/:id", adminAuth, deleteUserAdmin); // Delete user by ID
router.patch("/users/:id", adminAuth, updateUserRole); // Update user role by ID

export default router;
