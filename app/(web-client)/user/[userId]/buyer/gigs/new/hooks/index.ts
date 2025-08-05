import { useState, useCallback } from 'react';
import { useFirebase } from '@/context/FirebaseContext';
import { ChatStep } from '../types/index';
import { AIResponse } from '@/hooks/useAIChat';
import { createAISchema } from '../utils/ai-schema';
import { geminiAIAgent } from '@/lib/firebase/ai';

export function useChatFlow() {
  const { ai } = useFirebase();
  const [isTyping, setIsTyping] = useState(false);
  const [pendingSanitization, setPendingSanitization] = useState<null | { field: string; value: string }>(null);
  const [sanitizing, setSanitizing] = useState(false);
  const [sanitizedValue, setSanitizedValue] = useState<string | null>(null);
  const [sanitizedStepId, setSanitizedStepId] = useState<number | null>(null);

  const buildAIPrompt = useCallback((conversation: ChatStep[], formData: Record<string, any>) => {
    const lastBot = [...conversation].reverse().find(s => s.type === 'bot');
    const lastUser = [...conversation].reverse().find(s => s.type === 'user');
    const lastQuestion = lastBot?.content || '';
    const lastAnswer = lastUser?.content || '';
    
    return `You are an onboarding assistant for gig creation. Here is the conversation so far:\n\n${
      conversation.map(s => s.type === 'bot' ? `Bot: ${s.content}` : s.type === 'user' ? `User: ${s.content}` : '')
      .filter(Boolean).join('\n')
    }\n\nHere is the data collected: ${JSON.stringify(formData)}
    \nThe last question was: "${lastQuestion}"\nThe user answered: "${lastAnswer}"
    \nIs this answer sufficient? If not, provide a clarification prompt. If yes, sanitize the answer and provide the next question (or summary if done).
    Respond as JSON: { sufficient: boolean, sanitized?: string, clarificationPrompt?: string, nextField?: string, nextPrompt?: string, summary?: string }`;
  }, []);

  const processUserInput = useCallback(async (
    conversation: ChatStep[],
    formData: Record<string, any>,
    field: string,
    value: string
  ): Promise<AIResponse> => {
    setIsTyping(true);
    setSanitizing(true);
    setPendingSanitization({ field, value });

    try {
      const aiPrompt = buildAIPrompt(conversation, formData);
      const aiSchema = createAISchema();
      const result = await geminiAIAgent(
        "gemini-2.5-flash-preview-05-20",
        { prompt: aiPrompt, responseSchema: aiSchema },
        ai
      );

      const aiData = result.ok && result.data ? result.data : {};
      return aiData as AIResponse;
    } finally {
      setIsTyping(false);
      setSanitizing(false);
    }
  }, [ai, buildAIPrompt]);

  return {
    isTyping,
    pendingSanitization,
    sanitizing,
    sanitizedValue,
    sanitizedStepId,
    setSanitizedValue,
    setSanitizedStepId,
    setPendingSanitization,
    setSanitizing,
    processUserInput,
  };
}
