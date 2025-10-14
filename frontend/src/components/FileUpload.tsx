'use client';

import React, { useState, useRef, useCallback } from 'react';
import { useApi } from '@/contexts/ApiContext';

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
      <div
        onClick={handleClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
          transition-all duration-200 ease-in-out
          ${disabled 
            ? 'border-gray-200 bg-gray-50 cursor-not-allowed opacity-50' 
            : isDragOver
              ? 'border-blue-400 bg-blue-50 scale-[1.02]'
              : 'border-gray-300 bg-gray-50 hover:border-gray-400 hover:bg-gray-100'
          }
        `}
      >
        <div className="flex flex-col items-center space-y-4">
          <div className="text-4xl">
            {isDragOver ? '📂' : '📁'}
          </div>
          <div>
            <p className="text-lg font-medium text-gray-700">
              {isDragOver ? 'Drop files here' : 'Upload Documents'}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              Drag and drop files here, or click to select
            </p>
            <p className="text-xs text-gray-400 mt-2">
              Supported formats: {accept} • Max size: {Math.round(maxSize / (1024 * 1024))}MB
            </p>
          </div>
        </div>
      </div>

      {/* Upload Progress */}
      {uploadProgress.length > 0 && (
        <div className="mt-4 space-y-2">
          <h4 className="text-sm font-medium text-gray-700">Upload Progress</h4>
          {uploadProgress.map((item, index) => (
            <div
              key={`${item.file.name}-${index}`}
              className={`p-3 rounded-lg border ${getStatusColor(item.status)}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-lg">{getStatusIcon(item.status)}</span>
                  <span className="text-sm font-medium truncate max-w-xs">
                    {item.file.name}
                  </span>
                  <span className="text-xs text-gray-500">
                    ({Math.round(item.file.size / 1024)}KB)
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  {item.status === 'uploading' && (
                    <div className="text-xs">{item.progress}%</div>
                  )}
                  {item.status === 'success' && (
                    <div className="text-xs">Complete</div>
                  )}
                </div>
              </div>
              
              {/* Progress Bar */}
              {item.status === 'uploading' && (
                <div className="mt-2 w-full bg-gray-200 rounded-full h-1.5">
                  <div
                    className="bg-blue-500 h-1.5 rounded-full transition-all duration-300"
                    style={{ width: `${item.progress}%` }}
                  />
                </div>
              )}
              
              {/* Error Message */}
              {item.error && (
                <div className="mt-2 text-xs text-red-600">
                  {item.error}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}