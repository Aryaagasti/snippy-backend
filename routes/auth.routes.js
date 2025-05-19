const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { validateRequest } = require('../middleware/validation.middleware');

// Register new user
router.post('/register', 
  validateRequest([
    { field: 'email', validation: 'required|email' },
    { field: 'password', validation: 'required|min:6' },
    { field: 'name', validation: 'required' }
  ]),
  authController.register
);

// Login user
router.post('/login', 
  validateRequest([
    { field: 'email', validation: 'required|email' },
    { field: 'password', validation: 'required' }
  ]),
  authController.login
);

// Google authentication
router.post('/google', authController.googleAuth);

// Logout user
router.post('/logout', authController.logout);

// Password reset
router.post('/forgot-password', 
  validateRequest([
    { field: 'email', validation: 'required|email' }
  ]),
  authController.forgotPassword
);

// Get current user
router.get('/me', authController.getCurrentUser);

module.exports = router;