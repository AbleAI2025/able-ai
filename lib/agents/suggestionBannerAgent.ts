import { geminiAIAgent, GeminiAIOptions, SUPPORTED_GEMINI_MODELS } from "@/lib/firebase/ai";
import { Schema } from "@firebase/ai";

// --- Suggestion Schema ---
const suggestionSchema = Schema.array({
  items: Schema.object({
    properties: {
      id: Schema.string({description: 'A unique identifier for the suggestion, e.g., UUID.'}),
      title: Schema.string({description: 'A concise title for the suggestion (e.g., "Boost Your Profile!").'}),
      description: Schema.string({description: 'The main text of the suggestion (e.g., "Adding more details to your profile can attract more offers.").'}),
      suggestedActions: Schema.array({
        items: Schema.object({
          properties: {
            text: Schema.string({description: 'User-facing text for the action (e.g., "Complete your profile").'}),
            linkKey: Schema.string({description: 'An optional key for a predefined in-app navigation link (e.g., "PROFILE_EDIT", "VIEW_OFFERS").'})
          },
          optionalProperties: ['linkKey']
        }),
        description: 'An array of 1-4 suggested actions related to the suggestion. For use in AI chat.'
      })
    },
    optionalProperties: ['suggestedActions']
  })
});

// --- Main Agent Function ---
/**
 * Generates privacy-safe suggestions for the AI Suggestion Banner.
 * @param context - An object with anonymized/aggregated user and platform data.
 * @param role - 'worker' | 'buyer' (for prompt context)
 * @returns Array of suggestions [{ title, description }]
 */
interface SuggestedAction {
  text: string;
  linkKey?: string;
}

interface Suggestion {
  id: string;
  title: string;
  description: string;
  suggestedActions?: SuggestedAction[];
}

export async function generateSuggestions(
  context: Record<string, unknown>,
  role: 'worker' | 'buyer'
): Promise<Suggestion[]> {
  // Build the prompt based on the role
  const knownLinkKeysInfo = `
Known linkKeys and their purpose (use these if applicable for a suggested action):
- PROFILE_EDIT: Takes the user to their profile editing page.
- VIEW_OFFERS: Shows the user their current offers (for workers) or candidates (for buyers).
- POST_GIG: Allows a buyer to post a new gig.
- BROWSE_GIGS: Allows a worker to browse available gigs.
- LEARN_SKILL_PHOTOGRAPHY: Directs to resources for learning photography.
(Add more known linkKeys as your application evolves)
`;

  const prompt = `You are an AI assistant for ${role === 'buyer' ? 'buyers' : 'gig workers'}. Given the following context (which is PII-free), suggest 1-3 actionable, privacy-safe tips. Return a JSON array of suggestions. Each suggestion object must have:
1.  'id': A unique UUID (generate one, e.g., using a UUID v4 format if possible, or a random string).
2.  'title': A concise title for the suggestion (e.g., "Boost Your Profile!").
3.  'description': The main text of the suggestion (1-2 short sentences, e.g., "Adding more details to your profile can attract more offers.").
4.  'suggestedActions': An array of 1 to 3 objects, each representing a follow-up action for the AI chat. Each action object must have:
    a. 'text': User-facing text for the action (e.g., "Complete your profile now").
    b. 'linkKey' (optional): If the action directly corresponds to an in-app function, use one of the known linkKeys provided below. Otherwise, omit 'linkKey'.

${knownLinkKeysInfo}

Keep descriptions and action texts concise. Ensure all output is privacy-safe.

Context: ${JSON.stringify(context)}`;

  const aiOptions: GeminiAIOptions = {
    prompt,
    responseSchema: suggestionSchema,
    isStream: false,
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: suggestionSchema,
    },
  };

  // Use the latest supported model for suggestions
  const modelName = SUPPORTED_GEMINI_MODELS[0];

  const result = await geminiAIAgent<Suggestion[]>(
    modelName,
    aiOptions
  );

  if (result.ok) {
    return result.data;
  } else {
    console.error("Error generating suggestions:", result.error);
    // Fallback to a default or empty array in case of error
    return [
      {
        id: crypto.randomUUID(),
        title: 'Suggestion Generation Failed',
        description:
          'The AI could not generate specific suggestions at this time. Please try again.',
        suggestedActions: []
      },
    ]; 
  }
} 