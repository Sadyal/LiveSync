// src/middleware/verifyDocAccess.js
import Document from '../models/docModel.js';

export const verifyDocAccess = async (req, res, next) => {
  const userId = req.userId; // ✅ Use req.userId from userAuth
  const docId = req.params.id;

  if (!userId) {
    return res.status(401).json({ message: 'Not authenticated' });
  }

  const doc = await Document.findById(docId).catch(() => null);
  if (!doc) {
    return res.status(404).json({ message: 'Document not found' });
  }

  const isOwner = doc.owner.toString() === userId;
  const isCollaborator = doc.collaborators
    .map(id => id.toString())
    .includes(userId);

  if (!isOwner && !isCollaborator) {
    return res.status(403).json({ message: 'You are not allowed to access this document' });
  }

  req.doc = doc;
  next();
};
