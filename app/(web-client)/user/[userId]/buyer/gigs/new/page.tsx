"use client";

import React, { useState, useEffect, useRef, FormEvent, useMemo } from "react";
import { useRouter } from "next/navigation";

import ChatBotLayout from "@/app/components/onboarding/ChatBotLayout";
import MessageBubble from "@/app/components/onboarding/MessageBubble";
import InputBubble from "@/app/components/onboarding/InputBubble"; // Corrected path
import TextAreaBubble from "@/app/components/onboarding/TextAreaBubble"; // Corrected path
// import FileUploadBubble from '@/app/components/onboarding/FileUploadBubble'; // Corrected path - Uncomment if used
import WorkerCard, { WorkerData } from "@/app/components/onboarding/WorkerCard"; // Import shared WorkerCard and WorkerData

import Loader from "@/app/components/shared/Loader";

import pageStyles from "./page.module.css";
import { useAuth } from "@/context/AuthContext";
import { StepInputConfig } from "@/app/types/form";

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
  inputConfig?: StepInputConfig;    // Configuration for input fields if the step type involves input
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

export default function OnboardBuyerPage() {
  const router = useRouter();
  const { user } = useAuth();
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const isQA = user?.claims.role === "QA";

  const [onboardingSteps, setOnboardingSteps] = useState<OnboardingStep[]>(
    baseInitialSteps.map((s) => ({ ...s, isComplete: false }))
  );
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [chatMessages, setChatMessages] = useState<OnboardingStep[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentFocusedInputName, setCurrentFocusedInputName] = useState<
    string | null
  >(null);
  const [workerName, setWorkerName] = useState<string | null>(null); // Added state
  const [workerPrice, setWorkerPrice] = useState<number | null>(null); // Added state

  // QA mode: fill formData and steps with mock data if isQA
  useEffect(() => {
    if (isQA) {
      const qaFormData: Record<string, any> = {};
      baseInitialSteps.forEach((step) => {
        if (step.inputConfig?.name) { // Check if inputConfig and its name exist
          const inputConf = step.inputConfig; // Safe to use after check
          switch (inputConf.type) {
            case "file":
              qaFormData[inputConf.name] = `sample-${inputConf.name}.pdf`;
              break;
            case "date":
              qaFormData[inputConf.name] = new Date()
                .toISOString()
                .split("T")[0];
              break;
            case "number":
              qaFormData[inputConf.name] = 15;
              break;
            default: // text, textarea, email etc.
              qaFormData[inputConf.name] = `QA: ${
                inputConf.label || inputConf.name || "Sample"
              }`;
          }
        }
      });
      setFormData(qaFormData);
      setOnboardingSteps(
        baseInitialSteps.map((s) => ({ ...s, isComplete: true }))
      );
    } else {
      setOnboardingSteps(
        baseInitialSteps.map((s) => ({ ...s, isComplete: false }))
      );
      setFormData({});
    }
  }, [isQA]);

  useEffect(() => {
    if (isQA) {
      // QA mode: show all steps and user responses as complete
      const newMessages: OnboardingStep[] = [];
      let currentStepIdForDependency = 0;
      baseInitialSteps.forEach((step) => {
        const messageToAdd = {
          ...step,
          content: step.content,
          isComplete: true,
          dependsOn: currentStepIdForDependency,
        };
        newMessages.push(messageToAdd);
        currentStepIdForDependency = step.id;
        if (
          step.inputConfig?.name && // Check if inputConfig and its name exist
          (step.type === "userInput" ||
            step.type === "fileUpload" ||
            step.type === "datePicker" ||
            step.type === "terms") // "terms" might not have inputConfig, needs review if it's an input type
        ) {
          const inputConf = step.inputConfig; // Safe to use after check
          let qaValue = formData[inputConf.name];
          if (qaValue === undefined) {
            switch (inputConf.type) {
              case "file":
                qaValue = `sample-${inputConf.name}.pdf`;
                break;
              case "date":
                qaValue = new Date().toISOString().split("T")[0];
                break;
              case "number":
                qaValue = 15;
                break;
              default: // text, textarea, email etc.
                qaValue = `QA: ${
                  inputConf.label || inputConf.name || "Sample Answer"
                }`;
            }
          }
          newMessages.push({
            id: step.id + 0.5,
            type: "userResponseDisplay",
            senderType: "user",
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
        const dependentStep = onboardingSteps.find(
          (s) => s.id === step.dependsOn
        );
        if (
          dependentStep &&
          !dependentStep.isComplete &&
          step.type !== "workerCard"
        ) {
          // Worker cards can show even if prev input not done
          break;
        }
        if (
          step.type === "workerCard" &&
          dependentStep &&
          !newMessages.some((nm) => nm.id === dependentStep.id)
        ) {
          break;
        }
      }
      newMessages.push({ ...step, value: formData[step.inputConfig?.name || ""] });
      if (
        (step.type === "userInput" ||
          step.type === "fileUpload" ||
          step.type === "datePicker") &&
        !step.isComplete &&
        !firstUncompletedInputFound
      ) {
        firstUncompletedInputFound = true;
        if (!currentFocusedInputName && !nextFocusTargetSet) {
          setCurrentFocusedInputName(step.inputConfig?.name || null);
          nextFocusTargetSet = true;
        }
      }
      if (
        (step.type === "userInput" ||
          step.type === "fileUpload" ||
          step.type === "datePicker") &&
        !step.isComplete
      ) {
        break;
      }
    }
    setChatMessages(newMessages);
  }, [onboardingSteps, formData, isQA]);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
    if (!isQA && currentFocusedInputName) {
      const inputElement = document.querySelector(
        `[name="${currentFocusedInputName}"]`
      ) as HTMLElement;
      inputElement?.focus();
    }
  }, [chatMessages, currentFocusedInputName, isQA]);

  const handleInputChange = (name: string, value: any) => {
    if (isQA) return; // Disable editing in QA mode
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleInputSubmit = (stepId: number, inputName: string) => {
    if (isQA) return; // Disable submission in QA mode
    if (formData[inputName] === undefined || formData[inputName] === "") {
      const stepBeingSubmitted = onboardingSteps.find((s) => s.id === stepId);
      if (
        stepBeingSubmitted?.inputConfig?.type !== "file" &&
        stepBeingSubmitted?.inputConfig?.type !== "date"
      ) {
        return;
      }
    }
    const stepIndex = onboardingSteps.findIndex((s) => s.id === stepId);
    if (stepIndex !== -1) {
      const updatedSteps = [...onboardingSteps];
      updatedSteps[stepIndex].isComplete = true;
      if (formData[inputName] !== undefined && formData[inputName] !== "") {
        const userResponseStep: OnboardingStep = {
          id: Date.now(),
          type: "userResponseDisplay",
          senderType: "user",
          content: formData[inputName],
          dependsOn: stepId,
          isComplete: true,
        };
        let insertAtIndex = -1;
        for (let i = 0; i < updatedSteps.length; i++) {
          if (updatedSteps[i].id === stepId) {
            insertAtIndex = i + 1;
            break;
          }
        }
        if (insertAtIndex !== -1) {
          updatedSteps.splice(insertAtIndex, 0, userResponseStep);
        } else {
          updatedSteps.push(userResponseStep);
        }
      }
      setOnboardingSteps(updatedSteps);
    }
    let nextFocus: string | null = null;
    const currentStepInFlowIndex = onboardingSteps.findIndex(
      (s) => s.id === stepId
    );
    for (let i = currentStepInFlowIndex + 1; i < onboardingSteps.length; i++) {
      const nextStepDef = onboardingSteps[i];
      if (
        (nextStepDef.type === "userInput" ||
          nextStepDef.type === "fileUpload" ||
          nextStepDef.type === "datePicker") &&
        !nextStepDef.isComplete
      ) {
        const depStep = onboardingSteps.find(
          (s) => s.id === nextStepDef.dependsOn
        );
        if ((depStep && depStep.isComplete) || !nextStepDef.dependsOn) {
          nextFocus = nextStepDef.inputConfig?.name || null;
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
    const stepsToComplete = baseInitialSteps.filter(
      (s) => s.type !== "workerCard" && s.type !== "botMessage" && s.id < 11
    ); // Assuming 11 is the "Here are our workers" message
    const updatedSteps = onboardingSteps.map((os) =>
      stepsToComplete.find((sc) => sc.id === os.id)
        ? { ...os, isComplete: true }
        : os
    );
    // Add user's "booking action" as a response if desired
    const bookingResponseStep: OnboardingStep = {
      id: Date.now(),
      type: "userResponseDisplay",
      senderType: "user",
      content: `Booking ${name} for £${price.toFixed(2)}...`,
      dependsOn: 11, // Depends on the message before cards
      isComplete: true,
    };
    // Find index of step 11 to insert after it
    const lastBotMessageIndex = updatedSteps.findIndex((s) => s.id === 11);
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
    console.log(
      "Mock Buyer Onboarding Data:",
      formData,
      "Booked Worker:",
      workerName,
      "Price:",
      workerPrice
    );
    await new Promise((resolve) => setTimeout(resolve, 1500));
    console.log("Mock submission successful!");

    const contentMessage =
      workerName && workerPrice
        ? `Great! ${workerName} is booked for £${workerPrice.toFixed(
            2
          )}. We've applied your discount. (Mocked)`
        : "Thanks! Your request is being processed (Mocked).";

    const successMessageStep: OnboardingStep = {
      id: Date.now() + 1,
      type: "botMessage",
      content: contentMessage,
    };

    const allBaseStepsNowComplete = onboardingSteps.map((bs) => ({
      ...bs,
      isComplete: true,
    }));
    const finalOnboardingState = [
      ...allBaseStepsNowComplete,
      successMessageStep,
    ];

    const finalChatMessages: OnboardingStep[] = [];
    let lastIdForDep = 0;
    finalOnboardingState.forEach((step) => {
      finalChatMessages.push({ ...step, dependsOn: lastIdForDep });
      lastIdForDep = step.id;
      if (
        step.inputConfig?.name && // Check if inputConfig and its name exist
        formData[step.inputConfig.name] && // Access formData using config.name
        step.type !== "botMessage" &&
        step.type !== "userResponseDisplay" &&
        step.type !== "workerCard"
      ) {
        finalChatMessages.push({
          id: step.id + 0.5,
          type: "userResponseDisplay",
          senderType: "user",
          content: String(formData[step.inputConfig.name]), // Use config.name
          isComplete: true,
          dependsOn: step.id,
        });
        lastIdForDep = step.id + 0.5;
      } else if (step.type === "workerCard" && step.workerData) {
        // Worker card is already in finalOnboardingState, no separate user response for it
      }
    });
    setChatMessages(finalChatMessages);
    setOnboardingSteps(finalOnboardingState);
    setIsSubmitting(false);
  };

  const allInteractiveStepsComplete = useMemo(() => {
    if (isQA) return true;
    const interactiveSteps = onboardingSteps.filter(
      (step) =>
        step.type !== "userResponseDisplay" &&
        step.type !== "botMessage" &&
        step.type !== "workerCard" && // Worker cards are not "inputs" for completion
        (step.type === "userInput" ||
          step.type === "fileUpload" ||
          step.type === "datePicker" ||
          step.type === "discountCode")
    );
    return interactiveSteps.every((step) => step.isComplete);
  }, [onboardingSteps, isQA]);

  const handleHomeClick = () => {
    if (isSubmitting) return; // Prevent home click while submitting
    if (!allInteractiveStepsComplete) {
      alert("Please complete all steps before going home.");
      return;
    }
    router.push(`/user/${user?.uid || "this_user"}/buyer`); // Redirect to buyer home
  };

  if (!user) {
    return <Loader />;
  }

  return (
    <>
      {isQA && (
        <div
          style={{
            background: "rgba(255,220,220,0.8)",
            borderBottom: "1px solid rgba(200,0,0,0.3)",
            color: "#8B0000",
            textAlign: "center",
            padding: "8px 5px",
            fontSize: "0.85em",
            fontWeight: "500",
          }}
        >
          QA Mode: Full Chat Preview
        </div>
      )}
      <ChatBotLayout
        ref={chatContainerRef}
        onScroll={() => {}}
        onHomeClick={handleHomeClick}
        className={pageStyles.container}
      >
        {chatMessages.map((step) => {
          const key = `step-${step.id}-${step.senderType || step.type}-${
            step.inputConfig?.name || Math.random()
          }`;

          if (step.type === "botMessage") {
            return (
              <MessageBubble
                key={key}
                text={step.content as string}
                senderType="bot"
              />
            );
          }
          if (
            step.type === "userResponseDisplay" &&
            step.senderType === "user"
          ) {
            return (
              <MessageBubble
                key={key}
                text={step.content as string}
                senderType="user"
                showAvatar={false}
              />
            );
          }
          if (step.type === "discountCode") {
            // Render discount code as a specific message bubble or styled text
            return (
              <MessageBubble
                key={key}
                text={step.content as string}
                senderType="user"
                showAvatar={false}
              />
            ); // Example: user "says" their discount code
          }
          if (step.type === "workerCard" && step.workerData) {
            return (
              <WorkerCard
                key={key}
                worker={step.workerData}
                onBook={isQA ? () => {} : handleBookWorker}
              />
            );
          }

          if (
            (step.type === "userInput" ||
              step.type === "fileUpload" ||
              step.type === "datePicker") &&
            step.inputConfig && // Ensure inputConfig exists
            !step.isComplete &&
            !isQA
          ) {
            const inputConf = step.inputConfig;
            const commonProps = {
              id: inputConf.name,
              name: inputConf.name,
              label: inputConf.label,
              value: formData[inputConf.name] || "",
              disabled: isSubmitting || isQA,
              onFocus: () => setCurrentFocusedInputName(inputConf.name || null),
              onBlur: () => {
                if (
                  formData[inputConf.name] ||
                  inputConf.type === "date" || // Check against inputConfig.type
                  inputConf.type === "file"
                ) {
                  handleInputSubmit(step.id, inputConf.name);
                }
              },
              onKeyPress: (
                e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>
              ) => {
                if (
                  e.key === "Enter" &&
                  (inputConf.type === "text" ||
                    inputConf.type === "email" ||
                    inputConf.type === "number")
                ) {
                  e.preventDefault();
                  handleInputSubmit(step.id, inputConf.name);
                }
              },
            };

            if (inputConf.type === "textarea") {
              return (
                <TextAreaBubble
                  key={key}
                  {...commonProps}
                  placeholder={inputConf.placeholder}
                  rows={inputConf.rows || 3} // Use configured rows or default
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    handleInputChange(inputConf.name, e.target.value)
                  }
                  ref={(el: HTMLTextAreaElement | null) => {
                    if (el && currentFocusedInputName === inputConf.name)
                      el.focus();
                  }}
                />
              );
            }
            // Handle text, email, number, date inputs
            if (
              inputConf.type === "text" ||
              inputConf.type === "email" ||
              inputConf.type === "number" ||
              inputConf.type === "date"
            ) {
              return (
                <InputBubble
                  key={key}
                  {...commonProps}
                  type={inputConf.type}
                  placeholder={inputConf.placeholder}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    handleInputChange(inputConf.name, e.target.value)
                  }
                  ref={(el: HTMLInputElement | null) => {
                    if (el && currentFocusedInputName === inputConf.name)
                      el.focus();
                  }}
                />
              );
            }
            // Potentially add a case for inputConf.type === "file" here if FileUploadBubble is used
            // For example:
            // if (inputConf.type === "file") {
            //   return (
            //     <FileUploadBubble
            //       key={key}
            //       {...commonProps} // May need adjustments for file specific props
            //       label={inputConf.label || "Upload File"} // or step.fileLabel if that was distinct
            //       multiple={inputConf.multiple || false}
            //       onChange={(e) => handleInputChange(inputConf.name, e.target.files)}
            //       ref={(el) => { /* ref logic */ }}
            //     />
            //   );
            // }
          }
          return null;
        })}
        {isSubmitting && !isQA && (
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
