/**
 * Configuration constants for the Knowledge Base Search Engine
 */

// API Configuration
export const API_CONFIG = {
  BASE_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
  TIMEOUT: 30000, // 30 seconds
  RETRY_ATTEMPTS: 3,
} as const;

// File Upload Configuration
export const UPLOAD_CONFIG = {
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_TYPES: ['application/pdf', 'text/plain'],
  ALLOWED_EXTENSIONS: ['pdf', 'txt'],
} as const;

// Query Configuration
export const QUERY_CONFIG = {
  MAX_QUERY_LENGTH: 500,
  DEFAULT_MAX_RESULTS: 5,
  DEBOUNCE_DELAY: 300, // milliseconds
} as const;

// UI Configuration
export const UI_CONFIG = {
  ITEMS_PER_PAGE: 10,
  MAX_FILENAME_DISPLAY_LENGTH: 50,
  MAX_ANSWER_PREVIEW_LENGTH: 200,
} as const;

// Error Messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Unable to connect to the server. Please check your connection.',
  FILE_TOO_LARGE: `File size must be less than ${UPLOAD_CONFIG.MAX_FILE_SIZE / (1024 * 1024)}MB`,
  INVALID_FILE_TYPE: 'Only PDF and TXT files are supported',
  UPLOAD_FAILED: 'Failed to upload document. Please try again.',
  QUERY_FAILED: 'Failed to process your query. Please try again.',
  DELETE_FAILED: 'Failed to delete document. Please try again.',
  GENERIC_ERROR: 'An unexpected error occurred. Please try again.',
} as const;

// Success Messages
export const SUCCESS_MESSAGES = {
  UPLOAD_SUCCESS: 'Document uploaded successfully',
  DELETE_SUCCESS: 'Document deleted successfully',
} as const;