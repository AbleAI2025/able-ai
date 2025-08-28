// Able AI Job Titles Taxonomy
// Standardized job titles for hospitality and events industry
// Based on hospitality and events skills taxonomy

import { Schema } from "@firebase/ai";
import { geminiAIAgent } from "@/lib/firebase/ai";

export interface JobTitle {
  id: string;
  title: string;
  category: string;
  synonyms: string[];
  description: string;
  skillLevel: 'entry' | 'intermediate' | 'senior' | 'expert';
  requiredSkills: string[];
  optionalSkills: string[];
}

export const HOSPITALITY_JOB_TITLES: JobTitle[] = [
  // Food & Beverage Service
  {
    id: 'cashier',
    title: 'Cashier',
    category: 'Food & Beverage Service',
    synonyms: ['cashier', 'till operator', 'point of sale operator', 'pos operator', 'checkout operator', 'sales assistant', 'retail assistant'],
    description: 'Handles customer transactions, processes payments, and provides customer service at point of sale',
    skillLevel: 'entry',
    requiredSkills: ['customer service', 'cash handling', 'basic math', 'communication'],
    optionalSkills: ['pos systems', 'inventory management', 'upselling']
  },
  {
    id: 'server',
    title: 'Server',
    category: 'Food & Beverage Service',
    synonyms: ['server', 'waiter', 'waitress', 'food server', 'dining room attendant', 'restaurant staff', 'food service worker'],
    description: 'Takes orders, serves food and beverages, and ensures customer satisfaction in dining establishments',
    skillLevel: 'entry',
    requiredSkills: ['customer service', 'food safety', 'communication', 'multitasking'],
    optionalSkills: ['wine knowledge', 'upselling', 'table service', 'pos systems']
  },
  {
    id: 'bartender',
    title: 'Bartender',
    category: 'Food & Beverage Service',
    synonyms: ['bartender', 'bar staff', 'mixologist', 'bar tender', 'cocktail maker', 'bar worker'],
    description: 'Prepares and serves alcoholic and non-alcoholic beverages, manages bar operations',
    skillLevel: 'intermediate',
    requiredSkills: ['alcohol knowledge', 'customer service', 'cash handling', 'food safety'],
    optionalSkills: ['cocktail making', 'wine knowledge', 'bar management', 'inventory control']
  },
  {
    id: 'barista',
    title: 'Barista',
    category: 'Food & Beverage Service',
    synonyms: ['barista', 'coffee maker', 'coffee barista', 'espresso maker', 'coffee server', 'cafe staff'],
    description: 'Prepares and serves coffee beverages, operates espresso machines, provides customer service',
    skillLevel: 'entry',
    requiredSkills: ['coffee knowledge', 'customer service', 'food safety', 'machine operation'],
    optionalSkills: ['latte art', 'coffee roasting', 'inventory management', 'upselling']
  },
  {
    id: 'kitchen_porter',
    title: 'Kitchen Porter',
    category: 'Food & Beverage Service',
    synonyms: ['kitchen porter', 'dishwasher', 'kitchen assistant', 'kitchen helper', 'dish washer', 'kitchen staff'],
    description: 'Maintains kitchen cleanliness, washes dishes, assists with food preparation',
    skillLevel: 'entry',
    requiredSkills: ['cleaning', 'food safety', 'teamwork', 'physical stamina'],
    optionalSkills: ['food preparation', 'kitchen equipment', 'inventory management']
  },
  {
    id: 'chef',
    title: 'Chef',
    category: 'Food & Beverage Service',
    synonyms: ['chef', 'cook', 'head chef', 'sous chef', 'line cook', 'kitchen chef', 'food preparer'],
    description: 'Prepares and cooks food, manages kitchen operations, creates menus',
    skillLevel: 'intermediate',
    requiredSkills: ['cooking skills', 'food safety', 'kitchen management', 'menu planning'],
    optionalSkills: ['culinary arts', 'food costing', 'staff training', 'inventory control']
  },
  {
    id: 'baker',
    title: 'Baker',
    category: 'Food & Beverage Service',
    synonyms: ['baker', 'cake maker', 'pastry chef', 'dessert maker', 'bread maker', 'patisserie', 'cake decorator', 'pastry baker'],
    description: 'Prepares and bakes bread, pastries, cakes, and other baked goods',
    skillLevel: 'intermediate',
    requiredSkills: ['baking skills', 'food safety', 'recipe following', 'attention to detail'],
    optionalSkills: ['cake decoration', 'pastry making', 'bread making', 'inventory management', 'food costing']
  },

  // Event Management
  {
    id: 'event_coordinator',
    title: 'Event Coordinator',
    category: 'Event Management',
    synonyms: ['event coordinator', 'event planner', 'event organizer', 'event manager', 'event staff', 'event assistant'],
    description: 'Plans, coordinates, and manages events, liaises with clients and vendors',
    skillLevel: 'intermediate',
    requiredSkills: ['event planning', 'project management', 'communication', 'organization'],
    optionalSkills: ['vendor management', 'budgeting', 'marketing', 'client relations']
  },
  {
    id: 'event_staff',
    title: 'Event Staff',
    category: 'Event Management',
    synonyms: ['event staff', 'event worker', 'event assistant', 'event helper', 'event crew', 'event team member'],
    description: 'Provides support during events, assists with setup, operations, and breakdown',
    skillLevel: 'entry',
    requiredSkills: ['customer service', 'teamwork', 'communication', 'physical stamina'],
    optionalSkills: ['event setup', 'customer assistance', 'problem solving', 'multitasking']
  },

  // Hospitality Management
  {
    id: 'receptionist',
    title: 'Receptionist',
    category: 'Hospitality Management',
    synonyms: ['receptionist', 'front desk', 'front office', 'reception', 'guest services', 'concierge', 'hotel staff'],
    description: 'Welcomes guests, handles check-ins/check-outs, provides information and assistance',
    skillLevel: 'entry',
    requiredSkills: ['customer service', 'communication', 'computer skills', 'organization'],
    optionalSkills: ['booking systems', 'multilingual', 'problem solving', 'upselling']
  },
  {
    id: 'housekeeper',
    title: 'Housekeeper',
    category: 'Hospitality Management',
    synonyms: ['housekeeper', 'room attendant', 'housekeeping', 'cleaner', 'maid', 'room cleaner', 'hotel cleaner'],
    description: 'Maintains cleanliness of rooms and public areas, ensures guest comfort',
    skillLevel: 'entry',
    requiredSkills: ['cleaning', 'attention to detail', 'physical stamina', 'time management'],
    optionalSkills: ['laundry service', 'inventory management', 'customer service', 'safety protocols']
  },

  // Security & Safety
  {
    id: 'security_guard',
    title: 'Security Guard',
    category: 'Security & Safety',
    synonyms: ['security guard', 'security officer', 'security staff', 'guard', 'security', 'safety officer'],
    description: 'Maintains security, monitors premises, responds to incidents, ensures safety',
    skillLevel: 'entry',
    requiredSkills: ['security awareness', 'communication', 'observation', 'emergency response'],
    optionalSkills: ['cctv operation', 'first aid', 'conflict resolution', 'report writing']
  },

  // Technical Support
  {
    id: 'audio_visual_technician',
    title: 'Audio Visual Technician',
    category: 'Technical Support',
    synonyms: ['audio visual technician', 'av technician', 'sound technician', 'lighting technician', 'technical support', 'av staff'],
    description: 'Sets up and operates audio, visual, and lighting equipment for events',
    skillLevel: 'intermediate',
    requiredSkills: ['av equipment', 'technical troubleshooting', 'setup and teardown', 'communication'],
    optionalSkills: ['sound mixing', 'lighting design', 'video production', 'equipment maintenance']
  }
];

export const EVENT_JOB_TITLES: JobTitle[] = [
  // Event Production
  {
    id: 'stage_hand',
    title: 'Stage Hand',
    category: 'Event Production',
    synonyms: ['stage hand', 'stage crew', 'backstage worker', 'stage worker', 'production assistant', 'stage staff'],
    description: 'Assists with stage setup, equipment handling, and production support',
    skillLevel: 'entry',
    requiredSkills: ['physical stamina', 'teamwork', 'safety awareness', 'equipment handling'],
    optionalSkills: ['rigging', 'lighting', 'sound', 'stage management']
  },
  {
    id: 'production_assistant',
    title: 'Production Assistant',
    category: 'Event Production',
    synonyms: ['production assistant', 'pa', 'production staff', 'event assistant', 'production helper'],
    description: 'Supports production team, assists with logistics, coordinates activities',
    skillLevel: 'entry',
    requiredSkills: ['organization', 'communication', 'multitasking', 'problem solving'],
    optionalSkills: ['scheduling', 'vendor coordination', 'documentation', 'logistics']
  }
];

// Combined job titles for easy access
export const ALL_JOB_TITLES: JobTitle[] = [
  ...HOSPITALITY_JOB_TITLES,
  ...EVENT_JOB_TITLES
];

// Job title categories for organization
export const JOB_CATEGORIES = {
  'Food & Beverage Service': HOSPITALITY_JOB_TITLES.filter(job => job.category === 'Food & Beverage Service'),
  'Event Management': EVENT_JOB_TITLES.filter(job => job.category === 'Event Management'),
  'Hospitality Management': HOSPITALITY_JOB_TITLES.filter(job => job.category === 'Hospitality Management'),
  'Security & Safety': HOSPITALITY_JOB_TITLES.filter(job => job.category === 'Security & Safety'),
  'Technical Support': HOSPITALITY_JOB_TITLES.filter(job => job.category === 'Technical Support'),
  'Event Production': EVENT_JOB_TITLES.filter(job => job.category === 'Event Production')
};

// Semantic matching function to find closest job title
export function findClosestJobTitle(userInput: string): { jobTitle: JobTitle; confidence: number; matchedTerms: string[] } | null {
  const normalizedInput = userInput.toLowerCase().trim();
  
  let bestMatch: JobTitle | null = null;
  let highestConfidence = 0;
  let matchedTerms: string[] = [];

  for (const jobTitle of ALL_JOB_TITLES) {
    let confidence = 0;
    const currentMatchedTerms: string[] = [];

    // Check exact title match
    if (normalizedInput.includes(jobTitle.title.toLowerCase())) {
      confidence += 100;
      currentMatchedTerms.push(jobTitle.title);
    }

    // Check synonyms
    for (const synonym of jobTitle.synonyms) {
      if (normalizedInput.includes(synonym.toLowerCase())) {
        confidence += 80;
        currentMatchedTerms.push(synonym);
      }
    }

    // Check category relevance
    if (normalizedInput.includes(jobTitle.category.toLowerCase().replace(' & ', ' '))) {
      confidence += 30;
    }

    // Check required skills relevance
    for (const skill of jobTitle.requiredSkills) {
      if (normalizedInput.includes(skill.toLowerCase())) {
        confidence += 20;
        currentMatchedTerms.push(skill);
      }
    }

    // Check description relevance
    const descriptionWords = jobTitle.description.toLowerCase().split(' ');
    for (const word of descriptionWords) {
      if (word.length > 3 && normalizedInput.includes(word)) {
        confidence += 5;
      }
    }

    // Update best match if confidence is higher
    if (confidence > highestConfidence) {
      highestConfidence = confidence;
      bestMatch = jobTitle;
      matchedTerms = [...new Set(currentMatchedTerms)]; // Remove duplicates
    }
  }

  // Only return matches with reasonable confidence
  if (bestMatch && highestConfidence >= 30) {
    return {
      jobTitle: bestMatch,
      confidence: Math.min(highestConfidence, 100), // Cap at 100%
      matchedTerms
    };
  }

  return null;
}

// Function to get job titles by category
export function getJobTitlesByCategory(category: string): JobTitle[] {
  return ALL_JOB_TITLES.filter(job => job.category === category);
}

// Function to get job titles by skill level
export function getJobTitlesBySkillLevel(level: 'entry' | 'intermediate' | 'senior' | 'expert'): JobTitle[] {
  return ALL_JOB_TITLES.filter(job => job.skillLevel === level);
}

// Function to search job titles by keyword
export function searchJobTitles(keyword: string): JobTitle[] {
  const normalizedKeyword = keyword.toLowerCase();
  return ALL_JOB_TITLES.filter(job => 
    job.title.toLowerCase().includes(normalizedKeyword) ||
    job.synonyms.some(synonym => synonym.toLowerCase().includes(normalizedKeyword)) ||
    job.description.toLowerCase().includes(normalizedKeyword) ||
    job.requiredSkills.some(skill => skill.toLowerCase().includes(normalizedKeyword))
  );
}

// Enhanced function with AI fallback for job titles outside taxonomy
export async function findStandardizedJobTitleWithAIFallback(
  userInput: string, 
  ai: any
): Promise<{ jobTitle: JobTitle; confidence: number; matchedTerms: string[]; isAISuggested: boolean } | null> {
  // First, try to find a match in our existing taxonomy
  const existingMatch = findClosestJobTitle(userInput);
  
  // If we found a good match (confidence >= 30), return it
  if (existingMatch && existingMatch.confidence >= 30) {
    return {
      ...existingMatch,
      isAISuggested: false
    };
  }
  
  // If no good match found and AI is available, use AI to suggest a standardized title
  if (ai) {
    try {
      const aiPrompt = `You are a job title standardization assistant for a hospitality and events platform. 

The user provided this job title/description: "${userInput}"

Available standardized job titles in our taxonomy:
${ALL_JOB_TITLES.map(job => `- ${job.title} (${job.category}): ${job.description}`).join('\n')}

Your task is to provide a standardized job title for the user's input. 

Rules:
1. FIRST, check if the user's input matches any existing job title in our taxonomy above
2. If there's a good match in our taxonomy, return that existing title
3. If the user's input is completely outside our taxonomy (e.g., "computer fixer", "plumber", "web developer"), create a NEW, appropriate standardized job title
4. For new titles, follow these guidelines:
   - Use professional, industry-standard terminology
   - Make it clear and descriptive
   - Consider the context of a hospitality/events platform
   - Examples: "Computer Technician" for "computer fixer", "Plumber" for "plumber", "Web Developer" for "web developer"
5. Return confidence as a number between 0-100
6. Include matched terms as a comma-separated string (or relevant keywords for new titles)
7. Provide reasoning for your choice

Please analyze the user's input and provide either an existing standardized job title or create a new appropriate one.`;

      const result = await geminiAIAgent(
        "gemini-2.0-flash",
        {
          prompt: aiPrompt,
          responseSchema: Schema.object({
            properties: {
              jobTitle: Schema.string(),
              confidence: Schema.number(),
              matchedTerms: Schema.string(),
              reasoning: Schema.string(),
              isNewTitle: Schema.boolean(),
            },
          }),
          isStream: false,
        },
        ai
      );

      if (result.ok && result.data) {
        const data = result.data as Record<string, any>;
        const suggestedTitle = data.jobTitle as string;
        const confidence = data.confidence as number;
        const matchedTerms = data.matchedTerms as string;
        const isNewTitle = data.isNewTitle as boolean;
        
        // Parse matchedTerms from string (comma-separated)
        const matchedTermsArray = matchedTerms ? matchedTerms.split(',').map((term: string) => term.trim()) : [];
        
        if (isNewTitle) {
          // Create a new JobTitle object for titles outside our taxonomy
          const newJobTitle: JobTitle = {
            id: `ai_generated_${Date.now()}`,
            title: suggestedTitle,
            category: 'Other Services',
            description: `AI-generated standardized title for: ${userInput}`,
            synonyms: [userInput.toLowerCase()],
            requiredSkills: matchedTermsArray,
            optionalSkills: [],
            skillLevel: 'intermediate'
          };
          
          return {
            jobTitle: newJobTitle,
            confidence: Math.min(confidence, 100),
            matchedTerms: matchedTermsArray,
            isAISuggested: true
          };
        } else {
          // Validate that the AI suggested job title exists in our taxonomy
          const validatedJobTitle = ALL_JOB_TITLES.find(job => 
            job.title.toLowerCase() === suggestedTitle.toLowerCase()
          );
          
          if (validatedJobTitle) {
            return {
              jobTitle: validatedJobTitle,
              confidence: Math.min(confidence, 100),
              matchedTerms: matchedTermsArray,
              isAISuggested: true
            };
          }
        }
      }
    } catch (error) {
      console.error('AI job title standardization failed:', error);
    }
  }
  
  // If AI failed or is not available, return the existing match (if any) or null
  return existingMatch ? {
    ...existingMatch,
    isAISuggested: false
  } : null;
}

// Export default for easy importing
export default {
  HOSPITALITY_JOB_TITLES,
  EVENT_JOB_TITLES,
  ALL_JOB_TITLES,
  JOB_CATEGORIES,
  findClosestJobTitle,
  findStandardizedJobTitleWithAIFallback,
  getJobTitlesByCategory,
  getJobTitlesBySkillLevel,
  searchJobTitles
};
