import { FirebaseError } from 'firebase/app';

/**
 * Firebase Error Handler Utility
 * 
 * Provides better error messages and handling for common Firebase errors
 */

export interface FirebaseErrorInfo {
  code: string;
  message: string;
  userMessage: string;
  isRetryable: boolean;
  suggestedAction?: string;
}

/**
 * Maps Firebase error codes to user-friendly messages
 */
const ERROR_MESSAGES: Record<string, FirebaseErrorInfo> = {
  // Auth errors
  'auth/user-not-found': {
    code: 'auth/user-not-found',
    message: 'User not found',
    userMessage: 'No user found with this email address.',
    isRetryable: false,
    suggestedAction: 'Please check your email address or sign up for a new account.'
  },
  'auth/wrong-password': {
    code: 'auth/wrong-password',
    message: 'Wrong password',
    userMessage: 'Incorrect password.',
    isRetryable: true,
    suggestedAction: 'Please check your password and try again.'
  },
  
  // Firestore errors
  'permission-denied': {
    code: 'permission-denied',
    message: 'Permission denied',
    userMessage: 'You don\'t have permission to perform this action.',
    isRetryable: false,
    suggestedAction: 'Please make sure you are logged in and try again.'
  },
  'not-found': {
    code: 'not-found',
    message: 'Document not found',
    userMessage: 'The requested item was not found.',
    isRetryable: false,
    suggestedAction: 'The item may have been deleted or moved.'
  },
  'already-exists': {
    code: 'already-exists',
    message: 'Document already exists',
    userMessage: 'This item already exists.',
    isRetryable: false,
    suggestedAction: 'Please try with a different name or check existing items.'
  },
  'resource-exhausted': {
    code: 'resource-exhausted',
    message: 'Resource exhausted',
    userMessage: 'Service is temporarily busy.',
    isRetryable: true,
    suggestedAction: 'Please wait a moment and try again.'
  },
  'unavailable': {
    code: 'unavailable',
    message: 'Service unavailable',
    userMessage: 'Service is temporarily unavailable.',
    isRetryable: true,
    suggestedAction: 'Please check your internet connection and try again.'
  },
  'deadline-exceeded': {
    code: 'deadline-exceeded',
    message: 'Request timeout',
    userMessage: 'Request timed out.',
    isRetryable: true,
    suggestedAction: 'Please check your internet connection and try again.'
  },
  'invalid-argument': {
    code: 'invalid-argument',
    message: 'Invalid argument',
    userMessage: 'Invalid data provided.',
    isRetryable: false,
    suggestedAction: 'Please check the form and try again.'
  },
  'failed-precondition': {
    code: 'failed-precondition',
    message: 'Failed precondition',
    userMessage: 'Operation not allowed in current state.',
    isRetryable: false,
    suggestedAction: 'Please refresh the page and try again.'
  },
  'aborted': {
    code: 'aborted',
    message: 'Operation aborted',
    userMessage: 'Operation was cancelled.',
    isRetryable: true,
    suggestedAction: 'Please try again.'
  },
  'out-of-range': {
    code: 'out-of-range',
    message: 'Out of range',
    userMessage: 'Value is out of allowed range.',
    isRetryable: false,
    suggestedAction: 'Please check your input values.'
  },
  'unimplemented': {
    code: 'unimplemented',
    message: 'Feature not implemented',
    userMessage: 'This feature is not yet available.',
    isRetryable: false,
    suggestedAction: 'Please try again later or contact support.'
  },
  'internal': {
    code: 'internal',
    message: 'Internal error',
    userMessage: 'An internal error occurred.',
    isRetryable: true,
    suggestedAction: 'Please try again later or contact support if the problem persists.'
  },
  'unauthenticated': {
    code: 'unauthenticated',
    message: 'User not authenticated',
    userMessage: 'Please sign in to continue.',
    isRetryable: false,
    suggestedAction: 'Please sign in and try again.'
  },
  'data-loss': {
    code: 'data-loss',
    message: 'Data loss',
    userMessage: 'Unrecoverable data loss occurred.',
    isRetryable: false,
    suggestedAction: 'Please contact support immediately.'
  }
};

/**
 * Default error info for unknown errors
 */
const DEFAULT_ERROR: FirebaseErrorInfo = {
  code: 'unknown',
  message: 'Unknown error',
  userMessage: 'An unexpected error occurred.',
  isRetryable: true,
  suggestedAction: 'Please try again later.'
};

/**
 * Extracts error information from Firebase errors
 */
export function getFirebaseErrorInfo(error: any): FirebaseErrorInfo {
  if (!error) {
    return DEFAULT_ERROR;
  }

  // Handle Firebase errors
  if (error.code) {
    const errorInfo = ERROR_MESSAGES[error.code];
    if (errorInfo) {
      return {
        ...errorInfo,
        message: error.message || errorInfo.message
      };
    }
  }

  // Handle generic errors
  if (error.message) {
    return {
      ...DEFAULT_ERROR,
      message: error.message,
      userMessage: `Error: ${error.message}`
    };
  }

  return DEFAULT_ERROR;
}

/**
 * Logs Firebase errors with context
 */
export function logFirebaseError(
  error: any,
  operation: string,
  context?: Record<string, any>
): void {
  const errorInfo = getFirebaseErrorInfo(error);
  
  console.group(`🔥 Firebase Error: ${operation}`);
  console.error('Error Code:', errorInfo.code);
  console.error('Error Message:', errorInfo.message);
  console.error('User Message:', errorInfo.userMessage);
  console.error('Is Retryable:', errorInfo.isRetryable);
  if (errorInfo.suggestedAction) {
    console.info('Suggested Action:', errorInfo.suggestedAction);
  }
  if (context) {
    console.error('Context:', context);
  }
  console.error('Full Error:', error);
  console.groupEnd();
}

/**
 * Wraps Firebase operations with error handling
 */
export async function handleFirebaseOperation<T>(
  operation: () => Promise<T>,
  operationName: string,
  context?: Record<string, any>
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    logFirebaseError(error, operationName, context);
    throw error;
  }
}

/**
 * Retries Firebase operations with exponential backoff
 */
export async function retryFirebaseOperation<T>(
  operation: () => Promise<T>,
  operationName: string,
  maxRetries: number = 3,
  context?: Record<string, any>
): Promise<T> {
  let lastError: any;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      const errorInfo = getFirebaseErrorInfo(error);
      
      // Don't retry if error is not retryable
      if (!errorInfo.isRetryable) {
        logFirebaseError(error, operationName, { ...context, attempt });
        throw error;
      }
      
      // Don't retry on last attempt
      if (attempt === maxRetries) {
        logFirebaseError(error, operationName, { ...context, attempt, finalAttempt: true });
        throw error;
      }
      
      // Wait before retry (exponential backoff)
      const delay = Math.pow(2, attempt - 1) * 1000; // 1s, 2s, 4s, etc.
      console.warn(
        `Firebase operation "${operationName}" failed (attempt ${attempt}/${maxRetries}). Retrying in ${delay}ms...`,
        errorInfo.userMessage
      );
      
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
}

/**
 * Creates a user-friendly error message for display
 */
export function createUserErrorMessage(error: any, operation?: string): string {
  const errorInfo = getFirebaseErrorInfo(error);
  let message = errorInfo.userMessage;
  
  if (operation) {
    message = `Failed to ${operation}: ${message}`;
  }
  
  if (errorInfo.suggestedAction) {
    message += ` ${errorInfo.suggestedAction}`;
  }
  
  return message;
}

/**
 * Network connectivity check
 */
export function isNetworkError(error: any): boolean {
  if (!error || !error.code) return false;
  
  const networkErrorCodes = [
    'unavailable',
    'deadline-exceeded',
    'resource-exhausted'
  ];
  
  return networkErrorCodes.includes(error.code);
}

/**
 * Permission error check
 */
export function isPermissionError(error: any): boolean {
  if (!error || !error.code) return false;
  
  const permissionErrorCodes = [
    'permission-denied',
    'unauthenticated'
  ];
  
  return permissionErrorCodes.includes(error.code);
}

/**
 * Check if error indicates missing data
 */
export function isNotFoundError(error: any): boolean {
  if (!error || !error.code) return false;
  
  return error.code === 'not-found';
}
