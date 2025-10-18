/**
 * hospitality-fields.ts
 * 
 * Configuration for the UK Hospitality 6-phase onboarding flow.
 * Defines the custom fields and their mapping to database schema.
 */

export type HospitalityField = {
  name: string;
  type: string;
  phase: number;
  phaseName: string;
  placeholder?: string;
  defaultPrompt: string;
  rows?: number;
  databaseField: string; // Maps to existing database field
  validation?: {
    required: boolean;
    minLength?: number;
    maxLength?: number;
  };
};

/**
 * The 6 phases of UK Hospitality onboarding
 */
export const hospitalityPhases = [
  {
    phase: 1,
    name: "Welcome/Initial Skill",
    description: "Welcome message and main skill collection"
  },
  {
    phase: 2,
    name: "Experience Deep Dive", 
    description: "Venue experience and atmosphere details"
  },
  {
    phase: 3,
    name: "Qualifications",
    description: "Certifications and professional qualifications"
  },
  {
    phase: 4,
    name: "Specific Skills & Languages",
    description: "Specialized skills and language abilities"
  },
  {
    phase: 5,
    name: "Personal Traits",
    description: "Work traits and personality characteristics"
  },
  {
    phase: 6,
    name: "Equipment",
    description: "Tools and equipment proficiency"
  }
];

/**
 * Custom hospitality fields for the 6-phase flow
 */
export const hospitalityFields: HospitalityField[] = [
  // Phase 1: Welcome/Initial Skill
  {
    name: "mainSkill",
    type: "text",
    phase: 1,
    phaseName: "Welcome/Initial Skill",
    placeholder: "e.g. 'I'm a bartender with 6 years experience'",
    defaultPrompt: "Welcome to Able AI! I'm your Gigfolio Coach. What's your main skill and how long have you been doing it?",
    rows: 2,
    databaseField: "skills", // Will be parsed into skills + experience
    validation: {
      required: true,
      minLength: 10,
      maxLength: 200
    }
  },

  // Phase 2: Experience Deep Dive
  {
    name: "venueExperience",
    type: "text",
    phase: 2,
    phaseName: "Experience Deep Dive",
    placeholder: "Describe the pubs, restaurants, hotels, festivals where you've worked...",
    defaultPrompt: "Where have you gained this experience? Tell me about the pubs, restaurants, hotels, festivals, etc. Describe the venues and atmosphere.",
    rows: 4,
    databaseField: "about", // Stored in bio/about field
    validation: {
      required: true,
      minLength: 20,
      maxLength: 500
    }
  },

  // Phase 3: Qualifications
  {
    name: "qualifications",
    type: "text",
    phase: 3,
    phaseName: "Qualifications",
    placeholder: "Food Hygiene Cert, Personal License, Hospitality degree, etc.",
    defaultPrompt: "Do you have any of these? Food Hygiene Certificate, Personal License, Hospitality-related degree, other certifications?",
    rows: 3,
    databaseField: "qualifications", // Direct mapping
    validation: {
      required: false, // Allow "none" responses
      maxLength: 300
    }
  },

  // Phase 4: Specific Skills & Languages
  {
    name: "specificSkills",
    type: "text",
    phase: 4,
    phaseName: "Specific Skills & Languages",
    placeholder: "e.g. wine knowledge, multi-lingual, technical skills, etc.",
    defaultPrompt: "What specific skills & languages set you apart? (e.g. wine knowledge, multi-lingual, technical skills, etc.)",
    rows: 3,
    databaseField: "skills", // Combined with main skills
    validation: {
      required: false,
      maxLength: 200
    }
  },

  // Phase 5: Personal Traits
  {
    name: "workTraits",
    type: "text",
    phase: 5,
    phaseName: "Personal Traits",
    placeholder: "e.g. calm under pressure, team player, customer-focused, creative (pick 3-4)",
    defaultPrompt: "What work traits describe you? (e.g. calm under pressure, team player, customer-focused, creative, etc. Pick 3–4.)",
    rows: 2,
    databaseField: "about", // Appended to bio/about
    validation: {
      required: true,
      minLength: 20,
      maxLength: 150
    }
  },

  // Phase 6: Equipment
  {
    name: "equipment",
    type: "text",
    phase: 6,
    phaseName: "Equipment",
    placeholder: "e.g. POS systems, bar tools, coffee machines, etc.",
    defaultPrompt: "What equipment/tools are you confident using, whether you own them or not? (e.g. POS systems, bar tools, etc.)",
    rows: 3,
    databaseField: "equipment", // Direct mapping
    validation: {
      required: false,
      maxLength: 200
    }
  }
];

/**
 * Standard fields that come after the 6 phases
 * These reuse existing components from onboarding-ai
 */
export const standardFields: HospitalityField[] = [
  {
    name: "location",
    type: "location",
    phase: 7,
    phaseName: "Location",
    defaultPrompt: "Where are you based? This helps us find gigs near you!",
    databaseField: "location",
    validation: { required: true }
  },
  {
    name: "availability",
    type: "availability",
    phase: 8,
    phaseName: "Availability",
    defaultPrompt: "When are you available to work? Let's set up your weekly schedule!",
    databaseField: "availability",
    validation: { required: true }
  },
  {
    name: "hourlyRate",
    type: "number",
    phase: 9,
    phaseName: "Hourly Rate",
    placeholder: "15",
    defaultPrompt: "What's your preferred hourly rate? Enter your rate in pounds (£).",
    databaseField: "hourlyRate",
    validation: { required: true }
  },
  {
    name: "videoIntro",
    type: "video",
    phase: 10,
    phaseName: "Video Introduction",
    defaultPrompt: "Record a short video introduction to help clients get to know you!",
    databaseField: "videoIntro",
    validation: { required: false }
  }
];

/**
 * Get field by name
 */
export function getHospitalityField(fieldName: string): HospitalityField | undefined {
  return [...hospitalityFields, ...standardFields].find(field => field.name === fieldName);
}

/**
 * Get all fields for a specific phase
 */
export function getFieldsForPhase(phase: number): HospitalityField[] {
  return [...hospitalityFields, ...standardFields].filter(field => field.phase === phase);
}

/**
 * Get the next field in the sequence
 */
export function getNextField(currentPhase: number): HospitalityField | undefined {
  const allFields = [...hospitalityFields, ...standardFields];
  return allFields.find(field => field.phase === currentPhase + 1);
}

/**
 * Check if all hospitality phases (1-6) are completed
 */
export function areHospitalityPhasesCompleted(formData: any): boolean {
  return hospitalityFields.every(field => {
    const value = formData[field.name];
    return field.validation?.required ? !!value : true;
  });
}

/**
 * Check if all fields are completed
 */
export function areAllFieldsCompleted(formData: any): boolean {
  return [...hospitalityFields, ...standardFields].every(field => {
    const value = formData[field.name];
    return field.validation?.required ? !!value : true;
  });
}

