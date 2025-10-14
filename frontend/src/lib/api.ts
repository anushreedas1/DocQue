/**
 * API client configuration for the Knowledge Base Search Engine
 * Handles communication with the FastAPI backend
 */

// API configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// API client class
export class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  /**
   * Generic fetch wrapper with error handling
   */
  private async fetchWithErrorHandling<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new ApiError(
          response.status,
          errorData.detail || `HTTP ${response.status}: ${response.statusText}`
        );
      }

      return await response.json();
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(0, `Network error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Upload a document to the backend
   */
  async uploadDocument(file: File): Promise<UploadResponse> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${this.baseUrl}/documents/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new ApiError(
        response.status,
        errorData.detail || `Upload failed: ${response.statusText}`
      );
    }

    return await response.json();
  }

  /**
   * Get list of uploaded documents
   */
  async getDocuments(): Promise<Document[]> {
    return this.fetchWithErrorHandling<Document[]>('/documents');
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
    return this.fetchWithErrorHandling<QueryResponse>('/query', {
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