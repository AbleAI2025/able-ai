// Gemini AI Agent Utility - Scaffolding

import { getAI } from "@firebase/ai";
import { logClient, logServer, ERROR_CODES, AppLogError } from "@/lib/log";
import { getGenerativeModel, Schema } from "@firebase/ai";
import {
  isSupportedModel,
  handleGeminiError,
  validateSchema,
  callGeminiModelAndParse,
} from "./aiUtils";

// --- Supported Models ---
export const SUPPORTED_GEMINI_MODELS = [
  "gemini-2.5-flash-preview-05-20",
  "gemini-2.5-flash",
  "gemini-2.0-flash",
  // Add more as needed
] as const;
export type SupportedGeminiModel = (typeof SUPPORTED_GEMINI_MODELS)[number];

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

// --- Main Utility Function (Refactored) ---
export async function geminiAIAgent<T>(
  modelName: SupportedGeminiModel,
  aiOptions: GeminiAIOptions,
  injectedAI: ReturnType<typeof getAI> | null, // For testability
  fallbackModelName?: SupportedGeminiModel,
  retries = 3,
  errorHook: GeminiAIErrorHook = defaultErrorHook,
): Promise<GeminiAIResult<T>> {
    const error = validateInputs(modelName, fallbackModelName, aiOptions);
  if (error) {
    handleGeminiError(error, errorHook);
    return formatErrorResult(error);
  }

  // --- Schema enforcement ---
  if (!validateSchema(aiOptions.responseSchema)) {
    handleGeminiError(
      {
        ...ERROR_CODES.SCHEMA_VALIDATION_FAILED,
        details: { reason: "No responseSchema provided" },
      },
      errorHook
    );
    return {
      ok: false,
      error: ERROR_CODES.SCHEMA_VALIDATION_FAILED.message,
      code: ERROR_CODES.SCHEMA_VALIDATION_FAILED.code,
      details: { reason: "No responseSchema provided" },
    };
  }

  // --- Retry and fallback logic ---
  let lastError: AppLogError | null = null;
  let attempt = 0;
  let triedFallback = false;
  let currentModel = modelName;

  while (attempt < retries) {
    try {
      if (!injectedAI) {
        const error = { ...ERROR_CODES.AI_API_ERROR, details: { attempt, modelName, aiOptions } };
        logClient(error);
        logServer(error);
        errorHook(error);
        lastError = error;
        attempt++;
        continue; // Retry if AI is not initialized
      }
      // Get the generative model
      const model = getGenerativeModel(injectedAI, {
        model: currentModel,
        generationConfig: {
          ...(aiOptions.generationConfig || {}),
          responseMimeType: "application/json",
          responseSchema: aiOptions.responseSchema,
        },
      });
      // Call the model and parse response
      const data = await callGeminiModelAndParse<T>(
        model,
        aiOptions.prompt,
        errorHook
      );
      if (data instanceof Error) {
        lastError = {
          ...ERROR_CODES.SCHEMA_VALIDATION_FAILED,
          details: { reason: data.message },
        };
        attempt++;
        continue;
      }
      return { ok: true, data };
    } catch (err: unknown) {
      // Handle model errors
      const error = {
        ...ERROR_CODES.AI_API_ERROR,
        details: {
          err: err instanceof Error ? err.message : String(err),
          model: currentModel,
          attempt,
        },
      };
      handleGeminiError(error, errorHook);
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
  const finalError = lastError || {
    ...ERROR_CODES.UNKNOWN,
    details: { modelName, aiOptions },
  }; // All retries/fallbacks failed
  return {
    ok: false,
    error:
      "Sorry, I cannot answer this time. Please retry or report this issue.",
    code: finalError.code,
    details: finalError.details,
  };
}

function validateInputs(
  modelName: SupportedGeminiModel,
  fallbackModelName: SupportedGeminiModel | undefined,
  aiOptions: GeminiAIOptions,
): AppLogError | null {
  if (!isSupportedModel(modelName, SUPPORTED_GEMINI_MODELS)) {
    return { ...ERROR_CODES.MODEL_NOT_SUPPORTED, details: { modelName } };
  }

  if (fallbackModelName && !isSupportedModel(fallbackModelName, SUPPORTED_GEMINI_MODELS)) {
    return { ...ERROR_CODES.MODEL_NOT_SUPPORTED, details: { fallbackModelName } };
  }

  if (aiOptions.isStream) {
    return ERROR_CODES.STREAM_NOT_IMPLEMENTED;
  }

  if (!validateSchema(aiOptions.responseSchema)) {
    return {
      ...ERROR_CODES.SCHEMA_VALIDATION_FAILED,
      details: { reason: "No responseSchema provided" },
    };
  }

  return null;
}

function formatErrorResult(error: AppLogError): GeminiAIResult<never> {
  return {
    ok: false,
    error: error.message,
    code: error.code,
    details: error.details,
  };
}
