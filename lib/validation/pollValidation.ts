import { z } from 'zod';
import { CreatePollSchema } from '../schemas/poll';

export const EnhancedPollSchema = CreatePollSchema.refine(
  (data) => {
    const uniqueOptions = new Set(data.options.map(opt => opt.text.toLowerCase()));
    return uniqueOptions.size === data.options.length;
  },
  {
    message: 'All poll options must be unique',
    path: ['options']
  }
).refine(
  (data) => {
    if (data.expiresAt) {
      const expirationDate = new Date(data.expiresAt);
      const maxExpiration = new Date();
      maxExpiration.setFullYear(maxExpiration.getFullYear() + 1);
      return expirationDate <= maxExpiration;
    }
    return true;
  },
  {
    message: 'Expiration date cannot be more than 1 year in the future',
    path: ['expiresAt']
  }
);

export const PollValidationService = {
  /**
   * Validates poll data with enhanced business rules
   */
  validatePollCreation(data: any) {
    try {
      return {
        success: true,
        data: EnhancedPollSchema.parse(data),
        errors: null
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          success: false,
          data: null,
          errors: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message
          }))
        };
      }
      throw error;
    }
  },

  /**
   * Validates poll options for business logic
   */
  validatePollOptions(options: string[]) {
    const errors: string[] = [];

    // Check for minimum options
    if (options.length < 2) {
      errors.push('At least 2 options are required');
    }

    // Check for maximum options
    if (options.length > 10) {
      errors.push('Maximum 10 options allowed');
    }

    // Check for empty options
    const emptyOptions = options.filter(opt => !opt.trim());
    if (emptyOptions.length > 0) {
      errors.push('All options must have text');
    }

    // Check for duplicate options (case-insensitive)
    const uniqueOptions = new Set(options.map(opt => opt.trim().toLowerCase()));
    if (uniqueOptions.size !== options.length) {
      errors.push('All options must be unique');
    }

    // Check for option length
    const longOptions = options.filter(opt => opt.trim().length > 200);
    if (longOptions.length > 0) {
      errors.push('Options must be 200 characters or less');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  },

  /**
   * Validates expiration date logic
   */
  validateExpirationDate(expiresAt: string | null) {
    if (!expiresAt) {
      return { isValid: true, error: null };
    }

    const expirationDate = new Date(expiresAt);
    const now = new Date();
    const maxExpiration = new Date();
    maxExpiration.setFullYear(maxExpiration.getFullYear() + 1);

    if (expirationDate <= now) {
      return {
        isValid: false,
        error: 'Expiration date must be in the future'
      };
    }

    if (expirationDate > maxExpiration) {
      return {
        isValid: false,
        error: 'Expiration date cannot be more than 1 year in the future'
      };
    }

    return { isValid: true, error: null };
  }
};
