// Able AI Prompt Templates
// Reusable prompt templates for common interactions

export const PROMPT_TEMPLATES = {
  welcome: {
    onboarding: "Welcome to Able AI! I'm your Gigfolio Coach, here to guide you through creating an amazing worker profile. Let's start by understanding your background and goals.",
    gigCreation: "Hello! I'm your Shift Concierge, ready to help you create and manage successful gigs. Let's start by understanding your event needs and requirements.",
    support: "Welcome to Able AI Support! I'm here to help you with any questions or issues. How can I assist you today?"
  },
  
  guidance: {
    nextStep: "Great progress! Here's what we'll work on next: {nextStep}",
    encouragement: "You're doing excellent work! {encouragement}",
    clarification: "Let me clarify that for you: {clarification}",
    recommendation: "Based on your situation, I recommend: {recommendation}"
  },
  
  errorHandling: {
    clarification: "I want to make sure I understand correctly. Could you clarify: {clarification}",
    alternative: "Let me suggest an alternative approach: {alternative}",
    escalation: "This requires additional attention. Let me connect you with: {escalation}"
  }
};

export const INTERACTION_TEMPLATES = {
  question: {
    clarification: "I need to understand better. Could you tell me more about: {topic}?",
    followUp: "That's helpful! Now let me ask: {followUpQuestion}",
    confirmation: "Let me confirm I understand correctly: {understanding}",
    exploration: "Let's explore this further. What aspects of {topic} would you like to discuss?"
  },
  
  guidance: {
    stepByStep: "Let's break this down into steps:\n1. {step1}\n2. {step2}\n3. {step3}",
    checklist: "Here's a checklist to help you:\n- {item1}\n- {item2}\n- {item3}",
    timeline: "Here's a suggested timeline:\n- {time1}: {action1}\n- {time2}: {action2}",
    resources: "Here are some resources to help you:\n- {resource1}: {description1}\n- {resource2}: {description2}"
  },
  
  feedback: {
    positive: "Excellent work on {achievement}! This shows {positiveQuality}.",
    constructive: "You're making good progress on {area}. To improve further, consider {suggestion}.",
    encouragement: "Keep up the great work on {activity}! You're showing real progress.",
    celebration: "Congratulations on completing {milestone}! This is a significant achievement."
  }
};

export const SCENARIO_TEMPLATES = {
  onboarding: {
    profileStart: "Let's start building your profile. First, tell me about your background in {industry}.",
    skillsAssessment: "Now let's assess your skills. What are your main areas of expertise in {category}?",
    experienceDocumentation: "Great! Now let's document your experience. How long have you been working in {field}?",
    portfolioGuidance: "Excellent! Now let's create a portfolio that showcases your {skills}."
  },
  
  gigCreation: {
    eventType: "Let's start by understanding your event. What type of event are you planning?",
    requirements: "Now let's define your requirements. What skills and experience do you need?",
    timing: "Great! Now let's discuss timing. When do you need this completed?",
    budget: "Perfect! Now let's talk about budget. What's your rate range for this type of work?"
  },
  
  support: {
    issueIdentification: "I'm here to help. Can you describe the issue you're experiencing?",
    troubleshooting: "Let me help you troubleshoot this. Have you tried {solution}?",
    escalation: "This requires additional attention. Let me connect you with our support team.",
    resolution: "Great! Let's make sure this is resolved. Can you confirm that {solution} worked?"
  }
};

export const RESPONSE_TEMPLATES = {
  confirmation: "I understand you need help with {topic}. Let me assist you with that.",
  action: "I'll help you {action}. Here's what we need to do: {steps}",
  completion: "Perfect! You've successfully {achievement}. What would you like to work on next?",
  transition: "Great progress on {currentTopic}! Now let's move on to {nextTopic}."
};
