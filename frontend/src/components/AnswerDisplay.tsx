'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { QueryResponse } from '@/types';
import { CheckCircle, AlertTriangle, Search, BookOpen, Sparkles, Brain, FileText } from 'lucide-react';

interface AnswerDisplayProps {
  results: QueryResponse | null;
  loading?: boolean;
  query?: string;
}

export function AnswerDisplay({ results, loading = false, query }: AnswerDisplayProps) {
  // Loading state
  if (loading) {
    return (
      <motion.div
        className="glass-card rounded-2xl p-6 relative overflow-hidden"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 animate-pulse" />

        <div className="relative z-10">
          <div className="flex items-center mb-6">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="p-2 glass rounded-lg mr-3"
            >
              <Brain className="w-5 h-5 text-blue-400" />
            </motion.div>
            <div className="space-y-2 flex-1">
              <motion.div
                className="h-4 bg-white/20 rounded-lg w-32"
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
              <motion.div
                className="h-3 bg-white/10 rounded-lg w-24"
                animate={{ opacity: [0.3, 0.7, 0.3] }}
                transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }}
              />
            </div>
          </div>

          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <motion.div
                key={i}
                className="h-4 bg-white/10 rounded-lg"
                style={{ width: `${100 - i * 15}%` }}
                animate={{ opacity: [0.3, 0.7, 0.3] }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  delay: i * 0.2
                }}
              />
            ))}
          </div>
        </div>
      </motion.div>
    );
  }

  // No results state
  if (!results) {
    return (
      <motion.div
        className="glass-card rounded-2xl p-8 text-center relative overflow-hidden"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-white/10" />

        <div className="relative z-10">
          <motion.div
            className="mx-auto w-16 h-16 glass rounded-full flex items-center justify-center mb-4"
            animate={{
              scale: [1, 1.1, 1],
              rotate: [0, 5, -5, 0]
            }}
            transition={{ duration: 4, repeat: Infinity }}
          >
            <Search className="w-8 h-8 text-white/60" />
          </motion.div>

          <h3 className="text-xl font-semibold text-white mb-2">Ready to Search</h3>
          <p className="text-white/70">
            Ask me anything about your uploaded documents and I'll find the answers for you
          </p>

          {/* Floating particles */}
          {[...Array(5)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-white/30 rounded-full"
              style={{
                left: `${20 + i * 15}%`,
                top: `${30 + (i % 2) * 20}%`,
              }}
              animate={{
                y: [0, -10, 0],
                opacity: [0.3, 1, 0.3],
              }}
              transition={{
                duration: 2 + i * 0.5,
                repeat: Infinity,
                delay: i * 0.3,
              }}
            />
          ))}
        </div>
      </motion.div>
    );
  }

  // Empty answer state
  if (!results.answer || results.answer.trim() === '') {
    return (
      <motion.div
        className="glass-card rounded-2xl p-6 border border-yellow-400/30 bg-yellow-500/10"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex items-start">
          <motion.div
            className="p-2 glass rounded-lg mr-3 mt-1"
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <AlertTriangle className="w-5 h-5 text-yellow-400" />
          </motion.div>
          <div>
            <h3 className="text-lg font-semibold text-yellow-300 mb-2">
              No relevant information found
            </h3>
            <p className="text-yellow-200/80">
              {query ? `I couldn't find relevant content for "${query}".` : 'No relevant content was found for your query.'}
              {' '}Try rephrasing your question or uploading more documents.
            </p>
          </div>
        </div>
      </motion.div>
    );
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence > 0.8) return 'from-green-400 to-emerald-400';
    if (confidence > 0.6) return 'from-yellow-400 to-orange-400';
    return 'from-red-400 to-pink-400';
  };

  const getConfidenceText = (confidence: number) => {
    if (confidence > 0.8) return 'High Confidence';
    if (confidence > 0.6) return 'Medium Confidence';
    return 'Low Confidence';
  };

  return (
    <AnimatePresence mode="wait">
      <motion.div
        className="glass-card rounded-2xl overflow-hidden relative"
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.95 }}
        transition={{ duration: 0.5, type: "spring", stiffness: 100 }}
      >
        {/* Animated background gradient */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10"
          animate={{
            background: [
              'linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(139, 92, 246, 0.1))',
              'linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(236, 72, 153, 0.1))',
              'linear-gradient(135deg, rgba(236, 72, 153, 0.1), rgba(59, 130, 246, 0.1))'
            ]
          }}
          transition={{ duration: 5, repeat: Infinity }}
        />

        {/* Header */}
        <div className="relative z-10 px-6 py-4 border-b border-white/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <motion.div
                className="p-2 glass rounded-lg"
                whileHover={{ scale: 1.1, rotate: 5 }}
              >
                <CheckCircle className="w-5 h-5 text-green-400" />
              </motion.div>
              <div>
                <h3 className="text-lg font-semibold text-white flex items-center space-x-2">
                  <span>AI Answer</span>
                  <Sparkles className="w-4 h-4 text-blue-400" />
                </h3>
                {query && (
                  <p className="text-sm text-white/60 line-clamp-1">
                    "{query}"
                  </p>
                )}
              </div>
            </div>

            {results.confidence !== undefined && (
              <motion.div
                className={`px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r ${getConfidenceColor(results.confidence)} text-white`}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
                whileHover={{ scale: 1.05 }}
              >
                {getConfidenceText(results.confidence)} • {Math.round(results.confidence * 100)}%
              </motion.div>
            )}
          </div>
        </div>

        {/* Answer Content */}
        <div className="relative z-10 px-6 py-6">
          <motion.div
            className="prose prose-invert max-w-none"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <motion.p
              className="text-white/90 leading-relaxed whitespace-pre-wrap text-base"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.8 }}
            >
              {results.answer}
            </motion.p>
          </motion.div>
        </div>

        {/* Sources */}
        {results.sources && results.sources.length > 0 && (
          <motion.div
            className="relative z-10 px-6 py-4 border-t border-white/10 bg-white/5"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
          >
            <div className="flex items-center space-x-2 mb-3">
              <BookOpen className="w-4 h-4 text-white/70" />
              <h4 className="text-sm font-medium text-white/80">
                Sources ({results.sources.length})
              </h4>
            </div>

            <div className="space-y-2">
              {results.sources.map((source, index) => (
                <motion.div
                  key={index}
                  className="glass-card rounded-lg p-3 border border-white/10"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 + index * 0.1, duration: 0.3 }}
                  whileHover={{ scale: 1.02, x: 5 }}
                >
                  <div className="flex items-start space-x-3">
                    <motion.div
                      className="flex-shrink-0 w-6 h-6 rounded-full bg-gradient-to-r from-blue-400 to-purple-400 flex items-center justify-center text-white text-xs font-bold"
                      whileHover={{ scale: 1.1 }}
                    >
                      {index + 1}
                    </motion.div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <FileText className="w-3 h-3 text-white/60" />
                        <span className="text-xs text-white/60">Document Reference</span>
                      </div>
                      <p className="text-sm text-white/80 break-words leading-relaxed">
                        {source}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}