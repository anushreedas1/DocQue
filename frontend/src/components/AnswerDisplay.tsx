'use client';

import React from 'react';
import type { QueryResponse } from '@/types';

interface AnswerDisplayProps {
  results: QueryResponse | null;
  loading?: boolean;
  query?: string;
}

export function AnswerDisplay({ results, loading = false, query }: AnswerDisplayProps) {
  // Loading state
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="animate-pulse">
          <div className="flex items-center mb-4">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500 mr-2"></div>
            <div className="h-4 bg-gray-200 rounded w-32"></div>
          </div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded w-full"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            <div className="h-4 bg-gray-200 rounded w-4/6"></div>
          </div>
        </div>
      </div>
    );
  }

  // No results state
  if (!results) {
    return (
      <div className="bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 p-8 text-center">
        <div className="text-gray-400 mb-2">
          <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-1">No search results yet</h3>
        <p className="text-gray-500">
          Enter a question above to search through your uploaded documents
        </p>
      </div>
    );
  }

  // Empty answer state
  if (!results.answer || results.answer.trim() === '') {
    return (
      <div className="bg-yellow-50 rounded-lg border border-yellow-200 p-6">
        <div className="flex items-start">
          <div className="text-yellow-400 mr-3 mt-0.5">
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-medium text-yellow-800 mb-1">
              No relevant information found
            </h3>
            <p className="text-sm text-yellow-700">
              {query ? `No relevant content was found for "${query}".` : 'No relevant content was found for your query.'}
              {' '}Try rephrasing your question or uploading more documents.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center">
          <div className="text-green-500 mr-2">
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900">Answer</h3>
          {results.confidence !== undefined && (
            <span className={`ml-auto text-xs px-2 py-1 rounded-full ${
              results.confidence > 0.8 
                ? 'bg-green-100 text-green-800' 
                : results.confidence > 0.6 
                ? 'bg-yellow-100 text-yellow-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              {Math.round(results.confidence * 100)}% confidence
            </span>
          )}
        </div>
      </div>

      {/* Answer Content */}
      <div className="px-6 py-4">
        <div className="prose prose-sm max-w-none">
          <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">
            {results.answer}
          </p>
        </div>
      </div>

      {/* Sources */}
      {results.sources && results.sources.length > 0 && (
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <h4 className="text-sm font-medium text-gray-700 mb-2">
            Sources ({results.sources.length})
          </h4>
          <div className="space-y-2">
            {results.sources.map((source, index) => (
              <div key={index} className="text-sm text-gray-600 bg-white rounded border p-2">
                <div className="flex items-start">
                  <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-blue-100 text-blue-800 text-xs font-medium mr-2 mt-0.5 flex-shrink-0">
                    {index + 1}
                  </span>
                  <span className="break-words">{source}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}