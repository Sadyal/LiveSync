import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import userModel from '../models/userModel.js';
import transporter from '../config/nodemailer.js';
import { EMAIL_VERIFY_TEMPLATE, PASSWORD_RESET_TEMPLATE } from '../config/emailTemplates.js';

export const register = async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ success: false, message: "Please fill all the fields" });
  }

  try {
    const existingUser = await userModel.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new userModel({ name, email, password: hashedPassword });
    await user.save();

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Strict',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    // ✅ Add token in response body
    res.status(201).json({
      success: true,
      message: "Registration successful",
      token,
      user: { id: user._id, name: user.name, email: user.email }
    });

    // Send welcome email (non-blocking)
    transporter.sendMail({
      from: process.env.SMTP_USER,
      to: user.email,
      subject: 'Welcome to Our Service',
      text: `Hello ${user.name},\n\nThank you for registering with us!\n\nBest regards,\nNIKHIL SADYAL`
    }).catch((err) => {
      console.error("Error sending email (non-blocking):", err.message);
    });

  } catch (error) {
    console.error("Error in registration:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: "Email and Password are required" });
  }

  try {
    const user = await userModel.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(400).json({ success: false, message: "Invalid email or password" });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Strict',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    // ✅ Add token in response body
    return res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: { id: user._id, name: user.name, email: user.email }
    });

  } catch (error) {
    console.error("Error in login:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// LOGOUT
export const logout = async (req, res) => {
  try {
    res.clearCookie('token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Strict'
    });

    return res.status(200).json({ success: true, message: "Logout successful" });

  } catch (error) {
    console.error("Error in logout:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// SEND VERIFY OTP
export const sendVerifyOtp = async (req, res) => {
  try {
    const userId = req.userId; // ✅ fixed line
    const user = await userModel.findById(userId);

    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    if (user.isAccountVerified) return res.status(400).json({ success: false, message: "Account already verified" });

    const otp = String(Math.floor(100000 + Math.random() * 900000));
    user.verifyOtp = otp;
    user.verifyOtpExpireAt = Date.now() + 24 * 60 * 60 * 1000;
    await user.save();

    await transporter.sendMail({
      from: process.env.SMTP_USER,
      to: user.email,
      subject: 'Verify Your Account',
       // text: `Hello ${user.name},\n\nYour OTP is: ${otp}. It is valid for 24 hours.\n\nRegards,\nNIKHIL SADYAL`, 
       html: EMAIL_VERIFY_TEMPLATE.replace("{{otp}}",otp).replace("{{email}}",user.email)
    }
  );

    res.status(200).json({ success: true, message: "OTP sent successfully" });

  } catch (error) {
    console.error("Error in sendVerifyOtp:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// verifyEmail — make sure OTP is compared as string
export const verifyEmail = async (req, res) => {
  const { userId, otp } = req.body;

  if (!userId || !otp) {
    return res.status(400).json({ success: false, message: "User ID and OTP required" });
  }

  try {
    const user = await userModel.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (user.isAccountVerified) {
      return res.status(400).json({ success: false, message: "Account already verified" });
    }

    // ✅ Fix: convert both OTPs to string before comparing
    const userOtp = String(user.verifyOtp);
    const inputOtp = String(otp);

    if (userOtp !== inputOtp || Date.now() > user.verifyOtpExpireAt) {
      return res.status(400).json({ success: false, message: "Invalid or expired OTP" });
    }

    user.isAccountVerified = true;
    user.verifyOtp = '';
    user.verifyOtpExpireAt = 0;
    await user.save();

    return res.status(200).json({ success: true, message: "Email verified successfully" });

  } catch (error) {
    console.error("Error in verifyEmail:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// AUTH CHECK - UPDATED
export const isAuthenticated = async (req, res) => {
  try {
    const token = req.cookies.token;

    if (!token) {
      return res.status(200).json({ success: true, isAuthenticated: false });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded?.id) {
      return res.status(200).json({ success: true, isAuthenticated: false });
    }

    const user = await userModel.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ success: false, isAuthenticated: false });
    }

    // ✅ FIXED: Add token to response for frontend to store
    return res.status(200).json({
      success: true,
      isAuthenticated: true,
      token, // ✅ Added line
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        isAccountVerified: user.isAccountVerified
      }
    });

  } catch (error) {
    return res.status(200).json({ success: true, isAuthenticated: false });
  }
};

// SEND RESET OTP
export const sendResetOtp = async (req, res) => {
  const { email } = req.body;

  if (!email) return res.status(400).json({ success: false, message: "Email is required" });

  try {
    const user = await userModel.findOne({ email });
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    if (user.resetOtpExpireAt > Date.now()) {
      return res.status(400).json({ success: false, message: "OTP already sent recently" });
    }

    const otp = String(Math.floor(100000 + Math.random() * 900000));
    user.resetOtp = otp;
    user.resetOtpExpireAt = Date.now() + 15 * 60 * 1000;
    await user.save();

    await transporter.sendMail({
      from: process.env.SMTP_USER,
      to: user.email,
      subject: 'Password Reset OTP',
     // text: `Hello ${user.name},\n\nYour password reset OTP is: ${otp}. It is valid for 15 minutes.\n\nBest regards,\nNIKHIL SADYAL`
     html: PASSWORD_RESET_TEMPLATE.replace("{{otp}}",otp).replace("{{email}}",user.email)
    });

    res.status(200).json({ success: true, message: "Reset OTP sent to your email" });

  } catch (error) {
    console.error("Error in sendResetOtp:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// RESET PASSWORD
export const resetPassword = async (req, res) => {
  const { email, otp, newPassword } = req.body;

  if (!email || !otp || !newPassword) {
    return res.status(400).json({ success: false, message: "Email, OTP, and new password are required" });
  }

  try {
    const user = await userModel.findOne({ email });
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    if (user.resetOtp !== otp || Date.now() > user.resetOtpExpireAt) {
      return res.status(400).json({ success: false, message: "Invalid or expired OTP" });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    user.resetOtp = '';
    user.resetOtpExpireAt = 0;
    await user.save();

    res.status(200).json({ success: true, message: "Password reset successfully" });

  } catch (error) {
    console.error("Error in resetPassword:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};
