import mongoose from 'mongoose';
import logger from './logger.js';

const connectDB = async () => {
  try {
    // Check if MONGODB_URI is provided
    if (!process.env.MONGODB_URI) {
      logger.error('❌ MONGODB_URI environment variable is not set!');
      logger.error('   Please set MONGODB_URI in your .env file');
      logger.error('   Example: mongodb://localhost:27017/kavach');
      logger.error('   Or MongoDB Atlas: mongodb+srv://user:pass@cluster.mongodb.net/kavach');
      throw new Error('MONGODB_URI not configured');
    }

    // Build connection options
    // Note: Mongoose 8+ doesn't support deprecated options like bufferMaxEntries, bufferCommands
    // Modern Mongoose handles buffering automatically
    const connectionOptions = {
      // Connection pool settings
      maxPoolSize: parseInt(process.env.MONGODB_MAX_POOL_SIZE || '10'),
      // Reduced minPoolSize to avoid connection failures on single-server setups
      minPoolSize: parseInt(process.env.MONGODB_MIN_POOL_SIZE || '1'),
      maxIdleTimeMS: 30000,
      
      // Connection timeout settings
      serverSelectionTimeoutMS: 10000, // Increased from 5s to 10s for better reliability
      socketTimeoutMS: 45000,
      connectTimeoutMS: 10000,
      
      // Retry settings
      retryWrites: true,
      retryReads: true,
    };

    // Only use write concern for replica sets (optional, detect from URI or env)
    // For single-server MongoDB, don't use w: 'majority' as it will fail
    const isReplicaSet = process.env.MONGODB_URI.includes('replicaSet=') || 
                        process.env.MONGODB_USE_REPLICA_SET === 'true';
    
    if (isReplicaSet) {
      connectionOptions.w = 'majority';
      connectionOptions.wtimeout = 5000;
    }

    logger.info(`🔗 Connecting to MongoDB... (Replica Set: ${isReplicaSet ? 'Yes' : 'No'})`);
    
    // Phase 3.5.1: Enhanced connection pooling and performance optimization
    const conn = await mongoose.connect(process.env.MONGODB_URI, connectionOptions);

    logger.info(`✅ MongoDB Connected: ${conn.connection.host}`);
    logger.info(`📊 Connection Pool: max=${process.env.MONGODB_MAX_POOL_SIZE || '10'}, min=${process.env.MONGODB_MIN_POOL_SIZE || '5'}`);
    
    // Handle connection events
    mongoose.connection.on('error', (err) => {
      logger.error('❌ MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('⚠️ MongoDB disconnected');
    });

    mongoose.connection.on('reconnected', () => {
      logger.info('✅ MongoDB reconnected');
    });

    // Phase 3.5.1: Log connection pool stats
    mongoose.connection.on('connected', () => {
      const poolStats = mongoose.connection.db?.serverConfig?.pool || {};
      logger.debug('MongoDB Connection Pool Stats:', {
        active: poolStats.totalConnectionCount || 'N/A',
        idle: poolStats.availableConnectionCount || 'N/A',
      });
    });

    // Graceful shutdown
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      logger.info('MongoDB connection closed through app termination');
      process.exit(0);
    });

    return conn;
  } catch (error) {
    // Improved error logging with full details
    logger.error('❌ MongoDB connection failed!');
    logger.error('   Error:', error.message);
    
    // Provide helpful troubleshooting information
    if (error.message?.includes('ENOTFOUND') || error.message?.includes('getaddrinfo')) {
      logger.error('   🔍 Issue: Cannot resolve MongoDB hostname');
      logger.error('   💡 Solution: Check your MONGODB_URI hostname/domain');
    } else if (error.message?.includes('authentication failed')) {
      logger.error('   🔍 Issue: Authentication failed');
      logger.error('   💡 Solution: Check your MongoDB username and password');
    } else if (error.message?.includes('ECONNREFUSED')) {
      logger.error('   🔍 Issue: Connection refused');
      logger.error('   💡 Solution: Check if MongoDB server is running');
      logger.error('   💡 For local MongoDB: mongod should be running');
    } else if (error.message?.includes('timeout') || error.message?.includes('Server selection timed out')) {
      logger.error('   🔍 Issue: Connection timeout');
      logger.error('   💡 Solution: Check network connectivity and MongoDB server status');
      logger.error('   💡 Check firewall settings if using remote MongoDB');
    } else if (!process.env.MONGODB_URI) {
      logger.error('   🔍 Issue: MONGODB_URI not set');
      logger.error('   💡 Solution: Add MONGODB_URI to your .env file');
    } else {
      logger.error('   🔍 Full error:', error);
    }
    
    logger.error('');
    logger.error('   📝 Quick fixes:');
    logger.error('   1. Check your .env file has MONGODB_URI set');
    logger.error('   2. Verify MongoDB server is running (if local)');
    logger.error('   3. Test connection: mongosh <your-connection-string>');
    logger.error('');
    
    // Still exit, but with better error info
    process.exit(1);
  }
};

export default connectDB;

