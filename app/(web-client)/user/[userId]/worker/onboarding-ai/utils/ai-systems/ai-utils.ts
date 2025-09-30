import { geminiAIAgent } from '@/lib/firebase/ai';
import { Schema } from '@firebase/ai';
import { getAI } from '@firebase/ai';
import { VALIDATION_CONSTANTS } from '@/app/constants/validation';
import { PROMPTS } from '../step-management/prompts';

// Type assertion for Schema to resolve TypeScript errors
const TypedSchema = Schema as any;

/**
 * Generate AI video script based on form data
 */
export async function generateAIVideoScript(formData: FormData, ai: any): Promise<string> {
  try {
    const result = await geminiAIAgent(
      "gemini-2.0-flash",
      {
        prompt: PROMPTS.videoScript(formData),
        responseSchema: TypedSchema.object({
          properties: {
            script: TypedSchema.string(),
          },
          required: ['script']
        }),
        isStream: false,
      },
      ai
    );

    if (result.ok) {
      const data = result.data as any;
      return data.script || 'Hi my name is [Name] I am a [job title]. I love [skills] and bring a sense of fun to every shift. I trained at [experience] and my favourite [skill] is [specific skill]. I am great with [strengths] - i hope we can work together';
    }
  } catch (error) {
    console.error('AI video script generation failed:', error);
  }

  return 'Hi my name is [Name] I am a [job title]. I love [skills] and bring a sense of fun to every shift. I trained at [experience] and my favourite [skill] is [specific skill]. I am great with [strengths] - i hope we can work together';
}

/**
 * Check if a similar skill already exists
 */
export async function checkExistingSimilarSkill(skillName: string, workerProfileId: string): Promise<{ exists: boolean; similarSkills: any[] }> {
  try {
    const response = await fetch('/api/check-similar-skill', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        skillName,
        workerProfileId
      }),
    });

    if (response.ok) {
      const data = await response.json();
      return data;
    } else {
      console.warn('API returned non-ok status:', response.status);
      return { exists: false, similarSkills: [] };
    }
  } catch (error) {
    console.error('Error checking similar skills:', error);
    // Return default values when API is not available
    return { exists: false, similarSkills: [] };
  }
}

/**
 * Interpret job title from user experience using AI
 */
export async function interpretJobTitle(userExperience: string, ai: any): Promise<{ jobTitle: string; confidence: number; matchedTerms: string[]; isAISuggested: boolean } | null> {
  try {
    const result = await geminiAIAgent(
      "gemini-2.0-flash",
      {
        prompt: `Analyze this work experience and suggest the most appropriate job title:

Experience: "${userExperience}"

Consider:
- Industry context
- Skill level indicated
- Common job titles in the field
- Professional terminology

Respond with JSON containing:
- jobTitle: The most appropriate job title
- confidence: Confidence score (0-1)
- matchedTerms: Key terms that led to this suggestion
- isAISuggested: true (since this is AI-generated)`,
        responseSchema: Schema.object({
          properties: {
            jobTitle: Schema.string(),
            confidence: Schema.number(),
            matchedTerms: Schema.array({ items: Schema.string() }),
            isAISuggested: Schema.boolean()
          },
          required: ['jobTitle', 'confidence', 'matchedTerms', 'isAISuggested']
        }),
        isStream: false,
      },
      ai
    );

    if (result.ok) {
      const data = result.data as any;
      return data;
    }
  } catch (error) {
    console.error('AI job title interpretation failed:', error);
  }

  return null;
}

/**
 * Extract skill name from user input using AI
 */
export async function extractSkillName(userInput: string, ai: any): Promise<{ skillName: string; confidence: number } | null> {
  try {
    const result = await geminiAIAgent(
      "gemini-2.0-flash",
      {
        prompt: `Extract the main skill or job title from this user input. Return only the core skill name, not the full sentence.

Examples:
- "I am a baker" → "Baker"
- "I work as a software developer" → "Software Developer" 
- "I'm a graphic designer" → "Graphic Designer"
- "I do plumbing work" → "Plumber"
- "I'm experienced in carpentry" → "Carpenter"
- "I am a cafeteria manager" → "Cafeteria Manager"

User input: "${userInput}"

Extract the main skill/job title and return it in proper case (capitalize first letter of each word).`,
        responseSchema: Schema.object({
          properties: {
            skillName: Schema.string(),
            confidence: Schema.number()
          },
          required: ['skillName', 'confidence']
        }),
        isStream: false,
      },
      ai
    );

    if (result.ok) {
      const data = result.data as any;
      return data;
    }
  } catch (error) {
    console.error('AI skill name extraction failed:', error);
  }

  return null;
}

/**
 * Analyze user intent with AI
 */
export async function analyzeUserIntentWithAI(
  userInput: string,
  currentPrompt: string,
  conversationContext: any[],
  ai: any
): Promise<{
  action: string;
  confidence: number;
  reason: string;
  suggestedAction: string;
}> {
  try {
    const result = await geminiAIAgent(
      "gemini-2.0-flash",
      {
        prompt: PROMPTS.intentAnalysis(userInput, currentPrompt, conversationContext.slice(-3).map(c => `${c.type}: ${c.content}`).join('\n')),
        responseSchema: Schema.object({
          properties: {
            isHelpRequest: Schema.boolean(),
            confidence: Schema.number(),
            reason: Schema.string(),
            suggestedAction: Schema.string()
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
        action: data.isHelpRequest ? 'help' : 'continue',
        confidence: data.confidence,
        reason: data.reason,
        suggestedAction: data.suggestedAction
      };
    }
  } catch (error) {
    console.error('AI intent analysis failed:', error);
  }

  return {
    action: 'continue',
    confidence: 0.5,
    reason: 'AI analysis failed, defaulting to continue',
    suggestedAction: 'continue_normal_flow'
  };
}

/**
 * Check if response is unrelated to onboarding
 */
export async function isUnrelatedResponse(userInput: string, currentPrompt: string, ai?: any): Promise<boolean> {
  if (!ai) return false;

  try {
    const result = await geminiAIAgent(
      "gemini-2.0-flash",
      {
        prompt: `Determine if this user input is related to worker onboarding:

USER INPUT: "${userInput}"
CURRENT CONTEXT: "${currentPrompt}"

Is this input related to:
- Worker profile creation
- Job applications
- Skills and experience
- Availability and scheduling
- Professional information

Respond with JSON containing:
- isRelated: boolean
- confidence: 0-1 score
- reason: brief explanation`,
        responseSchema: Schema.object({
          properties: {
            isRelated: Schema.boolean(),
            confidence: Schema.number(),
            reason: Schema.string()
          },
          required: ['isRelated', 'confidence', 'reason']
        }),
        isStream: false,
      },
      ai
    );

    if (result.ok) {
      const data = result.data as any;
      return !data.isRelated && data.confidence > 0.7;
    }
  } catch (error) {
    console.error('AI unrelated response check failed:', error);
  }

  return false;
}

/**
 * Generate AI profile summary
 */
export async function generateAIProfileSummary(formData: FormData, ai: any): Promise<string> {
  try {
    const result = await geminiAIAgent(
      "gemini-2.0-flash",
      {
        prompt: `Create a professional summary for this worker profile:

PROFILE DATA:
${JSON.stringify(formData, null, 2)}

Create a concise, professional summary that:
1. Highlights key strengths and experience
2. Shows personality and work ethic
3. Is appropriate for job applications
4. Is 2-3 sentences long
5. Uses professional language

Format as a single paragraph.`,
        responseSchema: Schema.object({
          properties: {
            summary: Schema.string(),
          },
          required: ['summary']
        }),
        isStream: false,
      },
      ai
    );

    if (result.ok) {
      const data = result.data as any;
      return data.summary || 'Experienced professional with strong skills and dedication to quality work.';
    }
  } catch (error) {
    console.error('AI profile summary generation failed:', error);
  }

  return 'Experienced professional with strong skills and dedication to quality work.';
}

/**
 * Generate context-aware prompt for AI
 */
export async function generateContextAwarePrompt(fieldName: string, aboutInfo: string, ai: any): Promise<string> {
  // Quick fallback if AI service is not available
  if (!ai) {
    console.log('AI service not available, using fallback prompt');
    return `Please tell me about your ${fieldName}.`;
  }

  try {
    const promptSchema = Schema.object({
      properties: {
        prompt: Schema.string(),
      },
      required: ['prompt']
    });

    // Add timeout to prevent hanging
    const aiCall = geminiAIAgent(
      "gemini-2.0-flash",
      {
        prompt: PROMPTS.contextAwarePrompt(fieldName, aboutInfo),
        responseSchema: promptSchema,
        isStream: false,
      },
      ai
    );

    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('AI service timeout')), 10000) // 10 second timeout
    );

    const result = await Promise.race([aiCall, timeoutPromise]) as any;

    if (result.ok) {
      const data = result.data as any;
      return data.prompt || `Please tell me about your ${fieldName}.`;
    } else {
      console.error('AI context-aware prompt generation failed:', result.error);
      // If AI service is unavailable, return fallback immediately
      if (result.error && (
        result.error.includes('Sorry, I cannot answer this time') ||
        result.error.includes('Please retry') ||
        result.error.includes('report this issue') ||
        result.error.includes('cannot answer')
      )) {
        console.log('AI service temporarily unavailable, using fallback prompt');
        return `Please tell me about your ${fieldName}.`;
      }
    }
  } catch (error) {
    console.error('AI context-aware prompt generation failed:', error);
    // If it's any kind of API error, timeout, or service issue, return a fallback prompt immediately
    if (error instanceof Error && (
      error.message.includes('500') || 
      error.message.includes('Internal Server Error') ||
      error.message.includes('timeout') ||
      error.message.includes('Sorry, I cannot answer this time') ||
      error.message.includes('Please retry') ||
      error.message.includes('report this issue') ||
      error.message.includes('cannot answer')
    )) {
      console.log('AI service temporarily unavailable, using fallback prompt');
      return `Please tell me about your ${fieldName}.`;
    }
  }

  return `Please tell me about your ${fieldName}.`;
}

/**
 * Generate conversation-aware prompt using full conversation history
 */
export async function generateConversationAwarePrompt(
  fieldName: string, 
  conversationHistory: any[], 
  formData: any, 
  ai: any
): Promise<string> {
  try {
    const promptSchema = Schema.object({
      properties: {
        prompt: Schema.string(),
      },
      required: ['prompt']
    });

    // Build conversation context
    const conversationContext = {
      fieldName,
      userProfile: formData,
      conversationHistory: conversationHistory.map(step => ({
        type: step.type,
        content: step.content,
        timestamp: step.id
      }))
    };

    const prompt = `Generate a natural, conversational prompt for collecting ${fieldName} information.

CONVERSATION CONTEXT:
- Field: ${fieldName}
- User Profile: ${JSON.stringify(formData, null, 2)}
- Conversation History: ${JSON.stringify(conversationContext.conversationHistory, null, 2)}

REQUIREMENTS:
1. Use the full conversation history to avoid repetitive language
2. Don't say "Now that I know you're a..." or "I see you're a..." repeatedly
3. Build naturally on what the user has already shared
4. Use varied, natural language that doesn't sound robotic
5. Reference previous responses naturally without being repetitive
6. Make it feel like a natural conversation, not a form

Generate a 1-2 sentence prompt that feels natural and builds on the conversation.`;

    const result = await geminiAIAgent(
      "gemini-2.0-flash",
      {
        prompt,
        responseSchema: promptSchema,
        isStream: false,
      },
      ai
    );

    if (result.ok) {
      const data = result.data as any;
      return data.prompt || `Please tell me about your ${fieldName}.`;
    }
  } catch (error) {
    console.error('AI conversation-aware prompt generation failed:', error);
  }

  return `Please tell me about your ${fieldName}.`;
}

/**
 * Sanitize content with AI for specific fields
 */
export async function sanitizeWithAI(field: string, value: string): Promise<{ sanitized: string; naturalSummary?: string; jobTitle?: string; yearsOfExperience?: number }> {
  if (!value || value.trim().length === 0) {
    return { sanitized: value };
  }

  // Pre-validation: Check for inappropriate content before AI processing
  // Note: Pre-validation temporarily disabled to avoid import issues
  // TODO: Re-enable pre-validation once import path is resolved

  try {
    const ai = getAI();
    if (!ai) {
      // AI not available; returning original value
      return { sanitized: value };
    }

    let prompt = '';
    let schema: any;

    if (field === 'about') {
      prompt = `Clean up the grammar, spelling, and formatting of this bio input while keeping the original content and tone. Only fix spelling, grammar, punctuation, and basic formatting. Remove any curse words or inappropriate language but keep the casual, personal tone. Do not change the meaning or make it overly "professional" - just make it grammatically correct and appropriate.

Bio: "${value}"

Also provide a natural, conversational summary like "Perfect! Your bio sounds great!" or similar friendly response.`;
      
      schema = Schema.object({
        properties: {
          sanitized: Schema.string(),
          naturalSummary: Schema.string()
        },
        required: ["sanitized", "naturalSummary"]
      });
    } else if (field === 'skills') {
      prompt = `Clean up the grammar and formatting of this skills input while keeping the original content and tone. Only fix spelling, grammar, punctuation, and basic formatting. Do not change the meaning or make it more "professional" - just make it grammatically correct.

Skills: "${value}"

Also provide a natural, conversational summary like "So you are a [skill]?" or similar friendly response.`;
      
      schema = Schema.object({
        properties: {
          sanitized: Schema.string(),
          naturalSummary: Schema.string()
        },
        required: ["sanitized", "naturalSummary"]
      });
    } else if (field === 'experience') {
      prompt = `Extract the years of experience from this text. Be VERY LENIENT - accept any reasonable input including single numbers. REJECT only if it contains:
- Video game references: "mario", "luigi", "peach", "bowser", "sonic", "link", "zelda", "pokemon", etc.
- Fictional characters: "batman", "superman", "spiderman", "wonder woman", etc.
- Memes and internet culture: "its a me mario", "hello there", "general kenobi", etc.
- Jokes and humor: "i am the best at nothing", "i can fly", "i am a wizard", etc.
- Nonsense and gibberish: "asdf", "qwerty", "random text", "blah blah", etc.

ACCEPT ANY reasonable input including:
- Single numbers (e.g., "1", "5", "2.5")
- Numbers with "years" (e.g., "1 year", "5 years", "2.5 years")
- Numbers with "yrs" or "y" (e.g., "1 yr", "5 yrs", "2y")
- Descriptive text (e.g., "1 year of experience", "I have 5 years", "5 years of experience")
- Experience levels (e.g., "beginner", "intermediate", "senior", "expert")

Return the number of years as a number (can be decimal). If content is inappropriate or no clear number is found, return 0.

Also provide a natural, conversational summary that acknowledges their experience level in a friendly way. For experience levels like "beginner", "intermediate", "senior", "expert", just say something like "Got it, you're at [level] level" or "Perfect, you're [level] level". Don't mention years if they didn't specify a number.

Experience description: "${value}"`;
      
      schema = Schema.object({
        properties: {
          yearsOfExperience: Schema.number(),
          sanitized: Schema.string(),
          naturalSummary: Schema.string()
        },
        required: ["yearsOfExperience", "sanitized", "naturalSummary"]
      });
    } else if (field === 'qualifications') {
      prompt = `Clean up the grammar and formatting of this qualifications input while keeping the original content and tone. Only fix spelling, grammar, punctuation, and basic formatting. Do not change the meaning or make it more "professional" - just make it grammatically correct.

Qualifications: "${value}"

Return only the cleaned qualifications text without any prefixes like "Qualifications:" or labels. Just return the clean qualifications content.

Also provide a natural, conversational summary that explains what you've cleaned up in a friendly way.`;
      
      schema = Schema.object({
        properties: {
          sanitized: Schema.string(),
          naturalSummary: Schema.string()
        },
        required: ["sanitized", "naturalSummary"]
      });
    } else if (field === 'skills') {
      prompt = `Clean up the grammar and formatting of this skills input while keeping the original content and tone. Only fix spelling, grammar, punctuation, and basic formatting. Do not change the meaning or make it more "professional" - just make it grammatically correct.

Skills: "${value}"

Also provide a natural, conversational summary like "So you are a [skill]?" or similar friendly response.`;
      
      schema = Schema.object({
        properties: {
          sanitized: Schema.string(),
          naturalSummary: Schema.string()
        },
        required: ["sanitized", "naturalSummary"]
      });
    } else if (field === 'hourlyRate') {
      prompt = `Clean up the grammar and formatting of this hourly rate input while keeping the original content and tone. Only fix spelling, grammar, punctuation, and basic formatting. Do not change the meaning or make it more "professional" - just make it grammatically correct.

Hourly Rate: "${value}"

Also provide a natural, conversational summary like "So you charge [amount] per hour" or similar friendly response.`;
      
      schema = Schema.object({
        properties: {
          sanitized: Schema.string(),
          naturalSummary: Schema.string()
        },
        required: ["sanitized", "naturalSummary"]
      });
    } else if (field === 'equipment') {
      prompt = `Clean up the grammar and formatting of this equipment input while keeping the original content and tone. Only fix spelling, grammar, punctuation, and basic formatting. Do not change the meaning or make it more "professional" - just make it grammatically correct.

Equipment: "${value}"

Also provide a natural, conversational summary like "Great! You have [equipment list]" or similar friendly response.`;
      
      schema = Schema.object({
        properties: {
          sanitized: Schema.string(),
          naturalSummary: Schema.string()
        },
        required: ["sanitized", "naturalSummary"]
      });
    } else if (field === 'location') {
      prompt = `Clean up the grammar and formatting of this location input while keeping the original content and tone. Only fix spelling, grammar, punctuation, and basic formatting. Do not change the meaning or make it more "professional" - just make it grammatically correct.

Location: "${value}"

Also provide a natural, conversational summary like "Perfect! You're located in [location]" or similar friendly response.`;
      
      schema = Schema.object({
        properties: {
          sanitized: Schema.string(),
          naturalSummary: Schema.string()
        },
        required: ["sanitized", "naturalSummary"]
      });
    } else if (field === 'availability') {
      prompt = `Clean up the grammar and formatting of this availability input while keeping the original content and tone. Only fix spelling, grammar, punctuation, and basic formatting. Do not change the meaning or make it more "professional" - just make it grammatically correct.

Availability: "${value}"

Also provide a natural, conversational summary like "Got it! You're available [availability details]" or similar friendly response.`;
      
      schema = Schema.object({
        properties: {
          sanitized: Schema.string(),
          naturalSummary: Schema.string()
        },
        required: ["sanitized", "naturalSummary"]
      });
    } else if (field === 'videoIntro') {
      prompt = `Clean up the grammar and formatting of this video intro input while keeping the original content and tone. Only fix spelling, grammar, punctuation, and basic formatting. Do not change the meaning or make it more "professional" - just make it grammatically correct.

Video Intro: "${value}"

Also provide a natural, conversational summary like "Perfect! Your video intro will be [summary]" or similar friendly response.`;
      
      schema = Schema.object({
        properties: {
          sanitized: Schema.string(),
          naturalSummary: Schema.string()
        },
        required: ["sanitized", "naturalSummary"]
      });
    } else if (field === 'address') {
      prompt = `Clean up the grammar and formatting of this address input while keeping the original content and tone. Only fix spelling, grammar, punctuation, and basic formatting. Do not change the meaning or make it more "professional" - just make it grammatically correct.

Address: "${value}"

Also provide a natural, conversational summary like "Great! Your address is [address]" or similar friendly response.`;
      
      schema = Schema.object({
        properties: {
          sanitized: Schema.string(),
          naturalSummary: Schema.string()
        },
        required: ["sanitized", "naturalSummary"]
      });
    } else {
      return { sanitized: value };
    }

    const result = await geminiAIAgent(
      VALIDATION_CONSTANTS.AI_MODELS.GEMINI_2_0_FLASH,
      { prompt, responseSchema: schema },
      ai,
      VALIDATION_CONSTANTS.AI_MODELS.GEMINI_2_5_FLASH_PREVIEW
    );

    if (result.ok) {
      const data = result.data as any;
      console.log('🔍 AI sanitization raw response:', result.data);
      console.log('🔍 AI sanitization parsed data:', data);
      return {
        sanitized: data.sanitized || value,
        naturalSummary: data.naturalSummary,
        jobTitle: data.jobTitle,
        yearsOfExperience: data.yearsOfExperience
      };
    } else {
      console.error('AI sanitization failed:', result.error);
      return { sanitized: value };
    }
  } catch (error) {
    console.error('AI sanitization error:', error);
    return { sanitized: value };
  }
}

/**
 * Simple AI check function - like the old onboarding
 * Does all validation in one AI call
 */
export async function simpleAICheck(field: string, value: any, type: string): Promise<{ 
  sufficient: boolean, 
  clarificationPrompt?: string, 
  sanitized?: string | any, 
  naturalSummary?: string, 
  extractedData?: any 
}> {
  if (!value) {
    return { 
      sufficient: false, 
      clarificationPrompt: 'Please provide some information so I can help you create your worker profile!' 
    };
  }

  const trimmedValue = String(value).trim();
  
  // Quick hardcoded pattern check for obvious inappropriate content
  const inappropriatePatterns = [
    // Video game references
    /mario|luigi|peach|bowser|sonic|link|zelda|pokemon|minecraft|fortnite/i,
    // Fictional characters
    /batman|superman|spiderman|wonder woman|iron man|thor|hulk/i,
    // Memes and internet culture
    /its a me mario|hello there|general kenobi|rick roll/i,
    // Jokes and humor
    /i am the best at nothing|i can fly|i am a wizard|i am god/i,
    // Nonsense
    /asdf|qwerty|random text|blah blah|lorem ipsum/i,
    // Mocking responses
    /certified fuck|certified killa|certified award|certified winner|certified champion/i
  ];
  
  for (const pattern of inappropriatePatterns) {
    if (pattern.test(trimmedValue)) {
      return {
        sufficient: false,
        clarificationPrompt: 'Please provide professional information relevant to your work. Avoid jokes, memes, or inappropriate content.',
        sanitized: trimmedValue,
        naturalSummary: `You provided: ${trimmedValue}`,
        extractedData: trimmedValue
      };
    }
  }
  
  
  // Generate natural summary for common cases
  const generateNaturalSummary = (field: string, value: string): string => {
    const lowerValue = value.toLowerCase();
    
    if (field === 'skills') {
      if (lowerValue.includes('mechanic')) return "Perfect! You're a mechanic.";
      if (lowerValue.includes('baker')) return "Great! You're a baker.";
      if (lowerValue.includes('carpenter')) return "Excellent! You're a carpenter.";
      if (lowerValue.includes('electrician')) return "Wonderful! You're an electrician.";
      if (lowerValue.includes('plumber')) return "Great! You're a plumber.";
      if (lowerValue.includes('chef')) return "Fantastic! You're a chef.";
      if (lowerValue.includes('driver')) return "Perfect! You're a driver.";
      return `Great! You're a ${value}.`;
    }
    
    if (field === 'experience') {
      if (lowerValue.includes('beginner')) return "You're a beginner, that's great!";
      if (lowerValue.includes('intermediate')) return "You have intermediate experience, excellent!";
      if (lowerValue.includes('senior')) return "You're a senior professional, fantastic!";
      if (lowerValue.includes('expert')) return "You're an expert, amazing!";
      if (lowerValue.match(/\d+/)) return `Got it, you have ${value} years of experience.`;
      return `Great experience!`;
    }
    
    if (field === 'about') {
      return "Perfect! Your bio sounds great!";
    }
    
    if (field === 'qualifications') {
      return "Great qualifications!";
    }
    
    if (field === 'equipment') {
      return "Nice equipment list!";
    }
    
    return `Perfect! You provided: ${value}`;
  };
  
  // Basic length validation
  if (trimmedValue.length < 2) {
    return {
      sufficient: false,
      clarificationPrompt: 'Please provide more detailed information.',
      sanitized: trimmedValue,
      naturalSummary: `You provided: ${trimmedValue}`,
      extractedData: trimmedValue
    };
  }
  
  if (trimmedValue.length > 1000) {
    return {
      sufficient: false,
      clarificationPrompt: 'Please provide a shorter, more concise response (under 1000 characters).',
      sanitized: trimmedValue,
      naturalSummary: `You provided: ${trimmedValue}`,
      extractedData: trimmedValue
    };
  }
  
  // Use AI for all validation
  try {
    const ai = getAI();
    if (!ai) {
      return { sufficient: true, sanitized: trimmedValue };
    }

    const validationSchema = Schema.object({
      properties: {
        isAppropriate: Schema.boolean(),
        isWorkerRelated: Schema.boolean(),
        isSufficient: Schema.boolean(),
        clarificationPrompt: Schema.string(),
        sanitizedValue: Schema.string(),
        naturalSummary: Schema.string(),
        extractedData: Schema.string(),
      },
      required: ['isAppropriate', 'isWorkerRelated', 'isSufficient', 'clarificationPrompt', 'sanitizedValue', 'naturalSummary', 'extractedData']
    });

    const prompt = `Validate this ${field} input for a worker profile:

Field: ${field}
Input: "${trimmedValue}"
Type: ${type}

SPECIAL HANDLING FOR SKILLS FIELD:
- If user says "I am a [profession]" (like "I am a mechanic", "I am a baker"), this IS their skill/job title
- Clean and extract the profession: "I am a baker" → "Baker", "I'm a mechanic" → "Mechanic"
- Accept profession names as valid skills: "Baker", "Mechanic", "Carpenter", "Electrician", "Plumber", etc.
- For skills field, "I am a mechanic" should be accepted and cleaned to "Mechanic"
- Don't ask for more details if they've provided a clear profession
- Always capitalize the first letter of the profession

REJECT IMMEDIATELY if the input contains:
- Video game references: "mario", "luigi", "peach", "bowser", "sonic", "link", "zelda", "pokemon", "minecraft", "fortnite", etc.
- Fictional characters: "batman", "superman", "spiderman", "wonder woman", "iron man", "thor", etc.
- Memes and internet culture: "its a me mario", "hello there", "general kenobi", "rick roll", etc.
- Jokes and humor: "i am the best at nothing", "i can fly", "i am a wizard", "i am god", etc.
- Nonsense and gibberish: "asdf", "qwerty", "random text", "blah blah", "lorem ipsum", etc.
- Mocking responses: "certified fuck", "certified killa", "certified award", "certified winner", etc.
- Inappropriate content: profanity, sexual content, violence, hate speech, etc.

Check:
1. Is it appropriate and professional? (REJECT if contains any of the above)
2. Is it related to work/professional skills?
3. Is it sufficient information?
4. If not sufficient, provide a helpful clarification prompt
5. Sanitize/clean up the input (for skills field, clean profession statements to just the profession name)
6. Provide a natural summary of what the user said
7. Extract the key data

EXAMPLES OF CLEANING FOR SKILLS FIELD:
- "I am a baker" → sanitizedValue: "Baker", naturalSummary: "Great! You're a baker."
- "I'm a mechanic" → sanitizedValue: "Mechanic", naturalSummary: "Perfect! You're a mechanic."
- "I work as a carpenter" → sanitizedValue: "Carpenter", naturalSummary: "Excellent! You're a carpenter."
- "I am an electrician" → sanitizedValue: "Electrician", naturalSummary: "Wonderful! You're an electrician."
- "I do plumbing" → sanitizedValue: "Plumber", naturalSummary: "Great! You're a plumber."

EXAMPLES OF NATURAL SUMMARIES:
- For skills: "Perfect! You're a mechanic." or "Great! You're a baker."
- For experience: "Got it, you have 5 years of experience." or "You're a beginner, that's great!"
- For bio: "This will be your bio!" or "Perfect bio!"
- For qualifications: "Great qualifications!" or "Excellent certifications!"
- For equipment: "Nice equipment list!" or "Perfect equipment setup!"

Make naturalSummary conversational, friendly, and encouraging. Use exclamation marks and positive language.

Respond with JSON only:`;

    const result = await geminiAIAgent(
      "gemini-2.0-flash",
      {
        prompt: prompt,
        responseSchema: validationSchema,
        isStream: false,
      },
      ai
    );

    if (result.ok) {
      const data = result.data as any;
      
      if (!data.isAppropriate || !data.isWorkerRelated || !data.isSufficient) {
        return {
          sufficient: false,
          clarificationPrompt: data.clarificationPrompt || 'Please provide more information.',
          sanitized: data.sanitizedValue,
          naturalSummary: data.naturalSummary,
          extractedData: data.extractedData
        };
      }

      return {
        sufficient: true,
        sanitized: data.sanitizedValue,
        naturalSummary: data.naturalSummary || generateNaturalSummary(field, data.sanitizedValue),
        extractedData: data.extractedData
      };
    }
  } catch (error) {
    console.error('Simple AI check failed:', error);
  }

  // Fallback
  return { 
    sufficient: true, 
    sanitized: trimmedValue,
    naturalSummary: `You provided: ${trimmedValue}`,
    extractedData: trimmedValue
  };
}
