"use client";

import React, { useState, useEffect, useRef, FormEvent, useMemo } from 'react';
import { usePathname } from 'next/navigation';
import { useAppContext } from '@/app/hooks/useAppContext'; 

import ChatBotLayout from '@/app/components/onboarding/ChatBotLayout'; 
import MessageBubble from '@/app/components/onboarding/MessageBubble';
import InputBubble from '@/app/components/onboarding/InputBubble'; // Corrected path
import TextAreaBubble from '@/app/components/onboarding/TextAreaBubble'; // Corrected path
// import FileUploadBubble from '@/app/components/onboarding/FileUploadBubble'; // Corrected path - Uncomment if used
import WorkerCard, { WorkerData } from '@/app/components/onboarding/WorkerCard'; // Import shared WorkerCard and WorkerData

import Loader from '@/app/components/shared/Loader';

import pageStyles from './page.module.css';

interface OnboardingStep {
  id: number;
  type: 'botMessage' | 'userInput' | 'userResponseDisplay' | 'workerCard' | 'terms' | 'fileUpload' | 'datePicker' | 'discountCode';
  senderType?: 'bot' | 'user';
  content?: string | React.ReactNode;
  inputType?: 'text' | 'email' | 'number' | 'textarea' | 'file' | 'date';
  inputName?: string;
  inputPlaceholder?: string;
  inputLabel?: string;
  isComplete?: boolean;
  dependsOn?: number;
  value?: any;
  fileLabel?: string;
  fileMultiple?: boolean;
  workerData?: WorkerData; // Added workerData to step
}

// WorkerData interface and WorkerCard component removed - now imported

const baseInitialSteps: OnboardingStep[] = [
  { id: 1, type: 'botMessage', content: "Hi! Tell me about yourself and what gig or gigs you need filling - we can assemble a team if you need one!" },
  {id: 2, type: 'userInput', inputType: 'text', inputName: 'gigDescription', inputPlaceholder: 'e.g., Bartender for a wedding reception', inputLabel: 'Gig Description:'},
  { id: 3, type: 'botMessage', content: "We have some great bartenders available. Do you need any special skills or do you have instructions for your hire?", dependsOn: 1 },
  {
    id: 4, type: 'userInput', inputType: 'textarea', inputName: 'additionalInstructions',
    inputPlaceholder: 'e.g., Cocktail making experience would be ideal', inputLabel: 'Additional Instructions:', dependsOn: 2
  },
  { id: 5, type: 'botMessage', content: "How much you would like to pay per hour? We suggest £15 plus tips to keep a motivated and happy team!", dependsOn: 3 },
  {
    id: 6, type: 'userInput', inputType: 'number', inputName: 'hourlyRate',
    inputPlaceholder: '£15', inputLabel: 'Hourly Rate:', dependsOn: 4
  },
  { id: 7, type: 'botMessage', content: "Where is the gig? What time and day do you need someone and for how long?", dependsOn: 5 },
  {
    id: 8, type: 'userInput', inputType: 'text', inputName: 'gigLocation',
    inputPlaceholder: 'e.g., The Green Tavern, Rye Lane, Peckham, SE15 5AR', inputLabel: 'Gig Location:', dependsOn: 6
  },
  {
    id: 9, type: 'userInput', inputType: 'date', inputName: 'gigDate',
    inputLabel: 'Date of Gig:', dependsOn: 8
  },
  { id: 10, type: 'discountCode', content: "I have a discount code 2FREEABLE", dependsOn: 9}, // This will be rendered as a MessageBubble
  { id: 11, type: 'botMessage', content: "Thankyou! We will apply your discount code", dependsOn: 10 },
  { id: 12, type: 'botMessage', content: "Here are our incredible available gig workers ready to accept your gig. Click on their profile for an indepth look at their gigfolio or simply book now", dependsOn: 10 },
  {
        id: 13,
        type: 'workerCard',
        dependsOn: 12,
        workerData: {
            name: 'Benji Asamoah',
            title: 'Bartender',
            gigs: 15,
            experience: '3 years experience',
            keywords: 'lively, professional and hardworking',
            hourlyRate: 15,
            totalHours: 6,
            totalPrice: 98.68,
            ableFees: '6.5% +VAT',
            stripeFees: '1.5% + 20p',
            imageSrc: '/images/benji.jpeg', // Replace with actual image URL
        }
    },
    {
        id: 14,
        type: 'workerCard',
        dependsOn: 12, // Should depend on the previous message, not the previous card for parallel display
        workerData: {
            name: 'Jessica Hersey',
            title: 'Bartender',
            gigs: 11,
            experience: '2 years experience',
            keywords: 'charming, peaceful and kind',
            hourlyRate: 15,
            totalHours: 6,
            totalPrice: 85.55,
            ableFees: '6.5% +VAT',
            stripeFees: '1.5% + 20p',
            imageSrc: '/images/jessica.jpeg', // Replace with actual image URL
        }
    },
];


export default function OnboardBuyerPage() {
  const pathname = usePathname();
  const { isLoading: loadingAuth, user, updateUserContext } = useAppContext();
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const isQA = !!user?.isQA;

  const [onboardingSteps, setOnboardingSteps] = useState<OnboardingStep[]>(baseInitialSteps.map(s => ({ ...s, isComplete: false })));
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [chatMessages, setChatMessages] = useState<OnboardingStep[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentFocusedInputName, setCurrentFocusedInputName] = useState<string | null>(null);
  const [workerName, setWorkerName] = useState<string | null>(null); // Added state
  const [workerPrice, setWorkerPrice] = useState<number | null>(null); // Added state

  // QA mode: fill formData and steps with mock data if isQA
  useEffect(() => {
    if (isQA) {
      const qaFormData: Record<string, any> = {};
      baseInitialSteps.forEach(step => {
        if (step.inputName) {
          switch (step.inputType) {
            case 'file': qaFormData[step.inputName] = `sample-${step.inputName}.pdf`; break;
            case 'date': qaFormData[step.inputName] = new Date().toISOString().split('T')[0]; break;
            case 'number': qaFormData[step.inputName] = 15; break;
            default: qaFormData[step.inputName] = `QA: ${step.inputLabel || step.inputName || 'Sample'}`;
          }
        }
      });
      setFormData(qaFormData);
      setOnboardingSteps(baseInitialSteps.map(s => ({ ...s, isComplete: true })));
    } else {
      setOnboardingSteps(baseInitialSteps.map(s => ({ ...s, isComplete: false })));
      setFormData({});
    }
  }, [isQA]);

  useEffect(() => {
    if (!loadingAuth && user?.isAuthenticated) {
      updateUserContext({ lastRoleUsed: 'BUYER', lastViewVisited: pathname });
    }
  }, [isQA]);

  useEffect(() => {
    if (isQA) {
      // QA mode: show all steps and user responses as complete
      const newMessages: OnboardingStep[] = [];
      let currentStepIdForDependency = 0;
      baseInitialSteps.forEach(step => {
        const messageToAdd = { ...step, content: step.content, isComplete: true, dependsOn: currentStepIdForDependency };
        newMessages.push(messageToAdd);
        currentStepIdForDependency = step.id;
        if (step.inputName && (step.type === 'userInput' || step.type === 'fileUpload' || step.type === 'datePicker' || step.type === 'terms')) {
          let qaValue = formData[step.inputName];
          if (qaValue === undefined) {
            switch (step.inputType) {
              case 'file': qaValue = `sample-${step.inputName}.pdf`; break;
              case 'date': qaValue = new Date().toISOString().split('T')[0]; break;
              case 'number': qaValue = 15; break;
              default: qaValue = `QA: ${step.inputLabel || step.inputName || 'Sample Answer'}`;
            }
          }
          newMessages.push({
            id: step.id + 0.5,
            type: 'userResponseDisplay',
            senderType: 'user',
            content: String(qaValue),
            isComplete: true,
            dependsOn: currentStepIdForDependency,
          });
          currentStepIdForDependency = step.id + 0.5;
        }
      });
      setChatMessages(newMessages);
      return;
    }
    let firstUncompletedInputFound = false;
    let nextFocusTargetSet = false;
    const newMessages: OnboardingStep[] = [];
    for (let i = 0; i < onboardingSteps.length; i++) {
      const step = onboardingSteps[i];
      if (step.dependsOn) {
        const dependentStep = onboardingSteps.find(s => s.id === step.dependsOn);
        if (dependentStep && !dependentStep.isComplete && step.type !== 'workerCard') { // Worker cards can show even if prev input not done
          break;
        }
        if (step.type === 'workerCard' && dependentStep && !newMessages.some(nm => nm.id === dependentStep.id)) {
          break;
        }
      }
      newMessages.push({ ...step, value: formData[step.inputName || ''] });
      if ((step.type === 'userInput' || step.type === 'fileUpload' || step.type === 'datePicker') && !step.isComplete && !firstUncompletedInputFound) {
        firstUncompletedInputFound = true;
        if (!currentFocusedInputName && !nextFocusTargetSet) {
          setCurrentFocusedInputName(step.inputName || null);
          nextFocusTargetSet = true;
        }
      }
      if ((step.type === 'userInput' || step.type === 'fileUpload' || step.type === 'datePicker') && !step.isComplete) {
        break;
      }
    }
    setChatMessages(newMessages);
  }, [onboardingSteps, formData, isQA]);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
    if (!isQA && currentFocusedInputName) {
      const inputElement = document.querySelector(`[name="${currentFocusedInputName}"]`) as HTMLElement;
      inputElement?.focus();
    }
  }, [chatMessages, currentFocusedInputName, isQA]);

  const handleInputChange = (name: string, value: any) => {
    if (isQA) return; // Disable editing in QA mode
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleInputSubmit = (stepId: number, inputName: string) => {
    if (isQA) return; // Disable submission in QA mode
    if (formData[inputName] === undefined || formData[inputName] === '') {
        const stepBeingSubmitted = onboardingSteps.find(s => s.id === stepId);
        if (stepBeingSubmitted?.inputType !== 'file' && stepBeingSubmitted?.inputType !== 'date') {
            return;
        }
    }
    const stepIndex = onboardingSteps.findIndex(s => s.id === stepId);
    if (stepIndex !== -1) {
      const updatedSteps = [...onboardingSteps];
      updatedSteps[stepIndex].isComplete = true;
      if (formData[inputName] !== undefined && formData[inputName] !== '') {
        const userResponseStep: OnboardingStep = {
          id: Date.now(),
          type: 'userResponseDisplay',
          senderType: 'user',
          content: formData[inputName],
          dependsOn: stepId,
          isComplete: true,
        };
        let insertAtIndex = -1;
        for(let i=0; i < updatedSteps.length; i++) {
            if(updatedSteps[i].id === stepId) {
                insertAtIndex = i + 1;
                break;
            }
        }
        if(insertAtIndex !== -1) {
            updatedSteps.splice(insertAtIndex, 0, userResponseStep);
        } else {
            updatedSteps.push(userResponseStep);
        }
      }
      setOnboardingSteps(updatedSteps);
    }
    let nextFocus: string | null = null;
    const currentStepInFlowIndex = onboardingSteps.findIndex(s => s.id === stepId);
    for (let i = currentStepInFlowIndex + 1; i < onboardingSteps.length; i++) {
        const nextStepDef = onboardingSteps[i];
        if ((nextStepDef.type === 'userInput' || nextStepDef.type === 'fileUpload' || nextStepDef.type === 'datePicker') && !nextStepDef.isComplete) {
            const depStep = onboardingSteps.find(s => s.id === nextStepDef.dependsOn);
            if ((depStep && depStep.isComplete) || !nextStepDef.dependsOn) {
                nextFocus = nextStepDef.inputName || null;
                break;
            }
        }
    }
    setCurrentFocusedInputName(nextFocus);
  };

  const handleBookWorker = (name: string, price: number) => {
    if (isQA) return; // Disable booking in QA mode
    setWorkerName(name);
    setWorkerPrice(price);
    // Mark all preceding steps as complete to show final message
    const stepsToComplete = baseInitialSteps.filter(s => s.type !== 'workerCard' && s.type !== 'botMessage' && s.id < 11); // Assuming 11 is the "Here are our workers" message
    const updatedSteps = onboardingSteps.map(os => 
        stepsToComplete.find(sc => sc.id === os.id) ? { ...os, isComplete: true } : os
    );
     // Add user's "booking action" as a response if desired
    const bookingResponseStep: OnboardingStep = {
        id: Date.now(),
        type: 'userResponseDisplay',
        senderType: 'user',
        content: `Booking ${name} for £${price.toFixed(2)}...`,
        dependsOn: 11, // Depends on the message before cards
        isComplete: true,
    };
    // Find index of step 11 to insert after it
    const lastBotMessageIndex = updatedSteps.findIndex(s => s.id === 11);
    if (lastBotMessageIndex !== -1) {
        updatedSteps.splice(lastBotMessageIndex + 1, 0, bookingResponseStep);
    } else {
        updatedSteps.push(bookingResponseStep);
    }

    setOnboardingSteps(updatedSteps);
    handleFinalSubmit(); // Trigger final submission logic
    console.log(`Booking ${name} for £${price.toFixed(2)}`);
  };

  const handleFinalSubmit = async (event?: FormEvent) => {
    if (isQA) return; // Disable submission in QA mode
    if (!workerName) return; // Allow final submit in QA if a worker was "booked"
    event?.preventDefault();
    setIsSubmitting(true);
    console.log("Mock Buyer Onboarding Data:", formData, "Booked Worker:", workerName, "Price:", workerPrice);
    await new Promise(resolve => setTimeout(resolve, 1500));
    console.log("Mock submission successful!");
    
    const contentMessage = workerName && workerPrice
        ? `Great! ${workerName} is booked for £${workerPrice.toFixed(2)}. We've applied your discount. (Mocked)`
        : "Thanks! Your request is being processed (Mocked).";

    const successMessageStep: OnboardingStep = {
        id: Date.now() + 1,
        type: 'botMessage',
        content: contentMessage,
    };
    
    const allBaseStepsNowComplete = onboardingSteps.map(bs => ({...bs, isComplete: true}));
    const finalOnboardingState = [...allBaseStepsNowComplete, successMessageStep];
    
    const finalChatMessages: OnboardingStep[] = [];
    let lastIdForDep = 0;
    finalOnboardingState.forEach(step => {
        finalChatMessages.push({...step, dependsOn: lastIdForDep});
        lastIdForDep = step.id;
        if(step.inputName && formData[step.inputName] && step.type !== 'botMessage' && step.type !== 'userResponseDisplay' && step.type !== 'workerCard'){
            finalChatMessages.push({
                id: step.id + 0.5,
                type: 'userResponseDisplay',
                senderType: 'user',
                content: String(formData[step.inputName]),
                isComplete: true,
                dependsOn: step.id,
            });
            lastIdForDep = step.id + 0.5;
        } else if (step.type === 'workerCard' && step.workerData) {
            // Worker card is already in finalOnboardingState, no separate user response for it
        }
    });
    setChatMessages(finalChatMessages);
    setOnboardingSteps(finalOnboardingState);
    setIsSubmitting(false);
  };

  const allInteractiveStepsComplete = useMemo(() => {
    if (isQA) return true;
    const interactiveSteps = onboardingSteps.filter(step =>
      step.type !== 'userResponseDisplay' &&
      step.type !== 'botMessage' &&
      step.type !== 'workerCard' && // Worker cards are not "inputs" for completion
      (step.type === 'userInput' || step.type === 'fileUpload' || step.type === 'datePicker' || step.type === 'discountCode')
    );
    return interactiveSteps.every(step => step.isComplete);
  }, [onboardingSteps, isQA]);

  if (loadingAuth) {
    return <Loader />;
  }

  return (
    <>
      {isQA && (
        <div style={{ background: 'rgba(255,220,220,0.8)', borderBottom: '1px solid rgba(200,0,0,0.3)', color: '#8B0000', textAlign: 'center', padding: '8px 5px', fontSize: '0.85em', fontWeight: '500' }}>
          QA Mode: Full Chat Preview
        </div>
      )}
      <ChatBotLayout ref={chatContainerRef} onScroll={(e: React.UIEvent<HTMLDivElement>) => { }} tag='Looking for an experienced bartender' className={pageStyles.container}>
        {chatMessages.map((step) => {
          const key = `step-${step.id}-${step.senderType || step.type}-${step.inputName || Math.random()}`;

          if (step.type === 'botMessage') {
            return <MessageBubble key={key} text={step.content as string} senderType="bot" />;
          }
          if (step.type === 'userResponseDisplay' && step.senderType === 'user') {
            return <MessageBubble key={key} text={step.content as string} senderType="user" showAvatar={false} />;
          }
          if (step.type === 'discountCode') { // Render discount code as a specific message bubble or styled text
            return <MessageBubble key={key} text={step.content as string} senderType="user" showAvatar={false} />; // Example: user "says" their discount code
          }
          if (step.type === 'workerCard' && step.workerData) {
            return <WorkerCard key={key} worker={step.workerData} onBook={isQA ? (() => {}) : handleBookWorker} />;
          }

          if ((step.type === 'userInput' || step.type === 'fileUpload' || step.type === 'datePicker') && !step.isComplete && !isQA) {
            const commonProps = {
              id: step.inputName,
              name: step.inputName,
              label: step.inputLabel,
              value: formData[step.inputName!] || '',
              disabled: isSubmitting || isQA,
              onFocus: () => setCurrentFocusedInputName(step.inputName || null),
              onBlur: () => {
                if (formData[step.inputName!] || step.inputType === 'date' || step.inputType === 'file') {
                  handleInputSubmit(step.id, step.inputName!);
                }
              },
              onKeyPress: (e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
                if (e.key === 'Enter' && (step.inputType === 'text' || step.inputType === 'email' || step.inputType === 'number')) {
                  e.preventDefault();
                  handleInputSubmit(step.id, step.inputName!);
                }
              }
            };

            if (step.inputType === 'textarea') {
              return <TextAreaBubble key={key} {...commonProps} placeholder={step.inputPlaceholder} rows={3} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleInputChange(step.inputName!, e.target.value)} ref={(el: HTMLTextAreaElement | null) => { if (el && currentFocusedInputName === step.inputName) el.focus(); }} />;
            }
            if (step.inputType === 'text' || step.inputType === 'email' || step.inputType === 'number' || step.inputType === 'date') {
              return <InputBubble key={key} {...commonProps} type={step.inputType} placeholder={step.inputPlaceholder} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange(step.inputName!, e.target.value)} ref={(el: HTMLInputElement | null) => { if (el && currentFocusedInputName === step.inputName) el.focus(); }} />;
            }
          }
          return null;
        })}
        {isSubmitting && !isQA && (
          <MessageBubble key="submitting-msg" text="Processing..." senderType="bot" />
        )}
      </ChatBotLayout>
    </>
  );
}