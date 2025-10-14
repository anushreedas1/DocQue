"""In-memory storage for documents and embeddings"""

from typing import Dict, List, Optional
from .models import Document, DocumentChunk
import uuid
from datetime import datetime


class DocumentStorage:
    """In-memory storage for documents and their chunks"""
    
    def __init__(self):
        self.documents: Dict[str, Document] = {}
        self.chunks: Dict[str, List[DocumentChunk]] = {}
    
    def store_document(self, filename: str, content: str) -> str:
        """Store a document and return its ID"""
        doc_id = str(uuid.uuid4())
        document = Document(
            id=doc_id,
            filename=filename,
            content=content,
            chunks=[],
            upload_date=datetime.now()
        )
        self.documents[doc_id] = document
        self.chunks[doc_id] = []
        return doc_id
    
    def get_document(self, doc_id: str) -> Optional[Document]:
        """Retrieve a document by ID"""
        return self.documents.get(doc_id)
    
    def get_all_documents(self) -> List[Document]:
        """Get all stored documents"""
        return list(self.documents.values())
    
    def delete_document(self, doc_id: str) -> bool:
        """Delete a document and its chunks"""
        if doc_id in self.documents:
            del self.documents[doc_id]
            if doc_id in self.chunks:
                del self.chunks[doc_id]
            return True
        return False
    
    def store_chunks(self, doc_id: str, chunks: List[DocumentChunk]):
        """Store chunks for a document"""
        if doc_id in self.documents:
            self.chunks[doc_id] = chunks
            # Update the document's chunks list with content
            self.documents[doc_id].chunks = [chunk.content for chunk in chunks]
    
    def get_chunks(self, doc_id: str) -> List[DocumentChunk]:
        """Get all chunks for a document"""
        return self.chunks.get(doc_id, [])
    
    def get_all_chunks(self) -> List[DocumentChunk]:
        """Get all chunks from all documents"""
        all_chunks = []
        for chunks in self.chunks.values():
            all_chunks.extend(chunks)
        return all_chunks
    
    def search_chunks_by_similarity(self, query_embedding: List[float], max_results: int = 5) -> List[DocumentChunk]:
        """Search chunks by embedding similarity using cosine similarity"""
        import math
        
        all_chunks = self.get_all_chunks()
        
        # Filter chunks that have embeddings
        chunks_with_embeddings = [chunk for chunk in all_chunks if chunk.embedding is not None]
        
        if not chunks_with_embeddings:
            return []
        
        # Calculate cosine similarity for each chunk
        similarities = []
        for chunk in chunks_with_embeddings:
            similarity = self._cosine_similarity(query_embedding, chunk.embedding)
            similarities.append((chunk, similarity))
        
        # Sort by similarity (descending) and return top results
        similarities.sort(key=lambda x: x[1], reverse=True)
        return [chunk for chunk, _ in similarities[:max_results]]
    
    def _cosine_similarity(self, vec1: List[float], vec2: List[float]) -> float:
        """Calculate cosine similarity between two vectors"""
        import math
        
        # Calculate dot product
        dot_product = sum(a * b for a, b in zip(vec1, vec2))
        
        # Calculate magnitudes
        magnitude1 = math.sqrt(sum(a * a for a in vec1))
        magnitude2 = math.sqrt(sum(a * a for a in vec2))
        
        # Avoid division by zero
        if magnitude1 == 0 or magnitude2 == 0:
            return 0
        
        return dot_product / (magnitude1 * magnitude2)


# Global storage instance
document_storage = DocumentStorage()