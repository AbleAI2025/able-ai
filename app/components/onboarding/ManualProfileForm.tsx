import React, { useState, useEffect, useRef } from 'react';
import { getPrivateWorkerProfileAction } from '@/actions/user/gig-worker-profile';
import { checkExistingProfileDataAction } from '@/actions/user/check-existing-profile-data-action';
import { useAuth } from '@/context/AuthContext';
import { VALIDATION_CONSTANTS } from '@/app/constants/validation';
import styles from './ManualProfileForm.module.css';
import LocationPickerBubble from './LocationPickerBubble';
import VideoRecorderOnboarding from './VideoRecorderOnboarding';
import DataReviewModal from './DataReviewModal';
import DataToggleOptions, { ExistingData } from './DataToggleOptions';
import InlineDataToggle from './InlineDataToggle';
import OnboardingAvailabilityStep from '@/app/(web-client)/user/[userId]/worker/onboarding-ai/components/OnboardingAvailabilityStep';
import { AvailabilityFormData } from '@/app/types/AvailabilityTypes';
import { ref, uploadBytesResumable, getDownloadURL, getStorage } from "firebase/storage";
import { firebaseApp } from "@/lib/firebase/clientApp";
import { geminiAIAgent } from '@/lib/firebase/ai';
import { getAI } from '@firebase/ai';
import { Schema } from '@firebase/ai';
import { parseExperienceToNumeric } from '@/lib/utils/experienceParsing';

function buildRecommendationLink(workerProfileId: string | null): string {
  const origin = typeof window !== 'undefined' && window.location?.origin ? window.location.origin : 'http://localhost:3000';
  
  if (!workerProfileId) {
    throw new Error('Worker profile ID is required to build recommendation link');
  }
  
  // Use the worker profile ID (UUID) for the recommendation URL
  return `${origin}/worker/${workerProfileId}/recommendation`;
}

interface FormData {
  about: string;
  experience: string;
  skills: string;
  qualifications: string; // Add qualifications field
  equipment: string;
  hourlyRate: number;
  location: any; // Changed to any for LocationPickerBubble
  availability: AvailabilityFormData;
  videoIntro: string | null;
  references: string;
  jobTitle?: string; // AI extracted job title
  experienceYears?: number; // Parsed years of experience
  experienceMonths?: number; // Parsed months of experience
}

interface ManualProfileFormProps {
  onSubmit: (formData: FormData) => void;
  onSwitchToAI: () => void;
  initialData?: Partial<FormData>;
  workerProfileId?: string | null;
  existingProfileData?: ExistingData;
}

// Export validation function for external use (basic validation only)
export const validateWorkerProfileData = (formData: FormData, workerProfileId?: string | null): { isValid: boolean; errors: Record<string, string> } => {
  const errors: Record<string, string> = {};
  let isValid = true;

  // Validate all required fields
  const fieldsToValidate = ['about', 'experience', 'skills', 'equipment', 'qualifications', 'hourlyRate', 'location', 'availability', 'videoIntro', 'references'];
  
  fieldsToValidate.forEach(fieldName => {
    const value = formData[fieldName as keyof FormData];
    
    switch (fieldName) {
      case 'about':
        if (!value || value.trim().length < VALIDATION_CONSTANTS.WORKER.MIN_ABOUT_LENGTH) {
          errors.about = `About section must be at least ${VALIDATION_CONSTANTS.WORKER.MIN_ABOUT_LENGTH} characters`;
          isValid = false;
        }
        break;
      case 'experience':
        // Allow any non-empty input - very lenient validation
        const trimmedValue = value.trim();
        
        if (!trimmedValue) {
          errors.experience = `Please enter your years of experience (e.g., "1", "5", "2.5 years")`;
          isValid = false;
        }
        break;
      case 'skills':
        if (!value || value.trim().length < VALIDATION_CONSTANTS.WORKER.MIN_SKILLS_LENGTH) {
          errors.skills = `Skills section must be at least ${VALIDATION_CONSTANTS.WORKER.MIN_SKILLS_LENGTH} characters`;
          isValid = false;
        }
        break;
      case 'equipment':
        // Equipment is optional - no minimum length required
        break;
      case 'qualifications':
        if (!value || value.trim().length < VALIDATION_CONSTANTS.WORKER.MIN_QUALIFICATIONS_LENGTH) {
          errors.qualifications = `Qualifications section must be at least ${VALIDATION_CONSTANTS.WORKER.MIN_QUALIFICATIONS_LENGTH} characters`;
          isValid = false;
        }
        break;
      case 'hourlyRate':
        if (!value || value < VALIDATION_CONSTANTS.WORKER.MIN_HOURLY_RATE) {
          errors.hourlyRate = `Hourly rate must be at least £${VALIDATION_CONSTANTS.WORKER.MIN_HOURLY_RATE}`;
          isValid = false;
        }
        break;
      case 'location':
        if (!value || !value.lat || !value.lng) {
          errors.location = 'Please select your location';
          isValid = false;
        }
        break;
      case 'availability':
        if (!value || !value.days || value.days.length === 0) {
          errors.availability = 'Please select at least one day of availability';
          isValid = false;
        }
        break;
      case 'videoIntro':
        if (!value || typeof value !== 'string' || value.trim().length === 0) {
          errors.videoIntro = 'Please record a video introduction';
          isValid = false;
        }
        break;
      case 'references':
        // References are only required if workerProfileId is available (profile created)
        if (workerProfileId && (!value || value.trim().length < VALIDATION_CONSTANTS.WORKER.MIN_REFERENCES_LENGTH)) {
          errors.references = 'References link is required';
          isValid = false;
        }
        break;
    }
  });

  return { isValid, errors };
};

// Export AI content validation function for external use
export const validateContentWithAI = async (field: string, value: string): Promise<{ isValid: boolean; error?: string; sanitized?: string }> => {
  if (!value || value.trim().length === 0) {
    return { isValid: true, sanitized: value };
  }

  try {
    const ai = getAI();
    if (!ai) {
      console.log('AI not available, skipping content validation');
      return { isValid: true, sanitized: value };
    }

    let prompt = '';
    let schema: any;

    if (field === 'about') {
      prompt = `This is a worker's self-description. Be very lenient and only reject content that is clearly inappropriate (explicit content, hate speech, or completely nonsensical). Accept almost everything else including casual language, personal details, and informal descriptions.
      
      Description: "${value}"`;
      
      schema = Schema.object({
        properties: {
          isValid: Schema.boolean(),
          reason: Schema.string(),
          sanitized: Schema.string()
        },
        required: ["isValid", "reason", "sanitized"]
      });
    } else if (field === 'skills') {
      prompt = `This is a worker's skills list. Be very lenient and accept any skills that could be relevant to work, even if informal or creative. Only reject content that is clearly inappropriate (explicit content, hate speech, or completely nonsensical).
      
      Skills: "${value}"`;
      
      schema = Schema.object({
        properties: {
          isValid: Schema.boolean(),
          reason: Schema.string(),
          sanitized: Schema.string()
        },
        required: ["isValid", "reason", "sanitized"]
      });
    } else if (field === 'experience') {
      prompt = `Validate this experience description. Be VERY LENIENT - accept any reasonable input including single numbers. REJECT only if it contains:
      - Video game references: "mario", "luigi", "peach", "bowser", "sonic", "link", "zelda", "pokemon", etc.
      - Fictional characters: "batman", "superman", "spiderman", "wonder woman", etc.
      - Memes and internet culture: "its a me mario", "hello there", "general kenobi", etc.
      - Jokes and humor: "i am the best at nothing", "i can fly", "i am a wizard", etc.
      - Nonsense and gibberish: "asdf", "qwerty", "random text", "blah blah", etc.
      - Personal names of celebrities, athletes, or fictional characters
      - Inappropriate content, profanity, sexual content, violence
      - Non-professional information
      
      ACCEPT ANY reasonable input including: "1", "5", "2.5", "1 year", "5 years", "2.5 years", "I have 1 year of experience", "5 years of experience in customer service", etc.
      
      If valid, return the cleaned version. If invalid, explain why it's inappropriate.
      
      Experience: "${value}"`;
      
      schema = Schema.object({
        properties: {
          isValid: Schema.boolean(),
          reason: Schema.string(),
          sanitized: Schema.string()
        },
        required: ["isValid", "reason", "sanitized"]
      });
    } else if (field === 'equipment') {
      prompt = `This is a worker's equipment list. Be very lenient and accept any equipment that could be relevant to work, even if informal or creative. Only reject content that is clearly inappropriate (explicit content, hate speech, or completely nonsensical).
      
      Equipment: "${value}"`;
      
      schema = Schema.object({
        properties: {
          isValid: Schema.boolean(),
          reason: Schema.string(),
          sanitized: Schema.string()
        },
        required: ["isValid", "reason", "sanitized"]
      });
    } else if (field === 'qualifications') {
      prompt = `This is a worker's qualifications list. Be very lenient and accept any qualifications, certifications, or relevant experience, even if informal or self-taught. Only reject content that is clearly inappropriate (explicit content, hate speech, or completely nonsensical).
      
      Qualifications: "${value}"`;
      
      schema = Schema.object({
        properties: {
          isValid: Schema.boolean(),
          reason: Schema.string(),
          sanitized: Schema.string()
        },
        required: ["isValid", "reason", "sanitized"]
      });
    } else {
      return { isValid: true, sanitized: value };
    }

    const result = await geminiAIAgent(
      VALIDATION_CONSTANTS.AI_MODELS.GEMINI_2_0_FLASH,
      { prompt, responseSchema: schema },
      ai,
      VALIDATION_CONSTANTS.AI_MODELS.GEMINI_2_5_FLASH_PREVIEW
    );

    if (result.ok) {
      const data = result.data as any;
      return {
        isValid: data.isValid,
        error: data.isValid ? undefined : data.reason,
        sanitized: data.sanitized || value
      };
    } else {
      console.error('AI content validation failed:', result);
      return { isValid: true, sanitized: value }; // Fallback to allow submission
    }
  } catch (error) {
    console.error('AI content validation error:', error);
    return { isValid: true, sanitized: value }; // Fallback to allow submission
  }
};

const ManualProfileForm: React.FC<ManualProfileFormProps> = ({
  onSubmit,
  onSwitchToAI,
  initialData = {},
  workerProfileId = null,
  existingProfileData = {}
}) => {
  const { user } = useAuth();
  
  
  const [formData, setFormData] = useState<FormData>({
    about: '',
    experience: '',
    skills: '',
    qualifications: '', // Add qualifications field
    equipment: '',
    hourlyRate: 0,
    location: null,
    availability: {
      days: [],
      startTime: '09:00',
      endTime: '17:00',
      frequency: 'weekly',
      ends: 'never',
      startDate: new Date().toISOString().split('T')[0], // Today's date
      endDate: undefined,
      occurrences: undefined
    },
    videoIntro: null,
    references: workerProfileId ? buildRecommendationLink(workerProfileId) : '',
    experienceYears: 0,
    experienceMonths: 0,
    ...initialData
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [progress, setProgress] = useState(0);
  
  // Existing profile data state
  const [fetchedExistingData, setFetchedExistingData] = useState<any>(null);
  const [isLoadingExistingData, setIsLoadingExistingData] = useState(false);
  
  // Toggle options for choosing between existing and new data
  const [dataToggleOptions, setDataToggleOptions] = useState({
    about: 'new' as 'existing' | 'new',
    skills: 'new' as 'existing' | 'new',
    location: 'new' as 'existing' | 'new',
    availability: 'new' as 'existing' | 'new',
    experience: 'new' as 'existing' | 'new',
    qualifications: 'new' as 'existing' | 'new',
    equipment: 'new' as 'existing' | 'new',
    hourlyRate: 'new' as 'existing' | 'new',
    videoIntro: 'new' as 'existing' | 'new'
  });
  

  // Data Review Modal state
  const [dataReviewModal, setDataReviewModal] = useState<{
    isOpen: boolean;
    originalData: any;
    cleanedData: any;
    onConfirm: () => void;
    onGoBack: () => void;
  }>({
    isOpen: false,
    originalData: {},
    cleanedData: {},
    onConfirm: () => {},
    onGoBack: () => {}
  });

  // Debounce ref for skill checking
  const skillCheckTimeoutRef = useRef<NodeJS.Timeout | null>(null);


  // Generate references link immediately
  useEffect(() => {
    console.log('🔍 References useEffect triggered:', { 
      hasReferences: !!formData.references, 
      workerProfileId, 
      referencesValue: formData.references 
    });
    
    if (!formData.references) {
      let recommendationLink;
      
      if (workerProfileId && workerProfileId !== 'null' && workerProfileId !== '') {
        // Use actual workerProfileId if available
        console.log('✅ Using actual workerProfileId:', workerProfileId);
        try {
          recommendationLink = buildRecommendationLink(workerProfileId);
          console.log('✅ Generated recommendation link:', recommendationLink);
        } catch (error) {
          console.error('❌ Error building recommendation link:', error);
          // Fall back to temporary link
          recommendationLink = `${typeof window !== 'undefined' && window.location?.origin ? window.location.origin : 'http://localhost:3000'}/worker/temp/recommendation`;
        }
      } else {
        // Generate temporary link for new users
        console.log('⚠️ No workerProfileId, using temporary link');
        recommendationLink = `${typeof window !== 'undefined' && window.location?.origin ? window.location.origin : 'http://localhost:3000'}/worker/temp/recommendation`;
      }
      
      console.log('🔗 Setting references to:', recommendationLink);
      setFormData(prev => ({
        ...prev,
        references: recommendationLink
      }));
    }
  }, [formData.references, workerProfileId]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (skillCheckTimeoutRef.current) {
        clearTimeout(skillCheckTimeoutRef.current);
      }
    };
  }, []);

  // Fetch existing data on component mount
  useEffect(() => {
    fetchExistingData();
  }, [user?.token]);

  // Initialize toggle options based on existing data
  useEffect(() => {
    const dataToUse = fetchedExistingData || existingProfileData;
    if (dataToUse && Object.keys(dataToUse).length > 0) {
      const newToggleOptions = { ...dataToggleOptions };
      
      // Set to 'existing' if data exists, otherwise keep 'new'
      // Only check for fields that have toggles (about, location, availability)
      const fieldsWithToggles = ['about', 'location', 'availability'];
      
      fieldsWithToggles.forEach(key => {
        let hasData = false;
        
        if (fetchedExistingData?.profileData) {
          // Check fetched data structure
          switch (key) {
            case 'about':
              hasData = !!fetchedExistingData.profileData.fullBio;
              break;
            case 'location':
              hasData = !!fetchedExistingData.profileData.location;
              break;
            case 'availability':
              hasData = !!fetchedExistingData.profileData.availabilityJson;
              break;
          }
        } else if (dataToUse) {
          // Check passed prop data
          hasData = dataToUse[key as keyof typeof dataToUse] !== undefined && 
                   dataToUse[key as keyof typeof dataToUse] !== null &&
                   dataToUse[key as keyof typeof dataToUse] !== '';
        }
        
        if (hasData) {
          newToggleOptions[key as keyof typeof newToggleOptions] = 'existing';
        }
      });
      
      setDataToggleOptions(newToggleOptions);
      
      // Pre-populate form with existing data for fields set to 'existing'
      setFormData(prev => {
        const newFormData = { ...prev };
        
        fieldsWithToggles.forEach(key => {
          if (newToggleOptions[key as keyof typeof newToggleOptions] === 'existing') {
            let existingValue: any;
            
            if (fetchedExistingData?.profileData) {
              // Use fetched data structure
              switch (key) {
                case 'about':
                  existingValue = fetchedExistingData.profileData.fullBio;
                  break;
                case 'location':
                  existingValue = fetchedExistingData.profileData.location;
                  break;
                case 'availability':
                  existingValue = fetchedExistingData.profileData.availabilityJson;
                  break;
              }
            } else if (dataToUse) {
              // Use passed prop data
              existingValue = dataToUse[key as keyof typeof dataToUse];
            }
            
            if (existingValue !== undefined && existingValue !== null) {
              (newFormData as any)[key] = existingValue;
            }
          }
        });
        
        return newFormData;
      });
    }
  }, [fetchedExistingData, existingProfileData]);

  // Handle toggle option changes
  const handleToggleChange = (field: string, option: 'existing' | 'new') => {
    setDataToggleOptions(prev => ({
      ...prev,
      [field]: option
    }));

    // Get the data source (fetched or passed as prop)
    const dataToUse = fetchedExistingData || existingProfileData;
    
    // If switching to 'existing', populate with existing data
    if (option === 'existing' && dataToUse) {
      let existingValue: any;
      
      // Handle different data structures
      if (fetchedExistingData?.profileData) {
        // Use fetched data structure
        switch (field) {
          case 'about':
            existingValue = fetchedExistingData.profileData.fullBio;
            break;
          case 'location':
            // Handle different location data formats
            const locationData = fetchedExistingData.profileData.location;
            console.log('🔍 Location data from database:', locationData);
            
            if (typeof locationData === 'string') {
              // If it's a string, try to parse as JSON
              try {
                existingValue = JSON.parse(locationData);
              } catch (error) {
                // If JSON parsing fails, use as plain string
                existingValue = locationData;
              }
            } else {
              existingValue = locationData;
            }
            break;
          case 'availability':
            // Parse availabilityJson if it's a string, otherwise use as-is
            const availabilityData = fetchedExistingData.profileData.availabilityJson;
            console.log('🔍 Availability data from database:', availabilityData);
            
            if (typeof availabilityData === 'string') {
              try {
                existingValue = JSON.parse(availabilityData);
                console.log('🔍 Parsed availability data:', existingValue);
              } catch (error) {
                console.error('Error parsing availability data:', error);
                existingValue = null;
              }
            } else {
              existingValue = availabilityData;
              console.log('🔍 Using availability data as-is:', existingValue);
            }
            
            // Convert array format to object format if needed
            if (Array.isArray(existingValue) && existingValue.length > 0) {
              const firstItem = existingValue[0];
              if (firstItem && typeof firstItem === 'object') {
                // Convert from array format to object format
                existingValue = {
                  days: firstItem.days || [],
                  startTime: firstItem.startTime || '09:00',
                  endTime: firstItem.endTime || '17:00',
                  frequency: firstItem.frequency || 'weekly',
                  ends: firstItem.ends || 'never',
                  startDate: firstItem.startDate || new Date().toISOString().split('T')[0],
                  endDate: firstItem.endDate,
                  occurrences: firstItem.occurrences
                };
              }
            }
            break;
          default:
            existingValue = fetchedExistingData.profileData[field];
        }
      } else if (existingProfileData) {
        // Use passed prop data
        existingValue = existingProfileData[field as keyof ExistingData];
      }
      
      if (existingValue !== undefined && existingValue !== null) {
        console.log(`🔍 Setting ${field} to existing value:`, existingValue);
        setFormData(prev => ({
          ...prev,
          [field]: existingValue
        } as FormData));
      } else {
        console.log(`🔍 No existing value found for ${field}`);
      }
    }
    // If switching to 'new', clear the field
    else if (option === 'new') {
      setFormData(prev => ({
        ...prev,
        [field]: field === 'hourlyRate' ? 0 : 
                 field === 'location' ? null :
                 field === 'availability' ? { days: [], startTime: '09:00', endTime: '17:00', frequency: 'weekly', ends: 'never', startDate: new Date().toISOString().split('T')[0] } :
                 field === 'videoIntro' ? null : ''
      }));
    }
  };

  // Wrapper function for inline toggle
  const handleInlineToggle = (fieldKey: string, useExisting: boolean) => {
    handleToggleChange(fieldKey, useExisting ? 'existing' : 'new');
  };

  // Helper function to format location data
  const formatLocationDisplay = (locationData: any) => {
    if (!locationData) return 'No existing data';
    
    try {
      let data;
      
      // Handle different data types
      if (typeof locationData === 'string') {
        // Check if it's already a formatted address string
        if (locationData.includes(',') && !locationData.startsWith('{')) {
          return locationData; // Return as-is if it looks like an address
        }
        
        // Try to parse as JSON
        try {
          data = JSON.parse(locationData);
        } catch (jsonError) {
          // If JSON parsing fails, treat as plain string
          return locationData;
        }
      } else {
        data = locationData;
      }
      
      // Handle different location data structures
      if (data && typeof data === 'object') {
        // Check for various address field names
        const address = data.address || data.formatted_address || data.formattedAddress || data.location;
        
        if (address) {
          return address;
        }
        
        // If no address field, try to construct from other fields
        if (data.street && data.city) {
          return `${data.street}, ${data.city}`;
        }
        
        return 'Location data available but no address found';
      }
      
      return 'No location set';
    } catch (error) {
      console.error('Error formatting location:', error);
      return 'Invalid location data';
    }
  };

  // Helper function to format availability data
  const formatAvailabilityDisplay = (availabilityData: any) => {
    if (!availabilityData) return 'No existing data';
    
    try {
      let data;
      
      // Handle different data types
      if (typeof availabilityData === 'string') {
        // Try to parse as JSON
        try {
          data = JSON.parse(availabilityData);
        } catch (jsonError) {
          // If JSON parsing fails, return the string as-is
          return availabilityData;
        }
      } else {
        data = availabilityData;
      }
      
      // Handle array format (convert to object format)
      if (Array.isArray(data) && data.length > 0) {
        const firstItem = data[0];
        if (firstItem && typeof firstItem === 'object') {
          data = {
            days: firstItem.days || [],
            startTime: firstItem.startTime || '09:00',
            endTime: firstItem.endTime || '17:00'
          };
        }
      }
      
      if (!data || !data.days || !Array.isArray(data.days)) {
        return 'No availability set';
      }
      
      const dayNames = {
        'monday': 'Monday',
        'tuesday': 'Tuesday', 
        'wednesday': 'Wednesday',
        'thursday': 'Thursday',
        'friday': 'Friday',
        'saturday': 'Saturday',
        'sunday': 'Sunday'
      };
      
      const selectedDays = data.days.map((day: string) => dayNames[day.toLowerCase() as keyof typeof dayNames] || day).join(', ');
      const timeRange = data.startTime && data.endTime ? `${data.startTime} - ${data.endTime}` : 'Times not set';
      
      return `${selectedDays} (${timeRange})`;
    } catch (error) {
      console.error('Error formatting availability:', error);
      return 'Invalid availability data';
    }
  };

  // Fetch existing profile data
  const fetchExistingData = async () => {
    if (!user?.token) {
      console.log('No user token available for existing data check');
      return;
    }
    
    try {
      setIsLoadingExistingData(true);
      console.log('🔍 Fetching existing profile data...');
      
      const result = await checkExistingProfileDataAction(user.token);
      console.log('🔍 Existing data result:', result);
      
      if (result.success && result.data) {
        setFetchedExistingData(result.data);
        console.log('🔍 Existing data set:', result.data);
      } else {
        console.log('No existing profile data found');
        setFetchedExistingData(null);
      }
    } catch (error) {
      console.error('Error fetching existing data:', error);
      setFetchedExistingData(null);
    } finally {
      setIsLoadingExistingData(false);
    }
  };

  // Check if skill already exists for the current user
  const checkExistingSkill = async (skillName: string): Promise<{ exists: boolean; message?: string }> => {
    if (!workerProfileId || !skillName.trim()) {
      return { exists: false };
    }

    try {
      const response = await fetch('/api/check-similar-skill', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          skillName: skillName.trim(),
          workerProfileId: workerProfileId
        }),
      });

      if (!response.ok) {
        console.error('Failed to check existing skill:', response.status);
        return { exists: false };
      }

      const result = await response.json();
      
      if (result.exists && result.similarSkills && result.similarSkills.length > 0) {
        const exactMatch = result.similarSkills.find((skill: any) => 
          skill.name.toLowerCase().trim() === skillName.toLowerCase().trim()
        );
        
        if (exactMatch) {
          return {
            exists: true,
            message: `You already have this skill: "${exactMatch.name}". Please choose a different skill or edit your existing one.`
          };
        }
      }

      return { exists: false };
    } catch (error) {
      console.error('Error checking existing skill:', error);
      return { exists: false };
    }
  };


  const continueFormSubmission = async (dataToSubmit?: any) => {
    // This will be called after AI validation modal is handled
    // Continue with the rest of the form submission logic
    try {
      // Continue with the existing submission logic...
      console.log('✅ Continuing form submission after AI validation');
      
      // Use provided data or fall back to current form data
      const data = dataToSubmit || formData;
      
      // Parse experience to numeric
      const experienceYears = parseExperienceToNumeric(data.experience);
      const finalFormData = {
        ...data,
        experienceYears: experienceYears.years,
        experienceMonths: experienceYears.months
      };

      console.log('📤 Submitting final form data:', finalFormData);
      console.log('🔍 Calling onSubmit prop with data:', { 
        hasOnSubmit: !!onSubmit, 
        dataKeys: Object.keys(finalFormData),
        dataSize: JSON.stringify(finalFormData).length
      });
      onSubmit(finalFormData);
      console.log('✅ onSubmit called successfully');
      
    } catch (error) {
      console.error('❌ Error in form submission:', error);
      setErrors({ submit: 'Failed to submit form. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Check if user already has a worker profile and build recommendation link if available
  useEffect(() => {
    const fetchExistingProfile = async () => {
      if (user?.claims?.role === "GIG_WORKER" && user?.token && !formData.references) {
        try {
          const result = await getPrivateWorkerProfileAction(user.token);
          if (result.success && result.data?.id) {
            // User already has a worker profile, build the recommendation link
            try {
              const recommendationLink = buildRecommendationLink(result.data.id as string);
              setFormData(prev => ({
                ...prev,
                references: recommendationLink
              }));
            } catch (linkError) {
              console.error('Error building recommendation link:', linkError);
            }
          }
        } catch (error) {
          console.error('Failed to fetch existing worker profile:', error);
          // Keep the existing empty references - no need to change it
        }
      }
    };

    fetchExistingProfile();
  }, [user?.claims?.role, user?.token, formData.references]);

  // Calculate progress based on filled fields (all required fields)
  useEffect(() => {
    const validatedFields = ['about', 'experience', 'skills', 'equipment', 'qualifications', 'hourlyRate', 'location', 'availability', 'videoIntro', 'references'];
 
    const filledFields = validatedFields.filter(field => {
      const value = formData[field as keyof FormData];
      
      // Check if field is using existing data (for fields with toggles)
      const fieldsWithToggles = ['about', 'location', 'availability'];
      if (fieldsWithToggles.includes(field)) {
        const toggleKey = field as keyof typeof dataToggleOptions;
        if (dataToggleOptions[toggleKey] === 'existing') {
          // If using existing data, check if we have existing data available
          let hasExistingData = false;
          
          if (fetchedExistingData?.profileData) {
            switch (field) {
              case 'about':
                hasExistingData = !!fetchedExistingData.profileData.fullBio;
                break;
              case 'location':
                hasExistingData = !!fetchedExistingData.profileData.location;
                break;
              case 'availability':
                hasExistingData = !!fetchedExistingData.profileData.availabilityJson;
                break;
            }
          } else if (existingProfileData) {
            hasExistingData = !!existingProfileData[field as keyof ExistingData];
          }
          
          console.log(`🔍 Progress check for ${field} (existing):`, {
            usingExisting: true,
            hasExistingData,
            isValid: hasExistingData
          });
          return hasExistingData;
        }
      }
      
      // Special handling for different field types
      if (field === 'hourlyRate') {
        const isValid = value && typeof value === 'number' && value >= VALIDATION_CONSTANTS.WORKER.MIN_HOURLY_RATE;
        console.log(`🔍 Progress check for ${field}:`, {
          value,
          minRate: VALIDATION_CONSTANTS.WORKER.MIN_HOURLY_RATE,
          isValid
        });
        return isValid;
      }
      
      if (field === 'location') {
        const isValid = value && value.lat && value.lng;
        console.log(`🔍 Progress check for ${field}:`, {
          hasLocation: !!value,
          hasLat: !!value?.lat,
          hasLng: !!value?.lng,
          isValid
        });
        return isValid;
      }
      
      if (field === 'availability') {
        const isValid = value && value.days && value.days.length > 0;
        console.log(`🔍 Progress check for ${field}:`, {
          hasAvailability: !!value,
          daysCount: value?.days?.length || 0,
          isValid
        });
        return isValid;
      }
      
      if (field === 'videoIntro') {
        const isValid = value && typeof value === 'string' && value.trim().length > 0;
        console.log(`🔍 Progress check for ${field}:`, {
          hasVideo: !!value,
          isString: typeof value === 'string',
          length: value?.length || 0,
          isValid
        });
        return isValid;
      }
      
      if (field === 'references') {
        // References are only required if workerProfileId is available (profile created)
        const isValid = !workerProfileId || (value && typeof value === 'string' && value.trim().length > 0);
        console.log(`🔍 Progress check for ${field}:`, {
          value: value?.substring(0, 20) + '...',
          length: value?.length || 0,
          hasWorkerProfileId: !!workerProfileId,
          isValid
        });
        return isValid;
      }
      
      if (field === 'equipment') {
        // Equipment is optional - always considered valid
        const isValid = true;
        console.log(`🔍 Progress check for ${field}:`, {
          value: value?.substring(0, 20) + '...',
          length: value?.length || 0,
          isValid
        });
        return isValid;
      }
      
      // For experience field, just check if it's not empty (very lenient)
      if (field === 'experience') {
        const isValid = value && typeof value === 'string' && value.trim().length > 0;
        console.log(`🔍 Progress check for ${field}:`, {
          value: value?.substring(0, 20) + '...',
          length: value?.length || 0,
          isValid
        });
        return isValid;
      }
      
      // For other text fields, check minimum length
      const minLength = VALIDATION_CONSTANTS.WORKER[`MIN_${field.toUpperCase()}_LENGTH` as keyof typeof VALIDATION_CONSTANTS.WORKER];
      const isValid = value && typeof value === 'string' && value.trim().length >= minLength;
      
      console.log(`🔍 Progress check for ${field}:`, {
        value: value?.substring(0, 20) + '...',
        length: value?.length || 0,
        minLength,
        isValid
      });
      
      return isValid;
    });
    
    const progressPercentage = (filledFields.length / validatedFields.length) * 100;
    console.log(`📊 Form progress: ${filledFields.length}/${validatedFields.length} = ${progressPercentage}%`);
    setProgress(progressPercentage);
  }, [formData, dataToggleOptions, fetchedExistingData, existingProfileData, workerProfileId]);

  const validateField = (name: keyof FormData, value: any): string => {

    switch (name) {
      case 'about':
        return value.trim().length < VALIDATION_CONSTANTS.WORKER.MIN_ABOUT_LENGTH ? `Please provide at least ${VALIDATION_CONSTANTS.WORKER.MIN_ABOUT_LENGTH} characters about yourself` : '';
      case 'experience':
        // Allow any non-empty input - very lenient validation
        const trimmedValue = value.trim();
        
        if (!trimmedValue) {
          return `Please enter your years of experience (e.g., "1", "5", "2.5 years")`;
        }
        return '';
      case 'skills':
        return value.trim().length < VALIDATION_CONSTANTS.WORKER.MIN_SKILLS_LENGTH ? `Please list your skills (at least ${VALIDATION_CONSTANTS.WORKER.MIN_SKILLS_LENGTH} characters)` : '';
      case 'equipment':
        // Equipment is optional - no validation required
        return '';
      case 'qualifications':
        // Qualifications are optional, but if provided, should be meaningful
        return value && value.trim().length > 0 && value.trim().length < VALIDATION_CONSTANTS.WORKER.MIN_QUALIFICATIONS_LENGTH ? `Please provide more details about your qualifications (at least ${VALIDATION_CONSTANTS.WORKER.MIN_QUALIFICATIONS_LENGTH} characters)` : '';
      case 'hourlyRate':
        return !value || value < VALIDATION_CONSTANTS.WORKER.MIN_HOURLY_RATE ? `Please enter a valid hourly rate (minimum £${VALIDATION_CONSTANTS.WORKER.MIN_HOURLY_RATE})` : '';
      case 'location':
        return !value || !value.lat || !value.lng ? 'Please select your location' : '';
      case 'availability':
        return !value.days || value.days.length === 0 ? 'Please select at least one day of availability' : '';
      case 'videoIntro':
        return !value || typeof value !== 'string' || value.trim().length === 0 ? 'Please record a video introduction' : '';
      case 'references':
        // References link is always required (temporary link is generated immediately)
        if (!value || value.trim().length === 0) {
          return 'References link is required';
        }
        return '';
      default:
        return '';
    }
  };

  const handleInputChange = (name: keyof FormData, value: any) => {
    setFormData(prev => {
      const newData = { ...prev, [name]: value };
      
      // Parse experience in real-time when user types
      if (name === 'experience' && typeof value === 'string') {
        const { years, months } = parseExperienceToNumeric(value);
        newData.experienceYears = years;
        newData.experienceMonths = months;
      }
      
      return newData;
    });

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }

    // Real-time skill check (debounced)
    if (name === 'skills' && typeof value === 'string' && value.trim().length > 0 && dataToggleOptions.skills === 'new') {
      // Clear previous timeout
      if (skillCheckTimeoutRef.current) {
        clearTimeout(skillCheckTimeoutRef.current);
      }

      // Set new timeout for skill check
      skillCheckTimeoutRef.current = setTimeout(async () => {
        const skillCheck = await checkExistingSkill(value);
        if (skillCheck.exists) {
          setErrors(prev => ({ 
            ...prev, 
            skills: skillCheck.message || 'This skill already exists in your profile.' 
          }));
        }
      }, 1000); // 1 second debounce
    }
  };

  const handleLocationChange = (locationData: any) => {
    setFormData(prev => ({ ...prev, location: locationData }));
    if (errors.location) {
      setErrors(prev => ({ ...prev, location: '' }));
    }
  };

  const handleVideoRecorded = async (blob: Blob) => {
    if (!user) {
      console.error('User not authenticated for video upload');
      return;
    }

    try {
      // Upload video to Firebase Storage
      const file = new File([blob], 'video-intro.webm', { type: 'video/webm' });
      const filePath = `workers/${user.uid}/introVideo/introduction-${encodeURI(user.email ?? user.uid)}.webm`;
      const fileStorageRef = ref(getStorage(firebaseApp), filePath);
      const uploadTask = uploadBytesResumable(fileStorageRef, file);

      // Wait for upload to complete and get download URL
      const downloadURL = await new Promise<string>((resolve, reject) => {
        uploadTask.on(
          "state_changed",
          (snapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            console.log("Video upload progress:", progress + "%");
          },
          (error) => {
            console.error("Video upload failed:", error);
            reject(error);
          },
          () => {
            getDownloadURL(uploadTask.snapshot.ref)
              .then((url) => {
                console.log("Video uploaded successfully:", url);
                resolve(url);
              })
              .catch(reject);
          }
        );
      });

      // Store the Firebase download URL instead of the File object
      setFormData(prev => ({ ...prev, videoIntro: downloadURL }));
      
      // Clear any existing video validation errors
      setErrors(prev => ({ ...prev, videoIntro: '' }));
    } catch (error) {
      console.error("Video upload error:", error);
      setErrors(prev => ({ ...prev, videoIntro: 'Video upload failed. Please try again.' }));
    }
  };


  // AI Content Validation function - rejects inappropriate content
  const validateContentWithAI = async (field: string, value: string): Promise<{ isValid: boolean; error?: string; sanitized?: string }> => {
    if (!value || value.trim().length === 0) {
      return { isValid: true, sanitized: value };
    }

    try {
      const ai = getAI();
      if (!ai) {
        console.log('AI not available, skipping content validation');
        return { isValid: true, sanitized: value };
      }

      let prompt = '';
      let schema: any;

      if (field === 'about') {
        prompt = `This is a worker's self-description. Be very lenient and only reject content that is clearly inappropriate (explicit content, hate speech, or completely nonsensical). Accept almost everything else including casual language, personal details, and informal descriptions.
        
        Description: "${value}"`;
        
        schema = Schema.object({
          properties: {
            isValid: Schema.boolean(),
            reason: Schema.string(),
            sanitized: Schema.string()
          },
          required: ["isValid", "reason", "sanitized"]
        });
      } else if (field === 'skills') {
        prompt = `This is a worker's skills list. Be very lenient and accept any skills that could be relevant to work, even if informal or creative. Only reject content that is clearly inappropriate (explicit content, hate speech, or completely nonsensical).
        
        Skills: "${value}"`;
        
        schema = Schema.object({
          properties: {
            isValid: Schema.boolean(),
            reason: Schema.string(),
            sanitized: Schema.string()
          },
          required: ["isValid", "reason", "sanitized"]
        });
    } else if (field === 'experience') {
      prompt = `This is a worker's experience description. Be very lenient and accept any experience description, even if informal or brief. Only reject content that is clearly inappropriate (explicit content, hate speech, or completely nonsensical).
      
      Experience: "${value}"`;
        
        schema = Schema.object({
          properties: {
            isValid: Schema.boolean(),
            reason: Schema.string(),
            sanitized: Schema.string()
          },
          required: ["isValid", "reason", "sanitized"]
        });
      } else if (field === 'equipment') {
        prompt = `This is a worker's equipment list. Be very lenient and accept any equipment that could be relevant to work, even if informal or creative. Only reject content that is clearly inappropriate (explicit content, hate speech, or completely nonsensical).
        
        Equipment: "${value}"`;
        
        schema = Schema.object({
          properties: {
            isValid: Schema.boolean(),
            reason: Schema.string(),
            sanitized: Schema.string()
          },
          required: ["isValid", "reason", "sanitized"]
        });
      } else {
        return { isValid: true, sanitized: value };
      }

      const result = await geminiAIAgent(
        VALIDATION_CONSTANTS.AI_MODELS.GEMINI_2_0_FLASH,
        { prompt, responseSchema: schema },
        ai,
        VALIDATION_CONSTANTS.AI_MODELS.GEMINI_2_5_FLASH_PREVIEW
      );

      if (result.ok) {
        const data = result.data as any;
        return {
          isValid: data.isValid,
          error: data.isValid ? undefined : data.reason,
          sanitized: data.sanitized || value
        };
      } else {
        console.error('AI content validation failed:', result);
        return { isValid: true, sanitized: value }; // Fallback to allow submission
      }
    } catch (error) {
      console.error('AI content validation error:', error);
      return { isValid: true, sanitized: value }; // Fallback to allow submission
    }
  };


  // AI Sanitization function for specific fields (kept for job title extraction)
  const sanitizeWithAI = async (field: string, value: string): Promise<{ sanitized: string; jobTitle?: string; yearsOfExperience?: number }> => {
    if (!value || value.trim().length === 0) {
      return { sanitized: value };
    }

    // Pre-validation: Check for inappropriate content before AI processing
    try {
      const { preValidateContent } = await import('../../../lib/utils/contentModeration');
      const preValidation = preValidateContent(value);
      
      // If pre-validation rejects with high confidence, return sanitized rejection
      if (!preValidation.isAppropriate && preValidation.confidence > 0.8) {
        return { 
          sanitized: `[Content rejected: ${preValidation.reason}]`,
          yearsOfExperience: 0
        };
      }
    } catch (error) {
      console.error('Pre-validation failed:', error);
      // Continue with AI validation if pre-validation fails
    }

    try {
      const ai = getAI();
      if (!ai) {
        console.log('AI not available, returning original value');
        return { sanitized: value };
      }

      let prompt = '';
      let schema: any;

      if (field === 'about') {
        prompt = `Extract the job title from this worker's self-description. Return only the most relevant job title (e.g., "Bartender", "Chef", "Event Coordinator"). If no clear job title, return "General Worker".

Description: "${value}"`;
        
        schema = Schema.object({
          properties: {
            jobTitle: Schema.string(),
            sanitized: Schema.string()
          },
          required: ["jobTitle", "sanitized"]
        });
      } else if (field === 'skills') {
        prompt = `Clean and format this skills list. Extract only the skill names, removing phrases like "I am a", "I can", "I have", etc. Convert to simple skill names.

Examples:
- "I am a chef" → "Chef"
- "I can cook" → "Cooking"
- "I have experience in bartending" → "Bartending"
- "I am good at customer service" → "Customer Service"

Remove duplicates, fix typos, and organize into a clean comma-separated list. Keep only relevant professional skills.

Skills: "${value}"`;
        
        schema = Schema.object({
          properties: {
            sanitized: Schema.string()
          },
          required: ["sanitized"]
        });
      } else if (field === 'experience') {
        prompt = `Extract the years of experience from this text. Be VERY LENIENT - accept any reasonable input including single numbers. REJECT only if it contains:
- Video game references: "mario", "luigi", "peach", "bowser", "sonic", "link", "zelda", "pokemon", etc.
- Fictional characters: "batman", "superman", "spiderman", "wonder woman", etc.
- Memes and internet culture: "its a me mario", "hello there", "general kenobi", etc.
- Jokes and humor: "i am the best at nothing", "i can fly", "i am a wizard", etc.
- Nonsense and gibberish: "asdf", "qwerty", "random text", "blah blah", etc.

ACCEPT ANY reasonable input including:
- Single numbers (e.g., "1", "5", "2.5")
- Numbers with "years" (e.g., "1 year", "5 years", "2.5 years")
- Numbers with "yrs" or "y" (e.g., "1 yr", "5 yrs", "2y")
- Descriptive text (e.g., "1 year of experience", "I have 5 years", "5 years of experience")

Return the number of years as a number (can be decimal). If content is inappropriate or no clear number is found, return 0.

Experience description: "${value}"`;
        
        schema = Schema.object({
          properties: {
            yearsOfExperience: Schema.number(),
            sanitized: Schema.string()
          },
          required: ["yearsOfExperience", "sanitized"]
        });
      } else if (field === 'qualifications') {
        prompt = `Clean and format this qualifications list. Remove duplicates, fix typos, and organize into a clean comma-separated list. Keep only relevant professional qualifications, certifications, degrees, or licenses.

Qualifications: "${value}"`;
        
        schema = Schema.object({
          properties: {
            sanitized: Schema.string()
          },
          required: ["sanitized"]
        });
      } else {
        return { sanitized: value };
      }

      const result = await geminiAIAgent(
        VALIDATION_CONSTANTS.AI_MODELS.GEMINI_2_0_FLASH,
        { prompt, responseSchema: schema },
        ai,
        VALIDATION_CONSTANTS.AI_MODELS.GEMINI_2_5_FLASH_PREVIEW
      );

      if (result.ok) {
        const data = result.data as any;
        return {
          sanitized: data.sanitized || value,
          jobTitle: data.jobTitle,
          yearsOfExperience: data.yearsOfExperience
        };
      } else {
        console.error('AI sanitization failed:', result.error);
        return { sanitized: value };
      }
    } catch (error) {
      console.error('AI sanitization error:', error);
      return { sanitized: value };
    }
  };

  const validateForm = async (): Promise<boolean> => {
    const newErrors: Record<string, string> = {};
    let isValid = true;

    console.log('🔍 Starting form validation...');

    // Validate all required fields
    const fieldsToValidate = ['about', 'experience', 'skills', 'equipment', 'qualifications', 'hourlyRate', 'location', 'availability', 'videoIntro', 'references'];
    
    for (const fieldName of fieldsToValidate) {
      const value = formData[fieldName as keyof FormData];
      
      // Check if user is using existing data for this field
      const isUsingExisting = dataToggleOptions[fieldName as keyof typeof dataToggleOptions] === 'existing';
      
      // Skip validation for fields using existing data
      if (isUsingExisting) {
        console.log(`✅ Validation skipped for ${fieldName} (using existing data)`);
        continue;
      }
      
      const error = validateField(fieldName as keyof FormData, value);

      if (error) {
        newErrors[fieldName] = error;
        isValid = false;
        console.log(`❌ Validation failed for ${fieldName}:`, error);
      } else {
        console.log(`✅ Validation passed for ${fieldName}`);
      }
    }

    // Special validation for skills - check if skill already exists
    if (formData.skills && formData.skills.trim().length > 0 && dataToggleOptions.skills === 'new') {
      console.log('🔍 Checking for existing skills...');
      const skillCheck = await checkExistingSkill(formData.skills);
      
      if (skillCheck.exists) {
        newErrors.skills = skillCheck.message || 'This skill already exists in your profile.';
        isValid = false;
        console.log(`❌ Skill already exists:`, skillCheck.message);
      } else {
        console.log(`✅ Skill is new and valid`);
      }
    }

    console.log(`🔍 Form validation result: ${isValid ? 'PASSED' : 'FAILED'}`);
    if (!isValid) {
      console.log('❌ Validation errors:', newErrors);
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    console.log('🚀 Form submit triggered');
    console.log('📊 Current form state:', {
      progress,
      isSubmitting,
      formData: {
        about: formData.about?.substring(0, 20) + '...',
        experience: formData.experience?.substring(0, 20) + '...',
        skills: formData.skills?.substring(0, 20) + '...',
        equipment: formData.equipment?.substring(0, 20) + '...',
        hourlyRate: formData.hourlyRate,
        hasLocation: !!formData.location,
        hasVideo: !!formData.videoIntro
      }
    });

    if (!user) {
      console.error('❌ User not authenticated');
      return;
    }

    // Validate form before proceeding
    console.log('🔍 Starting form validation...');
    const validationResult = await validateForm();
    console.log('🔍 Form validation result:', validationResult);
    
    if (!validationResult) {
      console.log('❌ Form validation failed, not submitting');
      return;
    }

    console.log('✅ Form validation passed, proceeding with AI content validation');
    setIsSubmitting(true);
    
    try {
      // AI Content Validation - this will REJECT inappropriate content
      const validationErrors: Record<string, string> = {};
      const hasContentErrors = false;

      // Validate each field with AI
      const fieldsToValidate = ['about', 'experience', 'skills', 'equipment', 'qualifications'];
      
      for (const field of fieldsToValidate) {
        const value = formData[field as keyof FormData];
        if (value && typeof value === 'string' && value.trim().length > 0) {
          console.log(`🤖 Validating ${field} content with AI...`);
          const validation = await validateContentWithAI(field, value);
          
          if (!validation.isValid) {
            console.log(`⚠️ AI flagged ${field} for review:`, validation.error);
            // For manual onboarding, be more lenient - only show warning, don't block submission
            console.log(`📝 Manual onboarding: Allowing ${field} despite AI flag`);
            // Don't set hasContentErrors = true for manual onboarding
          } else {
            console.log(`✅ AI approved ${field}`);
          }
        }
      }

      // For manual onboarding, be more lenient with AI validation
      if (hasContentErrors) {
        console.log('⚠️ AI flagged some content, but allowing submission for manual onboarding');
        // Don't block submission for manual onboarding - just log the warnings
        // setErrors(prev => ({ ...prev, ...validationErrors }));
        // setIsSubmitting(false);
        // return;
      }

      console.log('✅ AI content validation passed, proceeding with data cleaning');
      
      // AI Sanitization for specific fields (only if content is valid)
      const sanitizedData = { ...formData };
      let extractedJobTitle = '';

      // Sanitize About field (extract job title)
      if (formData.about) {
        const aboutResult = await sanitizeWithAI('about', formData.about);
        // Always apply sanitization directly without user confirmation
        sanitizedData.about = aboutResult.sanitized;
        
        if (aboutResult.jobTitle) {
          extractedJobTitle = aboutResult.jobTitle;
        }
      }

      // Skills field is for display only - jobTitle is THE skill saved to database
      if (formData.skills) {
        const skillsResult = await sanitizeWithAI('skills', formData.skills);
        // Always apply sanitization directly without user confirmation
        sanitizedData.skills = skillsResult.sanitized;
        console.log('ℹ️ Skills field sanitized for display only - jobTitle is THE skill');
      }

      // Sanitize Qualifications field
      if (formData.qualifications) {
        const qualificationsResult = await sanitizeWithAI('qualifications', formData.qualifications);
        // Always apply sanitization directly without user confirmation
        sanitizedData.qualifications = qualificationsResult.sanitized;
      }

      // Sanitize Experience field (extract years and months as numeric)
      if (formData.experience) {
        const experienceResult = await sanitizeWithAI('experience', formData.experience);
        sanitizedData.experience = experienceResult.sanitized;
        
        // Parse experience text to get numeric years and months
        const { years, months } = parseExperienceToNumeric(formData.experience);
        
        // Store the parsed numeric values
        sanitizedData.experienceYears = years;
        sanitizedData.experienceMonths = months;
        
        console.log('Parsed experience:', { 
          original: formData.experience, 
          years, 
          months,
          totalYears: years + (months / 12)
        });
      }

      // Add extracted job title to the data
      if (extractedJobTitle) {
        sanitizedData.jobTitle = extractedJobTitle;
      }

      // Show data review modal with original and cleaned data
      console.log('📋 Showing data review modal with original and cleaned data');
      
      setDataReviewModal({
        isOpen: true,
        originalData: { ...formData },
        cleanedData: { ...sanitizedData },
        onConfirm: () => {
          console.log('✅ User confirmed cleaned data, proceeding with submission');
          console.log('🔍 Modal onConfirm called, sanitized data:', sanitizedData);
          setDataReviewModal(prev => ({ ...prev, isOpen: false }));
          // Submit sanitized data directly
          console.log('🚀 Calling continueFormSubmission...');
          continueFormSubmission(sanitizedData);
        },
        onGoBack: () => {
          console.log('↩️ User chose to go back and edit');
          setDataReviewModal(prev => ({ ...prev, isOpen: false }));
          setIsSubmitting(false);
        }
      });
    } catch (error) {
      console.error('Form submission error:', error);
      // Set error state to show user
      setErrors(prev => ({ ...prev, submit: 'Failed to submit form. Please try again.' }));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Prevent implicit submit when pressing Enter in inputs
  const handleFormKeyDown = (e: React.KeyboardEvent<HTMLFormElement>) => {
    if (e.key !== 'Enter') return;
    const target = e.target as HTMLElement | null;
    if (!target) return;

    const tagName = target.tagName?.toLowerCase();
    const isTextarea = tagName === 'textarea';
    const isButton = tagName === 'button';
    const isSubmitButton = isButton && (target as HTMLButtonElement).type === 'submit';

    // Block Enter unless it's inside a textarea (new line) or the explicit submit button
    if (!isTextarea && !isSubmitButton) {
      e.preventDefault();
    }
  };

  return (
    <div className={styles.formContainer}>
      <div className={styles.formHeader}>
        <h2 className={styles.formTitle}>Create Your Worker Profile</h2>
        <p className={styles.formSubtitle}>
          Fill out the form below to complete your profile setup
        </p>

        {/* Progress Bar */}
        <div className={styles.progressContainer}>
          <div className={styles.progressBar}>
            <div
              className={styles.progressFill}
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className={styles.progressText}>{Math.round(progress)}% Complete</span>
        </div>

        {/* Switch to AI Option */}
        <button
          type="button"
          className={styles.switchButton}
          onClick={onSwitchToAI}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" fill="currentColor"/>
          </svg>
          Switch to AI-Assisted Setup
        </button>
      </div>


      <form onSubmit={handleSubmit} onKeyDown={handleFormKeyDown} className={styles.form}>
        {/* About Section */}
        <div className={styles.formSection}>
          <h3 className={styles.sectionTitle}>About You</h3>

          <div className={styles.formGroup}>
            <label className={styles.label}>
              Tell us about yourself *
              <InlineDataToggle
                fieldKey="about"
                hasExistingData={!!(fetchedExistingData?.profileData?.fullBio || existingProfileData?.about)}
                isUsingExisting={dataToggleOptions.about === 'existing'}
                onToggle={handleInlineToggle}
                disabled={isSubmitting}
                existingValue={fetchedExistingData?.profileData?.fullBio || existingProfileData?.about}
              />
            </label>
            {dataToggleOptions.about === 'existing' ? (
              <div className={styles.existingDataDisplay}>
                <div className={styles.existingDataContent}>
                  {formData.about || fetchedExistingData?.profileData?.fullBio || existingProfileData?.about || 'No existing data'}
                </div>
                <button
                  type="button"
                  className={styles.editExistingButton}
                  onClick={() => handleToggleChange('about', 'new')}
                >
                  Edit
                </button>
              </div>
            ) : (
              <textarea
                className={`${styles.textarea} ${errors.about ? styles.error : ''}`}
                value={formData.about}
                onChange={(e) => handleInputChange('about', e.target.value)}
                placeholder="Tell us about yourself and your background..."
                rows={4}
              />
            )}
            {errors.about && <span className={styles.errorText}>{errors.about}</span>}
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>
              Skills *
            </label>
            <textarea
              className={`${styles.textarea} ${errors.skills ? styles.error : ''}`}
              value={formData.skills}
              onChange={(e) => handleInputChange('skills', e.target.value)}
              placeholder="List your professional skills..."
              rows={3}
            />
            <div className={styles.helpText}>
              Note: Your main skill will be determined from your job title above
            </div>
            {errors.skills && <span className={styles.errorText}>{errors.skills}</span>}
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>
              Years of Experience *
            </label>
            {dataToggleOptions.experience === 'existing' ? (
              <div className={styles.existingDataDisplay}>
                <div className={styles.existingDataContent}>
                  {formData.experience}
                </div>
                <button
                  type="button"
                  className={styles.editExistingButton}
                  onClick={() => handleToggleChange('experience', 'new')}
                >
                  Edit
                </button>
              </div>
            ) : (
              <textarea
                className={`${styles.textarea} ${errors.experience ? styles.error : ''}`}
                value={formData.experience}
                onChange={(e) => handleInputChange('experience', e.target.value)}
                placeholder="How many years of experience do you have? (e.g., '5', '5 years', '2.5 years', '5 years and 3 months')"
                rows={3}
              />
            )}
            {formData.experienceYears && formData.experienceYears > 0 && (
              <div className={styles.helpText}>
                Parsed: {formData.experienceYears} years {formData.experienceMonths && formData.experienceMonths > 0 ? `and ${formData.experienceMonths} months` : ''} 
                (Total: {((formData.experienceYears || 0) + ((formData.experienceMonths || 0) / 12)).toFixed(1)} years)
              </div>
            )}
            {errors.experience && <span className={styles.errorText}>{errors.experience}</span>}
          </div>

           <div className={styles.formGroup}>
             <label className={styles.label}>
               Qualifications & Certifications *
             </label>
             <textarea
               className={`${styles.textarea} ${errors.qualifications ? styles.error : ''}`}
               value={formData.qualifications}
               onChange={(e) => handleInputChange('qualifications', e.target.value)}
               placeholder="List your qualifications, certifications, degrees, licenses, etc..."
               rows={3}
             />
             {errors.qualifications && <span className={styles.errorText}>{errors.qualifications}</span>}
           </div>

           <div className={styles.formGroup}>
             <label className={styles.label}>
               Equipment *
             </label>
             <textarea
               className={`${styles.textarea} ${errors.equipment ? styles.error : ''}`}
               value={formData.equipment}
               onChange={(e) => handleInputChange('equipment', e.target.value)}
               placeholder="List any equipment you have that you can use for your work..."
               rows={3}
             />
             {errors.equipment && <span className={styles.errorText}>{errors.equipment}</span>}
           </div>
        </div>

        {/* Pricing & Location Section */}
        <div className={styles.formSection}>
          <h3 className={styles.sectionTitle}>Pricing & Location</h3>

          <div className={styles.formGroup}>
            <label className={styles.label}>
              Hourly Rate (£) *
            </label>
            <div className={styles.inputWrapper}>
              <input
                type="number"
                className={`${styles.input} ${styles.rateInput} ${errors.hourlyRate ? styles.error : ''}`}
                value={formData.hourlyRate || ''}
                onChange={(e) => handleInputChange('hourlyRate', parseFloat(e.target.value) || 0)}
                placeholder="15"
                min={VALIDATION_CONSTANTS.WORKER.MIN_HOURLY_RATE}
                step="0.01"
              />
            </div>
            {errors.hourlyRate && <span className={styles.errorText}>{errors.hourlyRate}</span>}
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>
              Your Location *
              <InlineDataToggle
                fieldKey="location"
                hasExistingData={!!(fetchedExistingData?.profileData?.location || existingProfileData?.location)}
                isUsingExisting={dataToggleOptions.location === 'existing'}
                onToggle={handleInlineToggle}
                disabled={isSubmitting}
                existingValue={fetchedExistingData?.profileData?.location || existingProfileData?.location}
              />
            </label>
            {dataToggleOptions.location === 'existing' ? (
              <div className={styles.existingDataDisplay}>
                <div className={styles.existingDataContent}>
                  {formatLocationDisplay(
                    formData.location || 
                    fetchedExistingData?.profileData?.location || 
                    existingProfileData?.location
                  )}
                </div>
                <button
                  type="button"
                  className={styles.editExistingButton}
                  onClick={() => handleToggleChange('location', 'new')}
                >
                  Edit
                </button>
              </div>
            ) : (
              <LocationPickerBubble
                value={formData.location}
                onChange={handleLocationChange}
                role="GIG_WORKER"
              />
            )}
            {errors.location && <span className={styles.errorText}>{errors.location}</span>}
          </div>
        </div>

        {/* Availability Section */}
        <div className={styles.formSection}>
          <h3 className={styles.sectionTitle}>Weekly Availability</h3>
          <p className={styles.helpText}>Set your recurring weekly availability schedule</p>

          <div className={styles.formGroup}>
            <label className={styles.label}>
              Available Days *
              <InlineDataToggle
                fieldKey="availability"
                hasExistingData={!!(fetchedExistingData?.profileData?.availabilityJson || existingProfileData?.availability)}
                isUsingExisting={dataToggleOptions.availability === 'existing'}
                onToggle={handleInlineToggle}
                disabled={isSubmitting}
                existingValue={fetchedExistingData?.profileData?.availabilityJson ? 'Set availability' : (existingProfileData?.availability ? 'Set availability' : null)}
              />
            </label>
            {dataToggleOptions.availability === 'existing' ? (
              <div className={styles.existingDataDisplay}>
                <div className={styles.existingDataContent}>
                  {formatAvailabilityDisplay(
                    formData.availability || 
                    fetchedExistingData?.profileData?.availabilityJson || 
                    existingProfileData?.availability
                  )}
                </div>
                <button
                  type="button"
                  className={styles.editExistingButton}
                  onClick={() => handleToggleChange('availability', 'new')}
                >
                  Edit
                </button>
              </div>
            ) : (
              <OnboardingAvailabilityStep
                currentAvailability={formData.availability}
                onAvailabilityChange={(availability) => handleInputChange('availability', availability)}
                onConfirm={() => {}} // No confirmation needed in manual form
                isSubmitting={isSubmitting}
              />
            )}
            {errors.availability && <span className={styles.errorText}>{errors.availability}</span>}
          </div>
        </div>

        {/* Media & References Section */}
        <div className={styles.formSection}>
          <h3 className={styles.sectionTitle}>Media & References</h3>

          <div className={styles.formGroup}>
            <label className={styles.label}>
              Video Introduction *
            </label>
            <VideoRecorderOnboarding
              onVideoRecorded={handleVideoRecorded}
              prompt="Record a 30-second introduction video to help clients get to know you"
            />
            {formData.videoIntro && (
              <p className={styles.helpText}>Video uploaded successfully ✓</p>
            )}
            {errors.videoIntro && <span className={styles.errorText}>{errors.videoIntro}</span>}
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>
              References Link
            </label>
            <div className={styles.referencesContainer}>
              <div className={styles.referencesInfo}>
                <p className={styles.referencesDescription}>
                  Share this link with your previous employers, colleagues, or clients to collect references:
                </p>
                <div className={styles.referencesLinkContainer}>
                  <input
                    type="text"
                    className={styles.referencesLink}
                    value={formData.references}
                    readOnly
                  />
                  <button
                    type="button"
                    className={styles.copyButton}
                    onClick={() => {
                      navigator.clipboard.writeText(formData.references);
                      // You could add a toast notification here
                    }}
                    title="Copy link to clipboard"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z" fill="currentColor"/>
                    </svg>
                  </button>
                </div>
                <p className={styles.helpText}>
                  Send this link to people who can provide references for your work. They'll be able to submit recommendations directly through our platform.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className={styles.formActions}>
          {errors.submit && (
            <div className={styles.errorMessage}>
              {errors.submit}
            </div>
          )}
          
          <button
            type="submit"
            className={styles.submitButton}
            disabled={isSubmitting || progress < 50}
          >
            {isSubmitting ? (
              <>
                <div className={styles.spinner} />
                Creating Profile...
              </>
            ) : (
              'Complete Profile Setup'
            )}
          </button>

          {progress < 50 && (
            <p className={styles.completionNote}>
              Please fill in all required fields to complete your profile: about, experience, skills, equipment, qualifications, hourly rate, location, availability, video introduction, and references
            </p>
          )}
        </div>
      </form>
      

      {/* Data Review Modal */}
      <DataReviewModal
        isOpen={dataReviewModal.isOpen}
        onClose={() => setDataReviewModal(prev => ({ ...prev, isOpen: false }))}
        onConfirm={dataReviewModal.onConfirm}
        onGoBack={dataReviewModal.onGoBack}
        originalData={dataReviewModal.originalData}
        cleanedData={dataReviewModal.cleanedData}
        isSubmitting={isSubmitting}
      />
    </div>
  );
};

export default ManualProfileForm;
