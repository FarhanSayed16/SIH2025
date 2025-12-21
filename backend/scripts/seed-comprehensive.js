/**
 * Comprehensive Seed Script
 * Creates detailed dummy data for testing:
 * - 1 Admin with full access
 * - 1 Teacher with class and students
 * - 3 Students with different access levels
 * - School with complete data
 * - Modules with quizzes
 * - Drills (scheduled and completed)
 * - Badges
 * - Games data
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../src/models/User.js';
import School from '../src/models/School.js';
import Drill from '../src/models/Drill.js';
import Module from '../src/models/Module.js';
import Device from '../src/models/Device.js';
import Badge from '../src/models/Badge.js';
import logger from '../src/config/logger.js';

// Load environment variables
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/kavach';

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    logger.info('✅ MongoDB Connected for seeding');
  } catch (error) {
    logger.error('❌ MongoDB connection failed:', error);
    process.exit(1);
  }
};

// Clear existing data
const clearDatabase = async () => {
  try {
    await User.deleteMany({});
    await School.deleteMany({});
    await Drill.deleteMany({});
    await Module.deleteMany({});
    await Device.deleteMany({});
    await Badge.deleteMany({});
    logger.info('🗑️  Database cleared');
  } catch (error) {
    logger.error('Error clearing database:', error);
  }
};

// Seed data
const seedDatabase = async () => {
  try {
    // 1. Create School
    const school = await School.create({
      name: 'Delhi Public School',
      address: '123 Education Street, New Delhi, India',
      location: {
        type: 'Point',
        coordinates: [77.2090, 28.6139] // Delhi coordinates
      },
      safeZones: [
        {
          name: 'Main Assembly Point',
          location: {
            type: 'Point',
            coordinates: [77.2095, 28.6140]
          },
          capacity: 500,
          description: 'Main assembly point in the playground'
        },
        {
          name: 'Secondary Assembly Point',
          location: {
            type: 'Point',
            coordinates: [77.2085, 28.6135]
          },
          capacity: 300,
          description: 'Secondary assembly point near parking'
        }
      ],
      floorPlan: {
        rooms: [
          {
            id: 'R001',
            name: 'Chemistry Lab',
            location: { type: 'Point', coordinates: [77.2092, 28.6142] },
            floor: 2,
            capacity: 30
          },
          {
            id: 'R002',
            name: 'Classroom 10A',
            location: { type: 'Point', coordinates: [77.2091, 28.6141] },
            floor: 1,
            capacity: 40
          }
        ],
        exits: [
          {
            id: 'E001',
            name: 'Main Gate',
            location: { type: 'Point', coordinates: [77.2090, 28.6138] },
            type: 'main'
          }
        ],
        hazards: []
      },
      region: 'Delhi',
      disasterTypes: ['earthquake', 'fire', 'flood'],
      contact: {
        principal: {
          name: 'Dr. Priya Sharma',
          phone: '+91-9876543210',
          email: 'principal@dpsdelhi.edu.in'
        },
        emergency: {
          phone: '+91-9876543211',
          email: 'emergency@dpsdelhi.edu.in'
        }
      },
      totalStudents: 1000,
      totalTeachers: 50
    });

    logger.info(`✅ Created school: ${school.name} (ID: ${school._id})`);

    // 2. Create Admin User
    const admin = await User.create({
      email: 'admin@school.com',
      password: 'admin123',
      name: 'Admin User',
      role: 'admin',
      institutionId: school._id,
      safetyStatus: 'safe',
      progress: {
        completedModules: [],
        badges: ['admin', 'first-login'],
        preparednessScore: 100
      }
    });

    logger.info(`✅ Created admin: ${admin.email} (Password: admin123)`);

    // 3. Create Teacher
    const Class = (await import('../src/models/Class.js')).default;
    const teacher = await User.create({
      email: 'teacher@kavach.com',
      password: 'teacher123',
      name: 'Ms. Anjali Iyer',
      role: 'teacher',
      institutionId: school._id,
      currentLocation: {
        type: 'Point',
        coordinates: [77.2091, 28.6141] // In Classroom 10A
      },
      safetyStatus: 'safe',
      progress: {
        completedModules: [],
        badges: ['teacher', 'fire-safety-expert'],
        preparednessScore: 95
      }
    });

    logger.info(`✅ Created teacher: ${teacher.email} (Password: teacher123)`);

    // 4. Create Class
    // PHASE 3: Remove automatic teacher assignment - let admin assign manually
    const classCode = `${school._id.toString().substring(0, 8)}-10A`;
    const studentClass = await Class.create({
      institutionId: school._id,
      grade: '10',
      section: 'A',
      classCode: classCode,
      // teacherId: teacher._id, // REMOVED - Admin will assign teacher manually
      isSeeded: true // Mark as seeded for identification
    });

    logger.info(`✅ Created class: ${studentClass.classCode}`);

    // 5. Create Modules (we'll use existing seed-modules.js data structure)
    const modules = await Module.create([
      {
        title: 'Fire Safety Basics',
        description: 'Learn the fundamentals of fire safety and evacuation procedures',
        type: 'fire',
        region: 'Delhi',
        content: {
          videos: [
            {
              url: 'https://example.com/videos/fire-safety.mp4',
              title: 'Fire Safety Introduction',
              duration: 300
            }
          ],
          images: [
            {
              url: 'https://example.com/images/fire-extinguisher.jpg',
              caption: 'How to use a fire extinguisher'
            }
          ],
          text: 'Fire safety is crucial in schools. Always know your nearest exit and follow evacuation procedures.',
          arScenarios: []
        },
        quiz: {
          questions: [
            {
              question: 'What should you do if you see a fire?',
              options: ['Run away immediately', 'Pull the fire alarm and evacuate', 'Try to put it out yourself', 'Ignore it'],
              correctAnswer: 1,
              points: 10,
              explanation: 'Always pull the fire alarm first, then evacuate following the designated route.'
            }
          ],
          passingScore: 70,
          timeLimit: 300
        },
        badges: ['fire-safety-badge'],
        points: 100,
        estimatedTime: 15,
        difficulty: 'beginner',
        order: 1
      },
      {
        title: 'Earthquake Preparedness',
        description: 'Essential knowledge for earthquake safety and response',
        type: 'earthquake',
        region: 'Delhi',
        content: {
          videos: [],
          images: [],
          text: 'During an earthquake, remember to Drop, Cover, and Hold On.',
          arScenarios: []
        },
        quiz: {
          questions: [
            {
              question: 'What should you do during an earthquake?',
              options: ['Run outside', 'Drop, Cover, and Hold On', 'Stand in a doorway', 'Hide under a table only'],
              correctAnswer: 1,
              points: 10,
              explanation: 'Drop, Cover, and Hold On is the recommended technique.'
            }
          ],
          passingScore: 70,
          timeLimit: 300
        },
        badges: ['earthquake-preparedness-badge'],
        points: 100,
        estimatedTime: 20,
        difficulty: 'beginner',
        order: 2
      }
    ]);

    logger.info(`✅ Created ${modules.length} learning modules`);

    // 6. Create Students with different access levels
    const students = await User.create([
      {
        email: 'rohan.sharma@student.com',
        password: 'student123',
        name: 'Rohan Sharma',
        role: 'student',
        institutionId: school._id,
        grade: '10',
        section: 'A',
        classId: studentClass._id,
        accessLevel: 'full', // 9th-12th grade - full access
        currentLocation: {
          type: 'Point',
          coordinates: [77.2091, 28.6141] // In Classroom 10A
        },
        safetyStatus: 'safe',
        progress: {
          completedModules: [modules[0]._id.toString()], // Completed Fire Safety
          badges: ['fire-safety-badge'],
          preparednessScore: 75
        }
      },
      {
        email: 'priya.patel@student.com',
        password: 'student123',
        name: 'Priya Patel',
        role: 'student',
        institutionId: school._id,
        grade: '8',
        section: 'B',
        accessLevel: 'shared', // 6th-8th grade - shared access
        currentLocation: {
          type: 'Point',
          coordinates: [77.2092, 28.6142] // In Chemistry Lab
        },
        safetyStatus: 'safe',
        progress: {
          completedModules: [],
          badges: [],
          preparednessScore: 45
        }
      },
      {
        email: 'arjun.kumar@student.com',
        password: 'student123',
        name: 'Arjun Kumar',
        role: 'student',
        institutionId: school._id,
        grade: '5',
        section: 'A',
        accessLevel: 'teacher_led', // KG-5th grade - teacher led
        currentLocation: {
          type: 'Point',
          coordinates: [77.2088, 28.6141] // In Library
        },
        safetyStatus: 'safe',
        progress: {
          completedModules: [],
          badges: [],
          preparednessScore: 20
        }
      }
    ]);

    logger.info(`✅ Created ${students.length} students:`);
    students.forEach(student => {
      logger.info(`   - ${student.email} (Password: student123, Access: ${student.accessLevel})`);
    });

    // Update class with student IDs
    studentClass.studentIds = students.map(s => s._id);
    await studentClass.save();
    logger.info(`✅ Updated class with ${students.length} students`);

    // 7. Create Badges
    const badges = await Badge.create([
      {
        name: 'Fire Safety Expert',
        description: 'Completed Fire Safety Basics module',
        icon: '🔥',
        category: 'safety',
        criteria: {
          type: 'module_completion',
          moduleId: modules[0]._id.toString()
        }
      },
      {
        name: 'Earthquake Ready',
        description: 'Completed Earthquake Preparedness module',
        icon: '🌍',
        category: 'safety',
        criteria: {
          type: 'module_completion',
          moduleId: modules[1]._id.toString()
        }
      },
      {
        name: 'First Login',
        description: 'Welcome to KAVACH!',
        icon: '👋',
        category: 'achievement'
      }
    ]);

    logger.info(`✅ Created ${badges.length} badges`);

    // 8. Create Drills
    const drills = await Drill.create([
      {
        institutionId: school._id,
        type: 'fire',
        scheduledAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        status: 'scheduled',
        results: {
          totalParticipants: students.length,
          completedParticipants: 0,
          participationRate: 0
        }
      },
      {
        institutionId: school._id,
        type: 'earthquake',
        scheduledAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
        completedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000), // 6 days ago
        status: 'completed',
        results: {
          totalParticipants: students.length,
          completedParticipants: students.length,
          participationRate: 100,
          averageTime: 180
        }
      }
    ]);

    logger.info(`✅ Created ${drills.length} drills (1 scheduled, 1 completed)`);

    // 9. Create IoT Device
    const fireSensor = await Device.create({
      deviceId: 'FIRE-SENSOR-001',
      institutionId: school._id,
      deviceType: 'personal',
      deviceName: 'Chemistry Lab Fire Sensor',
      location: {
        type: 'Point',
        coordinates: [77.2092, 28.6142] // Chemistry Lab
      },
      room: 'Chemistry Lab',
      status: 'active',
      configuration: {
        smokeThreshold: 300,
        temperatureThreshold: 60
      }
    });

    logger.info(`✅ Created IoT device: ${fireSensor.deviceName}`);

    // Summary
    logger.info('\n📊 ===========================================');
    logger.info('📊 COMPREHENSIVE SEED DATA SUMMARY');
    logger.info('📊 ===========================================');
    logger.info(`\n🏫 Schools: 1`);
    logger.info(`   - ${school.name}`);
    logger.info(`\n👥 Users:`);
    logger.info(`   - Admin: 1 (admin@school.com / admin123)`);
    logger.info(`   - Teacher: 1 (teacher@kavach.com / teacher123)`);
    logger.info(`   - Students: ${students.length}`);
    students.forEach(s => {
      logger.info(`     • ${s.name} (${s.email} / student123)`);
      logger.info(`       - Grade: ${s.grade}, Access: ${s.accessLevel}`);
    });
    logger.info(`\n📚 Modules: ${modules.length}`);
    modules.forEach(m => logger.info(`   - ${m.title}`));
    logger.info(`\n🏅 Badges: ${badges.length}`);
    badges.forEach(b => logger.info(`   - ${b.name}`));
    logger.info(`\n🚨 Drills: ${drills.length} (1 scheduled, 1 completed)`);
    logger.info(`\n📱 IoT Devices: 1`);
    logger.info(`\n✅ ===========================================`);
    logger.info('✅ DATABASE SEEDED SUCCESSFULLY!');
    logger.info('✅ ===========================================\n');
    logger.info('🔑 LOGIN CREDENTIALS:');
    logger.info('   Admin:   admin@school.com / admin123');
    logger.info('   Teacher: teacher@kavach.com / teacher123');
    logger.info('   Student: rohan.sharma@student.com / student123 (Full Access)');
    logger.info('   Student: priya.patel@student.com / student123 (Shared Access)');
    logger.info('   Student: arjun.kumar@student.com / student123 (Teacher Led)\n');

  } catch (error) {
    logger.error('❌ Error seeding database:', error);
    throw error;
  }
};

// Main function
const main = async () => {
  try {
    await connectDB();
    await clearDatabase();
    await seedDatabase();
    await mongoose.connection.close();
    logger.info('✅ Seeding complete. Database connection closed.');
    process.exit(0);
  } catch (error) {
    logger.error('❌ Seeding failed:', error);
    process.exit(1);
  }
};

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export default main;

