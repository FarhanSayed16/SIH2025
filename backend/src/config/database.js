import mongoose from 'mongoose';
import logger from './logger.js';

const connectDB = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      logger.error('❌ MONGODB_URI environment variable is not set!');
      logger.error('   Please set MONGODB_URI in your .env file');
      logger.error('   Example: mongodb://localhost:27017/kavach');
      logger.error('   Or MongoDB Atlas: mongodb+srv://user:pass@cluster.mongodb.net/kavach');
      throw new Error('MONGODB_URI not configured');
    }

    const uri = process.env.MONGODB_URI;
    const isAtlasSrv = uri.startsWith('mongodb+srv://');
    const isReplicaSet =
      isAtlasSrv ||
      uri.includes('replicaSet=') ||
      process.env.MONGODB_USE_REPLICA_SET === 'true';

    const connectionOptions = {
      maxPoolSize: parseInt(process.env.MONGODB_MAX_POOL_SIZE || '10', 10),
      minPoolSize: parseInt(process.env.MONGODB_MIN_POOL_SIZE || '1', 10),
      maxIdleTimeMS: 30000,
      serverSelectionTimeoutMS: 15000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 15000,
      retryWrites: true,
      retryReads: true,
    };

    // Write concern: prefer URI (?w=majority). Only force for explicit replica-set envs without Atlas URI params.
    if (isReplicaSet && !uri.includes('w=') && process.env.MONGODB_USE_REPLICA_SET === 'true') {
      connectionOptions.writeConcern = { w: 'majority', wtimeoutMS: 5000 };
    }

    logger.info(
      `🔗 Connecting to MongoDB... (${isAtlasSrv ? 'Atlas SRV' : isReplicaSet ? 'Replica Set' : 'Standalone'})`
    );

    const conn = await mongoose.connect(uri, connectionOptions);

    logger.info(`✅ MongoDB Connected: ${conn.connection.host}`);
    logger.info(
      `📊 Connection Pool: max=${process.env.MONGODB_MAX_POOL_SIZE || '10'}, min=${process.env.MONGODB_MIN_POOL_SIZE || '1'}`
    );

    mongoose.connection.on('error', (err) => {
      logger.error(`❌ MongoDB connection error: ${err.message}`);
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('⚠️ MongoDB disconnected');
    });

    mongoose.connection.on('reconnected', () => {
      logger.info('✅ MongoDB reconnected');
    });

    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      logger.info('MongoDB connection closed through app termination');
      process.exit(0);
    });

    return conn;
  } catch (error) {
    const msg = error?.message || String(error);
    logger.error('❌ MongoDB connection failed!');
    logger.error(`   Error: ${msg}`);

    if (msg.includes('querySrv') || msg.includes('ECONNREFUSED _mongodb._tcp')) {
      logger.error('   🔍 Issue: DNS cannot resolve Atlas SRV records (querySrv ECONNREFUSED)');
      logger.error('   💡 Node was likely using a broken local DNS (often 127.0.0.1)');
      logger.error('   💡 Fix already attempted via env-loader (8.8.8.8 / 1.1.1.1)');
      logger.error('   💡 Or set MONGODB_DNS_SERVERS=8.8.8.8,1.1.1.1 in backend/.env');
      logger.error('   💡 Atlas → Network Access: allow your IP (or 0.0.0.0/0 for demo)');
    } else if (msg.includes('authentication failed') || msg.includes('bad auth')) {
      logger.error('   🔍 Issue: Atlas username/password rejected');
      logger.error('   💡 Atlas → Database Access → edit user → Reset Password');
      logger.error('   💡 Update MONGODB_URI in backend/.env with the new password');
      logger.error('   💡 If password has @ # % etc, URL-encode it (e.g. @ → %40)');
    } else if (msg.includes('ENOTFOUND') || msg.includes('getaddrinfo')) {
      logger.error('   🔍 Issue: Cannot resolve MongoDB hostname');
      logger.error('   💡 Check MONGODB_URI cluster hostname');
    } else if (msg.includes('ECONNREFUSED')) {
      logger.error('   🔍 Issue: Connection refused');
      logger.error('   💡 Local Mongo: start mongod or Docker mongo');
      logger.error('   💡 Atlas: check Network Access IP allowlist');
    } else if (msg.includes('timeout') || msg.includes('Server selection timed out')) {
      logger.error('   🔍 Issue: Connection timeout');
      logger.error('   💡 Atlas Network Access may be blocking your IP');
      logger.error('   💡 Or cluster is paused (free tier) — resume in Atlas UI');
    } else if (!process.env.MONGODB_URI) {
      logger.error('   🔍 Issue: MONGODB_URI not set');
    } else {
      logger.error(`   🔍 Full error: ${msg}`);
    }

    logger.error('');
    logger.error('   📝 Checklist:');
    logger.error('   1. backend/.env has a valid MONGODB_URI');
    logger.error('   2. Atlas DB user password matches URI (reset if unsure)');
    logger.error('   3. Atlas Network Access allows this machine');
    logger.error('   4. Cluster is not paused');
    logger.error('');

    if (process.env.NODE_ENV === 'test') {
      throw error;
    }
    process.exit(1);
  }
};

export default connectDB;
