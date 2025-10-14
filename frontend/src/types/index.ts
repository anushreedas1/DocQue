/**
 * TypeScript type definitions for the Knowledge Base Search Engine
 */

// Re-export API types for convenience
export type {
    Document,
    UploadResponse,
    QueryRequest,
    QueryResponse,
} from '@/lib/api';

// Additional UI-specific types
export interface UploadProgress {
    file: File;
    progress: number;
    status: 'pending' | 'uploading' | 'success' | 'error';
    error?: string;
}

export interface SearchState {
    query: string;
    isSearching: boolean;
    results: QueryResponse | null;
    error: string | null;
}

export interface DocumentListState {
    documents: Document[];
    isLoading: boolean;
    error: string | null;
    selectedDocuments: string[];
}

// Component prop types
export interface FileUploadProps {
    onUpload: (files: File[]) => void;
    accept?: string;
    multiple?: boolean;
    maxSize?: number;
    disabled?: boolean;
}

export interface SearchInputProps {
    onSearch: (query: string) => void;
    placeholder?: string;
    disabled?: boolean;
    loading?: boolean;
}

export interface DocumentItemProps {
    document: Document;
    onDelete: (id: string) => void;
    onSelect?: (id: string) => void;
    selected?: boolean;
}

export interface AnswerDisplayProps {
    response: QueryResponse;
    loading?: boolean;
}

// Error handling types
export interface ErrorBoundaryState {
    hasError: boolean;
    error?: Error;
}

// Theme and styling types
export type ThemeMode = 'light' | 'dark' | 'system';

export interface ThemeConfig {
    mode: ThemeMode;
    primaryColor: string;
    accentColor: string;
}