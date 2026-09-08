import { beforeAll, afterAll } from '@jest/globals';
import mongoose from 'mongoose';

beforeAll(async () => {
  const uri = process.env.MONGODB_URI;
  if (!uri || !uri.includes('/kavach_test?')) {
    throw new Error('Run tests through npm test to use the isolated test database');
  }
  if (mongoose.connection.readyState === 0) await mongoose.connect(uri);
});
afterAll(async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
  }
});
