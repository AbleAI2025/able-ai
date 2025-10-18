/**
 * hospitality-prompts.ts
 * 
 * UK Hospitality-specific prompts and AI integration for Gemini 2.5 Flash.
 * Contains the Gigfolio Coach persona and phase-specific prompts.
 */

export const HOSPITALITY_PROMPTS = {
  /**
   * Welcome message for the Gigfolio Coach persona
   */
  welcomeMessage: () => `Welcome to Able AI! I'm your Gigfolio Coach, here to help you create an amazing hospitality profile for UK gigs. Let's get started!`,

  /**
   * Phase-specific prompts for each of the 6 hospitality phases
   */
  phasePrompts: {
    mainSkill: () => `Welcome to Able AI! I'm your Gigfolio Coach. What's your main skill and how long have you been doing it? 

For example: "I'm a bartender with 6 years experience" or "I'm a chef with 3 years in fine dining"`,

    venueExperience: (skillInfo: string) => `Great! Now tell me about your experience. Where have you gained this experience? 

Describe the venues and atmosphere - pubs, restaurants, hotels, festivals, etc. What kind of places have you worked in?`,

    qualifications: () => `Do you have any of these qualifications? 
• Food Hygiene Certificate
• Personal License (for alcohol service)
• Hospitality-related degree
• Other certifications

If you don't have any, just say "none" - that's perfectly fine!`,

    specificSkills: () => `What specific skills & languages set you apart? 

For example: wine knowledge, multi-lingual abilities, technical skills, customer service expertise, etc.`,

    workTraits: () => `What work traits describe you? Pick 3-4 that best represent you:

• Calm under pressure
• Team player
• Customer-focused
• Creative
• Detail-oriented
• Leadership skills
• Problem solver
• Adaptable
• Enthusiastic
• Professional`,

    equipment: () => `What equipment/tools are you confident using, whether you own them or not?

For example: POS systems, bar tools, coffee machines, kitchen equipment, etc.`
  },

  /**
   * Context-aware prompts that build on previous responses
   */
  contextAwarePrompt: (fieldName: string, previousInfo: string) => {
    const contextPrompts = {
      venueExperience: (skill: string) => `Perfect! As a ${skill}, where have you gained this experience? Tell me about the venues - pubs, restaurants, hotels, festivals, etc.`,

      qualifications: (skill: string) => `As a ${skill}, do you have any relevant qualifications? Food Hygiene Certificate, Personal License, or other certifications?`,

      specificSkills: (skill: string, venues?: string) => `What specific skills set you apart as a ${skill}? Any special knowledge, languages, or technical abilities?`,

      workTraits: (skill: string, venues?: string) => `What work traits make you great at ${skill}? Pick 3-4 that describe you best.`,

      equipment: (skill: string) => `What equipment are you confident using as a ${skill}? Any tools, systems, or machinery you're experienced with?`
    };

    return contextPrompts[fieldName as keyof typeof contextPrompts]?.(previousInfo) || 
           `Tell me about your ${fieldName}.`;
  },

  /**
   * Validation prompts for unclear responses
   */
  clarificationPrompts: {
    mainSkill: () => `I'd love to help you get started! Could you tell me your main hospitality skill and how long you've been doing it? 

For example: "I'm a bartender with 6 years experience"`,

    venueExperience: () => `Could you tell me more about where you've worked? I'd love to hear about the types of venues - pubs, restaurants, hotels, festivals, etc.`,

    qualifications: () => `No worries if you don't have formal qualifications! Just let me know if you have any certificates, licenses, or degrees, or simply say "none".`,

    specificSkills: () => `What makes you stand out? Any special skills, languages, or technical abilities you'd like to mention?`,

    workTraits: () => `What work traits describe you best? Pick 3-4 from the list, or describe your own traits.`,

    equipment: () => `What equipment or tools are you comfortable using? Even if you don't own them, what are you experienced with?`
  },

  /**
   * Confirmation prompts for extracted data
   */
  confirmationPrompt: (fieldName: string, extractedValue: string) => {
    const confirmations = {
      mainSkill: (value: string) => `Perfect! I've noted that you're a ${value}. Is this correct?`,
      venueExperience: (value: string) => `I've captured your venue experience: "${value}". Does this look right?`,
      qualifications: (value: string) => `Your qualifications: "${value}". Is this accurate?`,
      specificSkills: (value: string) => `Your specific skills: "${value}". Does this capture what you wanted to say?`,
      workTraits: (value: string) => `Your work traits: "${value}". Is this how you'd describe yourself?`,
      equipment: (value: string) => `Your equipment experience: "${value}". Does this look correct?`
    };

    return confirmations[fieldName as keyof typeof confirmations]?.(extractedValue) || 
           `I've noted: "${extractedValue}". Is this correct?`;
  },

  /**
   * Hospitality-specific video script generation for Gemini 2.5 Flash
   */
  videoScript: (formData: any) => `Create a personalized video introduction script for a UK hospitality worker. Use the following information to create an engaging, professional script:

PROFILE DATA:
- Main Skill: ${formData.mainSkill || 'Not provided'}
- Venue Experience: ${formData.venueExperience || 'Not provided'}
- Qualifications: ${formData.qualifications || 'Not provided'}
- Specific Skills: ${formData.specificSkills || 'Not provided'}
- Work Traits: ${formData.workTraits || 'Not provided'}
- Equipment: ${formData.equipment || 'Not provided'}

IMPORTANT: This is for UK hospitality work, so focus on:
1. Professional hospitality experience
2. Customer service excellence
3. UK venue types (pubs, restaurants, hotels, festivals)
4. Relevant certifications (Food Hygiene, Personal License)
5. Team work and adaptability

Create a script that:
1. Is conversational and enthusiastic
2. Highlights UK hospitality experience
3. Shows personality and professionalism
4. Is 30-60 seconds when spoken
5. Uses natural, confident language
6. Emphasizes customer service skills
7. Mentions specific venue types if relevant

Format as a natural speaking script with line breaks for pauses.`,

  /**
   * Profile summary generation for final confirmation
   */
  profileSummary: (formData: any) => `Create a professional summary for a UK hospitality worker profile based on this information:

MAIN SKILL: ${formData.mainSkill || 'Not provided'}
VENUE EXPERIENCE: ${formData.venueExperience || 'Not provided'}
QUALIFICATIONS: ${formData.qualifications || 'Not provided'}
SPECIFIC SKILLS: ${formData.specificSkills || 'Not provided'}
WORK TRAITS: ${formData.workTraits || 'Not provided'}
EQUIPMENT: ${formData.equipment || 'Not provided'}
LOCATION: ${formData.location || 'Not provided'}
AVAILABILITY: ${formData.availability || 'Not provided'}
HOURLY RATE: £${formData.hourlyRate || 'Not provided'}

Create a compelling summary that:
1. Highlights their hospitality expertise
2. Emphasizes UK venue experience
3. Shows professionalism and personality
4. Is 2-3 sentences long
5. Focuses on customer service and team work
6. Mentions relevant qualifications if any

Make it sound natural and engaging for potential employers.`,

  /**
   * Intent analysis for user responses
   */
  intentAnalysis: (userInput: string, currentPhase: string) => `Analyze this user input in the context of UK hospitality onboarding:

USER INPUT: "${userInput}"
CURRENT PHASE: "${currentPhase}"

Determine if the user is:
1. Providing normal hospitality information
2. Asking for help or clarification
3. Trying to skip the process
4. Having technical issues
5. Expressing frustration

Respond with JSON containing:
- action: "continue", "help", "clarify", "skip", or "escalate"
- confidence: 0-1 confidence score
- reason: Brief explanation
- suggestedResponse: What the system should say next
- extractedData: Any data extracted from the input (if applicable)`
};

/**
 * Helper function to get the appropriate prompt based on context
 */
export function getContextualPrompt(
  fieldName: string, 
  phase: number, 
  previousData?: any
): string {
  const phasePrompts = HOSPITALITY_PROMPTS.phasePrompts;
  
  switch (fieldName) {
    case 'mainSkill':
      return phasePrompts.mainSkill();
    case 'venueExperience':
      return previousData?.mainSkill 
        ? HOSPITALITY_PROMPTS.contextAwarePrompt('venueExperience', previousData.mainSkill)
        : phasePrompts.venueExperience('');
    case 'qualifications':
      return previousData?.mainSkill 
        ? HOSPITALITY_PROMPTS.contextAwarePrompt('qualifications', previousData.mainSkill)
        : phasePrompts.qualifications();
    case 'specificSkills':
      return previousData?.mainSkill && previousData?.venueExperience
        ? HOSPITALITY_PROMPTS.contextAwarePrompt('specificSkills', `${previousData.mainSkill} with experience in ${previousData.venueExperience}`)
        : phasePrompts.specificSkills();
    case 'workTraits':
      return previousData?.mainSkill
        ? HOSPITALITY_PROMPTS.contextAwarePrompt('workTraits', previousData.mainSkill)
        : phasePrompts.workTraits();
    case 'equipment':
      return previousData?.mainSkill
        ? HOSPITALITY_PROMPTS.contextAwarePrompt('equipment', previousData.mainSkill)
        : phasePrompts.equipment();
    default:
      return `Tell me about your ${fieldName}.`;
  }
}

/**
 * Helper function to get clarification prompt
 */
export function getClarificationPrompt(fieldName: string): string {
  const clarificationPrompts = HOSPITALITY_PROMPTS.clarificationPrompts;
  return clarificationPrompts[fieldName as keyof typeof clarificationPrompts]?.() || 
         `Could you provide more information about your ${fieldName}?`;
}
