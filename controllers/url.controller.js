const { nanoid } = require('nanoid');
const urlModel = require('../model/url.model');
const qrcodeUtil = require('../utils/qrcode.util');
const slugUtil = require('../utils/slig.util');
const { admin } = require('../config/firebase');

/**
 * Shorten a URL
 */
const shortenUrl = async (req, res) => {
  try {
    const { originalUrl, customSlug, expiresAt, oneTimeUse, description } = req.body;

    if (!originalUrl) {
      return res.status(400).json({
        success: false,
        message: 'Original URL is required'
      });
    }

    // Validate URL format
    try {
      new URL(originalUrl);
    } catch (err) {
      return res.status(400).json({
        success: false,
        message: 'Invalid URL format'
      });
    }

    // Generate or use custom slug
    const slug = customSlug || nanoid(parseInt(process.env.SLUG_LENGTH) || 6);

    // Check if custom slug already exists
    if (customSlug) {
      const existingUrl = await urlModel.getUrlBySlug(customSlug);
      if (existingUrl) {
        return res.status(409).json({
          success: false,
          message: 'Custom slug already in use'
        });
      }
    }

    // Create URL object
    const urlData = {
      originalUrl,
      slug,
      userId: req.user.uid,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      totalClicks: 0,
      active: true,
      expiresAt: expiresAt ? new Date(expiresAt) : null, // Only set expiration if explicitly provided
      oneTimeUse: oneTimeUse || false,
      description: description || '',
      shortUrl: `${process.env.BASE_URL}/s/${slug}`
    };

    // Save to database
    const result = await urlModel.createUrl(urlData);

    return res.status(201).json({
      success: true,
      data: {
        slug: result.slug,
        shortUrl: `${process.env.BASE_URL}/s/${result.slug}`,
        originalUrl,
        expiresAt: urlData.expiresAt,
        oneTimeUse: urlData.oneTimeUse
      }
    });
  } catch (error) {
    console.error('Error shortening URL:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

/**
 * Redirect to original URL
 */
const redirectToUrl = async (req, res) => {
  try {
    const { slug } = req.params;

    // Get URL from database
    const url = await urlModel.getUrlBySlug(slug);

    if (!url) {
      return res.status(404).send('URL not found');
    }

    // Check if URL is active
    if (!url.active) {
      return res.status(410).send('This link has been deactivated');
    }

    // Check if URL has expired (only if expiration date was set)
    if (url.expiresAt && new Date(url.expiresAt.toDate()) < new Date()) {
      return res.status(410).send('This link has expired');
    }

    // Update analytics
    if (req.analytics) {
      await urlModel.updateUrlAnalytics(slug, req.analytics);
    }

    // We're no longer automatically deactivating one-time use URLs
    // The user will manually deactivate URLs when needed

    // Redirect to original URL
    return res.redirect(url.originalUrl);
  } catch (error) {
    console.error('Error redirecting to URL:', error);
    return res.status(500).send('Server error');
  }
};

/**
 * Get all URLs for a user
 */
const getUserUrls = async (req, res) => {
  try {
    const userId = req.user.uid;

    // Get all URLs for the user
    const urls = await urlModel.getUrlsByUser(userId);

    // Format the response
    const formattedUrls = urls.map(url => ({
      slug: url.id,
      shortUrl: `${process.env.BASE_URL}/s/${url.id}`,
      originalUrl: url.originalUrl,
      createdAt: url.createdAt,
      totalClicks: url.totalClicks || 0,
      active: url.active,
      expired: url.expiresAt ? new Date(url.expiresAt.toDate()) < new Date() : false,
      description: url.description || ''
    }));

    return res.status(200).json({
      success: true,
      data: formattedUrls
    });
  } catch (error) {
    console.error('Error getting user URLs:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

/**
 * Get URL analytics
 */
const getUrlAnalytics = async (req, res) => {
  try {
    const { slug } = req.params;
    const userId = req.user.uid;

    // Get URL analytics
    const analytics = await urlModel.getUrlAnalytics(slug, userId);

    if (!analytics) {
      return res.status(404).json({
        success: false,
        message: 'URL not found or unauthorized'
      });
    }

    return res.status(200).json({
      success: true,
      data: analytics
    });
  } catch (error) {
    console.error('Error getting URL analytics:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

/**
 * Deactivate URL
 */
const deactivateUrl = async (req, res) => {
  try {
    const { slug } = req.params;
    const userId = req.user.uid;

    // Deactivate URL
    const result = await urlModel.deactivateUrl(slug, userId);

    if (!result.success) {
      return res.status(404).json({
        success: false,
        message: result.message
      });
    }

    return res.status(200).json({
      success: true,
      message: 'URL deactivated successfully'
    });
  } catch (error) {
    console.error('Error deactivating URL:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

/**
 * Delete URL
 */
const deleteUrl = async (req, res) => {
  try {
    const { slug } = req.params;
    const userId = req.user.uid;

    // Delete URL
    const result = await urlModel.deleteUrl(slug, userId);

    if (!result.success) {
      return res.status(404).json({
        success: false,
        message: result.message
      });
    }

    return res.status(200).json({
      success: true,
      message: 'URL deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting URL:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

/**
 * Generate QR code for URL
 */
const generateQrCode = async (req, res) => {
  try {
    const { slug } = req.params;
    const userId = req.user.uid;

    // Get URL from database
    const url = await urlModel.getUrlBySlug(slug);

    if (!url) {
      return res.status(404).json({
        success: false,
        message: 'URL not found'
      });
    }

    // Check if the URL belongs to the user
    if (url.userId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    // Generate QR code
    const shortUrl = `${process.env.BASE_URL}/s/${slug}`;
    const qrCode = await qrcodeUtil.generateQRCode(shortUrl);

    // Set response headers
    res.setHeader('Content-Type', 'image/png');

    // Send QR code as response
    return res.send(qrCode);
  } catch (error) {
    console.error('Error generating QR code:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

module.exports = {
  shortenUrl,
  redirectToUrl,
  getUserUrls,
  getUrlAnalytics,
  deactivateUrl,
  deleteUrl,
  generateQrCode
};
