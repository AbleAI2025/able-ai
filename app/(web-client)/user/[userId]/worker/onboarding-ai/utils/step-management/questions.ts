/**
 * questions.ts
 * 
 * Configuration file that defines the onboarding flow structure and field requirements.
 * This file contains the field definitions, prompts, and validation rules for the
 * AI-powered onboarding process.
 * 
 * The onboarding flow follows this order:
 * 1. Bio/About - Personal introduction and background
 * 2. Skills - Specific skills that serve as job title
 * 3. Experience - Years of experience in the field
 * 4. Qualifications - Certifications and qualifications
 * 5. Location - Geographic location for gig matching
 * 6. Availability - Weekly schedule and availability
 * 7. Additional fields - Equipment, rates, video, references
 */

/**
 * Type definition for required fields in the onboarding flow
 */
export type RequiredField = {
  name: string;           // Field identifier
  type: string;           // Field type (text, location, availability, video, etc.)
  placeholder?: string;   // Placeholder text for input fields
  defaultPrompt: string;  // AI prompt for this field
  rows?: number;         // Number of rows for textarea fields
};

/**
 * Main required fields for the onboarding flow
 * These fields are processed in order and are essential for creating a complete profile
 */
export const requiredFields: RequiredField[] = [
  // 1) Bio/About - Personal introduction and professional background
  { name: "about", type: "text", placeholder: "Tell us about yourself and your background...", defaultPrompt: "Tell me about yourself! Share your story, what drives you, and what makes you unique as a professional.", rows: 3 },
  
  // 2) Skills - Professional skills (matching manual form)
  { name: "skills", type: "text", placeholder: "List your professional skills...", defaultPrompt: "What professional skills do you have? List your key skills and areas of expertise.", rows: 3 },
  
  // 3) Years of Experience - Professional experience level (matching manual form format)
  { name: "experience", type: "text", placeholder: "How many years of experience do you have? (e.g., '5', '5 years', '2.5 years', '5 years and 3 months')", defaultPrompt: "How many years of experience do you have? You can enter a number (like '5' or '3 years') or a level (like 'beginner', 'intermediate', or 'senior').", rows: 1 },
  
  // 4) Qualifications - Certifications and professional qualifications (matching manual form)
  { name: "qualifications", type: "text", placeholder: "List your qualifications, certifications, degrees, licenses, etc...", defaultPrompt: "What qualifications and certifications do you have? List your degrees, licenses, certifications, or any professional qualifications.", rows: 3 },
  
  // 5) Location - Geographic location for gig matching
  { name: "location", type: "location", defaultPrompt: "Where are you based? This helps us find gigs near you!" },
  
  // 6) Availability - Weekly schedule and availability patterns
  { name: "availability", type: "availability", defaultPrompt: "When are you available to work? Let's set up your weekly schedule!" },
  
  // Additional fields for enhanced profile completeness (matching manual form)
  { name: "equipment", type: "text", placeholder: "List any equipment you have that you can use for your work...", defaultPrompt: "What equipment do you have that you can use for your work? List any tools, machinery, or equipment you own.", rows: 3 },
  { name: "hourlyRate", type: "number", placeholder: "15", defaultPrompt: "What's your preferred hourly rate? Enter your rate in pounds (£)." },
  { name: "videoIntro", type: "video", defaultPrompt: "Record a short video introduction to help clients get to know you!" },
];

/**
 * Special fields that require custom handling
 * These fields have unique UI components or special processing logic
 */
export const specialFields: RequiredField[] = [
  { name: "about", type: "text", defaultPrompt: "Tell me about yourself! Share your story, what drives you, and what makes you unique as a professional.", placeholder: "Tell us about yourself and your background...", rows: 3 },
  { name: "location", type: "location", defaultPrompt: "Where are you based? This helps us find gigs near you!" },
  { name: "availability", type: "availability", defaultPrompt: "When are you available to work? Let's set up your weekly schedule!" },
  { name: "skills", type: "text", defaultPrompt: "What professional skills do you have? List your key skills and areas of expertise.", placeholder: "List your professional skills...", rows: 3 },
];


