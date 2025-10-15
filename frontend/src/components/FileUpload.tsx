'use client';

import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApi } from '@/contexts/ApiContext';
import { Upload, File, CheckCircle, XCircle, Loader2, Cloud } from 'lucide-react';

interface FileUploadProps {
  onUpload?: (files: File[]) => void;
  accept?: string;
  multiple?: boolean;
  maxSize?: number;
  disabled?: boolean;
}

interface UploadProgress {
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
}

export default function FileUpload({
  onUpload,
  accept = '.pdf,.txt',
  multiple = true,
  maxSize = 10 * 1024 * 1024, // 10MB default
  disabled = false,
}: FileUploadProps) {
  const { uploadDocument } = useApi();
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = useCallback((file: File): string | null => {
    // Check file size
    if (file.size > maxSize) {
      return `File size exceeds ${Math.round(maxSize / (1024 * 1024))}MB limit`;
    }

    // Check file type
    const allowedTypes = accept.split(',').map(type => type.trim());
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    const mimeType = file.type;

    const isValidExtension = allowedTypes.some(type => 
      type.startsWith('.') ? type === fileExtension : type === mimeType
    );

    if (!isValidExtension) {
      return `File type not supported. Allowed types: ${accept}`;
    }

    return null;
  }, [accept, maxSize]);

  const handleFiles = useCallback(async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    const validFiles: File[] = [];
    const initialProgress: UploadProgress[] = [];

    // Validate files and create initial progress state
    fileArray.forEach(file => {
      const error = validateFile(file);
      if (error) {
        initialProgress.push({
          file,
          progress: 0,
          status: 'error',
          error,
        });
      } else {
        validFiles.push(file);
        initialProgress.push({
          file,
          progress: 0,
          status: 'pending',
        });
      }
    });

    setUploadProgress(initialProgress);

    // Upload valid files
    for (let i = 0; i < validFiles.length; i++) {
      const file = validFiles[i];
      const progressIndex = fileArray.indexOf(file);

      try {
        // Update status to uploading
        setUploadProgress(prev => prev.map((item, index) => 
          index === progressIndex 
            ? { ...item, status: 'uploading', progress: 0 }
            : item
        ));

        // Simulate progress updates (since we don't have real progress from the API)
        const progressInterval = setInterval(() => {
          setUploadProgress(prev => prev.map((item, index) => 
            index === progressIndex && item.status === 'uploading'
              ? { ...item, progress: Math.min(item.progress + 10, 90) }
              : item
          ));
        }, 100);

        // Upload the file
        await uploadDocument(file);

        // Clear progress interval and mark as success
        clearInterval(progressInterval);
        setUploadProgress(prev => prev.map((item, index) => 
          index === progressIndex 
            ? { ...item, status: 'success', progress: 100 }
            : item
        ));

      } catch (error) {
        // Mark as error
        setUploadProgress(prev => prev.map((item, index) => 
          index === progressIndex 
            ? { 
                ...item, 
                status: 'error', 
                progress: 0,
                error: error instanceof Error ? error.message : 'Upload failed'
              }
            : item
        ));
      }
    }

    // Call onUpload callback if provided
    if (onUpload) {
      onUpload(validFiles);
    }

    // Clear progress after 3 seconds for successful uploads
    setTimeout(() => {
      setUploadProgress(prev => prev.filter(item => item.status !== 'success'));
    }, 3000);
  }, [validateFile, uploadDocument, onUpload]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      setIsDragOver(true);
    }
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    if (disabled) return;

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFiles(files);
    }
  }, [disabled, handleFiles]);

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFiles(files);
    }
    // Reset input value to allow selecting the same file again
    e.target.value = '';
  }, [handleFiles]);

  const handleClick = useCallback(() => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  }, [disabled]);

  const getStatusColor = (status: UploadProgress['status']) => {
    switch (status) {
      case 'success':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'error':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'uploading':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusIcon = (status: UploadProgress['status']) => {
    switch (status) {
      case 'success':
        return '✓';
      case 'error':
        return '✗';
      case 'uploading':
        return '⟳';
      default:
        return '📄';
    }
  };

  return (
    <div className="w-full">
      {/* File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={handleFileInputChange}
        className="hidden"
        disabled={disabled}
      />

      {/* Drop Zone */}
      <motion.div
        onClick={handleClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          relative border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer
          transition-all duration-300 ease-in-out glass-card
          ${disabled 
            ? 'cursor-not-allowed opacity-50' 
            : isDragOver
              ? 'border-blue-400/50 bg-blue-500/10 scale-[1.02] neon-blue'
              : 'border-white/20 hover:border-white/40 hover:bg-white/5'
          }
        `}
        whileHover={!disabled ? { scale: 1.02, y: -2 } : {}}
        whileTap={!disabled ? { scale: 0.98 } : {}}
        animate={isDragOver ? { 
          boxShadow: "0 0 30px rgba(59, 130, 246, 0.3)",
          borderColor: "rgba(59, 130, 246, 0.5)"
        } : {}}
      >
        <div className="flex flex-col items-center space-y-6">
          <motion.div
            animate={isDragOver ? { 
              scale: [1, 1.2, 1],
              rotate: [0, 10, -10, 0]
            } : { scale: 1, rotate: 0 }}
            transition={{ duration: 0.5 }}
            className="relative"
          >
            {isDragOver ? (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="p-4 glass rounded-full"
              >
                <Cloud className="w-12 h-12 text-blue-400" />
              </motion.div>
            ) : (
              <motion.div
                className="p-4 glass rounded-full group-hover:bg-white/10 transition-colors"
                whileHover={{ rotate: 5 }}
              >
                <Upload className="w-12 h-12 text-white/80" />
              </motion.div>
            )}
            
            {/* Floating particles around upload icon */}
            {isDragOver && (
              <>
                {[...Array(6)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute w-2 h-2 bg-blue-400 rounded-full"
                    initial={{ 
                      x: 0, 
                      y: 0, 
                      scale: 0,
                      opacity: 0 
                    }}
                    animate={{ 
                      x: Math.cos(i * 60 * Math.PI / 180) * 40,
                      y: Math.sin(i * 60 * Math.PI / 180) * 40,
                      scale: [0, 1, 0],
                      opacity: [0, 1, 0]
                    }}
                    transition={{ 
                      duration: 1.5,
                      repeat: Infinity,
                      delay: i * 0.1
                    }}
                  />
                ))}
              </>
            )}
          </motion.div>
          
          <div className="space-y-2">
            <motion.p 
              className="text-xl font-semibold text-white"
              animate={isDragOver ? { scale: 1.05 } : { scale: 1 }}
            >
              {isDragOver ? 'Drop files here!' : 'Upload Documents'}
            </motion.p>
            <p className="text-white/70">
              Drag and drop files here, or click to select
            </p>
            <div className="flex items-center justify-center space-x-4 text-xs text-white/50">
              <span>Formats: {accept}</span>
              <span>•</span>
              <span>Max: {Math.round(maxSize / (1024 * 1024))}MB</span>
            </div>
          </div>
        </div>

        {/* Animated border gradient */}
        <motion.div
          className="absolute inset-0 rounded-2xl opacity-0 pointer-events-none"
          style={{
            background: 'linear-gradient(45deg, #667eea, #764ba2, #f093fb, #f5576c)',
            backgroundSize: '400% 400%',
          }}
          animate={isDragOver ? {
            opacity: 0.2,
            backgroundPosition: ['0% 50%', '100% 50%', '0% 50%']
          } : { opacity: 0 }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      </motion.div>

      {/* Upload Progress */}
      <AnimatePresence>
        {uploadProgress.length > 0 && (
          <motion.div 
            className="mt-6 space-y-3"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <h4 className="text-sm font-medium text-white/80 flex items-center space-x-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Upload Progress</span>
            </h4>
            
            {uploadProgress.map((item, index) => (
              <motion.div
                key={`${item.file.name}-${index}`}
                className="glass-card rounded-xl p-4 border border-white/10"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ delay: index * 0.1 }}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-3">
                    <div className="p-1 glass rounded-lg">
                      {item.status === 'success' && <CheckCircle className="w-4 h-4 text-green-400" />}
                      {item.status === 'error' && <XCircle className="w-4 h-4 text-red-400" />}
                      {item.status === 'uploading' && <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />}
                      {item.status === 'pending' && <File className="w-4 h-4 text-white/60" />}
                    </div>
                    <div>
                      <span className="text-sm font-medium text-white truncate max-w-xs block">
                        {item.file.name}
                      </span>
                      <span className="text-xs text-white/50">
                        {Math.round(item.file.size / 1024)}KB
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {item.status === 'uploading' && (
                      <span className="text-xs text-blue-400 font-medium">
                        {item.progress}%
                      </span>
                    )}
                    {item.status === 'success' && (
                      <span className="text-xs text-green-400 font-medium">
                        Complete
                      </span>
                    )}
                  </div>
                </div>
                
                {/* Progress Bar */}
                {item.status === 'uploading' && (
                  <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${item.progress}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                )}
                
                {/* Error Message */}
                {item.error && (
                  <motion.div 
                    className="mt-2 text-xs text-red-400 bg-red-500/10 rounded-lg p-2 border border-red-500/20"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                  >
                    {item.error}
                  </motion.div>
                )}
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}