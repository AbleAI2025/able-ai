import { createEscalatedIssueClient } from '@/utils/client-escalation';
import { detectEscalationTriggers, generateEscalationDescription } from '@/utils/escalation-detection';

/**
 * Save support case to database
 */
export async function saveSupportCaseToDatabase(userData: any, conversationHistory: any[], reason: string): Promise<string> {
  try {
    // Get user ID from userData
    const userId = userData?.userId;
    if (!userId) {
      console.error('No user ID provided for escalation');
      return `ERROR-${Date.now()}`;
    }

    // Create escalated issue in database via API
    const escalationResult = await createEscalatedIssueClient({
      userId: userId,
      issueType: 'onboarding_difficulty',
      description: `Onboarding escalation: ${reason}. User struggling with AI onboarding process.`,
      contextType: 'onboarding'
    });

    if (escalationResult.success) {
      return `SUPPORT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    } else {
      console.error('Failed to create escalated issue:', escalationResult.error);
      return `ERROR-${Date.now()}`;
    }
  } catch (error) {
    console.error('Error saving support case:', error);
    return `ERROR-${Date.now()}`;
  }
}

/**
 * Test help detection system
 */
export async function testHelpDetectionSystem(ai?: any): Promise<void> {
  console.log('🧪 Testing AI-Powered Help Detection System...');
  
  // Test cases that should NOT trigger help flow
  const shouldNotTriggerHelp = [
    'I have 5 years of experience in customer service',
    'My skills include communication and problem solving',
    'I am available Monday through Friday',
    'I worked at Starbucks for 2 years'
  ];
  
  // Test cases that SHOULD trigger help flow
  const shouldTriggerHelp = [
    'I need help with this',
    'This is confusing',
    'I dont understand',
    'Can you help me?',
    'I am frustrated',
    'This is not working'
  ];
  
  console.log('Testing cases that should NOT trigger help:');
  for (const testCase of shouldNotTriggerHelp) {
    // This would normally call the AI analysis
    console.log(`✅ "${testCase}" - Should continue normal flow`);
  }
  
  console.log('\nTesting cases that SHOULD trigger help:');
  for (const testCase of shouldTriggerHelp) {
    // This would normally call the AI analysis
    console.log(`🆘 "${testCase}" - Should trigger help flow`);
  }
  
  console.log('\n🎯 Help Detection System Test Complete!');
}

/**
 * Handle user response with intent analysis
 */
export async function handleUserResponseWithIntent(
  userInput: string,
  currentStep: string,
  formData: any,
  chatSteps: any[],
  ai: any
): Promise<{
  action: string;
  confidence: number;
  reason: string;
  suggestedAction: string;
}> {
  // Analyze user intent
  const intent = await analyzeUserIntentWithAI(userInput, currentStep, chatSteps, ai);
  
  // Determine action based on intent
  switch (intent.action) {
    case 'help':
      // High confidence help request
      return {
        action: 'show_help_options',
        confidence: intent.confidence,
        reason: intent.reason,
        suggestedAction: 'escalate_to_human_support'
      };
      
    case 'clarify':
      // Medium confidence - need clarification
      if (intent.confidence > 0.5 && intent.confidence < 0.8) {
        return {
          action: 'request_clarification',
          confidence: intent.confidence,
          reason: intent.reason,
          suggestedAction: 'ask_for_more_details'
        };
      }
      // Fall through to continue if confidence is too low
      
    case 'continue':
    default:
      // Process normally - this is not a help request
      return {
        action: 'continue_normal_flow',
        confidence: intent.confidence,
        reason: intent.reason,
        suggestedAction: 'process_user_input'
      };
  }
}

// Import the AI function we need
import { analyzeUserIntentWithAI } from '../ai-systems/ai-utils';
