/**
 * Phase 3.2.2: Seed Hazards for Hazard Hunter Game
 * Creates initial hazards with locations for tap detection
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Hazard from '../src/models/Hazard.js';
import connectDB from '../src/config/database.js';

dotenv.config();

// Sample hazards for different levels and difficulties
const hazards = [
  // Level 1 - Easy (Kitchen Scene)
  {
    name: 'Unattended Stove',
    type: 'fire',
    description: 'Stove left on without supervision',
    imageUrl: 'https://images.unsplash.com/photo-1556910096-6f5e72db6803?w=800',
    location: { x: 45, y: 30, width: 15, height: 20 },
    level: 1,
    difficulty: 'easy',
    points: 10,
    penaltyPoints: 5,
    gradeLevel: ['KG', '1', '2', '3', '4', '5'],
  },
  {
    name: 'Blocked Fire Exit',
    type: 'exit',
    description: 'Exit door blocked by furniture',
    imageUrl: 'https://images.unsplash.com/photo-1556910096-6f5e72db6803?w=800',
    location: { x: 80, y: 60, width: 12, height: 25 },
    level: 1,
    difficulty: 'easy',
    points: 15,
    penaltyPoints: 5,
    gradeLevel: ['KG', '1', '2', '3', '4', '5'],
  },
  {
    name: 'Exposed Electrical Wire',
    type: 'electrical',
    description: 'Damaged electrical wire visible',
    imageUrl: 'https://images.unsplash.com/photo-1556910096-6f5e72db6803?w=800',
    location: { x: 25, y: 50, width: 10, height: 15 },
    level: 1,
    difficulty: 'easy',
    points: 10,
    penaltyPoints: 5,
    gradeLevel: ['KG', '1', '2', '3', '4', '5'],
  },

  // Level 1 - Medium (Classroom Scene)
  {
    name: 'Overloaded Power Strip',
    type: 'electrical',
    description: 'Too many devices plugged in one outlet',
    imageUrl: 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=800',
    location: { x: 50, y: 70, width: 12, height: 10 },
    level: 1,
    difficulty: 'medium',
    points: 12,
    penaltyPoints: 5,
    gradeLevel: ['3', '4', '5', '6', '7'],
  },
  {
    name: 'Cracked Window',
    type: 'structural',
    description: 'Broken glass can cause injuries',
    imageUrl: 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=800',
    location: { x: 15, y: 25, width: 20, height: 30 },
    level: 1,
    difficulty: 'medium',
    points: 10,
    penaltyPoints: 5,
    gradeLevel: ['3', '4', '5', '6', '7'],
  },
  {
    name: 'Trip Hazard',
    type: 'structural',
    description: 'Loose carpet or cables on floor',
    imageUrl: 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=800',
    location: { x: 60, y: 85, width: 25, height: 10 },
    level: 1,
    difficulty: 'medium',
    points: 8,
    penaltyPoints: 5,
    gradeLevel: ['3', '4', '5', '6', '7'],
  },

  // Level 2 - Medium (School Corridor)
  {
    name: 'Frayed Extension Cord',
    type: 'electrical',
    description: 'Damaged extension cord poses fire risk',
    imageUrl: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800',
    location: { x: 40, y: 45, width: 15, height: 8 },
    level: 2,
    difficulty: 'medium',
    points: 15,
    penaltyPoints: 5,
    gradeLevel: ['4', '5', '6', '7', '8'],
  },
  {
    name: 'Emergency Exit Sign Not Working',
    type: 'exit',
    description: 'Exit sign is not illuminated',
    imageUrl: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800',
    location: { x: 75, y: 10, width: 20, height: 8 },
    level: 2,
    difficulty: 'medium',
    points: 12,
    penaltyPoints: 5,
    gradeLevel: ['4', '5', '6', '7', '8'],
  },
  {
    name: 'Leaking Pipe',
    type: 'structural',
    description: 'Water leak can cause slips and electrical hazards',
    imageUrl: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800',
    location: { x: 30, y: 60, width: 10, height: 20 },
    level: 2,
    difficulty: 'medium',
    points: 10,
    penaltyPoints: 5,
    gradeLevel: ['4', '5', '6', '7', '8'],
  },

  // Level 2 - Hard (Science Lab)
  {
    name: 'Unlabeled Chemical Container',
    type: 'chemical',
    description: 'Chemicals without proper labels are dangerous',
    imageUrl: 'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=800',
    location: { x: 55, y: 50, width: 15, height: 20 },
    level: 2,
    difficulty: 'hard',
    points: 20,
    penaltyPoints: 8,
    gradeLevel: ['6', '7', '8', '9', '10', '11', '12'],
  },
  {
    name: 'Open Flammable Storage',
    type: 'fire',
    description: 'Flammable materials not properly stored',
    imageUrl: 'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=800',
    location: { x: 20, y: 40, width: 18, height: 15 },
    level: 2,
    difficulty: 'hard',
    points: 18,
    penaltyPoints: 8,
    gradeLevel: ['6', '7', '8', '9', '10', '11', '12'],
  },
  {
    name: 'Exposed Circuit Breaker',
    type: 'electrical',
    description: 'Electrical panel left open',
    imageUrl: 'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=800',
    location: { x: 70, y: 65, width: 15, height: 20 },
    level: 2,
    difficulty: 'hard',
    points: 15,
    penaltyPoints: 8,
    gradeLevel: ['6', '7', '8', '9', '10', '11', '12'],
  },

  // Level 3 - Hard (General)
  {
    name: 'Smoke Detector Missing Battery',
    type: 'fire',
    description: 'Smoke detector without battery cannot alert',
    imageUrl: 'https://images.unsplash.com/photo-1556910096-6f5e72db6803?w=800',
    location: { x: 85, y: 15, width: 10, height: 8 },
    level: 3,
    difficulty: 'hard',
    points: 20,
    penaltyPoints: 10,
    gradeLevel: ['all'],
  },
  {
    name: 'Obstructed Fire Extinguisher',
    type: 'fire',
    description: 'Fire extinguisher blocked by objects',
    imageUrl: 'https://images.unsplash.com/photo-1556910096-6f5e72db6803?w=800',
    location: { x: 10, y: 20, width: 12, height: 18 },
    level: 3,
    difficulty: 'hard',
    points: 18,
    penaltyPoints: 10,
    gradeLevel: ['all'],
  },
  {
    name: 'Exposed Electrical Outlet',
    type: 'electrical',
    description: 'Damaged outlet without cover plate',
    imageUrl: 'https://images.unsplash.com/photo-1556910096-6f5e72db6803?w=800',
    location: { x: 45, y: 75, width: 8, height: 10 },
    level: 3,
    difficulty: 'hard',
    points: 15,
    penaltyPoints: 10,
    gradeLevel: ['all'],
  },
];

async function seedHazards() {
  try {
    await connectDB();
    console.log('🌱 Seeding hazards for Hazard Hunter game...\n');

    let created = 0;
    let skipped = 0;

    for (const hazardData of hazards) {
      // Check if hazard already exists (by name, level, and difficulty)
      const existing = await Hazard.findOne({
        name: hazardData.name,
        level: hazardData.level,
        difficulty: hazardData.difficulty
      });

      if (existing) {
        console.log(`⏭️  Skipped: ${hazardData.name} (Level ${hazardData.level}, ${hazardData.difficulty}) - already exists`);
        skipped++;
        continue;
      }

      const hazard = new Hazard({
        ...hazardData,
        isActive: true
      });

      await hazard.save();
      console.log(`✅ Created: ${hazardData.name} (Level ${hazardData.level}, ${hazardData.difficulty}) - ${hazardData.type}`);
      created++;
    }

    console.log(`\n📊 Summary:`);
    console.log(`   ✅ Created: ${created}`);
    console.log(`   ⏭️  Skipped: ${skipped}`);
    console.log(`   📦 Total: ${hazards.length}\n`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding hazards:', error);
    process.exit(1);
  }
}

seedHazards();

