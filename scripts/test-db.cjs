const mongoose = require('mongoose');
require('dotenv').config();

async function testConnection() {
  const uri = process.env.MONGODB_URI;
  console.log('Attempting to connect to MongoDB Atlas...');
  
  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
    console.log('✅ Successfully connected to MongoDB Atlas!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Connection failed:');
    console.error(error);
    process.exit(1);
  }
}

testConnection();
