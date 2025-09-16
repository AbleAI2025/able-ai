/**
 * Comprehensive content moderation utilities
 * Multi-layered defense against inappropriate content
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

// Comprehensive blacklist patterns
const BLACKLIST_PATTERNS = {
  // Video game characters and references
  videoGames: [
    'mario', 'luigi', 'peach', 'bowser', 'yoshi', 'toad', 'wario', 'waluigi',
    'sonic', 'tails', 'knuckles', 'eggman', 'robotnik',
    'link', 'zelda', 'ganon', 'ganondorf', 'hyrule',
    'pikachu', 'pokemon', 'ash', 'misty', 'brock',
    'donkey kong', 'diddy kong', 'cranky kong',
    'samus', 'metroid', 'ridley',
    'kirby', 'dedede', 'meta knight',
    'fox', 'falco', 'star fox',
    'pac-man', 'pacman', 'ghost', 'inky', 'blinky', 'pinky', 'clyde',
    'tetris', 'pong', 'space invaders',
    'minecraft', 'steve', 'alex', 'creeper', 'enderman',
    'fortnite', 'battle royale', 'victory royale',
    'among us', 'impostor', 'sus',
    'fall guys', 'bean', 'jelly bean'
  ],
  
  // Fictional characters
  fictional: [
    'batman', 'superman', 'wonder woman', 'spiderman', 'spider-man',
    'iron man', 'thor', 'hulk', 'captain america', 'black widow',
    'wolverine', 'deadpool', 'storm', 'cyclops', 'jean grey',
    'harry potter', 'hermione', 'ron', 'voldemort', 'dumbledore',
    'frodo', 'gandalf', 'aragorn', 'legolas', 'gimli',
    'luke skywalker', 'darth vader', 'yoda', 'leia', 'han solo',
    'sherlock holmes', 'watson', 'moriarty',
    'james bond', '007', 'q', 'moneypenny',
    'gandalf', 'sauron', 'gollum', 'smeagol'
  ],
  
  // Memes and internet culture
  memes: [
    'its a me mario', 'hello there', 'general kenobi', 'this is fine',
    'distracted boyfriend', 'woman yelling at cat', 'drake pointing',
    'change my mind', 'nobody:', 'me:', 'pikachu face',
    'rick roll', 'never gonna give you up', 'rick astley',
    'all your base are belong to us', 'leeroy jenkins',
    'pepe', 'wojak', 'chad', 'virgin', 'stacy', 'becky',
    'ok boomer', 'no cap', 'bet', 'yeet', 'oof', 'big oof',
    'poggers', 'pog', 'monkaS', '5head', 'big brain',
    'this is the way', 'mandalorian', 'baby yoda',
    'among us', 'sus', 'impostor', 'vent', 'tasks'
  ],
  
  // Nonsense and gibberish patterns
  nonsense: [
    'asdf', 'qwerty', 'zxcv', 'hjkl', 'fdsa', 'ytrewq',
    'blah blah', 'random text', 'test test', 'lorem ipsum',
    'abc def', '123 456', 'xyz', 'qwe', 'rty', 'uio',
    'jkl', 'asd', 'fgh', 'zxc', 'vbn', 'mno',
    'poggers', 'omegalul', 'kekw', 'monkas', 'pepega',
    'cringe', 'based', 'redpilled', 'bluepilled'
  ],
  
  // Jokes and humor that should be rejected
  jokes: [
    'i am the best at nothing', 'i can fly', 'i am a wizard',
    'i am batman', 'i am spiderman', 'i am superman',
    'i am a jedi', 'i am a sith', 'i am a hobbit',
    'i am a pokemon trainer', 'i am a ninja turtle',
    'i am a power ranger', 'i am a transformer',
    'i am a robot', 'i am an alien', 'i am a ghost',
    'i am invisible', 'i can read minds', 'i can see the future',
    'i am immortal', 'i am invincible', 'i am perfect',
    'i am the chosen one', 'i am the messiah', 'i am god',
    'i am the best', 'i am amazing', 'i am awesome',
    'i am incredible', 'i am fantastic', 'i am wonderful',
    'i am the greatest', 'i am number one', 'i am the king',
    'i am the queen', 'i am the boss', 'i am the master',
    'i am unstoppable', 'i am unbeatable', 'i am legendary',
    'i am epic', 'i am cool', 'i am the coolest',
    'i am the man', 'i am the woman', 'i am the best ever'
  ],
  
  // Inappropriate content
  inappropriate: [
    'fuck', 'shit', 'damn', 'hell', 'bitch', 'ass', 'asshole',
    'stupid', 'idiot', 'moron', 'retard', 'gay', 'fag',
    'nigger', 'nazi', 'hitler', 'kill', 'die', 'death',
    'sex', 'sexual', 'porn', 'pornography', 'nude', 'naked',
    'drug', 'cocaine', 'heroin', 'marijuana', 'weed',
    'alcohol', 'drunk', 'high', 'stoned'
  ]
};

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
 * Catches obvious inappropriate content before AI processing
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
  
  // Check against blacklist patterns
  for (const [category, patterns] of Object.entries(BLACKLIST_PATTERNS)) {
    for (const pattern of patterns) {
      if (normalizedInput.includes(pattern.toLowerCase())) {
        return {
          isAppropriate: false,
          confidence: 0.9,
          reason: `Contains ${category}: "${pattern}"`,
          category: category as any,
          suggestedAction: 'reject'
        };
      }
    }
  }
  
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
