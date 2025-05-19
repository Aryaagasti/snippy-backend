const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Import routes
const urlRoutes = require('./routes/url.routes');
const authRoutes = require('./routes/auth.routes');

// Import CORS options
const corsOptions = require('./config/corsOptions');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api', urlRoutes);
app.use('/api/auth', authRoutes);

// Redirect route (separate from API routes)
app.get('/s/:slug', require('./controllers/url.controller').redirectToUrl);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Server is running' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});