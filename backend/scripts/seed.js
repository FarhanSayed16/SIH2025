import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../src/models/User.js';
import School from '../src/models/School.js';
import Drill from '../src/models/Drill.js';
import Module from '../src/models/Module.js';
import Device from '../src/models/Device.js';
import logger from '../src/config/logger.js';

// Load environment variables
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/kavach';

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    logger.info('✅ MongoDB Connected for seeding');
    
    // Fix QR code indexes after model is loaded (Mongoose may have auto-created non-sparse indexes)
    const db = mongoose.connection.db;
    const collection = db.collection('users');
    
    try {
      await collection.dropIndex('qrCode_1');
      logger.info('✅ Dropped existing qrCode index');
    } catch (e) {
      if (e.code !== 27) throw e; // 27 = index not found
    }
    
    try {
      await collection.dropIndex('qrBadgeId_1');
      logger.info('✅ Dropped existing qrBadgeId index');
    } catch (e) {
      if (e.code !== 27) throw e;
    }
    
    // Create non-unique sparse indexes for qrCode and qrBadgeId
    // Note: Making them non-unique for now to avoid issues with multiple null values
    // We can make them unique later when QR codes are actually generated
    await collection.createIndex({ qrCode: 1 }, { sparse: true, name: 'qrCode_1' });
    await collection.createIndex({ qrBadgeId: 1 }, { sparse: true, name: 'qrBadgeId_1' });
    logger.info('✅ Created sparse indexes for qrCode and qrBadgeId (non-unique for now)');
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
    logger.info('🗑️  Database cleared');
  } catch (error) {
    logger.error('Error clearing database:', error);
  }
};

// Seed data
const seedDatabase = async () => {
  try {
    // 1. Create School (with geospatial data - Delhi coordinates)
    const school = await School.create({
      name: 'Delhi Public School',
      address: '123 Education Street, New Delhi, India',
      location: {
        type: 'Point',
        coordinates: [77.2090, 28.6139] // Delhi coordinates [lng, lat]
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
            name: 'Physics Lab',
            location: { type: 'Point', coordinates: [77.2093, 28.6143] },
            floor: 2,
            capacity: 30
          },
          {
            id: 'R003',
            name: 'Library',
            location: { type: 'Point', coordinates: [77.2088, 28.6141] },
            floor: 1,
            capacity: 100
          }
        ],
        exits: [
          {
            id: 'E001',
            name: 'Main Gate',
            location: { type: 'Point', coordinates: [77.2090, 28.6138] },
            type: 'main'
          },
          {
            id: 'E002',
            name: 'Emergency Exit 1',
            location: { type: 'Point', coordinates: [77.2095, 28.6145] },
            type: 'emergency'
          },
          {
            id: 'E003',
            name: 'Fire Exit',
            location: { type: 'Point', coordinates: [77.2085, 28.6140] },
            type: 'fire'
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
      password: 'admin123', // Will be hashed automatically
      name: 'Admin User',
      role: 'admin',
      safetyStatus: 'safe',
      progress: {
        completedModules: [],
        badges: ['admin'],
        preparednessScore: 100
      }
    });

    logger.info(`✅ Created admin: ${admin.email}`);

    // 3. Create Teacher (needed for class)
    const teacher = await User.create({
      email: 'teacher@kavach.com',
      password: 'teacher123',
      name: 'Ms. Anjali Iyer',
      role: 'teacher',
      institutionId: school._id,
      currentLocation: {
        type: 'Point',
        coordinates: [77.2090, 28.6140]
      },
      safetyStatus: 'safe',
      progress: {
        completedModules: [],
        badges: ['teacher'],
        preparednessScore: 85
      }
    });

    logger.info(`✅ Created teacher: ${teacher.email}`);

    // 4. Create Class (for students)
    // PHASE 3: Remove automatic teacher assignment - let admin assign manually
    const Class = (await import('../src/models/Class.js')).default;
    // Generate unique classCode to avoid conflicts
    const classCode = `${school._id.toString().substring(0, 8)}-10A`;
    const studentClass = await Class.create({
      institutionId: school._id,
      grade: '10',
      section: 'A',
      classCode: classCode, // Use unique classCode
      // teacherId: teacher._id, // REMOVED - Admin will assign teacher manually
      isSeeded: true // Mark as seeded for identification
    });

    logger.info(`✅ Created class: ${studentClass.classCode}`);

    // 5. Create Students
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
        currentLocation: {
          type: 'Point',
          coordinates: [77.2092, 28.6142] // In Chemistry Lab
        },
        safetyStatus: 'safe',
        progress: {
          completedModules: [],
          badges: [],
          preparednessScore: 0
        }
      },
      {
        email: 'priya.patel@student.com',
        password: 'student123',
        name: 'Priya Patel',
        role: 'student',
        institutionId: school._id,
        grade: '10',
        section: 'A',
        classId: studentClass._id,
        currentLocation: {
          type: 'Point',
          coordinates: [77.2093, 28.6143] // In Physics Lab
        },
        safetyStatus: 'safe',
        progress: {
          completedModules: [],
          badges: [],
          preparednessScore: 0
        }
      },
      {
        email: 'arjun.kumar@student.com',
        password: 'student123',
        name: 'Arjun Kumar',
        role: 'student',
        institutionId: school._id,
        grade: '10',
        section: 'A',
        classId: studentClass._id,
        currentLocation: {
          type: 'Point',
          coordinates: [77.2088, 28.6141] // In Library
        },
        safetyStatus: 'safe',
        progress: {
          completedModules: [],
          badges: [],
          preparednessScore: 0
        }
      }
    ]);

    logger.info(`✅ Created ${students.length} students`);

    // Update class with student IDs
    studentClass.studentIds = students.map(s => s._id);
    await studentClass.save();
    logger.info(`✅ Updated class with students`);

    // 6. Create Learning Modules
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
          arScenarios: [
            {
              name: 'Fire Evacuation AR',
              description: 'AR simulation of fire evacuation route',
              arData: {}
            }
          ]
        },
        quiz: {
          questions: [
            {
              question: 'What should you do if you see a fire?',
              options: ['Run away immediately', 'Pull the fire alarm and evacuate', 'Try to put it out yourself', 'Ignore it'],
              correctAnswer: 1,
              points: 10,
              explanation: 'Always pull the fire alarm first, then evacuate following the designated route.'
            },
            {
              question: 'What is the STOP, DROP, and ROLL technique used for?',
              options: ['Evacuation', 'If your clothes catch fire', 'Finding the exit', 'Calling for help'],
              correctAnswer: 1,
              points: 10,
              explanation: 'STOP, DROP, and ROLL is used when your clothing catches fire.'
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
          videos: [
            {
              url: 'https://example.com/videos/earthquake-safety.mp4',
              title: 'Earthquake Safety Guide',
              duration: 420
            }
          ],
          images: [
            {
              url: 'https://example.com/images/drop-cover-hold.jpg',
              caption: 'Drop, Cover, and Hold On technique'
            }
          ],
          text: 'During an earthquake, remember to Drop, Cover, and Hold On. Stay away from windows and heavy objects.',
          arScenarios: []
        },
        quiz: {
          questions: [
            {
              question: 'What should you do during an earthquake?',
              options: ['Run outside', 'Drop, Cover, and Hold On', 'Stand in a doorway', 'Hide under a table only'],
              correctAnswer: 1,
              points: 10,
              explanation: 'Drop, Cover, and Hold On is the recommended technique during an earthquake.'
            },
            {
              question: 'Where is the safest place during an earthquake?',
              options: ['Near windows', 'Under a sturdy table', 'In an elevator', 'Outside immediately'],
              correctAnswer: 1,
              points: 10,
              explanation: 'Under a sturdy table or desk provides protection from falling objects.'
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

    // 7. Create Scheduled Drill
    const scheduledDrill = await Drill.create({
      institutionId: school._id,
      type: 'fire',
      scheduledAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      status: 'scheduled',
      results: {
        totalParticipants: 0,
        completedParticipants: 0,
        participationRate: 0
      }
    });

    logger.info(`✅ Created scheduled drill: ${scheduledDrill.type} (ID: ${scheduledDrill._id})`);

    // 8. Create IoT Device (Fire Sensor)
    // Note: Using 'personal' deviceType as 'sensor' is not in enum
    // In production, this would be registered via device registration API
    const fireSensor = await Device.create({
      deviceId: 'FIRE-SENSOR-001',
      institutionId: school._id,
      deviceType: 'personal', // Valid enum value (sensor not in enum)
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

    logger.info(`✅ Created IoT device: ${fireSensor.name} (ID: ${fireSensor._id})`);

    // Summary
    logger.info('\n📊 Seed Summary:');
    logger.info(`   - Schools: 1`);
    logger.info(`   - Users: ${1 + students.length + 1} (1 admin, ${students.length} students, 1 teacher)`);
    logger.info(`   - Modules: ${modules.length}`);
    logger.info(`   - Drills: 1 (scheduled)`);
    logger.info(`   - Devices: 1 (fire sensor)`);
    logger.info('\n✅ Database seeded successfully!');

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
main();

export default main;

