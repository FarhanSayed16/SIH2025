/**
 * Phase 3.3.3: Badge Seeding Script
 * Seeds the database with sample badges for testing and development
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Badge from '../src/models/Badge.js';
import connectDB from '../src/config/database.js';
import logger from '../src/config/logger.js';

dotenv.config();

const sampleBadges = [
  // Module Badges
  {
    id: 'fire-marshal',
    name: 'Fire Marshal',
    description: 'Completed all fire safety modules',
    icon: '🔥',
    category: 'module',
    criteria: {
      type: 'module_complete',
      value: 'safety', // Use moduleCategory for filtering
      moduleCategory: 'safety'
    },
    xpReward: 100,
    gradeLevel: ['all'],
    isRare: false,
    order: 1
  },
  {
    id: 'module-master',
    name: 'Module Master',
    description: 'Completed all learning modules',
    icon: '📚',
    category: 'module',
    criteria: {
      type: 'module_all',
      value: 1
    },
    xpReward: 500,
    gradeLevel: ['all'],
    isRare: true,
    order: 2
  },
  // Game Badges
  {
    id: 'earthquake-expert',
    name: 'Earthquake Expert',
    description: 'Won 5 games of Earthquake Shake',
    icon: '🌍',
    category: 'game',
    criteria: {
      type: 'game_wins',
      value: 5,
      gameType: 'earthquake-shake'
    },
    xpReward: 150,
    gradeLevel: ['all'],
    isRare: false,
    order: 10
  },
  {
    id: 'hazard-detective',
    name: 'Hazard Detective',
    description: 'Found all hazards in 5 levels',
    icon: '🔍',
    category: 'game',
    criteria: {
      type: 'game_perfect',
      value: 5,
      gameType: 'hazard-hunter'
    },
    xpReward: 200,
    gradeLevel: ['all'],
    isRare: false,
    order: 11
  },
  {
    id: 'bag-packer-master',
    name: 'Bag Packer Master',
    description: 'Perfect score in Bag Packer game',
    icon: '🎒',
    category: 'game',
    criteria: {
      type: 'game_perfect',
      value: 3,
      gameType: 'bag-packer'
    },
    xpReward: 150,
    gradeLevel: ['all'],
    isRare: false,
    order: 12
  },
  {
    id: 'game-champion',
    name: 'Game Champion',
    description: 'Won 10 games across all game types',
    icon: '🏆',
    category: 'game',
    criteria: {
      type: 'game_wins',
      value: 10,
      gameType: 'all'
    },
    xpReward: 300,
    gradeLevel: ['all'],
    isRare: true,
    order: 13
  },
  // Drill Badges
  {
    id: 'quick-responder',
    name: 'Quick Responder',
    description: 'Acknowledged 10 drills',
    icon: '⚡',
    category: 'drill',
    criteria: {
      type: 'drill_ack',
      value: 10
    },
    xpReward: 100,
    gradeLevel: ['all'],
    isRare: false,
    order: 20
  },
  {
    id: 'drill-master',
    name: 'Drill Master',
    description: 'Acknowledged 50 drills',
    icon: '🎖️',
    category: 'drill',
    criteria: {
      type: 'drill_ack',
      value: 50
    },
    xpReward: 250,
    gradeLevel: ['all'],
    isRare: true,
    order: 21
  },
  // Streak Badges
  {
    id: 'streak-starter',
    name: 'Streak Starter',
    description: '7-day login streak',
    icon: '🔥',
    category: 'streak',
    criteria: {
      type: 'streak_days',
      value: 7
    },
    xpReward: 50,
    gradeLevel: ['all'],
    isRare: false,
    order: 30
  },
  {
    id: 'streak-master',
    name: 'Streak Master',
    description: '30-day login streak',
    icon: '💪',
    category: 'streak',
    criteria: {
      type: 'streak_days',
      value: 30
    },
    xpReward: 200,
    gradeLevel: ['all'],
    isRare: true,
    order: 31
  },
  // Achievement Badges
  {
    id: 'safety-champion',
    name: 'Safety Champion',
    description: 'Reached 80% preparedness score',
    icon: '🛡️',
    category: 'achievement',
    criteria: {
      type: 'score_threshold',
      value: 80
    },
    xpReward: 150,
    gradeLevel: ['all'],
    isRare: false,
    order: 40
  },
  {
    id: 'safety-expert',
    name: 'Safety Expert',
    description: 'Reached 95% preparedness score',
    icon: '⭐',
    category: 'achievement',
    criteria: {
      type: 'score_threshold',
      value: 95
    },
    xpReward: 400,
    gradeLevel: ['all'],
    isRare: true,
    order: 41
  },
  // Special Badges
  {
    id: 'first-step',
    name: 'First Step',
    description: 'Completed your first module',
    icon: '👣',
    category: 'special',
    criteria: {
      type: 'module_complete',
      value: 1 // Completed at least 1 module
    },
    xpReward: 25,
    gradeLevel: ['all'],
    isRare: false,
    order: 50
  },
  {
    id: 'early-bird',
    name: 'Early Bird',
    description: 'Completed first module within first week',
    icon: '🌅',
    category: 'special',
    criteria: {
      type: 'custom',
      value: 'first_week_completion'
    },
    xpReward: 50,
    gradeLevel: ['all'],
    isRare: false,
    order: 51
  }
];

async function seedBadges() {
  try {
    await connectDB();
    logger.info('🌱 Seeding badges...\n');

    let created = 0;
    let updated = 0;
    let skipped = 0;

    for (const badgeData of sampleBadges) {
      const existing = await Badge.findOne({ id: badgeData.id });

      if (existing) {
        // Update existing badge
        Object.assign(existing, badgeData);
        await existing.save();
        logger.info(`🔄 Updated: ${badgeData.name} (${badgeData.id})`);
        updated++;
      } else {
        // Create new badge
        const badge = new Badge(badgeData);
        await badge.save();
        logger.info(`✅ Created: ${badgeData.name} (${badgeData.id})`);
        created++;
      }
    }

    logger.info(`\n📊 Badge Seeding Summary:`);
    logger.info(`   ✅ Created: ${created}`);
    logger.info(`   🔄 Updated: ${updated}`);
    logger.info(`   📦 Total: ${sampleBadges.length}\n`);
    
    process.exit(0);
  } catch (error) {
    logger.error('❌ Error seeding badges:', error);
    process.exit(1);
  }
}

seedBadges();

