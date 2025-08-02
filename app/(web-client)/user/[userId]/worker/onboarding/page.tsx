"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

import ChatBotLayout from "@/app/components/onboarding/ChatBotLayout";
import MessageBubble from "@/app/components/onboarding/MessageBubble";
import InputBubble from "@/app/components/onboarding/InputBubble";
import TextAreaBubble from "@/app/components/onboarding/TextAreaBubble";
import CalendarPickerBubble from "@/app/components/onboarding/CalendarPickerBubble";
import VideoRecorderBubble from "@/app/components/onboarding/VideoRecorderBubble";
import LocationPickerBubble from '@/app/components/onboarding/LocationPickerBubble';
import SanitizedConfirmationBubble from "@/app/components/onboarding/SanitizedConfirmationBubble";
import Loader from "@/app/components/shared/Loader";

// Typing indicator component with bouncing animation - matching gig creation
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

// Define required fields and their configs - matching gig creation pattern
const requiredFields: RequiredField[] = [
  { name: "experience", type: "text", placeholder: "Tell us about your experience...", defaultPrompt: "What experience do you have in your field?", rows: 3 },
  { name: "skills", type: "text", placeholder: "List your skills and certifications...", defaultPrompt: "What skills and certifications do you have?", rows: 3 },
  { name: "hourlyRate", type: "number", placeholder: "£15", defaultPrompt: "What's your preferred hourly rate?" },
  { name: "location", type: "location", defaultPrompt: "Where are you based? This helps us find gigs near you!" },
  { name: "availability", type: "date", defaultPrompt: "When are you available to work?" },
  { name: "time", type: "time", defaultPrompt: "What time of day do you prefer to work?" },
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
type FieldType = RequiredField['type'];

interface FormData {
  about?: string;
  experience?: string;
  skills?: string;
  hourlyRate?: number;
  location?: { lat: number; lng: number } | string;
  availability?: string;
  time?: string;
  videoIntro?: string;
  references?: string;
  [key: string]: any;
}

// Chat step type definition - matching gig creation structure
type ChatStep = {
  id: number;
  type: "bot" | "user" | "input" | "sanitized" | "typing";
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

function isValidTime(timeValue: unknown): boolean {
  if (!timeValue || typeof timeValue !== 'string') return false;
  
  try {
    if (timeValue.match(/^\d{2}:\d{2}$/)) {
      const [hours, minutes] = timeValue.split(':').map(Number);
      return hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59;
    }
    return false;
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

function formatTimeForDisplay(timeValue: unknown): string {
  if (!timeValue || !isValidTime(timeValue)) return '';
  
  try {
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
    
    if (timeValue instanceof Date) {
      return timeValue.toLocaleTimeString('en-GB', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      });
    }
    
    return String(timeValue);
  } catch (error) {
    console.error('Time formatting error:', error);
    return String(timeValue);
  }
}

// Helper to format summary values with better error handling
function formatSummaryValue(value: unknown, field?: string): string {
  if (!value) return "Not provided";
  
  try {
    if (field === 'location' && isValidCoordinate(value)) {
      return `Lat: ${value.lat.toFixed(6)}, Lng: ${value.lng.toFixed(6)}`;
    }
    
    if (field === 'availability') {
      return formatDateForDisplay(value);
    }
    
    if (field === 'time') {
      return formatTimeForDisplay(value);
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
- hourlyRate: Ask about their preferred hourly rate for their services
- location: Ask about their location with context about finding nearby gig opportunities
- availability: Ask about when they are available to work for clients
- time: Ask about their preferred working hours for gigs
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
      type: "text",
      name: "about",
      placeholder: "Tell us about yourself and your background...",
    },
    isComplete: false,
  }]);
  const [expandedSummaryFields, setExpandedSummaryFields] = useState<Record<string, boolean>>({});
  const [isTyping, setIsTyping] = useState(false);
  const [reformulateField, setReformulateField] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Helper to get next required field not in formData - matching gig creation
  const getNextRequiredField = useCallback((formData: FormData) => {
    return requiredFields.find(f => !formData[f.name]);
  }, []);

  // Helper to determine if this is the active input step - matching gig creation
  const isActiveInputStep = useCallback((step: ChatStep, idx: number) => {
    const lastIncompleteInputStep = chatSteps
      .filter(s => s.type === 'input' && !s.isComplete)
      .pop();
    
    return step.id === lastIncompleteInputStep?.id;
  }, [chatSteps]);

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
        
        // For time fields, ensure proper time format
        if (field === 'time') {
          try {
            // If it's already a valid time string, keep it
            if (isValidTime(value)) {
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
      setError('AI validation failed. Please try again.');
    }
    
    // Simple fallback - accept most inputs
    return { sufficient: true, sanitized: trimmedValue };
  }, [formData, ai]);

  // Handle input submission with better error handling
  const handleInputSubmit = useCallback(async (stepId: number, inputName: string) => {
    if (!formData[inputName]) {
      console.warn('No value provided for input:', inputName);
      return;
    }
    
    try {
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

      const aiResult = await simpleAICheck(inputName, formData[inputName], inputType);

      setTimeout(() => {
        setChatSteps((prev) => {
          // Remove typing indicator
          const filtered = prev.filter(s => s.type !== 'typing');
          
          if (!aiResult.sufficient) {
            // Add clarification message and repeat input
            return [
              ...filtered,
              {
                id: Date.now() + 2,
                type: "bot",
                content: aiResult.clarificationPrompt!,
                isNew: true,
              },
              {
                id: Date.now() + 3,
                type: "input",
                inputConfig: currentStep?.inputConfig,
                isComplete: false,
                isNew: true,
              },
            ];
          } else {
            // Show sanitized confirmation
            return [
              ...filtered,
              {
                id: Date.now() + 2,
                type: "sanitized",
                fieldName: inputName,
                sanitizedValue: aiResult.sanitized!,
                originalValue: formData[inputName],
                isNew: true,
              },
            ];
          }
        });
      }, 700);
    } catch (error) {
      console.error("Error processing input:", error);
      setError('Failed to process input. Please try again.');
      
      // Fallback: proceed without AI validation
      setTimeout(() => {
        setChatSteps((prev) => {
          const filtered = prev.filter(s => s.type !== 'typing');
          return [
            ...filtered,
            {
              id: Date.now() + 2,
              type: "user",
              content: String(formData[inputName]),
              isNew: true,
            },
          ];
        });
      }, 700);
      await handleSanitizedConfirm(inputName, formData[inputName]);
    }
  }, [formData, chatSteps, simpleAICheck]);

  // Handle sanitized confirmation with better error handling
  const handleSanitizedConfirm = useCallback(async (fieldName: string, sanitized: string | unknown) => {
    try {
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
        const contextAwarePrompt = await generateContextAwarePrompt(nextField.name, aboutInfo, ai);
        
        setTimeout(() => {
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

  const handleSanitizedReformulate = useCallback((fieldName: string) => {
    setReformulateField(fieldName);
  }, []);

  // Handle input changes with better validation
  const handleInputChange = useCallback((name: string, value: unknown) => {
    try {
      // Special handling for date fields to ensure only date part is stored
      if (name === 'availability' && value) {
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
            handleInputChange(name, downloadURL);
            handleInputSubmit(stepId, name);
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

  return (
    <ChatBotLayout ref={chatContainerRef} className={pageStyles.container}>
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
        const key = step.id;
        
        if (step.type === "sanitized") {
          return (
            <SanitizedConfirmationBubble
              key={key}
              fieldName={step.fieldName!}
              sanitizedValue={step.sanitizedValue!}
              originalValue={step.originalValue}
              onConfirm={handleSanitizedConfirm}
              onReformulate={handleSanitizedReformulate}
              isProcessing={isSubmitting}
            />
          );
        }
        
                 if (step.type === "typing") {
           return (
             <MessageBubble
               key={key}
               text={<TypingIndicator />}
               senderType="bot"
               isNew={true}
             />
           );
         }
        
        if (step.type === "bot") {
          // Check if this is a summary message (contains JSON)
          if (step.content && typeof step.content === 'string' && step.content.includes('{')) {
            try {
              const jsonMatch = step.content.match(/\{[\s\S]*\}/);
              if (jsonMatch) {
                const summaryData = JSON.parse(jsonMatch[0]) as FormData;
                return (
                  <div key={key} style={{ background: '#222', color: '#fff', borderRadius: 8, padding: 16, margin: '16px 0', boxShadow: '0 2px 8px #0002' }}>
                    <h3 style={{ marginTop: 0 }}>Profile Summary</h3>
                    <ul style={{ listStyle: 'none', padding: 0 }}>
                      <li style={{ marginBottom: 8 }}>
                        <strong style={{ textTransform: 'capitalize' }}>About: </strong>
                        <span>{formatSummaryValue(summaryData.about, 'about')}</span>
                      </li>
                      {requiredFields.map((field) => (
                        <li key={field.name} style={{ marginBottom: 8 }}>
                          <strong style={{ textTransform: 'capitalize' }}>{field.name.replace(/([A-Z])/g, ' $1')}: </strong>
                                                     <span>
                             {field.name === 'location' && isValidCoordinate(summaryData[field.name])
                               ? `Lat: ${(summaryData[field.name] as { lat: number; lng: number }).lat.toFixed(6)}, Lng: ${(summaryData[field.name] as { lat: number; lng: number }).lng.toFixed(6)}`
                               : field.name === 'availability'
                                 ? formatDateForDisplay(summaryData[field.name])
                                 : field.name === 'time'
                                   ? formatTimeForDisplay(summaryData[field.name])
                                   : typeof summaryData[field.name] === 'object'
                                     ? JSON.stringify(summaryData[field.name])
                                     : formatSummaryValue(summaryData[field.name], field.name)}
                           </span>
                        </li>
                      ))}
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
                      onClick={() => router.push(`/user/${user?.uid}/worker`)}
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
             />
           );
         }
        
        if (step.type === "input" && !step.isComplete) {
          const inputConf = step.inputConfig!;
          const isActive = isActiveInputStep(step, idx);
          const isProcessing = chatSteps.some(s => s.type === 'typing');
          
          // Custom UI for location
          if (inputConf.name === "location") {
            return (
              <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <LocationPickerBubble
                  value={formData.location}
                  onChange={val => handleInputChange('location', val)}
                  showConfirm={!!formData.location && isActive}
                  onConfirm={() => handleInputSubmit(step.id, 'location')}
                />
              </div>
            );
          }
          
          // Custom UI for date (calendar picker)
          if (inputConf.name === "availability") {
            return (
              <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <CalendarPickerBubble
                  value={formData.availability ? new Date(formData.availability) : null}
                  onChange={date => handleInputChange('availability', date ? date.toISOString() : "")}
                />
                {isActive && formData.availability && (
                  <button
                    style={{ 
                      margin: '8px 0', 
                      background: '#0f766e', 
                      color: '#fff', 
                      border: 'none', 
                      borderRadius: 8, 
                      padding: '8px 16px', 
                      fontWeight: 600,
                      transition: 'all 0.3s ease',
                      transform: 'scale(1)',
                      cursor: 'pointer'
                    }}
                    onClick={() => handleInputSubmit(step.id, 'availability')}
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
          
          // Handle video inputs
          if (inputConf.type === "video") {
            return (
              <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <VideoRecorderBubble
                  onVideoRecorded={file => {
                    handleVideoUpload(file, inputConf.name, step.id);
                  }}
                />
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
                    style={{ 
                      margin: '8px 0', 
                      background: '#0f766e', 
                      color: '#fff', 
                      border: 'none', 
                      borderRadius: 8, 
                      padding: '8px 16px', 
                      fontWeight: 600,
                      transition: 'all 0.3s ease',
                      transform: 'scale(1)',
                      cursor: 'pointer'
                    }}
                    onClick={() => handleInputSubmit(step.id, inputConf.name)}
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
          
          return (
            <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <InputBubble
                id={inputConf.name}
                name={inputConf.name}
                                 value={(() => {
                   const val = formData[inputConf.name];
                   if (isValidCoordinate(val)) {
                     return `Lat: ${val.lat.toFixed(6)}, Lng: ${val.lng.toFixed(6)}`;
                   } else if (typeof val === 'object' && val !== null) {
                     return JSON.stringify(val);
                   } else {
                     return String(val || "");
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
                  style={{ 
                    margin: '8px 0', 
                    background: '#0f766e', 
                    color: '#fff', 
                    border: 'none', 
                    borderRadius: 8, 
                    padding: '8px 16px', 
                    fontWeight: 600,
                    transition: 'all 0.3s ease',
                    transform: 'scale(1)',
                    cursor: 'pointer'
                  }}
                  onClick={() => handleInputSubmit(step.id, inputConf.name)}
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
        
        return null;
      })}
      
      <div ref={endOfChatRef} />
    </ChatBotLayout>
  );
} 