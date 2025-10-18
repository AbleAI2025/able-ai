/**
 * hospitality-questions.ts
 * Hospitality prompts mapped to the existing onboarding engine field names
 */

export type RequiredField = {
  name: string;
  type: string;
  placeholder?: string;
  defaultPrompt: string;
  rows?: number;
};

// Required fields in the same order the engine expects
export const requiredFields: RequiredField[] = [
  { name: "about", type: "text", rows: 3, placeholder: "Tell us about your hospitality background...", defaultPrompt: "Let's build a strong UK hospitality bio. Briefly tell me about your background, the kind of venues you've worked in (pubs, restaurants, hotels, festivals), and what you enjoy most about the work." },
  { name: "skills", type: "text", rows: 2, placeholder: "e.g. bartender, chef, barista", defaultPrompt: "What's your main hospitality skill? You can also include how long you've been doing it (e.g., 'I'm a bartender with 6 years experience')." },
  { name: "experience", type: "text", rows: 1, placeholder: "years or level", defaultPrompt: "Roughly how many years experience do you have (or your level: beginner/intermediate/senior)?" },
  { name: "qualifications", type: "text", rows: 3, placeholder: "Food Hygiene, Personal License, hospitality degree...", defaultPrompt: "Do you have any of these? Food Hygiene Certificate, Personal License, hospitality-related degree, first aid, allergen awareness, etc. (You can say 'none')." },
  { name: "location", type: "location", defaultPrompt: "Where are you based for work? This helps us find gigs near you." },
  { name: "availability", type: "availability", defaultPrompt: "When are you available to work? Let's set up your weekly schedule." },
  { name: "equipment", type: "text", rows: 2, placeholder: "POS, bar tools, coffee machines, etc.", defaultPrompt: "What equipment/tools are you confident using (POS systems, bar tools, coffee machines, kitchen equipment, etc.)?" },
  { name: "hourlyRate", type: "number", placeholder: "15", defaultPrompt: "What's your preferred hourly rate in pounds (£)?" },
  { name: "videoIntro", type: "video", defaultPrompt: "Record a short video introduction to help clients get to know you." }
];

// Special fields reused by the engine
export const specialFields: RequiredField[] = [
  { name: "about", type: "text", rows: 3, placeholder: "Tell us about your hospitality background...", defaultPrompt: "Quick check on your hospitality bio—anything you'd like to add about venues or customer service?" },
  { name: "location", type: "location", defaultPrompt: "Where are you based for work?" },
  { name: "availability", type: "availability", defaultPrompt: "When are you available to work?" },
  { name: "skills", type: "text", rows: 2, placeholder: "e.g. bartender, chef, barista", defaultPrompt: "Any additional hospitality skills you'd like to add?" }
];


