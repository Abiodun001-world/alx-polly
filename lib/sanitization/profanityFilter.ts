// Comprehensive profanity filter for content moderation
// This list includes common profane words and phrases that should be filtered

export class ProfanityFilter {
  private static profanityList = [
    // Common profane words (abbreviated list - expand as needed)
    'ass', 'asshole', 'bastard', 'bitch', 'bullshit', 'cock', 'crap', 'cunt', 'damn', 'dick',
    'fuck', 'fucker', 'fucking', 'hell', 'motherfucker', 'piss', 'pussy', 'shit', 'slut',
    'whore', 'tits', 'twat', 'wank', 'wanker',
    
    // Common variations and misspellings
    'f*ck', 'f**k', 'f***', 'sh*t', 'sh**', 'b*tch', 'b**ch', 'a**', 'a**hole',
    'd*ck', 'd**k', 'p*ssy', 'p**sy', 'c*nt', 'c**t', 'tw*t', 'tw**',
    
    // Common phrases
    'fuck you', 'fuck off', 'fuck this', 'fuck that', 'piece of shit', 'son of a bitch',
    'mother fucker', 'motherfucking', 'fucking hell', 'holy shit', 'oh shit',
    
    // Racial slurs and hate speech (abbreviated)
    'n*gger', 'n**ger', 'n***er', 'f*ggot', 'f**got', 'f***ot', 'k*ke', 'k**e',
    'sp*c', 'sp**', 'w*tback', 'w**back', 'ch*nk', 'ch**k', 'g**k', 't*wel',
    
    // Common abbreviations
    'wtf', 'omg', 'lol', 'rofl', 'lmfao', 'stfu', 'gtfo', 'fml', 'smh',
    
    // Additional offensive terms
    'retard', 'retarded', 'idiot', 'stupid', 'dumb', 'moron', 'imbecile',
    'fatass', 'fat ass', 'skinny', 'ugly', 'hate', 'kill', 'die',
    
    // Common misspellings and leetspeak
    'fuk', 'fukc', 'fuq', 'shyt', 'sh1t', 'sh!t', 'b!tch', 'b1tch', 'a$$', 'a$$hole',
    'd!ck', 'd1ck', 'p!ssy', 'p1ssy', 'c!nt', 'c1nt', 'tw!t', 'tw1t'
  ];

  private static commonWords = [
    'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with',
    'by', 'from', 'up', 'about', 'into', 'through', 'during', 'before',
    'after', 'above', 'below', 'between', 'among', 'within', 'without'
  ];

  /**
   * Check if text contains profanity
   */
  static containsProfanity(text: string): boolean {
    if (!text || typeof text !== 'string') {
      return false;
    }

    const normalizedText = text.toLowerCase().trim();
    const words = normalizedText.split(/\s+/);

    // Check for exact matches
    for (const word of words) {
      if (this.profanityList.includes(word)) {
        return true;
      }
    }

    // Check for partial matches (for phrases)
    for (const profanity of this.profanityList) {
      if (normalizedText.includes(profanity)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Filter profanity from text
   */
  static filterProfanity(text: string): string {
    if (!text || typeof text !== 'string') {
      return text;
    }

    let filteredText = text;

    // Replace profane words with asterisks
    for (const profanity of this.profanityList) {
      const regex = new RegExp(`\\b${this.escapeRegex(profanity)}\\b`, 'gi');
      filteredText = filteredText.replace(regex, '*'.repeat(profanity.length));
    }

    // Replace partial matches (for phrases)
    for (const profanity of this.profanityList) {
      if (profanity.includes(' ')) {
        const regex = new RegExp(this.escapeRegex(profanity), 'gi');
        filteredText = filteredText.replace(regex, '*'.repeat(profanity.length));
      }
    }

    return filteredText;
  }

  /**
   * Get profanity score (0-1) based on profanity density
   */
  static getProfanityScore(text: string): number {
    if (!text || typeof text !== 'string') {
      return 0;
    }

    const words = text.toLowerCase().split(/\s+/);
    const profanityCount = words.filter(word => 
      this.profanityList.includes(word)
    ).length;

    return Math.min(profanityCount / words.length, 1);
  }

  /**
   * Check if text should be flagged for review
   */
  static shouldFlagForReview(text: string): boolean {
    const score = this.getProfanityScore(text);
    return score > 0.1; // Flag if more than 10% of words are profane
  }

  /**
   * Get list of profane words found in text
   */
  static getProfaneWords(text: string): string[] {
    if (!text || typeof text !== 'string') {
      return [];
    }

    const words = text.toLowerCase().split(/\s+/);
    return words.filter(word => this.profanityList.includes(word));
  }

  /**
   * Escape special regex characters
   */
  private static escapeRegex(string: string): string {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /**
   * Add custom profanity to the filter
   */
  static addCustomProfanity(words: string[]): void {
    this.profanityList.push(...words.map(word => word.toLowerCase()));
  }

  /**
   * Remove words from the profanity filter
   */
  static removeFromProfanityFilter(words: string[]): void {
    const wordsToRemove = new Set(words.map(word => word.toLowerCase()));
    this.profanityList = this.profanityList.filter(word => !wordsToRemove.has(word));
  }

  /**
   * Get current profanity list (for admin purposes)
   */
  static getProfanityList(): string[] {
    return [...this.profanityList];
  }
}
