import DOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';
import { ProfanityFilter } from './profanityFilter';

// Create a JSDOM window for DOMPurify
const window = new JSDOM('').window;
const purify = DOMPurify(window as any);

export interface SanitizationResult {
  original: string;
  sanitized: string;
  wasModified: boolean;
  flags: string[];
  profanityScore: number;
}

export class SanitizationService {
  /**
   * Multi-stage sanitization pipeline for user-generated content
   */
  static sanitizeText(
    input: string, 
    context: 'title' | 'description' | 'option' | 'comment'
  ): SanitizationResult {
    if (!input || typeof input !== 'string') {
      throw new Error('Invalid input for sanitization');
    }

    const original = input;
    let sanitized = input;
    const flags: string[] = [];
    let wasModified = false;

    // Stage 1: HTML Stripping
    const htmlStripped = this.stripHtml(sanitized);
    if (htmlStripped !== sanitized) {
      sanitized = htmlStripped;
      wasModified = true;
      flags.push('html_removed');
    }

    // Stage 2: SQL Injection Protection
    const sqlProtected = this.escapeSqlInjection(sanitized);
    if (sqlProtected !== sanitized) {
      sanitized = sqlProtected;
      wasModified = true;
      flags.push('sql_patterns_removed');
    }

    // Stage 3: Profanity Filter
    const profanityFiltered = ProfanityFilter.filterProfanity(sanitized);
    if (profanityFiltered !== sanitized) {
      sanitized = profanityFiltered;
      wasModified = true;
      flags.push('profanity_filtered');
    }

    // Stage 4: Context-specific sanitization
    const contextSanitized = this.contextSpecificSanitization(sanitized, context);
    if (contextSanitized !== sanitized) {
      sanitized = contextSanitized;
      wasModified = true;
      flags.push('context_limited');
    }

    // Stage 5: Final validation and trimming
    const finalSanitized = this.finalValidation(sanitized, context);
    if (finalSanitized !== sanitized) {
      sanitized = finalSanitized;
      wasModified = true;
      flags.push('final_validation');
    }

    // Calculate profanity score
    const profanityScore = ProfanityFilter.getProfanityScore(original);

    // Log sanitization for audit purposes
    this.logSanitization({
      original,
      sanitized,
      context,
      flags,
      profanityScore,
      wasModified
    });

    return {
      original,
      sanitized,
      wasModified,
      flags,
      profanityScore
    };
  }

  /**
   * Stage 1: HTML Stripping
   */
  private static stripHtml(input: string): string {
    return purify.sanitize(input, { 
      ALLOWED_TAGS: [], 
      ALLOWED_ATTR: [],
      KEEP_CONTENT: true
    });
  }

  /**
   * Stage 2: SQL Injection Protection
   */
  private static escapeSqlInjection(input: string): string {
    // Remove SQL injection patterns
    const sqlPatterns = [
      // SQL keywords
      /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT|DECLARE|EXECUTE)\b)/gi,
      // Common SQL injection patterns
      /(['";\\])/g,
      /(\b(OR|AND)\s+\d+\s*=\s*\d+)/gi,
      /(\b(OR|AND)\s+['"]\w+['"]\s*=\s*['"]\w+['"])/gi,
      // Additional dangerous patterns
      /(\b(WAITFOR|DELAY|BENCHMARK|SLEEP)\b)/gi,
      /(\b(INFORMATION_SCHEMA|SYSOBJECTS|SYSCOLUMNS)\b)/gi,
      // XSS patterns
      /(<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>)/gi,
      /(javascript:)/gi,
      /(on\w+\s*=)/gi
    ];
    
    let sanitized = input;
    sqlPatterns.forEach(pattern => {
      sanitized = sanitized.replace(pattern, '');
    });
    
    return sanitized;
  }

  /**
   * Stage 4: Context-specific sanitization
   */
  private static contextSpecificSanitization(input: string, context: string): string {
    switch (context) {
      case 'title':
        return input
          .replace(/[<>]/g, '')
          .substring(0, 100)
          .trim();
      case 'description':
        return input
          .replace(/[<>]/g, '')
          .substring(0, 500)
          .trim();
      case 'option':
        return input
          .replace(/[<>]/g, '')
          .substring(0, 200)
          .trim();
      case 'comment':
        return input
          .replace(/[<>]/g, '')
          .substring(0, 1000)
          .trim();
      default:
        return input.trim();
    }
  }

  /**
   * Stage 5: Final validation
   */
  private static finalValidation(input: string, context: string): string {
    if (!input || input.trim().length === 0) {
      throw new Error(`${context} cannot be empty after sanitization`);
    }

    // Remove excessive whitespace
    let sanitized = input.replace(/\s+/g, ' ').trim();

    // Ensure minimum length for certain contexts
    const minLengths = {
      title: 1,
      description: 0,
      option: 1,
      comment: 1
    };

    if (sanitized.length < minLengths[context as keyof typeof minLengths]) {
      throw new Error(`${context} is too short after sanitization`);
    }

    return sanitized;
  }

  /**
   * Log sanitization actions for audit purposes
   */
  private static logSanitization(data: {
    original: string;
    sanitized: string;
    context: string;
    flags: string[];
    profanityScore: number;
    wasModified: boolean;
  }): void {
    if (process.env.NODE_ENV === 'development') {
      console.log('Sanitization Log:', {
        timestamp: new Date().toISOString(),
        context: data.context,
        wasModified: data.wasModified,
        flags: data.flags,
        profanityScore: data.profanityScore,
        originalLength: data.original.length,
        sanitizedLength: data.sanitized.length
      });
    }

    // In production, you would log to a proper logging service
    // This is just a placeholder for the audit trail
  }

  /**
   * Batch sanitize multiple text inputs
   */
  static sanitizeBatch(
    inputs: Array<{ text: string; context: 'title' | 'description' | 'option' | 'comment' }>
  ): SanitizationResult[] {
    return inputs.map(({ text, context }) => 
      this.sanitizeText(text, context)
    );
  }

  /**
   * Check if content should be flagged for manual review
   */
  static shouldFlagForReview(input: string): boolean {
    return ProfanityFilter.shouldFlagForReview(input);
  }

  /**
   * Get sanitization statistics
   */
  static getSanitizationStats(results: SanitizationResult[]) {
    const total = results.length;
    const modified = results.filter(r => r.wasModified).length;
    const flagged = results.filter(r => r.flags.length > 0).length;
    const avgProfanityScore = results.reduce((sum, r) => sum + r.profanityScore, 0) / total;

    return {
      total,
      modified,
      flagged,
      avgProfanityScore,
      modificationRate: modified / total
    };
  }
}
