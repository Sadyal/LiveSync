// src/routes/docRoutes.js
import express from 'express';
import {
  getDocById,
  createDoc,
  shareDoc,
  getAllDocs,
  renameDoc,
  deleteDoc
} from '../controllers/docController.js';

import userAuth from '../middleware/userAuth.js';
import { verifyDocAccess } from '../middleware/verifyDocAccess.js';

const router = express.Router();

// ✅ Get all documents for the logged-in user
router.get('/', userAuth, getAllDocs);

// ✅ Create a document
router.post('/', userAuth, createDoc);

// ✅ Rename document
router.patch('/:id', userAuth, renameDoc);

// ✅ Delete document (owner only)
router.delete('/:id', userAuth, deleteDoc);

// ✅ Share document with collaborator
router.post('/:id/share', userAuth, shareDoc);

// ✅ Get single document (used by editor)
router.get('/:id', userAuth, verifyDocAccess, getDocById);

export default router; // ✅ Default export
