// /controllers/userController.js
import userModel from "../models/userModel.js";

export const getUserData = async (req, res) => {
  try {
    const userId = req.userId; // ✅ Correct access: set by userAuth middleware

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized: No user ID provided" });
    }

 const user = await userModel.findById(userId);
if (!user) {
  return res.status(401).json({ message: "Unauthorized: User not found" });
}


    return res.status(200).json({
      success: true,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        isAccountVerified: user.isAccountVerified
      }
    });

  } catch (error) {
    console.error("Error in getUserData:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
