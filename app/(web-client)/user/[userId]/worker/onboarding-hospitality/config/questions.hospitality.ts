/**
 * questions.hospitality.ts
 * 
 * Hospitality-specific prompts mapped to existing onboarding engine field names.
 * Uses the same field structure as onboarding-ai but with hospitality-focused prompts.
 */

export type RequiredField = {
  name: string;
  type: string;
  placeholder?: string;
  defaultPrompt: string;
  rows?: number;
};

/**
 * Required fields with hospitality-specific prompts
 * Phase mapping:
 * - Phase 1: skills (with embedded experience)
 * - Phase 2: about (venue experience)
 * - Phase 3: qualifications
 * - Phase 4: about (specific skills & languages)
 * - Phase 5: about (personal traits)
 * - Phase 6: equipment
 * - Phase 7: location
 * - Phase 8: availability
 * - Phase 9: hourlyRate
 * - Phase 10: videoIntro
 */
export const requiredFields: RequiredField[] = [
  // Phase 1: Welcome/Initial Skill - stored in 'skills' field
  { 
    name: "skills", 
    type: "text", 
    rows: 2, 
    placeholder: "e.g., 'Bartender with 6 years experience'", 
    defaultPrompt: "Welcome to Able AI! I'm your Gigfolio Coach, here to help you create an amazing hospitality profile. What's your main hospitality skill and how long have you been doing it? (e.g., 'I'm a bartender with 6 years experience')" 
  },
  
  // Phase 2: Experience Deep Dive - stored in 'about' field
  { 
    name: "about", 
    type: "text", 
    rows: 4, 
    placeholder: "Tell us about the venues you've worked in...", 
    defaultPrompt: "Great! Now tell me about your venue experience. What types of establishments have you worked in? (pubs, restaurants, hotels, festivals, etc.) Describe the atmosphere and what you enjoyed most." 
  },
  
  // Phase 3: Qualifications
  { 
    name: "qualifications", 
    type: "text", 
    rows: 3, 
    placeholder: "Food Hygiene Certificate, Personal License, etc.", 
    defaultPrompt: "Do you have any hospitality qualifications? For example: Food Hygiene Certificate, Personal License, hospitality degree, first aid, allergen awareness. (You can say 'none' if you don't have formal qualifications)" 
  },
  
  // Phase 4: Specific Skills & Languages - appended to 'about'
  { 
    name: "specificSkills", 
    type: "text", 
    rows: 3, 
    placeholder: "e.g., wine knowledge, multi-lingual, cocktail expertise", 
    defaultPrompt: "What specific skills and languages set you apart? (e.g., wine knowledge, cocktail expertise, multi-lingual abilities, POS systems expertise)" 
  },
  
  // Phase 5: Personal Traits - appended to 'about'
  { 
    name: "workTraits", 
    type: "text", 
    rows: 2, 
    placeholder: "e.g., calm under pressure, team player, customer-focused", 
    defaultPrompt: "What work traits best describe you? Pick 3-4 that define your approach (e.g., calm under pressure, team player, customer-focused, creative, detail-oriented)" 
  },
  
  // Phase 6: Equipment
  { 
    name: "equipment", 
    type: "text", 
    rows: 2, 
    placeholder: "POS systems, bar tools, coffee machines, etc.", 
    defaultPrompt: "What equipment and tools are you confident using? (e.g., POS systems, bar tools, coffee machines, kitchen equipment - list all that apply)" 
  },
  
  // Phase 7: Location
  { 
    name: "location", 
    type: "location", 
    defaultPrompt: "Where are you based for work? This helps us find hospitality gigs near you." 
  },
  
  // Phase 8: Availability
  { 
    name: "availability", 
    type: "availability", 
    defaultPrompt: "When are you available for hospitality shifts? Let's set up your weekly schedule." 
  },
  
  // Phase 9: Hourly Rate
  { 
    name: "hourlyRate", 
    type: "number", 
    placeholder: "15", 
    defaultPrompt: "What's your preferred hourly rate in pounds (£)? Consider your experience and the UK hospitality market rates." 
  },
  
  // Phase 10: Video Introduction
  { 
    name: "videoIntro", 
    type: "video", 
    defaultPrompt: "Finally, let's record a short video introduction! This helps venues get to know you. Share your passion for hospitality and what makes you great at your job." 
  }
];

/**
 * Special fields for re-asking or additional context
 * These use the same field names but with follow-up prompts
 */
export const specialFields: RequiredField[] = [
  { 
    name: "about", 
    type: "text", 
    rows: 3, 
    placeholder: "Any additional venue experience to add?", 
    defaultPrompt: "Is there anything else about your hospitality experience you'd like to add? Any special venues or events you've worked?" 
  },
  { 
    name: "skills", 
    type: "text", 
    rows: 2, 
    placeholder: "Any other hospitality skills?", 
    defaultPrompt: "Any additional hospitality skills you'd like to mention?" 
  },
  { 
    name: "location", 
    type: "location", 
    defaultPrompt: "Let's confirm your work location for finding nearby hospitality gigs." 
  },
  { 
    name: "availability", 
    type: "availability", 
    defaultPrompt: "Let's finalize when you're available for hospitality work." 
  }
];

/**
 * Field mapping configuration for hospitality-specific fields
 * Maps temporary field names to the actual database fields
 */
export const fieldMappings = {
  specificSkills: 'about',  // Append to about field
  workTraits: 'about'       // Append to about field
};

/**
 * Helper to determine if a field should be appended to 'about'
 */
export function shouldAppendToAbout(fieldName: string): boolean {
  return fieldName === 'specificSkills' || fieldName === 'workTraits';
}

/**
 * Parse experience from skills input
 * Extracts years of experience from inputs like "bartender with 6 years experience"
 */
export function parseExperienceFromSkills(input: string): { skill: string; experience?: string; years?: number } {
  const patterns = [
    /(.+?)\s+with\s+(\d+)\s+years?\s+(?:of\s+)?experience/i,
    /(.+?)\s+for\s+(\d+)\s+years?/i,
    /(\d+)\s+years?\s+(?:of\s+)?experience\s+(?:as\s+)?(.+)/i,
    /(.+?)\s*[-–]\s*(\d+)\s+years?/i
  ];
  
  for (const pattern of patterns) {
    const match = input.match(pattern);
    if (match) {
      const [, part1, part2] = match;
      const years = parseInt(part1) || parseInt(part2);
      const skill = (parseInt(part1) ? part2 : part1).trim();
      
      if (years && skill) {
        return {
          skill,
          experience: `${years} years`,
          years
        };
      }
    }
  }
  
  // No experience found, return just the skill
  return { skill: input.trim() };
}
