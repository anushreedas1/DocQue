"""API routes for document management and querying"""

import logging
from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse
from typing import List
import PyPDF2
import io
from .storage import document_storage
from .models import QueryRequest, QueryResponse
from .services import get_document_processor, get_llm_service

logger = logging.getLogger(__name__)

# Create router for document endpoints
documents_router = APIRouter(prefix="/documents", tags=["documents"])
query_router = APIRouter(prefix="/query", tags=["query"])


@documents_router.post("/upload")
async def upload_document(file: UploadFile = File(...)):
    """Upload and process a document (PDF or TXT)"""
    
    logger.info(f"Document upload request: {file.filename}, type: {file.content_type}")
    
    # Validate file type
    allowed_types = ["application/pdf", "text/plain"]
    if file.content_type not in allowed_types:
        logger.warning(f"Unsupported file type attempted: {file.content_type}")
        raise HTTPException(
            status_code=400, 
            detail=f"Unsupported file type. Only PDF and TXT files are allowed."
        )
    
    try:
        # Read file content
        file_content = await file.read()
        logger.info(f"File content read successfully, size: {len(file_content)} bytes")
        
        # Extract text based on file type
        if file.content_type == "application/pdf":
            text_content = extract_pdf_text(file_content)
        else:  # text/plain
            text_content = file_content.decode('utf-8')
        
        logger.info(f"Text extracted successfully, length: {len(text_content)} characters")
        
        # Validate that we extracted some content
        if not text_content.strip():
            raise HTTPException(
                status_code=400,
                detail="No text content could be extracted from the file"
            )
        
        # Store the document
        doc_id = document_storage.store_document(file.filename, text_content)
        logger.info(f"Document stored with ID: {doc_id}")
        
        # Try lightweight processing (just chunking, no embeddings)
        chunks_created = 0
        try:
            # Simple text chunking without embeddings to avoid timeout
            chunk_size = 500
            chunks = []
            
            # Split into chunks
            for i in range(0, len(text_content), chunk_size):
                chunk = text_content[i:i + chunk_size]
                if chunk.strip():
                    chunks.append(chunk.strip())
            
            # Store chunks in document (without embeddings)
            document = document_storage.get_document(doc_id)
            if document:
                document.chunks = chunks
                chunks_created = len(chunks)
            
            logger.info(f"Document {doc_id} processed with {chunks_created} chunks (no embeddings)")
            
        except Exception as e:
            logger.warning(f"Lightweight processing failed for {doc_id}: {str(e)}")
        
        return JSONResponse(
            status_code=200,
            content={
                "message": "Document uploaded and processed successfully",
                "document_id": doc_id,
                "filename": file.filename,
                "content_length": len(text_content),
                "chunks_created": chunks_created,
                "note": "Document is ready for searching"
            },
            headers={
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "*",
                "Access-Control-Allow-Headers": "*",
            }
        )
        
    except UnicodeDecodeError:
        logger.error(f"Unicode decode error for file: {file.filename}")
        raise HTTPException(
            status_code=400,
            detail="Unable to decode text file. Please ensure it's in UTF-8 format."
        )
    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        logger.error(f"Error processing document {file.filename}: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error processing document: {str(e)}"
        )


@documents_router.get("/")
async def list_documents():
    """Get list of all uploaded documents"""
    documents = document_storage.get_all_documents()
    
    return {
        "documents": [
            {
                "id": doc.id,
                "filename": doc.filename,
                "upload_date": doc.upload_date.isoformat(),
                "content_length": len(doc.content),
                "chunks_count": len(doc.chunks)
            }
            for doc in documents
        ]
    }


@documents_router.post("/{document_id}/process")
async def process_document_endpoint(document_id: str):
    """Process a document that was uploaded but not processed"""
    logger.info(f"Processing document: {document_id}")
    
    try:
        # Check if document exists
        document = document_storage.get_document(document_id)
        if not document:
            raise HTTPException(
                status_code=404,
                detail="Document not found"
            )
        
        # Process the document
        processing_success = get_document_processor().process_document(document_id)
        
        if processing_success:
            processed_doc = document_storage.get_document(document_id)
            return JSONResponse(
                status_code=200,
                content={
                    "message": "Document processed successfully",
                    "document_id": document_id,
                    "chunks_created": len(processed_doc.chunks)
                },
                headers={
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Methods": "*",
                    "Access-Control-Allow-Headers": "*",
                }
            )
        else:
            raise HTTPException(
                status_code=500,
                detail="Document processing failed"
            )
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error processing document {document_id}: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error processing document: {str(e)}"
        )

@documents_router.delete("/{document_id}")
async def delete_document(document_id: str):
    """Delete a document by ID"""
    success = document_storage.delete_document(document_id)
    
    if not success:
        raise HTTPException(
            status_code=404,
            detail="Document not found"
        )
    
    return {"message": "Document deleted successfully"}


@query_router.post("/")
async def query_documents(request: QueryRequest):
    """Query documents and return relevant information"""
    
    logger.info(f"Query request: '{request.query}' (max_results: {request.max_results})")
    
    # Validate query
    if not request.query.strip():
        logger.warning("Empty query submitted")
        raise HTTPException(
            status_code=400,
            detail="Query cannot be empty"
        )
    
    try:
        # Get all documents for search
        documents = document_storage.get_all_documents()
        
        if not documents:
            return JSONResponse(
                status_code=200,
                content={
                    "answer": "No documents have been uploaded yet. Please upload some documents first.",
                    "sources": [],
                    "confidence": 0.0
                },
                headers={
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Methods": "*",
                    "Access-Control-Allow-Headers": "*",
                }
            )
        
        # Enhanced search with multiple strategies
        query_lower = request.query.lower()
        query_words = [word.strip() for word in query_lower.split() if len(word.strip()) > 2]
        
        # Strategy 1: Exact phrase matching
        exact_matches = []
        # Strategy 2: Word matching with scoring
        word_matches = []
        # Strategy 3: Partial matches
        partial_matches = []
        
        for doc in documents:
            content_lower = doc.content.lower()
            
            # Check for exact phrase match
            if query_lower in content_lower:
                exact_matches.append((doc, 1.0))
            
            # Check for word matches
            word_score = 0
            matched_words = 0
            for word in query_words:
                if word in content_lower:
                    matched_words += 1
                    # Count occurrences for scoring
                    word_score += content_lower.count(word)
            
            if matched_words > 0:
                # Score based on percentage of query words found and frequency
                score = (matched_words / len(query_words)) * 0.7 + min(word_score / 10, 0.3)
                word_matches.append((doc, score))
            
            # Check for partial word matches (for typos, etc.)
            elif len(query_words) == 1 and len(query_words[0]) > 4:
                query_word = query_words[0]
                for word in content_lower.split():
                    if query_word in word or word in query_word:
                        partial_matches.append((doc, 0.3))
                        break
        
        # Combine and sort matches by score
        all_matches = exact_matches + word_matches + partial_matches
        all_matches.sort(key=lambda x: x[1], reverse=True)
        
        # Remove duplicates while preserving order
        seen_docs = set()
        unique_matches = []
        for doc, score in all_matches:
            if doc.id not in seen_docs:
                unique_matches.append((doc, score))
                seen_docs.add(doc.id)
        
        if not unique_matches:
            # Provide helpful response with document overview
            doc_topics = []
            for doc in documents[:3]:  # Show first 3 documents
                # Extract first few sentences as topic summary
                sentences = doc.content.split('.')[:2]
                topic = '.'.join(sentences).strip()[:100] + "..." if len('.'.join(sentences)) > 100 else '.'.join(sentences).strip()
                doc_topics.append(f"• {doc.filename}: {topic}")
            
            topic_summary = "\n".join(doc_topics)
            
            return JSONResponse(
                status_code=200,
                content={
                    "answer": f"I couldn't find specific information about '{request.query}' in your documents. Here's what your documents contain:\n\n{topic_summary}\n\nTry asking about these topics or upload more relevant documents.",
                    "sources": [doc.filename for doc in documents],
                    "confidence": 0.1
                },
                headers={
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Methods": "*",
                    "Access-Control-Allow-Headers": "*",
                }
            )
        
        # Generate intelligent answer from matches
        answer_parts = []
        sources = []
        max_results = min(request.max_results, len(unique_matches))
        
        for doc, score in unique_matches[:max_results]:
            content_lower = doc.content.lower()
            
            # Find the best context for this document
            contexts = []
            
            # Look for exact phrase first
            if query_lower in content_lower:
                pos = content_lower.find(query_lower)
                start = max(0, pos - 150)
                end = min(len(doc.content), pos + len(request.query) + 150)
                context = doc.content[start:end].strip()
                contexts.append(context)
            
            # Look for sentences containing query words
            sentences = doc.content.split('.')
            for sentence in sentences:
                sentence_lower = sentence.lower()
                word_count = sum(1 for word in query_words if word in sentence_lower)
                if word_count > 0:
                    contexts.append(sentence.strip())
                    if len(contexts) >= 2:  # Limit contexts per document
                        break
            
            # Use the best context
            if contexts:
                best_context = max(contexts, key=len) if len(contexts) > 1 else contexts[0]
                # Clean up the context
                if not best_context.endswith('.'):
                    best_context += "..."
                
                confidence_indicator = "High" if score > 0.8 else "Medium" if score > 0.5 else "Low"
                answer_parts.append(f"**From {doc.filename}** ({confidence_indicator} relevance):\n{best_context}")
                sources.append(doc.filename)
        
        # Create final answer
        if answer_parts:
            answer = "\n\n".join(answer_parts)
            overall_confidence = max(score for _, score in unique_matches[:max_results])
        else:
            answer = f"Found some references to '{request.query}' but couldn't extract clear information."
            overall_confidence = 0.2
        
        return JSONResponse(
            status_code=200,
            content={
                "answer": answer,
                "sources": sources,
                "confidence": min(overall_confidence, 1.0)
            },
            headers={
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "*",
                "Access-Control-Allow-Headers": "*",
            }
        )
        
    except Exception as e:
        logger.error(f"Error processing query '{request.query}': {str(e)}")
        # Return error with CORS headers
        return JSONResponse(
            status_code=500,
            content={
                "answer": "Sorry, there was an error processing your query. Please try again.",
                "sources": [],
                "confidence": 0.0,
                "error": str(e)
            },
            headers={
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "*",
                "Access-Control-Allow-Headers": "*",
            }
        )


def extract_pdf_text(pdf_content: bytes) -> str:
    """Extract text content from PDF bytes"""
    try:
        pdf_file = io.BytesIO(pdf_content)
        pdf_reader = PyPDF2.PdfReader(pdf_file)
        
        text_content = ""
        for page in pdf_reader.pages:
            text_content += page.extract_text() + "\n"
        
        return text_content.strip()
        
    except Exception as e:
        raise Exception(f"Error extracting PDF text: {str(e)}")