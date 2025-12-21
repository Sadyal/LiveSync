// src/middleware/userAuth.js
import jwt from 'jsonwebtoken';
import User from '../models/userModel.js';

const userAuth = async (req, res, next) => {
  try {
    // 1️⃣ Get token from cookies OR Authorization header
    let token = req.cookies?.token;
    if (!token && req.headers.authorization?.startsWith("Bearer ")) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({ message: "Unauthorized access: Token not found" });
    }

    // 2️⃣ Verify JWT
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!decoded?.id) {
      return res.status(401).json({ message: "Unauthorized access: Invalid token payload" });
    }

    // 3️⃣ Find user by ID
    const user = await User.findById(decoded.id).select('_id name email role');
    if (!user) {
      return res.status(401).json({ message: "Unauthorized access: User not found" });
    }

    // 4️⃣ Attach user info to request
    req.userId = user._id.toString(); // always string
    req.user = user;

    next();
  } catch (error) {
    console.error("❌ Error in userAuth middleware:", error.message);
    return res.status(401).json({ message: "Unauthorized access: Token verification failed" });
  }
};

export default userAuth;
