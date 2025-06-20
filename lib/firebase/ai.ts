// Gemini AI Agent Utility - Scaffolding

import { ai } from "@/lib/firebase/clientApp";
import { getGenerativeModel, Schema } from "@firebase/ai";
import { logClient, logServer, ERROR_CODES, AppLogError } from "@/lib/log";

// --- Supported Models ---
export const SUPPORTED_GEMINI_MODELS = [
  "gemini-2.5-flash-preview-05-20",
  "gemini-2.0-flash",
  // Add more as needed
] as const;
export type SupportedGeminiModel = typeof SUPPORTED_GEMINI_MODELS[number];

// --- Type Definitions ---
export type GeminiAIOptions = {
  prompt: string;
  responseSchema: Schema; // Schema object from @firebase/ai
  isStream?: boolean;
  generationConfig?: Record<string, unknown>;
  // ...extend as needed
};

export type GeminiAIResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string; code?: number; details?: unknown };

export type GeminiAIErrorHook = (error: AppLogError) => void;

// --- Default Error Reporting Hook (no-op) ---
export const defaultErrorHook: GeminiAIErrorHook = () => {};

// --- Main Utility Function (Stub) ---
export async function geminiAIAgent<T>(
  modelName: SupportedGeminiModel,
  aiOptions: GeminiAIOptions,
  fallbackModelName?: SupportedGeminiModel,
  retries = 3,
  errorHook: GeminiAIErrorHook = defaultErrorHook,
  injectedAI: typeof ai = ai // For testability
): Promise<GeminiAIResult<T>> {
  // --- Model support check ---
  if (!SUPPORTED_GEMINI_MODELS.includes(modelName)) {
    const error = { ...ERROR_CODES.MODEL_NOT_SUPPORTED, details: { modelName } };
    logClient(error);
    logServer(error);
    errorHook(error);
    return { ok: false, error: error.message, code: error.code, details: error.details };
  }
  if (fallbackModelName && !SUPPORTED_GEMINI_MODELS.includes(fallbackModelName)) {
    const error = { ...ERROR_CODES.MODEL_NOT_SUPPORTED, details: { fallbackModelName } };
    logClient(error);
    logServer(error);
    errorHook(error);
    return { ok: false, error: error.message, code: error.code, details: error.details };
  }

  // --- Streaming stub ---
  if (aiOptions.isStream) {
    const error = ERROR_CODES.STREAM_NOT_IMPLEMENTED;
    logClient(error);
    logServer(error);
    errorHook(error);
    return { ok: false, error: error.message, code: error.code };
  }

  // --- Schema enforcement ---
  if (!aiOptions.responseSchema) {
    const error = { ...ERROR_CODES.SCHEMA_VALIDATION_FAILED, details: { reason: 'No responseSchema provided' } };
    logClient(error);
    logServer(error);
    errorHook(error);
    return { ok: false, error: error.message, code: error.code, details: error.details };
  }

  // --- Retry and fallback logic ---
  let lastError: AppLogError | null = null;
  let attempt = 0;
  let triedFallback = false;
  let currentModel = modelName;

  while (attempt < retries) {
    try {
      // Get the generative model
      const model = getGenerativeModel(injectedAI, {
        model: currentModel,
        generationConfig: {
          ...(aiOptions.generationConfig || {}),
          responseMimeType: 'application/json',
          responseSchema: aiOptions.responseSchema,
        },
      });
      // Call the model
      const result = await model.generateContent(aiOptions.prompt);
      // Parse and validate response
      let data: T | undefined;
      try {
        // The SDK should validate against the schema, but we check for parse errors
        if (typeof result.response.text === 'function') {
          // Some SDKs use a function for text()
          const text = await result.response.text();
          data = JSON.parse(text);
        } else {
          // Or it may be a string
          data = JSON.parse(result.response.text);
        }
      } catch (parseErr) {
        const error = { ...ERROR_CODES.SCHEMA_VALIDATION_FAILED, details: { parseErr, raw: result.response.text } };
        logClient(error);
        logServer(error);
        errorHook(error);
        lastError = error;
        attempt++;
        continue; // Retry on schema/parse error
      }
      if (typeof data === 'undefined' || data === null) {
        const error = { ...ERROR_CODES.SCHEMA_VALIDATION_FAILED, details: { reason: 'Parsed data is undefined or null', raw: result.response.text } };
        logClient(error);
        logServer(error);
        errorHook(error);
        lastError = error;
        attempt++;
        continue;
      }
      // Optionally, could add runtime validation here if needed
      return { ok: true, data };
    } catch (err: unknown) {
      // Handle model errors
      const error = { 
        ...ERROR_CODES.AI_API_ERROR, 
        details: { 
          err: err instanceof Error ? err.message : String(err), 
          model: currentModel, 
          attempt 
        } 
      };
      logClient(error);
      logServer(error);
      errorHook(error);
      lastError = error;
      // Fallback logic: if allowed, try fallback model after at least 1 attempt with primary
      if (
        fallbackModelName &&
        !triedFallback &&
        attempt >= Math.max(1, retries - 2)
      ) {
        currentModel = fallbackModelName;
        triedFallback = true;
        attempt++;
        continue;
      }
      attempt++;
    }
  }
  // All retries/fallbacks failed
  const finalError =
    lastError || { ...ERROR_CODES.UNKNOWN, details: { modelName, aiOptions } };
  return {
    ok: false,
    error: "Sorry, I cannot answer this time. Please retry or report this issue.",
    code: finalError.code,
    details: finalError.details,
  };
}

// --- Streaming Stub (if needed) ---
// function notImplementedStream() {
//   const error = ERROR_CODES.STREAM_NOT_IMPLEMENTED;
//   logClient(error);
//   logServer(error);
//   throw new Error(error.message);
// }

// --- Example Schema Usage (commented) ---
// const mySchema = Schema.object({
//   answer: Schema.string(),
// });
