"use client";

import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

import ChatBotLayout from "@/app/components/onboarding/ChatBotLayout";
import MessageBubble from "@/app/components/onboarding/MessageBubble";
import CalendarPickerBubble from "@/app/components/onboarding/CalendarPickerBubble";
import VideoRecorderOnboarding from "@/app/components/onboarding/VideoRecorderOnboarding";
import LocationPickerBubble from '@/app/components/onboarding/LocationPickerBubble';
import ShareLinkBubble from "@/app/components/onboarding/ShareLinkBubble";
import SanitizedConfirmationBubble from "@/app/components/onboarding/SanitizedConfirmationBubble";
import SetupChoiceModal from "@/app/components/onboarding/SetupChoiceModal";
import ManualProfileForm, { validateWorkerProfileData } from "@/app/components/onboarding/ManualProfileForm";
import Loader from "@/app/components/shared/Loader";

// Typing indicator component with bouncing animation
const TypingIndicator: React.FC = () => (
  <div style={{ 
    display: 'flex', 
    alignItems: 'center', 
    padding: '8px 12px', 
    color: 'var(--primary-color)', 
    fontWeight: 600,
    animation: 'slideIn 0.3s ease-out',
    opacity: 0,
    animationFillMode: 'forwards',
    background: 'rgba(37, 99, 235, 0.1)',
    borderRadius: '20px',
    border: '1px solid rgba(37, 99, 235, 0.2)',
    marginLeft: '8px'
  }}>
    <span className="typing-dot" style={{ 
      animation: 'typingBounce 1.4s infinite ease-in-out',
      fontSize: '16px',
      lineHeight: '1'
    }}>●</span>
    <span className="typing-dot" style={{ 
      animation: 'typingBounce 1.4s infinite ease-in-out 0.2s',
      fontSize: '16px',
      lineHeight: '1'
    }}>●</span>
    <span className="typing-dot" style={{ 
      animation: 'typingBounce 1.4s infinite ease-in-out 0.4s',
      fontSize: '16px',
      lineHeight: '1'
    }}>●</span>
    <style>{`
      @keyframes slideIn {
        from {
          opacity: 0;
          transform: translateY(10px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
      @keyframes typingBounce {
        0%, 60%, 100% {
          transform: translateY(0);
          opacity: 0.4;
        }
        30% {
          transform: translateY(-8px);
          opacity: 1;
        }
      }
    `}</style>
  </div>
);

TypingIndicator.displayName = 'TypingIndicator';

import pageStyles from "./OnboardingAIPage.module.css";
import { useAuth } from "@/context/AuthContext";
import { useFirebase } from '@/context/FirebaseContext';
import { geminiAIAgent } from '@/lib/firebase/ai';
import { Schema } from '@firebase/ai';
import { FormInputType } from "@/app/types/form";
import { createEscalatedIssueClient } from '@/utils/client-escalation';
import { detectEscalationTriggers, generateEscalationDescription } from '@/utils/escalation-detection';
import { detectIncident } from '@/lib/incident-detection';

// Type assertion for Schema to resolve TypeScript errors
const TypedSchema = Schema as any;

// Import new ChatAI system
import {
  buildContextPrompt,
  buildRolePrompt,
  buildSpecializedPrompt,
  CONTEXT_PROMPTS,
  SPECIALIZED_PROMPTS,
  ROLE_SPECIFIC_PROMPTS,
  GIGFOLIO_COACH_CONTENT,
  GIGFOLIO_COACH_BEHAVIOR,
  ONBOARDING_STEPS,
  COACHING_TECHNIQUES
} from '@/app/components/shared/ChatAI';

import {
  findClosestJobTitle,
  findStandardizedJobTitleWithAIFallback,
  ALL_JOB_TITLES
} from '@/app/components/shared/ChatAI';

import {
  getStorage,
  ref as storageRef,
  uploadBytesResumable,
  getDownloadURL,
} from "firebase/storage";
import { firebaseApp } from "@/lib/firebase/clientApp";
import { updateVideoUrlProfileAction, saveWorkerProfileFromOnboardingAction, createWorkerProfileAction } from "@/actions/user/gig-worker-profile";
import { VALIDATION_CONSTANTS } from "@/app/constants/validation";
import { parseExperienceToNumeric } from "@/lib/utils/experienceParsing";

// AI Video Script Generation Function (from onboarding-ai)
async function generateAIVideoScript(formData: FormData, ai: any): Promise<string> {
  try {
    if (!ai) {
      // Fallback to basic script if AI is not available
      return `Hi my name is [Name] I am a [job title]. I love [skills] and bring a sense of fun to every shift. I trained at [experience] and my favourite [skill] is [specific skill]. I am great with [strengths] - i hope we can work together`;
    }

    // Build structured prompt using ChatAI components
    const rolePrompt = buildRolePrompt('gigfolioCoach', 'portfolioGuidance', 'Create a personalized video introduction script');
    const contextPrompt = buildContextPrompt('onboarding', 'Profile creation for video introduction');
    const specializedPrompt = buildSpecializedPrompt('profileCreation', 'Video introduction script creation', 'Generate a 30-second video script');
    
    const scriptPrompt = `${rolePrompt}

${contextPrompt}

${specializedPrompt}

Based on the following form data, create a personalized 30-second video introduction script that includes:
- Their first name (if available)
- Their job title/role (inferred from skills/experience)
- Their key skills and strengths
- Their experience background
- Their personality/approach to work
- A natural closing

Form Data:
${JSON.stringify(formData, null, 2)}

Rules:
1. Keep it around 30 seconds when spoken (about 2-3 sentences)
2. Be conversational and natural - like how someone would actually speak
3. Infer job titles from skills/experience if not explicitly stated
4. Include specific details from their profile
5. Make it sound enthusiastic and professional
6. Use their actual name if provided
7. Reference their specific skills and experience
8. End with a positive note about working together
9. Make it sound authentic and personal

Example format:
"Hi my name is [Name] I am a [job title]. I love [skills] and bring a sense of fun to every shift. I trained at [experience] and my favourite [skill] is [specific skill]. I am great with [strengths] - i hope we can work together"

Create a natural, engaging script that showcases their unique profile.`;

    const result = await geminiAIAgent(
      "gemini-2.0-flash",
      {
        prompt: scriptPrompt,
        responseSchema: TypedSchema.object({
          properties: {
            script: TypedSchema.string(),
          },
        }),
        isStream: false,
      },
      ai,
      "gemini-2.5-flash-preview-05-20"
    );

    if (result.ok && result.data) {
      const data = result.data as { script: string };
      let script = data.script;
      
      // Replace placeholders with actual values from formData
      if (formData.firstName) {
        script = script.replace(/\[Name\]/gi, formData.firstName);
        script = script.replace(/\[name\]/gi, formData.firstName);
      }
      if (formData.location && typeof formData.location === 'string') {
        script = script.replace(/\[location\]/gi, formData.location);
        script = script.replace(/\[Location\]/gi, formData.location);
      }
      if (formData.jobTitle) {
        script = script.replace(/\[job title\]/gi, formData.jobTitle);
        script = script.replace(/\[Job title\]/gi, formData.jobTitle);
      }
      if (formData.skills) {
        script = script.replace(/\[skills\]/gi, formData.skills);
        script = script.replace(/\[Skills\]/gi, formData.skills);
      }
      if (formData.experience) {
        script = script.replace(/\[experience\]/gi, formData.experience);
        script = script.replace(/\[Experience\]/gi, formData.experience);
      }
      
      return script;
    }
  } catch (error) {
    console.error('AI video script generation failed:', error);
  }
  
  // Fallback to basic script
  return `Hi my name is [Name] I am a [job title]. I love [skills] and bring a sense of fun to every shift. I trained at [experience] and my favourite [skill] is [specific skill]. I am great with [strengths] - i hope we can work together`;
}

// Helper function to check if user already has location and availability data
const hasExistingLocationAndAvailability = (formData: any): boolean => {
  return !!(formData.location && formData.availability);
};

// Helper function to get next phase, skipping location/availability if user already has them
const getNextPhase = (currentPhase: OnboardingPhase, formData: any): OnboardingPhase | null => {
  const phaseOrder = [
    OnboardingPhase.INITIAL_SKILL,
    OnboardingPhase.EXPERIENCE_DEEP_DIVE,
    OnboardingPhase.QUALIFICATIONS,
    OnboardingPhase.SPECIFIC_SKILLS_AND_LANGUAGES,
    OnboardingPhase.PERSONAL_TRAITS,
    OnboardingPhase.EQUIPMENT,
    OnboardingPhase.LOCATION,
    OnboardingPhase.AVAILABILITY,
    OnboardingPhase.REFERENCES,
    OnboardingPhase.VIDEO_BIO_GENERATION
  ];

  const currentIndex = phaseOrder.indexOf(currentPhase);
  if (currentIndex === -1) return null;

  // Check if user already has location and availability data
  const hasLocationAndAvailability = hasExistingLocationAndAvailability(formData);

  // If user has location and availability, skip those phases
  if (hasLocationAndAvailability) {
    if (currentPhase === OnboardingPhase.EQUIPMENT) {
      return OnboardingPhase.REFERENCES; // Skip location and availability
    }
  }

  // Normal flow
  return phaseOrder[currentIndex + 1] || null;
};

// AI Context-Aware Prompt Generation Function (from onboarding-ai)
async function generateContextAwarePrompt(fieldName: string, aboutInfo: string, ai: any): Promise<string> {
  if (!fieldName || !ai) {
    console.error('Missing required parameters for prompt generation');
    return buildSpecializedPrompt('profileCreation', `Field: ${fieldName}`, `Tell me more about your ${fieldName}`);
  }

  try {
    const promptSchema = TypedSchema.object({
      properties: {
        prompt: TypedSchema.string(),
      },
    });

    // Build specialized prompt using ChatAI system
    const basePrompt = buildRolePrompt('gigfolioCoach', 'Profile Creation', `Generate a friendly, contextual prompt for the next question about: ${fieldName}. You MUST follow the field-specific guidance exactly and not deviate from it.`);
    
    // Add field-specific context
    const fieldContext = `Generate a friendly prompt for the next onboarding question.

Context: User said "${aboutInfo || 'Not provided'}" about themselves.
Next field: "${fieldName}"

RULES FOR EACH FIELD:
- experience: Ask ONLY about years of experience. Example: "How many years have you been working as a [job title]?"
- skills: Ask about skills and certifications
- hourlyRate: Ask about hourly rate in British Pounds (£)
- location: Ask about their location for finding gigs
- availability: Ask about when they're available to work
- videoIntro: Ask about recording a video introduction
- references: Ask about references or testimonials

IMPORTANT: For "experience" field, ask ONLY about years of experience, NOT specific work experiences or roles.

Make it conversational and engaging with emojis.`;

    const fullPrompt = `${basePrompt}\n\n${fieldContext}`;

    const result = await geminiAIAgent(
      "gemini-2.0-flash",
      {
        prompt: fullPrompt,
        responseSchema: promptSchema,
        isStream: false,
      },
      ai,
      "gemini-2.5-flash-preview-05-20"
    );

    console.log('AI prompt generation result:', { fieldName, result });

    if (result.ok && result.data) {
      const data = result.data as { prompt: string };
      console.log('AI prompt data:', data);
      return data.prompt || buildSpecializedPrompt('profileCreation', `Field: ${fieldName}`, `Tell me more about your ${fieldName}`);
    } else {
      console.log('AI prompt generation failed - result not ok or no data:', result);
    }
  } catch (error) {
    console.error('AI prompt generation failed:', error);
  }
  
  // Fallback using ChatAI system with field-specific prompts
  if (fieldName === 'experience') {
    return `Great! Now, how many years have you been working as a ${aboutInfo ? aboutInfo.toLowerCase() : 'professional'}? 🕒`;
  } else if (fieldName === 'skills') {
    return `Awesome! What skills and certifications do you have that you can offer to clients? 🛠️`;
  } else if (fieldName === 'hourlyRate') {
    return `Perfect! What's your preferred hourly rate in British Pounds (£)? 💰`;
  } else if (fieldName === 'location') {
    return `Excellent! Where are you based? This helps us find gig opportunities near you! 📍`;
  } else if (fieldName === 'availability') {
    return `Great! When are you available to work? Let's set up your weekly schedule! 📅`;
  } else if (fieldName === 'videoIntro') {
    return `Fantastic! Ready to record a short video introduction to help clients get to know you? 🎥`;
  } else if (fieldName === 'references') {
    return `Wonderful! Do you have any references or testimonials from previous clients or employers? ⭐`;
  }
  
  return buildSpecializedPrompt('profileCreation', `Field: ${fieldName}`, `Tell me more about your ${fieldName}`);
}

// Hashtag Generation Function (from onboarding-ai)
const generateHashtags = async (profileData: any, ai: any): Promise<string[]> => {
  try {
    if (!ai) {
      throw new Error('AI not available');
    }

    const prompt = `Generate exactly 3 professional hashtags for this gig worker profile:

About: ${profileData.about || 'Not provided'}
Skills: ${profileData.skills || 'Not provided'}
Experience: ${profileData.experience || 'Not provided'}

Return 3 relevant hashtags like "#bartender", "#mixology", "#events" for hospitality/gig work.`;

    const schema = TypedSchema.object({
      properties: {
        hashtags: TypedSchema.array({
          items: TypedSchema.string()
        })
      },
      required: ["hashtags"]
    });

    const result = await geminiAIAgent(
      "gemini-2.0-flash",
      { prompt, responseSchema: schema },
      ai,
      "gemini-2.5-flash-preview-05-20"
    );

    if (result.ok && result.data) {
      const hashtags = (result.data as { hashtags: string[] }).hashtags;
      return hashtags;
    } else {
      throw new Error('AI generation failed');
    }
  } catch (error) {
    console.error('❌ Error generating hashtags:', error);
    const fallbackHashtags = [
      `#${profileData.skills?.split(',')[0]?.trim().toLowerCase().replace(/\s+/g, '-') || 'worker'}`,
      '#professional',
      '#gig-worker'
    ];
    return fallbackHashtags;
  }
};

// AI Video Script Display Component (from onboarding-ai)
const AIVideoScriptDisplay = ({ formData, ai }: { formData: FormData, ai: any }) => {
  const [script, setScript] = useState<string>('Generating your personalized script...');
  const [isGenerating, setIsGenerating] = useState(true);

  useEffect(() => {
    const generateScript = async () => {
      try {
        setIsGenerating(true);
        const aiScript = await generateAIVideoScript(formData, ai);
        setScript(aiScript);
      } catch (error) {
        setScript('Hi my name is [Name] I am a [job title]. I love [skills] and bring a sense of fun to every shift. I trained at [experience] and my favourite [skill] is [specific skill]. I am great with [strengths] - i hope we can work together');
      } finally {
        setIsGenerating(false);
      }
    };
    generateScript();
  }, [formData, ai]);

  return (
    <div style={{
      background: '#1a1a1a',
      border: '1px solid #333',
      borderRadius: '12px',
      padding: '20px',
      marginBottom: '16px'
    }}>
      <div style={{
        color: 'var(--primary-color)',
        fontWeight: 600,
        fontSize: '16px',
        marginBottom: '12px'
      }}>
        🎬 AI-Generated Video Script
      </div>
      <div style={{
        color: '#e5e5e5',
        fontSize: '15px',
        lineHeight: '1.6',
        fontStyle: 'italic',
        background: '#2a2a2a',
        padding: '16px',
        borderRadius: '8px',
        border: '1px solid #444'
      }}>
        {isGenerating ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '16px', height: '16px', border: '2px solid #666', borderTop: '2px solid var(--primary-color)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
            {script}
          </div>
        ) : (
          script
        )}
      </div>
      <div style={{
        color: '#888',
        fontSize: '13px',
        marginTop: '12px',
        fontStyle: 'italic'
      }}>
        💡 This script is personalized based on your profile. Feel free to modify it or use it as inspiration!
      </div>
    </div>
  );
};

// 6-Phase Onboarding Flow from MD document
enum OnboardingPhase {
  INITIAL_SKILL = "initial_skill",
  EXPERIENCE_DEEP_DIVE = "experience_deep_dive", 
  QUALIFICATIONS = "qualifications",
  SPECIFIC_SKILLS_AND_LANGUAGES = "specific_skills_and_languages",
  PERSONAL_TRAITS = "personal_traits",
  EQUIPMENT = "equipment",
  LOCATION = "location",
  AVAILABILITY = "availability",
  REFERENCES = "references",
  VIDEO_BIO_GENERATION = "video_bio_generation"
}

// 46 Job Title Standardization from MD document
const JOB_TITLE_MAPPINGS = {
  // Food & Beverage Service (9 roles)
  "Waitstaff": ["waiter", "waitress", "server", "waiting staff", "wait staff", "food server", "table service", "front of house", "service staff"],
  "Bartender": ["bar tender", "bar staff", "barman", "barmaid", "bar person", "mixologist", "cocktail bartender"],
  "Barback": ["bar support", "bar assistant", "bar porter", "bar runner"],
  "Barista": ["coffee specialist", "coffee maker", "barrista", "coffee barista"],
  "Mixologist": ["cocktail specialist", "craft bartender", "cocktail creator"],
  "Host": ["hostess", "guest greeter", "maitre d", "maître d'", "front desk", "restaurant host", "greeting staff"],
  "Runner": ["food runner", "drink runner", "service runner", "kitchen runner"],
  "Food Runner": ["server assistant", "service support", "food expeditor"],
  
  // Kitchen Staff (8 roles)
  "Head Chef": ["executive chef", "chef de cuisine", "kitchen manager", "head cook", "chief chef"],
  "Sous Chef": ["deputy chef", "second chef", "assistant head chef", "deputy kitchen manager"],
  "Chef de Partie": ["station chef", "line cook", "section chef", "chef de station"],
  "Commis Chef": ["junior chef", "apprentice chef", "trainee chef", "assistant chef"],
  "Kitchen Porter": ["dishwasher", "kitchen assistant", "kp", "pot wash", "kitchen helper", "dish pit"],
  "Kitchen Assistant": ["prep cook", "food prep", "kitchen help", "preparation assistant"],
  "Catering Assistant": ["food service assistant", "catering staff", "catering help", "buffet assistant"],
  
  // Event Staff (5 roles)
  "Event Staff": ["event crew", "event assistant", "event helper", "event support", "general event staff"],
  "Event Steward": ["usher", "crowd control", "event guide", "festival staff", "venue steward"],
  "Security": ["door supervisor", "sia licensed security", "bouncer", "doorman", "door staff", "security guard"],
  "Brand Ambassador": ["promo staff", "promotional staff", "brand rep", "brand representative", "product demonstrator"],
  "AV Technician": ["stage crew", "av operator", "sound tech", "lighting tech", "audio visual technician", "technical crew"],
  
  // Cleaning & Housekeeping (3 roles)
  "Cleaner": ["janitorial staff", "cleaning staff", "janitor", "cleaner", "sanitation worker", "hygiene assistant"],
  "Housekeeper": ["room attendant", "housekeeping staff", "chambermaid", "hotel cleaner", "domestic staff"],
  "Cloakroom Attendant": ["coat check", "wardrobe attendant", "cloakroom staff", "garment attendant"],
  
  // Reception & Guest Services (2 roles)
  "Receptionist": ["front desk agent", "reception staff", "desk clerk", "front office", "guest services"],
  "Concierge": ["guest services", "hotel concierge", "customer service agent", "guest relations"],
  
  // Management Roles (7 roles)
  "Event Manager": ["event coordinator", "event organizer", "event planner", "function coordinator"],
  "Catering Manager": ["banquet manager", "food service manager", "catering coordinator"],
  "Bar Manager": ["beverage manager", "bar supervisor", "bar team leader"],
  "Duty Manager": ["shift manager", "operations manager", "floor manager"],
  "Floor Supervisor": ["service supervisor", "restaurant supervisor", "team leader"],
  "Sommelier": ["wine specialist", "wine expert", "wine steward", "wine service"],
  
  // Creative & Specialist Roles (4 roles)
  "DJ": ["disc jockey", "music selector", "party dj", "event dj"],
  "Photographer": ["event photographer", "photo specialist", "camera operator"],
  "Videographer": ["video specialist", "cameraman", "video operator", "film crew"],
  
  // Modern/Digital Roles (8 roles)
  "Social Media Assistant": ["social media manager", "content creator", "social media specialist"],
  "Live Stream Host": ["streaming host", "live broadcaster", "stream presenter"],
  "Pop-up Chef": ["guest chef", "temporary chef", "visiting chef", "special event chef"],
  "Vibe Curator": ["atmosphere host", "ambiance coordinator", "mood setter", "experience curator"],
  "Food Stylist": ["food presenter", "culinary stylist", "plate designer"],
  "Wellness Host": ["wellness coordinator", "spa host", "relaxation specialist"],
  "Supper Club Host": ["dinner party host", "private dining host", "culinary host"],
  "Food Blogger": ["food writer", "culinary blogger", "food reviewer", "restaurant blogger"],
  "Food Vlogger": ["food video creator", "culinary vlogger", "food youtuber", "food content creator"]
};

// Create reverse mapping for quick lookup
const REVERSE_MAPPING: { [key: string]: string } = {};
for (const [primary, alternatives] of Object.entries(JOB_TITLE_MAPPINGS)) {
  for (const alt of alternatives) {
    REVERSE_MAPPING[alt.toLowerCase()] = primary;
  }
}

// Job Title Mapper class from MD document
class JobTitleMapper {
  private titleMappings = JOB_TITLE_MAPPINGS;
  private reverseMapping = REVERSE_MAPPING;

  standardizeTitle(userInput: string): [string, boolean] {
    const userInputLower = userInput.toLowerCase().trim();
    
    // Check if it's already a primary title
    for (const primaryTitle of Object.keys(this.titleMappings)) {
      if (primaryTitle.toLowerCase() === userInputLower) {
        return [primaryTitle, false];
      }
    }
    
    // Check alternatives
    if (userInputLower in this.reverseMapping) {
      return [this.reverseMapping[userInputLower], false];
    }
    
    // Fuzzy matching for close matches
    const closestMatch = this.fuzzyMatch(userInputLower);
    if (closestMatch) {
      return [closestMatch, true]; // Needs confirmation
    }
    
    return [userInput, true]; // No match - for future expansion
  }

  private fuzzyMatch(input: string): string | null {
    // More precise fuzzy matching implementation
    const words = input.toLowerCase().split(' ').filter(word => word.length > 2);
    
    for (const [primary, alternatives] of Object.entries(this.titleMappings)) {
      for (const alt of alternatives) {
        const altWords = alt.toLowerCase().split(' ').filter(word => word.length > 2);
        
        // Check for exact word matches first
        const exactMatches = words.filter(word => altWords.includes(word));
        if (exactMatches.length > 0) {
          return primary;
        }
        
        // Check for partial matches only for longer words
        const partialMatches = words.filter(word => 
          word.length > 3 && altWords.some(altWord => 
            altWord.length > 3 && (altWord.includes(word) || word.includes(altWord))
          )
        );
        if (partialMatches.length > 0) {
          return primary;
        }
      }
    }
    return null;
  }
}

// UK-Specific Configuration from MD document
const UK_HOSPITALITY_CONFIG = {
  currency: "GBP",
  currency_symbol: "£",
  minimum_wage: 12.21, // UK National Living Wage 2024
  typical_rates: {
    "Waitstaff": "£12-15/hour",
    "Bartender": "£13-16/hour",
    "Barista": "£11.50-14/hour",
    "Barback": "£11.44-13/hour",
    "Mixologist": "£14-18/hour",
    "Host": "£11.50-14/hour",
    "Runner": "£11.44-13/hour",
    "Food Runner": "£11.44-13/hour",
    "Head Chef": "£18-30/hour",
    "Sous Chef": "£15-22/hour",
    "Chef de Partie": "£13-18/hour",
    "Commis Chef": "£11.44-14/hour",
    "Kitchen Porter": "£11.44-13/hour",
    "Kitchen Assistant": "£11.44-13/hour",
    "Catering Assistant": "£11.44-14/hour",
    "Event Staff": "£12-15/hour",
    "Event Steward": "£12-14/hour",
    "Security": "£14-18/hour",
    "Brand Ambassador": "£15-25/hour",
    "AV Technician": "£15-25/hour",
    "Cleaner": "£11.44-13/hour",
    "Housekeeper": "£11.44-14/hour",
    "Cloakroom Attendant": "£11.44-12/hour",
    "Receptionist": "£12-15/hour",
    "Concierge": "£13-18/hour",
    "Event Manager": "£20-35/hour",
    "Catering Manager": "£18-28/hour",
    "Bar Manager": "£15-22/hour",
    "Duty Manager": "£15-20/hour",
    "Floor Supervisor": "£13-17/hour",
    "Sommelier": "£15-25/hour",
    "DJ": "£20-50/hour",
    "Photographer": "£25-50/hour",
    "Videographer": "£25-50/hour",
    "Social Media Assistant": "£15-25/hour",
    "Live Stream Host": "£20-35/hour",
    "Pop-up Chef": "£20-35/hour",
    "Vibe Curator": "£20-40/hour",
    "Food Stylist": "£25-45/hour",
    "Wellness Host": "£20-35/hour",
    "Supper Club Host": "£25-45/hour",
    "Food Blogger": "£20-35/hour",
    "Food Vlogger": "£20-35/hour"
  },
  common_qualifications: {
    food_hygiene: ["Level 1 Food Safety", "Level 2 Food Hygiene", "Level 3 Food Hygiene"],
    alcohol: ["Personal License", "Award for Personal License Holders (APLH)", "BIIAB Level 2"],
    security: ["SIA Door Supervisor", "SIA CCTV Operator", "SIA Close Protection", "SIA Security Guarding"],
    first_aid: ["Emergency First Aid at Work", "First Aid at Work (3-day)", "Paediatric First Aid"],
    fire_safety: ["Fire Marshal Training", "Fire Warden Certificate"],
    wine: ["WSET Level 1", "WSET Level 2", "WSET Level 3", "Court of Master Sommeliers"],
    coffee: ["SCA Barista Skills", "City & Guilds Barista"]
  },
  london_areas: {
    central: ["Soho", "Covent Garden", "Mayfair", "Fitzrovia", "Marylebone"],
    city: ["The City", "Liverpool Street", "Bank", "Moorgate"],
    east: ["Shoreditch", "Hackney", "Dalston", "Stratford", "Canary Wharf"],
    west: ["Chelsea", "Kensington", "Notting Hill", "Hammersmith", "Fulham"],
    south: ["Brixton", "Clapham", "Peckham", "Greenwich", "Southbank"],
    north: ["Camden", "Islington", "King's Cross", "Hampstead", "Highgate"]
  },
  major_venues: [
    "O2 Arena", "ExCeL London", "Olympia", "Alexandra Palace",
    "Wembley Stadium", "Emirates Stadium", "The Oval",
    "Royal Albert Hall", "Barbican Centre", "Roundhouse",
    "Natural History Museum", "Science Museum", "V&A",
    "The Shard", "Sky Garden", "Tower of London",
    "Hyde Park", "Regent's Park", "Victoria Park"
  ],
  chain_venues: {
    pubs: ["Wetherspoons", "Fuller's", "Young's", "Greene King"],
    restaurants: ["Nando's", "Pizza Express", "Wagamama", "Bills", "Côte"],
    coffee: ["Pret", "Costa", "Caffè Nero", "Starbucks", "Greggs"],
    hotels: ["Premier Inn", "Travelodge", "Hilton", "Marriott", "Holiday Inn"]
  },
  dietary_requirements: [
    "Vegetarian", "Vegan", "Gluten-free", "Dairy-free", "Halal",
    "Kosher", "Nut allergies", "Shellfish allergies", "Coeliac"
  ],
  compliance: {
    "Challenge 25": "Proof of age for alcohol/tobacco sales",
    "Challenge 21": "Some venues use Challenge 21",
    "Natasha's Law": "Full allergen labeling on pre-packed food",
    "COSHH": "Control of Substances Hazardous to Health",
    "RIDDOR": "Reporting of Injuries, Diseases and Dangerous Occurrences",
    "GDPR": "General Data Protection Regulation",
    "Licensing Act 2003": "Alcohol licensing laws",
    "Health & Safety at Work Act": "Workplace safety requirements",
    "Food Safety Act": "Food hygiene standards",
    "Equality Act 2010": "Anti-discrimination law"
  }
};

// Type definitions
interface RequiredField {
  name: string;
  type: string;
  placeholder?: string;
  defaultPrompt: string;
  rows?: number;
}

type FieldName = RequiredField['name'];

interface FormData {
  about?: string;
  experience?: string;
  skills?: string;
  qualifications?: string;
  equipment?: string;
  hourlyRate?: number;
  location?: { lat: number; lng: number } | string;
  availability?: {
    days: string[];
    startTime: string;
    endTime: string;
    frequency?: string;
    ends?: string;
    startDate?: string;
    endDate?: string;
    occurrences?: number;
  } | string;
  videoIntro?: string;
  references?: string;
  jobTitle?: string;
  languages?: string[];
  personalTraits?: string[];
  venueTypes?: string[];
  [key: string]: any;
}

type ChatStep = {
  id: number;
  type: "bot" | "user" | "input" | "sanitized" | "typing" | "calendar" | "location" | "confirm" | "video" | "shareLink" | "availability" | "jobTitleConfirmation" | "summary" | "support" | "hashtag-generation" | "phase-transition";
  content?: string;
  inputConfig?: {
    type: string;
    name: string;
    placeholder?: string;
    rows?: number;
  };
  isComplete?: boolean;
  sanitizedValue?: string | any;
  originalValue?: string | any;
  fieldName?: string;
  isNew?: boolean;
  linkUrl?: string;
  linkText?: string;
  naturalSummary?: string;
  extractedData?: string;
  suggestedJobTitle?: string;
  matchedTerms?: string[];
  isAISuggested?: boolean;
  summaryData?: FormData;
  confirmedChoice?: 'title' | 'original';
  phase?: OnboardingPhase;
  phaseData?: any;
};

interface AIValidationResponse {
  isAppropriate: boolean;
  isWorkerRelated: boolean;
  isSufficient: boolean;
  clarificationPrompt: string;
  sanitizedValue: string;
  naturalSummary: string;
  extractedData: string;
}

interface AIPromptResponse {
  prompt: string;
}

// Utility functions
function isValidDate(dateValue: unknown): boolean {
  if (!dateValue) return false;
  
  try {
    const date = new Date(dateValue as string | Date);
    return !isNaN(date.getTime());
  } catch {
    return false;
  }
}

function isValidCoordinate(value: unknown): value is { lat: number; lng: number } {
  if (!value || typeof value !== 'object') return false;
  const coord = value as { lat?: unknown; lng?: unknown };
  return 'lat' in coord && 'lng' in coord && 
         typeof coord.lat === 'number' && typeof coord.lng === 'number' &&
         !isNaN(coord.lat) && !isNaN(coord.lng);
}

// UK Video Bio Script Generator from MD document
class UKVideoBioScriptGenerator {
  generateScript(profileData: FormData): { formattedScript: string; notesVersion: string; estimatedDuration: string } {
    const script = this.createScriptSections(profileData);
    
    const formattedScript = `
VIDEO BIO SCRIPT - 30-45 seconds
${'='.repeat(50)}

📝 IMPORTANT: Write these key points on paper to refer to while filming!
Don't try to memorize - just note the main points and speak naturally.

YOUR KEY POINTS TO NOTE DOWN:
${'-'.repeat(50)}
1. Introduction: "${script.introNotes}"
2. Experience: "${script.experienceNotes}"
3. Skills: "${script.skillsNotes}"
4. Personality: "${script.personalityNotes}"
5. Closing: "${script.closingNotes}"

FULL SCRIPT FOR REFERENCE:
${'-'.repeat(50)}
${script.fullText}

FILMING TIPS:
${'-'.repeat(20)}
• Have your notes just below the camera (not visible)
• Glance at notes between points - it looks natural!
• Film in good light (near a window is brilliant)
• Smile and imagine chatting to a friendly manager
• Do a practice run while looking at your notes
• Most people nail it on the second or third take

Remember: You don't need to be word-perfect!
Natural and friendly beats scripted and stiff every time.
`;

    return {
      formattedScript,
      notesVersion: script.notesVersion,
      estimatedDuration: "30-45 seconds"
    };
  }

  private createScriptSections(profileData: FormData): any {
    const name = profileData.about?.split(' ')[0] || "there";
    const role = profileData.jobTitle || "hospitality professional";
    const years = this.extractYears(profileData.experience || "0");
    const venues = profileData.venueTypes || [];
    const languages = profileData.languages || ["English"];

    const introNotes = `I'm ${name}, ${role} for ${years} years`;
    const experienceNotes = `Worked at: ${venues.slice(0, 2).join(', ') || 'various venues'}`;
    const skillsNotes = `Good at: ${(profileData.skills || 'quality service').split(',').slice(0, 3).join(', ')}`;
    const personalityNotes = `I'm: ${(profileData.personalTraits || ['professional']).slice(0, 2).join(', ')}`;
    const closingNotes = this.getUKClosing(role);

    const fullText = `
[INTRODUCTION - Smile at camera]
"Hiya, I'm ${name}, and I've been working as a ${role} for ${years} years."

${languages.length > 1 ? `I speak ${languages.join(' and ')} fluently.` : ""}

[EXPERIENCE - Keep eye contact]
"I've worked at ${this.formatUKVenues(venues)}."

[SKILLS - Show enthusiasm]
"${this.formatUKSkills(role, profileData.skills || '')}"

[PERSONALITY - Be yourself]
"I'm ${this.formatUKTraits(profileData.personalTraits || [])}."

[CLOSING - Confident finish]
"${closingNotes}"
`;

    return {
      introNotes,
      experienceNotes,
      skillsNotes,
      personalityNotes,
      closingNotes,
      fullText,
      notesVersion: `${introNotes} | ${experienceNotes} | ${skillsNotes} | ${personalityNotes} | ${closingNotes}`
    };
  }

  private extractYears(experience: string): number {
    const match = experience.match(/(\d+)/);
    return match ? parseInt(match[1]) : 0;
  }

  private formatUKVenues(venues: string[]): string {
    if (venues.length === 0) return "various venues";
    if (venues.length === 1) return venues[0];
    if (venues.length === 2) return venues.join(" and ");
    return `${venues.slice(0, -1).join(", ")}, and ${venues[venues.length - 1]}`;
  }

  private formatUKSkills(role: string, skills: string): string {
    const skillList = skills.split(',').slice(0, 3);
    if (skillList.length === 0) return "I'm passionate about providing excellent service.";
    return `I'm particularly good at ${skillList.join(', ')}.`;
  }

  private formatUKTraits(traits: string[]): string {
    if (traits.length === 0) return "professional and reliable";
    return traits.slice(0, 2).join(" and ");
  }

  private getUKClosing(role: string): string {
    const closings: { [key: string]: string } = {
      "Waitstaff": "Ready to provide top-notch service",
      "Bartender": "Can't wait to pull pints and make cocktails",
      "Barista": "Looking forward to making perfect flat whites",
      "Barback": "Ready to keep your bar running smoothly",
      "Mixologist": "Excited to create amazing cocktails",
      "Host": "Ready to give guests a warm welcome",
      "Runner": "Here to keep service flowing",
      "Food Runner": "Ready to deliver perfect plates",
      "Head Chef": "Ready to cook up a storm",
      "Sous Chef": "Prepared to run any kitchen",
      "Chef de Partie": "Ready to work any section",
      "Commis Chef": "Eager to learn and contribute",
      "Kitchen Porter": "Ready to keep kitchens spotless",
      "Kitchen Assistant": "Here to support your kitchen team",
      "Catering Assistant": "Ready for any event",
      "Event Staff": "Ready to make your event brilliant",
      "Event Steward": "Here to keep events running smoothly",
      "Security": "Here to keep venues safe and sound",
      "Brand Ambassador": "Ready to represent your brand",
      "AV Technician": "Ready to handle all technical needs",
      "Cleaner": "Ready to keep everything spotless",
      "Housekeeper": "Ready to maintain perfect standards",
      "Cloakroom Attendant": "Here to look after belongings",
      "Receptionist": "Ready to be the perfect first impression",
      "Concierge": "Here to make everything possible",
      "Event Manager": "Ready to deliver exceptional events",
      "Catering Manager": "Ready to manage any scale catering",
      "Bar Manager": "Ready to run a profitable bar",
      "Duty Manager": "Ready to take charge",
      "Floor Supervisor": "Ready to lead service teams",
      "Sommelier": "Ready to elevate your wine service",
      "DJ": "Ready to get the crowd moving",
      "Photographer": "Ready to capture perfect moments",
      "Videographer": "Ready to tell your story",
      "Social Media Assistant": "Ready to boost your online presence",
      "Live Stream Host": "Ready to engage audiences",
      "Pop-up Chef": "Ready to create unique experiences",
      "Vibe Curator": "Ready to create amazing atmospheres",
      "Food Stylist": "Ready to make food look incredible",
      "Wellness Host": "Ready to create calm spaces",
      "Supper Club Host": "Ready to host memorable dinners",
      "Food Blogger": "Ready to share food stories",
      "Food Vlogger": "Ready to create engaging content"
    };

    return closings[role] || "Available for immediate start and keen to get stuck in";
  }
}

// Main Onboarding Component
export default function OnboardWorkerPage() {
  const { user, loading: loadingAuth } = useAuth();
  const { ai, loading: loadingAI } = useFirebase();
  const router = useRouter();
  
  // State management
  const [chatSteps, setChatSteps] = useState<ChatStep[]>([]);
  const [currentPhase, setCurrentPhase] = useState<OnboardingPhase>(OnboardingPhase.INITIAL_SKILL);
  const [formData, setFormData] = useState<FormData>({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [showManualForm, setShowManualForm] = useState(false);
  const [currentStepId, setCurrentStepId] = useState(1);
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [workerProfileId, setWorkerProfileId] = useState<string | null>(null);
  const [jobTitleMapper] = useState(new JobTitleMapper());
  const [videoScriptGenerator] = useState(new UKVideoBioScriptGenerator());
  
  const endOfChatRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  
  // Additional state for ChatBotLayout compatibility
  const [setupMode, setSetupMode] = useState<'ai' | 'manual' | null>(null);
  const [manualFormData, setManualFormData] = useState<any>({});
  
  // Check if special components are active (video recorder, calendar, etc.)
  const isSpecialComponentActive = useMemo(() => {
    return chatSteps.some(step => 
      step.type === 'video' || 
      step.type === 'calendar' || 
      step.type === 'location'
    );
  }, [chatSteps]);

  // Scroll to bottom when new messages are added
  useEffect(() => {
    if (endOfChatRef.current) {
      endOfChatRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatSteps]);

  // Initialize onboarding when component mounts
  useEffect(() => {
    if (!loadingAuth && user && !loadingAI && ai) {
      initializeOnboarding();
    }
  }, [user, loadingAuth, ai, loadingAI]);

  // Initialize the 6-phase onboarding flow
  const initializeOnboarding = useCallback(async () => {
    if (!user || !ai) return;

    try {
      setIsProcessing(true);
      setError(null);

      // Start with Phase 1: Initial Skill
      const initialMessage = `Welcome to Able AI! I'm your Gigfolio Coach, here to help you create an amazing profile that showcases your skills and gets you gigs in London and beyond. 🎯

Let's start simple - what's your main skill and how long have you been doing it?

For example: "I'm a bartender with 6 years experience" or "I've been a chef for 10 years"

Tell me about your primary role!`;

      const newStep: ChatStep = {
        id: currentStepId,
        type: "bot",
        content: initialMessage,
        phase: OnboardingPhase.INITIAL_SKILL,
        isNew: true
      };

      const inputStep: ChatStep = {
        id: currentStepId + 1,
        type: "input",
        inputConfig: {
          type: "textarea",
          name: "experienceDetails",
          placeholder: "Tell me about your main skill and experience...",
          rows: 3
        },
        isComplete: false,
        phase: OnboardingPhase.INITIAL_SKILL,
        isNew: true
      };

      setChatSteps([newStep, inputStep]);
      setCurrentStepId(prev => prev + 2);
      setCurrentPhase(OnboardingPhase.INITIAL_SKILL);

    } catch (error) {
      console.error('Error initializing onboarding:', error);
      setError('Failed to start onboarding. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  }, [user, ai, currentStepId]);

  // Process user input and determine next phase
  const processUserInput = useCallback(async (input: string, fieldName?: string) => {
    if (!user || !ai || isProcessing) return;

    try {
      setIsProcessing(true);
      setError(null);

      // Process based on current phase
      await processPhaseInput(input, fieldName);

    } catch (error) {
      console.error('Error processing user input:', error);
      setError('Failed to process your input. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  }, [user, ai, isProcessing]);

  // Process input based on current phase
  const processPhaseInput = async (input: string, fieldName?: string) => {
    switch (currentPhase) {
      case OnboardingPhase.INITIAL_SKILL:
        await processInitialSkill(input);
        break;
      case OnboardingPhase.EXPERIENCE_DEEP_DIVE:
        await processExperienceDeepDive(input);
        break;
      case OnboardingPhase.QUALIFICATIONS:
        await processQualifications(input);
        break;
      case OnboardingPhase.SPECIFIC_SKILLS_AND_LANGUAGES:
        await processSpecificSkillsAndLanguages(input);
        break;
      case OnboardingPhase.LOCATION:
        await processLocation(input);
        break;
      case OnboardingPhase.AVAILABILITY:
        await processAvailability(input);
        break;
      case OnboardingPhase.PERSONAL_TRAITS:
        await processPersonalTraits(input);
        break;
      case OnboardingPhase.EQUIPMENT:
        await processEquipment(input);
        break;
      case OnboardingPhase.REFERENCES:
        await processReferences(input);
        break;
      case OnboardingPhase.VIDEO_BIO_GENERATION:
        await processVideoBioGeneration(input);
        break;
    }
  };

  // Phase 1: Process initial skill input
  const processInitialSkill = async (input: string) => {
    // Extract job title and experience
    const [standardizedTitle, needsConfirmation] = jobTitleMapper.standardizeTitle(input);
    
    // Debug logging
    console.log('Input:', input);
    console.log('Standardized title:', standardizedTitle);
    console.log('Needs confirmation:', needsConfirmation);
    
    // Extract years of experience
    const experienceMatch = input.match(/(\d+)\s*(?:years?|yrs?)/i);
    const yearsExperience = experienceMatch ? parseInt(experienceMatch[1]) : 0;

    // Update form data
    setFormData(prev => ({
      ...prev,
      jobTitle: standardizedTitle,
      experience: input,
      yearsExperience
    }));

    // Move to Phase 2: Experience Deep Dive - Use AI-generated response
    const aiPrompt = await generateContextAwarePrompt('experience', input, ai);
    
    const nextStep: ChatStep = {
      id: currentStepId,
      type: "bot",
      content: aiPrompt,
      phase: OnboardingPhase.EXPERIENCE_DEEP_DIVE,
      isNew: true
    };

    const inputStep: ChatStep = {
      id: currentStepId + 1,
      type: "input",
      inputConfig: {
        type: "textarea",
        name: "venueExperience",
        placeholder: "Tell me about your venue experience...",
        rows: 3
      },
      isComplete: false,
      phase: OnboardingPhase.EXPERIENCE_DEEP_DIVE,
      isNew: true
    };

    setChatSteps(prev => [...prev, nextStep, inputStep]);
    setCurrentStepId(prev => prev + 2);
    setCurrentPhase(OnboardingPhase.EXPERIENCE_DEEP_DIVE);
  };

  // Phase 2: Process experience deep dive
  const processExperienceDeepDive = async (input: string) => {
    // Extract venue types and details
    const venueTypes = extractVenueTypes(input);
    
    setFormData(prev => ({
      ...prev,
      venueTypes,
      experienceDetails: input
    }));

    // Move to Phase 3: Qualifications - Use AI-generated response
    const aiPrompt = await generateContextAwarePrompt('qualifications', input, ai);
    
    const nextStep: ChatStep = {
      id: currentStepId,
      type: "bot",
      content: aiPrompt,
      phase: OnboardingPhase.QUALIFICATIONS,
      isNew: true
    };

    const inputStep: ChatStep = {
      id: currentStepId + 1,
      type: "input",
      inputConfig: {
        type: "textarea",
        name: "qualifications",
        placeholder: "List your qualifications or say 'none'...",
        rows: 3
      },
      isComplete: false,
      phase: OnboardingPhase.QUALIFICATIONS,
      isNew: true
    };

    setChatSteps(prev => [...prev, nextStep, inputStep]);
    setCurrentStepId(prev => prev + 2);
    setCurrentPhase(OnboardingPhase.QUALIFICATIONS);
  };

  // Phase 3: Process qualifications
  const processQualifications = async (input: string) => {
    setFormData(prev => ({
      ...prev,
      qualifications: input
    }));

    // Move to Phase 4: Specific Skills and Languages - Use AI-generated response
    const aiPrompt = await generateContextAwarePrompt('skills', input, ai);
    
    const nextStep: ChatStep = {
      id: currentStepId,
      type: "bot",
      content: aiPrompt,
      phase: OnboardingPhase.SPECIFIC_SKILLS_AND_LANGUAGES,
      isNew: true
    };

    const inputStep: ChatStep = {
      id: currentStepId + 1,
      type: "input",
      inputConfig: {
        type: "textarea",
        name: "specificSkills",
        placeholder: "Tell me about your specific skills and languages...",
        rows: 3
      },
      isComplete: false,
      phase: OnboardingPhase.SPECIFIC_SKILLS_AND_LANGUAGES,
      isNew: true
    };

    setChatSteps(prev => [...prev, nextStep, inputStep]);
    setCurrentStepId(prev => prev + 2);
    setCurrentPhase(OnboardingPhase.SPECIFIC_SKILLS_AND_LANGUAGES);
  };

  // Phase 4: Process specific skills and languages
  const processSpecificSkillsAndLanguages = async (input: string) => {
    const { skills, languages } = extractSkillsAndLanguages(input);
    
    setFormData(prev => ({
      ...prev,
      skills,
      languages
    }));

    // Move to Phase 4.5: Location - Use AI-generated response
    const aiPrompt = await generateContextAwarePrompt('location', input, ai);
    
    const nextStep: ChatStep = {
      id: currentStepId,
      type: "bot",
      content: aiPrompt,
      phase: OnboardingPhase.LOCATION,
      isNew: true
    };

    const locationStep: ChatStep = {
      id: currentStepId + 1,
      type: "location",
      content: "Please select your location",
      isComplete: false,
      phase: OnboardingPhase.LOCATION,
      isNew: true
    };

    setChatSteps(prev => [...prev, nextStep, locationStep]);
    setCurrentStepId(prev => prev + 2);
    setCurrentPhase(OnboardingPhase.LOCATION);
  };

  // Phase 4.5: Process location
  const processLocation = async (input: string) => {
    setFormData(prev => ({
      ...prev,
      location: input
    }));

    // Check if user already has availability data
    const hasAvailability = !!(formData.availability);
    
    if (hasAvailability) {
      // Skip availability, go directly to references
      const aiPrompt = await generateContextAwarePrompt('references', input, ai);
      
      const nextStep: ChatStep = {
        id: currentStepId,
        type: "bot",
        content: aiPrompt,
        phase: OnboardingPhase.REFERENCES,
        isNew: true
      };

      const inputStep: ChatStep = {
        id: currentStepId + 1,
        type: "input",
        inputConfig: {
          type: "textarea",
          name: "references",
          placeholder: "Tell me about your references or say 'none'...",
          rows: 3
        },
        isComplete: false,
        phase: OnboardingPhase.REFERENCES,
        isNew: true
      };

      setChatSteps(prev => [...prev, nextStep, inputStep]);
      setCurrentStepId(prev => prev + 2);
      setCurrentPhase(OnboardingPhase.REFERENCES);
    } else {
      // Normal flow - go to availability
      const aiPrompt = await generateContextAwarePrompt('availability', input, ai);
      
      const nextStep: ChatStep = {
        id: currentStepId,
        type: "bot",
        content: aiPrompt,
        phase: OnboardingPhase.AVAILABILITY,
        isNew: true
      };

      const inputStep: ChatStep = {
        id: currentStepId + 1,
        type: "input",
        inputConfig: {
          type: "textarea",
          name: "availability",
          placeholder: "Tell me about your availability...",
          rows: 3
        },
        isComplete: false,
        phase: OnboardingPhase.AVAILABILITY,
        isNew: true
      };

      setChatSteps(prev => [...prev, nextStep, inputStep]);
      setCurrentStepId(prev => prev + 2);
      setCurrentPhase(OnboardingPhase.AVAILABILITY);
    }
  };

  // Phase 5: Process personal traits
  const processPersonalTraits = async (input: string) => {
    const traits = extractPersonalTraits(input);
    
    setFormData(prev => ({
      ...prev,
      personalTraits: traits
    }));

    // Move to Phase 6: Equipment - Use AI-generated response
    const aiPrompt = await generateContextAwarePrompt('equipment', input, ai);
    
    const nextStep: ChatStep = {
      id: currentStepId,
      type: "bot",
      content: aiPrompt,
      phase: OnboardingPhase.EQUIPMENT,
      isNew: true
    };

    setChatSteps(prev => [...prev, nextStep]);
    setCurrentStepId(prev => prev + 1);
    setCurrentPhase(OnboardingPhase.EQUIPMENT);
  };

  // Phase 6: Process equipment
  const processEquipment = async (input: string) => {
    setFormData(prev => ({
      ...prev,
      equipment: input
    }));

    // Check if user already has location and availability data
    const hasLocationAndAvailability = hasExistingLocationAndAvailability(formData);
    
    if (hasLocationAndAvailability) {
      // Skip location and availability, go directly to references
      const aiPrompt = await generateContextAwarePrompt('references', input, ai);
      
      const nextStep: ChatStep = {
        id: currentStepId,
        type: "bot",
        content: aiPrompt,
        phase: OnboardingPhase.REFERENCES,
        isNew: true
      };

      setChatSteps(prev => [...prev, nextStep]);
      setCurrentStepId(prev => prev + 1);
      setCurrentPhase(OnboardingPhase.REFERENCES);
    } else {
      // Normal flow - go to location first
      const aiPrompt = await generateContextAwarePrompt('location', input, ai);
      
      const nextStep: ChatStep = {
        id: currentStepId,
        type: "bot",
        content: aiPrompt,
        phase: OnboardingPhase.LOCATION,
        isNew: true
      };

      const locationStep: ChatStep = {
        id: currentStepId + 1,
        type: "location",
        content: "Please select your location",
        isComplete: false,
        phase: OnboardingPhase.LOCATION,
        isNew: true
      };

      setChatSteps(prev => [...prev, nextStep, locationStep]);
      setCurrentStepId(prev => prev + 2);
      setCurrentPhase(OnboardingPhase.LOCATION);
    }

  };

  // Phase 6.5: Process availability
  const processAvailability = async (input: string) => {
    setFormData(prev => ({
      ...prev,
      availability: input
    }));

    // Move to Phase 7: References - Use AI-generated response
    const aiPrompt = await generateContextAwarePrompt('references', input, ai);
    
    const nextStep: ChatStep = {
      id: currentStepId,
      type: "bot",
      content: aiPrompt,
      phase: OnboardingPhase.REFERENCES,
      isNew: true
    };

    const inputStep: ChatStep = {
      id: currentStepId + 1,
      type: "input",
      inputConfig: {
        type: "textarea",
        name: "references",
        placeholder: "Tell me about your references or say 'none'...",
        rows: 3
      },
      isComplete: false,
      phase: OnboardingPhase.REFERENCES,
      isNew: true
    };

    setChatSteps(prev => [...prev, nextStep, inputStep]);
    setCurrentStepId(prev => prev + 2);
    setCurrentPhase(OnboardingPhase.REFERENCES);
  };

  // Phase 7: Process references
  const processReferences = async (input: string) => {
    setFormData(prev => ({
      ...prev,
      references: input
    }));

    // Move to Phase 8: Video Bio Generation - Use AI-generated response
    const aiPrompt = await generateContextAwarePrompt('videoIntro', input, ai);
    
    const nextStep: ChatStep = {
      id: currentStepId,
      type: "bot",
      content: aiPrompt,
      phase: OnboardingPhase.VIDEO_BIO_GENERATION,
      isNew: true
    };

    setChatSteps(prev => [...prev, nextStep]);
    setCurrentStepId(prev => prev + 1);
    setCurrentPhase(OnboardingPhase.VIDEO_BIO_GENERATION);
  };

  // Phase 8: Process video bio generation
  const processVideoBioGeneration = async (input: string) => {
    if (input.toLowerCase().includes('ready') || input.toLowerCase().includes('yes')) {
      // Create video step - the AIVideoScriptDisplay component will handle script generation
      const videoStep: ChatStep = {
        id: currentStepId,
        type: "video",
        content: "Ready to record your video bio!",
        phase: OnboardingPhase.VIDEO_BIO_GENERATION,
        isNew: true
      };

      setChatSteps(prev => [...prev, videoStep]);
      setCurrentStepId(prev => prev + 1);
    }
  };

  // Helper functions
  const extractVenueTypes = (input: string): string[] => {
    const venueKeywords = {
      'pub': ['pub', 'bar', 'tavern', 'local'],
      'restaurant': ['restaurant', 'dining', 'eatery', 'bistro'],
      'hotel': ['hotel', 'inn', 'b&b', 'accommodation'],
      'club': ['club', 'members', 'private', 'exclusive'],
      'event': ['event', 'festival', 'conference', 'wedding'],
      'cafe': ['cafe', 'coffee', 'coffee shop', 'café']
    };

    const foundTypes: string[] = [];
    const lowerInput = input.toLowerCase();

    for (const [type, keywords] of Object.entries(venueKeywords)) {
      if (keywords.some(keyword => lowerInput.includes(keyword))) {
        foundTypes.push(type);
      }
    }

    return foundTypes.length > 0 ? foundTypes : ['various venues'];
  };

  const extractSkillsAndLanguages = (input: string): { skills: string; languages: string[] } => {
    // Extract languages (common patterns)
    const languagePatterns = [
      /\b(english|french|spanish|german|italian|portuguese|polish|mandarin|arabic|hindi)\b/gi
    ];
    
    const languages: string[] = [];
    for (const pattern of languagePatterns) {
      const matches = input.match(pattern);
      if (matches) {
        languages.push(...matches.map(m => m.toLowerCase()));
      }
    }

    // Remove language mentions from skills
    let skills = input;
    languages.forEach(lang => {
      skills = skills.replace(new RegExp(`\\b${lang}\\b`, 'gi'), '');
    });

    return {
      skills: skills.trim(),
      languages: languages.length > 0 ? languages : ['English']
    };
  };

  const extractPersonalTraits = (input: string): string[] => {
    const traitKeywords = [
      'hard-working', 'reliable', 'customer-focused', 'calm', 'team player',
      'detail-oriented', 'organized', 'creative', 'problem-solving', 'energetic',
      'enthusiastic', 'professional', 'friendly', 'punctual', 'flexible'
    ];

    const foundTraits: string[] = [];
    const lowerInput = input.toLowerCase();

    for (const trait of traitKeywords) {
      if (lowerInput.includes(trait)) {
        foundTraits.push(trait);
      }
    }

    return foundTraits.slice(0, 4); // Limit to 4 traits
  };

  const getRoleSpecificSkillsPrompt = (role: string): string => {
    // This would contain the role-specific prompts from the MD document
    // For now, return a generic prompt
    return `Think about your specific skills in this role:
• What technical skills do you have?
• What type of venues have you worked in?
• What makes you stand out?
• Do you have any relevant qualifications?
• What languages do you speak fluently?`;
  };

  const getRoleSpecificEquipmentPrompt = (role: string): string => {
    // This would contain the role-specific equipment prompts from the MD document
    // For now, return a generic prompt
    return `Do you have any professional equipment or uniform that would be helpful for this role?

It's completely fine if you don't - most venues provide what's needed!`;
  };

  // Handle video upload
  const handleVideoUpload = async (file: File, fieldName?: string, stepId?: number) => {
    try {
      setIsProcessing(true);
      setError(null);

      const storage = getStorage(firebaseApp);
      const videoRef = storageRef(storage, `workers/${user?.uid}/introVideo/${Date.now()}-${file.name}`);
      
      const uploadTask = uploadBytesResumable(videoRef, file);
      
      uploadTask.on('state_changed',
        (snapshot) => {
          // Progress tracking
        },
        (error) => {
          console.error('Upload error:', error);
          setError('Failed to upload video. Please try again.');
        },
        async () => {
          try {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            
            // Update form data with video URL
            setFormData(prev => ({
              ...prev,
              videoIntro: downloadURL
            }));

            // Update the video step
            setChatSteps(prev => prev.map(step => 
              step.id === stepId 
                ? { ...step, isComplete: true, sanitizedValue: downloadURL }
                : step
            ));

            // Show completion message and finalize profile
            const completionStep: ChatStep = {
              id: currentStepId,
              type: "bot",
              content: "Perfect! Your video has been uploaded successfully. Now let's complete your profile!",
              isNew: true
            };

            setChatSteps(prev => [...prev, completionStep]);
            setCurrentStepId(prev => prev + 1);

            // Finalize profile after video upload
            await finalizeProfile();

          } catch (error) {
            console.error('Error getting download URL:', error);
            setError('Failed to process video. Please try again.');
          }
        }
      );

    } catch (error) {
      console.error('Error uploading video:', error);
      setError('Failed to upload video. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Finalize profile creation
  const finalizeProfile = async () => {
    try {
      setIsProcessing(true);
      setError(null);

      // Parse experience to get numeric values
      console.log('📊 Parsing experience:', formData.experience);
      const { years: experienceYears, months: experienceMonths } = parseExperienceToNumeric(formData.experience || '');
      console.log('📊 Parsed experience:', { years: experienceYears, months: experienceMonths });

      const requiredData = {
        about: formData.about || formData.experienceDetails || '',
        experience: formData.experience || '',
        skills: formData.skills || '',
        qualifications: formData.qualifications || '',
        equipment: formData.equipment ? formData.equipment.split(',').map((item: string) => ({ name: item.trim(), description: undefined })) : [],
        hourlyRate: String(formData.hourlyRate || ''),
        location: formData.location || '',
        availability: formData.availability || { 
          days: [], 
          startTime: '09:00', 
          endTime: '17:00',
          frequency: 'weekly',
          ends: 'never',
          startDate: new Date().toISOString().split('T')[0],
          endDate: undefined,
          occurrences: undefined
        },
        videoIntro: formData.videoIntro || '',
        references: formData.references || '',
        jobTitle: formData.jobTitle || '',
        experienceYears: experienceYears,
        experienceMonths: experienceMonths
        // hashtags are auto-generated on the server side
      };

      // Save the profile data to database
      console.log('💾 Attempting to save profile with data:', requiredData);
      console.log('💾 User UID:', user?.uid);
      
      if (!user?.uid) {
        throw new Error('User not authenticated');
      }
      
      // Generate hashtags before saving
      console.log('🏷️ Generating hashtags...');
      const hashtags = await generateHashtags(requiredData, ai);
      console.log('🏷️ Generated hashtags:', hashtags);
      
      // Add hashtags to the data
      const dataWithHashtags = {
        ...requiredData,
        hashtags: hashtags
      };

      console.log('🚀 Calling saveWorkerProfileFromOnboardingAction...');
      const result = await saveWorkerProfileFromOnboardingAction(dataWithHashtags, user.uid);
      console.log('💾 Profile save result:', result);
      console.log('💾 Result type:', typeof result);
      console.log('💾 Result keys:', Object.keys(result));
      
      if (result.success && result.data) {
        console.log('✅ Profile saved successfully, workerProfileId:', result.data);
        setWorkerProfileId(result.data);
        
        // Show success message and redirect
        const successStep: ChatStep = {
          id: currentStepId,
          type: "bot",
          content: `🎉 Brilliant! Your gigfolio is now complete and ready to help you find amazing gigs in London!

Your profile includes:
• Your role as a ${formData.jobTitle}
• ${formData.experience} of experience
• Your qualifications and skills
• Your personal traits and equipment
• A professional video introduction

You can now start applying for gigs and setting your availability. Good luck!`,
          isNew: true
        };

        setChatSteps(prev => [...prev, successStep]);
        setCurrentStepId(prev => prev + 1);

        // Redirect to worker dashboard after a delay
        setTimeout(() => {
          router.push(`/user/${user?.uid}/worker`);
        }, 3000);
      } else {
        console.error('❌ Profile save failed:', {
          success: result.success,
          data: result.data,
          error: result.error,
          result: result
        });
        throw new Error(result.error || 'Failed to save profile');
      }

    } catch (error) {
      console.error('Error saving profile:', error);
      setError('Failed to save your profile. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle input submission
  const handleInputSubmit = useCallback(async (stepId: number, inputName: string, inputValue?: string) => {
    const valueToUse = inputValue ?? formData[inputName];
    if (!valueToUse) {
      console.warn('No value provided for input:', inputName);
      return;
    }
    
    try {
      // Mark the input step as complete
      setChatSteps(prev => prev.map(step => 
        step.id === stepId 
          ? { ...step, isComplete: true }
          : step
      ));
      
      // Process the input based on the current phase
      await processUserInput(valueToUse, inputName);
      
    } catch (error) {
      console.error('Error processing input:', error);
      setError('Failed to process your input. Please try again.');
    }
  }, [formData, processUserInput]);

  // Add a new chat step
  const addChatStep = useCallback((step: ChatStep) => {
    setChatSteps(prev => [...prev, step]);
  }, []);

  // Get next step ID
  const getNextStepId = useCallback(() => {
    setCurrentStepId(prev => prev + 1);
    return currentStepId;
  }, [currentStepId]);

  // Handle reset choice for setup method
  const handleResetChoice = useCallback(() => {
    setSetupMode(null);
    setManualFormData({});
    setShowManualForm(false);
    // Reset to initial state
    initializeOnboarding();
  }, [initializeOnboarding]);

  // Handle manual form data update
  useEffect(() => {
    if (Object.keys(manualFormData).length > 0) {
      setFormData(prev => ({ ...prev, ...manualFormData }));
    }
  }, [manualFormData]);

  // Handle sending messages (for chat input)
  const onSendMessage = useCallback((message: string) => {
    if (!message.trim() || isProcessing) return;
    
    // Find the current incomplete input step
    const currentInputStep = chatSteps.find(step => 
      step.type === "input" && !step.isComplete
    );

    if (currentInputStep) {
      // Add user message
      addChatStep({
        id: getNextStepId(),
        type: "user",
        content: message,
        isComplete: true
      });

      // Handle the input
      if (currentInputStep.inputConfig?.name) {
        handleInputSubmit(currentInputStep.id, currentInputStep.inputConfig.name, message);
      }
    } else {
      // If no input step, just process as regular message
      addChatStep({
        id: getNextStepId(),
        type: "user",
        content: message,
        isComplete: true
      });
      
      processUserInput(message);
    }
  }, [isProcessing, chatSteps, addChatStep, getNextStepId, handleInputSubmit, processUserInput]);

  if (loadingAuth || loadingAI) {
    return <Loader />;
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-4">Please sign in to continue</h2>
          <button
            onClick={() => router.push('/signin')}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  if (showManualForm) {
    return (
        <ManualProfileForm
          onSubmit={finalizeProfile}
          onSwitchToAI={() => setShowManualForm(false)}
          initialData={formData as any}
          workerProfileId={workerProfileId}
        />
    );
  }

  return (
    <>
      <ChatBotLayout
        ref={chatContainerRef}
        className="container"
        role="GIG_WORKER"
        showChatInput={true}
        disableChatInput={isSpecialComponentActive}
        onSendMessage={onSendMessage}
        showOnboardingOptions={true}
        onSwitchToManual={() => {
          setSetupMode('manual');
          setManualFormData(formData);
          setShowManualForm(true);
        }}
        onChangeSetupMethod={handleResetChoice}
      >
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {chatSteps.map((step, idx) => {
          const key = `${step.id}-${idx}`;
          
          if (step.type === "bot") {
            // Convert bullet points to HTML for proper rendering
            const formattedContent = (step.content || "").replace(/•/g, '•');
            
            return (
              <MessageBubble
                key={key}
                text={
                  <div dangerouslySetInnerHTML={{
                    __html: formattedContent.replace(/\n/g, '<br/>')
                  }} />
                }
                senderType="bot"
                isNew={step.isNew}
                role="GIG_WORKER"
              />
            );
          }

          if (step.type === "user") {
            return (
              <MessageBubble
                key={key}
                text={step.content || ""}
                senderType="user"
                showAvatar={false}
                isNew={step.isNew}
                role="GIG_WORKER"
              />
            );
          }

          if (step.type === "typing") {
            return <TypingIndicator key={key} />;
          }

          if (step.type === "input") {
            // Return null for completed inputs - they're handled by user messages now
            return null;
          }

          if (step.type === "location") {
            return (
              <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <LocationPickerBubble
                  value={formData.location}
                  onChange={val => setFormData(prev => ({ ...prev, location: val }))}
                  showConfirm={false}
                  onConfirm={() => {
                    // Mark step as complete and move to next phase
                    setChatSteps(prev => prev.map(s => 
                      s.id === step.id ? { ...s, isComplete: true } : s
                    ));
                    processLocation(typeof formData.location === 'string' ? formData.location : '');
                  }}
                  role="GIG_WORKER"
                />
              </div>
            );
          }

          if (step.type === "video") {
            return (
              <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <AIVideoScriptDisplay formData={formData} ai={ai} />
                <VideoRecorderOnboarding
                  onVideoRecorded={(file: Blob) => handleVideoUpload(file as File, 'videoIntro', step.id)}
                />
              </div>
            );
          }
          
          return null;
        })}
        
        <div ref={endOfChatRef} />
      </ChatBotLayout>
    </>
  );
}
