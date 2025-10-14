'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { apiClient, ApiError, Document, QueryResponse } from '@/lib/api';

interface ApiContextType {
  // State
  documents: Document[];
  isLoading: boolean;
  error: string | null;
  
  // Actions
  uploadDocument: (file: File) => Promise<void>;
  deleteDocument: (documentId: string) => Promise<void>;
  submitQuery: (query: string) => Promise<QueryResponse>;
  refreshDocuments: () => Promise<void>;
  clearError: () => void;
}

const ApiContext = createContext<ApiContextType | undefined>(undefined);

export function ApiProvider({ children }: { children: React.ReactNode }) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const handleError = useCallback((error: unknown) => {
    if (error instanceof ApiError) {
      setError(error.message);
    } else if (error instanceof Error) {
      setError(error.message);
    } else {
      setError('An unexpected error occurred');
    }
  }, []);

  const refreshDocuments = useCallback(async () => {
    try {
      setIsLoading(true);
      clearError();
      const docs = await apiClient.getDocuments();
      setDocuments(docs);
    } catch (error) {
      handleError(error);
    } finally {
      setIsLoading(false);
    }
  }, [clearError, handleError]);

  const uploadDocument = useCallback(async (file: File) => {
    try {
      setIsLoading(true);
      clearError();
      await apiClient.uploadDocument(file);
      // Refresh documents list after successful upload
      await refreshDocuments();
    } catch (error) {
      handleError(error);
      throw error; // Re-throw so components can handle upload-specific errors
    } finally {
      setIsLoading(false);
    }
  }, [clearError, handleError, refreshDocuments]);

  const deleteDocument = useCallback(async (documentId: string) => {
    try {
      setIsLoading(true);
      clearError();
      await apiClient.deleteDocument(documentId);
      // Remove document from local state immediately
      setDocuments(prev => prev.filter(doc => doc.id !== documentId));
    } catch (error) {
      handleError(error);
      // Refresh documents to ensure consistency if delete failed
      await refreshDocuments();
    } finally {
      setIsLoading(false);
    }
  }, [clearError, handleError, refreshDocuments]);

  const submitQuery = useCallback(async (query: string): Promise<QueryResponse> => {
    try {
      setIsLoading(true);
      clearError();
      const response = await apiClient.submitQuery(query);
      return response;
    } catch (error) {
      handleError(error);
      throw error; // Re-throw so components can handle query-specific errors
    } finally {
      setIsLoading(false);
    }
  }, [clearError, handleError]);

  const value: ApiContextType = {
    documents,
    isLoading,
    error,
    uploadDocument,
    deleteDocument,
    submitQuery,
    refreshDocuments,
    clearError,
  };

  return (
    <ApiContext.Provider value={value}>
      {children}
    </ApiContext.Provider>
  );
}

export function useApi() {
  const context = useContext(ApiContext);
  if (context === undefined) {
    throw new Error('useApi must be used within an ApiProvider');
  }
  return context;
}