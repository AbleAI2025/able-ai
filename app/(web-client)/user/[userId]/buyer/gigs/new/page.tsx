"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";

import ChatBotLayout from "@/app/components/onboarding/ChatBotLayout";
import MessageBubble from "@/app/components/onboarding/MessageBubble";
import InputBubble from "@/app/components/onboarding/InputBubble"; // Corrected path
import TextAreaBubble from "@/app/components/onboarding/TextAreaBubble"; // Corrected path
// import FileUploadBubble from '@/app/components/onboarding/FileUploadBubble'; // Corrected path - Uncomment if used
import WorkerCard, { WorkerData } from "@/app/components/onboarding/WorkerCard"; // Import shared WorkerCard and WorkerData
import MapLinkBubble from '@/app/components/onboarding/MapLinkBubble';
import LocationPickerBubble from "@/app/components/onboarding/LocationPickerBubble";
import CalendarPickerBubble from "@/app/components/onboarding/CalendarPickerBubble";

import Loader from "@/app/components/shared/Loader";

import pageStyles from "./page.module.css";
import { useAuth } from "@/context/AuthContext";
import { StepInputConfig, FormInputType } from "@/app/types/form";
import { geminiAIAgent } from '@/lib/firebase/ai';
import { useFirebase } from '@/context/FirebaseContext';
import { Schema } from '@firebase/ai';

interface OnboardingStep {
  id: number;
  type:
    | "botMessage"
    | "userInput"
    | "userResponseDisplay"
    | "workerCard"
    | "terms"
    | "fileUpload"
    | "datePicker"
    | "discountCode";
  senderType?: "bot" | "user";
  content?: string | React.ReactNode; // For message-like steps or labels for non-input steps
  inputConfig?: StepInputConfig; // Configuration for input fields if the step type involves input
  isComplete?: boolean;
  dependsOn?: number;
  value?: any; // Stores the submitted value of the input for this step
  workerData?: WorkerData;
}

// WorkerData interface and WorkerCard component removed - now imported

const baseInitialSteps: OnboardingStep[] = [
  {
    id: 1,
    type: "botMessage",
    content:
      "Hi! Tell me about yourself and what gig or gigs you need filling - we can assemble a team if you need one!",
  },
  {
    id: 2,
    type: "userInput",
    inputConfig: {
      type: "text",
      name: "gigDescription",
      placeholder: "e.g., Bartender for a wedding reception",
      label: "Gig Description:",
    },
  },
  {
    id: 3,
    type: "botMessage",
    content:
      "We have some great bartenders available. Do you need any special skills or do you have instructions for your hire?",
    dependsOn: 1,
  },
  {
    id: 4,
    type: "userInput",
    inputConfig: {
      type: "textarea",
      name: "additionalInstructions",
      placeholder: "e.g., Cocktail making experience would be ideal",
      label: "Additional Instructions:",
      rows: 3,
    },
    dependsOn: 2,
  },
  {
    id: 5,
    type: "botMessage",
    content:
      "How much you would like to pay per hour? We suggest £15 plus tips to keep a motivated and happy team!",
    dependsOn: 3,
  },
  {
    id: 6,
    type: "userInput",
    inputConfig: {
      type: "number",
      name: "hourlyRate",
      placeholder: "£15",
      label: "Hourly Rate:",
    },
    dependsOn: 4,
  },
  {
    id: 7,
    type: "botMessage",
    content:
      "Where is the gig? What time and day do you need someone and for how long?",
    dependsOn: 5,
  },
  {
    id: 8,
    type: "userInput",
    inputConfig: {
      type: "text",
      name: "gigLocation",
      placeholder: "e.g., The Green Tavern, Rye Lane, Peckham, SE15 5AR",
      label: "Gig Location:",
    },
    dependsOn: 6,
  },
  {
    id: 9,
    type: "userInput", // Or "datePicker" if it has distinct UI/logic beyond a standard input
    inputConfig: {
      type: "date",
      name: "gigDate",
      label: "Date of Gig:",
    },
    dependsOn: 8,
  },
  {
    id: 10,
    type: "discountCode", // This implies a specific UI or handling logic, not a standard input field
    content: "I have a discount code 2FREEABLE",
    dependsOn: 9,
  },
  {
    id: 11,
    type: "botMessage",
    content: "Thankyou! We will apply your discount code",
    dependsOn: 10,
  },
  {
    id: 12,
    type: "botMessage",
    content:
      "Here are our incredible available gig workers ready to accept your gig. Click on their profile for an indepth look at their gigfolio or simply book now",
    dependsOn: 10,
  },
  {
    id: 13,
    type: "workerCard",
    dependsOn: 12,
    workerData: {
      name: "Benji Asamoah",
      title: "Bartender",
      gigs: 15,
      experience: "3 years experience",
      keywords: "lively, professional and hardworking",
      hourlyRate: 15,
      totalHours: 6,
      totalPrice: 98.68,
      ableFees: "6.5% +VAT",
      stripeFees: "1.5% + 20p",
      imageSrc: "/images/benji.jpeg", // Replace with actual image URL
    },
  },
  {
    id: 14,
    type: "workerCard",
    dependsOn: 12, // Should depend on the previous message, not the previous card for parallel display
    workerData: {
      name: "Jessica Hersey",
      title: "Bartender",
      gigs: 11,
      experience: "2 years experience",
      keywords: "reliable, friendly and experienced",
      hourlyRate: 15,
      totalHours: 6,
      totalPrice: 85.55,
      ableFees: "6.5% +VAT",
      stripeFees: "1.5% + 20p",
      imageSrc: "/images/jessica.jpeg", // Replace with actual image URL
    },
  },
];

// Define required fields and their configs
const requiredFields = [
  { name: "additionalInstructions", type: "text", placeholder: "Any specific requirements or instructions?", defaultPrompt: "Do you need any special skills or do you have instructions for your hire?", rows: 3 },
  { name: "hourlyRate", type: "number", placeholder: "£15", defaultPrompt: "How much you would like to pay per hour? We suggest £15 plus tips to keep a motivated and happy team!" },
  { name: "gigLocation", type: "text", placeholder: "Where is the gig?", defaultPrompt: "Where is the gig? What time and day do you need someone and for how long?" },
  { name: "gigDate", type: "date", defaultPrompt: "What is the date of the gig?" },
  { name: "gigTime", type: "time", defaultPrompt: "What time does the gig start?" },
];

// Function to generate context-aware prompts based on gig description
async function generateContextAwarePrompt(fieldName: string, gigDescription: string, ai: any): Promise<string> {
  try {
    const promptSchema = Schema.object({
      properties: {
        prompt: Schema.string(),
      },
    });

    const prompt = `You are Able, a GIG CREATION ASSISTANT. Your ONLY job is to help users create gig listings (job postings) on a gig platform. You are NOT a general assistant, therapist, or friend. You ONLY help with gig creation.

CRITICAL: This is a GIG CREATION FLOW. The user is creating a job posting to hire someone for work. They are the BUYER/EMPLOYER posting a job. You are helping them create a gig listing.

Previous conversation context:
Gig Description: "${gigDescription}"

Next field to ask about: "${fieldName}"

Generate a friendly, contextual prompt for the next question. The prompt should:
1. Be conversational and natural - avoid repetitive phrases like "Awesome, a [gig type] gig!"
2. Reference what they've already shared about their gig in a fresh way
3. Be specific to the field being asked about
4. Include relevant emojis to make it engaging
5. Provide helpful context or examples when appropriate
6. Vary your language - don't start every message the same way
7. ALWAYS stay focused on gig creation - this is for creating a job posting

Field-specific guidance:
- additionalInstructions: Ask about specific skills, requirements, or preferences for the job
- hourlyRate: Ask about budget with relevant pricing guidance for hiring someone
- gigLocation: Ask about location with context about finding nearby workers
- gigDate: Ask about timing with context about availability
- gigTime: Ask about the specific start time of the gig

GIG CREATION CONTEXT: Remember, this user is creating a job posting to hire someone. They are the employer/buyer. Keep responses focused on gig creation only.

Be creative and natural in your responses. Don't repeat the same phrases or structure. Make each message feel fresh and conversational.`;

    const result = await geminiAIAgent(
      "gemini-2.0-flash",
      {
        prompt,
        responseSchema: promptSchema,
        isStream: false,
      },
      ai
    );

    if (result.ok) {
      const data = result.data as { prompt: string };
      return data.prompt;
    }
  } catch (error) {
    console.error('AI prompt generation failed:', error);
  }
  
  // Fallback prompt
  return `Tell me more about your ${fieldName}! I'm here to help you create the perfect gig listing! ✨`;
}

const gigStepSchema = Schema.object({
  properties: {
    field: Schema.string(),
    prompt: Schema.string(),
    isComplete: Schema.boolean(),
  },
});
const gigSummarySchema = Schema.object({
  properties: {
    gigDescription: Schema.string(),
    additionalInstructions: Schema.string(),
    hourlyRate: Schema.number(),
    gigLocation: Schema.string(),
    gigDate: Schema.string(),
    gigTime: Schema.string(),
    discountCode: Schema.string(),
    selectedWorker: Schema.string(),
  },
  optionalProperties: ["discountCode", "selectedWorker"],
});

function buildPromptFromFormData(formData: Record<string, any>, lastField: string, lastValue: any) {
  return `
You are an onboarding assistant for gig creation. Here is the conversation so far:

${Object.entries(formData)
  .map(([field, value]) => `User answered "${value}" for "${field}".`)
  .join('\n')}

The last question was about "${lastField}", and the user answered: "${lastValue}".

Your job is to:
- Respond in a friendly, helpful, and concise way, like the following examples:
  - "Hi! Tell me about yourself and what gig or gigs you need filling - we can assemble a team if you need one!"
  - "We have some great bartenders available. Do you need any special skills or do you have instructions for your hire?"
  - "How much you would like to pay per hour? We suggest £15 plus tips to keep a motivated and happy team!"
  - "Where is the gig? What time and day do you need someone and for how long?"
- If the answer is clear, confirm it and move to the next logical question (e.g., ask about pay, location, date, etc.).
- If the answer is unclear, ask for clarification.
- If all required info is collected, summarize and confirm.

Respond as a single message, as if you are the bot in a chat.`;
}

type ChatStep = {
  id: number;
  type: "bot" | "user" | "input" | "sanitized" | "typing";
  content?: string;
  inputConfig?: StepInputConfig;
  isComplete?: boolean;
  sanitizedValue?: string | any; // Allow objects for coordinates
  originalValue?: string | any; // Allow objects for coordinates
  fieldName?: string;
  isNew?: boolean; // Track if this step is new for animation purposes
};

// Define the onboarding steps statically, following the original order and messages
const staticOnboardingSteps: ChatStep[] = [
  {
    id: 1,
    type: "bot",
    content: "Hi! I'm Able, your friendly AI assistant! 🎉 I'm here to help you create the perfect gig listing. Tell me what kind of work you need help with - whether it's bartending for a wedding, web development for your business, or anything else! What's your gig all about?",
  },
  {
    id: 2,
    type: "input",
    inputConfig: {
      type: "text",
      name: "gigDescription",
      label: "Gig Description:",
    },
    isComplete: false,
  },
  {
    id: 3,
    type: "bot",
    content: "We have some great bartenders available. Do you need any special skills or do you have instructions for your hire?",
  },
  {
    id: 4,
    type: "input",
    inputConfig: {
      type: "textarea",
      name: "additionalInstructions",
      placeholder: "e.g., Cocktail making experience would be ideal",
      label: "Additional Instructions:",
      rows: 3,
    },
    isComplete: false,
  },
  {
    id: 5,
    type: "bot",
    content: "How much you would like to pay per hour? We suggest £15 plus tips to keep a motivated and happy team!",
  },
  {
    id: 6,
    type: "input",
    inputConfig: {
      type: "number",
      name: "hourlyRate",
      placeholder: "£15",
      label: "Hourly Rate:",
    },
    isComplete: false,
  },
  {
    id: 7,
    type: "bot",
    content: "Where is the gig? What time and day do you need someone and for how long?",
  },
  {
    id: 8,
    type: "input",
    inputConfig: {
      type: "text",
      name: "gigLocation",
      placeholder: "e.g., The Green Tavern, Rye Lane, Peckham, SE15 5AR",
      label: "Gig Location:",
    },
    isComplete: false,
  },
  {
    id: 9,
    type: "input",
    inputConfig: {
      type: "date",
      name: "gigDate",
      label: "Date of Gig:",
    },
    isComplete: false,
  },
];

// Helper to extract coordinates from Google Maps URL
function extractCoordsFromGoogleMapsUrl(url: string) {
  // Try to match @lat,lng or q=lat,lng
  const atMatch = url.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (atMatch) return { lat: parseFloat(atMatch[1]), lng: parseFloat(atMatch[2]) };
  const qMatch = url.match(/[?&]q=(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (qMatch) return { lat: parseFloat(qMatch[1]), lng: parseFloat(qMatch[2]) };
  return null;
}

// Typing indicator component
const TypingIndicator: React.FC = () => (
  <div style={{ 
    display: 'flex', 
    alignItems: 'center', 
    padding: '12px 16px', 
    color: '#0f766e', 
    fontWeight: 600,
    animation: 'slideIn 0.3s ease-out',
    opacity: 0,
    animationFillMode: 'forwards'
  }}>
    <div style={{ 
      display: 'flex', 
      gap: '4px',
      background: 'rgba(15, 118, 110, 0.1)',
      padding: '8px 12px',
      borderRadius: '20px',
      border: '1px solid rgba(15, 118, 110, 0.2)'
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

// Add a helper to safely extract AI response properties
type AIResponse = {
  sufficient?: boolean;
  clarificationPrompt?: string;
  sanitized?: string;
  summary?: string;
  nextField?: string;
  nextPrompt?: string;
};
function parseAIResponse(data: any): Required<AIResponse> {
  return {
    sufficient: typeof data.sufficient === 'boolean' ? data.sufficient : false,
    clarificationPrompt: typeof data.clarificationPrompt === 'string' ? data.clarificationPrompt : '',
    sanitized: typeof data.sanitized === 'string' ? data.sanitized : '',
    summary: typeof data.summary === 'string' ? data.summary : '',
    nextField: typeof data.nextField === 'string' ? data.nextField : '',
    nextPrompt: typeof data.nextPrompt === 'string' ? data.nextPrompt : '',
  };
}

export default function OnboardBuyerPage() {
  const router = useRouter();
  const { user } = useAuth();
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const endOfChatRef = useRef<HTMLDivElement>(null);
  const { ai } = useFirebase();

  const [formData, setFormData] = useState<Record<string, any>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentFocusedInputName, setCurrentFocusedInputName] = useState<string | null>(null);
  const [chatSteps, setChatSteps] = useState<ChatStep[]>([{
    id: 1,
    type: "bot",
    content: "Hi! Tell me about yourself and what gig or gigs you need filling - we can assemble a team if you need one!",
  }, {
    id: 2,
    type: "input",
    inputConfig: {
      type: "text",
      name: "gigDescription",
    },
    isComplete: false,
  }]);
  // Expanded state for summary fields
  const [expandedSummaryFields, setExpandedSummaryFields] = useState<Record<string, boolean>>({});
  // Add state for typing animation
  const [isTyping, setIsTyping] = useState(false);
  // Update state to track reformulation
  const [reformulateField, setReformulateField] = useState<string | null>(null);

  // Helper to get next required field not in formData
  function getNextRequiredField(formData: Record<string, any>) {
    return requiredFields.find(f => !formData[f.name]);
  }

  // Helper to determine if this is the active input step
  function isActiveInputStep(step: ChatStep, idx: number) {
    // Find the last incomplete input step
    const lastIncompleteInputStep = chatSteps
      .filter(s => s.type === 'input' && !s.isComplete)
      .pop();
    
    // This step is active if it's the last incomplete input step
    return step.id === lastIncompleteInputStep?.id;
  }

  // Remove staticOnboardingSteps and requiredFields logic for dynamic AI-driven flow
  // Only the first question is hardcoded
  const FIRST_QUESTION = "Hi! Tell me about yourself and what gig or gigs you need filling - we can assemble a team if you need one!";

  // Date and time formatting functions
  function formatDateForDisplay(dateValue: any): string {
    if (!dateValue) return '';
    
    try {
      // Handle ISO string format (e.g., "2025-07-30T16:00:00.000Z")
      if (typeof dateValue === 'string' && dateValue.includes('T')) {
        const date = new Date(dateValue);
        return date.toLocaleDateString('en-GB', { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        });
      }
      
      // Handle date input format (e.g., "2025-07-30")
      if (typeof dateValue === 'string' && dateValue.match(/^\d{4}-\d{2}-\d{2}$/)) {
        const date = new Date(dateValue);
        return date.toLocaleDateString('en-GB', { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        });
      }
      
      // Handle Date object
      if (dateValue instanceof Date) {
        return dateValue.toLocaleDateString('en-GB', { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        });
      }
      
      return String(dateValue);
    } catch (error) {
      return String(dateValue);
    }
  }

  function formatTimeForDisplay(timeValue: any): string {
    if (!timeValue) return '';
    
    try {
      // Handle time input format (e.g., "08:00")
      if (typeof timeValue === 'string' && timeValue.match(/^\d{2}:\d{2}$/)) {
        const [hours, minutes] = timeValue.split(':');
        const date = new Date();
        date.setHours(parseInt(hours), parseInt(minutes));
        return date.toLocaleTimeString('en-GB', { 
          hour: 'numeric', 
          minute: '2-digit',
          hour12: true 
        });
      }
      
      // Handle time with seconds (e.g., "08:00:00")
      if (typeof timeValue === 'string' && timeValue.match(/^\d{2}:\d{2}:\d{2}$/)) {
        const [hours, minutes] = timeValue.split(':');
        const date = new Date();
        date.setHours(parseInt(hours), parseInt(minutes));
        return date.toLocaleTimeString('en-GB', { 
          hour: 'numeric', 
          minute: '2-digit',
          hour12: true 
        });
      }
      
      return String(timeValue);
    } catch (error) {
      return String(timeValue);
    }
  }

  // AI-powered validation function using Gemini
  async function simpleAICheck(field: string, value: any, type: string): Promise<{ sufficient: boolean, clarificationPrompt?: string, sanitized?: string | any }> {
    if (!value) {
      return { 
        sufficient: false, 
        clarificationPrompt: 'Please provide some information so I can help you create the perfect gig listing!' 
      };
    }



    const trimmedValue = String(value).trim();
    
    // Use AI for all validation
    try {
      const validationSchema = Schema.object({
        properties: {
          isAppropriate: Schema.boolean(),
          isGigRelated: Schema.boolean(),
          isSufficient: Schema.boolean(),
          clarificationPrompt: Schema.string(),
          sanitizedValue: Schema.string(),
        },
      });

      const prompt = `You are Able, a GIG CREATION ASSISTANT. Your ONLY job is to help users create gig listings (job postings) on a gig platform. You are NOT a general assistant, therapist, or friend. You ONLY help with gig creation.

CRITICAL: This is a GIG CREATION FLOW. The user is creating a job posting to hire someone for work. They are the BUYER/EMPLOYER posting a job. You are helping them create a gig listing.

Previous context from this conversation:
${Object.entries(formData).filter(([key, value]) => value && key !== field).map(([key, value]) => `${key}: ${value}`).join(', ')}

Current field being validated: "${field}"
User input: "${trimmedValue}"
Input type: "${type}"

Validation criteria:
1. isAppropriate: Check if the content is appropriate for a professional gig platform (no offensive language, profanity, or inappropriate content)
2. isGigRelated: Check if the content is related to gig work, events, services, or job requirements (be lenient - most gig descriptions are broad)
3. isSufficient: Check if the content provides basic information (at least 3 characters for text, valid numbers for rates, coordinates for locations)

IMPORTANT: For location fields (gigLocation), coordinate objects with lat/lng properties are ALWAYS valid and sufficient. Do not ask for additional location details if coordinates are provided.

Special handling:
- For coordinates (lat/lng): Accept any valid coordinate format like "Lat: 14.7127059, Lng: 120.9341704" or coordinate objects
- For location objects: If the input is an object with lat/lng properties, accept it as valid location data
- For numbers (hourlyRate): Accept reasonable rates (£5-500 per hour)
- For text: Be lenient and accept most gig-related content
- For dates: Accept any valid date format
- For location fields: Accept coordinates, addresses, venue names, or any location information

If validation passes, respond with:
- isAppropriate: true
- isGigRelated: true
- isSufficient: true
- clarificationPrompt: ""
- sanitizedValue: string (cleaned version of the input)

If validation fails, respond with:
- isAppropriate: boolean
- isGigRelated: boolean
- isSufficient: boolean
- clarificationPrompt: string (provide a friendly, contextual response that references what they've already shared and guides them naturally)
- sanitizedValue: string

GIG CREATION CONTEXT: Remember, this user is creating a job posting to hire someone. They are the employer/buyer. Keep responses focused on gig creation only.

Be conversational and reference their previous inputs when possible. For example:
- If they mentioned "web developer" earlier: "Great! I see you need a web developer. Could you tell me more about what kind of web development skills you're looking for?"
- If they mentioned "wedding": "Perfect! A wedding is such a special occasion. What specific help do you need for your wedding day?"
- If they mentioned "restaurant": "Excellent! Restaurant work can be fast-paced and exciting. What role are you looking to fill?"

Make the conversation feel natural and build on what they've already told you.`;

      const result = await geminiAIAgent(
        "gemini-2.0-flash",
        {
          prompt,
          responseSchema: validationSchema,
          isStream: false,
        },
        ai
      );

      if (result.ok) {
        const validation = result.data as {
          isAppropriate: boolean;
          isGigRelated: boolean;
          isSufficient: boolean;
          clarificationPrompt: string;
          sanitizedValue: string;
        };
        
        if (!validation.isAppropriate || !validation.isGigRelated || !validation.isSufficient) {
          return {
            sufficient: false,
            clarificationPrompt: validation.clarificationPrompt || 'Please provide appropriate gig-related information.',
          };
        }
        
        // For coordinate objects, preserve the original object
        if (value && typeof value === 'object' && 'lat' in value && 'lng' in value) {
          return {
            sufficient: true,
            sanitized: value, // Keep the original coordinate object
          };
        }
        
        // For date fields, ensure proper date format
        if (field === 'gigDate') {
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
        
        // For time fields, ensure proper time format
        if (field === 'gigTime') {
          try {
            // If it's already a valid time string, keep it
            if (typeof value === 'string' && value.match(/^\d{2}:\d{2}$/)) {
              return {
                sufficient: true,
                sanitized: value,
              };
            }
            // If it's a Date object, extract time
            if (value instanceof Date) {
              const hours = value.getHours().toString().padStart(2, '0');
              const minutes = value.getMinutes().toString().padStart(2, '0');
              return {
                sufficient: true,
                sanitized: `${hours}:${minutes}`,
              };
            }
          } catch (error) {
            console.error('Time validation error:', error);
          }
        }
        
        return {
          sufficient: true,
          sanitized: validation.sanitizedValue || trimmedValue,
        };
      }
    } catch (error) {
      console.error('AI validation failed:', error);
    }
    
    // Simple fallback - accept most inputs
    return { sufficient: true, sanitized: trimmedValue };
  }



  // Update handleInputSubmit to use AI validation
  async function handleInputSubmit(stepId: number, inputName: string) {
    if (!formData[inputName]) return;
    
    // Find the current step to get its type
    const currentStep = chatSteps.find(s => s.id === stepId);
    const inputType = currentStep?.inputConfig?.type || 'text';
    
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
    
    try {
      // Use AI validation
      const aiResult = await simpleAICheck(inputName, formData[inputName], inputType);
      
      setChatSteps((prev) => {
        // Remove typing indicator
        const filtered = prev.filter(s => s.type !== 'typing');
        
        if (!aiResult.sufficient) {
          // Add clarification and repeat input
          return [
            ...filtered,
            { 
              id: Date.now() + 2, 
              type: 'bot', 
              content: aiResult.clarificationPrompt,
              isNew: true
            },
            { 
              id: Date.now() + 3, 
              type: 'input', 
              inputConfig: currentStep?.inputConfig, 
              isComplete: false,
              isNew: true
            },
          ];
        }
        
        // Show sanitized confirmation step
        return [
          ...filtered,
          { 
            id: Date.now() + 3, 
            type: 'sanitized', 
            fieldName: inputName, 
            sanitizedValue: aiResult.sanitized, 
            originalValue: formData[inputName],
            isNew: true
          }
        ];
      });
    } catch (error) {
      console.error('AI validation error:', error);
      // Fallback to basic validation
      setChatSteps((prev) => {
        const filtered = prev.filter(s => s.type !== 'typing');
        return [
          ...filtered,
          { 
            id: Date.now() + 2, 
            type: 'bot', 
            content: 'I\'m having trouble processing that. Please try again with a clear description of your gig needs.',
            isNew: true
          },
          { 
            id: Date.now() + 3, 
            type: 'input', 
            inputConfig: currentStep?.inputConfig, 
            isComplete: false,
            isNew: true
          },
        ];
      });
    }
  }

  // After the last input, show a summary message (optionally call AI for summary)
  // useEffect(() => {
  //   if (chatSteps.length > 0 && chatSteps[chatSteps.length - 1].type === "input" && !chatSteps[chatSteps.length - 1].isComplete) {
  //     // All fields collected, show summary
  //     const summaryMsg: ChatStep = {
  //       id: Date.now() + 1,
  //       type: "bot",
  //       content: `Thank you! Here is a summary of your gig:\n${JSON.stringify(formData, null, 2)}`,
  //     };
  //     setChatSteps((prev) => [...prev, summaryMsg]);
  //   }
  // }, [chatSteps.length, formData]);

  // Remove complex AI useEffect - no longer needed

  // Update sanitized confirmation effect to use AI's next question or summary
  useEffect(() => {
    if (reformulateField) {
      // Find the required field config and map to StepInputConfig (exclude defaultPrompt)
      const fieldConfig = requiredFields.find(f => f.name === reformulateField);
      let inputConfig: StepInputConfig | undefined;
      if (fieldConfig) {
        inputConfig = {
          name: fieldConfig.name,
          type: fieldConfig.type as FormInputType,
        };
        if ('placeholder' in fieldConfig && fieldConfig.placeholder) {
          inputConfig.placeholder = fieldConfig.placeholder as string;
        }
        if ('rows' in fieldConfig && fieldConfig.rows) {
          inputConfig.rows = fieldConfig.rows as number;
        }
      }
      
      if (inputConfig) {
        // Add typing indicator first
        setChatSteps((prev) => [
          ...prev,
          {
            id: Date.now() + 2,
            type: "typing",
            isNew: true,
          },
        ]);
        
        setTimeout(() => {
          setChatSteps((prev) => {
            // Remove typing indicator and add bot message and input
            const filtered = prev.filter(s => s.type !== 'typing');
            return [
              ...filtered,
              {
                id: Date.now() + 3,
                type: "bot",
                content: `Please provide a more specific answer for "${reformulateField}".`,
                isNew: true,
              },
              {
                id: Date.now() + 4,
                type: "input",
                inputConfig: inputConfig,
                isComplete: false,
              },
            ];
          });
        }, 700);
      }
      setReformulateField(null);
    }
  }, [reformulateField]);

  async function handleSanitizedConfirm(fieldName: string, sanitized: string | any) {
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
      // Generate context-aware prompt
      // Try to get gigDescription from formData, but if not available, use the current field value as context
      const gigDescription = updatedFormData.gigDescription || (fieldName === 'additionalInstructions' ? (typeof sanitized === 'string' ? sanitized : JSON.stringify(sanitized)) : '');
      
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
      const contextAwarePrompt = await generateContextAwarePrompt(nextField.name, gigDescription, ai);
      
      setTimeout(() => {
        setChatSteps((prev) => {
          // Remove typing indicator and add bot message and input
          const filtered = prev.filter(s => s.type !== 'typing');
          const newInputConfig = {
            type: nextField.type as FormInputType,
            name: nextField.name,
            placeholder: nextField.placeholder || nextField.defaultPrompt,
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
              type: "input",
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
      
      setTimeout(() => {
        setChatSteps((prev) => {
          // Remove typing indicator and add summary
          const filtered = prev.filter(s => s.type !== 'typing');
          return [
            ...filtered,
            {
              id: Date.now() + 5,
              type: "bot",
              content: `Thank you! Here is a summary of your gig:\n${JSON.stringify(updatedFormData, null, 2)}`,
              isNew: true,
            },
          ];
        });
      }, 700);
    }
  }

  function handleSanitizedReformulate(fieldName: string) {
    setReformulateField(fieldName);
  }

  const handleInputChange = (name: string, value: any) => {
    // Special handling for date fields to ensure only date part is stored
    if (name === 'gigDate' && value) {
      let processedValue = value;
      
      // If it's an ISO string with time, extract just the date part
      if (typeof value === 'string' && value.includes('T')) {
        processedValue = value.split('T')[0];
      }
      
      // If it's a Date object, convert to date string
      if (value instanceof Date) {
        processedValue = value.toISOString().split('T')[0];
      }
      
      setFormData((prev) => ({ ...prev, [name]: processedValue }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleBookWorker = (name: string, price: number) => {
    if (!user) return; // Disable booking if not logged in
    setIsSubmitting(true);
    const bookingResponseStep: ChatStep = {
      id: Date.now(),
      type: "user",
      content: `Booking ${name} for £${price.toFixed(2)}...`,
    };
    // Find index of step 11 to insert after it
    const lastBotMessageIndex = chatSteps.findIndex((s) => s.id === 11);
    if (lastBotMessageIndex !== -1) {
      setChatSteps((prev) => [...prev.slice(0, lastBotMessageIndex + 1), bookingResponseStep, ...prev.slice(lastBotMessageIndex + 1)]);
    } else {
      setChatSteps((prev) => [...prev, bookingResponseStep]);
    }
    setIsSubmitting(false);
  };

  const handleFinalSubmit = async () => {
    if (!user) return; // Disable submission if not logged in
    setIsSubmitting(true);
    const submissionData = {
      ...formData,
      gigLocationCoords: formData.gigLocationCoords,
      workerName: null, // No longer needed
      workerPrice: null, // No longer needed
    };
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const contentMessage =
      "Thanks! Your request is being processed (Mocked).";

    const successMessageStep: ChatStep = {
      id: Date.now() + 1,
      type: "bot",
      content: contentMessage,
    };

    setChatSteps((prev) => [...prev, successMessageStep]);
    setIsSubmitting(false);
  };

  // Auto-scroll to the bottom (Confirm button or latest message) whenever chatSteps or isTyping changes
  useEffect(() => {
    if (endOfChatRef.current) {
      setTimeout(() => {
        endOfChatRef.current?.scrollIntoView({ 
          behavior: 'smooth',
          block: 'end',
          inline: 'nearest'
        });
      }, 100); // Small delay to ensure animations have started
    }
  }, [chatSteps, isTyping]);

  // Initialize chat with AI greeting
  useEffect(() => {
    if (chatSteps.length === 0) {
      setChatSteps([
        {
          id: 1,
          type: "bot",
          content: FIRST_QUESTION,
        },
        {
          id: 2,
          type: "input",
          inputConfig: {
            type: "text" as FormInputType,
            name: "gigDescription",
            placeholder: "Tell me about your gig...",
          },
          isComplete: false,
        },
      ]);
    }
  }, []);

  if (!user) {
    return <Loader />;
  }

  return (
    <>
      <ChatBotLayout
        ref={chatContainerRef}
        onScroll={() => {}}
        onHomeClick={() => router.push(`/user/${user?.uid || "this_user"}/buyer`)}
        className={pageStyles.container}
      >
        {chatSteps.map((step, idx) => {
          const key = `step-${step.id}-${step.type}-${step.inputConfig?.name || Math.random()}`;
          if (step.type === "bot" && typeof step.content === "string" && step.content.startsWith("Thank you! Here is a summary of your gig:")) {
            // Try to extract and parse the JSON
            const match = step.content.match(/Thank you! Here is a summary of your gig:\n([\s\S]*)/);
            let summaryData = null;
            if (match) {
              try {
                summaryData = JSON.parse(match[1]);
              } catch (e) {
                summaryData = null;
              }
            }
            if (summaryData) {
              return (
                <div key={key} style={{ background: '#222', color: '#fff', borderRadius: 8, padding: 16, margin: '16px 0', boxShadow: '0 2px 8px #0002' }}>
                  <h3 style={{ marginTop: 0 }}>Gig Summary</h3>
                  <ul style={{ listStyle: 'none', padding: 0 }}>
                    {Object.entries(summaryData).map(([field, value]) => {
                      if (field === 'gigLocation' && typeof value === 'string' && value.length > 40) {
                        return (
                          <li key={field} style={{ marginBottom: 8 }}>
                            <strong style={{ textTransform: 'capitalize' }}>{field.replace(/([A-Z])/g, ' $1')}: </strong>
                            <span
                              style={{
                                cursor: 'pointer',
                                wordBreak: 'break-all',
                                display: 'inline-block',
                                maxWidth: expandedSummaryFields[field] ? '100%' : 220,
                                whiteSpace: expandedSummaryFields[field] ? 'normal' : 'nowrap',
                                overflow: 'hidden',
                                textOverflow: expandedSummaryFields[field] ? 'clip' : 'ellipsis',
                                verticalAlign: 'bottom',
                              }}
                              title={expandedSummaryFields[field] ? 'Click to collapse' : 'Click to expand'}
                              onClick={() =>
                                setExpandedSummaryFields(prev => ({
                                  ...prev,
                                  [field]: !prev[field]
                                }))
                              }
                            >
                              {expandedSummaryFields[field] ? value : value.slice(0, 37) + '...'}
                            </span>
                          </li>
                        );
                      }
                      return (
                        <li key={field} style={{ marginBottom: 8 }}>
                          <strong style={{ textTransform: 'capitalize' }}>{field.replace(/([A-Z])/g, ' $1')}: </strong>
                          <span>
                            {value && typeof value === 'object' && 'lat' in value && 'lng' in value
                              ? `Lat: ${value.lat}, Lng: ${value.lng}`
                              : field === 'gigDate'
                                ? formatDateForDisplay(value)
                                : field === 'gigTime'
                                  ? formatTimeForDisplay(value)
                                  : typeof value === 'object'
                                    ? JSON.stringify(value)
                                    : String(value)}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                  <button
                    style={{ 
                      marginTop: 16, 
                      background: "#0f766e", 
                      color: "#fff", 
                      border: "none", 
                      borderRadius: 8, 
                      padding: "8px 16px", 
                      fontWeight: 600,
                      transition: 'all 0.3s ease',
                      transform: 'scale(1)',
                      animation: 'pulse 2s infinite'
                    }}
                    onClick={() => router.push(`/user/${user?.uid || "this_user"}/buyer/dashboard`)}
                    onMouseOver={(e) => {
                      e.currentTarget.style.transform = 'scale(1.05)';
                      e.currentTarget.style.background = '#0d5a52';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.transform = 'scale(1)';
                      e.currentTarget.style.background = '#0f766e';
                    }}
                  >
                    <style>{`
                      @keyframes pulse {
                        0% {
                          box-shadow: 0 0 0 0 rgba(15, 118, 110, 0.7);
                        }
                        70% {
                          box-shadow: 0 0 0 10px rgba(15, 118, 110, 0);
                        }
                        100% {
                          box-shadow: 0 0 0 0 rgba(15, 118, 110, 0);
                        }
                      }
                    `}</style>
                    Confirm & Go to Dashboard
                  </button>
                </div>
              );
            }
            // Fallback to raw message if parsing fails
            return (
              <MessageBubble
                key={key}
                text={step.content as string}
                senderType="bot"
              />
            );
          }
          if (step.type === "bot") {
            return (
              <MessageBubble
                key={key}
                text={step.content as string}
                senderType="bot"
              />
            );
          }
          if (step.type === "user") {
            return (
              <MessageBubble
                key={key}
                text={typeof step.content === 'object' ? JSON.stringify(step.content) : String(step.content)}
                senderType="user"
                showAvatar={false}
              />
            );
          }
          if (step.type === "input" && !step.isComplete) {
            const inputConf = step.inputConfig!;
            const isActive = isActiveInputStep(step, idx);
            const isProcessing = chatSteps.some(s => s.type === 'typing');
            
            // Custom UI for gigLocation
            if (inputConf.name === "gigLocation") {
              return (
                <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <LocationPickerBubble
                    value={formData.gigLocation}
                    onChange={val => handleInputChange('gigLocation', val)}
                    showConfirm={!!formData.gigLocation && isActive}
                    onConfirm={() => handleInputSubmit(step.id, 'gigLocation')}
                  />
                </div>
              );
            }
            // Custom UI for gigDate (calendar picker)
            if (inputConf.name === "gigDate") {
              return (
                <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <CalendarPickerBubble
                    value={formData.gigDate ? new Date(formData.gigDate) : null}
                    onChange={date => handleInputChange('gigDate', date ? date.toISOString() : "")}
                  />
                  {isActive && formData.gigDate && (
                    <button
                      style={{ 
                        margin: '8px 0', 
                        background: '#0f766e', 
                        color: '#fff', 
                        border: 'none', 
                        borderRadius: 8, 
                        padding: '6px 16px', 
                        fontWeight: 600,
                        transition: 'all 0.3s ease',
                        transform: 'scale(1)'
                      }}
                      onClick={() => handleInputSubmit(step.id, 'gigDate')}
                      onMouseOver={(e) => {
                        e.currentTarget.style.transform = 'scale(1.05)';
                        e.currentTarget.style.background = '#0d5a52';
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.transform = 'scale(1)';
                        e.currentTarget.style.background = '#0f766e';
                      }}
                    >
                      Confirm
                    </button>
                  )}
                </div>
              );
            }
            // Only allow supported types for InputBubble
            const allowedTypes = ["number", "text", "email", "password", "date", "tel"];
            const safeType = allowedTypes.includes(inputConf.type) ? inputConf.type : "text";
            
            // Handle textarea inputs
            if (inputConf.type === "textarea") {
              return (
                <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <TextAreaBubble
                    id={inputConf.name}
                    name={inputConf.name}
                    value={formData[inputConf.name] || ""}
                    disabled={isSubmitting || isProcessing}
                    placeholder={inputConf.placeholder}
                    rows={inputConf.rows || 3}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                      handleInputChange(inputConf.name, e.target.value)
                    }
                    onFocus={() => setCurrentFocusedInputName(inputConf.name)}
                    onBlur={() => {}}
                    onKeyPress={(e: React.KeyboardEvent<HTMLTextAreaElement>) => {
                      if (e.key === "Enter" && e.ctrlKey && !isProcessing) {
                        e.preventDefault();
                        handleInputSubmit(step.id, inputConf.name);
                      }
                    }}
                    ref={undefined}
                  />
                  {isActive && formData[inputConf.name] && !isProcessing && (
                    <button
                      style={{ margin: '8px 0', background: '#0f766e', color: '#fff', border: 'none', borderRadius: 8, padding: '6px 16px', fontWeight: 600 }}
                      onClick={() => handleInputSubmit(step.id, inputConf.name)}
                    >
                      Confirm
                    </button>
                  )}
                </div>
              );
            }
            
            return (
              <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <InputBubble
                  id={inputConf.name}
                  name={inputConf.name}
                  value={(() => {
                    const val = formData[inputConf.name];
                    if (val && typeof val === 'object' && 'lat' in val && 'lng' in val) {
                      return `Lat: ${val.lat.toFixed(6)}, Lng: ${val.lng.toFixed(6)}`;
                    } else if (typeof val === 'object') {
                      return JSON.stringify(val);
                    } else {
                      return val || "";
                    }
                  })()}
                  disabled={isSubmitting || isProcessing}
                  type={safeType as "number" | "text" | "email" | "password" | "date" | "tel"}
                  placeholder={inputConf.placeholder}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    handleInputChange(inputConf.name, e.target.value);
                  }}
                  onFocus={() => setCurrentFocusedInputName(inputConf.name)}
                  onBlur={() => {}}
                  onKeyPress={(e: React.KeyboardEvent<HTMLInputElement>) => {
                    if (e.key === "Enter" && !isProcessing) {
                      e.preventDefault();
                      handleInputSubmit(step.id, inputConf.name);
                    }
                  }}
                  ref={(el: HTMLInputElement | null) => {
                    if (el && currentFocusedInputName === inputConf.name) el.focus();
                  }}
                />
                {isActive && formData[inputConf.name] && !isProcessing && (
                  <button
                    style={{ margin: '8px 0', background: '#0f766e', color: '#fff', border: 'none', borderRadius: 8, padding: '6px 16px', fontWeight: 600 }}
                    onClick={() => handleInputSubmit(step.id, inputConf.name)}
                  >
                    Confirm
                  </button>
                )}
              </div>
            );
          }
          // Show completed inputs as read-only text bubbles
          if (step.type === "input" && step.isComplete) {
            const inputConf = step.inputConfig!;
            const value = formData[inputConf.name];
            
            if (!value) return null;
            
            // Format the value properly to handle objects
            const displayValue = (() => {
              if (value && typeof value === 'object' && 'lat' in value && 'lng' in value) {
                return `Lat: ${value.lat}, Lng: ${value.lng}`;
              } else if (typeof value === 'object') {
                return JSON.stringify(value);
              } else {
                return String(value);
              }
            })();
            
            return (
              <div key={key} style={{ 
                background: '#2a2a2a', 
                color: '#e5e5e5', 
                borderRadius: 8, 
                padding: 12, 
                margin: '8px 0',
                border: '1px solid #404040',
                fontSize: '14px',
                lineHeight: '1.4'
              }}>
                <div style={{ color: '#0f766e', fontWeight: 600, marginBottom: 4, fontSize: '12px' }}>
                  {inputConf.label}
                </div>
                <div>{displayValue}</div>
              </div>
            );
          }
          // Typing animation
          if (step.type === "typing") {
            return <MessageBubble key={key} text={<TypingIndicator />} senderType="bot" />;
          }
          // Handle the new sanitized step type
          if (step.type === "sanitized" && step.fieldName) {
            // Format the sanitized value properly
            const displayValue = (() => {
              const sanitizedValue = step.sanitizedValue as any; // Type assertion since it can be object or string
              
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
            
            return (
              <div key={key} style={{ background: '#1a1a1a', borderRadius: 12, padding: 16, margin: '16px 0', boxShadow: '0 4px 12px rgba(15, 118, 110, 0.2)', border: '1px solid #0f766e' }}>
                <div style={{ marginBottom: 8, color: '#0f766e', fontWeight: 600, fontSize: '14px' }}>This is what you wanted?</div>
                <div style={{ marginBottom: 16, fontStyle: 'italic', color: '#e5e5e5', fontSize: '15px', lineHeight: '1.4' }}>{displayValue}</div>
                <div style={{ display: 'flex', gap: 12 }}>
                  <button
                    style={{ background: '#0f766e', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', fontWeight: 600, fontSize: '14px', cursor: 'pointer', transition: 'background-color 0.2s' }}
                    onClick={() => handleSanitizedConfirm(step.fieldName!, step.sanitizedValue!)}
                    onMouseOver={(e) => e.currentTarget.style.background = '#0d5a52'}
                    onMouseOut={(e) => e.currentTarget.style.background = '#0f766e'}
                  >
                    Confirm
                  </button>
                  <button
                    style={{ background: 'transparent', color: '#0f766e', border: '1px solid #0f766e', borderRadius: 8, padding: '8px 16px', fontWeight: 600, fontSize: '14px', cursor: 'pointer', transition: 'all 0.2s' }}
                    onClick={() => handleSanitizedReformulate(step.fieldName!)}
                    onMouseOver={(e) => { e.currentTarget.style.background = '#0f766e'; e.currentTarget.style.color = '#fff'; }}
                    onMouseOut={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#0f766e'; }}
                  >
                    Reformulate
                  </button>
                </div>
              </div>
            );
          }
          return null;
        })}
        <div ref={endOfChatRef} />
        {isSubmitting && (
          <MessageBubble
            key="submitting-msg"
            text="Processing..."
            senderType="bot"
          />
        )}
      </ChatBotLayout>
    </>
  );
}