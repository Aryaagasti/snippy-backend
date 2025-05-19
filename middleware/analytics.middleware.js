const geoip = require('geoip-lite');
const { db } = require('../config/firebase');

/**
 * Middleware to collect analytics data for URL redirects
 */
const collectAnalytics = async (req, res, next) => {
  try {
    // Get IP address
    const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    
    // Get geo location from IP
    const geo = geoip.lookup(ip) || { country: 'Unknown' };
    
    // Get user agent details
    const userAgent = req.headers['user-agent'];
    
    // Extract browser and platform info
    const browser = getBrowser(userAgent);
    const platform = getPlatform(userAgent);
    
    // Add analytics data to request object
    req.analytics = {
      timestamp: new Date(),
      ip: ip.replace(/^.*:/, ''), // Sanitize IP address
      country: geo.country,
      region: geo.region || 'Unknown',
      city: geo.city || 'Unknown',
      browser,
      platform,
      referrer: req.headers.referer || 'Direct',
    };
    
    next();
  } catch (error) {
    console.error('Error collecting analytics:', error);
    // Continue even if analytics collection fails
    req.analytics = { timestamp: new Date() };
    next();
  }
};

// Helper function to extract browser info
function getBrowser(userAgent) {
  if (!userAgent) return 'Unknown';
  
  if (userAgent.includes('Firefox')) return 'Firefox';
  if (userAgent.includes('Chrome') && !userAgent.includes('Edg')) return 'Chrome';
  if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) return 'Safari';
  if (userAgent.includes('Edg')) return 'Edge';
  if (userAgent.includes('MSIE') || userAgent.includes('Trident/')) return 'Internet Explorer';
  
  return 'Other';
}

// Helper function to extract platform info
function getPlatform(userAgent) {
  if (!userAgent) return 'Unknown';
  
  if (userAgent.includes('Windows')) return 'Windows';
  if (userAgent.includes('Mac OS')) return 'MacOS';
  if (userAgent.includes('Linux') && !userAgent.includes('Android')) return 'Linux';
  if (userAgent.includes('Android')) return 'Android';
  if (userAgent.includes('iPhone') || userAgent.includes('iPad')) return 'iOS';
  
  return 'Other';
}

module.exports = {
  collectAnalytics
};