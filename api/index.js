require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const apiRoutes = require('./_lib/routes/api');

const app = express();

app.use(cors());
app.use(express.json());

// Match both /api and / since Vercel rewrites might pass different path segments
app.use('/api', apiRoutes);
app.use('/', apiRoutes); // Fallback for direct function calls

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/mobile_hub';
const PORT = process.env.PORT || 5001;

mongoose.connect(MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`Backend server is running on http://localhost:${PORT}`);
  });
}

module.exports = app;
