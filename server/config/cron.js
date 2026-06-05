import cron from 'node-cron';
import axios from 'axios';
import userModel from '../models/userModel.js';

/**
 * 🚀 Cron Jobs Configuration
 */
const initCronJobs = () => {
  
  // 1️⃣ Keep-Alive Job (Pings the server every 14 minutes)
  cron.schedule('*/14 * * * *', async () => {
    try {
      // Use SERVER_URL or Render's built-in external hostname
      const serverUrl = process.env.SERVER_URL || (process.env.RENDER_EXTERNAL_HOSTNAME ? `https://${process.env.RENDER_EXTERNAL_HOSTNAME}` : `http://localhost:${process.env.PORT || 4000}`);
      
      console.log('📡 Cron: Keep-alive pinging server...');
      await axios.get(`${serverUrl}/`);
    } catch (error) {
      // It's normal for this to fail during deployments or cold starts
      console.log('📡 Cron: Keep-alive ping skipped (server might be starting)');
    }
  });

  // 2️⃣ Database Cleanup Job (Runs every midnight)
  cron.schedule('0 0 * * *', async () => {
    try {
      console.log('🧹 Cron: Cleaning up expired OTPs...');
      const now = Date.now();
      
      const result = await userModel.updateMany(
        { 
          $or: [
            { verifyOtpExpireAt: { $gt: 0, $lt: now } },
            { resetOtpExpireAt: { $gt: 0, $lt: now } }
          ] 
        },
        { 
          $set: { 
            verifyOtp: "", 
            verifyOtpExpireAt: 0,
            resetOtp: "",
            resetOtpExpireAt: 0
          } 
        }
      );
      
      console.log(`✅ Cron: Cleanup complete. Modified ${result.modifiedCount} users.`);
    } catch (error) {
      console.error('❌ Cron: Cleanup job failed:', error.message);
    }
  });

  console.log('⏰ Cron: All scheduled jobs initialized.');
};

export default initCronJobs;

