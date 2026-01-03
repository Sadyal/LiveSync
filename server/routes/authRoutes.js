import express from "express";
import {
  register,
  login,
  logout,
  sendVerifyOtp,
  verifyEmail,
  isAuthenticated,
  sendResetOtp,
  resetPassword,
} from "../controllers/authController.js";
import userAuth from "../middleware/userAuth.js";

const authRouter = express.Router();

// Auth
authRouter.post("/register", register);
authRouter.post("/login", login);
authRouter.post("/logout", logout);

// Email verification
authRouter.post("/send-verify-otp", userAuth, sendVerifyOtp);
authRouter.post("/verify-account", verifyEmail);

// Auth check
authRouter.post("/is-auth", isAuthenticated);

// Password reset
authRouter.post("/send-reset-otp", sendResetOtp);
authRouter.post("/reset-password", resetPassword);

export default authRouter;
