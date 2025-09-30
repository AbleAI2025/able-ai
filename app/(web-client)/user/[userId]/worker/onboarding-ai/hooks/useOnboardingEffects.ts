import { useEffect, useRef, useState } from 'react';
import { initializeChatSteps } from '../utils/step-management/step-flow';

export function useOnboardingEffects({
  user,
  chatSteps,
  isTyping,
  error,
  setError,
  reformulateField,
  isReformulating,
  setReformulateField,
  setIsReformulating,
  formData,
  setFormData,
  setChatSteps,
  requiredFields,
  checkExistingData,
  createProfile,
  endOfChatRef,
  setSetupMode,
  setShowSetupChoice
}: any) {
  const [isInitialized, setIsInitialized] = useState(false);
  const initializationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Auto-scroll to bottom when chat updates
  useEffect(() => {
    if (endOfChatRef.current) {
      endOfChatRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatSteps, isTyping, endOfChatRef]);

  // Initialize user session
  useEffect(() => {
    if (user?.uid && !isInitialized) {
      console.log('Initializing user session for the first time');
      setIsInitialized(true);
      setFormData({});
      
      // Initialize with empty chat steps - the checkExistingData effect will handle proper initialization
      setChatSteps([]);
    }
  }, [user?.uid, isInitialized]);

  // Auto-dismiss error messages
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error, setError]);

  // Listen for manual switch command
  useEffect(() => {
    const handleManualSwitch = () => {
      setSetupMode('manual');
      setShowSetupChoice(false);
    };

    document.addEventListener('switchToManual', handleManualSwitch);
    
    return () => {
      document.removeEventListener('switchToManual', handleManualSwitch);
    };
  }, [setSetupMode, setShowSetupChoice]);

  // Safety timeout for reformulate state
  useEffect(() => {
    if (reformulateField && isReformulating) {
      const safetyTimer = setTimeout(() => {
        console.warn('Reformulate state stuck for too long, resetting...');
        setIsReformulating(false);
        setReformulateField(null);
      }, 10000);
      
      return () => clearTimeout(safetyTimer);
    }
  }, [reformulateField, isReformulating, setIsReformulating, setReformulateField]);

  // Handle reformulation logic
  useEffect(() => {
    if (reformulateField) {
      setIsReformulating(true);
      
      // Clear the field value
      setFormData((prev: any) => ({ ...prev, [reformulateField]: '' }));
      
      // Find the field configuration
      const fieldConfig = requiredFields.find((f: any) => f.name === reformulateField);
      if (fieldConfig) {
        // Add bot message asking for input instead of input step
        const newStep = {
          id: Date.now(),
          type: "bot",
          content: fieldConfig.defaultPrompt,
          isComplete: true,
          isNew: true,
        };
        
        setChatSteps((prev: any[]) => [...prev, newStep]);
      }
      
      // Reset reformulate state after a delay
      const timeoutId = setTimeout(() => {
        setIsReformulating(false);
        setReformulateField(null);
      }, 1000);
      
      return () => {
        clearTimeout(timeoutId);
      };
    }
  }, [reformulateField, requiredFields, setFormData, setChatSteps, setIsReformulating, setReformulateField]);

  // Check existing data on mount
  useEffect(() => {
    if (user?.uid && user?.token && isInitialized) {
      console.log('useOnboardingEffects - checking existing data, user:', user);
      checkExistingData();
    } else {
      console.log('useOnboardingEffects - user not ready yet:', user);
    }
  }, [user?.uid, user?.token, isInitialized]);

  // Create profile when user is available
  useEffect(() => {
    if (user?.uid) {
      createProfile();
    }
  }, [user?.uid]);
}
