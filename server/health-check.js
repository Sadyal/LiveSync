/**
 * LiveSync App Health Diagnostic Script
 * Run this to verify environment and connectivity.
 * Usage: node health-check.js
 */

import 'dotenv/config';
import mongoose from 'mongoose';
import nodemailer from 'nodemailer';
import os from 'os';

console.log("🔍 Starting LiveSync System Health Check...\n");

async function runCheck() {
    let score = 100;
    const checks = [];

    // 1. Environment Check
    const required = ['MONGODB_URI', 'JWT_SECRET', 'SMTP_USER', 'SMTP_PASS'];
    const missing = required.filter(v => !process.env[v]);
    if (missing.length > 0) {
        checks.push(`❌ Environment: Missing ${missing.join(', ')}`);
        score -= 40;
    } else {
        checks.push("✅ Environment: All required variables present");
    }

    // 2. Database Connectivity
    if (process.env.MONGODB_URI) {
        try {
            console.log("⏳ Testing MongoDB connection...");
            await mongoose.connect(process.env.MONGODB_URI);
            checks.push("✅ Database: Successfully connected to MongoDB Atlas");
            await mongoose.disconnect();
        } catch (err) {
            checks.push(`❌ Database: Connection failed (${err.message})`);
            score -= 30;
        }
    }

    // 3. Email Service Connectivity
    if (process.env.SMTP_USER && process.env.SMTP_PASS) {
        try {
            console.log("⏳ Testing Email Transporter...");
            const transporter = nodemailer.createTransport({
                host: process.env.SMTP_HOST || "smtp-relay.brevo.com",
                port: parseInt(process.env.SMTP_PORT) || 465,
                secure: process.env.SMTP_PORT == 465 || true,
                auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
            });
            await transporter.verify();
            checks.push("✅ Email Service: SMTP credentials verified");
        } catch (err) {
            checks.push(`❌ Email Service: Verification failed (${err.message})`);
            score -= 20;
        }
    }

    // 4. System Resources
    const freeMem = os.freemem() / (1024 * 1024 * 1024);
    if (freeMem < 0.5) {
        checks.push(`⚠️ System: Low memory available (${freeMem.toFixed(2)} GB)`);
        score -= 10;
    } else {
        checks.push(`✅ System: Sufficient memory (${freeMem.toFixed(2)} GB free)`);
    }

    // Results
    console.log("\n--- Health Report ---");
    checks.forEach(c => console.log(c));
    console.log("---------------------");
    console.log(`Overall Health Score: ${score}/100`);

    if (score < 70) {
        console.log("\n🔴 ACTION REQUIRED: Some critical systems are down or misconfigured.");
        process.exit(1);
    } else {
        console.log("\n🟢 SYSTEM READY: Application is ready for production.");
        process.exit(0);
    }
}

runCheck().catch(err => {
    console.error("💥 Diagnostic failed:", err);
    process.exit(1);
});
