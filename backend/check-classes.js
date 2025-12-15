import mongoose from 'mongoose';
import './src/config/env-loader.js';

const uri = process.env.MONGODB_URI;
await mongoose.connect(uri);
const db = mongoose.connection.db;

// List all classes with their classCode
const classes = await db.collection('classes').find({}).toArray();
console.log('=== ALL CLASSES (' + classes.length + ' total) ===');
classes.forEach((c, i) => {
  console.log((i+1) + '. classCode: ' + c.classCode + ', Grade: ' + c.grade + ', Section: ' + c.section);
});

// List all schools
console.log('\n=== ALL SCHOOLS/INSTITUTIONS ===');
const schools = await db.collection('schools').find({}).toArray();
schools.forEach((s, i) => {
  console.log((i+1) + '. ID: ' + s._id + ', Name: ' + s.name);
});

process.exit(0);
