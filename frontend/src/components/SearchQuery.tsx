'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApi } from '@/contexts/ApiContext';
import type { QueryResponse } from '@/types';
import { Search, Sparkles, AlertCircle, Loader2, Send } from 'lucide-react';

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
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="search-query" className="block text-sm font-medium text-white/80 mb-3 flex items-center space-x-2">
            <Search className="w-4 h-4" />
            <span>Ask anything about your documents</span>
          </label>
          
          <div className="relative group">
            <motion.input
              id="search-query"
              type="text"
              value={query}
              onChange={handleInputChange}
              placeholder="What would you like to know?"
              disabled={isDisabled}
              className={`
                w-full px-6 py-4 glass-card rounded-xl text-white placeholder-white/50
                focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400/50
                disabled:cursor-not-allowed disabled:opacity-50
                transition-all duration-300
                ${searchError ? 'ring-2 ring-red-400/50 border-red-400/50' : 'border-white/20'}
              `}
              whileFocus={{ scale: 1.02 }}
              animate={isSearching ? { 
                boxShadow: "0 0 20px rgba(59, 130, 246, 0.3)" 
              } : {}}
            />
            
            {/* Animated border */}
            <motion.div
              className="absolute inset-0 rounded-xl pointer-events-none"
              style={{
                background: 'linear-gradient(45deg, #667eea, #764ba2, #f093fb, #f5576c)',
                backgroundSize: '400% 400%',
                padding: '2px',
                mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                maskComposite: 'xor',
                WebkitMaskComposite: 'xor',
              }}
              animate={query ? {
                backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
                opacity: [0, 0.5, 0]
              } : { opacity: 0 }}
              transition={{ duration: 3, repeat: Infinity }}
            />
            
            {/* Search icon or loading spinner */}
            <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
              <AnimatePresence mode="wait">
                {isSearching ? (
                  <motion.div
                    key="loading"
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0 }}
                  >
                    <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
                  </motion.div>
                ) : (
                  <motion.div
                    key="search"
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0 }}
                    className="p-1 glass rounded-lg"
                  >
                    <Sparkles className="w-4 h-4 text-white/60" />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Error Message */}
        <AnimatePresence>
          {searchError && (
            <motion.div 
              className="glass-card rounded-xl p-4 border border-red-400/30 bg-red-500/10"
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
            >
              <div className="flex items-center space-x-2 text-red-400">
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm">{searchError}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Submit Button */}
        <motion.button
          type="submit"
          disabled={isDisabled || !query.trim()}
          className={`
            w-full px-6 py-4 rounded-xl font-semibold transition-all duration-300
            relative overflow-hidden group
            ${
              isDisabled || !query.trim()
                ? 'glass cursor-not-allowed opacity-50 text-white/50'
                : 'glass-card text-white hover:scale-[1.02] hover:shadow-lg'
            }
          `}
          whileHover={!isDisabled && query.trim() ? { 
            scale: 1.02,
            boxShadow: "0 0 25px rgba(99, 102, 241, 0.4)"
          } : {}}
          whileTap={!isDisabled && query.trim() ? { scale: 0.98 } : {}}
        >
          {/* Button background gradient */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 opacity-0 group-hover:opacity-20 transition-opacity duration-300"
            animate={isSearching ? { opacity: [0, 0.3, 0] } : {}}
            transition={{ duration: 2, repeat: Infinity }}
          />
          
          <div className="relative z-10 flex items-center justify-center space-x-2">
            <AnimatePresence mode="wait">
              {isSearching ? (
                <motion.div
                  key="searching"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center space-x-2"
                >
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Analyzing documents...</span>
                </motion.div>
              ) : (
                <motion.div
                  key="search"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center space-x-2"
                >
                  <Send className="w-5 h-5" />
                  <span>Search with AI</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.button>
      </form>
    </div>
  );
}