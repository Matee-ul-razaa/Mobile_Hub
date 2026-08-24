const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://BilawalHaider:Bilawal5201@cluster0.cs7qy8q.mongodb.net/mobile_hub?appName=Cluster0';

async function testConnection() {
  console.log('Testing MongoDB connection...');
  console.log('Connection string:', MONGODB_URI.replace(/:[^:@]+@/, ':****@'));
  
  try {
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 30000,
    });
    console.log('✅ MongoDB connection successful!');
    
    // Test a simple query
    const result = await mongoose.connection.db.listCollections().toArray();
    console.log('✅ Collections found:', result.length);
    
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('❌ MongoDB connection failed:', err.message);
    process.exit(1);
  }
}

testConnection();
