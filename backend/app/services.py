"""Services for document processing, chunking, and embedding generation"""

from typing import List
import re
import os
from sentence_transformers import SentenceTransformer
from openai import OpenAI
from .models import DocumentChunk
from .storage import document_storage


class DocumentProcessor:
    """Service for processing documents, chunking, and generating embeddings"""
    
    def __init__(self, model_name: str = "all-MiniLM-L6-v2"):
        """Initialize with a sentence transformer model"""
        self.embedding_model = SentenceTransformer(model_name)
        self.chunk_size = 500  # characters per chunk
        self.chunk_overlap = 50  # overlap between chunks
    
    def chunk_text(self, text: str) -> List[str]:
        """Split text into overlapping chunks"""
        # Clean the text
        text = self._clean_text(text)
        
        if len(text) <= self.chunk_size:
            return [text]
        
        chunks = []
        start = 0
        
        while start < len(text):
            # Calculate end position
            end = start + self.chunk_size
            
            # If this isn't the last chunk, try to break at a sentence or word boundary
            if end < len(text):
                # Look for sentence endings within the last 100 characters
                sentence_end = text.rfind('.', start, end)
                if sentence_end > start + self.chunk_size // 2:
                    end = sentence_end + 1
                else:
                    # Look for word boundaries
                    word_end = text.rfind(' ', start, end)
                    if word_end > start + self.chunk_size // 2:
                        end = word_end
            
            chunk = text[start:end].strip()
            if chunk:
                chunks.append(chunk)
            
            # Move start position with overlap
            start = end - self.chunk_overlap
            
            # Prevent infinite loop
            if start >= end:
                start = end
        
        return chunks
    
    def _clean_text(self, text: str) -> str:
        """Clean and normalize text"""
        # Remove excessive whitespace
        text = re.sub(r'\s+', ' ', text)
        # Remove special characters that might interfere with processing
        text = re.sub(r'[^\w\s\.\,\!\?\;\:\-\(\)]', ' ', text)
        return text.strip()
    
    def generate_embeddings(self, texts: List[str]) -> List[List[float]]:
        """Generate embeddings for a list of texts"""
        embeddings = self.embedding_model.encode(texts)
        return embeddings.tolist()
    
    def process_document(self, doc_id: str) -> bool:
        """Process a document: chunk it and generate embeddings"""
        document = document_storage.get_document(doc_id)
        if not document:
            return False
        
        # Chunk the document
        chunks = self.chunk_text(document.content)
        
        # Generate embeddings for chunks
        embeddings = self.generate_embeddings(chunks)
        
        # Create DocumentChunk objects
        document_chunks = []
        for i, (chunk_text, embedding) in enumerate(zip(chunks, embeddings)):
            chunk = DocumentChunk(
                document_id=doc_id,
                chunk_index=i,
                content=chunk_text,
                embedding=embedding
            )
            document_chunks.append(chunk)
        
        # Store chunks in storage
        document_storage.store_chunks(doc_id, document_chunks)
        
        return True
    
    def generate_query_embedding(self, query: str) -> List[float]:
        """Generate embedding for a search query"""
        embedding = self.embedding_model.encode([query])
        return embedding[0].tolist()


class LLMService:
    """Service for LLM-based answer synthesis"""
    
    def __init__(self):
        """Initialize OpenAI client"""
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            raise ValueError("OPENAI_API_KEY environment variable is required")
        
        # Initialize OpenAI client with OpenRouter configuration
        self.client = OpenAI(
            api_key=api_key,
            base_url="https://openrouter.ai/api/v1",
            default_headers={
                "HTTP-Referer": "https://your-app.com",  # Optional: your app URL
                "X-Title": "Document QA App"  # Optional: your app name
            }
        )
        self.model = "openai/gpt-3.5-turbo"  # OpenRouter model format
    
    def synthesize_answer(self, query: str, relevant_chunks: List[DocumentChunk]) -> str:
        """Synthesize an answer using LLM based on query and relevant document chunks"""
        
        if not relevant_chunks:
            return "No relevant information found in the uploaded documents."
        
        # Create context from relevant chunks
        context_parts = []
        for i, chunk in enumerate(relevant_chunks):
            # Get document info for better context
            doc = document_storage.get_document(chunk.document_id)
            doc_name = doc.filename if doc else f"Document {chunk.document_id}"
            
            context_parts.append(
                f"Document: {doc_name}\n"
                f"Content: {chunk.content}\n"
            )
        
        context = "\n---\n".join(context_parts)
        
        # Create prompt template as specified in requirements
        prompt = f"""Using these documents, answer the user's question succinctly.

Context from documents:
{context}

User question: {query}

Please provide a clear, concise answer based on the information in the documents. If the documents don't contain enough information to fully answer the question, mention what information is available and what might be missing."""
        
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {
                        "role": "system", 
                        "content": "You are a helpful assistant that answers questions based on provided document content. Be accurate and cite the information appropriately."
                    },
                    {
                        "role": "user", 
                        "content": prompt
                    }
                ],
                max_tokens=500,
                temperature=0.3  # Lower temperature for more consistent, factual responses
            )
            
            return response.choices[0].message.content.strip()
            
        except Exception as e:
            # Fallback to basic concatenation if LLM fails
            fallback_answer = "Based on the available documents:\n\n"
            for chunk in relevant_chunks:
                doc = document_storage.get_document(chunk.document_id)
                doc_name = doc.filename if doc else "Unknown document"
                fallback_answer += f"From {doc_name}: {chunk.content}\n\n"
            
            return fallback_answer + f"\n(Note: LLM synthesis unavailable: {str(e)})"


# Global service instances
document_processor = DocumentProcessor()
llm_service = LLMService()