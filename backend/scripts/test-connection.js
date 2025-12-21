import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI not found in .env file');
  console.log('\n📝 Please create .env file with:');
  console.log('MONGODB_URI=your-connection-string');
  process.exit(1);
}

console.log('🔌 Testing MongoDB connection...');
console.log(`📍 URI: ${MONGODB_URI.replace(/\/\/[^:]+:[^@]+@/, '//***:***@')}`); // Hide password

mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('✅ MongoDB Connected Successfully!');
    console.log(`   Host: ${mongoose.connection.host}`);
    console.log(`   Database: ${mongoose.connection.name}`);
    console.log(`   Ready State: ${mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'}`);
    
    // Test a simple query
    return mongoose.connection.db.admin().ping();
  })
  .then(() => {
    console.log('✅ Database ping successful!');
    console.log('\n🎉 Connection test passed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Connection failed:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Check your MONGODB_URI in .env file');
    console.log('2. Verify username and password are correct');
    console.log('3. Check network access in MongoDB Atlas');
    console.log('4. Ensure MongoDB service is running (if local)');
    process.exit(1);
  });

