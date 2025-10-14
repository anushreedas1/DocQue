'use client';

import { useState } from 'react';
import { FileUpload, DocumentList, SearchQuery, AnswerDisplay } from '@/components';
import type { QueryResponse } from '@/types';

export default function Home() {
  const [searchResults, setSearchResults] = useState<QueryResponse | null>(null);
  const [currentQuery, setCurrentQuery] = useState<string>('');

  const handleSearchResults = (results: QueryResponse) => {
    setSearchResults(results);
  };

  const handleQueryChange = (query: string) => {
    setCurrentQuery(query);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Knowledge Base Search Engine
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Upload documents and search with AI-powered answers
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Search Section */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Search Documents
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <SearchQuery onResults={handleSearchResults} onQueryChange={handleQueryChange} />
              <AnswerDisplay results={searchResults} query={currentQuery} />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Upload Section */}
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Upload Documents
                </h2>
                <FileUpload />
              </div>
            </div>

            {/* Document Management Section */}
            <div className="space-y-6">
              <DocumentList />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
