require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const apiRoutes = require('./_lib/routes/api');

const app = express();

app.use(cors({
  origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',').map(s => s.trim()) : true,
  credentials: true
}));
app.use(express.json({ limit: '2mb' }));

// Match both /api and / since Vercel rewrites might pass different path segments
app.use('/api', apiRoutes);
app.use('/', apiRoutes); // Fallback for direct function calls

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/mobile_hub';
const PORT = process.env.PORT || 5001;

// Serverless-optimized MongoDB connection with caching
let cachedDb = null;
let isConnecting = false;

async function connectToDatabase() {
  if (cachedDb && mongoose.connection.readyState === 1) {
    return cachedDb;
  }

  if (isConnecting) {
    // Wait for existing connection attempt
    await new Promise(resolve => setTimeout(resolve, 100));
    return connectToDatabase();
  }

  isConnecting = true;

  try {
    const opts = {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 10000,
      maxPoolSize: 10,
      minPoolSize: 2,
      bufferMaxEntries: 0, // Disable buffering to prevent timeout errors
      bufferCommands: false, // Disable command buffering
    };

    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(MONGODB_URI, opts);
    }
    
    cachedDb = mongoose.connection;
    console.log('Connected to MongoDB');
    return cachedDb;
  } catch (err) {
    console.error('MongoDB connection error:', err);
    throw err;
  } finally {
    isConnecting = false;
  }
}

// Connect to database before handling requests in production
if (process.env.NODE_ENV === 'production') {
  app.use(async (req, res, next) => {
    try {
      await connectToDatabase();
      next();
    } catch (err) {
      console.error('MongoDB connection error:', err);
      res.status(500).json({ error: 'Database connection failed' });
    }
  });
} else {
  // Development: connect immediately
  mongoose.connect(MONGODB_URI, {
    serverSelectionTimeoutMS: 10000,
    socketTimeoutMS: 45000,
    bufferMaxEntries: 0,
    bufferCommands: false,
  })
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('MongoDB connection error:', err));

  app.listen(PORT, () => {
    console.log(`Backend server is running on http://localhost:${PORT}`);
  });
}

// Global error handler to catch "next is not a function" and other weirdness
app.use((err, req, res, next) => {
  console.error('[API ERROR]', err);
  res.status(500).json({ error: err.message || 'Internal Server Error' });
});

module.exports = app;
