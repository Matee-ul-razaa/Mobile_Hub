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

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/mobile_hub';
const PORT = process.env.PORT || 5001;

// Serverless-optimized MongoDB connection with proper caching
let cachedDb = null;
let isConnecting = false;

async function connectToDatabase() {
  // Return existing connection if it's ready
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  // If already connecting, wait for it to complete
  if (isConnecting) {
    await new Promise(resolve => setTimeout(resolve, 200));
    return connectToDatabase();
  }

  isConnecting = true;

  try {
    // Optimized for M0 cluster - smaller pool size to avoid connection limits
    const opts = {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 30000,
      connectTimeoutMS: 10000,
      maxPoolSize: 2, // Reduced for M0 cluster (limit is ~500 connections)
      minPoolSize: 1,
      maxIdleTimeMS: 30000, // Close idle connections after 30s
    };

    // Only connect if not already connected
    if (mongoose.connection.readyState === 0) {
      console.log('Connecting to MongoDB...');
      await mongoose.connect(MONGODB_URI, opts);
      console.log('Connected to MongoDB');
    }
    
    cachedDb = mongoose.connection;
    return cachedDb;
  } catch (err) {
    console.error('MongoDB connection error:', err);
    isConnecting = false;
    throw err;
  } finally {
    isConnecting = false;
  }
}

// Connect to database before handling requests (Serverless or Local)
app.use(async (req, res, next) => {
  try {
    await connectToDatabase();
    next();
  } catch (err) {
    console.error('MongoDB connection error:', err);
    res.status(500).json({ error: 'Database connection failed' });
  }
});

// Match both /api and / since Vercel rewrites might pass different path segments
// MUST BE AFTER DB CONNECTION MIDDLEWARE
app.use('/api', apiRoutes);
app.use('/', apiRoutes); // Fallback for direct function calls

if (process.env.NODE_ENV !== 'production') {
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
