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

async function connectToDatabase() {
  if (cachedDb) {
    return cachedDb;
  }

  const opts = {
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 30000,
    maxPoolSize: 10,
    minPoolSize: 2,
  };

  const conn = await mongoose.connect(MONGODB_URI, opts);
  cachedDb = conn;
  console.log('Connected to MongoDB');
  return conn;
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
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 30000,
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
