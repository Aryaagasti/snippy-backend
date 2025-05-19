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
    
    // Create user with email and password
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Update user profile using the imported updateProfile function
    await updateProfile(user, {
      displayName: name
    });

    // Send email verification
    await sendEmailVerification(user);
    
    // Get auth token
    const token = await user.getIdToken();
    
    // Get updated user data
    const updatedUser = auth.currentUser;
    
    res.status(201).json({
      message: 'User registered successfully',
      user: {
        uid: updatedUser.uid,
        email: updatedUser.email,
        name: updatedUser.displayName,
        emailVerified: updatedUser.emailVerified
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
    
    // Sign in with email and password
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Get auth token
    const token = await user.getIdToken();
    
    res.status(200).json({
      message: 'Login successful',
      user: {
        uid: user.uid,
        email: user.email,
        name: user.displayName,
        emailVerified: user.emailVerified
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
    
    res.status(401).json({ message: errorMessage });
  }
};

// Google authentication
exports.googleAuth = async (req, res) => {
  try {
    // This would typically be handled on the client side
    // Here we're showing the server-side implementation for reference
    const result = await signInWithPopup(auth, googleProvider);
    
    // Get credentials
    const credential = GoogleAuthProvider.credentialFromResult(result);
    const token = credential.accessToken;
    const user = result.user;
    
    res.status(200).json({
      message: 'Google authentication successful',
      user: {
        uid: user.uid,
        email: user.email,
        name: user.displayName,
        photoURL: user.photoURL,
        emailVerified: user.emailVerified
      },
      token
    });
  } catch (error) {
    console.error('Google auth error:', error);
    res.status(401).json({ message: 'Google authentication failed' });
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
    const currentUser = auth.currentUser;
    
    if (!currentUser) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    
    // Get fresh token
    const token = await currentUser.getIdToken(true);
    
    res.status(200).json({
      user: {
        uid: currentUser.uid,
        email: currentUser.email,
        name: currentUser.displayName,
        photoURL: currentUser.photoURL,
        emailVerified: currentUser.emailVerified
      },
      token
    });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({ message: 'Failed to get current user' });
  }
};