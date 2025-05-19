/**
 * Validation middleware for request data
 * Supports validation rules: required, email, min:length
 */
exports.validateRequest = (validations) => {
    return (req, res, next) => {
      const errors = [];
  
      // Process each validation rule
      validations.forEach(validation => {
        const { field, validation: rules } = validation;
        const value = req.body[field];
        
        // Split rules by pipe
        const rulesList = rules.split('|');
        
        // Check each rule
        rulesList.forEach(rule => {
          // Required validation
          if (rule === 'required' && (value === undefined || value === null || value === '')) {
            errors.push({ field, message: `${field} is required` });
          }
          
          // If value exists, check other validations
          if (value !== undefined && value !== null && value !== '') {
            // Email validation
            if (rule === 'email' && !isValidEmail(value)) {
              errors.push({ field, message: `${field} must be a valid email address` });
            }
            
            // Min length validation
            if (rule.startsWith('min:')) {
              const minLength = parseInt(rule.split(':')[1]);
              if (value.length < minLength) {
                errors.push({ field, message: `${field} must be at least ${minLength} characters long` });
              }
            }
          }
        });
      });
  
      // If there are validation errors, return them
      if (errors.length > 0) {
        return res.status(400).json({ 
          success: false,
          message: 'Validation failed',
          errors 
        });
      }
  
      // If validation passes, proceed to the next middleware/controller
      next();
    };
  };
  
  /**
   * Helper function to validate email format
   */
  function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }