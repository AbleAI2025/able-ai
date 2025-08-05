export type FormInputType = 
  | "text"
  | "email"
  | "password"
  | "number"
  | "date"
  | "time"
  | "file"
  | "textarea"
  | "select"
  | "checkbox"
  | "radio"
  | "tel"
  | "url";

export interface StepInputConfig {
  type: FormInputType;
  name: string;
  label?: string;
  placeholder?: string;
  multiple?: boolean; // For file inputs, e.g., <input type="file" multiple>
  rows?: number;       // For textarea inputs, e.g., <textarea rows={3}>
  required?: boolean;  // For required fields
}
