/**
 * API client configuration for the Knowledge Base Search Engine
 * Handles communication with the FastAPI backend
 */

import { API_CONFIG, IS_PRODUCTION, LOGGING_CONFIG } from './config';

// API configuration
const API_BASE_URL = API_CONFIG.BASE_URL;

// API client class
export class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  /**
   * Generic fetch wrapper with error handling and retry logic
   */
  private async fetchWithErrorHandling<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    let lastError: Error | null = null;

    // Retry logic for production stability
    for (let attempt = 1; attempt <= API_CONFIG.RETRY_ATTEMPTS; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT);

        const response = await fetch(url, {
          ...options,
          headers: {
            'Content-Type': 'application/json',
            ...options.headers,
          },
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          const errorMessage = errorData.detail || `HTTP ${response.status}: ${response.statusText}`;

          // Log error in development or when logging is enabled
          if (LOGGING_CONFIG.ENABLED) {
            console.error(`API Error (attempt ${attempt}):`, {
              url,
              status: response.status,
              message: errorMessage,
            });
          }

          throw new ApiError(response.status, errorMessage);
        }

        return await response.json();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');

        // Log retry attempts
        if (LOGGING_CONFIG.ENABLED && attempt < API_CONFIG.RETRY_ATTEMPTS) {
          console.warn(`API request failed (attempt ${attempt}/${API_CONFIG.RETRY_ATTEMPTS}):`, lastError.message);
        }

        // Don't retry on client errors (4xx) or if it's the last attempt
        if (error instanceof ApiError && error.status >= 400 && error.status < 500) {
          throw error;
        }

        if (attempt === API_CONFIG.RETRY_ATTEMPTS) {
          break;
        }

        // Wait before retrying (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt - 1) * 1000));
      }
    }

    // If we get here, all retries failed
    if (lastError instanceof ApiError) {
      throw lastError;
    }

    throw new ApiError(0, `Network error after ${API_CONFIG.RETRY_ATTEMPTS} attempts: ${lastError?.message || 'Unknown error'}`);
  }

  /**
   * Upload a document to the backend with retry logic
   */
  async uploadDocument(file: File): Promise<UploadResponse> {
    const formData = new FormData();
    formData.append('file', file);

    let lastError: Error | null = null;

    // Retry logic for file uploads
    for (let attempt = 1; attempt <= API_CONFIG.RETRY_ATTEMPTS; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT);

        const response = await fetch(`${this.baseUrl}/documents/upload`, {
          method: 'POST',
          body: formData,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          const errorMessage = errorData.detail || `Upload failed: ${response.statusText}`;

          if (LOGGING_CONFIG.ENABLED) {
            console.error(`Upload Error (attempt ${attempt}):`, {
              filename: file.name,
              status: response.status,
              message: errorMessage,
            });
          }

          throw new ApiError(response.status, errorMessage);
        }

        return await response.json();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');

        if (LOGGING_CONFIG.ENABLED && attempt < API_CONFIG.RETRY_ATTEMPTS) {
          console.warn(`Upload failed (attempt ${attempt}/${API_CONFIG.RETRY_ATTEMPTS}):`, lastError.message);
        }

        // Don't retry on client errors (4xx)
        if (error instanceof ApiError && error.status >= 400 && error.status < 500) {
          throw error;
        }

        if (attempt === API_CONFIG.RETRY_ATTEMPTS) {
          break;
        }

        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt - 1) * 1000));
      }
    }

    throw new ApiError(0, `Upload failed after ${API_CONFIG.RETRY_ATTEMPTS} attempts: ${lastError?.message || 'Unknown error'}`);
  }

  /**
   * Get list of uploaded documents
   */
  async getDocuments(): Promise<Document[]> {
    const response = await this.fetchWithErrorHandling<{ documents: Document[] }>('/documents/');
    return response.documents;
  }

  /**
   * Delete a document by ID
   */
  async deleteDocument(documentId: string): Promise<void> {
    await this.fetchWithErrorHandling(`/documents/${documentId}`, {
      method: 'DELETE',
    });
  }

  /**
   * Submit a query and get synthesized answer
   */
  async submitQuery(query: string, maxResults: number = 5): Promise<QueryResponse> {
    return this.fetchWithErrorHandling<QueryResponse>('/query/', {
      method: 'POST',
      body: JSON.stringify({
        query,
        max_results: maxResults,
      }),
    });
  }

  /**
   * Health check endpoint
   */
  async healthCheck(): Promise<{ status: string }> {
    return this.fetchWithErrorHandling<{ status: string }>('/health');
  }
}

// Custom error class for API errors
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// Type definitions for API responses
export interface Document {
  id: string;
  filename: string;
  upload_date: string;
  content?: string;
}

export interface UploadResponse {
  id: string;
  filename: string;
  message: string;
}

export interface QueryRequest {
  query: string;
  max_results?: number;
}

export interface QueryResponse {
  answer: string;
  sources: string[];
  confidence?: number;
}

// Create and export a default API client instance
export const apiClient = new ApiClient();