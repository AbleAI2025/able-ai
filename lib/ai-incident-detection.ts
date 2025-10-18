/**
 * AI-Powered Incident Detection System
 * Uses AI to validate context and prevent false positives
 */

import { geminiAIAgent } from '@/lib/firebase/ai';
import { getAI } from '@firebase/ai';
import { Schema } from '@firebase/ai';

export interface AIIncidentDetectionResult {
  isIncident: boolean;
  incidentType: IncidentType | null;
  confidence: number; // 0-1 scale
  reasoning: string;
  context: 'professional' | 'educational' | 'personal_report' | 'general' | 'unclear' | 'exit_request';
  suggestedAction: string;
  requiresImmediateAttention: boolean;
  isExitRequest?: boolean;
}

export type IncidentType = 
  | 'harassment'
  | 'unsafe_work_conditions'
  | 'discrimination'
  | 'threats'
  | 'inappropriate_behavior'
  | 'safety_concern'
  | 'other';

/**
 * AI-powered incident detection with context validation
 */
export async function detectIncidentWithAI(
  userInput: string, 
  ai: any
): Promise<AIIncidentDetectionResult> {
  if (!ai) {
    // Fallback to basic keyword detection if AI is not available
    return detectIncidentFallback(userInput);
  }

  try {
    const responseSchema = Schema.object({
      properties: {
        isIncident: Schema.boolean(),
        incidentType: Schema.string(),
        confidence: Schema.number(),
        reasoning: Schema.string(),
        context: Schema.string(),
        requiresImmediateAttention: Schema.boolean(),
        isExitRequest: Schema.boolean(),
      },
    });

    const prompt = `You are an expert incident detection system for a gig platform. Analyze the following user message to determine if it describes an actual incident that needs to be reported.

IMPORTANT CONTEXT VALIDATION RULES:
1. Professional/Educational Context: If someone mentions being an "expert in harassment prevention", "harassment training", "studying harassment", "harassment policies", "harassment laws", etc. - this is NOT an incident report
2. General Discussion: If someone is discussing harassment, discrimination, or safety in general terms without describing a personal experience - this is NOT an incident report
3. Questions: If someone is asking questions about policies, procedures, or how to handle situations - this is NOT an incident report
4. Hypothetical: If someone is discussing hypothetical scenarios or examples - this is NOT an incident report
5. Technical Issues: If someone mentions "can't login", "login problems", "technical issues", "app not working", "website issues", "password problems", "account issues", "system errors", etc. - this is NOT an incident report
6. General Help Requests: If someone is asking for general help, support, or assistance without describing a personal incident - this is NOT an incident report
7. Exit Requests: If someone says "nevermind", "cancel", "stop", "I don't want to report", "forget it", "actually no", "false alarm", etc. - this is an exit request

ONLY flag as an incident if:
- The user is describing a personal experience they had
- They are reporting something that happened to them or someone they know
- They are seeking help for a specific situation they're experiencing
- They are describing ongoing issues affecting them personally

User message: "${userInput}"

Analyze this message and determine:
1. isIncident: true only if this is a personal incident report, false otherwise
2. incidentType: one of: harassment, unsafe_work_conditions, discrimination, threats, inappropriate_behavior, safety_concern, other (only if isIncident is true)
3. confidence: 0.0 to 1.0 based on how certain you are
4. reasoning: explain your decision in 1-2 sentences
5. context: professional, educational, personal_report, general, unclear, or exit_request
6. requiresImmediateAttention: true only for threats or serious safety issues
7. isExitRequest: true if the user wants to cancel/exit incident reporting

Examples:
- "I am an expert in harassment prevention" → isIncident: false, context: professional
- "I experienced harassment at work" → isIncident: true, incidentType: harassment, context: personal_report
- "What are the harassment policies?" → isIncident: false, context: general
- "I can't login to my account" → isIncident: false, context: general
- "The app is not working" → isIncident: false, context: general
- "I need help with my password" → isIncident: false, context: general
- "Someone threatened me" → isIncident: true, incidentType: threats, context: personal_report, requiresImmediateAttention: true
- "Nevermind, I don't want to report" → isIncident: false, context: exit_request, isExitRequest: true
- "Cancel that, it was a misunderstanding" → isIncident: false, context: exit_request, isExitRequest: true`;

    const result = await geminiAIAgent(
      "gemini-2.0-flash",
      {
        prompt,
        responseSchema,
        isStream: false,
      },
      ai
    );

    if (result.ok && result.data) {
      const aiResponse = result.data as any;
      
      return {
        isIncident: aiResponse.isIncident,
        incidentType: aiResponse.isIncident ? (aiResponse.incidentType as IncidentType) : null,
        confidence: Math.min(Math.max(aiResponse.confidence, 0), 1),
        reasoning: aiResponse.reasoning,
        context: aiResponse.context as any,
        suggestedAction: getSuggestedAction(aiResponse.incidentType, aiResponse.context),
        requiresImmediateAttention: aiResponse.requiresImmediateAttention || false,
        isExitRequest: aiResponse.isExitRequest || false
      };
    } else {
      throw new Error('AI detection failed');
    }
  } catch (error) {
    console.error('AI incident detection error:', error);
    // Fallback to basic detection
    return detectIncidentFallback(userInput);
  }
}

/**
 * Fallback keyword-based detection (simplified version)
 */
function detectIncidentFallback(userInput: string): AIIncidentDetectionResult {
  const normalizedInput = userInput.toLowerCase().trim();
  
  // Basic patterns for fallback
  const patterns = {
    harassment: ['harassed me', 'harassing me', 'unwanted attention', 'making me uncomfortable'],
    threats: ['threatened me', 'threatening me', 'threat of violence'],
    discrimination: ['discriminated against me', 'treated unfairly because'],
    unsafe_work_conditions: ['unsafe working conditions', 'dangerous workplace', 'safety hazard'],
    inappropriate_behavior: ['inappropriate behavior', 'unprofessional conduct', 'being bullied'],
    safety_concern: ['safety concern', 'worried about safety', 'scared for my safety']
  };

  for (const [type, keywords] of Object.entries(patterns)) {
    for (const keyword of keywords) {
      if (normalizedInput.includes(keyword)) {
        return {
          isIncident: true,
          incidentType: type as IncidentType,
          confidence: 0.6,
          reasoning: `Detected potential ${type} based on keyword matching`,
          context: 'personal_report',
          suggestedAction: getSuggestedAction(type as IncidentType, 'personal_report'),
          requiresImmediateAttention: type === 'threats'
        };
      }
    }
  }

  // Check for exit requests in fallback
  const exitKeywords = ['nevermind', 'cancel', 'stop', 'forget it', 'actually no', 'false alarm', 'i don\'t want to report', 'don\'t want to report'];
  const isExitRequest = exitKeywords.some(keyword => normalizedInput.includes(keyword));

  return {
    isIncident: false,
    incidentType: null,
    confidence: 0.0,
    reasoning: isExitRequest ? 'Exit request detected' : 'No incident patterns detected',
    context: isExitRequest ? 'exit_request' : 'general',
    suggestedAction: '',
    requiresImmediateAttention: false,
    isExitRequest
  };
}

/**
 * Get suggested action based on incident type and context
 */
function getSuggestedAction(incidentType: string, context: string): string {
  if (context === 'exit_request') {
    return 'No problem! I\'ve cancelled the incident reporting. Is there anything else I can help you with?';
  }
  
  if (context === 'professional' || context === 'educational') {
    return 'I understand you\'re discussing this from a professional or educational perspective. If you need to report an actual incident, please let me know.';
  }

  switch (incidentType) {
    case 'harassment':
      return 'I understand you may be experiencing harassment. This is serious and I want to help you report this properly.';
    case 'unsafe_work_conditions':
      return 'I\'m concerned about the safety issues you\'ve mentioned. Let\'s document this properly for your protection.';
    case 'discrimination':
      return 'Discrimination is unacceptable. I want to help you report this incident with all the necessary details.';
    case 'threats':
      return 'Threats are very serious. I need to help you report this immediately for your safety.';
    case 'inappropriate_behavior':
      return 'I\'m sorry you\'re experiencing inappropriate behavior. Let\'s document this incident properly.';
    case 'safety_concern':
      return 'Your safety is our priority. Let\'s document this concern properly so we can address it.';
    default:
      return 'I want to help you report this incident properly. Let\'s gather the necessary information.';
  }
}

/**
 * Enhanced incident detection with multiple validation layers
 */
export async function detectIncidentEnhanced(
  userInput: string,
  ai: any,
  previousMessages?: string[]
): Promise<AIIncidentDetectionResult> {
  // First, try AI detection
  const aiResult = await detectIncidentWithAI(userInput, ai);
  
  // If AI says it's not an incident, trust it
  if (!aiResult.isIncident) {
    return aiResult;
  }

  // If AI says it's an incident, do additional validation
  if (aiResult.confidence < 0.7) {
    // Low confidence - might be false positive
    return {
      ...aiResult,
      isIncident: false,
      reasoning: `Low confidence detection (${aiResult.confidence.toFixed(2)}). ${aiResult.reasoning}`,
      suggestedAction: 'If you need to report an actual incident, please provide more specific details about what happened to you personally.'
    };
  }

  // High confidence - proceed with incident reporting
  return aiResult;
}
