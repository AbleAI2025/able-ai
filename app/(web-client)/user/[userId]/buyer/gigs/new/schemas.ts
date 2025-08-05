import { Schema } from '@firebase/ai';

export const gigStepSchema = Schema.object({
  properties: {
    field: Schema.string(),
    prompt: Schema.string(),
    isComplete: Schema.boolean(),
  },
});

export const gigSummarySchema = Schema.object({
  properties: {
    gigDescription: Schema.string(),
    additionalInstructions: Schema.string(),
    hourlyRate: Schema.number(),
    gigLocation: Schema.string(),
    gigDate: Schema.string(),
    discountCode: Schema.string(),
    selectedWorker: Schema.string(),
  },
  optionalProperties: ["discountCode", "selectedWorker"],
});
