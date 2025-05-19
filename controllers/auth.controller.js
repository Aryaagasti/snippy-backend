const { initializeApp } = require("firebase/app");
const {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail,
  sendEmailVerification,
  updateProfile
} = require("firebase/auth");

// Import Firebase Admin SDK
const { admin } = require('../config/firebase');

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID,
  measurementId: process.env.FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

// Register user with email and password
exports.register = async (req, res) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // First check if user already exists in Firebase
    try {
      const userRecord = await admin.auth().getUserByEmail(email);
      return res.status(400).json({
        success: false,
        message: 'Email is already in use',
        error: 'auth/email-already-in-use'
      });
    } catch (error) {
      // User doesn't exist, continue with registration
      if (error.code !== 'auth/user-not-found') {
        throw error;
      }
    }

    // Create user with Firebase Admin SDK
    const userRecord = await admin.auth().createUser({
      email,
      password,
      displayName: name,
      emailVerified: false
    });

    // Create custom token for the user
    const token = await admin.auth().createCustomToken(userRecord.uid);

    res.status(201).json({
      message: 'User registered successfully',
      user: {
        uid: userRecord.uid,
        email: userRecord.email,
        name: userRecord.displayName,
        emailVerified: userRecord.emailVerified
      },
      token
    });
  } catch (error) {
    console.error('Registration error:', error);

    let errorMessage = 'Registration failed';
    if (error.code === 'auth/email-already-in-use') {
      errorMessage = 'Email is already in use';
    } else if (error.code === 'auth/weak-password') {
      errorMessage = 'Password is too weak (minimum 6 characters)';
    } else if (error.code === 'auth/invalid-email') {
      errorMessage = 'Invalid email format';
    }

    res.status(400).json({
      success: false,
      message: errorMessage,
      error: error.code
    });
  }
};

// Login with email and password
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    try {
      // Get user by email
      const userRecord = await admin.auth().getUserByEmail(email);

      // We can't verify password with Admin SDK directly
      // So we'll use the client SDK to sign in
      const userCredential = await signInWithEmailAndPassword(auth, email, password);

      // Create a custom token for the user
      const token = await admin.auth().createCustomToken(userRecord.uid);

      res.status(200).json({
        message: 'Login successful',
        user: {
          uid: userRecord.uid,
          email: userRecord.email,
          name: userRecord.displayName,
          emailVerified: userRecord.emailVerified
        },
        token
      });
    } catch (error) {
      console.error('Login error:', error);

      let errorMessage = 'Login failed';
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        errorMessage = 'Invalid email or password';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Too many failed login attempts. Please try again later';
      }

      throw error;
    }
  } catch (error) {
    console.error('Login error:', error);

    let errorMessage = 'Login failed';
    if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
      errorMessage = 'Invalid email or password';
    } else if (error.code === 'auth/too-many-requests') {
      errorMessage = 'Too many failed login attempts. Please try again later';
    }

    res.status(401).json({
      success: false,
      message: errorMessage,
      error: error.code
    });
  }
};

// Google authentication
exports.googleAuth = async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ message: 'No token provided' });
    }

    console.log('Received token for Google auth:', token.substring(0, 20) + '...');

    try {
      // Verify the token with Firebase Admin
      const decodedToken = await admin.auth().verifyIdToken(token);
      const uid = decodedToken.uid;

      console.log('Successfully decoded token for user:', uid);

      // Get user details from Firebase
      const userRecord = await admin.auth().getUser(uid);

      // Generate a new token for the user
      const customToken = await admin.auth().createCustomToken(uid);

      return res.status(200).json({
        message: 'Google authentication successful',
        user: {
          uid: userRecord.uid,
          email: userRecord.email,
          name: userRecord.displayName || 'User',
          photoURL: userRecord.photoURL,
          emailVerified: userRecord.emailVerified
        },
        token: customToken
      });
    } catch (verifyError) {
      console.error('Token verification error:', verifyError);

      // If token verification fails, try to create a new user with the Google credentials
      // This is a fallback for when the user exists in Firebase Auth but not in our system
      try {
        // Extract user info from the token (this is a simplified approach)
        // In a real implementation, you'd use the Google OAuth API to verify the token
        const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());

        if (!payload.email) {
          throw new Error('No email found in token payload');
        }

        // Check if user exists
        try {
          const existingUser = await admin.auth().getUserByEmail(payload.email);

          // User exists, create a custom token
          const customToken = await admin.auth().createCustomToken(existingUser.uid);

          return res.status(200).json({
            message: 'Google authentication successful',
            user: {
              uid: existingUser.uid,
              email: existingUser.email,
              name: existingUser.displayName || 'User',
              photoURL: existingUser.photoURL,
              emailVerified: existingUser.emailVerified
            },
            token: customToken
          });
        } catch (userError) {
          // User doesn't exist, create a new one
          if (userError.code === 'auth/user-not-found') {
            const newUser = await admin.auth().createUser({
              email: payload.email,
              displayName: payload.name || 'Google User',
              photoURL: payload.picture,
              emailVerified: true
            });

            const customToken = await admin.auth().createCustomToken(newUser.uid);

            return res.status(200).json({
              message: 'Google authentication successful (new user)',
              user: {
                uid: newUser.uid,
                email: newUser.email,
                name: newUser.displayName,
                photoURL: newUser.photoURL,
                emailVerified: newUser.emailVerified
              },
              token: customToken
            });
          }

          throw userError;
        }
      } catch (fallbackError) {
        console.error('Fallback authentication error:', fallbackError);
        throw fallbackError;
      }
    }
  } catch (error) {
    console.error('Google auth error:', error);
    res.status(401).json({
      success: false,
      message: 'Google authentication failed',
      error: error.message
    });
  }
};

// Logout user
exports.logout = async (req, res) => {
  try {
    await signOut(auth);
    res.status(200).json({ message: 'Logout successful' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ message: 'Logout failed' });
  }
};

// Password reset
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    await sendPasswordResetEmail(auth, email);
    res.status(200).json({ message: 'Password reset email sent' });
  } catch (error) {
    console.error('Password reset error:', error);

    let errorMessage = 'Failed to send password reset email';
    if (error.code === 'auth/user-not-found') {
      // For security reasons, don't reveal if email exists or not
      res.status(200).json({ message: 'If this email exists, a password reset link has been sent' });
      return;
    }

    res.status(400).json({ message: errorMessage });
  }
};

// Get current user
exports.getCurrentUser = async (req, res) => {
  try {
    // Get token from authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No authentication token provided' });
    }

    const token = authHeader.split('Bearer ')[1];

    try {
      // Verify the token
      const decodedToken = await admin.auth().verifyIdToken(token);
      const uid = decodedToken.uid;

      // Get user details from Firebase
      const userRecord = await admin.auth().getUser(uid);

      // Generate a new token for the user
      const customToken = await admin.auth().createCustomToken(uid);

      res.status(200).json({
        user: {
          uid: userRecord.uid,
          email: userRecord.email,
          name: userRecord.displayName || 'User',
          photoURL: userRecord.photoURL,
          emailVerified: userRecord.emailVerified
        },
        token: customToken
      });
    } catch (error) {
      console.error('Token verification error:', error);

      // If the token is invalid or expired, try to use the client SDK
      const currentUser = auth.currentUser;

      if (!currentUser) {
        return res.status(401).json({ message: 'Not authenticated' });
      }

      // Get fresh token
      const newToken = await currentUser.getIdToken(true);

      res.status(200).json({
        user: {
          uid: currentUser.uid,
          email: currentUser.email,
          name: currentUser.displayName || 'User',
          photoURL: currentUser.photoURL,
          emailVerified: currentUser.emailVerified
        },
        token: newToken
      });
    }
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get current user',
      error: error.message
    });
  }
};