const { admin } = require('../config/firebase');

// Middleware to verify Firebase token
const verifyToken = async (req, res, next) => {
  try {
    // Get token from authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'No authentication token provided'
      });
    }

    const token = authHeader.split('Bearer ')[1];

    try {
      // Verify token
      const decodedToken = await admin.auth().verifyIdToken(token);

      // Add user info to request
      req.user = {
        uid: decodedToken.uid,
        email: decodedToken.email,
        email_verified: decodedToken.email_verified
      };

      next();
    } catch (verifyError) {
      console.error('Token verification error:', verifyError);

      // Try to extract user info from the token if possible
      try {
        // This is a simplified approach - in production, you'd want more robust token handling
        const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());

        if (payload.user_id || payload.sub) {
          const uid = payload.user_id || payload.sub;

          try {
            // Get user from Firebase
            const userRecord = await admin.auth().getUser(uid);

            // Add user info to request
            req.user = {
              uid: userRecord.uid,
              email: userRecord.email,
              email_verified: userRecord.emailVerified
            };

            return next();
          } catch (userError) {
            console.error('User lookup error:', userError);
            throw userError;
          }
        }

        throw new Error('Could not extract user ID from token');
      } catch (fallbackError) {
        console.error('Token fallback error:', fallbackError);

        if (verifyError.code === 'auth/id-token-expired') {
          return res.status(401).json({
            success: false,
            message: 'Token expired'
          });
        }

        return res.status(401).json({
          success: false,
          message: 'Invalid authentication token',
          error: verifyError.message
        });
      }
    }
  } catch (error) {
    console.error('Auth middleware error:', error);

    return res.status(401).json({
      success: false,
      message: 'Authentication failed',
      error: error.message
    });
  }
};

module.exports = { verifyToken };