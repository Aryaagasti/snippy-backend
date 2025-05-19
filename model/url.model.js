const { db } = require('../config/firebase');

// Collection reference
const urlsCollection = db.collection('urls');

/**
 * Create a new shortened URL
 */
const createUrl = async (urlData) => {
  try {
    const docRef = await urlsCollection.doc(urlData.slug).set(urlData);
    return { success: true, slug: urlData.slug };
  } catch (error) {
    console.error('Error creating URL:', error);
    throw error;
  }
};

/**
 * Get URL by slug
 */
const getUrlBySlug = async (slug) => {
  try {
    const urlDoc = await urlsCollection.doc(slug).get();
    
    if (!urlDoc.exists) {
      return null;
    }
    
    return urlDoc.data();
  } catch (error) {
    console.error('Error getting URL:', error);
    throw error;
  }
};

/**
 * Update URL analytics
 */
const updateUrlAnalytics = async (slug, analyticsData) => {
  try {
    const urlRef = urlsCollection.doc(slug);
    
    // Add analytics data to the clicks subcollection
    await urlRef.collection('clicks').add(analyticsData);
    
    // Increment total clicks counter
    await urlRef.update({
      totalClicks: admin.firestore.FieldValue.increment(1),
      lastAccessed: new Date()
    });
    
    return true;
  } catch (error) {
    console.error('Error updating URL analytics:', error);
    throw error;
  }
};

/**
 * Get all URLs for a user
 */
const getUrlsByUser = async (userId) => {
  try {
    const snapshot = await urlsCollection.where('userId', '==', userId).get();
    
    if (snapshot.empty) {
      return [];
    }
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting user URLs:', error);
    throw error;
  }
};

/**
 * Get URL analytics
 */
const getUrlAnalytics = async (slug, userId) => {
  try {
    // Get the URL document
    const urlDoc = await urlsCollection.doc(slug).get();
    
    if (!urlDoc.exists) {
      return null;
    }
    
    const urlData = urlDoc.data();
    
    // Check if the URL belongs to the user
    if (urlData.userId !== userId) {
      return null;
    }
    
    // Get all clicks
    const clicksSnapshot = await urlsCollection.doc(slug).collection('clicks').get();
    const clicks = clicksSnapshot.docs.map(doc => doc.data());
    
    // Prepare analytics data
    const analytics = {
      url: urlData,
      totalClicks: urlData.totalClicks || 0,
      browsers: {},
      platforms: {},
      countries: {},
      clicksByDate: {},
      referrers: {}
    };
    
    // Process clicks data
    clicks.forEach(click => {
      // Count browsers
      analytics.browsers[click.browser] = (analytics.browsers[click.browser] || 0) + 1;
      
      // Count platforms
      analytics.platforms[click.platform] = (analytics.platforms[click.platform] || 0) + 1;
      
      // Count countries
      analytics.countries[click.country] = (analytics.countries[click.country] || 0) + 1;
      
      // Count referrers
      analytics.referrers[click.referrer] = (analytics.referrers[click.referrer] || 0) + 1;
      
      // Group by date
      const date = new Date(click.timestamp).toISOString().split('T')[0];
      analytics.clicksByDate[date] = (analytics.clicksByDate[date] || 0) + 1;
    });
    
    return analytics;
  } catch (error) {
    console.error('Error getting URL analytics:', error);
    throw error;
  }
};

/**
 * Deactivate URL
 */
const deactivateUrl = async (slug, userId) => {
  try {
    const urlDoc = await urlsCollection.doc(slug).get();
    
    if (!urlDoc.exists) {
      return { success: false, message: 'URL not found' };
    }
    
    const urlData = urlDoc.data();
    
    // Check if the URL belongs to the user
    if (urlData.userId !== userId) {
      return { success: false, message: 'Unauthorized' };
    }
    
    await urlsCollection.doc(slug).update({
      active: false,
      updatedAt: new Date()
    });
    
    return { success: true };
  } catch (error) {
    console.error('Error deactivating URL:', error);
    throw error;
  }
};

/**
 * Delete URL
 */
const deleteUrl = async (slug, userId) => {
  try {
    const urlDoc = await urlsCollection.doc(slug).get();
    
    if (!urlDoc.exists) {
      return { success: false, message: 'URL not found' };
    }
    
    const urlData = urlDoc.data();
    
    // Check if the URL belongs to the user
    if (urlData.userId !== userId) {
      return { success: false, message: 'Unauthorized' };
    }
    
    // Delete all clicks subcollection documents
    const clicksSnapshot = await urlsCollection.doc(slug).collection('clicks').get();
    const batch = db.batch();
    
    clicksSnapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });
    
    // Delete the URL document
    batch.delete(urlsCollection.doc(slug));
    
    await batch.commit();
    
    return { success: true };
  } catch (error) {
    console.error('Error deleting URL:', error);
    throw error;
  }
};

module.exports = {
  createUrl,
  getUrlBySlug,
  updateUrlAnalytics,
  getUrlsByUser,
  getUrlAnalytics,
  deactivateUrl,
  deleteUrl
};