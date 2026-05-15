// /config/nodemailer.js
import nodemailer from 'nodemailer';

/**
 * 📧 Create transporter (Using Port 2525)
 * Port 2525 is a common alternative to 587 and is less likely to be blocked by cloud firewalls.
 */
const transporter = nodemailer.createTransport({
  host: "smtp-relay.brevo.com", // Hardcoded to prevent ENV typos
  port: 2525, 
  secure: false, // false for 2525
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  pool: true, 
  maxConnections: 1,
  connectionTimeout: 20000, // Increased to 20s
  tls: {
    rejectUnauthorized: false, 
  },
});

/**
 * Self-test connection on boot
 */
transporter.verify((error, success) => {
  if (error) {
    console.error("❌ SMTP Connection Failed:", error.message);
  } else {
    console.log("🚀 SMTP Service Ready (Port 2525)");
  }
});

export default transporter;
