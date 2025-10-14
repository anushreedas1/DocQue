'use client';

import React, { useEffect, useState } from 'react';
import { useApi } from '@/contexts/ApiContext';
import { Document } from '@/lib/api';

interface DocumentItemProps {
  document: Document;
  onDelete: (id: string) => void;
  onSelect?: (id: string) => void;
  selected?: boolean;
}

function DocumentItem({ document, onDelete, onSelect, selected }: DocumentItemProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleDelete = async () => {
    if (!showDeleteConfirm) {
      setShowDeleteConfirm(true);
      return;
    }

    try {
      setIsDeleting(true);
      await onDelete(document.id);
    } catch (error) {
      console.error('Failed to delete document:', error);
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteConfirm(false);
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return 'Unknown date';
    }
  };

  const getFileIcon = (filename: string) => {
    const extension = filename.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'pdf':
        return '📄';
      case 'txt':
        return '📝';
      default:
        return '📄';
    }
  };

  return (
    <div
      className={`
        p-4 border rounded-lg transition-all duration-200
        ${selected 
          ? 'border-blue-300 bg-blue-50' 
          : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
        }
        ${isDeleting ? 'opacity-50 pointer-events-none' : ''}
      `}
    >
      <div className="flex items-center justify-between">
        <div 
          className="flex items-center space-x-3 flex-1 cursor-pointer"
          onClick={() => onSelect?.(document.id)}
        >
          <span className="text-2xl">{getFileIcon(document.filename)}</span>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-medium text-gray-900 truncate">
              {document.filename}
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              Uploaded {formatDate(document.upload_date)}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 ml-4">
          {/* Delete Button */}
          {!showDeleteConfirm ? (
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
              title="Delete document"
            >
              {isDeleting ? (
                <div className="w-4 h-4 border-2 border-gray-300 border-t-red-500 rounded-full animate-spin" />
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              )}
            </button>
          ) : (
            <div className="flex items-center space-x-1">
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
              >
                Confirm
              </button>
              <button
                onClick={handleCancelDelete}
                disabled={isDeleting}
                className="px-2 py-1 text-xs bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Document Content Preview (if available) */}
      {document.content && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <p className="text-xs text-gray-600 line-clamp-2">
            {document.content.substring(0, 150)}
            {document.content.length > 150 ? '...' : ''}
          </p>
        </div>
      )}
    </div>
  );
}

interface DocumentListProps {
  onDocumentSelect?: (documentId: string) => void;
  selectedDocuments?: string[];
  showSelection?: boolean;
}

export default function DocumentList({ 
  onDocumentSelect, 
  selectedDocuments = [], 
  showSelection = false 
}: DocumentListProps) {
  const { documents, isLoading, error, deleteDocument, refreshDocuments } = useApi();
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    refreshDocuments();
  }, [refreshDocuments]);

  const handleDelete = async (documentId: string) => {
    try {
      setLocalError(null);
      await deleteDocument(documentId);
    } catch (error) {
      setLocalError(error instanceof Error ? error.message : 'Failed to delete document');
    }
  };

  const handleRefresh = () => {
    setLocalError(null);
    refreshDocuments();
  };

  if (isLoading && documents.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex items-center space-x-2 text-gray-500">
          <div className="w-5 h-5 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
          <span>Loading documents...</span>
        </div>
      </div>
    );
  }

  const displayError = localError || error;

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            Documents ({documents.length})
          </h2>
          {showSelection && selectedDocuments.length > 0 && (
            <p className="text-sm text-gray-500">
              {selectedDocuments.length} selected
            </p>
          )}
        </div>
        <button
          onClick={handleRefresh}
          disabled={isLoading}
          className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
          title="Refresh documents"
        >
          <svg 
            className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>

      {/* Error Display */}
      {displayError && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center space-x-2">
            <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm text-red-700">{displayError}</span>
          </div>
        </div>
      )}

      {/* Document List */}
      {documents.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📚</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No documents yet</h3>
          <p className="text-gray-500">
            Upload some documents to get started with your knowledge base.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {documents.map((document) => (
            <DocumentItem
              key={document.id}
              document={document}
              onDelete={handleDelete}
              onSelect={onDocumentSelect}
              selected={showSelection && selectedDocuments.includes(document.id)}
            />
          ))}
        </div>
      )}

      {/* Loading Overlay for Refresh */}
      {isLoading && documents.length > 0 && (
        <div className="absolute inset-0 bg-white bg-opacity-50 flex items-center justify-center">
          <div className="flex items-center space-x-2 text-gray-500">
            <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
            <span className="text-sm">Refreshing...</span>
          </div>
        </div>
      )}
    </div>
  );
}