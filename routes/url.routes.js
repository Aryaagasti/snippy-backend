const express = require('express');
const router = express.Router();
const urlController = require('../controllers/url.controller');
const { verifyToken } = require('../middleware/auth.middleware');
const { collectAnalytics } = require('../middleware/analytics.middleware');

// Protected routes (require authentication)
router.post('/shorten', verifyToken, urlController.shortenUrl);
router.get('/user/urls', verifyToken, urlController.getUserUrls);
router.get('/user/url/:slug', verifyToken, urlController.getUrlAnalytics);
router.post('/url/:slug/deactivate', verifyToken, urlController.deactivateUrl);
router.delete('/url/:slug', verifyToken, urlController.deleteUrl);
router.get('/url/:slug/qr', verifyToken, urlController.generateQrCode);

// Note: The redirect route is defined in server.js to keep it separate from API routes
router.get('/s/:slug', collectAnalytics, urlController.redirectToUrl);      

module.exports = router;