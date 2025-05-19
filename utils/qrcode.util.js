const QRCode = require('qrcode');

/**
 * Generate QR code for a URL
 * @param {string} url - URL to encode in QR code
 * @param {Object} options - QR code options
 * @returns {Promise<Buffer>} - QR code image buffer
 */
const generateQRCode = async (url, options = {}) => {
  try {
    // Default options
    const defaultOptions = {
      errorCorrectionLevel: 'H',
      type: 'png',
      quality: 0.92,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    };
    
    // Merge default options with provided options
    const mergedOptions = { ...defaultOptions, ...options };
    
    // Generate QR code as buffer
    return await QRCode.toBuffer(url, mergedOptions);
  } catch (error) {
    console.error('Error generating QR code:', error);
    throw error;
  }
};

module.exports = {
  generateQRCode
};