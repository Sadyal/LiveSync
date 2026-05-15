import express from 'express';
import { getHealthStatus } from '../controllers/healthController.js';

const healthRouter = express.Router();

// Public health check endpoint
healthRouter.get('/status', getHealthStatus);

export default healthRouter;
