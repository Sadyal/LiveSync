import { v4 as uuidv4 } from 'uuid';
import Document from '../models/docModel.js';
import userModel from '../models/userModel.js';

// ✅ GET /api/docs - Fetch all owned/shared documents
export const getAllDocs = async (req, res) => {
  try {
    const userId = req.userId;
    const docs = await Document.find({
      $or: [{ owner: userId }, { collaborators: userId }]
    }).sort({ updatedAt: -1 });

    res.status(200).json(docs);
  } catch (error) {
    console.error("Error fetching documents:", error);
    res.status(500).json({ message: "Failed to fetch documents" });
  }
};

// ✅ GET /api/docs/:id - Get document by ID (requires verifyDocAccess middleware)
export const getDocById = async (req, res) => {
  try {
    const doc = req.doc; // from verifyDocAccess middleware
    res.status(200).json(doc);
  } catch (error) {
    res.status(500).json({
      message: 'Error retrieving document',
      error: error.message
    });
  }
};

// ✅ POST /api/docs - Create a new document
export const createDoc = async (req, res) => {
  const owner = req.userId;
  const newId = uuidv4();
  const content = req.body.content || { ops: [] };

  try {
    const newDoc = await Document.create({
      _id: newId,
      content,
      title: "",
      owner,
      collaborators: []
    });

    res.status(201).json({
      success: true,
      message: 'Document created successfully',
      id: newDoc._id
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error creating document',
      error: error.message
    });
  }
};

// ✅ PATCH /api/docs/:id - Rename a document
export const renameDoc = async (req, res) => {
  const { id } = req.params;
  const { title } = req.body;
  const userId = req.userId.toString();

  if (!title || title.trim() === "") {
    return res.status(400).json({ message: "Title is required" });
  }

  try {
    const doc = await Document.findById(id);
    if (!doc) return res.status(404).json({ message: "Document not found" });

    const ownerId = doc.owner.toString();
    const collaboratorIds = doc.collaborators.map(c => c.toString());

    const isOwner = ownerId === userId;
    const isCollaborator = collaboratorIds.includes(userId);

    if (!isOwner && !isCollaborator) {
      console.warn("🚫 Access denied to rename:", {
        userId,
        ownerId,
        collaboratorIds
      });
      return res.status(403).json({ message: "Access denied" });
    }

    doc.title = title.trim();
    await doc.save();

    res.status(200).json({
      success: true,
      message: "Title updated",
      id: doc._id,
      title: doc.title
    });
  } catch (error) {
    console.error("❌ Rename failed:", error);
    res.status(500).json({ message: "Rename failed", error: error.message });
  }
};

// ✅ POST /api/docs/:id/share - Share document with another user
export const shareDoc = async (req, res) => {
  const { id: docId } = req.params;
  const { email } = req.body;
  const userId = req.userId;

  if (!email) return res.status(400).json({ message: 'Email is required' });

  try {
    const doc = await Document.findById(docId);
    if (!doc) return res.status(404).json({ message: 'Document not found' });

    if (doc.owner.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'Only the owner can share this document' });
    }

    const userToShare = await userModel.findOne({ email });
    if (!userToShare) return res.status(404).json({ message: 'User to share with not found' });

    const alreadyAdded = doc.collaborators.some(
      collabId => collabId.toString() === userToShare._id.toString()
    );

    if (alreadyAdded) {
      return res.status(400).json({ message: 'User is already a collaborator' });
    }

    doc.collaborators.push(userToShare._id);
    await doc.save();

    res.status(200).json({ message: `Document shared with ${email}` });

  } catch (error) {
    console.error("❌ Share failed:", error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

// ✅ DELETE /api/docs/:id - Delete a document (owner only)
export const deleteDoc = async (req, res) => {
  try {
    const { id } = req.params;
    const doc = await Document.findById(id);

    if (!doc) {
      return res.status(404).json({ message: "Document not found" });
    }

    // Only owner can delete
    if (doc.owner.toString() !== req.userId.toString()) {
      return res.status(403).json({ message: "Not authorized to delete this document" });
    }

    await Document.findByIdAndDelete(id);
    res.json({ message: "Document deleted successfully" });
  } catch (error) {
    console.error("❌ Error deleting document:", error);
    res.status(500).json({ message: "Server error" });
  }
};
