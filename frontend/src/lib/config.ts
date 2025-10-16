/**
 * Configuration constants for the Knowledge Base Search Engine
 */

// Environment detection
export const IS_PRODUCTION = true; // Hardcoded for production
export const IS_DEVELOPMENT = false; // Hardcoded for production

// Application Configuration
export const APP_CONFIG = {
  NAME: 'DocQue',
  VERSION: '1.0.0',
  ENVIRONMENT: 'production',
} as const;

// API Configuration
export const API_CONFIG = {
  BASE_URL: 'https://docque.onrender.com',
  TIMEOUT: 60000, // 60 seconds
  RETRY_ATTEMPTS: 2,
} as const;

// File Upload Configuration
export const UPLOAD_CONFIG = {
  MAX_FILE_SIZE: 10485760, // 10MB in bytes
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
  API_UNAVAILABLE: 'Service temporarily unavailable. Please try again later.',
} as const;

// Logging Configuration
export const LOGGING_CONFIG = {
  ENABLED: false, // Disabled for production
  LEVEL: 'error',
} as const;

// Success Messages
export const SUCCESS_MESSAGES = {
  UPLOAD_SUCCESS: 'Document uploaded successfully',
  DELETE_SUCCESS: 'Document deleted successfully',
} as const;