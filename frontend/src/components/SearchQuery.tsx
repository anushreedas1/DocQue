'use client';

import React, { useState } from 'react';
import { useApi } from '@/contexts/ApiContext';
import type { QueryResponse } from '@/types';

interface SearchQueryProps {
  onResults: (results: QueryResponse) => void;
  onQueryChange?: (query: string) => void;
  disabled?: boolean;
}

export function SearchQuery({ onResults, onQueryChange, disabled = false }: SearchQueryProps) {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const { submitQuery } = useApi();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!query.trim()) {
      setSearchError('Please enter a search query');
      return;
    }

    try {
      setIsSearching(true);
      setSearchError(null);
      
      const trimmedQuery = query.trim();
      onQueryChange?.(trimmedQuery);
      
      const results = await submitQuery(trimmedQuery);
      onResults(results);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Search failed';
      setSearchError(errorMessage);
    } finally {
      setIsSearching(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    // Clear error when user starts typing
    if (searchError) {
      setSearchError(null);
    }
  };

  const isDisabled = disabled || isSearching;

  return (
    <div className="w-full">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="search-query" className="block text-sm font-medium text-gray-700 mb-2">
            Search Query
          </label>
          <div className="relative">
            <input
              id="search-query"
              type="text"
              value={query}
              onChange={handleInputChange}
              placeholder="Ask a question about your documents..."
              disabled={isDisabled}
              className={`
                w-full px-4 py-3 border rounded-lg shadow-sm
                focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                disabled:bg-gray-100 disabled:cursor-not-allowed
                ${searchError ? 'border-red-300' : 'border-gray-300'}
              `}
            />
            {isSearching && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
              </div>
            )}
          </div>
        </div>

        {searchError && (
          <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-3">
            {searchError}
          </div>
        )}

        <button
          type="submit"
          disabled={isDisabled || !query.trim()}
          className={`
            w-full px-4 py-3 rounded-lg font-medium transition-colors
            ${
              isDisabled || !query.trim()
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
            }
          `}
        >
          {isSearching ? (
            <span className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Searching...
            </span>
          ) : (
            'Search Documents'
          )}
        </button>
      </form>
    </div>
  );
}