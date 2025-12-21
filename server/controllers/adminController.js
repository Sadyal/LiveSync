import userModel from "../models/userModel.js";
import docModel from "../models/docModel.js";

// ✅ Get all users
export const getAllUsers = async (req, res) => {
  try {
    const users = await userModel.find().select("-password"); // exclude passwords
    res.status(200).json({ success: true, users });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ✅ Get a single user by ID
export const getUserById = async (req, res) => {
  try {
    const user = await userModel.findById(req.params.id).select("-password");
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    res.status(200).json({ success: true, user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ✅ Update user role (user ↔ admin)
export const updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;
    if (!role || !["user", "admin"].includes(role)) {
      return res.status(400).json({ success: false, message: "Invalid role" });
    }
    const user = await userModel.findByIdAndUpdate(req.params.id, { role }, { new: true }).select("-password");
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    res.status(200).json({ success: true, user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ✅ Get all documents
export const getAllDocs = async (req, res) => {
  try {
    const docs = await docModel.find().populate("owner", "name email");
    res.status(200).json({ success: true, docs });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ✅ Get a single document by ID
export const getDocByIdAdmin = async (req, res) => {
  try {
    const doc = await docModel.findById(req.params.id).populate("owner", "name email");
    if (!doc) return res.status(404).json({ success: false, message: "Document not found" });
    res.status(200).json({ success: true, doc });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ✅ Delete a document by ID
export const deleteDocAdmin = async (req, res) => {
  try {
    const doc = await docModel.findByIdAndDelete(req.params.id);
    if (!doc) return res.status(404).json({ success: false, message: "Document not found" });
    res.status(200).json({ success: true, message: "Document deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ✅ Delete a user by ID
export const deleteUserAdmin = async (req, res) => {
  try {
    const user = await userModel.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    res.status(200).json({ success: true, message: "User deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
