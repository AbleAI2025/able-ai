/**
 * Escalation Detection Utility
 * Detects when AI chat interactions should be escalated to human support
 */

export interface EscalationTrigger {
  shouldEscalate: boolean;
  reason: string;
  issueType: string;
  confidence: number;
}

export interface EscalationKeywords {
  [key: string]: {
    keywords: string[];
    issueType: string;
    priority: 'high' | 'medium' | 'low';
  };
}

// Define escalation keywords and their corresponding issue types
const ESCALATION_KEYWORDS: EscalationKeywords = {
  human_support: {
    keywords: [
      'talk to human', 'speak to human', 'human support', 'real person',
      'talk to someone', 'speak to someone', 'human agent', 'live agent',
      'customer service', 'support team', 'help desk', 'service desk'
    ],
    issueType: 'general_support',
    priority: 'high'
  },
  frustration: {
    keywords: [
      'frustrated', 'angry', 'upset', 'annoyed', 'irritated', 'fed up',
      'not working', 'broken', 'useless', 'terrible', 'awful', 'horrible',
      'waste of time', 'ridiculous', 'stupid', 'idiot', 'useless'
    ],
    issueType: 'user_frustration',
    priority: 'high'
  },
  technical_issues: {
    keywords: [
      'error', 'bug', 'crash', 'broken', 'not working', 'failed',
      'technical problem', 'system error', 'app error', 'website error',
      'loading', 'slow', 'freeze', 'stuck', 'can\'t access', 'won\'t load'
    ],
    issueType: 'technical_problem',
    priority: 'medium'
  },
  payment_issues: {
    keywords: [
      'payment', 'billing', 'charge', 'refund', 'money', 'cost',
      'expensive', 'overcharged', 'wrong amount', 'didn\'t pay',
      'payment failed', 'transaction failed', 'card declined'
    ],
    issueType: 'payment_issue',
    priority: 'high'
  },
  safety_concerns: {
    keywords: [
      'unsafe', 'dangerous', 'threat', 'harassment', 'abuse',
      'inappropriate', 'scam', 'fraud', 'fake', 'suspicious'
    ],
    issueType: 'safety_concern',
    priority: 'high'
  },
  urgent_requests: {
    keywords: [
      'urgent', 'emergency', 'asap', 'immediately', 'right now',
      'critical', 'important', 'need help now', 'desperate'
    ],
    issueType: 'urgent_request',
    priority: 'high'
  }
};

/**
 * Detect escalation triggers in user input
 */
export function detectEscalationTriggers(userInput: string, context?: {
  retryCount?: number;
  conversationLength?: number;
  userRole?: string;
  gigId?: string;
}): EscalationTrigger {
  const input = userInput.toLowerCase();
  let maxConfidence = 0;
  let detectedIssueType = 'general_support';
  let detectedReason = '';

  // Check for keyword matches
  for (const [category, config] of Object.entries(ESCALATION_KEYWORDS)) {
    for (const keyword of config.keywords) {
      if (input.includes(keyword.toLowerCase())) {
        const confidence = config.priority === 'high' ? 0.9 : 0.7;
        if (confidence > maxConfidence) {
          maxConfidence = confidence;
          detectedIssueType = config.issueType;
          detectedReason = `Keyword match: "${keyword}"`;
        }
      }
    }
  }

  // Check for retry count escalation
  if (context?.retryCount && context.retryCount >= 3) {
    const retryConfidence = 0.8;
    if (retryConfidence > maxConfidence) {
      maxConfidence = retryConfidence;
      detectedIssueType = 'ai_limitation';
      detectedReason = `Multiple retries (${context.retryCount})`;
    }
  }

  // Check for conversation length escalation
  if (context?.conversationLength && context.conversationLength > 20) {
    const lengthConfidence = 0.6;
    if (lengthConfidence > maxConfidence) {
      maxConfidence = lengthConfidence;
      detectedIssueType = 'complex_issue';
      detectedReason = `Long conversation (${context.conversationLength} messages)`;
    }
  }

  // Check for explicit escalation requests
  if (input.includes('escalate') || input.includes('escalation')) {
    maxConfidence = 1.0;
    detectedIssueType = 'explicit_escalation';
    detectedReason = 'Explicit escalation request';
  }

  return {
    shouldEscalate: maxConfidence >= 0.7,
    reason: detectedReason,
    issueType: detectedIssueType,
    confidence: maxConfidence
  };
}

/**
 * Generate escalation description based on trigger
 */
export function generateEscalationDescription(
  trigger: EscalationTrigger,
  userInput: string,
  context?: {
    gigId?: string;
    userRole?: string;
    conversationLength?: number;
  }
): string {
  const baseDescription = `Escalation triggered: ${trigger.reason}`;
  
  let description = baseDescription;
  
  if (context?.gigId) {
    description += ` | Related to gig: ${context.gigId}`;
  }
  
  if (context?.userRole) {
    description += ` | User role: ${context.userRole}`;
  }
  
  if (context?.conversationLength) {
    description += ` | Conversation length: ${context.conversationLength} messages`;
  }
  
  description += ` | User input: "${userInput.substring(0, 200)}${userInput.length > 200 ? '...' : ''}"`;
  
  return description;
}

/**
 * Check if escalation should be automatic vs manual
 */
export function shouldAutoEscalate(trigger: EscalationTrigger): boolean {
  // Auto-escalate for high-confidence triggers
  if (trigger.confidence >= 0.9) {
    return true;
  }
  
  // Auto-escalate for specific issue types
  const autoEscalateTypes = [
    'safety_concern',
    'urgent_request',
    'explicit_escalation',
    'payment_issue'
  ];
  
  return autoEscalateTypes.includes(trigger.issueType);
}

/**
 * Get appropriate escalation response message
 */
export function getEscalationResponseMessage(trigger: EscalationTrigger): string {
  const responses = {
    human_support: "I understand you'd like to speak with a human. I'm connecting you to our support team right now.",
    user_frustration: "I can see you're frustrated, and I want to make sure you get the help you need. Let me connect you with our support team.",
    technical_problem: "I'm sorry you're experiencing technical difficulties. Let me escalate this to our technical support team.",
    payment_issue: "Payment issues require immediate attention. I'm connecting you with our billing support team.",
    safety_concern: "Safety is our top priority. I'm immediately connecting you with our safety team.",
    urgent_request: "I understand this is urgent. Let me connect you with our support team right away.",
    ai_limitation: "I want to make sure you get the best possible help. Let me connect you with our support team.",
    complex_issue: "This seems like a complex issue that would benefit from human assistance. Let me connect you with our support team.",
    explicit_escalation: "I'm escalating your request to our support team as requested.",
    general_support: "I'm connecting you with our support team to ensure you get the help you need."
  };

  return responses[trigger.issueType as keyof typeof responses] || responses.general_support;
}
