import mongoose from 'mongoose';
import transporter from '../config/nodemailer.js';
import os from 'os';

/**
 * Detailed health check for the entire application.
 * Checks database, email service, environment variables, and system resources.
 */
export const getHealthStatus = async (req, res) => {
    try {
        const healthStatus = {
            status: 'HEALTHY',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            services: {
                database: {
                    status: 'UNKNOWN',
                    latency: 0
                },
                email: {
                    status: 'UNKNOWN'
                }
            },
            system: {
                platform: os.platform(),
                cpu_usage: os.loadavg(),
                memory_usage: {
                    free: os.freemem(),
                    total: os.totalmem(),
                    usage_percent: ((1 - os.freemem() / os.totalmem()) * 100).toFixed(2) + '%'
                }
            },
            environment: {
                node_env: process.env.NODE_ENV,
                variables_status: 'CHECKED'
            }
        };

        // 1. Check Database
        const dbStart = Date.now();
        const dbState = mongoose.connection.readyState;
        const dbStates = {
            0: 'disconnected',
            1: 'connected',
            2: 'connecting',
            3: 'disconnecting',
            99: 'uninitialized'
        };
        healthStatus.services.database.status = dbStates[dbState] || 'unknown';
        healthStatus.services.database.latency = `${Date.now() - dbStart}ms`;

        // 2. Check Email Transporter
        try {
            await transporter.verify();
            healthStatus.services.email.status = 'connected';
        } catch (error) {
            healthStatus.services.email.status = 'disconnected';
            healthStatus.services.email.error = error.message;
            healthStatus.status = 'DEGRADED';
        }

        // 3. Check Critical Environment Variables
        const requiredVars = ['MONGODB_URI', 'JWT_SECRET', 'SMTP_USER', 'SMTP_PASS'];
        const missingVars = requiredVars.filter(v => !process.env[v]);
        
        if (missingVars.length > 0) {
            healthStatus.environment.missing_variables = missingVars;
            healthStatus.status = 'DEGRADED';
        }

        // Final Status check
        if (dbState !== 1) {
            healthStatus.status = 'CRITICAL';
        }

        res.status(healthStatus.status === 'CRITICAL' ? 503 : 200).json(healthStatus);
    } catch (error) {
        res.status(500).json({
            status: 'ERROR',
            message: error.message,
            timestamp: new Date().toISOString()
        });
    }
};
