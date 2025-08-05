import { Schema } from '@firebase/ai';

export const createAISchema = () => Schema.object({
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
