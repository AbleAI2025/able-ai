"use client";

import React, { useState, useEffect, useRef, FormEvent } from 'react';

import ChatBotLayout from '@/app/components/onboarding/ChatBotLayout'; // Corrected path
import MessageBubble from '@/app/components/onboarding/MessageBubble'; // Corrected path
// import InputBubble from '@/app/components/onboarding/InputBubble'; // Corrected path
// import TextAreaBubble from '@/app/components/onboarding/TextAreaBubble'; // Corrected path
// import FileUploadBubble from '@/app/components/onboarding/FileUploadBubble'; // Corrected path - Uncomment if used
import WorkerCard from '@/app/components/onboarding/WorkerCard'; // Import shared WorkerCard and WorkerData

import pageStyles from './OnboardWorkerPage.module.css';

import baseInitialSteps from './initialSteps';
import { OnboardingStep } from './OnboardingSteps';
import StripeLinkBubble from '@/app/components/onboarding/StripeLinkBubble';
import CalendarPickerBubble from '@/app/components/onboarding/CalendarPickerBubble';
import VideoRecorderBubble from '@/app/components/onboarding/VideoRecorderBubble';
import ShareLinkBubble from '@/app/components/onboarding/ShareLinkBubble';
import { useAuth } from '@/context/AuthContext';
import { setLastRoleUsed } from '@/lib/last-role-used';


export default function OnboardWorkerPage() {
  const { user, loading: loadingAuth } = useAuth();
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const [onboardingSteps, setOnboardingSteps] = useState<OnboardingStep[]>(baseInitialSteps.map(s => ({...s, isComplete: false})));
  const [formData, setFormData] = useState<Record<string, string | number | Date | File | null>>({});
  const [chatMessages, setChatMessages] = useState<OnboardingStep[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentFocusedInputName, setCurrentFocusedInputName] = useState<string | null>(null);
  const [workerName, setWorkerName] = useState<string | null>(null); // Added state
  const [workerPrice, setWorkerPrice] = useState<number | null>(null); // Added state

  useEffect(() => {
    if (user?.claims.role === "QA") {
      const qaFormData: Record<string, string | number | Date | File | null> = {};
      baseInitialSteps.forEach(step => {
        if (step.inputConfig?.name) {
          switch (step.inputConfig.type) {
            case 'file': qaFormData[step.inputConfig.name] = `sample-${step.inputConfig.name}.pdf`; break;
            case 'date': qaFormData[step.inputConfig.name] = new Date().toISOString().split('T')[0]; break;
            default: qaFormData[step.inputConfig.name] = `QA: ${step.inputConfig.label || step.inputConfig.name || 'Sample'}`;
          }
        }
      });
      setFormData(qaFormData);
    } else {
      setOnboardingSteps(baseInitialSteps.map(s => ({...s, isComplete: false})));
      setFormData({});
    }
    setLastRoleUsed('GIG_WORKER'); // Set last role used to GIG_WORKER
  }, [user?.claims.role]);

  useEffect(() => {
    const newMessages: OnboardingStep[] = [];
    if (user?.claims.role === "QA") {
      let currentStepIdForDependency = 0;
      baseInitialSteps.forEach(step => {
        const messageToAdd = { ...step, content: step.content, isComplete: true, dependsOn: currentStepIdForDependency };
        newMessages.push(messageToAdd);
        currentStepIdForDependency = step.id;

        if (step.inputConfig?.name && (step.type === 'userInput' || step.type === 'fileUpload' || step.type === 'datePicker')) {
          let qaValue = formData[step.inputConfig.name];
          if (qaValue === undefined) {
             switch (step.inputConfig.type) {
                case 'file': qaValue = `sample-${step.inputConfig.name}.pdf`; break;
                case 'date': qaValue = new Date().toISOString().split('T')[0]; break;
                default: qaValue = `QA: ${step.inputConfig.label || step.inputConfig.name || 'Sample Answer'}`;
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
        } else if (step.type === 'workerCard') { // For QA mode, worker cards are just part of the flow
            // No user response display needed for worker cards in QA
        }
      });
    } else {
      let firstUncompletedInputFound = false;
      let nextFocusTargetSet = false;
      for (let i = 0; i < onboardingSteps.length; i++) {
        const step = onboardingSteps[i];
        if (step.dependsOn) {
          const dependentStep = onboardingSteps.find(s => s.id === step.dependsOn);
          if (dependentStep && !dependentStep.isComplete && step.type !== 'workerCard') { // Worker cards can show even if prev input not done
            break;
          }
           // Allow worker cards to show if their direct dependency (bot message) is shown
          if (step.type === 'workerCard' && dependentStep && !newMessages.some(nm => nm.id === dependentStep.id)) {
            break;
          }
        }
        newMessages.push({ ...step, value: formData[step.inputConfig?.name || ''] });

        if ((step.type === 'userInput' || step.type === 'fileUpload' || step.type === 'datePicker') && !step.isComplete && !firstUncompletedInputFound) {
          firstUncompletedInputFound = true;
          if (!currentFocusedInputName && !nextFocusTargetSet) {
            setCurrentFocusedInputName(step.inputConfig?.name || null);
            nextFocusTargetSet = true;
          }
        }
        if ((step.type === 'userInput' || step.type === 'fileUpload' || step.type === 'datePicker') && !step.isComplete) {
          break;
        }
      }
    }
    setChatMessages(newMessages);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onboardingSteps, user?.claims.role, currentFocusedInputName]);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
    if (user?.claims.role !== "QA" && currentFocusedInputName) {
        const inputElement = document.querySelector(`[name="${currentFocusedInputName}"]`) as HTMLElement;
        inputElement?.focus();
    }
  }, [chatMessages, currentFocusedInputName, user?.claims.role]);

  // const handleInputChange = (name: string, value: any) => {
  //   if (user?.isQA) return;
  //   setFormData(prev => ({ ...prev, [name]: value }));
  // };

  // const handleInputSubmit = (stepId: number, inputName: string) => {
  //   if (user?.isQA) return;
  //   if (formData[inputName] === undefined || formData[inputName] === '') {
  //       const stepBeingSubmitted = onboardingSteps.find(s => s.id === stepId);
  //       if (stepBeingSubmitted?.inputType !== 'file' && stepBeingSubmitted?.inputType !== 'date') {
  //           return;
  //       }
  //   }
  //
  //   const stepIndex = onboardingSteps.findIndex(s => s.id === stepId);
  //   if (stepIndex !== -1) {
  //     const updatedSteps = [...onboardingSteps];
  //     updatedSteps[stepIndex].isComplete = true;
  //
  //     if (formData[inputName] !== undefined && formData[inputName] !== '') {
  //       const userResponseStep: OnboardingStep = {
  //         id: Date.now(),
  //         type: 'userResponseDisplay',
  //         senderType: 'user',
  //         content: formData[inputName],
  //         dependsOn: stepId,
  //         isComplete: true,
  //       };
  //       let insertAtIndex = -1;
  //       for(let i=0; i < updatedSteps.length; i++) {
  //           if(updatedSteps[i].id === stepId) {
  //               insertAtIndex = i + 1;
  //               break;
  //           }
  //       }
  //       if(insertAtIndex !== -1) {
  //           updatedSteps.splice(insertAtIndex, 0, userResponseStep);
  //       } else {
  //           updatedSteps.push(userResponseStep);
  //       }
  //     }
  //     setOnboardingSteps(updatedSteps);
  //   }
  //   let nextFocus: string | null = null;
  //   const currentStepInFlowIndex = onboardingSteps.findIndex(s => s.id === stepId);
  //   for (let i = currentStepInFlowIndex + 1; i < onboardingSteps.length; i++) {
  //       const nextStepDef = onboardingSteps[i];
  //       if ((nextStepDef.type === 'userInput' || nextStepDef.type === 'fileUpload' || nextStepDef.type === 'datePicker') && !nextStepDef.isComplete) {
  //           const depStep = onboardingSteps.find(s => s.id === nextStepDef.dependsOn);
  //           if ((depStep && depStep.isComplete) || !nextStepDef.dependsOn) {
  //               nextFocus = nextStepDef.inputConfig?.name || null;
  //               break;
  //           }
  //       }
  //   }
  //   setCurrentFocusedInputName(nextFocus);
  // };

  const handleBookWorker = (name: string, price: number) => {
    if (user?.claims.role === "QA") return;
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
    if (user?.claims.role === "QA" && !workerName) return; // Allow final submit in QA if a worker was "booked"
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
        if(step.inputConfig?.name && formData[step.inputConfig.name] && step.type !== 'botMessage' && step.type !== 'userResponseDisplay' && step.type !== 'workerCard'){
            finalChatMessages.push({
                id: step.id + 0.5,
                type: 'userResponseDisplay',
                senderType: 'user',
                content: String(formData[step.inputConfig.name]),
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



  const handleCalendarChange = (date: Date | null) => {
    console.log("Selected date:", date);
  }

  if (loadingAuth) {
    return <div className={pageStyles.loadingContainer}><p>Loading authentication...</p></div>;
  }

  return (
    <ChatBotLayout ref={chatContainerRef} onScroll={() => {}} >
      {/* {isViewQA && (
        <div style={{ background: 'rgba(255,220,220,0.8)', borderBottom: '1px solid rgba(200,0,0,0.3)', color: '#8B0000', textAlign: 'center', padding: '8px 5px', fontSize: '0.85em', fontWeight: '500' }}>
          QA Mode: Full Chat Preview
        </div>
      )} */}
      {chatMessages.map((step) => {
        const key = `step-${step.id}-${step.senderType || step.type}-${step.inputConfig?.name || Math.random()}`;

        if (step.type === 'botMessage') {
          if (step.value) {
            return (
              <div key={key} className={pageStyles.botMessageContainer}>
                <MessageBubble text={step.content as string} senderType="bot" />
                <StripeLinkBubble label='LINK TO STRIPE' stripeLink={step.value as string} />
              </div>
            );
          }
          return <MessageBubble key={key} text={step.content as string} senderType="bot" />;
        }
        if (step.type === 'userResponseDisplay' && step.senderType === 'user') {
             return <MessageBubble key={key} text={step.content as string} senderType="user" showAvatar={false} />;
        }
        if (step.type === 'discountCode') { // Render discount code as a specific message bubble or styled text
            return <MessageBubble key={key} text={step.content as string} senderType="user" showAvatar={false} />; // Example: user "says" their discount code
        }
        if (step.type === 'workerCard' && step.workerData) {
            return <WorkerCard key={key} worker={step.workerData} onBook={handleBookWorker} />;
        }

        if (step.type === 'datePicker') {
          return (
           <CalendarPickerBubble onChange={handleCalendarChange} key={key} />
          );
        }

        if (step.type === 'recordVideo') {
          return <VideoRecorderBubble key={key} />;
        }

        if(step.type === 'shareLink') {
          return <ShareLinkBubble key={key} linkText='Send this link to get your reference' linkUrl='https://'/>;
        }

        // if (!isViewQA && (step.type === 'userInput' || step.type === 'fileUpload' || step.type === 'datePicker') && !step.isComplete) {
        //   const commonProps = {
        //     id: step.inputConfig.name,
        //     name: step.inputConfig.name,
        //     label: step.inputConfig.label,
        //     value: formData[step.inputConfig.name!] || '',
        //     disabled: isSubmitting,
        //     onFocus: () => setCurrentFocusedInputName(step.inputConfig.name || null),
        //     onBlur: () => {
        //         if(formData[step.inputConfig.name!] || step.inputConfig.type === 'date' || step.inputConfig.type === 'file'){
        //             handleInputSubmit(step.id, step.inputConfig.name!);
        //         }
        //     },
        //     onKeyPress: (e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        //       if (e.key === 'Enter' && (step.inputConfig.type === 'text' || step.inputConfig.type === 'email' || step.inputConfig.type === 'number')) {
        //         e.preventDefault();
        //         handleInputSubmit(step.id, step.inputConfig.name!);
        //       }
        //     }
        //   };

        //   if (step.inputConfig.type === 'textarea') {
        //     return <TextAreaBubble key={key} {...commonProps} placeholder={step.inputConfig.placeholder} rows={3} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleInputChange(step.inputConfig.name!, e.target.value)} ref={(el: HTMLTextAreaElement | null) => { if (el && currentFocusedInputName === step.inputConfig.name) el.focus(); }}/>;
        //   }
        //   // FileUploadBubble rendering was removed in user's provided code, add back if needed
        //   // if (step.inputConfig.type === 'file') { ... }
        //   if (step.inputConfig.type === 'text' || step.inputConfig.type === 'email' || step.inputConfig.type === 'number' || step.inputConfig.type === 'date') {
        //     return <InputBubble key={key} {...commonProps} type={step.inputConfig.type} placeholder={step.inputConfig.placeholder} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange(step.inputConfig.name!, e.target.value)} ref={(el: HTMLInputElement | null) => { if (el && currentFocusedInputName === step.inputConfig.name) el.focus(); }}/>;
        //   }
        // }
        return null;
      })}

      {/* Removed the generic "Confirm & Proceed" button as booking is per card now */}
      {/* {allInteractiveStepsComplete && !isSubmitting && !isViewQA && onboardingSteps[onboardingSteps.length-1]?.type !== 'botMessage' && ( ... )} */}

       {isSubmitting && user?.claims.role !== "QA" && (
         <MessageBubble key="submitting-msg" text="Processing..." senderType="bot" />
      )}
       {/* <input
        type="text"
        placeholder="Type your message..."
        onKeyPress={(e) => {
          if (e.key === 'Enter') {
            const target = e.target as HTMLInputElement;
            if (isViewQA) {
              console.log('QA Mode Message:', target.value);
            } else {
              // TODO: Send message to backend
              console.log('Send message to backend:', target.value);
            }
            target.value = '';
          }
        }}
        style={{
          width: '100%',
          padding: '10px',
          border: '1px solid #ccc',
          borderRadius: '5px',
          marginTop: '10px',
        }}
      /> */}
      
    </ChatBotLayout>
  );
}