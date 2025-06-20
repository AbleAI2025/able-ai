// Logging utility for Able AI

export type LogType = 'error' | 'critical' | 'warning' | 'analytics' | 'info' | 'debug' | 'other';

export interface AppLogError {
  code: number;
  message: string;
  type: LogType;
  details?: unknown;
}

// Predefined error codes/messages/types
export const ERROR_CODES = {
  // General Errors (10000-10099)
  UNKNOWN: { code: 10000, message: 'Unknown error', type: 'error' as LogType },
  MODEL_NOT_SUPPORTED: { code: 10001, message: 'Model not supported', type: 'error' as LogType },
  SCHEMA_VALIDATION_FAILED: { code: 10002, message: 'Schema validation failed', type: 'error' as LogType },
  AI_API_ERROR: { code: 10003, message: 'AI API error', type: 'error' as LogType },
  STREAM_NOT_IMPLEMENTED: { code: 10004, message: 'Streaming not implemented', type: 'warning' as LogType },
  FETCH_DATA_FAILED: { code: 10005, message: 'Failed to fetch data', type: 'error' as LogType },
  INVALID_INPUT: { code: 10006, message: 'Invalid input provided', type: 'warning' as LogType },
  NAVIGATION_ERROR: { code: 10007, message: 'Navigation error occurred', type: 'error' as LogType },
  COMPONENT_LOGIC_ERROR: { code: 10008, message: 'Error in component logic', type: 'error' as LogType },
  
  // Storage Errors (10100-10199)
  LOCAL_STORAGE_ERROR: { code: 10100, message: 'Local storage operation failed', type: 'error' as LogType },
  SESSION_STORAGE_ERROR: { code: 10101, message: 'Session storage operation failed', type: 'error' as LogType },

  // Authentication & Authorization Errors (10200-10299)
  AUTH_ERROR: { code: 10200, message: 'Authentication error', type: 'error' as LogType },
  PERMISSION_DENIED: { code: 10201, message: 'Permission denied', type: 'error' as LogType },

  // AI Suggestion Specific Errors (10300-10399)
  AI_SUGGESTION_GENERATION_FAILED: { code: 10300, message: 'AI suggestion generation failed', type: 'error' as LogType },
  AI_SUGGESTION_INVALID_RESPONSE: { code: 10301, message: 'AI suggestion response is invalid', type: 'error' as LogType },
  
  // Add more as needed, consider ranges for different modules/features
};

// Client-side logger (frontend)
export function logClient(error: AppLogError) {
  if (typeof window !== 'undefined') {
    // Could extend to send to a remote logging service
    if (error.type === 'error' || error.type === 'critical') {
      console.error(`[Client][${error.type.toUpperCase()}] [CODE: ${error.code}] ${error.message}`, error.details || '');
    } else if (error.type === 'warning') {
      console.warn(`[Client][${error.type.toUpperCase()}] [CODE: ${error.code}] ${error.message}`, error.details || '');
    } else {
      console.log(`[Client][${error.type.toUpperCase()}] [CODE: ${error.code}] ${error.message}`, error.details || '');
    }
  }
}

// Server-side logger (backend)
export function logServer(error: AppLogError) {
  if (typeof window === 'undefined') {
    // Could extend to send to a remote logging service
    if (error.type === 'error' || error.type === 'critical') {
      console.error(`[Server][${error.type.toUpperCase()}] [CODE: ${error.code}] ${error.message}`, error.details || '');
    } else if (error.type === 'warning') {
      console.warn(`[Server][${error.type.toUpperCase()}] [CODE: ${error.code}] ${error.message}`, error.details || '');
    } else {
      console.log(`[Server][${error.type.toUpperCase()}] [CODE: ${error.code}] ${error.message}`, error.details || '');
    }
  }
} 