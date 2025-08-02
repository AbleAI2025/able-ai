import { StepInputConfig } from "@/app/types/form";

export interface ChatStep {
  id: number;
  type: "bot" | "user" | "input" | "sanitized";
  content?: string;
  inputConfig?: StepInputConfig;
  isComplete?: boolean;
  sanitizedValue?: string;
  originalValue?: string;
  fieldName?: string;
}

export type AIResponse = {
  sufficient?: boolean;
  clarificationPrompt?: string;
  sanitized?: string;
  summary?: string;
  nextField?: string;
  nextPrompt?: string;
};

export type ChatConfig = {
  initialPrompt: string;
  fields: Record<string, {
    type: string;
    label: string;
    placeholder?: string;
    rows?: number;
  }>;
};
