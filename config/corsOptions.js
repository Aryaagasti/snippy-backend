const dotenv = require('dotenv');
dotenv.config();

const corsOptions = {
  origin: process.env.FRONTEND_URL || 'https://snippy-pi.vercel.app',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  maxAge: 86400 // 24 hours
};

module.exports = corsOptions;