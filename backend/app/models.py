"""Data models for the knowledge base search engine"""

from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime


class Document(BaseModel):
    """Document model for storing uploaded documents"""
    id: str
    filename: str
    content: str
    chunks: List[str] = []
    upload_date: datetime


class DocumentChunk(BaseModel):
    """Model for document chunks with embeddings"""
    document_id: str
    chunk_index: int
    content: str
    embedding: Optional[List[float]] = None


class QueryRequest(BaseModel):
    """Request model for search queries"""
    query: str
    max_results: int = 5


class QueryResponse(BaseModel):
    """Response model for query results"""
    answer: str
    sources: List[str] = []
    confidence: Optional[float] = None