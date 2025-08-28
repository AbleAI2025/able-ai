"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

import ChatBotLayout from "@/app/components/onboarding/ChatBotLayout";
import MessageBubble from "@/app/components/onboarding/MessageBubble";
import InputBubble from "@/app/components/onboarding/InputBubble";
import TextAreaBubble from "@/app/components/onboarding/TextAreaBubble";
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

import pageStyles from "./OnboardWorkerPage.module.css";
import { useAuth } from "@/context/AuthContext";
import { useFirebase } from '@/context/FirebaseContext';
import { geminiAIAgent } from '@/lib/firebase/ai';
import { Schema } from '@firebase/ai';
import { FormInputType } from "@/app/types/form";

import {
  getStorage,
  ref as storageRef,
  uploadBytesResumable,
  getDownloadURL,
} from "firebase/storage";
import { firebaseApp } from "@/lib/firebase/clientApp";
import { updateVideoUrlProfileAction, saveWorkerProfileFromOnboardingAction } from "@/actions/user/gig-worker-profile";

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

type FieldName = RequiredField['name'];
type FieldType = RequiredField['type'];

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
  [key: string]: any;
}

// Chat step type definition - matching gig creation structure
 type ChatStep = {
  id: number;
  type: "bot" | "user" | "input" | "sanitized" | "typing" | "calendar" | "location" | "confirm" | "video" | "shareLink" | "availability";
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
};

// AI response types for better type safety
interface AIValidationResponse {
  isAppropriate: boolean;
  isWorkerRelated: boolean;
  isSufficient: boolean;
  clarificationPrompt: string;
  sanitizedValue: string;
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

function buildRecommendationLink(): string {
  const origin = typeof window !== 'undefined' && window.location?.origin ? window.location.origin : 'http://localhost:3000';
  const code = generateRandomCode(10);
  return `${origin}/worker/${code}/recommendation`;
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

// Function to generate context-aware prompts with better error handling
async function generateContextAwarePrompt(fieldName: string, aboutInfo: string, ai: any): Promise<string> {
  if (!fieldName || !ai) {
    console.error('Missing required parameters for prompt generation');
    return `Tell me more about your ${fieldName || 'background'}! I'm here to help you create the perfect worker profile! ✨`;
  }

  try {
    const promptSchema = Schema.object({
      properties: {
        prompt: Schema.string(),
      },
    });

    const prompt = `You are Able, a WORKER ONBOARDING ASSISTANT. Your ONLY job is to help users create worker profiles on a gig platform. You are NOT a general assistant, therapist, or friend. You ONLY help with worker onboarding.

CRITICAL CONTEXT: This is a WORKER ONBOARDING FLOW. The user is creating a worker profile to find gig opportunities. They are the WORKER/EMPLOYEE looking for work. You are helping them create a worker profile.

IMPORTANT: This is DIFFERENT from gig creation. In gig creation, users are BUYERS hiring workers. Here, the user is the WORKER being hired. They are creating a profile to showcase their skills and availability to potential clients.

Previous conversation context:
About: "${aboutInfo || 'Not provided'}"

Next field to ask about: "${fieldName}"

Generate a friendly, contextual prompt for the next question. The prompt should:
1. Be conversational and natural - avoid repetitive phrases like "Awesome, a [job type]!"
2. Reference what they've already shared about themselves in a fresh way
3. Be specific to the field being asked about
4. Include relevant emojis to make it engaging
5. Provide helpful context or examples when appropriate
6. Vary your language - don't start every message the same way
7. ALWAYS stay focused on worker onboarding - this is for creating a worker profile

Field-specific guidance for WORKERS:
- experience: Ask about their work history, relevant experience, or professional background as a worker
- skills: Ask about their specific skills, certifications, or qualifications they can offer to clients
- hourlyRate: Ask about their preferred hourly rate for their services in British Pounds (£)
- location: Ask about their location with context about finding nearby gig opportunities
- availability: Ask about when they are available to work for clients
- videoIntro: Ask about recording a video introduction to help clients get to know them
- references: Ask about references or testimonials from previous clients or employers

WORKER ONBOARDING CONTEXT: Remember, this user is creating a worker profile to find gig opportunities. They are the worker/employee looking to be hired. Keep responses focused on worker onboarding only.

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

    if (result.ok && result.data) {
      const data = result.data as AIPromptResponse;
      return data.prompt || `Tell me more about your ${fieldName}! I'm here to help you create the perfect worker profile! ✨`;
    }
  } catch (error) {
    console.error('AI prompt generation failed:', error);
  }
  
  // Fallback prompt
  return `Tell me more about your ${fieldName}! I'm here to help you create the perfect worker profile! ✨`;
}

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
    content: "Hi! I'm Able, your friendly AI assistant! 🎉 I'm here to help you create the perfect worker profile so you can find gig opportunities! You're creating a profile to showcase your skills and availability to potential clients. Tell me about yourself and what kind of work you can offer - whether it's bartending, web development, or anything else! What's your background?",
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
  
  // Setup choice state management
  const [showSetupChoice, setShowSetupChoice] = useState(true);
  const [setupMode, setSetupMode] = useState<'ai' | 'manual' | null>(null);
  const [manualFormData, setManualFormData] = useState<any>({});
  


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
        references: formData.references || '',
        time: formData.time || ''
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

  // AI validation function with better error handling
  const simpleAICheck = useCallback(async (field: string, value: unknown, type: string): Promise<{ sufficient: boolean, clarificationPrompt?: string, sanitized?: string | unknown }> => {
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
        },
      });

      const prompt = `You are Able, a WORKER ONBOARDING ASSISTANT. Your ONLY job is to help users create worker profiles on a gig platform. You are NOT a general assistant, therapist, or friend. You ONLY help with worker onboarding.

CRITICAL CONTEXT: This is a WORKER ONBOARDING FLOW. The user is creating a worker profile to find gig opportunities. They are the WORKER/EMPLOYEE looking for work. You are helping them create a worker profile.

IMPORTANT: This is DIFFERENT from gig creation. In gig creation, users are BUYERS hiring workers. Here, the user is the WORKER being hired. They are creating a profile to showcase their skills and availability to potential clients.

Previous context from this conversation:
${Object.entries(formData).filter(([key, value]) => value && key !== field).map(([key, value]) => `${key}: ${value}`).join(', ')}

Current field being validated: "${field}"
User input: "${trimmedValue}"
Input type: "${type}"

Validation criteria for WORKER PROFILES:
1. isAppropriate: Check if the content is appropriate for a professional worker profile (no offensive language, profanity, or inappropriate content)
2. isWorkerRelated: Check if the content is related to worker skills, experience, availability, or professional background (be VERY lenient - most worker information is broad and acceptable)
3. isSufficient: Check if the content provides basic information (at least 3 characters for text, valid numbers for rates, coordinates for locations)

IMPORTANT: For location fields (location), coordinate objects with lat/lng properties are ALWAYS valid and sufficient. Do not ask for additional location details if coordinates are provided.

Special handling for WORKER PROFILES:
- For coordinates (lat/lng): Accept any valid coordinate format like "Lat: 14.7127059, Lng: 120.9341704" or coordinate objects
- For location objects: If the input is an object with lat/lng properties, accept it as valid location data
- For numbers (hourlyRate): Accept reasonable rates (£5-500 per hour) for worker services
- For text: Be VERY lenient and accept most worker-related content - workers should be able to express themselves broadly about their skills and experience
- For dates: Accept any valid date format for worker availability
- For location fields: Accept coordinates, addresses, city names, or any location information where the worker can provide services

If validation passes, respond with:
- isAppropriate: true
- isWorkerRelated: true
- isSufficient: true
- clarificationPrompt: ""
- sanitizedValue: string (cleaned version of the input)

If validation fails, respond with:
- isAppropriate: boolean
- isWorkerRelated: boolean
- isSufficient: boolean
- clarificationPrompt: string (provide a friendly, contextual response that references what they've already shared and guides them naturally)
- sanitizedValue: string

WORKER ONBOARDING CONTEXT: Remember, this user is creating a worker profile to find gig opportunities. They are the worker/employee looking to be hired. Keep responses focused on worker onboarding only.

Be conversational and reference their previous inputs when possible. For example:
- If they mentioned "web developer" earlier: "Great! I see you're a web developer. Could you tell me more about what specific web development skills you can offer to clients?"
- If they mentioned "bartending": "Perfect! Bartending is a great skill. What kind of bartending experience do you have that clients should know about?"
- If they mentioned "restaurant": "Excellent! Restaurant work can be fast-paced and exciting. What specific roles have you worked in restaurants that you can offer to clients?"

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
        };
      }
    } catch (error) {
      console.error('AI validation failed:', error);
      setError('AI validation failed. Please try again.');
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
      // Find the current step to get its type
      const currentStep = chatSteps.find(s => s.id === stepId);
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
            const recommendationLink = buildRecommendationLink();
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
                // No more fields -> summary
                setChatSteps((prev) => [
                  ...prev,
                  {
                    id: Date.now() + 6,
                    type: "bot",
                    content: `Perfect! Here's a summary of your worker profile:\n${JSON.stringify(afterRefFormData, null, 2)}`,
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
          // All fields collected, show summary
          setChatSteps((prev) => [
            ...prev,
            {
              id: Date.now() + 5,
              type: "bot",
              content: `Perfect! Here's a summary of your worker profile:\n${JSON.stringify(updatedFormData, null, 2)}`,
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
          const recommendationLink = buildRecommendationLink();
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
              setChatSteps((prev) => [
                ...prev,
                {
                  id: Date.now() + 5,
                  type: "bot",
                  content: `Perfect! Here's a summary of your worker profile:\n${JSON.stringify(afterRefFormData, null, 2)}`,
                  isNew: true,
                },
              ]);
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
        
        setTimeout(() => {
          setChatSteps((prev) => {
            // Remove typing indicator and add summary
            const filtered = prev.filter(s => s.type !== 'typing');
            return [
              ...filtered,
              {
                id: Date.now() + 5,
                type: "bot",
                content: `Perfect! Here's a summary of your worker profile:\n${JSON.stringify(updatedFormData, null, 2)}`,
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
          const recommendationLink = buildRecommendationLink();
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
          setTimeout(() => {
            setChatSteps(prev => {
              const filtered = prev.filter(s => s.type !== 'typing');
              return [
                ...filtered,
                {
                  id: Date.now() + 6,
                  type: "bot",
                  content: `Perfect! Here's your worker profile summary:\n\n${JSON.stringify(afterRefFormData, null, 2)}`,
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
      // All fields completed, show summary
      setTimeout(() => {
        setChatSteps(prev => {
          const filtered = prev.filter(s => s.type !== 'typing');
          return [
            ...filtered,
            {
              id: Date.now() + 2,
              type: "bot",
              content: `Perfect! Here's your worker profile summary:\n\n${JSON.stringify({ ...formData, [inputName]: currentValue }, null, 2)}`,
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
            handleInputSubmit(stepId, name, downloadURL);
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
        content: "Hi! I'm Able, your friendly AI assistant! 🎉 I'm here to help you create the perfect worker profile so you can find gig opportunities! You're creating a profile to showcase your skills and availability to potential clients. Tell me about yourself and what kind of work you can offer - whether it's bartending, web development, or anything else! What's your background?",
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
        
        if (step.type === "sanitized") {
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
                  <div style={{ marginBottom: 8, color: 'var(--primary-color)', fontWeight: 600, fontSize: '14px' }}>This is what you wanted?</div>
                  {typeof displayValue === 'string' ? (
                    <div style={{ marginBottom: 16, fontStyle: 'italic', color: '#e5e5e5', fontSize: '15px', lineHeight: '1.4' }}>{displayValue}</div>
                  ) : (
                    displayValue
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
             console.log('🎯 Reference/follow-up message detected in worker onboarding!');
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
                        <h3 style={{ marginTop: 0 }}>Profile Summary</h3>
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
                                 references: summaryData.references || ''
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
