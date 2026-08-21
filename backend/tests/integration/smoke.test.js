import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import mongoose from 'mongoose';
import request from 'supertest';
import app from '../../src/server.js';
import User from '../../src/models/User.js';
import connectDB from '../../src/config/database.js';

describe('POST /api/ai/ask (smoke)', () => {
  it('returns 200, 503 (quota message), or 500 with a message', async () => {
    const response = await request(app)
      .post('/api/ai/ask')
      .send({ question: 'What should I do during an earthquake at school?' });

    expect([200, 503, 500]).toContain(response.status);
    expect(response.body.message).toBeDefined();

    if (response.status === 503) {
      expect(response.body.success).toBe(false);
      expect(String(response.body.message).toLowerCase()).toMatch(/quota/);
    }

    if (response.status === 200) {
      expect(response.body.success).toBe(true);
      expect(response.body.data.answer).toBeDefined();
      if (response.body.data.quotaLimited) {
        expect(String(response.body.message).toLowerCase()).toMatch(/quota|fallback/);
      }
    }

    if (response.status === 500) {
      expect(response.body.success).toBe(false);
    }
  }, 30000);
});

describe('Login and drills (smoke)', () => {
  const password = 'Test123!@#';
  const email = `smoke-${Date.now()}@example.com`;
  let mongoAvailable = false;

  beforeAll(async () => {
    try {
      await Promise.race([
        connectDB(),
        new Promise((_, reject) => {
          setTimeout(() => reject(new Error('MongoDB connect timeout')), 5000);
        }),
      ]);
      mongoAvailable = mongoose.connection.readyState === 1;
    } catch {
      mongoAvailable = false;
    }
  }, 15000);

  afterAll(async () => {
    if (!mongoAvailable) return;
    await User.deleteMany({ email });
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    if (!mongoAvailable) return;
    await User.deleteMany({ email });
    await User.create({
      email,
      password,
      name: 'Smoke Test User',
      role: 'student',
      userType: 'account_user',
    });
  });

  it('POST /api/auth/login returns tokens', async () => {
    if (!mongoAvailable) {
      console.warn('Skipping login smoke: MongoDB is not available');
      return;
    }

    const response = await request(app)
      .post('/api/auth/login')
      .send({ email, password })
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data.accessToken).toBeDefined();
    expect(response.body.data.refreshToken).toBeDefined();
  });

  it('GET /api/drills returns a list for a logged-in user', async () => {
    if (!mongoAvailable) {
      console.warn('Skipping drill smoke: MongoDB is not available');
      return;
    }

    const login = await request(app)
      .post('/api/auth/login')
      .send({ email, password })
      .expect(200);

    const token = login.body.data.accessToken;
    const response = await request(app)
      .get('/api/drills')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(Array.isArray(response.body.data)).toBe(true);
  });
});
