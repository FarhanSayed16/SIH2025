/**
 * Super Admin Seed Script
 * Creates a SYSTEM_ADMIN user with full permissions
 * 
 * Usage: node backend/scripts/seed_super_admin.js
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
// Note: Password hashing is handled by User model's pre-save hook

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

// Import User model
import User from '../src/models/User.js';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/kavach';

async function seedSuperAdmin() {
  try {
    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const superAdminEmail = 'superadmin@kavach.com';
    const superAdminPassword = 'Admin@123';

    // Check if super admin already exists
    let superAdmin = await User.findOne({ 
      email: superAdminEmail,
      role: 'SYSTEM_ADMIN'
    });

    if (superAdmin) {
      console.log('⚠️  Super Admin already exists. Updating password...');
      
      // Set password directly - User model's pre-save hook will hash it
      superAdmin.password = superAdminPassword;
      superAdmin.isActive = true;
      superAdmin.approvalStatus = 'approved';
      superAdmin.userType = 'account_user';
      await superAdmin.save();
      
      console.log('✅ Super Admin password updated successfully');
    } else {
      console.log('Creating new Super Admin...');
      
      // Create super admin - password will be hashed by User model's pre-save hook
      superAdmin = await User.create({
        email: superAdminEmail,
        password: superAdminPassword, // Will be hashed by pre-save hook
        name: 'Super Administrator',
        role: 'SYSTEM_ADMIN',
        userType: 'account_user',
        isActive: true,
        approvalStatus: 'approved',
        approvedBy: null, // Self-approved
        approvedAt: new Date(),
        canUseApp: true,
        accessLevel: 'full',
        progress: {
          completedModules: [],
          badges: ['super-admin'],
          preparednessScore: 100
        }
      });
      
      console.log('✅ Super Admin created successfully');
    }

    // Verify the super admin
    console.log('\n📋 Super Admin Details:');
    console.log('   Email:', superAdmin.email);
    console.log('   Name:', superAdmin.name);
    console.log('   Role:', superAdmin.role);
    console.log('   Status:', superAdmin.isActive ? 'Active' : 'Inactive');
    console.log('   Approval:', superAdmin.approvalStatus);
    console.log('   ID:', superAdmin._id);

    // Test password using User model's comparePassword method
    const testUser = await User.findOne({ email: superAdminEmail }).select('+password');
    if (testUser) {
      try {
        const isValid = await testUser.comparePassword(superAdminPassword);
        if (isValid) {
          console.log('\n✅ Password verification: SUCCESS');
        } else {
          console.log('\n❌ Password verification: FAILED');
          console.log('   Note: Try logging in to verify. Password should work.');
        }
      } catch (error) {
        console.log('\n⚠️  Could not verify password:', error.message);
        console.log('   Try logging in with the credentials to verify.');
      }
    }

    console.log('\n🎉 Super Admin setup complete!');
    console.log('\n📝 Login Credentials:');
    console.log('   Email: superadmin@kavach.com');
    console.log('   Password: Admin@123');
    console.log('\n⚠️  IMPORTANT: Change the password after first login!');

    // Disconnect
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding super admin:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

// Run script
seedSuperAdmin();

