import { geminiAIAgent } from '@/lib/firebase/ai';
import { Schema } from '@firebase/ai';

// Type assertion for Schema to resolve TypeScript errors
const TypedSchema = Schema as any;

/**
 * AI-Powered Help Request Detection System
 * Uses Gemini AI for intelligent intent analysis
 */
export interface IntentAnalysis {
  isHelpRequest: boolean;
  confidence: number;
  reason: string;
  suggestedAction: 'continue' | 'clarify' | 'redirect';
}

/**
 * AI-Powered Intent Analysis using Gemini
 */
export async function analyzeUserIntentWithAI(
  userInput: string,
  currentPrompt: string,
  conversationContext: {
    currentStep: string;
    previousMessages: string[];
    isCollectingSkills: boolean;
  },
  ai: any
): Promise<IntentAnalysis> {
  try {
    const prompt = `You are an expert AI assistant analyzing user intent in a worker onboarding system. Your job is to determine if the user needs platform help or is describing their professional skills.

CONTEXT:
- User is in a worker onboarding process
- Current step: ${conversationContext.currentStep}
- Is collecting skills: ${conversationContext.isCollectingSkills}
- Current prompt: "${currentPrompt}"

USER INPUT: "${userInput}"

ANALYZE if this is a HELP REQUEST or SKILL DESCRIPTION:

HELP REQUEST examples (should return isHelpRequest: true):
- "I need help with this form"
- "How do I use this?"
- "I'm stuck"
- "This isn't working"
- "Can someone help me?"
- "I'm confused with this platform"
- "/help"
- "Contact support"

SKILL DESCRIPTION examples (should return isHelpRequest: false):
- "I have 5 years of customer support experience"
- "I provide technical support"
- "I work in IT support"
- "I help businesses with their needs"
- "Customer service is my passion"
- "I'm a people person"
- "I was a travel agent"
- "I have customer service experience"
- "I need flexible hours" (when asked about availability)
- "I want to work weekends" (when asked about schedule)

Be very careful during skill collection - users describing their professional experience should NOT trigger help flow.

Respond with JSON only:`;

    const result = await geminiAIAgent(
      "gemini-2.0-flash",
      {
        prompt: prompt,
        responseSchema: TypedSchema.object({
          properties: {
            isHelpRequest: TypedSchema.boolean(),
            confidence: TypedSchema.number(),
            reason: TypedSchema.string(),
            suggestedAction: TypedSchema.string()
          },
          required: ['isHelpRequest', 'confidence', 'reason', 'suggestedAction']
        }),
        isStream: false,
      },
      ai
    );

    if (result.ok) {
      const data = result.data as any;
      return {
        isHelpRequest: data.isHelpRequest,
        confidence: data.confidence,
        reason: data.reason,
        suggestedAction: data.suggestedAction as 'continue' | 'clarify' | 'redirect'
      };
    } else {
      console.error('AI intent analysis failed:', result.error);
      // Fallback to rule-based system
      return analyzeUserIntentFallback(userInput, currentPrompt, conversationContext);
    }
  } catch (error) {
    console.error('AI intent analysis error:', error);
    // Fallback to rule-based system
    return analyzeUserIntentFallback(userInput, currentPrompt, conversationContext);
  }
}

/**
 * Fallback rule-based system (original implementation)
 */
export function analyzeUserIntentFallback(
  userInput: string,
  currentPrompt: string,
  conversationContext: {
    currentStep: string;
    previousMessages: string[];
    isCollectingSkills: boolean;
  }
): IntentAnalysis {
  const input = userInput.toLowerCase().trim();

  // 1. EXPLICIT HELP COMMANDS (High confidence)
  const explicitHelpPatterns = [
    /^\/help/,
    /^help$/,
    /^get me (help|support|assistance)$/,
    /^i need help with (this|the) (form|platform|site|app)/,
    /^how do i use this/,
    /^i'?m? (stuck|lost|confused) (with|on) (this|the)/,
    /^(i )?(don'?t|can'?t) (understand|figure out|work out)/,
    /^this (isn'?t|is not) working/,
    /^(something'?s?|it'?s?) broken/,
    /^contact (support|customer service|someone)$/
  ];

  for (const pattern of explicitHelpPatterns) {
    if (pattern.test(input)) {
      return {
        isHelpRequest: true,
        confidence: 0.95,
        reason: 'Explicit help request pattern',
        suggestedAction: 'redirect'
      };
    }
  }

  // 2. CONTEXT-AWARE CHECKING
  // During skill collection, be very conservative
  if (conversationContext.isCollectingSkills) {
    // These are ONLY help requests if they're questions or problems
    const contextualHelpPatterns = [
      /^(where|what|how|why|when) .*(help|support|contact)/,
      /^(can|could|would) (you|someone|anyone) help/,
      /^is there (someone|anyone|support)/,
      /^i (need|want) to (speak|talk) to (someone|support|a human)/,
      /\?.*\b(help|support|assistance)\b/ // Questions containing help words
    ];

    for (const pattern of contextualHelpPatterns) {
      if (pattern.test(input)) {
        return {
          isHelpRequest: true,
          confidence: 0.7,
          reason: 'Contextual help pattern during skill collection',
          suggestedAction: 'clarify'
        };
      }
    }

    // During skill collection, these are DEFINITELY NOT help requests
    const skillDeclarationPatterns = [
      /i (have|had|provide|offer|do|work|worked) .*(support|help|service)/,
      /(experience|skilled|expert|proficient) .*(support|help|service)/,
      /(customer|technical|it|phone|email) (support|service)/,
      /my (skill|experience|background|job|role)/,
      /years? (of|in) .*(support|service|help)/
    ];

    for (const pattern of skillDeclarationPatterns) {
      if (pattern.test(input)) {
        return {
          isHelpRequest: false,
          confidence: 0.95,
          reason: 'Skill declaration pattern detected',
          suggestedAction: 'continue'
        };
      }
    }
  }

  // 3. INAPPROPRIATE CONTENT CHECK (separate from help detection)
  const inappropriateContent = checkInappropriateContent(input);
  if (inappropriateContent.isInappropriate) {
    return {
      isHelpRequest: false,
      confidence: 1.0,
      reason: inappropriateContent.reason,
      suggestedAction: 'continue' // Handle separately with a warning
    };
  }

  // 4. DEFAULT: Not a help request
  return {
    isHelpRequest: false,
    confidence: 0.9,
    reason: 'No help patterns detected',
    suggestedAction: 'continue'
  };
}

/**
 * Main intent analysis function - tries AI first, falls back to rules
 */
export async function analyzeUserIntent(
  userInput: string,
  currentPrompt: string,
  conversationContext: {
    currentStep: string;
    previousMessages: string[];
    isCollectingSkills: boolean;
  },
  ai?: any
): Promise<IntentAnalysis> {
  // If AI is available, use it
  if (ai) {
    return await analyzeUserIntentWithAI(userInput, currentPrompt, conversationContext, ai);
  }
  
  // Otherwise use fallback
  return analyzeUserIntentFallback(userInput, currentPrompt, conversationContext);
}

/**
 * Check for inappropriate content
 */
function checkInappropriateContent(input: string): { isInappropriate: boolean; reason: string } {
  const inappropriatePatterns = [
    /(fuck|shit|damn|bitch|asshole)/i,
    /(hate|kill|murder|violence)/i,
    /(sex|porn|nude|naked)/i,
    /(drug|alcohol|drunk|high)/i
  ];

  for (const pattern of inappropriatePatterns) {
    if (pattern.test(input)) {
      return {
        isInappropriate: true,
        reason: 'Inappropriate content detected'
      };
    }
  }

  return {
    isInappropriate: false,
    reason: 'Content appears appropriate'
  };
}
