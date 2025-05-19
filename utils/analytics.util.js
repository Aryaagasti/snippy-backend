/**
 * Process analytics data to get summary statistics
 * @param {Array} clicks - Array of click data
 * @returns {Object} - Analytics summary
 */
const processAnalytics = (clicks) => {
    if (!clicks || !Array.isArray(clicks) || clicks.length === 0) {
      return {
        totalClicks: 0,
        browsers: {},
        platforms: {},
        countries: {},
        clicksByDate: {},
        referrers: {}
      };
    }
    
    const analytics = {
      totalClicks: clicks.length,
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
  };
  
  module.exports = {
    processAnalytics
  };