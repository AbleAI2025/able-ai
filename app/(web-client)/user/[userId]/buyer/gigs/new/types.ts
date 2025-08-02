import { StepInputConfig } from "@/app/types/form";

export type ChatStep = {
  id: number;
  type: "bot" | "user" | "input" | "sanitized";
  content?: string;
  inputConfig?: StepInputConfig;
  isComplete?: boolean;
  sanitizedValue?: string;
  originalValue?: string;
  fieldName?: string;
};

export type WorkerData = {
  name: string;
  title: string;
  gigs: number;
  experience: string;
  keywords: string;
  hourlyRate: number;
  totalHours: number;
  totalPrice: number;
  ableFees: string;
  stripeFees: string;
  imageSrc: string;
};
