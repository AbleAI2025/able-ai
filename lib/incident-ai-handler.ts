/**
 * Incident AI Handler
 * Handles AI-powered incident reporting flow
 */

import { geminiAIAgent, SupportedGeminiModel } from '@/lib/firebase/ai';
import { Schema } from '@firebase/ai';
import { IncidentType, IncidentAIResponse, IncidentAIPrompt } from '@/app/types/incidentTypes';
import { getIncidentSeverity } from '@/lib/incident-detection';

export interface IncidentAIConfig {
  modelName: SupportedGeminiModel;
  fallbackModelName?: SupportedGeminiModel;
  maxRetries?: number;
}

const DEFAULT_CONFIG: IncidentAIConfig = {
  modelName: 'gemini-2.0-flash',
  fallbackModelName: 'gemini-2.5-flash-preview-05-20',
  maxRetries: 3
};

/**
 * Process incident reporting conversation with AI
 */
export async function processIncidentReport(
  prompt: IncidentAIPrompt,
  ai: any,
  config: IncidentAIConfig = DEFAULT_CONFIG
): Promise<IncidentAIResponse> {
  try {
    const aiPrompt = buildIncidentPrompt(prompt);
    const responseSchema = getIncidentResponseSchema();

    const result = await geminiAIAgent(
      config.modelName,
      { 
        prompt: aiPrompt, 
        responseSchema 
      },
      ai,
      config.fallbackModelName,
      config.maxRetries
    );

    if (!result.ok || !result.data) {
      throw new Error('Failed to get AI response for incident reporting');
    }

    return parseIncidentResponse(result.data);
  } catch (error) {
    console.error('Error processing incident report:', error);
    return {
      response: 'I apologize, but I\'m having trouble processing your incident report right now. Please try again or contact support directly.',
      isComplete: false,
      requiresFollowUp: true
    };
  }
}

/**
 * Build AI prompt for incident reporting
 */
function buildIncidentPrompt(prompt: IncidentAIPrompt): string {
  const { userInput, incidentType, currentStep, totalSteps, collectedData, conversationHistory } = prompt;
  
  const conversationContext = conversationHistory
    .map(step => `${step.type}: ${step.content}`)
    .join('\n');

  const basePrompt = `You are Able AI, an assistant helping users report incidents on a gig platform. You are currently in an incident reporting flow.

Before responding to the user, follow this structured reasoning process:
1. UNDERSTAND: Identify the core incident being reported and the current step in the flow
2. ANALYZE: Break down the key factors, collected data, and what information is still needed
3. REASON: Find logical connections between the incident type and required information
4. SYNTHESIZE: Combine the context to determine the most appropriate next question or action
5. CONCLUDE: Provide clear, helpful guidance for the next step in the incident reporting process

INCIDENT TYPE: ${incidentType}
CURRENT STEP: ${currentStep} of ${totalSteps}
COLLECTED DATA SO FAR: ${JSON.stringify(collectedData, null, 2)}

CONVERSATION HISTORY:
${conversationContext}

USER'S LATEST INPUT: "${userInput}"

Your role is to:
1. Gather all necessary information about the incident
2. Be empathetic and supportive
3. Ask clarifying questions when needed
4. Ensure the user feels heard and supported
5. Collect specific details relevant to the incident type

INCIDENT TYPE GUIDANCE:
${getIncidentTypeGuidance(incidentType)}

RESPONSE GUIDELINES:
- Be professional, empathetic, and supportive
- Ask one question at a time to avoid overwhelming the user
- Use "I" statements to show you understand their situation
- Validate their concerns and feelings
- Be specific about what information you need
- If the user seems distressed, prioritize their emotional well-being
- Keep responses concise but comprehensive

Respond with a JSON object containing your response and any collected data.`;

  return basePrompt;
}

/**
 * Get guidance for specific incident types
 */
function getIncidentTypeGuidance(incidentType: IncidentType): string {
  switch (incidentType) {
    case 'harassment':
      return `
For harassment incidents, collect:
- Who was involved (names, roles, relationship to user)
- What happened (specific behaviors, words, actions)
- When it occurred (dates, times, frequency)
- Where it happened (location, workplace, online)
- Any witnesses present
- How it made the user feel
- Any evidence (messages, photos, recordings)
- Previous incidents with the same person
- User's desired outcome`;
    
    case 'unsafe_work_conditions':
      return `
For unsafe work conditions, collect:
- Specific safety hazards or violations
- Location and work environment details
- Equipment or safety gear issues
- Training or safety protocol problems
- Any injuries or near-misses
- Who was responsible for safety
- Photos or documentation of hazards
- Previous safety concerns
- Immediate safety risks`;
    
    case 'discrimination':
      return `
For discrimination incidents, collect:
- What type of discrimination (race, gender, age, etc.)
- Specific discriminatory actions or comments
- Who was involved (names, roles)
- When and where it occurred
- How it affected the user's work or opportunities
- Any witnesses
- Previous incidents
- Evidence of discrimination
- User's desired resolution`;
    
    case 'threats':
      return `
For threat incidents, collect:
- Nature of the threats (verbal, written, physical)
- Who made the threats
- What was threatened
- When and where threats occurred
- Any witnesses
- Evidence of threats (messages, recordings)
- User's current safety status
- Immediate safety concerns
- Previous threats from the same person`;
    
    case 'inappropriate_behavior':
      return `
For inappropriate behavior, collect:
- Specific behaviors that were inappropriate
- Who was involved
- When and where it occurred
- How it affected the user
- Any witnesses
- Previous similar incidents
- Evidence of the behavior
- User's comfort level
- Desired resolution`;
    
    case 'safety_concern':
      return `
For safety concerns, collect:
- Specific safety issues or concerns
- Location and work environment
- Potential risks or hazards
- Who is responsible for safety
- Any previous safety incidents
- Evidence of safety issues
- Immediate risks
- User's safety recommendations
- Urgency level`;
    
    default:
      return `
For other incidents, collect:
- Detailed description of what happened
- Who was involved
- When and where it occurred
- How it affected the user
- Any witnesses
- Evidence or documentation
- User's desired outcome
- Any other relevant details`;
  }
}

/**
 * Get response schema for incident AI
 */
function getIncidentResponseSchema() {
  return Schema.object({
    properties: {
      response: Schema.string(),
      nextStep: Schema.number(),
      isComplete: Schema.boolean(),
      collectedData: Schema.object({
        properties: {
          // Dynamic properties based on incident type
        },
        additionalProperties: true
      }),
      suggestedActions: Schema.array({
        items: Schema.string()
      }),
      requiresFollowUp: Schema.boolean(),
      emotionalSupport: Schema.boolean(), // Whether user needs emotional support
      urgencyLevel: Schema.string() // 'LOW', 'MEDIUM', 'HIGH', 'URGENT'
    },
    required: ['response', 'nextStep', 'isComplete']
  });
}

/**
 * Parse AI response for incident reporting
 */
function parseIncidentResponse(data: any): IncidentAIResponse {
  return {
    response: data.response || 'I understand your concern. Let me help you document this incident properly.',
    nextStep: data.nextStep || 1,
    isComplete: data.isComplete || false,
    collectedData: data.collectedData || {},
    suggestedActions: data.suggestedActions || [],
    requiresFollowUp: data.requiresFollowUp || false
  };
}

/**
 * Generate incident report summary
 */
export function generateIncidentSummary(
  incidentType: IncidentType,
  collectedData: { [key: string]: any }
): string {
  const baseSummary = `Incident Type: ${incidentType}\n`;
  
  let details = '';
  for (const [key, value] of Object.entries(collectedData)) {
    if (value && typeof value === 'string' && value.trim()) {
      details += `${key}: ${value}\n`;
    }
  }
  
  return baseSummary + details;
}

/**
 * Get follow-up questions based on incident type and current data
 */
export function getFollowUpQuestions(
  incidentType: IncidentType,
  currentData: { [key: string]: any }
): string[] {
  const questions: { [key in IncidentType]: string[] } = {
    harassment: [
      'Can you tell me more about what specifically happened?',
      'Who was involved in this incident?',
      'When did this occur?',
      'Where did this happen?',
      'Were there any witnesses present?',
      'How did this make you feel?',
      'Is there any evidence you can provide?'
    ],
    unsafe_work_conditions: [
      'What specific safety hazards did you encounter?',
      'Where exactly did this occur?',
      'What equipment or safety measures were missing?',
      'Were you or anyone else injured?',
      'Who was responsible for safety at that location?',
      'Have you reported this before?'
    ],
    discrimination: [
      'What type of discrimination did you experience?',
      'Who was involved in this incident?',
      'Can you describe what was said or done?',
      'When did this occur?',
      'How did this affect your work or opportunities?',
      'Were there any witnesses?'
    ],
    threats: [
      'What type of threats were made?',
      'Who made these threats?',
      'When and where did this occur?',
      'Do you feel safe right now?',
      'Were there any witnesses?',
      'Do you have any evidence of the threats?'
    ],
    inappropriate_behavior: [
      'What specific behavior was inappropriate?',
      'Who was involved?',
      'When did this occur?',
      'How did this affect you?',
      'Were there any witnesses?',
      'Have you experienced this before?'
    ],
    safety_concern: [
      'What specific safety concerns do you have?',
      'Where is this occurring?',
      'What risks are you concerned about?',
      'Who is responsible for safety?',
      'How urgent is this concern?',
      'Have you reported this before?'
    ],
    other: [
      'Can you provide more details about what happened?',
      'Who was involved?',
      'When did this occur?',
      'Where did this happen?',
      'How did this affect you?',
      'What would you like to see happen?'
    ]
  };

  return questions[incidentType] || questions.other;
}
