import { StepInputConfig } from "@/app/types/form";

export type StepType = "bot" | "user" | "input" | "sanitized";

export interface ChatStep {
  id: number;
  type: StepType;
  content?: string;
  inputConfig?: StepInputConfig;
  isComplete?: boolean;
  sanitizedValue?: string;
  originalValue?: string;
  fieldName?: string;
}

export interface AIResponse {
  sufficient?: boolean;
  clarificationPrompt?: string;
  sanitized?: string;
  summary?: string;
  nextField?: string;
  nextPrompt?: string;
}

export interface ChatField {
  type: string;
  label: string;
  placeholder?: string;
  rows?: number;
}

export interface ChatConfig {
  initialPrompt: string;
  fields: Record<string, ChatField>;
}
