const { nanoid } = require('nanoid');

/**
 * Generate a random slug
 * @param {number} length - Length of the slug
 * @returns {string} - Random slug
 */
const generateSlug = (length = 6) => {
  return nanoid(length);
};

/**
 * Validate a custom slug
 * @param {string} slug - Custom slug to validate
 * @returns {boolean} - Whether the slug is valid
 */
const validateSlug = (slug) => {
  // Slug should only contain alphanumeric characters and hyphens
  const slugRegex = /^[a-zA-Z0-9-_]+$/;

  // Slug should be between 3 and 20 characters
  return slug &&
         slugRegex.test(slug) &&
         slug.length >= 3 &&
         slug.length <= 20;
};

/**
 * Calculate expiration date
 * @param {number} days - Number of days until expiration
 * @returns {Date} - Expiration date
 */
const calculateExpirationDate = (days = 15) => {
  const expirationDate = new Date();
  expirationDate.setDate(expirationDate.getDate() + days);
  return expirationDate;
};

module.exports = {
  generateSlug,
  validateSlug,
  calculateExpirationDate
};