/**
 * Phase 3.1.1: Content Seeding Script
 * Seeds the database with sample modules for testing and development
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Module from '../src/models/Module.js';
import connectDB from '../src/config/database.js';
import logger from '../src/config/logger.js';

dotenv.config();

const sampleModules = [
  {
    title: 'Fire Safety Basics',
    description: 'Learn the fundamentals of fire safety, including prevention, detection, and response.',
    type: 'fire',
    category: 'safety',
    difficulty: 'beginner',
    gradeLevel: ['all'],
    tags: ['fire', 'safety', 'basics', 'prevention'],
    version: '1.0.0',
    order: 1,
    points: 100,
    estimatedTime: 15,
    content: {
      lessons: [
        {
          title: 'Understanding Fire',
          order: 1,
          sections: [
            {
              type: 'text',
              order: 1,
              content: 'Fire is a chemical reaction that requires three elements: fuel, oxygen, and heat. This is called the fire triangle.',
              metadata: {}
            },
            {
              type: 'image',
              order: 2,
              content: 'Fire triangle diagram',
              metadata: {
                url: 'https://example.com/images/fire-triangle.jpg',
                caption: 'The Fire Triangle: Fuel, Oxygen, and Heat'
              }
            }
          ]
        },
        {
          title: 'Fire Prevention',
          order: 2,
          sections: [
            {
              type: 'text',
              order: 1,
              content: 'Preventing fires is the best way to stay safe. Keep flammable materials away from heat sources.',
              metadata: {}
            },
            {
              type: 'video',
              order: 2,
              content: 'Fire prevention tips',
              metadata: {
                url: 'https://example.com/videos/fire-prevention.mp4',
                duration: 120
              }
            }
          ]
        }
      ],
      text: 'Fire safety is crucial in schools. Always know your nearest exit and follow evacuation procedures.',
      images: [
        {
          url: 'https://example.com/images/fire-extinguisher.jpg',
          caption: 'How to use a fire extinguisher'
        }
      ],
      videos: [
        {
          url: 'https://example.com/videos/fire-safety.mp4',
          title: 'Fire Safety Introduction',
          duration: 300
        }
      ]
    },
    quiz: {
      questions: [
        {
          question: 'What should you do if you see a fire?',
          questionType: 'text',
          options: [
            'Run away immediately',
            'Pull the fire alarm and evacuate',
            'Try to put it out yourself',
            'Ignore it'
          ],
          correctAnswer: 1,
          points: 10,
          explanation: 'Always pull the fire alarm first, then evacuate following the designated route.'
        },
        {
          question: 'What is the STOP, DROP, and ROLL technique used for?',
          questionType: 'text',
          options: [
            'Evacuation',
            'If your clothes catch fire',
            'Fire prevention',
            'Using a fire extinguisher'
          ],
          correctAnswer: 1,
          points: 10,
          explanation: 'STOP, DROP, and ROLL is used when your clothes catch fire to smother the flames.'
        },
        {
          question: 'Which item is safe to use near a fire?',
          questionType: 'image',
          questionImage: 'https://example.com/images/fire-safety-items.jpg',
          options: [
            'Fire extinguisher',
            'Water bucket',
            'Gasoline',
            'Matches'
          ],
          optionImages: [
            'https://example.com/images/fire-extinguisher.jpg',
            'https://example.com/images/water-bucket.jpg',
            'https://example.com/images/gasoline.jpg',
            'https://example.com/images/matches.jpg'
          ],
          correctAnswer: 0,
          points: 15,
          explanation: 'A fire extinguisher is the safe tool to use near a fire.'
        }
      ],
      passingScore: 70,
      timeLimit: 300
    },
    badges: ['Fire Marshal'],
    isActive: true
  },
  {
    title: 'Earthquake Preparedness',
    description: 'Learn how to prepare for and respond to earthquakes safely.',
    type: 'earthquake',
    category: 'preparedness',
    difficulty: 'beginner',
    gradeLevel: ['all'],
    tags: ['earthquake', 'preparedness', 'safety', 'drop-cover-hold'],
    version: '1.0.0',
    order: 2,
    points: 100,
    estimatedTime: 20,
    content: {
      lessons: [
        {
          title: 'Understanding Earthquakes',
          order: 1,
          sections: [
            {
              type: 'text',
              order: 1,
              content: 'Earthquakes are sudden movements of the Earth\'s crust. They can happen without warning.',
              metadata: {}
            },
            {
              type: 'animation',
              order: 2,
              content: 'Earthquake animation',
              metadata: {
                lottieUrl: 'https://example.com/animations/earthquake.json'
              }
            }
          ]
        },
        {
          title: 'Drop, Cover, and Hold',
          order: 2,
          sections: [
            {
              type: 'text',
              order: 1,
              content: 'During an earthquake, remember: DROP to the ground, COVER under a sturdy table, and HOLD on.',
              metadata: {}
            },
            {
              type: 'video',
              order: 2,
              content: 'Drop, Cover, Hold demonstration',
              metadata: {
                url: 'https://example.com/videos/drop-cover-hold.mp4',
                duration: 180
              }
            }
          ]
        }
      ],
      text: 'Earthquake safety is about knowing what to do when the ground shakes.',
      images: [
        {
          url: 'https://example.com/images/earthquake-safety.jpg',
          caption: 'Safe position during earthquake'
        }
      ]
    },
    quiz: {
      questions: [
        {
          question: 'What should you do immediately when an earthquake starts?',
          questionType: 'text',
          options: [
            'Run outside',
            'Drop, Cover, and Hold',
            'Stand in a doorway',
            'Hide under a bed'
          ],
          correctAnswer: 1,
          points: 10,
          explanation: 'Drop, Cover, and Hold is the safest action during an earthquake.'
        },
        {
          question: 'Where is the safest place during an earthquake?',
          questionType: 'text',
          options: [
            'Outside in an open field',
            'Under a sturdy table',
            'In a car',
            'Near windows'
          ],
          correctAnswer: 1,
          points: 10,
          explanation: 'Under a sturdy table provides protection from falling objects.'
        }
      ],
      passingScore: 70,
      timeLimit: 240
    },
    badges: ['Earthquake Expert'],
    isActive: true
  },
  {
    title: 'Flood Safety for Kids',
    description: 'A simple guide to staying safe during floods, designed for younger students.',
    type: 'flood',
    category: 'safety',
    difficulty: 'beginner',
    gradeLevel: ['KG', '1', '2', '3', '4', '5'],
    tags: ['flood', 'safety', 'kids', 'water'],
    version: '1.0.0',
    order: 3,
    points: 80,
    estimatedTime: 10,
    content: {
      lessons: [
        {
          title: 'What is a Flood?',
          order: 1,
          sections: [
            {
              type: 'text',
              order: 1,
              content: 'A flood happens when too much water covers the ground.',
              metadata: {}
            },
            {
              type: 'image',
              order: 2,
              content: 'Flood illustration',
              metadata: {
                url: 'https://example.com/images/flood-kids.jpg',
                caption: 'Floods can happen when it rains a lot'
              }
            },
            {
              type: 'audio',
              order: 3,
              content: 'Audio narration of flood safety',
              metadata: {
                url: 'https://example.com/audio/flood-safety-kids.mp3',
                duration: 60
              }
            }
          ]
        }
      ],
      text: 'Flood safety for kids: Stay away from flood water, move to higher ground, and listen to adults.',
      images: [
        {
          url: 'https://example.com/images/flood-safety-kids.jpg',
          caption: 'Stay safe during floods'
        }
      ]
    },
    quiz: {
      questions: [
        {
          question: 'What should you do if you see flood water?',
          questionType: 'image',
          questionImage: 'https://example.com/images/flood-scenario.jpg',
          options: [
            'Play in it',
            'Stay away from it',
            'Drink it',
            'Swim in it'
          ],
          optionImages: [
            'https://example.com/images/play-water.jpg',
            'https://example.com/images/stay-away.jpg',
            'https://example.com/images/drink-water.jpg',
            'https://example.com/images/swim.jpg'
          ],
          correctAnswer: 1,
          points: 10,
          explanation: 'Always stay away from flood water - it can be dangerous!'
        },
        {
          question: 'Who should you listen to during a flood?',
          questionType: 'audio',
          questionAudio: 'https://example.com/audio/who-to-listen.mp3',
          options: [
            'Your friends',
            'Adults and teachers',
            'Nobody',
            'Yourself'
          ],
          correctAnswer: 1,
          points: 10,
          explanation: 'Always listen to adults and teachers during emergencies.'
        }
      ],
      passingScore: 70,
      timeLimit: 180
    },
    badges: ['Flood Safety Champion'],
    isActive: true
  },
  {
    title: 'Advanced Fire Response',
    description: 'Advanced techniques for responding to fires in different scenarios.',
    type: 'fire',
    category: 'response',
    difficulty: 'advanced',
    gradeLevel: ['9', '10', '11', '12'],
    tags: ['fire', 'response', 'advanced', 'emergency'],
    version: '1.0.0',
    order: 4,
    points: 150,
    estimatedTime: 30,
    content: {
      lessons: [
        {
          title: 'Fire Classification',
          order: 1,
          sections: [
            {
              type: 'text',
              order: 1,
              content: 'Fires are classified into different types: Class A (ordinary combustibles), Class B (flammable liquids), Class C (electrical), and Class D (metals).',
              metadata: {}
            },
            {
              type: 'interactive',
              order: 2,
              content: 'Fire classification interactive diagram',
              metadata: {
                url: 'https://example.com/interactive/fire-classification'
              }
            }
          ]
        },
        {
          title: 'Using Fire Extinguishers',
          order: 2,
          sections: [
            {
              type: 'text',
              order: 1,
              content: 'Remember PASS: Pull the pin, Aim at the base, Squeeze the trigger, Sweep from side to side.',
              metadata: {}
            },
            {
              type: 'video',
              order: 2,
              content: 'PASS technique demonstration',
              metadata: {
                url: 'https://example.com/videos/pass-technique.mp4',
                duration: 240
              }
            }
          ]
        }
      ],
      text: 'Advanced fire response requires understanding different fire types and appropriate response methods.',
      videos: [
        {
          url: 'https://example.com/videos/advanced-fire-response.mp4',
          title: 'Advanced Fire Response Techniques',
          duration: 600
        }
      ]
    },
    quiz: {
      questions: [
        {
          question: 'What does PASS stand for?',
          questionType: 'text',
          options: [
            'Pull, Aim, Squeeze, Sweep',
            'Push, Aim, Shoot, Stop',
            'Pull, Aim, Shoot, Stop',
            'Push, Aim, Squeeze, Sweep'
          ],
          correctAnswer: 0,
          points: 15,
          explanation: 'PASS stands for Pull the pin, Aim at the base, Squeeze the trigger, Sweep from side to side.'
        },
        {
          question: 'Which type of fire extinguisher is used for electrical fires?',
          questionType: 'text',
          options: [
            'Class A',
            'Class B',
            'Class C',
            'Class D'
          ],
          correctAnswer: 2,
          points: 15,
          explanation: 'Class C fire extinguishers are designed for electrical fires.'
        }
      ],
      passingScore: 80,
      timeLimit: 600
    },
    badges: ['Fire Response Expert'],
    isActive: true
  }
];

async function seedModules() {
  try {
    await connectDB();
    logger.info('Connected to database');

    // Clear existing modules (optional - comment out if you want to keep existing)
    // await Module.deleteMany({});
    // logger.info('Cleared existing modules');

    // Clear existing modules to ensure fresh seed data
    logger.info('🗑️  Clearing existing modules...');
    await Module.deleteMany({});
    logger.info('✅ Existing modules cleared.');

    // Insert sample modules
    const createdModules = await Module.insertMany(sampleModules);
    logger.info(`✅ Successfully seeded ${createdModules.length} modules`);

    // Log module details
    createdModules.forEach(module => {
      logger.info(`  - ${module.title} (${module.type}, ${module.difficulty})`);
    });

    process.exit(0);
  } catch (error) {
    logger.error('Error seeding modules:', error);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedModules();
}

export default seedModules;

