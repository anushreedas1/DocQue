'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApi } from '@/contexts/ApiContext';
import { Document } from '@/lib/api';
import { FileText, Trash2, RefreshCw, AlertCircle, Calendar, Eye, Download } from 'lucide-react';

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
    <motion.div
      className={`
        glass-card rounded-xl p-4 relative overflow-hidden group
        transition-all duration-300
        ${selected 
          ? 'ring-2 ring-blue-400/50 bg-blue-500/10' 
          : 'hover:scale-[1.02] hover:shadow-lg'
        }
        ${isDeleting ? 'opacity-50 pointer-events-none' : ''}
      `}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      whileHover={{ y: -2 }}
      layout
    >
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      <div className="relative z-10">
        <div className="flex items-center justify-between">
          <motion.div 
            className="flex items-center space-x-4 flex-1 cursor-pointer"
            onClick={() => onSelect?.(document.id)}
            whileHover={{ x: 5 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <motion.div
              className="p-3 glass rounded-lg"
              whileHover={{ scale: 1.1, rotate: 5 }}
            >
              <FileText className="w-6 h-6 text-blue-400" />
            </motion.div>
            
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-white truncate mb-1">
                {document.filename}
              </h3>
              <div className="flex items-center space-x-2 text-xs text-white/60">
                <Calendar className="w-3 h-3" />
                <span>Uploaded {formatDate(document.upload_date)}</span>
              </div>
            </div>
          </motion.div>

          <div className="flex items-center space-x-2 ml-4">
            {/* Action Buttons */}
            <motion.button
              className="p-2 glass rounded-lg text-white/60 hover:text-blue-400 transition-colors"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              title="View document"
            >
              <Eye className="w-4 h-4" />
            </motion.button>

            {/* Delete Button */}
            <AnimatePresence mode="wait">
              {!showDeleteConfirm ? (
                <motion.button
                  key="delete"
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="p-2 glass rounded-lg text-white/60 hover:text-red-400 transition-colors"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  title="Delete document"
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0 }}
                >
                  {isDeleting ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    >
                      <RefreshCw className="w-4 h-4" />
                    </motion.div>
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                </motion.button>
              ) : (
                <motion.div
                  key="confirm"
                  className="flex items-center space-x-2"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                >
                  <motion.button
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="px-3 py-1 text-xs bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Confirm
                  </motion.button>
                  <motion.button
                    onClick={handleCancelDelete}
                    disabled={isDeleting}
                    className="px-3 py-1 text-xs glass text-white/80 rounded-lg hover:bg-white/10 transition-colors"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Cancel
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Document Content Preview */}
        {document.content && (
          <motion.div 
            className="mt-4 pt-4 border-t border-white/10"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            transition={{ delay: 0.2 }}
          >
            <div className="flex items-center space-x-2 mb-2">
              <Eye className="w-3 h-3 text-white/50" />
              <span className="text-xs text-white/50">Preview</span>
            </div>
            <p className="text-xs text-white/70 line-clamp-3 leading-relaxed">
              {document.content.substring(0, 200)}
              {document.content.length > 200 ? '...' : ''}
            </p>
          </motion.div>
        )}
      </div>
    </motion.div>
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
  const { documents: rawDocuments, isLoading, error, deleteDocument, refreshDocuments } = useApi();
  const [localError, setLocalError] = useState<string | null>(null);
  
  // Ensure documents is always an array
  const documents = Array.isArray(rawDocuments) ? rawDocuments : [];

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
      <motion.div 
        className="flex items-center justify-center py-12"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <div className="flex items-center space-x-3 text-white/70">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="p-2 glass rounded-lg"
          >
            <RefreshCw className="w-5 h-5 text-blue-400" />
          </motion.div>
          <span className="text-lg">Loading documents...</span>
        </div>
      </motion.div>
    );
  }

  const displayError = localError || error;

  return (
    <div className="w-full">
      {/* Header */}
      <motion.div 
        className="flex items-center justify-between mb-6"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div>
          <h2 className="text-xl font-bold text-white flex items-center space-x-2">
            <FileText className="w-6 h-6 text-purple-400" />
            <span>Documents</span>
            <motion.span
              className="px-2 py-1 text-sm glass rounded-full text-purple-300"
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              {documents.length}
            </motion.span>
          </h2>
          {showSelection && selectedDocuments.length > 0 && (
            <motion.p 
              className="text-sm text-white/60 mt-1"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              {selectedDocuments.length} selected
            </motion.p>
          )}
        </div>
        
        <motion.button
          onClick={handleRefresh}
          disabled={isLoading}
          className="p-3 glass rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
          whileHover={{ scale: 1.05, rotate: 5 }}
          whileTap={{ scale: 0.95 }}
          title="Refresh documents"
        >
          <motion.div
            animate={isLoading ? { rotate: 360 } : { rotate: 0 }}
            transition={isLoading ? { duration: 1, repeat: Infinity, ease: "linear" } : {}}
          >
            <RefreshCw className="w-5 h-5" />
          </motion.div>
        </motion.button>
      </motion.div>

      {/* Error Display */}
      <AnimatePresence>
        {displayError && (
          <motion.div 
            className="mb-6 glass-card rounded-xl p-4 border border-red-400/30 bg-red-500/10"
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
          >
            <div className="flex items-center space-x-3">
              <AlertCircle className="w-5 h-5 text-red-400" />
              <span className="text-sm text-red-300">{displayError}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Document List */}
      <AnimatePresence mode="wait">
        {documents.length === 0 ? (
          <motion.div 
            className="text-center py-16"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
          >
            <motion.div
              className="mx-auto w-24 h-24 glass rounded-full flex items-center justify-center mb-6"
              animate={{ 
                scale: [1, 1.1, 1],
                rotate: [0, 5, -5, 0]
              }}
              transition={{ duration: 4, repeat: Infinity }}
            >
              <FileText className="w-12 h-12 text-white/40" />
            </motion.div>
            
            <h3 className="text-2xl font-bold text-white mb-3">No documents yet</h3>
            <p className="text-white/70 max-w-md mx-auto">
              Upload some documents to get started with your AI-powered knowledge base.
            </p>
            
            {/* Floating elements */}
            {[...Array(3)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-2 h-2 bg-white/20 rounded-full"
                style={{
                  left: `${40 + i * 20}%`,
                  top: `${60 + (i % 2) * 10}%`,
                }}
                animate={{
                  y: [0, -20, 0],
                  opacity: [0.3, 1, 0.3],
                }}
                transition={{
                  duration: 3 + i,
                  repeat: Infinity,
                  delay: i * 0.5,
                }}
              />
            ))}
          </motion.div>
        ) : (
          <motion.div 
            className="space-y-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <AnimatePresence>
              {documents.map((document, index) => (
                <motion.div
                  key={document.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20, scale: 0.95 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <DocumentItem
                    document={document}
                    onDelete={handleDelete}
                    onSelect={onDocumentSelect}
                    selected={showSelection && selectedDocuments.includes(document.id)}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loading Overlay for Refresh */}
      <AnimatePresence>
        {isLoading && documents.length > 0 && (
          <motion.div 
            className="absolute inset-0 glass rounded-2xl flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="flex items-center space-x-3 text-white">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="p-2 glass rounded-lg"
              >
                <RefreshCw className="w-5 h-5 text-blue-400" />
              </motion.div>
              <span className="text-lg">Refreshing...</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}