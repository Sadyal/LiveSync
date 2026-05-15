// /config/nodemailer.js
import nodemailer from 'nodemailer';

/**
 * 📧 Create transporter (Universal SMTP - Port 465 for SSL)
 * Optimized for Brevo, SendGrid, and other professional relay services.
 */
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp-relay.brevo.com",
  port: 465, // 🔒 SSL Port for maximum security
  secure: true, // 🔒 Use SSL
  pool: true, // 🚀 Use connection pooling for better performance
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

/**
 * Self-test connection on boot
 */
transporter.verify((error, success) => {
  if (error) {
    console.error("❌ SMTP Configuration Error (Brevo):", error.message);
  } else {
    console.log("🚀 SMTP Service Ready (Brevo)");
  }
});

export default transporter;
