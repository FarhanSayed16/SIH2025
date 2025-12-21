/**
 * Phase 3.2: Seed Game Items for Bag Packer
 * Creates initial game items (correct and incorrect items)
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import GameItem from '../src/models/GameItem.js';
import connectDB from '../src/config/database.js';

dotenv.config();

const gameItems = [
  // CORRECT ITEMS (Emergency essentials)
  { name: 'Flashlight', category: 'emergency', isCorrect: true, points: 10, description: 'Essential for seeing in the dark', emergencyType: 'general', feedbackMessage: 'Great choice! Flashlights are essential.' },
  { name: 'Water Bottle', category: 'food', isCorrect: true, points: 10, description: 'Stay hydrated during emergencies', emergencyType: 'general', feedbackMessage: 'Perfect! Water is crucial.' },
  { name: 'Whistle', category: 'emergency', isCorrect: true, points: 10, description: 'Signal for help', emergencyType: 'general', feedbackMessage: 'Excellent! Whistles help rescuers find you.' },
  { name: 'First Aid Kit', category: 'tool', isCorrect: true, points: 15, description: 'Treat injuries', emergencyType: 'general', feedbackMessage: 'Very important! First aid saves lives.' },
  { name: 'Mobile Phone', category: 'electronics', isCorrect: true, points: 10, description: 'Call for help', emergencyType: 'general', feedbackMessage: 'Good! Phones help you call emergency services.' },
  { name: 'Emergency Blanket', category: 'emergency', isCorrect: true, points: 10, description: 'Stay warm', emergencyType: 'general', feedbackMessage: 'Smart choice! Blankets keep you warm.' },
  { name: 'Batteries', category: 'tool', isCorrect: true, points: 10, description: 'Power your devices', emergencyType: 'general', feedbackMessage: 'Great! Batteries power important devices.' },
  { name: 'Emergency Radio', category: 'electronics', isCorrect: true, points: 10, description: 'Listen to emergency updates', emergencyType: 'general', feedbackMessage: 'Excellent! Radios keep you informed.' },
  
  // INCORRECT ITEMS (Funny distractions)
  { name: 'PlayStation 5', category: 'electronics', isCorrect: false, points: -5, description: 'Not useful in emergencies', feedbackMessage: 'Oops! Gaming consoles won\'t help in emergencies. 😄' },
  { name: 'Pizza', category: 'food', isCorrect: false, points: -5, description: 'Not suitable for emergency kit', feedbackMessage: 'Tasty but not practical! Food should be non-perishable. 🍕' },
  { name: 'Makeup Kit', category: 'other', isCorrect: false, points: -5, description: 'Not essential for survival', feedbackMessage: 'Fun but not essential for emergencies! 💄' },
  { name: 'Teddy Bear', category: 'other', isCorrect: false, points: -2, description: 'Comforting but not essential', feedbackMessage: 'Cute but not essential for survival! 🧸' },
  { name: 'Chocolate Bar', category: 'food', isCorrect: false, points: -5, description: 'Melts and not nutritious', feedbackMessage: 'Yummy but not suitable for emergency storage! 🍫' },
  { name: 'Hair Dryer', category: 'electronics', isCorrect: false, points: -5, description: 'Needs electricity', feedbackMessage: 'Won\'t work without power! 💨' },
  { name: 'TV Remote', category: 'electronics', isCorrect: false, points: -5, description: 'Useless without TV and power', feedbackMessage: 'Won\'t help you survive! 📺' },
  { name: 'Video Game', category: 'distraction', isCorrect: false, points: -5, description: 'Not essential', feedbackMessage: 'Fun but not for emergencies! 🎮' },
];

async function seedGameItems() {
  try {
    await connectDB();
    console.log('🌱 Seeding game items...\n');

    let created = 0;
    let skipped = 0;

    for (const itemData of gameItems) {
      const existing = await GameItem.findOne({
        name: itemData.name,
        gameType: 'bag-packer'
      });

      if (existing) {
        console.log(`⏭️  Skipped: ${itemData.name} (already exists)`);
        skipped++;
        continue;
      }

      const item = new GameItem({
        ...itemData,
        gameType: 'bag-packer',
        gradeLevel: ['all'],
        isActive: true
      });

      await item.save();
      console.log(`✅ Created: ${itemData.name} (${itemData.isCorrect ? 'CORRECT' : 'WRONG'})`);
      created++;
    }

    console.log(`\n📊 Summary:`);
    console.log(`   ✅ Created: ${created}`);
    console.log(`   ⏭️  Skipped: ${skipped}`);
    console.log(`   📦 Total: ${gameItems.length}\n`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding game items:', error);
    process.exit(1);
  }
}

seedGameItems();

