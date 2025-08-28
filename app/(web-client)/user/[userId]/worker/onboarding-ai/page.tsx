"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

import ChatBotLayout from "@/app/components/onboarding/ChatBotLayout";
import MessageBubble from "@/app/components/onboarding/MessageBubble";

import CalendarPickerBubble from "@/app/components/onboarding/CalendarPickerBubble";
import VideoRecorderBubble from "@/app/components/onboarding/VideoRecorderBubble";
import LocationPickerBubble from '@/app/components/onboarding/LocationPickerBubble';
import ShareLinkBubble from "@/app/components/onboarding/ShareLinkBubble";
import SanitizedConfirmationBubble from "@/app/components/onboarding/SanitizedConfirmationBubble";
import SetupChoiceModal from "@/app/components/onboarding/SetupChoiceModal";
import ManualProfileForm from "@/app/components/onboarding/ManualProfileForm";
import Loader from "@/app/components/shared/Loader";

// Typing indicator component with bouncing animation - matching gig creation
const TypingIndicator: React.FC = () => (
  <div style={{ 
    display: 'flex', 
    alignItems: 'center', 
    padding: '12px 16px', 
    color: 'var(--primary-color)', 
    fontWeight: 600,
    animation: 'slideIn 0.3s ease-out',
    opacity: 0,
    animationFillMode: 'forwards'
  }}>
    <div style={{ 
      display: 'flex', 
      gap: '4px',
      background: 'rgba(37, 99, 235, 0.1)',
      padding: '8px 12px',
      borderRadius: '20px',
      border: '1px solid rgba(37, 99, 235, 0.2)'
    }}>
      <span className="typing-dot" style={{ 
        animation: 'typingBounce 1.4s infinite ease-in-out',
        fontSize: '18px',
        lineHeight: '1'
      }}>●</span>
      <span className="typing-dot" style={{ 
        animation: 'typingBounce 1.4s infinite ease-in-out 0.2s',
        fontSize: '18px',
        lineHeight: '1'
      }}>●</span>
      <span className="typing-dot" style={{ 
        animation: 'typingBounce 1.4s infinite ease-in-out 0.4s',
        fontSize: '18px',
        lineHeight: '1'
      }}>●</span>
    </div>
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

// Define required fields and their configs - matching gig creation pattern
const requiredFields: RequiredField[] = [
  { name: "about", type: "text", placeholder: "Tell us about yourself and your background...", defaultPrompt: "Tell me about yourself and what kind of work you can offer!", rows: 3 },
  { name: "experience", type: "text", placeholder: "Tell us about your experience...", defaultPrompt: "What experience do you have in your field?", rows: 3 },
  { name: "skills", type: "text", placeholder: "List your skills and certifications...", defaultPrompt: "What skills and certifications do you have?", rows: 3 },
  { name: "hourlyRate", type: "number", placeholder: "£15", defaultPrompt: "What's your preferred hourly rate?" },
  { name: "location", type: "location", defaultPrompt: "Where are you based? This helps us find gigs near you!" },
  { name: "availability", type: "availability", defaultPrompt: "When are you available to work? Let's set up your weekly schedule!" },
  { name: "videoIntro", type: "video", defaultPrompt: "Record a short video introduction to help clients get to know you!" },
  { name: "references", type: "text", placeholder: "Provide your references...", defaultPrompt: "Do you have any references or testimonials?", rows: 3 },
];



// Type definitions for better type safety
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
  hourlyRate?: number;
  location?: { lat: number; lng: number } | string;
  availability?: {
    days: string[];
    startTime: string;
    endTime: string;
    frequency?: string;
    ends?: string;
    endDate?: string;
    occurrences?: number;
  } | string;
  videoIntro?: string;
  references?: string;
  jobTitle?: string; // Add job title field
  [key: string]: any;
}

// Chat step type definition - matching gig creation structure
 type ChatStep = {
  id: number;
  type: "bot" | "user" | "input" | "sanitized" | "typing" | "calendar" | "location" | "confirm" | "video" | "shareLink" | "availability" | "jobTitleConfirmation" | "summary" | "support";
  content?: string;
  inputConfig?: {
    type: string;
    name: string;
    placeholder?: string;
    rows?: number;
  };
  isComplete?: boolean;
  sanitizedValue?: string | any; // Allow objects for coordinates
  originalValue?: string | any; // Allow objects for coordinates
  fieldName?: string;
  isNew?: boolean; // Track if this step is new for animation purposes
  linkUrl?: string;
  linkText?: string;
  naturalSummary?: string; // New: Natural language summary for user confirmation
  extractedData?: string; // New: JSON string of extracted data
  suggestedJobTitle?: string; // New: Suggested standardized job title
  matchedTerms?: string[]; // New: Terms that matched for job title
  isAISuggested?: boolean; // New: Whether the job title was AI-suggested
  summaryData?: FormData; // New: Data for profile summary display
};

// AI response types for better type safety
interface AIValidationResponse {
  isAppropriate: boolean;
  isWorkerRelated: boolean;
  isSufficient: boolean;
  clarificationPrompt: string;
  sanitizedValue: string;
  naturalSummary: string; // New: Natural language summary for user confirmation
  extractedData: string; // JSON string of extracted data
}

interface AIPromptResponse {
  prompt: string;
}

// Utility functions with better error handling
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

// Helper: generate AI-powered video introduction script
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
      ai
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

// Helper: interpret user experience and find standardized job title with AI fallback
async function interpretJobTitle(userExperience: string, ai: any): Promise<{ jobTitle: string; confidence: number; matchedTerms: string[]; isAISuggested: boolean } | null> {
  try {
    // Use the new AI fallback function that handles both taxonomy matching and AI suggestions
    const result = await findStandardizedJobTitleWithAIFallback(userExperience, ai);
    
    if (result) {
      return {
        jobTitle: result.jobTitle.title,
        confidence: result.confidence,
        matchedTerms: result.matchedTerms,
        isAISuggested: result.isAISuggested
      };
    }
  } catch (error) {
    console.error('Job title interpretation failed:', error);
  }
  
  return null;
}

// Helper: detect if user response is unrelated to current prompt
function isUnrelatedResponse(userInput: string, currentPrompt: string): boolean {
  // Simple heuristic: check if response contains common unrelated phrases
  const unrelatedPhrases = [
    'help', 'support', 'contact', 'human', 'person', 'agent', 'representative',
    'complaint', 'issue', 'problem', 'broken', 'not working', 'error',
    'customer service', 'speak to someone', 'talk to human', 'real person',
    'please', 'need', 'want', 'can i', 'could i', 'i need', 'i want',
    // Curse words and inappropriate language
    'fuck', 'shit', 'damn', 'bitch', 'ass', 'asshole', 'bastard', 'crap',
    'piss', 'dick', 'cock', 'pussy', 'cunt', 'whore', 'slut', 'fucker',
    'motherfucker', 'fucking', 'shitty', 'damned', 'bloody', 'bugger',
    'wanker', 'twat', 'bellend', 'knob', 'prick', 'tosser', 'arse',
    'bollocks', 'wank', 'fanny', 'minge', 'gash', 'snatch', 'cooch',
    'pussy', 'vagina', 'penis', 'cock', 'dick', 'willy', 'johnson'
  ];
  
  const userLower = userInput.toLowerCase().trim();
  const promptLower = currentPrompt.toLowerCase();
  
  // Check for unrelated phrases (more strict matching)
  const hasUnrelatedPhrase = unrelatedPhrases.some(phrase => {
    // Check for exact phrase matches
    if (userLower.includes(phrase)) return true;
    // Check for phrase with "i" prefix
    if (userLower.includes(`i ${phrase}`)) return true;
    // Check for phrase with "please" prefix
    if (userLower.includes(`please ${phrase}`)) return true;
    return false;
  });
  
  // Check if response is too short (likely not answering the question)
  const isTooShort = userInput.trim().length < 15;
  
  // Check if response doesn't contain relevant keywords from the prompt
  const promptKeywords = promptLower.match(/\b\w+\b/g) || [];
  const relevantKeywords = promptKeywords.filter(word => word.length > 3);
  const hasRelevantKeywords = relevantKeywords.some(keyword => userLower.includes(keyword));
  
  // Check for common valid short responses that should NOT be flagged
  const validShortResponses = [
    // Job titles (common short responses)
    'developer', 'web developer', 'frontend developer', 'backend developer', 'full stack developer',
    'designer', 'ui designer', 'ux designer', 'graphic designer',
    'manager', 'project manager', 'event manager', 'sales manager',
    'assistant', 'admin assistant', 'executive assistant',
    'consultant', 'freelancer', 'contractor',
    'chef', 'cook', 'bartender', 'server', 'waiter', 'waitress',
    'receptionist', 'cashier', 'barista', 'baker',
    'security', 'guard', 'technician', 'operator',
    
    // Numbers and rates (common short responses)
    /\d+/, // Any number
    /\d+\s*(pound|pounds|£|gbp|per\s*hour|hourly|rate)/i, // Rate patterns
    
    // Common affirmative responses
    'yes', 'no', 'ok', 'okay', 'sure', 'fine', 'good', 'great',
    
    // Common location responses
    'london', 'manchester', 'birmingham', 'leeds', 'liverpool', 'sheffield', 'edinburgh', 'glasgow',
    'cardiff', 'belfast', 'bristol', 'newcastle', 'leicester', 'coventry', 'nottingham', 'southampton'
  ];
  
  // Check if the response matches any valid short response patterns
  const isValidShortResponse = validShortResponses.some(pattern => {
    if (typeof pattern === 'string') {
      return userLower.includes(pattern);
    } else if (pattern instanceof RegExp) {
      return pattern.test(userLower);
    }
    return false;
  });
  
  // Check if the prompt is asking for specific types of information that might have short answers
  const promptAskingFor = {
    jobTitle: /(job|title|position|role|what\s*do\s*you\s*do|profession)/i.test(promptLower),
    rate: /(rate|price|cost|hourly|per\s*hour|how\s*much|charge)/i.test(promptLower),
    location: /(location|where|city|area|place)/i.test(promptLower),
    availability: /(available|when|time|schedule|hours)/i.test(promptLower),
    yesNo: /(yes|no|do\s*you|can\s*you|would\s*you|are\s*you)/i.test(promptLower)
  };
  
  // If the prompt is asking for specific information types, be more lenient with short responses
  const isSpecificQuestion = promptAskingFor.jobTitle || promptAskingFor.rate || promptAskingFor.location || promptAskingFor.yesNo;
  
  console.log('Unrelated response check:', {
    userInput: userLower,
    promptKeywords: relevantKeywords,
    hasUnrelatedPhrase,
    isTooShort,
    hasRelevantKeywords,
    isValidShortResponse,
    isSpecificQuestion,
    promptAskingFor,
    result: hasUnrelatedPhrase || (isTooShort && !hasRelevantKeywords && !isValidShortResponse && !isSpecificQuestion)
  });
  
  // Only flag as unrelated if:
  // 1. It contains unrelated phrases, OR
  // 2. It's too short AND doesn't have relevant keywords AND isn't a valid short response AND isn't answering a specific question
  return hasUnrelatedPhrase || (isTooShort && !hasRelevantKeywords && !isValidShortResponse && !isSpecificQuestion);
}

// Helper: save support case to database
async function saveSupportCaseToDatabase(userData: any, conversationHistory: any[], reason: string): Promise<string> {
  try {
    console.log('Saving support case to database:', { userData, conversationHistory, reason });
    
    // Get user ID from userData
    const userId = userData?.userId;
    if (!userId) {
      console.error('No user ID provided for escalation');
      return `ERROR-${Date.now()}`;
    }

    // Create escalated issue in database via API
    const escalationResult = await createEscalatedIssueClient({
      userId: userId,
      issueType: 'onboarding_difficulty',
      description: `Onboarding escalation: ${reason}. User struggling with AI onboarding process.`,
      contextType: 'onboarding'
    });

    if (escalationResult.success && escalationResult.issueId) {
      console.log('✅ Escalated issue created successfully:', escalationResult.issueId);
      return escalationResult.issueId;
    } else {
      console.error('❌ Failed to create escalated issue:', escalationResult.error);
      // Fallback to mock ID if database save fails
      return `SUPPORT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
  } catch (error) {
    console.error('Failed to save support case to database:', error);
    // Fallback to mock ID if database save fails
    return `SUPPORT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Helper: generate AI-powered profile summary from form data
async function generateAIProfileSummary(formData: FormData, ai: any): Promise<string> {
  try {
    console.log('generateAIProfileSummary called with ai:', ai);
    if (!ai) {
      console.log('AI not available, using fallback');
      // Fallback to basic summary if AI is not available
      const fallbackSummary = `You are a ${formData.about || 'worker'} with ${formData.experience || 'experience'} with skills including ${formData.skills || 'various skills'}, charging £${formData.hourlyRate || '0'} per hour, stationed in ${formData.location || 'your location'}, and available ${formData.availability ? 'during your specified times' : 'as needed'}.`;
      return fallbackSummary;
    }

    // Build structured prompt using ChatAI components
    const rolePrompt = buildRolePrompt('gigfolioCoach', 'profileBuilding', 'Generate a natural profile summary');
    const contextPrompt = buildContextPrompt('onboarding', 'Profile summary generation');
    const specializedPrompt = buildSpecializedPrompt('profileCreation', 'Profile summary creation', 'Create a conversational profile summary');
    
    const summaryPrompt = `${rolePrompt}

${contextPrompt}

${specializedPrompt}

Based on the following form data, create a natural summary in this format:
"You are a [job title] with [experience] with [skills] charging [hourly rate] stationed in [location], you are available [availability]..."

Form Data:
${JSON.stringify(formData, null, 2)}

Rules:
1. Be conversational and natural - like talking to a friend
2. Infer job titles from skills/experience if not explicitly stated
3. Format rates with £ symbol (e.g., "£15 per hour")
4. Make availability sound natural (e.g., "Monday to Friday 9-5")
5. Use extracted information intelligently
6. Keep it concise but comprehensive
7. Make it sound professional but friendly

Create a natural summary that flows well and sounds like a human describing the worker.`;

    const result = await geminiAIAgent(
      "gemini-2.0-flash",
      {
        prompt: summaryPrompt,
        responseSchema: Schema.object({
          properties: {
            summary: Schema.string(),
          },
        }),
        isStream: false,
      },
      ai
    );

    if (result.ok && result.data) {
      const data = result.data as { summary: string };
      console.log('AI Profile Summary generated:', data.summary);
      return data.summary;
    } else {
      console.log('AI Profile Summary failed:', result);
    }
  } catch (error) {
    console.error('AI profile summary generation failed:', error);
  }
  
  // Fallback to basic summary
  const fallbackSummary = `You are a ${formData.about || 'worker'} with ${formData.experience || 'experience'} with skills including ${formData.skills || 'various skills'}, charging £${formData.hourlyRate || '0'} per hour, stationed in ${formData.location || 'your location'}, and available ${formData.availability ? 'during your specified times' : 'as needed'}.`;
  console.log('Using fallback profile summary:', fallbackSummary);
  return fallbackSummary;
}

// Helper: generate a compact random code and build a recommendation URL
function generateRandomCode(length = 8): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // Avoid ambiguous chars
  let result = "";
  const array = new Uint32Array(length);
  if (typeof window !== 'undefined' && window.crypto?.getRandomValues) {
    window.crypto.getRandomValues(array);
    for (let i = 0; i < length; i++) {
      result += alphabet[array[i] % alphabet.length];
    }
  } else {
    for (let i = 0; i < length; i++) {
      result += alphabet[Math.floor(Math.random() * alphabet.length)];
    }
  }
  return result;
}

function buildRecommendationLink(workerProfileId: string | null): string {
  const origin = typeof window !== 'undefined' && window.location?.origin ? window.location.origin : 'http://localhost:3000';
  
  if (!workerProfileId) {
    throw new Error('Worker profile ID is required to build recommendation link');
  }
  
  // Use the worker profile ID (UUID) for the recommendation URL
  return `${origin}/worker/${workerProfileId}/recommendation`;
}

// Date and time formatting functions with better error handling
function formatDateForDisplay(dateValue: unknown): string {
  if (!dateValue || !isValidDate(dateValue)) return '';
  
  try {
    const date = new Date(dateValue as string | Date);
    return date.toLocaleDateString('en-GB', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  } catch (error) {
    console.error('Date formatting error:', error);
    return String(dateValue);
  }
}



// Helper to format summary values with better error handling
function formatSummaryValue(value: unknown, field?: string): string {
  if (!value) return "Not provided";
  
  try {
    if (field === 'location' && isValidCoordinate(value)) {
      // Check if we have a formatted address, otherwise show coordinates
      if (typeof value === 'object' && 'formatted_address' in value && (value as any).formatted_address) {
        return (value as any).formatted_address;
      }
      return `Lat: ${value.lat.toFixed(6)}, Lng: ${value.lng.toFixed(6)}`;
    }
    
    if (field === 'availability') {
      if (typeof value === 'object' && value !== null && 'days' in value) {
        const availability = value as { days: string[]; startTime: string; endTime: string };
        const weekDays = [
          { value: 'monday', label: 'Monday' },
          { value: 'tuesday', label: 'Tuesday' },
          { value: 'wednesday', label: 'Wednesday' },
          { value: 'thursday', label: 'Thursday' },
          { value: 'friday', label: 'Friday' },
          { value: 'saturday', label: 'Saturday' },
          { value: 'sunday', label: 'Sunday' }
        ];
        const days = availability.days.map((day: string) => weekDays.find(d => d.value === day)?.label).join(', ');
        return `${days} ${availability.startTime} - ${availability.endTime}`;
      }
      return formatDateForDisplay(value);
    }
    
    if (field === 'hourlyRate') {
      const numValue = typeof value === 'string' ? parseFloat(value) : value;
      return isNaN(numValue as number) ? String(value) : `£${numValue}`;
    }
    
    if (field === 'videoIntro' && typeof value === 'string' && value.startsWith('http')) {
      return "Video uploaded ✓";
    }
    
    return String(value);
  } catch (error) {
    console.error('Summary value formatting error:', error);
    return String(value);
  }
}

// Function to generate context-aware prompts using new ChatAI system
async function generateContextAwarePrompt(fieldName: string, aboutInfo: string, ai: any): Promise<string> {
  if (!fieldName || !ai) {
    console.error('Missing required parameters for prompt generation');
    return buildSpecializedPrompt('profileCreation', `Field: ${fieldName}`, `Tell me more about your ${fieldName}`);
  }

  try {
    const promptSchema = Schema.object({
      properties: {
        prompt: Schema.string(),
      },
    });

    // Build specialized prompt using ChatAI system
    const basePrompt = buildRolePrompt('gigfolioCoach', 'Profile Creation', `Generate a friendly, contextual prompt for the next question about: ${fieldName}`);
    
    // Add field-specific context
    const fieldContext = `Previous conversation context: About: "${aboutInfo || 'Not provided'}"
Next field to ask about: "${fieldName}"

Field-specific guidance for WORKERS:
- experience: Ask about their work history, relevant experience, or professional background as a worker
- skills: Ask about their specific skills, certifications, or qualifications they can offer to clients
- hourlyRate: Ask about their preferred hourly rate for their services in British Pounds (£)
- location: Ask about their location with context about finding nearby gig opportunities
- availability: Ask about when they are available to work for clients
- videoIntro: Ask about recording a video introduction to help clients get to know them
- references: Ask about references or testimonials from previous clients or employers

The prompt should:
1. Be conversational and natural - avoid repetitive phrases
2. Reference what they've already shared about themselves in a fresh way
3. Be specific to the field being asked about
4. Include relevant emojis to make it engaging
5. Provide helpful context or examples when appropriate
6. Vary your language - don't start every message the same way
7. ALWAYS stay focused on worker onboarding - this is for creating a worker profile

Be creative and natural in your responses. Don't repeat the same phrases or structure. Make each message feel fresh and conversational.`;

    const fullPrompt = `${basePrompt}\n\n${fieldContext}`;

    const result = await geminiAIAgent(
      "gemini-2.0-flash",
      {
        prompt: fullPrompt,
        responseSchema: promptSchema,
        isStream: false,
      },
      ai
    );

    if (result.ok && result.data) {
      const data = result.data as AIPromptResponse;
      return data.prompt || buildSpecializedPrompt('profileCreation', `Field: ${fieldName}`, `Tell me more about your ${fieldName}`);
    }
  } catch (error) {
    console.error('AI prompt generation failed:', error);
  }
  
  // Fallback using ChatAI system
  return buildSpecializedPrompt('profileCreation', `Field: ${fieldName}`, `Tell me more about your ${fieldName}`);
}

// AI Video Script Display Component
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

export default function OnboardWorkerPage() {
  const { user, loading: loadingAuth } = useAuth();
  const { ai } = useFirebase();
  const router = useRouter();
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const endOfChatRef = useRef<HTMLDivElement>(null);
  
  const [formData, setFormData] = useState<FormData>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentFocusedInputName, setCurrentFocusedInputName] = useState<string | null>(null);
  const [chatSteps, setChatSteps] = useState<ChatStep[]>([{
    id: 1,
    type: "bot",
    content: ROLE_SPECIFIC_PROMPTS.gigfolioCoach.welcome + " 🎉 I'm here to help you create the perfect worker profile so you can find gig opportunities! You're creating a profile to showcase your skills and availability to potential clients. Tell me about yourself and what kind of work you can offer - What's your background?",
  }, {
    id: 2,
    type: "input",
    inputConfig: {
      type: requiredFields[0].type,
      name: requiredFields[0].name,
      placeholder: requiredFields[0].placeholder,
      rows: requiredFields[0].rows,
    },
    isComplete: false,
  }]);
  const [expandedSummaryFields, setExpandedSummaryFields] = useState<Record<string, boolean>>({});
  const [isTyping, setIsTyping] = useState(false);
  const [reformulateField, setReformulateField] = useState<string | null>(null);
  const [isReformulating, setIsReformulating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);
  const [confirmedSteps, setConfirmedSteps] = useState<Set<number>>(new Set());
  const [clickedSanitizedButtons, setClickedSanitizedButtons] = useState<Set<string>>(new Set());
  
  // Unrelated response tracking
  const [unrelatedResponseCount, setUnrelatedResponseCount] = useState(0);
  const [showHumanSupport, setShowHumanSupport] = useState(false);
  const [supportCaseId, setSupportCaseId] = useState<string | null>(null);
  
  // Setup choice state management
  const [showSetupChoice, setShowSetupChoice] = useState(true);
  const [setupMode, setSetupMode] = useState<'ai' | 'manual' | null>(null);
  const [manualFormData, setManualFormData] = useState<any>({});
  
  // Worker profile ID for recommendation URL
  const [workerProfileId, setWorkerProfileId] = useState<string | null>(null);

  // Create worker profile automatically when component mounts
  useEffect(() => {
    const createProfile = async () => {
      if (!user?.token || workerProfileId) {
        return;
      }

      try {
        console.log('Creating worker profile automatically...');
        const result = await createWorkerProfileAction(user.token);
        
        if (result.success && result.workerProfileId) {
          console.log('Worker profile created successfully:', result.workerProfileId);
          setWorkerProfileId(result.workerProfileId);
        } else {
          console.error('Failed to create worker profile:', result.error);
        }
      } catch (error) {
        console.error('Error creating worker profile:', error);
      }
    };
    
    createProfile();
  }, [user?.token, workerProfileId]);

  // Helper to get next required field not in formData - matching gig creation
  const getNextRequiredField = useCallback((formData: FormData) => {
    return requiredFields.find(f => !formData[f.name]);
  }, []);

  // Helper to determine if this is the active input step - matching gig creation
  const isActiveInputStep = useCallback((step: ChatStep, idx: number) => {
    const lastIncompleteInputStep = chatSteps
      .filter(s => (s.type === 'input' || s.type === 'calendar' || s.type === 'location') && !s.isComplete)
      .pop();
    
    return step.id === lastIncompleteInputStep?.id;
  }, [chatSteps]);

  // Setup choice handlers
  const handleSetupChoice = useCallback((choice: 'ai' | 'manual') => {
    setSetupMode(choice);
    setShowSetupChoice(false);
    
    if (choice === 'manual') {
      // Initialize manual form with any existing data
      setManualFormData(formData);
    }
  }, [formData]);

  const handleSwitchToAI = useCallback(() => {
    setSetupMode('ai');
    // Transfer any manual form data to the AI flow
    setFormData(prev => ({ ...prev, ...manualFormData }));
  }, [manualFormData]);

  const handleManualFormSubmit = useCallback(async (formData: any) => {
    if (!user?.token) {
      setError('Authentication required. Please sign in again.');
      return;
    }
    
    setIsSubmitting(true);
    try {
              // Ensure all required fields are present
        const requiredData = {
          about: formData.about || '',
          experience: formData.experience || '',
          skills: formData.skills || '',
          hourlyRate: String(formData.hourlyRate || ''),
          location: formData.location || '',
          availability: formData.availability || { days: [], startTime: '09:00', endTime: '17:00' },
          videoIntro: formData.videoIntro || '',
          time: formData.time || '',
          jobTitle: formData.jobTitle || ''
        };
      
      // Save the profile data to database
      const result = await saveWorkerProfileFromOnboardingAction(requiredData, user.token);
      if (result.success) {
        // Navigate to worker dashboard
        router.push(`/user/${user?.uid}/worker`);
      } else {
        setError('Failed to save profile. Please try again.');
      }
    } catch (error) {
      console.error('Manual form submission error:', error);
      setError('Failed to save profile. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }, [router, user?.uid, user?.token]);

  const handleResetChoice = useCallback(() => {
    setShowSetupChoice(true);
    setSetupMode(null);
    setManualFormData({});
  }, []);

  // AI validation function using new ChatAI system
  const simpleAICheck = useCallback(async (field: string, value: unknown, type: string): Promise<{ sufficient: boolean, clarificationPrompt?: string, sanitized?: string | unknown, naturalSummary?: string, extractedData?: string }> => {
    if (!value) {
      return { 
        sufficient: false, 
        clarificationPrompt: 'Please provide some information so I can help you create the perfect worker profile!'
      };
    }

    const trimmedValue = String(value).trim();
    
    // Use AI for all validation
    try {
      if (!ai) {
        console.error('AI service not available');
        setError('AI service temporarily unavailable. Please try again.');
        return { sufficient: true, sanitized: trimmedValue }; // Fallback to accept input
      }
             const validationSchema = Schema.object({
         properties: {
           isAppropriate: Schema.boolean(),
           isWorkerRelated: Schema.boolean(),
           isSufficient: Schema.boolean(),
           clarificationPrompt: Schema.string(),
           sanitizedValue: Schema.string(),
           naturalSummary: Schema.string(),
           extractedData: Schema.string(), // Store as JSON string to avoid complex schema
         },
       });

      // Build validation prompt using ChatAI system
      const basePrompt = buildRolePrompt('gigfolioCoach', 'Profile Validation', `Validate and intelligently sanitize the following input for field: ${field}`);
      
      const validationContext = `Previous context from this conversation:
${Object.entries(formData).filter(([key, value]) => value && key !== field).map(([key, value]) => `${key}: ${value}`).join(', ')}

Current field being validated: "${field}"
User input: "${trimmedValue}"
Input type: "${type}"

ENHANCED VALIDATION & SANITIZATION REQUIREMENTS:

1. **Basic Validation:**
   - isAppropriate: Check if content is appropriate for professional worker profile
   - isWorkerRelated: Check if content relates to worker skills/experience (be VERY lenient)
   - isSufficient: Check if content provides basic information

2. **Intelligent Sanitization & Data Extraction:**
   - naturalSummary: Create a natural, conversational summary for user confirmation
   - extractedData: Extract and structure key information as JSON string

3. **Field-Specific Intelligence:**
   - **experience**: Infer job title from context, extract duration, format naturally
     Example: "25 years of experience" → "Ah, so you have 25 years of experience as a cashier, right?"
   - **hourlyRate**: Convert to pounds (£), format properly
     Example: "15" → "Got it, you're charging £15 per hour, correct?"
   - **location**: Extract coordinates, format address naturally
   - **availability**: Extract days, times, format as natural schedule
   - **skills**: Extract skill names, categorize, format naturally

4. **Natural Summary Examples:**
   - User: "25 years of experience" → AI: "Got it, you have 25 years of experience as a cashier, right?"
   - User: "15" → AI: "Perfect! You're charging £15 per hour for your services, correct?"
   - User: "Monday to Friday 9-5" → AI: "So you're available Monday to Friday from 9 AM to 5 PM, right?"

5. **Data Extraction Format (JSON string):**
   {
     "jobTitle": "cashier",
     "duration": "25 years",
     "rate": "£15",
     "location": "London",
     "skills": ["customer service", "cash handling"]
   }

IMPORTANT: Always provide a naturalSummary that asks for user confirmation in a conversational way. The user should feel like you're understanding and confirming their input, not just processing it.

If validation passes, respond with:
- isAppropriate: true
- isWorkerRelated: true
- isSufficient: true
- clarificationPrompt: ""
- sanitizedValue: string (cleaned version)
- naturalSummary: string (natural confirmation question)
- extractedData: string (JSON string of extracted data)

If validation fails, respond with:
- isAppropriate: boolean
- isWorkerRelated: boolean
- isSufficient: boolean
- clarificationPrompt: string (friendly guidance)
- sanitizedValue: string
- naturalSummary: string
- extractedData: string

WORKER ONBOARDING CONTEXT: Remember, this user is creating a worker profile to find gig opportunities. They are the worker/employee looking to be hired. Keep responses focused on worker onboarding only.

Be conversational, intelligent, and always ask for confirmation in natural language.`;

      const fullPrompt = `${basePrompt}\n\n${validationContext}`;

      const result = await geminiAIAgent(
        "gemini-2.0-flash",
        {
          prompt: fullPrompt,
          responseSchema: validationSchema,
          isStream: false,
        },
        ai
      );

      if (result.ok && result.data) {
        const validation = result.data as AIValidationResponse;
        
        if (!validation.isAppropriate || !validation.isWorkerRelated || !validation.isSufficient) {
          return {
            sufficient: false,
            clarificationPrompt: validation.clarificationPrompt || 'Please provide appropriate worker-related information.',
          };
        }
        
        // For coordinate objects, preserve the original object
        if (isValidCoordinate(value)) {
          return {
            sufficient: true,
            sanitized: value, // Keep the original coordinate object
          };
        }
        
        // For date fields, ensure proper date format
        if (field === 'availability') {
          try {
            // If it's already a valid date string without time, keep it
            if (typeof value === 'string' && value.match(/^\d{4}-\d{2}-\d{2}$/)) {
              return {
                sufficient: true,
                sanitized: value,
              };
            }
            // If it's an ISO string with time, extract just the date part
            if (typeof value === 'string' && value.includes('T')) {
              return {
                sufficient: true,
                sanitized: value.split('T')[0],
              };
            }
            // If it's a Date object, convert to date string
            if (value instanceof Date) {
              return {
                sufficient: true,
                sanitized: value.toISOString().split('T')[0], // Get just the date part
              };
            }
          } catch (error) {
            console.error('Date validation error:', error);
          }
        }
        

        
        return {
          sufficient: true,
          sanitized: validation.sanitizedValue || trimmedValue,
          naturalSummary: validation.naturalSummary,
          extractedData: validation.extractedData
        };
      }
    } catch (error) {
      console.error('AI validation failed:', error);
      setError('AI validation failed. Please try again.');
      
      // Check if we should escalate due to AI failure
      const escalationTrigger = detectEscalationTriggers('AI processing failed', {
        retryCount: 1,
        conversationLength: chatSteps.length,
        userRole: 'worker',
        gigId: undefined
      });

      if (escalationTrigger.shouldEscalate) {
        console.log('🚨 Escalation triggered due to AI failure:', escalationTrigger);
        
        const description = generateEscalationDescription(escalationTrigger, 'AI validation failed', {
          userRole: 'worker',
          conversationLength: chatSteps.length
        });

        // Note: We can't await here since this is in a catch block, so we'll handle it in the calling function
        // The escalation will be handled when the user tries to submit again
      }
    }
    
    // Simple fallback - accept most inputs
    return { sufficient: true, sanitized: trimmedValue };
  }, [formData, ai]);

  // Handle input submission with better error handling
  const handleInputSubmit = useCallback(async (stepId: number, inputName: string, inputValue?: string) => {
    const valueToUse = inputValue ?? formData[inputName];
    if (!valueToUse) {
      console.warn('No value provided for input:', inputName);
      return;
    }
    
    try {
      // Check for escalation triggers in user input
      if (typeof valueToUse === 'string') {
        const escalationTrigger = detectEscalationTriggers(valueToUse, {
          retryCount: 0, // Could track this if needed
          conversationLength: chatSteps.length,
          userRole: 'worker',
          gigId: undefined
        });

        if (escalationTrigger.shouldEscalate) {
          console.log('🚨 Escalation trigger detected:', escalationTrigger);
          
          const description = generateEscalationDescription(escalationTrigger, valueToUse, {
            userRole: 'worker',
            conversationLength: chatSteps.length
          });

          const caseId = await saveSupportCaseToDatabase(
            { userId: user?.uid, formData },
            chatSteps,
            description
          );
          
          setSupportCaseId(caseId);
          setShowHumanSupport(true);
          
          setChatSteps(prev => [
            ...prev,
            {
              id: Date.now() + 1,
              type: 'bot',
              content: `I understand you're having trouble with the AI onboarding process. I've created a support case (${caseId}) and our team will be in touch shortly.`,
              isNew: true,
            },
            {
              id: Date.now() + 2,
              type: 'support',
              isNew: true,
            }
          ]);
          
          return;
        }
      }

      // Check if this is an unrelated response
      const currentStep = chatSteps.find(s => s.id === stepId);
      
      // Find the most recent bot message before this input step to get the question
      const currentStepIndex = chatSteps.findIndex(s => s.id === stepId);
      const previousBotMessage = chatSteps
        .slice(0, currentStepIndex)
        .reverse()
        .find(s => s.type === 'bot' && s.content);
      
      if (previousBotMessage && previousBotMessage.content) {
        console.log('Checking unrelated response:', { userInput: valueToUse, botQuestion: previousBotMessage.content });
        const isUnrelated = isUnrelatedResponse(valueToUse, previousBotMessage.content);
        
        if (isUnrelated) {
          console.log('Unrelated response detected!', { userInput: valueToUse, botQuestion: previousBotMessage.content });
          const newCount = unrelatedResponseCount + 1;
          setUnrelatedResponseCount(newCount);
          console.log('Unrelated response count:', newCount);
          
          if (newCount >= 3) {
            // Escalate to human support after 3 unrelated responses
            const caseId = await saveSupportCaseToDatabase(
              { userId: user?.uid, formData },
              chatSteps,
              'Multiple unrelated responses - user struggling with AI onboarding'
            );
            setSupportCaseId(caseId);
            setShowHumanSupport(true);
            
            setChatSteps(prev => [
              ...prev,
              {
                id: Date.now() + 1,
                type: 'bot',
                content: `I understand you're having trouble with the AI onboarding process. I've created a support case (${caseId}) and our team will be in touch shortly.`,
                isNew: true,
              },
              {
                id: Date.now() + 2,
                type: 'support',
                isNew: true,
              }
            ]);
            
            return;
          } else {
            // Add a gentle reminder about staying on topic
            setChatSteps(prev => [
              ...prev,
              {
                id: Date.now() + 1,
                type: 'bot',
                content: `I notice your response might not be related to the current question. Please try to answer the specific question I asked. If you need help, you can ask me to clarify. (Unrelated response ${newCount}/3)`,
                isNew: true,
              }
            ]);
            
            return;
          }
        }
      }
      
      // Get input type from the current step
      const inputType = currentStep?.inputConfig?.type || 'text';
      
      // Check if this is a reformulation
      const isReformulation = reformulateField === inputName;
      
      // Mark the current step as complete to disable the input
      setChatSteps((prev) => prev.map((step) =>
        step.id === stepId ? { ...step, isComplete: true } : step
      ));
      
      // Add typing indicator for AI processing
      setChatSteps((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          type: "typing",
          isNew: true,
        },
      ]);

      const aiResult = await simpleAICheck(inputName, valueToUse, inputType);

      // Remove typing indicator and mark current step as complete
      setChatSteps((prev) => {
        const filtered = prev.filter(s => s.type !== 'typing');
        
        return filtered.map((step) =>
          step.id === stepId ? { ...step, isComplete: true } : step
        );
      });
      
      if (!aiResult.sufficient) {
        // Add clarification message and re-open the same input step to collect a better answer
        setChatSteps((prev) => {
          const reopenedType: "input" | "calendar" | "location" =
            currentStep?.type === 'location' ? 'location' :
            currentStep?.type === 'calendar' ? 'calendar' :
            'input';
          const reopenedInputConfig = currentStep?.inputConfig ?? {
            type: 'text',
            name: inputName,
            placeholder: '',
          };
          const nextSteps: ChatStep[] = [
            ...prev,
            { 
              id: Date.now() + 2, 
              type: 'bot', 
              content: aiResult.clarificationPrompt!,
              isNew: true,
            },
            {
              id: Date.now() + 3,
              type: reopenedType,
              inputConfig: reopenedInputConfig,
              isComplete: false,
              isNew: true,
            },
          ];
          return nextSteps;
        });
        // Focus the same input name on next render
        setCurrentFocusedInputName(inputName);
        return;
      }
      
      // If this is a reformulation, update the form data and proceed to next field
      // instead of showing sanitized confirmation again
      if (isReformulation) {
        // Update form data with the new value
        setFormData(prev => ({ ...prev, [inputName]: aiResult.sanitized }));
        
        // Reset reformulating state and clear reformulateField
        setIsReformulating(false);
        setReformulateField(null);
        
        // Find next required field
        const updatedFormData = { ...formData, [inputName]: aiResult.sanitized };
        const nextField = getNextRequiredField(updatedFormData);
        
                 if (nextField) {
           // Special handling: auto-generate references link instead of asking for input
           if (nextField.name === 'references') {
            // Use existing worker profile ID
            if (!workerProfileId) {
              console.error('Worker profile not yet created');
              return;
            }
            
            const recommendationLink = buildRecommendationLink(workerProfileId);
             const afterRefFormData = { ...updatedFormData, references: recommendationLink };
             setFormData(afterRefFormData);

             // Add combined reference message with embedded link and gigfolio info
             setChatSteps((prev) => [
               ...prev,
               {
                 id: Date.now() + 3,
                 type: "bot",
                 content: `You need two references (at least one recommendation per skill) from previous managers, colleagues or teachers. If you don't have experience you can get a reference from a friend or someone in your network.\n\nSend this link to get your reference: ${recommendationLink}\n\nPlease check out your gigfolio and share with your network - if your connections make a hire on Able you get £5!`,
                 isNew: true,
               }
             ]);

             setTimeout(() => {
               setChatSteps((prev) => [
                 ...prev,
                 {
                   id: Date.now() + 4,
                   type: "bot",
                   content: "Watch out for notifications of your first shift offer! If you don't accept within 90 minutes we will offer the gig to someone else.",
                   isNew: true,
                 }
               ]);
             }, 1500);

             setTimeout(() => {
               setChatSteps((prev) => [
                 ...prev,
                 {
                   id: Date.now() + 5,
                   type: "bot",
                   content: "We might offer you gigs outside of your defined skill area, watch out for those opportunities too!",
                   isNew: true,
                 }
               ]);
             }, 3000);

             // Add next field or summary after all reference messages are shown
             setTimeout(async () => {
               const nextAfterReferences = getNextRequiredField(afterRefFormData);
               if (nextAfterReferences) {
                 const aboutInfo = afterRefFormData.about || '';
                 const contextAwarePrompt = await generateContextAwarePrompt(nextAfterReferences.name, aboutInfo, ai);
                 const newInputConfig = {
                   type: nextAfterReferences.type as FormInputType,
                   name: nextAfterReferences.name,
                   placeholder: nextAfterReferences.placeholder,
                   ...(nextAfterReferences.rows && { rows: nextAfterReferences.rows }),
                 };
                 let stepType: "input" | "calendar" | "location" | "video" | "availability" = "input";
                 if (nextAfterReferences.name === "availability") stepType = "availability";
                 else if (nextAfterReferences.name === "location") stepType = "location";
                 else if (nextAfterReferences.name === "videoIntro") stepType = "video";

                 setChatSteps((prev) => [
                   ...prev,
                   {
                     id: Date.now() + 6,
                     type: "bot",
                     content: contextAwarePrompt,
                     isNew: true,
                   },
                   {
                     id: Date.now() + 7,
                     type: stepType,
                     inputConfig: newInputConfig,
                     isComplete: false,
                     isNew: true,
                   },
                 ]);
               } else {
                 // No more fields -> Show final confirmation button
                 setChatSteps((prev) => [
                   ...prev,
                   {
                     id: Date.now() + 6,
                     type: "summary",
                     summaryData: afterRefFormData,
                     isNew: true,
                   },
                 ]);
               }
             }, 4500);
             return;
           }
          // Generate context-aware prompt for next field
          const aboutInfo = updatedFormData.about || '';
          const contextAwarePrompt = await generateContextAwarePrompt(nextField.name, aboutInfo, ai);
          
          const newInputConfig = {
            type: nextField.type as FormInputType,
            name: nextField.name,
            placeholder: nextField.placeholder,
            ...(nextField.rows && { rows: nextField.rows }),
          };
          
          // Determine the step type based on the field
          let stepType: "input" | "calendar" | "location" | "video" | "availability" = "input";
          if (nextField.name === "availability") {
            stepType = "availability";
          } else if (nextField.name === "location") {
            stepType = "location";
          } else if (nextField.name === "videoIntro") {
            stepType = "video";
          }
          
          setChatSteps((prev) => [
            ...prev,
            {
              id: Date.now() + 6,
              type: "bot",
              content: contextAwarePrompt,
              isNew: true,
            },
            {
              id: Date.now() + 7,
              type: stepType,
              inputConfig: newInputConfig,
              isComplete: false,
              isNew: true,
            },
          ]);
        } else {
          // All fields collected, show final confirmation button
          setChatSteps((prev) => [
            ...prev,
            {
              id: Date.now() + 5,
              type: "summary",
              summaryData: updatedFormData,
              isNew: true,
            },
          ]);
        }
      } else {
              // Check if this is an experience-related field that should trigger job title interpretation
      if (inputName === 'experience' || inputName === 'about') {
        // Try to interpret job title from user input
        const jobTitleResult = await interpretJobTitle(valueToUse, ai);
        
        if (jobTitleResult && jobTitleResult.confidence >= 50) {
          // Show job title confirmation step
          setChatSteps((prev) => [
            ...prev,
            { 
              id: Date.now() + 3, 
              type: "jobTitleConfirmation",
              fieldName: inputName,
              originalValue: valueToUse,
              suggestedJobTitle: jobTitleResult.jobTitle,
              confidence: jobTitleResult.confidence,
              matchedTerms: jobTitleResult.matchedTerms,
              isAISuggested: jobTitleResult.isAISuggested,
              isNew: true,
            },
          ]);
        } else {
          // Show regular sanitized confirmation step
          setChatSteps((prev) => [
            ...prev,
            { 
              id: Date.now() + 3, 
              type: "sanitized",
              fieldName: inputName,
              sanitizedValue: aiResult.sanitized!,
              originalValue: valueToUse,
              naturalSummary: aiResult.naturalSummary,
              extractedData: aiResult.extractedData,
              isNew: true,
            },
          ]);
        }
      } else {
        // Show sanitized confirmation step for regular inputs (not reformulations)
        setChatSteps((prev) => [
          ...prev,
          { 
            id: Date.now() + 3, 
            type: "sanitized",
            fieldName: inputName,
            sanitizedValue: aiResult.sanitized!,
            originalValue: valueToUse,
            naturalSummary: aiResult.naturalSummary,
            extractedData: aiResult.extractedData,
            isNew: true,
          },
        ]);
      }
      }
    } catch (error) {
      console.error("Error processing input:", error);
      setError('Failed to process input. Please try again.');
      
      // Reset reformulating state if this was a reformulation
      if (reformulateField === inputName) {
        setIsReformulating(false);
        setReformulateField(null);
      }
    }
  }, [formData, chatSteps, simpleAICheck, reformulateField, getNextRequiredField, ai]);

  // Handle job title confirmation
  const handleJobTitleConfirm = useCallback(async (fieldName: string, suggestedJobTitle: string, originalValue: string) => {
    try {
      // Update formData with the standardized job title
      const updatedFormData = { ...formData, [fieldName]: suggestedJobTitle };
      setFormData(updatedFormData);
      
      // Mark job title confirmation step as complete (like sanitization)
      setChatSteps((prev) => prev.map((step) =>
        step.type === "jobTitleConfirmation" && step.fieldName === fieldName ? { ...step, isComplete: true } : step
      ));
      
      // Find next required field using updated formData
      const nextField = getNextRequiredField(updatedFormData);
      
      if (nextField) {
        // Continue with next field
        const contextAwarePrompt = await generateContextAwarePrompt(nextField.name, nextField.defaultPrompt, ai);
        const newInputConfig = {
          type: nextField.type,
          name: nextField.name,
          placeholder: nextField.placeholder,
          ...(nextField.rows && { rows: nextField.rows }),
        };
        
        // Determine the step type based on the field
        let stepType: "input" | "calendar" | "location" | "video" | "availability" = "input";
        if (nextField.name === "availability") {
          stepType = "availability";
        } else if (nextField.name === "location") {
          stepType = "location";
        } else if (nextField.name === "videoIntro") {
          stepType = "video";
        }
        
        setChatSteps((prev) => [
          ...prev,
          {
            id: Date.now() + 6,
            type: "bot",
            content: contextAwarePrompt,
            isNew: true,
          },
          {
            id: Date.now() + 7,
            type: stepType,
            inputConfig: newInputConfig,
            isComplete: false,
            isNew: true,
          },
        ]);
      } else {
        // All fields collected, show final confirmation button
        setChatSteps((prev) => [
          ...prev,
          {
            id: Date.now() + 5,
            type: "summary",
            summaryData: updatedFormData,
            isNew: true,
          },
        ]);
      }
    } catch (error) {
      console.error("Error confirming job title:", error);
      setError('Failed to confirm job title. Please try again.');
    }
  }, [formData, chatSteps, getNextRequiredField, ai]);

  // Handle job title rejection
  const handleJobTitleReject = useCallback(async (fieldName: string, originalValue: string) => {
    try {
      // Keep the original value
      const updatedFormData = { ...formData, [fieldName]: originalValue };
      setFormData(updatedFormData);
      
      // Mark job title confirmation step as complete (like sanitization)
      setChatSteps((prev) => prev.map((step) =>
        step.type === "jobTitleConfirmation" && step.fieldName === fieldName ? { ...step, isComplete: true } : step
      ));
      
      // Find next required field using updated formData
      const nextField = getNextRequiredField(updatedFormData);
      
      if (nextField) {
        // Continue with next field
        const contextAwarePrompt = await generateContextAwarePrompt(nextField.name, nextField.defaultPrompt, ai);
        const newInputConfig = {
          type: nextField.type,
          name: nextField.name,
          placeholder: nextField.placeholder,
          ...(nextField.rows && { rows: nextField.rows }),
        };
        
        // Determine the step type based on the field
        let stepType: "input" | "calendar" | "location" | "video" | "availability" = "input";
        if (nextField.name === "availability") {
          stepType = "availability";
        } else if (nextField.name === "location") {
          stepType = "location";
        } else if (nextField.name === "videoIntro") {
          stepType = "video";
        }
        
        setChatSteps((prev) => [
          ...prev,
          {
            id: Date.now() + 6,
            type: "bot",
            content: contextAwarePrompt,
            isNew: true,
          },
          {
            id: Date.now() + 7,
            type: stepType,
            inputConfig: newInputConfig,
            isComplete: false,
            isNew: true,
          },
        ]);
      } else {
        // All fields collected, show final confirmation button
        setChatSteps((prev) => [
          ...prev,
          {
            id: Date.now() + 5,
            type: "summary",
            summaryData: updatedFormData,
            isNew: true,
          },
        ]);
      }
    } catch (error) {
      console.error("Error rejecting job title:", error);
      setError('Failed to process job title rejection. Please try again.');
    }
  }, [formData, chatSteps, getNextRequiredField, ai]);

  // Handle sanitized confirmation with better error handling
  const handleSanitizedConfirm = useCallback(async (fieldName: string, sanitized: string | unknown) => {
    try {
      // Reset reformulating state
      setIsReformulating(false);
      setReformulateField(null);
      
      // Track clicked button
      setClickedSanitizedButtons(prev => new Set([...prev, `${fieldName}-confirm`]));
      
      // Update formData first
      const updatedFormData = { ...formData, [fieldName]: sanitized };
      setFormData(updatedFormData);
      
      // Mark sanitized step as complete
      setChatSteps((prev) => prev.map((step) =>
        step.type === "sanitized" && step.fieldName === fieldName ? { ...step, isComplete: true } : step
      ));
      
      // Find next required field using updated formData
      const nextField = getNextRequiredField(updatedFormData);
      
      if (nextField) {
        // Special handling: auto-generate references link instead of asking for input
        if (nextField.name === 'references') {
                  // Use existing worker profile ID
        if (!workerProfileId) {
          console.error('Worker profile not yet created');
          return;
        }
        
        const recommendationLink = buildRecommendationLink(workerProfileId);
          const afterRefFormData = { ...formData, [fieldName]: sanitized, references: recommendationLink };
          setFormData(afterRefFormData);

          // Add combined reference message with embedded link and gigfolio info
          setChatSteps((prev) => [
            ...prev,
            {
              id: Date.now() + 2,
              type: "bot",
              content: `You need two references (at least one recommendation per skill) from previous managers, colleagues or teachers. If you don't have experience you can get a reference from a friend or someone in your network.\n\nSend this link to get your reference: ${recommendationLink}\n\nPlease check out your gigfolio and share with your network - if your connections make a hire on Able you get £5!`,
              isNew: true,
            }
          ]);

          setTimeout(() => {
            setChatSteps((prev) => [
              ...prev,
              {
                id: Date.now() + 3,
                type: "bot",
                content: "Watch out for notifications of your first shift offer! If you don't accept within 90 minutes we will offer the gig to someone else.",
                isNew: true,
              }
            ]);
          }, 1500);

          setTimeout(() => {
            setChatSteps((prev) => [
              ...prev,
              {
                id: Date.now() + 4,
                type: "bot",
                content: "We might offer you gigs outside of your defined skill area, watch out for those opportunities too!",
                isNew: true,
              }
            ]);
          }, 3000);

          // Add next field or summary after all reference messages are shown
          setTimeout(async () => {
            const nextAfterReferences = getNextRequiredField(afterRefFormData);
            if (nextAfterReferences) {
              const aboutInfo = afterRefFormData.about || '';
              const contextAwarePrompt = await generateContextAwarePrompt(nextAfterReferences.name, aboutInfo, ai);
              const newInputConfig = {
                type: nextAfterReferences.type as FormInputType,
                name: nextAfterReferences.name,
                placeholder: nextAfterReferences.placeholder,
                ...(nextAfterReferences.rows && { rows: nextAfterReferences.rows }),
              };
              setChatSteps((prev) => [
                ...prev,
                {
                  id: Date.now() + 5,
                  type: "bot",
                  content: contextAwarePrompt,
                  isNew: true,
                },
                {
                  id: Date.now() + 6,
                  type: nextAfterReferences.type === "location" ? "location" : nextAfterReferences.type === "availability" ? "availability" : nextAfterReferences.type === "date" ? "calendar" : nextAfterReferences.type === "video" ? "video" : "input",
                  inputConfig: newInputConfig,
                  isComplete: false,
                  isNew: true,
                },
              ]);
            } else {
              // No more fields -> summary
              // Add typing indicator first
              setChatSteps((prev) => [
                ...prev,
                {
                  id: Date.now() + 4,
                  type: "typing",
                  isNew: true,
                },
              ]);
              
              setTimeout(async () => {
                const aiSummary = await generateAIProfileSummary(afterRefFormData, ai);
                setChatSteps((prev) => {
                  // Remove typing indicator and add AI-powered summary
                  const filtered = prev.filter(s => s.type !== 'typing');
                  return [
                    ...filtered,
                    {
                      id: Date.now() + 5,
                      type: "bot",
                      content: `Perfect! ${aiSummary}`,
                      isNew: true,
                    },
                    {
                      id: Date.now() + 6,
                      type: "summary",
                      summaryData: afterRefFormData,
                      isNew: true,
                    },
                  ];
                });
              }, 700);
            }
          }, 4500);
          return;
        }
        // Generate context-aware prompt
        const aboutInfo = updatedFormData.about || (fieldName === 'about' ? (typeof sanitized === 'string' ? sanitized : JSON.stringify(sanitized)) : '');
        
        // Add typing indicator first
        setChatSteps((prev) => [
          ...prev,
          {
            id: Date.now() + 2,
            type: "typing",
            isNew: true,
          },
        ]);
        
        // Generate AI prompt
        setTimeout(async () => {
          const contextAwarePrompt = await generateContextAwarePrompt(nextField.name, aboutInfo, ai);
          
          setChatSteps((prev) => {
            // Remove typing indicator and add bot message and input
            const filtered = prev.filter(s => s.type !== 'typing');
            const newInputConfig = {
              type: nextField.type as FormInputType,
              name: nextField.name,
              placeholder: nextField.placeholder,
              ...(nextField.rows && { rows: nextField.rows }),
            };
            
            return [
              ...filtered,
              {
                id: Date.now() + 3,
                type: "bot",
                content: contextAwarePrompt,
                isNew: true,
              },
              {
                id: Date.now() + 4,
                type: nextField.type === "location" ? "location" : nextField.type === "date" ? "calendar" : nextField.type === "video" ? "video" : "input",
                inputConfig: newInputConfig,
                isComplete: false,
                isNew: true,
              },
            ];
          });
        }, 700);
      } else {
        // All fields collected, show summary
        // Add typing indicator first
        setChatSteps((prev) => [
          ...prev,
          {
            id: Date.now() + 4,
            type: "typing",
            isNew: true,
          },
        ]);
        
        setTimeout(async () => {
          setChatSteps((prev) => {
            // Remove typing indicator and add summary step
            const filtered = prev.filter(s => s.type !== 'typing');
            return [
              ...filtered,
              {
                id: Date.now() + 5,
                type: "summary",
                summaryData: updatedFormData,
                isNew: true,
              },
            ];
          });
        }, 700);
      }
    } catch (error) {
      console.error('Error in sanitized confirmation:', error);
      setError('Failed to process confirmation. Please try again.');
    }
  }, [formData, getNextRequiredField, ai]);

  const handleSanitizedReformulate = (fieldName: string) => {
    if (isReformulating) return; // Prevent multiple clicks
    setReformulateField(fieldName);
    setClickedSanitizedButtons(prev => new Set([...prev, `${fieldName}-reformulate`]));
  };

  const handlePickerConfirm = useCallback(async (stepId: number, inputName: string) => {
    setIsConfirming(true);
    setConfirmedSteps(prev => new Set([...prev, stepId]));

    // Mark the current step as complete
    setChatSteps(prev => prev.map(step => 
      step.id === stepId ? { ...step, isComplete: true } : step
    ));

    // Add typing indicator
    setChatSteps(prev => [
      ...prev,
      {
        id: Date.now() + 1,
        type: "typing",
        isNew: true,
      },
    ]);

    // Update form data
    const currentValue = formData[inputName];
    setFormData(prev => ({ ...prev, [inputName]: currentValue }));

    // Find next required field
    const nextField = getNextRequiredField({ ...formData, [inputName]: currentValue });

    if (nextField) {
              // Special handling: auto-generate references link instead of asking for input
        if (nextField.name === 'references') {
                  // Use existing worker profile ID
        if (!workerProfileId) {
          console.error('Worker profile not yet created');
          return;
        }
        
        const recommendationLink = buildRecommendationLink(workerProfileId);
        const afterRefFormData = { ...formData, references: recommendationLink };
        setFormData(afterRefFormData);

        // Add combined reference message with embedded link and gigfolio info
        setChatSteps(prev => [
          ...prev,
          {
            id: Date.now() + 2,
            type: "bot",
            content: `You need two references (at least one recommendation per skill) from previous managers, colleagues or teachers. If you don't have experience you can get a reference from a friend or someone in your network.\n\nSend this link to get your reference: ${recommendationLink}\n\nPlease check out your gigfolio and share with your network - if your connections make a hire on Able you get £5!`,
            isNew: true,
          }
        ]);

        const nextAfterReferences = getNextRequiredField(afterRefFormData);
        if (nextAfterReferences) {
          const contextAwarePrompt = await generateContextAwarePrompt(nextAfterReferences.name, formData.about || '', ai);
          setTimeout(() => {
            setChatSteps(prev => {
              const filtered = prev.filter(s => s.type !== 'typing');
              return [
                ...filtered,
                {
                  id: Date.now() + 4,
                  type: "bot",
                  content: contextAwarePrompt,
                  isNew: true,
                },
                {
                  id: Date.now() + 5,
                  type: nextAfterReferences.type === "location" ? "location" : nextAfterReferences.type === "availability" ? "availability" : nextAfterReferences.type === "date" ? "calendar" : nextAfterReferences.type === "video" ? "video" : "input",
                  inputConfig: {
                    type: nextAfterReferences.type,
                    name: nextAfterReferences.name,
                    placeholder: nextAfterReferences.placeholder,
                    rows: nextAfterReferences.rows,
                  },
                  isComplete: false,
                  isNew: true,
                },
              ];
            });
          }, 700);
        } else {
          setTimeout(async () => {
            setChatSteps(prev => {
              const filtered = prev.filter(s => s.type !== 'typing');
              return [
                ...filtered,
                {
                  id: Date.now() + 6,
                  type: "summary",
                  summaryData: afterRefFormData,
                  isNew: true,
                },
              ];
            });
          }, 700);
        }
        setIsConfirming(false);
        return;
      }
      // Generate context-aware prompt
      const contextAwarePrompt = await generateContextAwarePrompt(nextField.name, formData.about || '', ai);

      setTimeout(() => {
        setChatSteps(prev => {
          // Remove typing indicator and add bot message and next input/picker step
          const filtered = prev.filter(s => s.type !== 'typing');
          return [
            ...filtered,
            {
              id: Date.now() + 2,
              type: "bot",
              content: contextAwarePrompt,
              isNew: true,
            },
            {
              id: Date.now() + 3,
              type: nextField.type === "location" ? "location" : nextField.type === "availability" ? "availability" : nextField.type === "date" ? "calendar" : nextField.type === "video" ? "video" : "input",
              inputConfig: {
                type: nextField.type,
                name: nextField.name,
                placeholder: nextField.placeholder,
                rows: nextField.rows,
              },
              isComplete: false,
            },
          ];
        });
      }, 700);
    } else {
      // All fields completed, show summary step
      setTimeout(async () => {
        setChatSteps(prev => {
          const filtered = prev.filter(s => s.type !== 'typing');
          return [
            ...filtered,
            {
              id: Date.now() + 2,
              type: "summary",
              summaryData: { ...formData, [inputName]: currentValue },
              isNew: true,
            },
          ];
        });
      }, 700);
    }

    setIsConfirming(false);
  }, [formData, ai, getNextRequiredField]);

  // Handle input changes with better validation
  const handleInputChange = useCallback((name: string, value: unknown) => {
    try {
      // Special handling for availability fields
      if (name === 'availability') {
        // If it's already an object with days array, use it as is
        if (typeof value === 'object' && value !== null && 'days' in value) {
          setFormData((prev) => ({ ...prev, [name]: value }));
        } else if (value) {
          // Legacy handling for string/date values - convert to new format
          let processedValue = value;
          
          // If it's an ISO string with time, extract just the date part
          if (typeof value === 'string' && value.includes('T')) {
            processedValue = value.split('T')[0];
          }
          
          // If it's a Date object, convert to date string
          if (value instanceof Date) {
            processedValue = value.toISOString().split('T')[0];
          }
          
          // Convert to new availability format
          setFormData((prev) => ({ 
            ...prev, 
            [name]: {
              days: [],
              startTime: '09:00',
              endTime: '17:00'
            }
          }));
        } else {
          // Initialize with default availability structure
          setFormData((prev) => ({ 
            ...prev, 
            [name]: {
              days: [],
              startTime: '09:00',
              endTime: '17:00'
            }
          }));
        }
      } else {
        setFormData((prev) => ({ ...prev, [name]: value }));
      }
    } catch (error) {
      console.error('Error handling input change:', error);
      setError('Failed to update input. Please try again.');
    }
  }, []);

  // Handle video upload with better error handling
  const handleVideoUpload = useCallback(async (file: Blob, name?: string, stepId?: number) => {
    if (!user || !name || stepId === undefined) {
      console.error('Missing required parameters for video upload');
      setError('Failed to upload video. Please try again.');
      return;
    }

    if (!file || file.size === 0) {
      console.error('Invalid file for video upload');
      setError('Invalid video file. Please try again.');
      return;
    }

    // Check file size (limit to 50MB)
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      setError('Video file too large. Please use a file smaller than 50MB.');
      return;
    }

    try {
      const filePath = `workers/${user.uid}/introVideo/introduction-${encodeURI(user.email ?? user.uid)}.webm`;
      const fileStorageRef = storageRef(getStorage(firebaseApp), filePath);
      const uploadTask = uploadBytesResumable(fileStorageRef, file);

      uploadTask.on(
        "state_changed",
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          // Progress handling if needed
        },
        (error) => {
          console.error("Upload failed:", error);
          setError('Video upload failed. Please try again.');
        },
        () => {
          getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
            updateVideoUrlProfileAction(user.token, downloadURL);
            handleInputChange(name, downloadURL);
            
            // Show sanitized confirmation step for video (with confirm/reformulate buttons)
            setChatSteps((prev) => [
              ...prev,
              {
                id: Date.now() + 1,
                type: "sanitized",
                fieldName: name,
                sanitizedValue: "Video introduction recorded successfully! 🎥",
                originalValue: "Video uploaded",
                naturalSummary: "I saved the video introduction! 🎥",
                extractedData: JSON.stringify({ videoIntro: downloadURL }),
                isNew: true,
              }
            ]);
          }).catch((error) => {
            console.error('Failed to get download URL:', error);
            setError('Failed to get video URL. Please try again.');
          });
        }
      );
    } catch (error) {
      console.error('Video upload error:', error);
      setError('Failed to upload video. Please try again.');
    }
  }, [user, handleInputChange, handleInputSubmit]);

  // Auto-scroll to the bottom whenever chatSteps or isTyping changes
  useEffect(() => {
    if (endOfChatRef.current) {
      endOfChatRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatSteps, isTyping]);

  // Initial setup
  useEffect(() => {
    if (user?.uid) {
      setFormData({});
             setChatSteps([{
         id: 1,
         type: "bot",
         content: ROLE_SPECIFIC_PROMPTS.gigfolioCoach.welcome + " 🎉 I'm here to help you create the perfect worker profile so you can find gig opportunities! You're creating a profile to showcase your skills and availability to potential clients. Tell me about yourself and what kind of work you can offer. What's your background?",
       }, {
         id: 2,
         type: "input",
         inputConfig: {
           type: "text",
           name: "about",
           placeholder: "Tell us about yourself and your background...",
         },
         isComplete: false,
       }]);
      setError(null);
    }
  }, [user?.uid]);

  // Clear error after 5 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  // Reformulate logic: when reformulateField is set, clear the field and add a new prompt/input step
  useEffect(() => {
    if (reformulateField) {
      // Set reformulating state to prevent multiple clicks
      setIsReformulating(true);
      
      // Clear the value for that field
      setFormData(prev => ({ ...prev, [reformulateField]: undefined }));

      // Keep previous entries but mark sanitized step as complete and add new reformulation
      setChatSteps(prev => {
        // Mark the sanitized step as complete so it doesn't show buttons anymore
        const updatedSteps = prev.map(step => 
          step.type === "sanitized" && step.fieldName === reformulateField 
            ? { ...step, isComplete: true } : step
        );
        
        // Add typing indicator
        return [
          ...updatedSteps,
          {
            id: Date.now() + 1,
            type: "typing",
            isNew: true,
          },
        ];
      });

             // Generate a reformulation question using ChatAI system
       const reformulationPrompt = buildSpecializedPrompt('profileCreation', 'Reformulation', 'Could you provide your reformulated message?');
      
      setTimeout(() => {
        setChatSteps(prev => {
          const filtered = prev.filter(s => s.type !== "typing");
          const fieldConfig = requiredFields.find(f => f.name === reformulateField);
          
          if (!fieldConfig) {
            console.error('Field config not found for:', reformulateField);
            return filtered;
          }

          return [
            ...filtered,
            {
              id: Date.now() + 2,
              type: "bot",
              content: reformulationPrompt,
              isNew: true,
            },
            {
              id: Date.now() + 3,
              type: fieldConfig.type === "location" ? "location" : 
                    fieldConfig.type === "date" ? "calendar" : 
                    fieldConfig.type === "video" ? "video" : "input",
              inputConfig: {
                type: fieldConfig.type,
                name: fieldConfig.name,
                placeholder: fieldConfig.placeholder,
                rows: fieldConfig.rows,
              },
              isComplete: false,
              isNew: true,
            },
          ];
        });
      }, 700);
    }
  }, [reformulateField]);

  if (loadingAuth) {
    return (
      <div className={pageStyles.loadingContainer}>
        <p>Loading authentication...</p>
      </div>
    );
  }

  if (!user) {
    return <Loader />;
  }
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const onSendMessage = useCallback((message: string) => {
    // Find the current active input step
    const currentInputStep = chatSteps.find(step => 
      (step.type === "input" || step.type === "calendar" || step.type === "location") && !step.isComplete
    );

    if (currentInputStep) {
      // Add user message
      setChatSteps(prev => [
        ...prev,
        {
          id: Date.now(),
          type: "user",
          content: message,
          isNew: true,
        },
      ]);

      // Handle the input
      handleInputChange(currentInputStep.inputConfig!.name, message);
      handleInputSubmit(currentInputStep.id, currentInputStep.inputConfig!.name, message); // Pass message as value
    }
  }, [chatSteps, handleInputChange, handleInputSubmit]);

  // Show setup choice modal if no mode has been selected
  if (showSetupChoice) {
    return (
      <SetupChoiceModal
        isOpen={showSetupChoice}
        onChoice={handleSetupChoice}
      />
    );
  }

  // Show manual form if manual mode is selected
  if (setupMode === 'manual') {
    return (
      <div className={pageStyles.container}>
        {error && (
          <div style={{ 
            background: '#ff4444', 
            color: 'white', 
            padding: '8px 16px', 
            margin: '8px 0', 
            borderRadius: '4px',
            fontSize: '14px'
          }}>
            {error}
          </div>
        )}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          padding: '16px',
          borderBottom: '1px solid #444444',
          background: '#161616'
        }}>
          <button
            onClick={handleResetChoice}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              background: 'transparent',
              border: '1px solid #a0a0a0',
              borderRadius: '8px',
              color: '#a0a0a0',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = '#a0a0a0';
              e.currentTarget.style.color = '#161616';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = '#a0a0a0';
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z" fill="currentColor"/>
            </svg>
            Change Setup Method
          </button>
        </div>
        <ManualProfileForm
          onSubmit={handleManualFormSubmit}
          onSwitchToAI={handleSwitchToAI}
          initialData={manualFormData}
          workerProfileId={workerProfileId}
        />
      </div>
    );
  }

  // Show AI chat if AI mode is selected
  return (
    <ChatBotLayout 
      ref={chatContainerRef} 
      className={pageStyles.container} 
      role="GIG_WORKER"
      showChatInput={true}
      onSendMessage={onSendMessage}
      showOnboardingOptions={true}
      onSwitchToManual={() => {
        setSetupMode('manual');
        setManualFormData(formData);
      }}
      onChangeSetupMethod={handleResetChoice}
    >
      {error && (
        <div style={{ 
          background: '#ff4444', 
          color: 'white', 
          padding: '8px 16px', 
          margin: '8px 0', 
          borderRadius: '4px',
          fontSize: '14px'
        }}>
          {error}
        </div>
      )}




      
      {chatSteps.map((step, idx) => {
        const key = `${step.id}-${idx}`;
        
        if (step.type === "support") {
          // Render support options
          return (
            <MessageBubble
              key={key}
              text={
                <div style={{ background: '#222', color: '#fff', borderRadius: 8, padding: 16, margin: '16px 0', boxShadow: '0 2px 8px #0002' }}>
                  <h3 style={{ marginTop: 0, color: 'var(--primary-color)' }}>Need Human Support?</h3>
                  <p style={{ marginBottom: 16, color: '#e5e5e5' }}>
                    I understand you're having trouble with the AI onboarding. Here are your options:
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <button
                      style={{ 
                        background: 'var(--primary-color)', 
                        color: '#fff', 
                        border: 'none', 
                        borderRadius: 8, 
                        padding: '12px 16px', 
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 0.3s ease'
                      }}
                      onClick={() => {
                        setSetupMode('manual');
                        setShowSetupChoice(false);
                      }}
                    >
                      Switch to Manual Form Input
                    </button>
                    <button
                      style={{ 
                        background: 'rgba(255, 255, 255, 0.1)', 
                        color: '#fff', 
                        border: '1px solid rgba(255, 255, 255, 0.3)', 
                        borderRadius: 8, 
                        padding: '12px 16px', 
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 0.3s ease'
                      }}
                      onClick={() => {
                        window.open('mailto:support@able-ai.com?subject=AI Onboarding Support Needed', '_blank');
                      }}
                    >
                      Contact Support Team
                    </button>
                  </div>
                  {supportCaseId && (
                    <p style={{ marginTop: 16, fontSize: '14px', color: '#ccc', fontStyle: 'italic' }}>
                      Support Case ID: {supportCaseId}
                    </p>
                  )}
                </div>
              }
              senderType="bot"
            />
          );
        }
        
        if (step.type === "summary") {
          // Render just the Confirm button
          return (
            <MessageBubble
              key={key}
              text={
                <div style={{ background: '#222', color: '#fff', borderRadius: 8, padding: 16, margin: '16px 0', boxShadow: '0 2px 8px #0002' }}>
                  <div style={{ 
                    background: 'rgba(255, 255, 255, 0.05)', 
                    padding: '16px', 
                    borderRadius: '8px', 
                    marginBottom: '16px',
                    border: '1px solid rgba(255, 255, 255, 0.1)'
                  }}>
                    <p style={{ 
                      margin: 0, 
                      fontSize: '16px', 
                      lineHeight: '1.6',
                      color: '#e5e5e5'
                    }}>
                      All profile information collected! Ready to go to your dashboard?
                    </p>
                  </div>
                  <button
                    style={{ 
                      marginTop: 16, 
                      background: isSubmitting ? "#666" : "var(--primary-color)", 
                      color: "#fff", 
                      border: "none", 
                      borderRadius: 8, 
                      padding: "8px 16px", 
                      fontWeight: 600,
                      transition: 'all 0.3s ease',
                      transform: 'scale(1)',
                      animation: isSubmitting ? 'none' : 'pulse 2s infinite',
                      cursor: isSubmitting ? 'not-allowed' : 'pointer'
                    }}
                    disabled={isSubmitting}
                    onClick={async () => {
                      if (!user?.token) {
                        setError('Authentication required. Please sign in again.');
                        return;
                      }
                      
                      try {
                        setIsSubmitting(true);
                        // Ensure all required fields are present from summary data
                        const requiredData = {
                          about: step.summaryData?.about || '',
                          experience: step.summaryData?.experience || '',
                          skills: step.summaryData?.skills || '',
                          hourlyRate: String(step.summaryData?.hourlyRate || ''),
                          location: step.summaryData?.location || '',
                          availability: step.summaryData?.availability || { days: [], startTime: '09:00', endTime: '17:00' },
                          videoIntro: step.summaryData?.videoIntro || '',
                          references: step.summaryData?.references || '',
                          jobTitle: step.summaryData?.jobTitle || ''
                        };
                        
                        // Save the profile data to database
                        const result = await saveWorkerProfileFromOnboardingAction(requiredData, user.token);
                        if (result.success) {
                          // Navigate to worker dashboard
                          router.push(`/user/${user?.uid}/worker`);
                        } else {
                          setError('Failed to save profile. Please try again.');
                        }
                      } catch (error) {
                        console.error('Error saving profile:', error);
                        setError('Failed to save profile. Please try again.');
                      } finally {
                        setIsSubmitting(false);
                      }
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.transform = 'scale(1.05)';
                      e.currentTarget.style.background = 'var(--primary-darker-color)';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.transform = 'scale(1)';
                      e.currentTarget.style.background = 'var(--primary-color)';
                    }}
                  >
                    <style>{`
                      @keyframes pulse {
                        0% {
                          box-shadow: 0 0 0 0 rgba(37, 99, 235, 0.7);
                        }
                        70% {
                          box-shadow: 0 0 0 10px rgba(37, 99, 235, 0);
                        }
                        100% {
                          box-shadow: 0 0 0 0 rgba(37, 99, 235, 0);
                        }
                      }
                    `}</style>
                    {isSubmitting ? 'Saving Profile...' : 'Confirm & Go to Dashboard'}
                  </button>
                </div>
              }
              senderType="bot"
            />
          );
        }
        
        if (step.type === "sanitized") {
          // Get the natural summary from the step
          const naturalSummary = (step as any).naturalSummary || 'Is this correct?';
          
          // Format the sanitized value properly
          const displayValue = (() => {
            const sanitizedValue = step.sanitizedValue as any; // Type assertion since it can be object or string
            
            // Handle video fields - show video snippet instead of URL
            if (step.fieldName === 'videoIntro' && typeof sanitizedValue === 'string') {
              return (
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontStyle: 'italic', color: '#e5e5e5', fontSize: '15px', lineHeight: '1.4', marginBottom: 8 }}>
                    Video Introduction Recorded
                  </div>
                  <video 
                    controls 
                    style={{ 
                      maxWidth: '100%', 
                      maxHeight: '200px', 
                      borderRadius: '8px',
                      backgroundColor: '#000'
                    }}
                  >
                    <source src={sanitizedValue} type="video/webm" />
                    Your browser does not support the video tag.
                  </video>
                </div>
              );
            }
            
            // Handle coordinate objects
            if (sanitizedValue && typeof sanitizedValue === 'object' && 'lat' in sanitizedValue && 'lng' in sanitizedValue) {
              const lat = sanitizedValue.lat;
              const lng = sanitizedValue.lng;
              
              // Format coordinates with proper number handling
              const latStr = typeof lat === 'number' ? lat.toFixed(6) : String(lat);
              const lngStr = typeof lng === 'number' ? lng.toFixed(6) : String(lng);
              return `Lat: ${latStr}, Lng: ${lngStr}`;
            } 
            
            // Handle string that might contain coordinates
            if (typeof sanitizedValue === 'string') {
              // Check if it's a JSON string containing coordinates
              try {
                const parsed = JSON.parse(sanitizedValue);
                if (parsed && typeof parsed === 'object' && 'lat' in parsed && 'lng' in parsed) {
                  const lat = parsed.lat;
                  const lng = parsed.lng;
                  const latStr = typeof lat === 'number' ? lat.toFixed(6) : String(lat);
                  const lngStr = typeof lng === 'number' ? lng.toFixed(6) : String(lng);
                  return `Lat: ${latStr}, Lng: ${lngStr}`;
                }
              } catch (e) {
                // Not JSON, return as string
              }
              return sanitizedValue;
            }
            
            // Handle other objects
            if (typeof sanitizedValue === 'object') {
              return JSON.stringify(sanitizedValue);
            }
            
            // Handle other types
            return String(sanitizedValue || '');
          })();
          
          // Check button states
          const confirmClicked = clickedSanitizedButtons.has(`${step.fieldName}-confirm`);
          const reformulateClicked = clickedSanitizedButtons.has(`${step.fieldName}-reformulate`);
          const isReformulatingThisField = reformulateField === step.fieldName;
          const isCompleted = step.isComplete || confirmClicked || reformulateClicked;
          
          return (
            <MessageBubble
              key={key}
              text={
                <div>
                  {typeof displayValue === 'string' ? (
                    <div style={{ marginBottom: 16, color: 'var(--primary-color)', fontWeight: 600, fontSize: '16px', lineHeight: '1.4' }}>{naturalSummary}</div>
                  ) : (
                    <div style={{ marginBottom: 16, color: 'var(--primary-color)', fontWeight: 600, fontSize: '16px', lineHeight: '1.4' }}>{naturalSummary}</div>
                  )}
                  <div style={{ display: 'flex', gap: 12 }}>
                    <button
                      style={{ 
                        background: isCompleted ? '#555' : 'var(--primary-color)', 
                        color: '#fff', 
                        border: 'none', 
                        borderRadius: 8, 
                        padding: '8px 16px', 
                        fontWeight: 600, 
                        fontSize: '14px', 
                        cursor: isCompleted ? 'not-allowed' : 'pointer', 
                        transition: 'background-color 0.2s',
                        opacity: isCompleted ? 0.7 : 1
                      }}
                      onClick={isCompleted ? undefined : () => handleSanitizedConfirm(step.fieldName!, step.sanitizedValue!)}
                      disabled={isCompleted}
                      onMouseOver={(e) => {
                        if (!isCompleted) {
                          e.currentTarget.style.background = 'var(--primary-darker-color)';
                        }
                      }}
                      onMouseOut={(e) => {
                        if (!isCompleted) {
                          e.currentTarget.style.background = isCompleted ? '#555' : 'var(--primary-color)';
                        }
                      }}
                    >
                      {confirmClicked ? 'Confirmed' : 'Confirm'}
                    </button>
                    <button
                      style={{ 
                        background: isCompleted ? '#555' : 'transparent', 
                        color: isCompleted ? '#999' : 'var(--primary-color)', 
                        border: '1px solid var(--primary-color)', 
                        borderRadius: 8, 
                        padding: '8px 16px', 
                        fontWeight: 600, 
                        fontSize: '14px', 
                        cursor: isCompleted ? 'not-allowed' : 'pointer', 
                        transition: 'all 0.2s',
                        opacity: isCompleted ? 0.7 : 1
                      }}
                      onClick={isCompleted ? undefined : () => handleSanitizedReformulate(step.fieldName!)}
                      disabled={isCompleted}
                      onMouseOver={(e) => { 
                        if (!isCompleted) {
                          e.currentTarget.style.background = 'var(--primary-color)'; 
                          e.currentTarget.style.color = '#fff'; 
                        }
                      }}
                      onMouseOut={(e) => { 
                        if (!isCompleted) {
                          e.currentTarget.style.background = 'transparent'; 
                          e.currentTarget.style.color = 'var(--primary-color)'; 
                        }
                      }}
                    >
                      {reformulateClicked ? 'Reformulated' : (isReformulatingThisField ? 'Reformulating...' : 'Reformulate')}
                    </button>
                  </div>
                </div>
              }
              senderType="bot"
              role="GIG_WORKER"
              showAvatar={true}
            />
          );
        }
        
        if (step.type === "typing") {
          return (
            <div key={key}>
              {/* AI Avatar - Separated */}
              <div key={`${key}-avatar`} style={{ 
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.5rem',
                marginBottom: '0.5rem'
              }}>
                <div style={{ flexShrink: 0, marginTop: '0.25rem' }}>
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'linear-gradient(135deg, var(--primary-color), var(--primary-darker-color))',
                    boxShadow: '0 2px 8px rgba(37, 99, 235, 0.3)'
                  }}>
                    <div style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      background: '#000000',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '1px solid rgba(255, 255, 255, 0.2)'
                    }}>
                      <Image 
                        src="/images/ableai.png" 
                        alt="Able AI" 
                        width={24} 
                        height={24} 
                        style={{
                          borderRadius: '50%',
                          objectFit: 'cover'
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
              {/* Typing Indicator - Separated */}
              <div key={`${key}-typing`}>
                <TypingIndicator />
              </div>
            </div>
          );
        }
        
                 if (step.type === "bot") {
           // Check if this is a reference message or follow-up messages (no AI avatar)
           if (step.content && typeof step.content === 'string' && (
             step.content.includes("You need two references") ||
             step.content.includes("Watch out for notifications") ||
             step.content.includes("We might offer you gigs")
           )) {
     
                           return (
                <div key={key} className="messageWrapper alignBot" data-role="GIG_WORKER" style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '1rem' }}>
                  {/* No avatar for reference and follow-up messages, but maintain alignment as if avatar was present */}
                  <div style={{ flexShrink: 0, width: '32px' }}></div> {/* Spacer to align with avatar-containing messages */}
                  <div className="bubble bubbleBot" style={{ 
                    maxWidth: '70%', 
                    padding: '0.75rem 1rem', 
                    borderRadius: '18px', 
                    fontSize: '14px', 
                    lineHeight: '1.4', 
                    wordWrap: 'break-word',
                    backgroundColor: '#333',
                    color: '#fff',
                    borderBottomLeftRadius: '4px'
                  }}>
                                       {/* Make URLs clickable with copy/share functionality for reference messages */}
                    {step.content.includes("You need two references") ? (
                      (step.content as string).split(/(https?:\/\/[^\s\n]+)/g).map((part, index) => {
                        if (part.match(/(https?:\/\/[^\s\n]+)/g)) {
                          return (
                            <div key={`url-${index}-${part}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', margin: '4px 0' }}>
                              <a
                                href={part}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                  color: '#41a1e8',
                                  textDecoration: 'underline',
                                  wordBreak: 'break-all'
                                }}
                              >
                                Send this link to your reference
                              </a>
                                                           <button
                                onClick={() => {
                                  navigator.clipboard.writeText(part);
                                  alert('Link copied to clipboard!');
                                }}
                                style={{
                                  background: 'transparent',
                                  border: '1px solid #41a1e8',
                                  borderRadius: '4px',
                                  padding: '6px',
                                  color: '#41a1e8',
                                  cursor: 'pointer',
                                  transition: 'all 0.2s ease',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  width: '28px',
                                  height: '28px'
                                }}
                                onMouseOver={(e) => {
                                  e.currentTarget.style.background = '#41a1e8';
                                  e.currentTarget.style.color = 'white';
                                }}
                                onMouseOut={(e) => {
                                  e.currentTarget.style.background = 'transparent';
                                  e.currentTarget.style.color = '#41a1e8';
                                }}
                                title="Copy link"
                              >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                  <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
                                </svg>
                              </button>
                             {navigator.share && (
                                                               <button
                                  onClick={() => {
                                    navigator.share({
                                      title: 'Worker Reference Link',
                                      text: 'Please use this link to provide a reference:',
                                      url: part
                                    });
                                  }}
                                  style={{
                                    background: 'transparent',
                                    border: '1px solid #41a1e8',
                                    borderRadius: '4px',
                                    padding: '6px',
                                    color: '#41a1e8',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    width: '28px',
                                    height: '28px'
                                  }}
                                  onMouseOver={(e) => {
                                    e.currentTarget.style.background = '#41a1e8';
                                    e.currentTarget.style.color = 'white';
                                  }}
                                  onMouseOut={(e) => {
                                    e.currentTarget.style.background = 'transparent';
                                    e.currentTarget.style.color = '#41a1e8';
                                  }}
                                  title="Share link"
                                >
                                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92 1.61 0 2.92-1.31 2.92-2.92s-1.31-2.92-2.92-2.92z"/>
                                  </svg>
                                </button>
                             )}
                           </div>
                         );
                       }
                       return <span key={`text-${index}`}>{part}</span>;
                     })
                   ) : (
                     // For follow-up messages, just display the text
                     step.content
                   )}
                 </div>
               </div>
             );
           }
          
          // Check if this is a summary message (contains JSON)
          if (step.content && typeof step.content === 'string' && step.content.includes('{')) {
            try {
              const jsonMatch = step.content.match(/\{[\s\S]*\}/);
              if (jsonMatch) {
                const summaryData = JSON.parse(jsonMatch[0]) as FormData;
                return (
                  <MessageBubble
                    key={key}
                    text={
                      <div style={{ background: '#222', color: '#fff', borderRadius: 8, padding: 16, margin: '16px 0', boxShadow: '0 2px 8px #0002' }}>
                        <h3 style={{ marginTop: 0 }}>Profile Information</h3>
                        <div style={{ 
                          background: 'rgba(255, 255, 255, 0.05)', 
                          padding: '16px', 
                          borderRadius: '8px', 
                          marginBottom: '16px',
                          border: '1px solid rgba(255, 255, 255, 0.1)'
                        }}>
                          <p style={{ 
                            margin: 0, 
                            fontSize: '16px', 
                            lineHeight: '1.6',
                            color: '#e5e5e5'
                          }}>
                            {(() => {
                              // Try to extract AI summary from the step content
                              if (step.content && typeof step.content === 'string') {
                                // Look for AI summary pattern
                                const aiSummaryMatch = step.content.match(/Perfect! (.+)/);
                                if (aiSummaryMatch) {
                                  return aiSummaryMatch[1];
                                }
                                // If no AI summary found, fall back to structured display
                                return (
                                  <ul style={{ listStyle: 'none', padding: 0 }}>
                                    {requiredFields.map((field) => (
                                      <li key={field.name} style={{ marginBottom: 8 }}>
                                        <strong style={{ textTransform: 'capitalize' }}>{field.name.replace(/([A-Z])/g, ' $1')}: </strong>
                                        <span>
                                          {formatSummaryValue(summaryData[field.name], field.name)}
                                        </span>
                                      </li>
                                    ))}
                                  </ul>
                                );
                              }
                              return 'Loading profile summary...';
                            })()}
                          </p>
                        </div>
                                                 <button
                           style={{ 
                             marginTop: 16, 
                             background: isSubmitting ? "#666" : "var(--primary-color)", 
                             color: "#fff", 
                             border: "none", 
                             borderRadius: 8, 
                             padding: "8px 16px", 
                             fontWeight: 600,
                             transition: 'all 0.3s ease',
                             transform: 'scale(1)',
                             animation: isSubmitting ? 'none' : 'pulse 2s infinite',
                             cursor: isSubmitting ? 'not-allowed' : 'pointer'
                           }}
                           disabled={isSubmitting}
                           onClick={async () => {
                             if (!user?.token) {
                               setError('Authentication required. Please sign in again.');
                               return;
                             }
                             
                             try {
                               setIsSubmitting(true);
                               // Ensure all required fields are present from summary data
                               const requiredData = {
                                 about: summaryData.about || '',
                                 experience: summaryData.experience || '',
                                 skills: summaryData.skills || '',
                                 hourlyRate: String(summaryData.hourlyRate || ''),
                                 location: summaryData.location || '',
                                 availability: summaryData.availability || { days: [], startTime: '09:00', endTime: '17:00' },
                                 videoIntro: summaryData.videoIntro || '',
                                 references: summaryData.references || '',
                                 jobTitle: summaryData.jobTitle || ''
                               };
                               
                               // Save the profile data to database
                               const result = await saveWorkerProfileFromOnboardingAction(requiredData, user.token);
                               if (result.success) {
                                 // Navigate to worker dashboard
                                 router.push(`/user/${user?.uid}/worker`);
                               } else {
                                 setError('Failed to save profile. Please try again.');
                               }
                             } catch (error) {
                               console.error('Error saving profile:', error);
                               setError('Failed to save profile. Please try again.');
                             } finally {
                               setIsSubmitting(false);
                             }
                           }}
                           onMouseOver={(e) => {
                             e.currentTarget.style.transform = 'scale(1.05)';
                             e.currentTarget.style.background = 'var(--primary-darker-color)';
                           }}
                           onMouseOut={(e) => {
                             e.currentTarget.style.transform = 'scale(1)';
                             e.currentTarget.style.background = 'var(--primary-color)';
                           }}
                         >
                           <style>{`
                             @keyframes pulse {
                               0% {
                                 box-shadow: 0 0 0 0 rgba(37, 99, 235, 0.7);
                               }
                               70% {
                                 box-shadow: 0 0 0 10px rgba(37, 99, 235, 0);
                               }
                               100% {
                                 box-shadow: 0 0 0 0 rgba(37, 99, 235, 0);
                               }
                             }
                           `}</style>
                           {isSubmitting ? 'Saving Profile...' : 'Confirm & Go to Dashboard'}
                         </button>
                      </div>
                    }
                    senderType="bot"
                    role="GIG_WORKER"
                  />
                );
              }
            } catch (error) {
              console.error('Failed to parse summary JSON:', error);
            }
          }
          return (
            <MessageBubble
              key={key}
              text={step.content as string}
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
              text={typeof step.content === 'object' && step.content !== null ? JSON.stringify(step.content) : String(step.content || '')}
              senderType="user"
              showAvatar={false}
              isNew={step.isNew}
              role="GIG_WORKER"
            />
          );
        }
        
        if (step.type === "input") {
          // Return null for completed inputs - they're handled by user messages now
          return null;
        }

        if (step.type === "shareLink") {
          return (
            <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <ShareLinkBubble linkUrl={step.linkUrl} linkText={step.linkText} />
            </div>
          );
        }

        if (step.type === "calendar") {
          return (
            <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {/* AI Avatar - Separated */}
              <div style={{ 
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.5rem',
                marginBottom: '0.5rem'
              }}>
                <div style={{ flexShrink: 0, marginTop: '0.25rem' }}>
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'linear-gradient(135deg, var(--primary-color), var(--primary-darker-color))',
                    boxShadow: '0 2px 8px rgba(37, 99, 235, 0.3)'
                  }}>
                    <div style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      background: '#000000',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '1px solid rgba(255, 255, 255, 0.2)'
                    }}>
                      <Image 
                        src="/images/ableai.png" 
                        alt="Able AI" 
                        width={24} 
                        height={24} 
                        style={{
                          borderRadius: '50%',
                          objectFit: 'cover'
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <CalendarPickerBubble
                value={typeof formData.availability === 'string' && formData.availability ? new Date(formData.availability) : null}
                onChange={date => handleInputChange('availability', date ? date.toISOString() : "")}
              />
              {!confirmedSteps.has(step.id) && (
                <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'flex-end' }}>
                  <button
                    style={{
                      background: isConfirming ? '#555' : 'var(--primary-color)',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '8px 16px',
                      fontWeight: 600,
                      fontSize: '14px',
                      cursor: isConfirming ? 'not-allowed' : 'pointer',
                      transition: 'background-color 0.2s',
                      opacity: isConfirming ? 0.7 : 1
                    }}
                    onClick={() => handlePickerConfirm(step.id, 'availability')}
                    onMouseOver={(e) => {
                      if (!isConfirming) {
                        e.currentTarget.style.background = 'var(--primary-darker-color)';
                      }
                    }}
                    onMouseOut={(e) => {
                      if (!isConfirming) {
                        e.currentTarget.style.background = 'var(--primary-color)';
                      }
                    }}
                    disabled={isConfirming}
                  >
                    {isConfirming ? 'Confirming...' : 'Confirm Date'}
                  </button>
                </div>
              )}
              {confirmedSteps.has(step.id) && (
                <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'flex-end' }}>
                  <div style={{
                    background: 'var(--primary-color)',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '8px 16px',
                    fontWeight: 600,
                    fontSize: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <span>✓</span>
                    Date Confirmed
                  </div>
                </div>
              )}
            </div>
          );
        }

        if (step.type === "availability") {
          const weekDays = [
            { value: 'monday', label: 'Monday' },
            { value: 'tuesday', label: 'Tuesday' },
            { value: 'wednesday', label: 'Wednesday' },
            { value: 'thursday', label: 'Thursday' },
            { value: 'friday', label: 'Friday' },
            { value: 'saturday', label: 'Saturday' },
            { value: 'sunday', label: 'Sunday' }
          ];

          const currentAvailability = typeof formData.availability === 'object' ? formData.availability : {
            days: [],
            startTime: '09:00',
            endTime: '17:00',
            frequency: 'never',
            ends: 'never'
          };

          const handleDayToggle = (day: string) => {
            const newDays = currentAvailability.days.includes(day)
              ? currentAvailability.days.filter(d => d !== day)
              : [...currentAvailability.days, day];
            
            handleInputChange('availability', {
              ...currentAvailability,
              days: newDays
            });
          };

          return (
            <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {/* AI Avatar - Separated */}
              <div style={{ 
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.5rem',
                marginBottom: '0.5rem'
              }}>
                <div style={{ flexShrink: 0, marginTop: '0.25rem' }}>
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'linear-gradient(135deg, var(--primary-color), var(--primary-darker-color))',
                    boxShadow: '0 2px 8px rgba(37, 99, 235, 0.3)'
                  }}>
                    <div style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      background: '#000000',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '1px solid rgba(255, 255, 255, 0.2)'
                    }}>
                      <Image 
                        src="/images/ableai.png" 
                        alt="Able AI" 
                        width={24} 
                        height={24} 
                        style={{
                          borderRadius: '50%',
                          objectFit: 'cover'
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div style={{
                background: '#2F2F2F',
                border: '2px solid #444444',
                borderRadius: '12px',
                padding: '20px',
                color: '#ffffff'
              }}>
                <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: '600' }}>
                  Set Your Weekly Availability
                </h3>
                
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                    Available Days *
                  </label>
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', 
                    gap: '8px' 
                  }}>
                    {weekDays.map((day) => (
                      <button
                        key={day.value}
                        type="button"
                        style={{
                          padding: '8px 12px',
                          border: `2px solid ${currentAvailability.days.includes(day.value) ? '#41a1e8' : '#444444'}`,
                          borderRadius: '8px',
                          background: currentAvailability.days.includes(day.value) ? '#41a1e8' : 'transparent',
                          color: currentAvailability.days.includes(day.value) ? '#ffffff' : '#a0a0a0',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          fontSize: '14px',
                          fontWeight: '500'
                        }}
                        onClick={() => handleDayToggle(day.value)}
                        onMouseOver={(e) => {
                          if (!currentAvailability.days.includes(day.value)) {
                            e.currentTarget.style.borderColor = '#41a1e8';
                            e.currentTarget.style.color = '#ffffff';
                          }
                        }}
                        onMouseOut={(e) => {
                          if (!currentAvailability.days.includes(day.value)) {
                            e.currentTarget.style.borderColor = '#444444';
                            e.currentTarget.style.color = '#a0a0a0';
                          }
                        }}
                      >
                        {day.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                    Available Hours *
                  </label>
                  <div style={{ 
                    display: 'flex', 
                    gap: '16px', 
                    alignItems: 'center',
                    flexWrap: 'wrap'
                  }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <label style={{ fontSize: '12px', color: '#a0a0a0', fontWeight: '500' }}>From:</label>
                      <input
                        type="time"
                        style={{
                          padding: '8px 12px',
                          border: '2px solid #444444',
                          borderRadius: '8px',
                          background: '#1A1A1A',
                          color: '#ffffff',
                          fontSize: '14px'
                        }}
                        value={currentAvailability.startTime}
                        onChange={(e) => handleInputChange('availability', {
                          ...currentAvailability,
                          startTime: e.target.value
                        })}
                      />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <label style={{ fontSize: '12px', color: '#a0a0a0', fontWeight: '500' }}>To:</label>
                      <input
                        type="time"
                        style={{
                          padding: '8px 12px',
                          border: '2px solid #444444',
                          borderRadius: '8px',
                          background: '#1A1A1A',
                          color: '#ffffff',
                          fontSize: '14px'
                        }}
                        value={currentAvailability.endTime}
                        onChange={(e) => handleInputChange('availability', {
                          ...currentAvailability,
                          endTime: e.target.value
                        })}
                      />
                    </div>
                  </div>
                </div>

                {/* Recurring Options */}
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                    Recurring Pattern
                  </label>
                  <div style={{ 
                    display: 'flex', 
                    gap: '12px', 
                    alignItems: 'center',
                    flexWrap: 'wrap'
                  }}>
                    <select
                      style={{
                        padding: '8px 12px',
                        border: '2px solid #444444',
                        borderRadius: '8px',
                        background: '#1A1A1A',
                        color: '#ffffff',
                        fontSize: '14px',
                        minWidth: '120px'
                      }}
                      value={currentAvailability.frequency || 'never'}
                      onChange={(e) => handleInputChange('availability', {
                        ...currentAvailability,
                        frequency: e.target.value
                      })}
                    >
                      <option value="never">No repeat</option>
                      <option value="weekly">Every week</option>
                      <option value="biweekly">Every 2 weeks</option>
                      <option value="monthly">Every month</option>
                    </select>

                    <select
                      style={{
                        padding: '8px 12px',
                        border: '2px solid #444444',
                        borderRadius: '8px',
                        background: '#1A1A1A',
                        color: '#ffffff',
                        fontSize: '14px',
                        minWidth: '120px'
                      }}
                      value={currentAvailability.ends || 'never'}
                      onChange={(e) => handleInputChange('availability', {
                        ...currentAvailability,
                        ends: e.target.value,
                        // Clear endDate and occurrences when changing ends type
                        endDate: undefined,
                        occurrences: undefined
                      })}
                    >
                      <option value="never">Never ends</option>
                      <option value="on_date">Until date</option>
                      <option value="after_occurrences">After times</option>
                    </select>

                    {currentAvailability.ends === 'on_date' && (
                      <input
                        type="date"
                        style={{
                          padding: '8px 12px',
                          border: '2px solid #444444',
                          borderRadius: '8px',
                          background: '#1A1A1A',
                          color: '#ffffff',
                          fontSize: '14px'
                        }}
                        value={currentAvailability.endDate || ''}
                        min={new Date().toISOString().split('T')[0]}
                        onChange={(e) => handleInputChange('availability', {
                          ...currentAvailability,
                          endDate: e.target.value
                        })}
                      />
                    )}

                    {currentAvailability.ends === 'after_occurrences' && (
                      <input
                        type="number"
                        min="1"
                        max="100"
                        placeholder="Times"
                        style={{
                          padding: '8px 12px',
                          border: '2px solid #444444',
                          borderRadius: '8px',
                          background: '#1A1A1A',
                          color: '#ffffff',
                          fontSize: '14px',
                          width: '80px'
                        }}
                        value={currentAvailability.occurrences || ''}
                        onChange={(e) => handleInputChange('availability', {
                          ...currentAvailability,
                          occurrences: parseInt(e.target.value) || 1
                        })}
                      />
                    )}
                  </div>
                </div>

                <div style={{ 
                  background: '#1A1A1A', 
                  padding: '12px', 
                  borderRadius: '8px', 
                  border: '1px solid #444444',
                  fontSize: '14px',
                  color: '#a0a0a0'
                }}>
                  <strong>Preview:</strong> {currentAvailability.days.length > 0 ?
                    `${currentAvailability.days.map(day => weekDays.find(d => d.value === day)?.label).join(', ')} ${currentAvailability.startTime} - ${currentAvailability.endTime}` +
                    (currentAvailability.frequency && currentAvailability.frequency !== 'never' ? 
                      ` (${currentAvailability.frequency === 'weekly' ? 'Every week' : 
                          currentAvailability.frequency === 'biweekly' ? 'Every 2 weeks' : 
                          currentAvailability.frequency === 'monthly' ? 'Every month' : ''})` : '') +
                    (currentAvailability.ends === 'on_date' && currentAvailability.endDate ? 
                      ` until ${new Date(currentAvailability.endDate).toLocaleDateString()}` : '') +
                    (currentAvailability.ends === 'after_occurrences' && currentAvailability.occurrences ? 
                      ` (${currentAvailability.occurrences} times)` : '') :
                    'Please select days and times'
                  }
                </div>
              </div>

              {!confirmedSteps.has(step.id) && (
                <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'flex-end' }}>
                  <button
                    style={{
                      background: isConfirming ? '#555' : 'var(--primary-color)',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '8px 16px',
                      fontWeight: 600,
                      fontSize: '14px',
                      cursor: isConfirming ? 'not-allowed' : 'pointer',
                      transition: 'background-color 0.2s',
                      opacity: isConfirming ? 0.7 : 1
                    }}
                    onClick={() => handlePickerConfirm(step.id, 'availability')}
                    onMouseOver={(e) => {
                      if (!isConfirming) {
                        e.currentTarget.style.background = 'var(--primary-darker-color)';
                      }
                    }}
                    onMouseOut={(e) => {
                      if (!isConfirming) {
                        e.currentTarget.style.background = 'var(--primary-color)';
                      }
                    }}
                    disabled={isConfirming || currentAvailability.days.length === 0}
                  >
                    {isConfirming ? 'Confirming...' : 'Confirm Availability'}
                  </button>
                </div>
              )}
              {confirmedSteps.has(step.id) && (
                <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'flex-end' }}>
                  <div style={{
                    background: 'var(--primary-color)',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '8px 16px',
                    fontWeight: 600,
                    fontSize: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <span>✓</span>
                    Availability Confirmed
                  </div>
                </div>
              )}
            </div>
          );
        }

        if (step.type === "location") {
          return (
            <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {/* AI Avatar - Separated */}
              <div style={{ 
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.5rem',
                marginBottom: '0.5rem'
              }}>
                <div style={{ flexShrink: 0, marginTop: '0.25rem' }}>
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'linear-gradient(135deg, var(--primary-color), var(--primary-darker-color))',
                    boxShadow: '0 2px 8px rgba(37, 99, 235, 0.3)'
                  }}>
                    <div style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      background: '#000000',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '1px solid rgba(255, 255, 255, 0.2)'
                    }}>
                      <Image 
                        src="/images/ableai.png" 
                        alt="Able AI" 
                        width={24} 
                        height={24} 
                        style={{
                          borderRadius: '50%',
                          objectFit: 'cover'
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <LocationPickerBubble
                value={formData.location}
                onChange={val => handleInputChange('location', val)}
                showConfirm={false}
                onConfirm={() => handlePickerConfirm(step.id, 'location')}
                role="GIG_WORKER"
              />
              {!confirmedSteps.has(step.id) && (
                <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'flex-end' }}>
                  <button
                    style={{
                      background: isConfirming ? '#555' : 'var(--primary-color)',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '8px 16px',
                      fontWeight: 600,
                      fontSize: '14px',
                      cursor: isConfirming ? 'not-allowed' : 'pointer',
                      transition: 'background-color 0.2s',
                      opacity: isConfirming ? 0.7 : 1
                    }}
                    onClick={() => handlePickerConfirm(step.id, 'location')}
                    onMouseOver={(e) => {
                      if (!isConfirming) {
                        e.currentTarget.style.background = 'var(--primary-darker-color)';
                      }
                    }}
                    onMouseOut={(e) => {
                      if (!isConfirming) {
                        e.currentTarget.style.background = 'var(--primary-color)';
                      }
                    }}
                    disabled={isConfirming}
                  >
                    {isConfirming ? 'Confirming...' : 'Confirm Location'}
                  </button>
                </div>
              )}
              {confirmedSteps.has(step.id) && (
                <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'flex-end' }}>
                  <div style={{
                    background: 'var(--primary-color)',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '8px 16px',
                    fontWeight: 600,
                    fontSize: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <span>✓</span>
                    Location Confirmed
                  </div>
                </div>
              )}
            </div>
          );
        }

        if (step.type === "jobTitleConfirmation") {
          return (
            <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {/* AI Avatar */}
              <div style={{ 
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.5rem',
                marginBottom: '0.5rem'
              }}>
                <div style={{ flexShrink: 0, marginTop: '0.25rem' }}>
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'linear-gradient(135deg, var(--primary-color), var(--primary-darker-color))',
                    boxShadow: '0 2px 8px rgba(37, 99, 235, 0.3)'
                  }}>
                    <div style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      background: '#000000',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '1px solid rgba(255, 255, 255, 0.2)'
                    }}>
                      <Image 
                        src="/images/ableai.png" 
                        alt="Able AI" 
                        width={24} 
                        height={24} 
                        style={{
                          borderRadius: '50%',
                          objectFit: 'cover'
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Job Title Confirmation */}
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
                  🎯 Suggested Standardized Job Title
                  {step.isAISuggested && (
                    <span style={{
                      color: '#10b981',
                      fontSize: '14px',
                      fontWeight: 500,
                      marginLeft: '8px'
                    }}>
                      🤖 AI Suggested
                    </span>
                  )}
                </div>
                <div style={{
                  color: '#e5e5e5',
                  fontSize: '15px',
                  lineHeight: '1.6',
                  marginBottom: '16px'
                }}>
                  Based on your description "{step.originalValue}", I suggest the standardized job title:
                  {step.isAISuggested && (
                    <div style={{
                      color: '#10b981',
                      fontSize: '13px',
                      marginTop: '8px',
                      fontStyle: 'italic'
                    }}>
                      This title was AI-suggested as it wasn't in our standard taxonomy but closely matches your description.
                    </div>
                  )}
                </div>
                <div style={{
                  background: '#2a2a2a',
                  padding: '16px',
                  borderRadius: '8px',
                  border: '1px solid #444',
                  marginBottom: '16px'
                }}>
                  <div style={{
                    color: 'var(--primary-color)',
                    fontWeight: 600,
                    fontSize: '18px',
                    marginBottom: '8px'
                  }}>
                    {step.suggestedJobTitle}
                  </div>
                  <div style={{
                    color: '#888',
                    fontSize: '13px'
                  }}>
                    Matched: {step.matchedTerms?.join(', ')}
                  </div>
                </div>
                <div style={{
                  display: 'flex',
                  gap: '12px',
                  justifyContent: 'flex-end'
                }}>
                  <button
                    onClick={() => handleJobTitleConfirm(step.fieldName!, step.suggestedJobTitle!, step.originalValue!)}
                    style={{
                      background: 'var(--primary-color)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '10px 20px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      fontSize: '14px'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.background = 'var(--primary-darker-color)';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.background = 'var(--primary-color)';
                    }}
                  >
                    Use This Title
                  </button>
                  <button
                    onClick={() => handleJobTitleReject(step.fieldName!, step.originalValue!)}
                    style={{
                      background: '#444',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '10px 20px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      fontSize: '14px'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.background = '#555';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.background = '#444';
                    }}
                  >
                    Keep Original
                  </button>
                </div>
              </div>
            </div>
          );
        }

        if (step.type === "video") {
          return (
            <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {/* AI Avatar - Separated */}
              <div style={{ 
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.5rem',
                marginBottom: '0.5rem'
              }}>
                <div style={{ flexShrink: 0, marginTop: '0.25rem' }}>
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'linear-gradient(135deg, var(--primary-color), var(--primary-darker-color))',
                    boxShadow: '0 2px 8px rgba(37, 255, 235, 0.3)'
                  }}>
                    <div style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      background: '#000000',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '1px solid rgba(255, 255, 255, 0.2)'
                    }}>
                      <Image 
                        src="/images/ableai.png" 
                        alt="Able AI" 
                        width={24} 
                        height={24} 
                        style={{
                          borderRadius: '50%',
                          objectFit: 'cover'
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* AI-Generated Video Script */}
              <AIVideoScriptDisplay formData={formData} ai={ai} />

              <VideoRecorderBubble
                onVideoRecorded={(file) => handleVideoUpload(file, step.inputConfig?.name, step.id)}
              />
            </div>
          );
        }
        
        return null;
      })}
      
      
      <div ref={endOfChatRef} />
    </ChatBotLayout>
  );
} 
