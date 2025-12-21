// /config/nodemailer.js
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',  // ✅ Use Gmail service instead of custom host
  auth: {
    user: process.env.SMTP_USER,     // Gmail address
    pass: process.env.SMTP_PASS      // 16-character App Password
  }
});

transporter.verify((error, success) => {
  if (error) {
    console.error("❌ Email transporter error:", error);
  } else {
    console.log("✅ Email transporter connected successfully");
  }
});

export default transporter;
