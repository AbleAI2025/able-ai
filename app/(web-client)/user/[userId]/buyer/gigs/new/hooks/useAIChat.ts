import { useState, useCallback } from 'react';
import { ChatStep } from '@/app/(web-client)/user/[userId]/buyer/gigs/new/types';
import { Schema, AI } from '@firebase/ai';
import { geminiAIAgent } from '@/lib/firebase/ai';

interface UseAIChatProps {
  ai: AI;
  onAIResponse: (response: AIResponse) => void;
}

export interface AIResponse {
  sufficient: boolean;
  clarificationPrompt: string;
  sanitized: string;
  summary: string;
  nextField: string;
  nextPrompt: string;
}

export function parseAIResponse(data: any): Required<AIResponse> {
  return {
    sufficient: typeof data.sufficient === 'boolean' ? data.sufficient : false,
    clarificationPrompt: typeof data.clarificationPrompt === 'string' ? data.clarificationPrompt : '',
    sanitized: typeof data.sanitized === 'string' ? data.sanitized : '',
    summary: typeof data.summary === 'string' ? data.summary : '',
    nextField: typeof data.nextField === 'string' ? data.nextField : '',
    nextPrompt: typeof data.nextPrompt === 'string' ? data.nextPrompt : '',
  };
}

export function useAIChat({ ai, onAIResponse }: UseAIChatProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const processUserInput = useCallback(async (conversation: ChatStep[], formData: Record<string, any>, retryCount = 0) => {
    const MAX_RETRIES = 3;
    const RETRY_DELAY = 1000;

    setLoading(true);
    setError(null);
    try {
      const lastBot = [...conversation].reverse().find(s => s.type === 'bot');
      const lastUser = [...conversation].reverse().find(s => s.type === 'user');
      const lastQuestion = lastBot?.content || '';
      const lastAnswer = lastUser?.content || '';

      const aiPrompt = `You are an onboarding assistant for gig creation. Here is the conversation so far:

${conversation.map(s => s.type === 'bot' ? `Bot: ${s.content}` : s.type === 'user' ? `User: ${s.content}` : '').filter(Boolean).join('\n')}

Here is the data collected: ${JSON.stringify(formData)}
The last question was: "${lastQuestion}"
The user answered: "${lastAnswer}"

IMPORTANT: All monetary amounts and rates should be in British Pounds (£). When asking about hourly rates or pricing, always specify that amounts are in British Pounds.

Is this answer sufficient? If not, provide a clarification prompt. If yes, sanitize the answer and provide the next question (or summary if done). Respond as JSON: { sufficient: boolean, sanitized?: string, clarificationPrompt?: string, nextField?: string, nextPrompt?: string, summary?: string }`;

      const aiSchema = Schema.object({
        properties: {
          sufficient: Schema.boolean(),
          sanitized: Schema.string(),
          clarificationPrompt: Schema.string(),
          nextField: Schema.string(),
          nextPrompt: Schema.string(),
          summary: Schema.string(),
        },
        optionalProperties: ["sanitized", "clarificationPrompt", "nextField", "nextPrompt", "summary"]
      });

      const result = await geminiAIAgent(
        "gemini-2.0-flash",
        { 
          prompt: aiPrompt, 
          responseSchema: aiSchema
        },
        ai
      );

      if (!result.ok || !result.data) {
        throw new Error('Failed to get AI response');
      }

      const response = parseAIResponse(result.data);
      onAIResponse(response);
      return response;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error occurred'));
      
      // Implement retry logic
      if (retryCount < MAX_RETRIES) {
        console.log(`Retrying... Attempt ${retryCount + 1} of ${MAX_RETRIES}`);
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
        return processUserInput(conversation, formData, retryCount + 1);
      }
      
      throw err;
    } finally {
      setLoading(false);
    }
  }, [ai, onAIResponse]);

  return {
    processUserInput,
    loading,
    error
  };
}
