import cron from 'node-cron';
import axios from 'axios';
import userModel from '../models/userModel.js';

/**
 * 🚀 Cron Jobs Configuration
 */
const initCronJobs = () => {
  
  // 1️⃣ Keep-Alive Job (Pings the server every 14 minutes)
  // Useful for preventing Render/Railway/Heroku free tiers from sleeping.
  cron.schedule('*/14 * * * *', async () => {
    try {
      const serverUrl = process.env.SERVER_URL || `http://localhost:${process.env.PORT || 4000}`;
      console.log('📡 Cron: Pinging server to keep it alive...');
      await axios.get(`${serverUrl}/`);
    } catch (error) {
      console.error('❌ Cron: Keep-alive ping failed:', error.message);
    }
  });

  // 2️⃣ Database Cleanup Job (Runs every midnight at 00:00)
  // Cleans up expired OTPs from the user records.
  cron.schedule('0 0 * * *', async () => {
    try {
      console.log('🧹 Cron: Cleaning up expired OTPs...');
      const now = Date.now();
      
      const result = await userModel.updateMany(
        { 
          $or: [
            { verifyOtpExpireAt: { $lt: now } },
            { resetOtpExpireAt: { $lt: now } }
          ] 
        },
        { 
          $set: { 
            verifyOtp: 0, 
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
