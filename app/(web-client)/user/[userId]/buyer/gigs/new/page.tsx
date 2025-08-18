"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

import ChatBotLayout from "@/app/components/onboarding/ChatBotLayout";
import MessageBubble from "@/app/components/onboarding/MessageBubble";
import WorkerCard, { WorkerData } from "@/app/components/onboarding/WorkerCard"; // Import shared WorkerCard and WorkerData
import LocationPickerBubble from "@/app/components/onboarding/LocationPickerBubble";
import CalendarPickerBubble from "@/app/components/onboarding/CalendarPickerBubble";

import Loader from "@/app/components/shared/Loader";

import pageStyles from "./page.module.css";
import { useAuth } from "@/context/AuthContext";
import { createGig } from "@/actions/gigs/create-gig";
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

// Define required fields and their configs for buyer gig creation
const requiredFields: RequiredField[] = [
  { name: "gigDescription", type: "text", placeholder: "e.g., Bartender for a wedding reception", defaultPrompt: "Tell me about yourself and what gig or gigs you need filling!", rows: 3 },
  { name: "additionalInstructions", type: "text", placeholder: "e.g., Cocktail making experience would be ideal", defaultPrompt: "Do you need any special skills or do you have instructions for your hire?", rows: 3 },
  { name: "hourlyRate", type: "number", placeholder: "£15", defaultPrompt: "How much would you like to pay per hour?" },
  { name: "gigLocation", type: "location", defaultPrompt: "Where is the gig located?" },
  { name: "gigDate", type: "date", defaultPrompt: "What date is the gig?" },
  { name: "gigTime", type: "time", defaultPrompt: "What time does the gig start?" },
];

// Currency note for users
const CURRENCY_NOTE = "💡 All amounts and rates are in British Pounds (£)";

// Type definitions for better type safety
interface RequiredField {
  name: string;
  type: string;
  placeholder?: string;
  defaultPrompt: string;
  rows?: number;
}

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
- hourlyRate: Ask about budget with relevant pricing guidance for hiring someone in British Pounds (£)
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
  - "How much you would like to pay per hour? We suggest £15 plus tips to keep a motivated and happy team! All amounts are in British Pounds (£)"
  - "Where is the gig? What time and day do you need someone and for how long?"
- If the answer is clear, confirm it and move to the next logical question (e.g., ask about pay, location, date, etc.).
- If the answer is unclear, ask for clarification.
- If all required info is collected, summarize and confirm.

Respond as a single message, as if you are the bot in a chat.`;
}

type ChatStep = {
  id: number;
  type: "bot" | "user" | "input" | "sanitized" | "typing" | "calendar" | "location" | "confirm";
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
    color: 'var(--secondary-color)', 
    fontWeight: 600,
    animation: 'slideIn 0.3s ease-out',
    opacity: 0,
    animationFillMode: 'forwards'
  }}>
    <div style={{ 
      display: 'flex', 
      gap: '4px',
      background: 'rgba(126, 238, 249, 0.1)',
      padding: '8px 12px',
      borderRadius: '20px',
      border: '1px solid rgba(126, 238, 249, 0.2)'
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
  const [isConfirming, setIsConfirming] = useState(false);
  const [confirmedSteps, setConfirmedSteps] = useState<Set<number>>(new Set());
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
  // Add reformulation state variables
  const [reformulateField, setReformulateField] = useState<string | null>(null);
  const [isReformulating, setIsReformulating] = useState(false);
  const [clickedSanitizedButtons, setClickedSanitizedButtons] = useState<Set<string>>(new Set());
  // Add error state
  const [error, setError] = useState<string | null>(null);


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

  // Enhanced time parsing function that handles time ranges like "12:00-14:30"
  function parseTimeToHHMM(timeValue: any): string | null {
    try {
      if (!timeValue) return null;
      
      // Handle time ranges like "12:00-14:30" or "12:00 - 14:30"
      if (typeof timeValue === 'string') {
        const val = timeValue.trim();
        
        // Check for time range pattern: HH:MM-HH:MM or HH:MM - HH:MM
        const timeRangeMatch = val.match(/^(\d{1,2}):(\d{2})\s*[-–]\s*(\d{1,2}):(\d{2})$/);
        if (timeRangeMatch) {
          // For time ranges, return the start time (first time)
          const hours = parseInt(timeRangeMatch[1], 10);
          const minutes = parseInt(timeRangeMatch[2], 10);
          if (hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59) {
            return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
          }
        }
        
        // Check for time range with AM/PM: "12:00 PM - 2:30 PM"
        const timeRangeAMPM = val.match(/^(\d{1,2}):(\d{2})\s*([AaPp][Mm])\s*[-–]\s*(\d{1,2}):(\d{2})\s*([AaPp][Mm])$/);
        if (timeRangeAMPM) {
          let hours = parseInt(timeRangeAMPM[1], 10);
          const minutes = parseInt(timeRangeAMPM[2], 10);
          const mer = timeRangeAMPM[3]?.toLowerCase();
          
          if (mer === 'pm' && hours !== 12) hours += 12;
          if (mer === 'am' && hours === 12) hours = 0;
          
          if (hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59) {
            return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
          }
        }
      }
      
      // Original time parsing logic for single times
      if (timeValue instanceof Date) {
        const h = timeValue.getHours().toString().padStart(2, '0');
        const m = timeValue.getMinutes().toString().padStart(2, '0');
        return `${h}:${m}`;
      }
      if (typeof timeValue === 'string') {
        const val = timeValue.trim();
        if (val.includes('T')) {
          const d = new Date(val);
          if (!isNaN(d.getTime())) {
            const h = d.getHours().toString().padStart(2, '0');
            const m = d.getMinutes().toString().padStart(2, '0');
            return `${h}:${m}`;
          }
        }
        const hm = val.match(/^(\d{1,2}):(\d{2})\s*([AaPp][Mm])?$/);
        if (hm) {
          let hours = parseInt(hm[1], 10);
          const minutes = parseInt(hm[2], 10);
          const mer = hm[3]?.toLowerCase();
          if (mer) {
            if (hours === 12) hours = 0;
            if (mer === 'pm') hours += 12;
          }
          if (hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59) {
            return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
          }
        }
        const hOnly = val.match(/^(\d{1,2})\s*([AaPp][Mm])$/);
        if (hOnly) {
          let hours = parseInt(hOnly[1], 10);
          const mer = hOnly[2].toLowerCase();
          if (hours === 12) hours = 0;
          if (mer === 'pm') hours += 12;
          if (hours >= 0 && hours <= 23) return `${hours.toString().padStart(2, '0')}:00`;
        }
      }
    } catch {}
    return null;
  }

  // New function to extract both start and end times from time ranges
  function parseTimeRange(timeValue: any): { startTime: string | null; endTime: string | null; duration: number | null } {
    try {
      if (!timeValue || typeof timeValue !== 'string') {
        return { startTime: null, endTime: null, duration: null };
      }
      
      const val = timeValue.trim();
      
      // Pattern: "12:00-14:30" or "12:00 - 14:30"
      const timeRangeMatch = val.match(/^(\d{1,2}):(\d{2})\s*[-–]\s*(\d{1,2}):(\d{2})$/);
      if (timeRangeMatch) {
        const startHours = parseInt(timeRangeMatch[1], 10);
        const startMinutes = parseInt(timeRangeMatch[2], 10);
        const endHours = parseInt(timeRangeMatch[3], 10);
        const endMinutes = parseInt(timeRangeMatch[4], 10);
        
        if (startHours >= 0 && startHours <= 23 && startMinutes >= 0 && startMinutes <= 59 &&
            endHours >= 0 && endHours <= 23 && endMinutes >= 0 && endMinutes <= 59) {
          
          const startTime = `${startHours.toString().padStart(2, '0')}:${startMinutes.toString().padStart(2, '0')}`;
          const endTime = `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`;
          
          // Calculate duration in hours
          const startTotalMinutes = startHours * 60 + startMinutes;
          const endTotalMinutes = endHours * 60 + endMinutes;
          const durationHours = (endTotalMinutes - startTotalMinutes) / 60;
          
          return { startTime, endTime, duration: durationHours };
        }
      }
      
      // Pattern: "12:00 PM - 2:30 PM"
      const timeRangeAMPM = val.match(/^(\d{1,2}):(\d{2})\s*([AaPp][Mm])\s*[-–]\s*(\d{1,2}):(\d{2})\s*([AaPp][Mm])$/);
      if (timeRangeAMPM) {
        let startHours = parseInt(timeRangeAMPM[1], 10);
        const startMinutes = parseInt(timeRangeAMPM[2], 10);
        const startMer = timeRangeAMPM[3]?.toLowerCase();
        let endHours = parseInt(timeRangeAMPM[4], 10);
        const endMinutes = parseInt(timeRangeAMPM[5], 10);
        const endMer = timeRangeAMPM[6]?.toLowerCase();
        
        // Convert to 24-hour format
        if (startMer === 'pm' && startHours !== 12) startHours += 12;
        if (startMer === 'am' && startHours === 12) startHours = 0;
        if (endMer === 'pm' && endHours !== 12) endHours += 12;
        if (endMer === 'am' && endHours === 12) endHours = 0;
        
        if (startHours >= 0 && startHours <= 23 && startMinutes >= 0 && startMinutes <= 59 &&
            endHours >= 0 && endHours <= 23 && endMinutes >= 0 && endMinutes <= 59) {
          
          const startTime = `${startHours.toString().padStart(2, '0')}:${startMinutes.toString().padStart(2, '0')}`;
          const endTime = `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`;
          
          // Calculate duration in hours
          const startTotalMinutes = startHours * 60 + startMinutes;
          const endTotalMinutes = endHours * 60 + endMinutes;
          const durationHours = (endTotalMinutes - startTotalMinutes) / 60;
          
          return { startTime, endTime, duration: durationHours };
        }
      }
      
      // If no range pattern found, return null for all
      return { startTime: null, endTime: null, duration: null };
    } catch {
      return { startTime: null, endTime: null, duration: null };
    }
  }

  function formatTimeForDisplay(timeValue: any): string {
    if (!timeValue) return '';
    try {
      // Handle time ranges like "12:00 to 16:00"
      if (typeof timeValue === 'string' && timeValue.includes(' to ')) {
        const [startTime, endTime] = timeValue.split(' to ');
        const formattedStart = formatSingleTime(startTime);
        const formattedEnd = formatSingleTime(endTime);
        return `${formattedStart} to ${formattedEnd}`;
      }
      
      // Handle single times
      return formatSingleTime(timeValue);
    } catch {
      return String(timeValue);
    }
  }

  function formatSingleTime(timeValue: any): string {
    if (!timeValue) return '';
    try {
      const hhmm = parseTimeToHHMM(timeValue);
      if (hhmm) {
        const [hours, minutes] = hhmm.split(':');
        const date = new Date();
        date.setHours(parseInt(hours, 10), parseInt(minutes, 10));
        return date.toLocaleTimeString('en-GB', { hour: 'numeric', minute: '2-digit', hour12: true });
      }
      return String(timeValue);
    } catch {
      return String(timeValue);
    }
  }

  // AI-powered validation function using Gemini
  async function simpleAICheck(field: string, value: any, type: string, ai: any): Promise<{ sufficient: boolean, clarificationPrompt?: string, sanitized?: string | any }> {
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

SPECIAL TIME HANDLING: For time fields (gigTime), if the user provides a time range like "12PM to 4pm" or "12:00-14:30" or "12:00 PM - 2:30 PM":
- Accept it as valid
- In sanitizedValue, convert to 24-hour format: "12:00 to 16:00" or "12:00 to 14:30"
- For time ranges, always use the format "HH:MM to HH:MM" in 24-hour time
- Examples:
  * "12PM to 4pm" → "12:00 to 16:00"
  * "9am to 5pm" → "09:00 to 17:00"
  * "2:30 PM to 6:30 PM" → "14:30 to 18:30"
  * "12:00-14:30" → "12:00 to 14:30"
- This standardized format helps with gig scheduling and display

Special handling:
- For coordinates (lat/lng): Accept any valid coordinate format like "Lat: 14.7127059, Lng: 120.9341704" or coordinate objects
- For location objects: If the input is an object with lat/lng properties, accept it as valid location data
- For numbers (hourlyRate): Accept reasonable rates (£5-500 per hour)
- For text: Be lenient and accept most gig-related content
- For dates: Accept any valid date format
- For location fields: Accept coordinates, addresses, venue names, or any location information
- For time fields: Accept single times (12:00, 2:30 PM) or time ranges (12:00-14:30, 12:00 PM - 2:30 PM)

If validation passes, respond with:
- isAppropriate: true
- isGigRelated: true
- isSufficient: true
- clarificationPrompt: ""
- sanitizedValue: string (cleaned version of the input, with special formatting for time ranges)

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
            const hhmm = parseTimeToHHMM(value);
            if (hhmm) {
              return { sufficient: true, sanitized: hhmm };
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
  async function handleInputSubmit(stepId: number, inputName: string, inputValue?: string) {
    const valueToUse = inputValue || formData[inputName];
    if (!valueToUse) return;
    
    // Find the current step to get its type
    const currentStep = chatSteps.find(s => s.id === stepId);
    const inputType = currentStep?.inputConfig?.type || 'text';
    
    // Remove reformulation check - now handled directly for insufficient answers
    
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
      const aiResult = await simpleAICheck(inputName, valueToUse, inputType, ai);
      
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
        return;
      }
      
      // Check if this is a reformulation
      const isReformulation = reformulateField === inputName;
      
      if (isReformulation) {
        // If this is a reformulation, update the form data and proceed to next field
        // instead of showing sanitized confirmation again
        setFormData(prev => ({ ...prev, [inputName]: aiResult.sanitized }));
        
        // Reset reformulating state and clear reformulateField
        setIsReformulating(false);
        setReformulateField(null);
        
        // Find next required field
        const updatedFormData = { ...formData, [inputName]: aiResult.sanitized };
        const nextField = getNextRequiredField(updatedFormData);
        
        if (nextField) {
          // Generate context-aware prompt for next field
          const gigDescription = updatedFormData.gigDescription || '';
          const contextAwarePrompt = await generateContextAwarePrompt(nextField.name, gigDescription, ai);
          
          const newInputConfig = {
            type: nextField.type as FormInputType,
            name: nextField.name,
            placeholder: nextField.placeholder || nextField.defaultPrompt,
            ...(nextField.rows && { rows: nextField.rows }),
          };
          
          // Determine the step type based on the field
          let stepType: "input" | "calendar" | "location" = "input";
          if (nextField.name === "gigDate") {
            stepType = "calendar";
          } else if (nextField.name === "gigLocation") {
            stepType = "location";
          }
          
          setChatSteps((prev) => [
            ...prev,
            {
              id: Date.now() + 3,
              type: "bot",
              content: contextAwarePrompt,
              isNew: true,
            },
            {
              id: Date.now() + 4,
              type: stepType,
              inputConfig: newInputConfig,
              isComplete: false,
              isNew: true,
            },
          ]);
        } else {
          // All fields collected, show summary
          setChatSteps((prev) => [
            ...prev,
            {
              id: Date.now() + 5,
              type: "bot",
              content: `Thank you! Here is a summary of your gig:\n${JSON.stringify(updatedFormData, null, 2)}`,
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
            isNew: true,
          },
        ]);
        
        // Also update formData with the validated value to preserve coordinates and other data
        setFormData(prev => ({ ...prev, [inputName]: aiResult.sanitized }));
      }
    } catch (error) {
      console.error('AI validation error:', error);
      // Reset reformulating state if this was a reformulation
      if (reformulateField === inputName) {
        setIsReformulating(false);
        setReformulateField(null);
      }
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
          }
        ];
      });
    }
  }

  // Simple function to handle calendar and location confirmations without AI validation
  async function handlePickerConfirm(stepId: number, inputName: string) {
    const value = formData[inputName];
    if (!value) return;
    
    // Prevent multiple clicks
    if (isConfirming) return;
    setIsConfirming(true);
    
    // Mark the current step as complete
    setChatSteps((prev) => prev.map((step) =>
      step.id === stepId ? { ...step, isComplete: true } : step
    ));
    
    // Add typing indicator
    setChatSteps((prev) => [
      ...prev,
      {
        id: Date.now() + 1,
        type: "typing",
        isNew: true,
      },
    ]);
    
    // Process the confirmation (same logic as handleSanitizedConfirm)
    const updatedFormData = { ...formData, [inputName]: value };
    setFormData(updatedFormData);
    
    // Find the next required field
    const nextField = getNextRequiredField(updatedFormData);
    
    setTimeout(async () => {
      // Remove typing indicator first
      setChatSteps((prev) => prev.filter(s => s.type !== 'typing'));
      
      if (nextField) {
        // Generate context-aware prompt
        const contextAwarePrompt = await generateContextAwarePrompt(nextField.name, updatedFormData.gigDescription || '', ai);
        
        // Determine the step type based on the field
        let stepType: "input" | "calendar" | "location" = "input";
        if (nextField.name === "gigDate") {
          stepType = "calendar";
        } else if (nextField.name === "gigLocation") {
          stepType = "location";
        }
        
        const newInputConfig = {
          type: nextField.type as FormInputType,
          name: nextField.name,
          placeholder: nextField.placeholder || nextField.defaultPrompt,
          ...(nextField.rows && { rows: nextField.rows }),
        };
        
        setChatSteps((prev) => [
          ...prev,
          {
            id: Date.now() + 2,
            type: "bot",
            content: contextAwarePrompt,
            isNew: true,
          },
          {
            id: Date.now() + 3,
            type: stepType,
            inputConfig: newInputConfig,
            isComplete: false,
            isNew: true,
          },
        ]);
      } else {
        // All fields collected, show summary
        setChatSteps((prev) => [
          ...prev,
          {
            id: Date.now() + 2,
            type: "bot",
            content: `Thank you! Here is a summary of your gig:\n${JSON.stringify(updatedFormData, null, 2)}`,
            isNew: true,
          },
        ]);
      }
    }, 700);
    
    // Mark this step as confirmed permanently
    setConfirmedSteps(prev => new Set([...prev, stepId]));
    
    // Reset confirming state after a delay to ensure all operations are complete
    setTimeout(() => {
      setIsConfirming(false);
    }, 1000);
  }

  // Handle sanitized confirmation
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
        // Generate context-aware prompt
        const contextAwarePrompt = await generateContextAwarePrompt(nextField.name, updatedFormData.gigDescription || '', ai);
        
        // Determine the step type based on the field
        let stepType: "input" | "calendar" | "location" = "input";
        if (nextField.name === "gigDate") {
          stepType = "calendar";
        } else if (nextField.name === "gigLocation") {
          stepType = "location";
        }
        
        const newInputConfig = {
          type: nextField.type as FormInputType,
          name: nextField.name,
          placeholder: nextField.placeholder || nextField.defaultPrompt,
          ...(nextField.rows && { rows: nextField.rows }),
        };
        
        setChatSteps((prev) => [
          ...prev,
          {
            id: Date.now() + 2,
            type: "bot",
            content: contextAwarePrompt,
            isNew: true,
          },
          {
            id: Date.now() + 3,
            type: stepType,
            inputConfig: newInputConfig,
            isComplete: false,
            isNew: true,
          },
        ]);
      } else {
        // All fields completed, show summary
        setChatSteps((prev) => [
          ...prev,
          {
            id: Date.now() + 2,
            type: "bot",
            content: `Thank you! Here is a summary of your gig:\n${JSON.stringify(updatedFormData, null, 2)}`,
            isNew: true,
          },
        ]);
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

  // Remove old reformulation useEffect - now handled directly in handleInputSubmit





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
      if (name === 'gigTime' && value) {
        const hhmm = parseTimeToHHMM(value);
        setFormData((prev) => ({ ...prev, [name]: hhmm || value }));
      } else {
        setFormData((prev) => ({ ...prev, [name]: value }));
      }
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

    try {
      // Handle gigLocation conversion - if it's an object with coordinates, convert to readable string
      let processedGigLocation: string | undefined;
      if (formData.gigLocation) {
        if (typeof formData.gigLocation === 'object' && formData.gigLocation !== null) {
          const locationObj = formData.gigLocation as any;
          if (locationObj.lat && locationObj.lng) {
            // Convert coordinates to readable format
            processedGigLocation = `Coordinates: ${locationObj.lat.toFixed(6)}, ${locationObj.lng.toFixed(6)}`;
          } else if (locationObj.formatted_address) {
            processedGigLocation = locationObj.formatted_address;
          } else if (locationObj.address) {
            processedGigLocation = locationObj.address;
          } else {
            // Fallback: try to find any meaningful string value
            const locationKeys = Object.keys(locationObj);
            for (const key of locationKeys) {
              const value = locationObj[key];
              if (typeof value === 'string' && value.trim() && value !== 'null' && value !== 'undefined') {
                processedGigLocation = value;
                break;
              }
            }
            // If still no good value, use a descriptive message
            if (!processedGigLocation) {
              processedGigLocation = 'Location coordinates provided';
            }
          }
        } else {
          // It's already a string or other primitive
          processedGigLocation = String(formData.gigLocation);
        }
      }

      const payload = {
        userId: user.uid,
        gigDescription: String(formData.gigDescription || "").trim(),
        additionalInstructions: formData.additionalInstructions ? String(formData.additionalInstructions) : undefined,
        hourlyRate: formData.hourlyRate ?? 0,
        gigLocation: formData.gigLocation, // Send the original location object to preserve coordinates
        gigDate: String(formData.gigDate || "").slice(0, 10),
        gigTime: formData.gigTime ? String(formData.gigTime) : undefined,
      };

      const result = await createGig(payload);

      if (result.status === 200 && result.gigId) {
        const successMessageStep: ChatStep = {
          id: Date.now() + 1,
          type: "bot",
          content: "Thanks! Your gig has been created.",
        };
        setChatSteps((prev) => [...prev, successMessageStep]);
        // Navigate back to buyer dashboard per design
        setTimeout(() => {
          router.push(`/user/${user.uid}/buyer`);
        }, 700);
      } else {
        const errorMessage = result.error || "Failed to create gig. Please try again.";
        const errorStep: ChatStep = {
          id: Date.now() + 2,
          type: "bot",
          content: errorMessage,
        };
        setChatSteps((prev) => [...prev, errorStep]);
      }
    } catch (e: any) {
      const errorStep: ChatStep = {
        id: Date.now() + 3,
        type: "bot",
        content: e?.message || "Unexpected error creating gig.",
      };
      setChatSteps((prev) => [...prev, errorStep]);
    } finally {
      setIsSubmitting(false);
    }
  };

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
            ? { ...step, isComplete: true }
            : step
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

      // Generate a reformulation question asking for reformulated message
      const reformulationPrompt = `Could you provide your reformulated message?`;
      
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
                    fieldConfig.type === "date" ? "calendar" : "input",
              inputConfig: {
                type: fieldConfig.type as FormInputType,
                name: fieldConfig.name,
                placeholder: fieldConfig.placeholder || fieldConfig.defaultPrompt,
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
      const firstField = requiredFields[0];
      setChatSteps([
        {
          id: 1,
          type: "bot",
          content: firstField.defaultPrompt,
        },
        {
          id: 2,
          type: "input",
          inputConfig: {
            type: firstField.type as FormInputType,
            name: firstField.name,
            placeholder: firstField.placeholder,
            ...(firstField.rows && { rows: firstField.rows }),
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
        role="BUYER"
        showChatInput={true}
        onSendMessage={async (message) => {
          console.log('ChatInput received:', message);
          
          // Find current input step (any type that needs user input)
          const currentInputStep = chatSteps.find(step => 
            (step.type === "input" || step.type === "calendar" || step.type === "location") && !step.isComplete
          );
          
          if (currentInputStep && currentInputStep.inputConfig) {
            const fieldName = currentInputStep.inputConfig.name;
            
            // Always add user message to chat for all input types
            const userStep: ChatStep = {
              id: Date.now(),
              type: "user",
              content: message,
              isNew: true
            };
            
            setChatSteps(prev => [...prev, userStep]);
            
            // Update form data
            handleInputChange(fieldName, message);
            
            // Pass the message value directly to handleInputSubmit
            await handleInputSubmit(currentInputStep.id, fieldName, message);
          }
        }}
      >



        {chatSteps.map((step, idx) => {
          const key = `step-${step.id}-${idx}`;
          
          // User message
          if (step.type === "user") {
            return (
              <MessageBubble
                key={key}
                text={step.content}
                senderType="user"
                role="BUYER"
                showAvatar={false}
              />
            );
          }
          
          // Sanitized confirmation step
          if (step.type === "sanitized" && step.fieldName) {
            const sanitizedValue = step.sanitizedValue;
            const originalValue = step.originalValue;
            
            // Format the display value
            const displayValue = (() => {
              if (typeof sanitizedValue === 'string') {
                return sanitizedValue;
              }
              
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
                    <div style={{ marginBottom: 8, color: 'var(--secondary-color)', fontWeight: 600, fontSize: '14px' }}>This is what you wanted?</div>
                    {typeof displayValue === 'string' ? (
                      <div style={{ marginBottom: 16, fontStyle: 'italic', color: '#e5e5e5', fontSize: '15px', lineHeight: '1.4' }}>{displayValue}</div>
                    ) : (
                      displayValue
                    )}
                    <div style={{ display: 'flex', gap: 12 }}>
                      <button
                        style={{ 
                          background: isCompleted ? '#555' : 'var(--secondary-color)', 
                          color: isCompleted ? '#fff' : '#000', 
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
                            e.currentTarget.style.background = 'var(--secondary-darker-color)';
                            e.currentTarget.style.color = '#000';
                          }
                        }}
                        onMouseOut={(e) => {
                          e.currentTarget.style.background = isCompleted ? '#555' : 'var(--secondary-color)';
                          e.currentTarget.style.color = isCompleted ? '#fff' : '#000';
                        }}
                      >
                        {confirmClicked ? 'Confirmed' : 'Confirm'}
                      </button>
                      <button
                        style={{ 
                          background: isCompleted ? '#555' : 'transparent', 
                          color: isCompleted ? '#999' : 'var(--secondary-color)', 
                          border: '1px solid var(--secondary-color)', 
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
                            e.currentTarget.style.background = 'var(--secondary-color)'; 
                            e.currentTarget.style.color = '#fff'; 
                          }
                        }}
                        onMouseOut={(e) => {
                          e.currentTarget.style.background = 'transparent'; 
                          e.currentTarget.style.color = 'var(--secondary-color)'; 
                        }}
                      >
                        {reformulateClicked ? 'Reformulated' : (isReformulatingThisField ? 'Reformulating...' : 'Reformulate')}
                      </button>
                    </div>
                  </div>
                }
                senderType="bot"
                role="BUYER"
                showAvatar={true}
              />
            );
          }
          
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
                <MessageBubble
                  key={key}
                  text={
                    <div style={{ background: '#222', color: '#fff', borderRadius: 8, padding: 16, margin: '16px 0', boxShadow: '0 2px 8px #0002' }}>
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
                                {field === 'hourlyRate' && typeof value === 'number'
                                  ? `£${value.toFixed(2)}`
                                  : value && typeof value === 'object' && 'lat' in value && 'lng' in value
                                    ? (value as any).formatted_address || `Coordinates: ${(value as any).lat.toFixed(6)}, ${(value as any).lng.toFixed(6)}`
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
                          background: "var(--secondary-color)", 
                          color: "#fff", 
                          border: "none", 
                          borderRadius: 8, 
                          padding: "8px 16px", 
                          fontWeight: 600,
                          transition: 'all 0.3s ease',
                          transform: 'scale(1)',
                          animation: 'pulse 2s infinite'
                        }}
                        onClick={() => {
                          if (!isSubmitting) {
                            void handleFinalSubmit();
                          }
                        }}
                        disabled={isSubmitting}
                        onMouseOver={(e) => {
                          e.currentTarget.style.transform = 'scale(1.05)';
                          e.currentTarget.style.background = 'var(--secondary-darker-color)';
                        }}
                        onMouseOut={(e) => {
                          e.currentTarget.style.transform = 'scale(1)';
                          e.currentTarget.style.background = 'var(--secondary-color)';
                        }}
                      >
                        <style>{`
                          @keyframes pulse {
                            0% {
                              box-shadow: 0 0 0 0 rgba(34, 211, 238, 0.7);
                            }
                            70% {
                              box-shadow: 0 0 0 10px rgba(34, 211, 238, 0);
                            }
                            100% {
                              box-shadow: 0 0 0 0 rgba(34, 211, 238, 0);
                            }
                          }
                        `}</style>
                        {isSubmitting ? 'Creating...' : 'Confirm & Go to Dashboard'}
                      </button>
                    </div>
                  }
                  senderType="bot"
                  role="BUYER"
                />
              );
            }
            // Fallback to raw message if parsing fails
            return (
              <MessageBubble
                key={key}
                text={step.content as string}
                senderType="bot"
                role="BUYER"
              />
            );
          }
          if (step.type === "bot") {
            return (
              <MessageBubble
                key={key}
                text={step.content as string}
                senderType="bot"
                role="BUYER"
              />
            );
          }
          if (step.type === "user" as any) {
            return (
              <MessageBubble
                key={key}
                text={typeof step.content === 'object' ? JSON.stringify(step.content) : String(step.content)}
                senderType="user"
                showAvatar={false}
                role="BUYER"
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
                      background: 'linear-gradient(135deg, var(--secondary-color), var(--secondary-darker-color))',
                      boxShadow: '0 2px 8px rgba(34, 211, 238, 0.3)'
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
          if (step.type === "input") {
            // For incomplete inputs, don't show anything - let the user use the chat input
            // For completed inputs, don't show anything since user messages are handled separately
            return null;
          }


          

          
          // Handle calendar picker step
          if (step.type === "calendar") {
            return (
              <div key={key} style={{ 
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.5rem',
                marginBottom: '0.5rem'
              }}>
                {/* AI Avatar - Separated */}
                <div key={`${key}-avatar`} style={{ 
                  flexShrink: 0, 
                  marginTop: '0.25rem' 
                }}>
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'linear-gradient(135deg, var(--secondary-color), var(--secondary-darker-color))',
                    boxShadow: '0 2px 8px rgba(126, 238, 249, 0.3)'
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

                {/* Calendar Picker - Separated */}
                <div key={`${key}-calendar`} style={{ flex: 1 }}>
                  <CalendarPickerBubble
                    name={step.inputConfig?.name}
                    value={formData[step.inputConfig?.name || ''] ? new Date(formData[step.inputConfig?.name || '']) : null}
                    onChange={(date) => {
                      if (step.inputConfig?.name) {
                        handleInputChange(step.inputConfig.name, date);
                      }
                    }}
                    placeholderText={step.inputConfig?.placeholder || "Select a date"}
                    role="BUYER"
                  />
                  
                  {/* Confirm button when date is selected */}
                  {formData[step.inputConfig?.name || ''] && !confirmedSteps.has(step.id) && (
                    <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'flex-end' }}>
                      <button
                        style={{
                          background: isConfirming ? '#555' : 'var(--secondary-color)',
                          border: 'none',
                          borderRadius: '8px',
                          padding: '8px 16px',
                          fontWeight: 600,
                          fontSize: '14px',
                          cursor: isConfirming ? 'not-allowed' : 'pointer',
                          transition: 'background-color 0.2s',
                          opacity: isConfirming ? 0.7 : 1
                        }}
                        onClick={() => {
                          if (step.inputConfig?.name && !isConfirming) {
                            handlePickerConfirm(step.id, step.inputConfig.name);
                          }
                        }}
                        onMouseOver={(e) => {
                          if (!isConfirming) {
                            e.currentTarget.style.background = 'var(--secondary-darker-color)';
                          }
                        }}
                        onMouseOut={(e) => {
                          if (!isConfirming) {
                            e.currentTarget.style.background = 'var(--secondary-color)';
                          }
                        }}
                        disabled={isConfirming}
                      >
                        {isConfirming ? 'Confirming...' : 'Confirm Date'}
                      </button>
                    </div>
                  )}
                  
                  {/* Show confirmed status when step has been confirmed */}
                  {confirmedSteps.has(step.id) && (
                    <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'flex-end' }}>
                      <div style={{
                        background: 'var(--secondary-color)',
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
              </div>
            );
          }
          
          // Handle location picker step
          if (step.type === "location") {
            return (
              <div key={key} style={{ 
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.5rem',
                marginBottom: '0.5rem'
              }}>
                {/* AI Avatar - Separated */}
                <div key={`${key}-avatar`} style={{ 
                  flexShrink: 0, 
                  marginTop: '0.25rem' 
                }}>
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'linear-gradient(135deg, var(--secondary-color), var(--secondary-darker-color))',
                    boxShadow: '0 2px 8px rgba(126, 238, 249, 0.3)'
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

                {/* Location Picker - Separated */}
                <div key={`${key}-location`} style={{ flex: 1 }}>
                  <LocationPickerBubble
                    value={formData[step.inputConfig?.name || '']}
                    onChange={(value) => {
                      if (step.inputConfig?.name) {
                        handleInputChange(step.inputConfig.name, value);
                      }
                    }}
                    role="BUYER"
                  />
                  
                  {/* Confirm button when location is selected */}
                  {formData[step.inputConfig?.name || ''] && !confirmedSteps.has(step.id) && (
                    <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'flex-end' }}>
                      <button
                        style={{
                          background: isConfirming ? '#555' : 'var(--secondary-color)',
                          border: 'none',
                          borderRadius: '8px',
                          padding: '8px 16px',
                          fontWeight: 600,
                          fontSize: '14px',
                          cursor: isConfirming ? 'not-allowed' : 'pointer',
                          transition: 'background-color 0.2s',
                          opacity: isConfirming ? 0.7 : 1
                        }}
                        onClick={() => {
                          if (step.inputConfig?.name && !isConfirming) {
                            handlePickerConfirm(step.id, step.inputConfig.name);
                          }
                        }}
                        onMouseOver={(e) => {
                          if (!isConfirming) {
                            e.currentTarget.style.background = 'var(--secondary-darker-color)';
                          }
                        }}
                        onMouseOut={(e) => {
                          if (!isConfirming) {
                            e.currentTarget.style.background = 'var(--secondary-color)';
                          }
                        }}
                        disabled={isConfirming}
                      >
                        {isConfirming ? 'Confirming...' : 'Confirm Location'}
                      </button>
                    </div>
                  )}
                  
                  {/* Show confirmed status when step has been confirmed */}
                  {confirmedSteps.has(step.id) && (
                    <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'flex-end' }}>
                      <div style={{
                        background: 'var(--secondary-color)',
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
            role="BUYER"
          />
        )}
      </ChatBotLayout>
    </>
  );
}