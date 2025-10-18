/**
 * Comprehensive content moderation utilities
 * Multi-layered defense against inappropriate content
 * 
 * ⚠️ DEPRECATION NOTICE (2025-01-16):
 * The hardcoded BLACKLIST_PATTERNS in this file are being phased out in favor of
 * AI-powered content moderation via unified-validation.ts which uses Gemini 2.0 Flash.
 * 
 * The AI validation provides:
 * - Context-aware detection (understands "Asperger's" vs "assburgers")
 * - Adaptive learning without hardcoded rules
 * - Better handling of edge cases and creative misspellings
 * 
 * This file remains for backwards compatibility but should not be the primary
 * validation method. New features should use:
 * - app/(web-client)/user/[userId]/worker/onboarding-ai/utils/validation/unified-validation.ts
 */

export interface ContentModerationResult {
  isAppropriate: boolean;
  confidence: number;
  reason: string;
  category: 'clean' | 'inappropriate' | 'nonsense' | 'suspicious';
  suggestedAction: 'accept' | 'reject' | 'flag_for_review';
  contextAnalysis?: {
    isFollowUp: boolean;
    conversationTheme: string;
    previousInappropriateCount: number;
    userBehaviorPattern: 'cooperative' | 'testing' | 'confused' | 'normal';
  };
}

export interface ChatContext {
  conversationHistory: Array<{
    type: 'user' | 'bot';
    content: string;
    timestamp: number;
  }>;
  currentField?: string;
  userRole?: 'worker' | 'buyer';
  sessionDuration?: number;
}

// ⚠️ REMOVED: BLACKLIST_PATTERNS deleted - now using AI-powered validation
// Hardcoded patterns cannot handle context, misspellings, or edge cases
// All content moderation now uses unified-validation.ts with Gemini AI

// Professional content patterns that should be accepted
const PROFESSIONAL_PATTERNS = {
  experience: [
    'years', 'yrs', 'y', 'months', 'mon', 'm',
    'experience', 'experienced', 'working', 'worked',
    'career', 'professional', 'industry', 'field'
  ],
  
  skills: [
    'customer service', 'communication', 'teamwork', 'leadership',
    'management', 'sales', 'marketing', 'cooking', 'cleaning',
    'driving', 'delivery', 'construction', 'plumbing', 'electrical',
    'carpentry', 'painting', 'gardening', 'landscaping',
    'babysitting', 'elderly care', 'pet care', 'housekeeping',
    'waiting', 'bartending', 'retail', 'cashier', 'stocking',
    'inventory', 'data entry', 'typing', 'computer', 'software',
    'microsoft', 'excel', 'word', 'powerpoint', 'photoshop'
  ],
  
  equipment: [
    'car', 'van', 'truck', 'vehicle', 'tools', 'equipment',
    'computer', 'laptop', 'phone', 'tablet', 'camera',
    'mixer', 'oven', 'stove', 'refrigerator', 'freezer',
    'vacuum', 'mop', 'broom', 'cleaning supplies',
    'paint', 'brush', 'roller', 'ladder', 'hammer',
    'screwdriver', 'wrench', 'pliers', 'drill', 'saw'
  ]
};

/**
 * Analyze chat context to understand user behavior patterns
 */
function analyzeChatContext(input: string, context?: ChatContext): {
  isFollowUp: boolean;
  conversationTheme: string;
  previousInappropriateCount: number;
  userBehaviorPattern: 'cooperative' | 'testing' | 'confused' | 'normal';
} {
  if (!context || !context.conversationHistory || context.conversationHistory.length === 0) {
    return {
      isFollowUp: false,
      conversationTheme: 'initial',
      previousInappropriateCount: 0,
      userBehaviorPattern: 'normal'
    };
  }

  const userMessages = context.conversationHistory.filter(msg => msg.type === 'user');
  const botMessages = context.conversationHistory.filter(msg => msg.type === 'bot');
  
  // Count previous inappropriate content
  let previousInappropriateCount = 0;
  for (const msg of userMessages) {
    const quickCheck = preValidateContent(msg.content);
    if (!quickCheck.isAppropriate && quickCheck.confidence > 0.7) {
      previousInappropriateCount++;
    }
  }

  // Determine if this is a follow-up to a rejection
  const isFollowUp = botMessages.some(msg => 
    msg.content.toLowerCase().includes('not appropriate') ||
    msg.content.toLowerCase().includes('please provide legitimate') ||
    msg.content.toLowerCase().includes('professional worker profile')
  );

  // Analyze conversation theme
  let conversationTheme = 'general';
  const allContent = context.conversationHistory.map(msg => msg.content).join(' ').toLowerCase();
  
  if (allContent.includes('experience') || allContent.includes('years')) {
    conversationTheme = 'experience';
  } else if (allContent.includes('skills') || allContent.includes('abilities')) {
    conversationTheme = 'skills';
  } else if (allContent.includes('equipment') || allContent.includes('tools')) {
    conversationTheme = 'equipment';
  } else if (allContent.includes('about') || allContent.includes('description')) {
    conversationTheme = 'about';
  }

  // Determine user behavior pattern
  let userBehaviorPattern: 'cooperative' | 'testing' | 'confused' | 'normal' = 'normal';
  
  if (previousInappropriateCount >= 3) {
    userBehaviorPattern = 'testing';
  } else if (previousInappropriateCount >= 1 && isFollowUp) {
    userBehaviorPattern = 'confused';
  } else if (userMessages.length > 5 && previousInappropriateCount === 0) {
    userBehaviorPattern = 'cooperative';
  }

  return {
    isFollowUp,
    conversationTheme,
    previousInappropriateCount,
    userBehaviorPattern
  };
}

/**
 * Context-aware content validation
 * Considers chat history and user behavior patterns
 */
export function preValidateContentWithContext(input: string, context?: ChatContext): ContentModerationResult {
  const contextAnalysis = analyzeChatContext(input, context);
  
  // If user is in testing mode (multiple previous rejections), be more strict
  if (contextAnalysis.userBehaviorPattern === 'testing') {
    const quickCheck = preValidateContent(input);
    if (!quickCheck.isAppropriate) {
      return {
        ...quickCheck,
        confidence: Math.min(quickCheck.confidence + 0.2, 1.0), // Increase confidence for testing users
        contextAnalysis
      };
    }
  }

  // If this is a follow-up to a rejection, be more lenient for legitimate attempts
  if (contextAnalysis.isFollowUp && contextAnalysis.userBehaviorPattern === 'confused') {
    // Check if user is trying to provide legitimate content after rejection
    const professionalIndicators = checkProfessionalContent(input.toLowerCase());
    if (professionalIndicators) {
      return {
        isAppropriate: true,
        confidence: 0.6,
        reason: 'User appears to be attempting legitimate response after guidance',
        category: 'clean',
        suggestedAction: 'accept',
        contextAnalysis
      };
    }
  }

  // Regular validation with context
  const result = preValidateContent(input);
  return {
    ...result,
    contextAnalysis
  };
}

/**
 * Pre-validation keyword filtering
 * ⚠️ DEPRECATED: This function now passes everything through.
 * Use unified-validation.ts for AI-powered content moderation instead.
 */
export function preValidateContent(input: string): ContentModerationResult {
  const normalizedInput = input.toLowerCase().trim();
  
  // Check for empty or very short input
  if (!normalizedInput || normalizedInput.length < 2) {
    return {
      isAppropriate: false,
      confidence: 1.0,
      reason: 'Input is too short or empty',
      category: 'nonsense',
      suggestedAction: 'reject'
    };
  }
  
  // ⚠️ REMOVED: Hardcoded blacklist pattern checking deleted
  // All content is now validated by AI in unified-validation.ts
  // This function is kept for backwards compatibility only
  
  // Check for common bypass attempts
  const bypassAttempts = [
    // Leet speak variations
    { pattern: /m4r10|m4rio|m4r1o/gi, reason: 'Leet speak variation of "mario"' },
    { pattern: /l00igi|l00gi|lu1gi/gi, reason: 'Leet speak variation of "luigi"' },
    { pattern: /p34ch|p3ach|pe4ch/gi, reason: 'Leet speak variation of "peach"' },
    { pattern: /b0w53r|b0wser|b0ws3r/gi, reason: 'Leet speak variation of "bowser"' },
    
    // Spacing variations
    { pattern: /m\s*a\s*r\s*i\s*o/gi, reason: 'Spaced variation of "mario"' },
    { pattern: /l\s*u\s*i\s*g\s*i/gi, reason: 'Spaced variation of "luigi"' },
    { pattern: /p\s*e\s*a\s*c\s*h/gi, reason: 'Spaced variation of "peach"' },
    
    // Character substitution
    { pattern: /m@rio|m@r10/gi, reason: 'Character substitution for "mario"' },
    { pattern: /l@igi|l@1gi/gi, reason: 'Character substitution for "luigi"' },
    { pattern: /p@ach|p@3ach/gi, reason: 'Character substitution for "peach"' },
    
    // Common meme phrases with variations
    { pattern: /its\s*a\s*me/gi, reason: 'Mario catchphrase variation' },
    { pattern: /hello\s*there/gi, reason: 'Star Wars meme reference' },
    { pattern: /general\s*kenobi/gi, reason: 'Star Wars meme reference' },
    
    // Nonsense patterns
    { pattern: /^[a-z]{1,2}\s*[a-z]{1,2}\s*[a-z]{1,2}$/gi, reason: 'Random character sequence' },
    { pattern: /^[0-9]{1,2}\s*[0-9]{1,2}\s*[0-9]{1,2}$/gi, reason: 'Random number sequence' }
  ];
  
  for (const attempt of bypassAttempts) {
    if (attempt.pattern.test(normalizedInput)) {
      return {
        isAppropriate: false,
        confidence: 0.85,
        reason: attempt.reason,
        category: 'suspicious',
        suggestedAction: 'reject'
      };
    }
  }
  
  // Check for suspicious patterns
  if (isSuspiciousPattern(normalizedInput)) {
    return {
      isAppropriate: false,
      confidence: 0.8,
      reason: 'Contains suspicious patterns',
      category: 'suspicious',
      suggestedAction: 'flag_for_review'
    };
  }
  
  // Check for professional content indicators
  const hasProfessionalContent = checkProfessionalContent(normalizedInput);
  if (hasProfessionalContent) {
    return {
      isAppropriate: true,
      confidence: 0.7,
      reason: 'Contains professional content indicators',
      category: 'clean',
      suggestedAction: 'accept'
    };
  }
  
  // Default to suspicious for unknown content
  return {
    isAppropriate: false,
    confidence: 0.6,
    reason: 'Content does not appear to be professional',
    category: 'suspicious',
    suggestedAction: 'flag_for_review'
  };
}

/**
 * Check for suspicious patterns that might be trying to bypass filters
 */
function isSuspiciousPattern(input: string): boolean {
  // Repeated characters
  if (/(.)\1{4,}/.test(input)) return true;
  
  // Random character sequences
  if (/^[a-z]{1,3}\s*[a-z]{1,3}\s*[a-z]{1,3}$/.test(input)) return true;
  
  // Only numbers and special characters
  if (/^[\d\s\-\+\(\)\.]+$/.test(input) && input.length < 10) return true;
  
  // Gibberish patterns
  if (/^[qwertyuiopasdfghjklzxcvbnm]{3,}$/.test(input)) return true;
  
  // Mixed case gibberish
  if (/^[A-Za-z]{3,}$/.test(input) && !containsRealWords(input)) return true;
  
  // Keyboard walk patterns
  if (/^[qwertyuiop]+$/.test(input) || /^[asdfghjkl]+$/.test(input) || /^[zxcvbnm]+$/.test(input)) return true;
  
  // Alternating patterns
  if (/^[a-z]\d[a-z]\d[a-z]\d/.test(input)) return true;
  
  // Very short inputs that are just random characters
  if (input.length <= 3 && /^[a-z]+$/.test(input) && !containsRealWords(input)) return true;
  
  // Contains only special characters or symbols
  if (/^[^\w\s]+$/.test(input)) return true;
  
  // Contains excessive punctuation
  if ((input.match(/[^\w\s]/g) || []).length > input.length * 0.5) return true;
  
  // Contains numbers mixed with random letters in suspicious patterns
  if (/^\d+[a-z]+\d+[a-z]+$/.test(input)) return true;
  
  return false;
}

/**
 * Check if input contains professional content indicators
 */
function checkProfessionalContent(input: string): boolean {
  for (const [category, patterns] of Object.entries(PROFESSIONAL_PATTERNS)) {
    for (const pattern of patterns) {
      if (input.includes(pattern.toLowerCase())) {
        return true;
      }
    }
  }
  return false;
}

/**
 * Check if input contains real words (basic check)
 */
function containsRealWords(input: string): boolean {
  const commonWords = [
    'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with',
    'by', 'from', 'up', 'about', 'into', 'through', 'during', 'before',
    'after', 'above', 'below', 'between', 'among', 'under', 'over',
    'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them',
    'my', 'your', 'his', 'her', 'its', 'our', 'their', 'mine', 'yours', 'ours', 'theirs',
    'this', 'that', 'these', 'those', 'a', 'an', 'the', 'some', 'any', 'all', 'both',
    'each', 'every', 'either', 'neither', 'one', 'two', 'three', 'four', 'five',
    'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should',
    'may', 'might', 'must', 'can', 'be', 'am', 'is', 'are', 'was', 'were', 'been',
    'being', 'get', 'got', 'make', 'made', 'take', 'took', 'come', 'came', 'go', 'went',
    'see', 'saw', 'know', 'knew', 'think', 'thought', 'look', 'looked', 'use', 'used',
    'find', 'found', 'give', 'gave', 'tell', 'told', 'work', 'worked', 'call', 'called',
    'try', 'tried', 'ask', 'asked', 'need', 'needed', 'feel', 'felt', 'become', 'became',
    'leave', 'left', 'put', 'put', 'mean', 'meant', 'keep', 'kept', 'let', 'let',
    'begin', 'began', 'seem', 'seemed', 'help', 'helped', 'talk', 'talked', 'turn', 'turned',
    'start', 'started', 'show', 'showed', 'hear', 'heard', 'play', 'played', 'run', 'ran',
    'move', 'moved', 'live', 'lived', 'believe', 'believed', 'hold', 'held', 'bring', 'brought',
    'happen', 'happened', 'write', 'wrote', 'sit', 'sat', 'stand', 'stood', 'lose', 'lost',
    'pay', 'paid', 'meet', 'met', 'include', 'included', 'continue', 'continued', 'set', 'set',
    'learn', 'learned', 'change', 'changed', 'lead', 'led', 'understand', 'understood',
    'watch', 'watched', 'follow', 'followed', 'stop', 'stopped', 'create', 'created',
    'speak', 'spoke', 'read', 'read', 'allow', 'allowed', 'add', 'added', 'spend', 'spent',
    'grow', 'grew', 'open', 'opened', 'walk', 'walked', 'win', 'won', 'offer', 'offered',
    'remember', 'remembered', 'love', 'loved', 'consider', 'considered', 'appear', 'appeared',
    'buy', 'bought', 'wait', 'waited', 'serve', 'served', 'die', 'died', 'send', 'sent',
    'expect', 'expected', 'build', 'built', 'stay', 'stayed', 'fall', 'fell', 'cut', 'cut',
    'reach', 'reached', 'kill', 'killed', 'remain', 'remained', 'suggest', 'suggested',
    'raise', 'raised', 'pass', 'passed', 'sell', 'sold', 'require', 'required', 'report', 'reported',
    'decide', 'decided', 'pull', 'pulled'
  ];
  
  const words = input.split(/\s+/);
  let realWordCount = 0;
  
  for (const word of words) {
    if (commonWords.includes(word.toLowerCase())) {
      realWordCount++;
    }
  }
  
  return realWordCount >= Math.min(2, words.length * 0.3);
}

/**
 * Enhanced AI validation with confidence scoring
 */
export function enhanceAIValidation(aiResult: any, preValidation: ContentModerationResult): any {
  // If pre-validation already rejected, override AI result
  if (!preValidation.isAppropriate && preValidation.confidence > 0.8) {
    return {
      ...aiResult,
      isAppropriate: false,
      isWorkerRelated: false,
      isSufficient: false,
      clarificationPrompt: `I'm sorry, but "${preValidation.reason}" is not appropriate for a professional worker profile. Please provide legitimate work-related information.`,
      confidence: preValidation.confidence
    };
  }
  
  // If pre-validation flagged as suspicious, be more strict
  if (preValidation.category === 'suspicious') {
    return {
      ...aiResult,
      isAppropriate: aiResult.isAppropriate && preValidation.confidence < 0.5,
      isWorkerRelated: aiResult.isWorkerRelated && preValidation.confidence < 0.5,
      isSufficient: aiResult.isSufficient && preValidation.confidence < 0.5,
      clarificationPrompt: aiResult.clarificationPrompt || 'Please provide more specific and professional information.',
      confidence: Math.min(aiResult.confidence || 0.5, preValidation.confidence)
    };
  }
  
  return aiResult;
}
