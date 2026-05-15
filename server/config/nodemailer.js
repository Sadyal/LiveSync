// /config/nodemailer.js
import nodemailer from 'nodemailer';

/**
 * 📧 Create transporter (Universal SMTP - Port 465 for SSL)
 * Optimized for Brevo, SendGrid, and other professional relay services.
 */
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp-relay.brevo.com",
  port: process.env.SMTP_PORT || 587,
  secure: process.env.SMTP_PORT == 465 || process.env.SMTP_PORT === '465', // Use TLS based on port
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  tls: {
    rejectUnauthorized: false, // Helps with local dev certificate issues
  },
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
