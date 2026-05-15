// /config/nodemailer.js
import nodemailer from 'nodemailer';

/**
 * 📧 Create transporter (Universal SMTP - Port 587 for STARTTLS)
 * Optimized for Brevo/Sendinblue and production environments.
 */
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp-relay.brevo.com",
  port: parseInt(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_PORT == 465, // true for 465, false for 587
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  pool: true, // Use connection pooling
  maxConnections: 3,
  maxMessages: 100,
  tls: {
    rejectUnauthorized: false, // Prevents issues with certain SSL certificates
  },
});

/**
 * Self-test connection on boot
 */
transporter.verify((error, success) => {
  if (error) {
    console.error("❌ SMTP Configuration Error:", error.message);
  } else {
    console.log("🚀 SMTP Service Ready (Brevo)");
  }
});

export default transporter;

