// server/models/docModel.js

import mongoose from 'mongoose';

const docSchema = new mongoose.Schema({
  _id: String,  // UUID string
  content: {
    type: Object,
    required: true,
    default: { ops: [] },
  },
  title: {
    type: String,
    default: "",  // Title field for renaming
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user',
    required: true,
  },
  collaborators: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user'
  }]
}, { timestamps: true });

const Document = mongoose.model('Document', docSchema);
export default Document;
