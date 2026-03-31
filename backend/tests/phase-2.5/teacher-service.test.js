import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import mongoose from 'mongoose';
import User from '../../src/models/User.js';
import Class from '../../src/models/Class.js';
import { getTeacherClasses, getClassStudents } from '../../src/services/teacher.service.js';

describe('Phase 2.5: Teacher Service', () => {
  let testTeacher;
  let testClass;
  let testInstitutionId;

  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/kavach_test');
    }

    testInstitutionId = new mongoose.Types.ObjectId();

    // Create test teacher
    testTeacher = await User.create({
      email: 'test.teacher@test.com',
      password: 'test123',
      name: 'Test Teacher',
      role: 'teacher',
      institutionId: testInstitutionId,
    });

    // Create test class
    testClass = await Class.create({
      institutionId: testInstitutionId,
      grade: '5',
      section: 'A',
      classCode: 'TEST-5-A',
      teacherId: testTeacher._id,
    });
  });

  afterAll(async () => {
    await User.deleteMany({ email: 'test.teacher@test.com' });
    await Class.deleteMany({ classCode: 'TEST-5-A' });
    await mongoose.connection.close();
  });

  describe('getTeacherClasses', () => {
    it('should get all classes for a teacher', async () => {
      const classes = await getTeacherClasses(testTeacher._id.toString());

      expect(Array.isArray(classes)).toBe(true);
      expect(classes.length).toBeGreaterThan(0);
      expect(classes[0]).toHaveProperty('grade');
      expect(classes[0]).toHaveProperty('section');
    });
  });

  describe('getClassStudents', () => {
    it('should get students in a class', async () => {
      const classData = await getClassStudents(
        testClass._id.toString(),
        testTeacher._id.toString()
      );

      expect(classData).toHaveProperty('grade');
      expect(classData).toHaveProperty('section');
      expect(classData).toHaveProperty('studentIds');
    });

    it('should throw error if teacher does not own class', async () => {
      const otherTeacherId = new mongoose.Types.ObjectId();
      await expect(
        getClassStudents(testClass._id.toString(), otherTeacherId.toString())
      ).rejects.toThrow('Unauthorized');
    });
  });
});

