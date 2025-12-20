import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../src/models/User.js';
import logger from '../src/config/logger.js';

// Load environment variables
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/kavach';

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    logger.info('✅ MongoDB Connected');
  } catch (error) {
    logger.error('❌ MongoDB connection failed:', error);
    process.exit(1);
  }
};

// Fix or create admin user
const fixAdmin = async () => {
  try {
    const adminEmail = 'admin@school.com';
    const adminPassword = 'admin123';
    
    // Check if admin exists
    let admin = await User.findOne({ email: adminEmail, role: 'admin' });
    
    if (admin) {
      logger.info(`Found existing admin: ${adminEmail}`);
      
      // Reset password
      admin.password = adminPassword; // Will be hashed by pre-save hook
      await admin.save();
      
      logger.info(`✅ Admin password reset successfully`);
      logger.info(`   Email: ${adminEmail}`);
      logger.info(`   Password: ${adminPassword}`);
    } else {
      // Create new admin
      logger.info(`Admin not found. Creating new admin...`);
      
      admin = await User.create({
        email: adminEmail,
        password: adminPassword, // Will be hashed automatically
        name: 'Admin User',
        role: 'admin',
        safetyStatus: 'safe',
        isActive: true,
        progress: {
          completedModules: [],
          badges: ['admin'],
          preparednessScore: 100
        }
      });
      
      logger.info(`✅ Admin created successfully`);
      logger.info(`   Email: ${adminEmail}`);
      logger.info(`   Password: ${adminPassword}`);
    }
    
    // Verify password works
    const testUser = await User.findOne({ email: adminEmail }).select('+password');
    if (testUser) {
      const isValid = await testUser.comparePassword(adminPassword);
      if (isValid) {
        logger.info(`✅ Password verification: SUCCESS`);
      } else {
        logger.error(`❌ Password verification: FAILED`);
      }
    }
    
    return admin;
  } catch (error) {
    logger.error('❌ Error fixing admin:', error);
    throw error;
  }
};

// Main function
const main = async () => {
  try {
    await connectDB();
    await fixAdmin();
    await mongoose.connection.close();
    logger.info('✅ Admin fix complete. Database connection closed.');
    process.exit(0);
  } catch (error) {
    logger.error('❌ Admin fix failed:', error);
    process.exit(1);
  }
};

// Run if called directly
main();

export default main;

