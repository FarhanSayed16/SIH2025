import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Module from '../src/models/Module.js';
import connectDB from '../src/config/database.js';

dotenv.config();

async function checkModules() {
  await connectDB();
  
  const modules = await Module.find({}).select('title quiz');
  console.log(`\nFound ${modules.length} modules:\n`);
  
  modules.forEach(mod => {
    console.log(`📚 ${mod.title}:`);
    if (mod.quiz && mod.quiz.questions) {
      mod.quiz.questions.forEach((q, i) => {
        console.log(`  Q${i+1}: type='${q.questionType || 'text'}', question='${q.question.substring(0, 50)}...'`);
      });
    } else {
      console.log('  ⚠️  No quiz found');
    }
    console.log('');
  });
  
  process.exit(0);
}

checkModules();

