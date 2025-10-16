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
        
        # Do basic chunking immediately (fast, no embeddings)
        try:
            chunk_size = 500
            chunk_overlap = 50
            chunks = []
            
            # Simple chunking
            start = 0
            while start < len(text_content):
                end = start + chunk_size
                if end < len(text_content):
                    # Try to break at sentence or word boundary
                    sentence_end = text_content.rfind('.', start, end)
                    if sentence_end > start + chunk_size // 2:
                        end = sentence_end + 1
                    else:
                        word_end = text_content.rfind(' ', start, end)
                        if word_end > start + chunk_size // 2:
                            end = word_end
                
                chunk = text_content[start:end].strip()
                if chunk:
                    chunks.append(chunk)
                
                start = end - chunk_overlap
                if start >= end:
                    start = end
            
            # Store basic chunks in document (no embeddings yet)
            document = document_storage.get_document(doc_id)
            if document:
                document.chunks = chunks
                logger.info(f"Document {doc_id} chunked into {len(chunks)} pieces")
            
        except Exception as chunk_error:
            logger.warning(f"Basic chunking failed for {doc_id}: {str(chunk_error)}")
        
        # Return immediately - embeddings will be processed separately
        return JSONResponse(
            status_code=200,
            content={
                "message": "Document uploaded and chunked successfully",
                "document_id": doc_id,
                "filename": file.filename,
                "content_length": len(text_content),
                "chunks_created": len(chunks) if 'chunks' in locals() else 0,
                "note": "Document ready for AI processing. Use /process endpoint for embeddings."
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


@documents_router.post("/upload_and_process")
async def upload_and_process_document(file: UploadFile = File(...)):
    """Upload and immediately process a document with embeddings (may timeout)"""
    
    logger.info(f"Document upload and process request: {file.filename}, type: {file.content_type}")
    
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
        
        # Process the document with embeddings (full AI processing)
        chunks_created = 0
        processing_note = "Document stored successfully"
        
        try:
            # Full processing with embeddings
            logger.info(f"Starting full AI processing for document {doc_id}")
            processing_success = get_document_processor().process_document(doc_id)
            
            if processing_success:
                processed_doc = document_storage.get_document(doc_id)
                if processed_doc and hasattr(processed_doc, 'chunks') and processed_doc.chunks:
                    chunks_created = len(processed_doc.chunks)
                    processing_note = "Document fully processed with embeddings for intelligent AI search"
                    logger.info(f"Document {doc_id} fully processed with {chunks_created} chunks and embeddings")
                else:
                    raise Exception("Processing returned success but no chunks created")
            else:
                raise Exception("Document processing returned failure")
                
        except Exception as processing_error:
            logger.error(f"Full AI processing failed for {doc_id}: {str(processing_error)}")
            # Don't fallback - this endpoint is for full processing
            raise HTTPException(
                status_code=500,
                detail=f"Document processing with embeddings failed: {str(processing_error)}"
            )
        
        return JSONResponse(
            status_code=200,
            content={
                "message": "Document uploaded and processed successfully",
                "document_id": doc_id,
                "filename": file.filename,
                "content_length": len(text_content),
                "chunks_created": chunks_created,
                "note": processing_note
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
    """Get list of all uploaded documents with processing status"""
    documents = document_storage.get_all_documents()
    
    document_list = []
    for doc in documents:
        # Check processing status
        stored_chunks = document_storage.get_chunks(doc.id)
        has_embeddings = len(stored_chunks) > 0 and any(chunk.embedding for chunk in stored_chunks)
        
        status = "processed" if has_embeddings else "uploaded" if len(doc.chunks) > 0 else "stored"
        
        document_list.append({
            "id": doc.id,
            "filename": doc.filename,
            "upload_date": doc.upload_date.isoformat(),
            "content_length": len(doc.content),
            "chunks_count": len(doc.chunks),
            "processed_chunks": len(stored_chunks),
            "has_embeddings": has_embeddings,
            "status": status
        })
    
    return {"documents": document_list}


@documents_router.get("/{document_id}/status")
async def get_document_status(document_id: str):
    """Get processing status of a document"""
    try:
        document = document_storage.get_document(document_id)
        if not document:
            raise HTTPException(
                status_code=404,
                detail="Document not found"
            )
        
        # Check if document has been processed (has chunks with embeddings)
        has_embeddings = False
        chunks_count = 0
        
        if hasattr(document, 'chunks') and document.chunks:
            chunks_count = len(document.chunks)
            # Check if chunks have embeddings (from storage)
            stored_chunks = document_storage.get_chunks(document_id)
            has_embeddings = len(stored_chunks) > 0 and any(chunk.embedding for chunk in stored_chunks)
        
        status = "processed" if has_embeddings else "uploaded" if chunks_count > 0 else "stored"
        
        return JSONResponse(
            status_code=200,
            content={
                "document_id": document_id,
                "filename": document.filename,
                "status": status,
                "chunks_count": chunks_count,
                "has_embeddings": has_embeddings,
                "content_length": len(document.content),
                "upload_date": document.upload_date.isoformat()
            },
            headers={
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "*",
                "Access-Control-Allow-Headers": "*",
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting document status {document_id}: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error getting document status: {str(e)}"
        )

@documents_router.post("/{document_id}/process")
async def process_document_endpoint(document_id: str):
    """Process a document with full AI embeddings"""
    logger.info(f"Processing document with embeddings: {document_id}")
    
    try:
        # Check if document exists
        document = document_storage.get_document(document_id)
        if not document:
            raise HTTPException(
                status_code=404,
                detail="Document not found"
            )
        
        # Check if already processed
        stored_chunks = document_storage.get_chunks(document_id)
        if stored_chunks and any(chunk.embedding for chunk in stored_chunks):
            return JSONResponse(
                status_code=200,
                content={
                    "message": "Document already processed",
                    "document_id": document_id,
                    "chunks_created": len(stored_chunks),
                    "status": "already_processed"
                },
                headers={
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Methods": "*",
                    "Access-Control-Allow-Headers": "*",
                }
            )
        
        # Process the document with full AI embeddings
        logger.info(f"Starting full AI processing for document {document_id}")
        processing_success = get_document_processor().process_document(document_id)
        
        if processing_success:
            processed_doc = document_storage.get_document(document_id)
            stored_chunks = document_storage.get_chunks(document_id)
            
            return JSONResponse(
                status_code=200,
                content={
                    "message": "Document processed successfully with AI embeddings",
                    "document_id": document_id,
                    "chunks_created": len(stored_chunks),
                    "has_embeddings": any(chunk.embedding for chunk in stored_chunks),
                    "status": "processed"
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
                detail="Document processing with embeddings failed"
            )
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error processing document {document_id}: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error processing document with embeddings: {str(e)}"
        )

@documents_router.post("/process_all")
async def process_all_documents():
    """Process all unprocessed documents with AI embeddings"""
    logger.info("Processing all unprocessed documents")
    
    try:
        documents = document_storage.get_all_documents()
        if not documents:
            return JSONResponse(
                status_code=200,
                content={
                    "message": "No documents to process",
                    "processed_count": 0,
                    "failed_count": 0,
                    "results": []
                },
                headers={
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Methods": "*",
                    "Access-Control-Allow-Headers": "*",
                }
            )
        
        processed_count = 0
        failed_count = 0
        results = []
        
        for document in documents:
            try:
                # Check if already processed
                stored_chunks = document_storage.get_chunks(document.id)
                if stored_chunks and any(chunk.embedding for chunk in stored_chunks):
                    results.append({
                        "document_id": document.id,
                        "filename": document.filename,
                        "status": "already_processed",
                        "chunks_count": len(stored_chunks)
                    })
                    continue
                
                # Process the document
                logger.info(f"Processing document {document.id} ({document.filename})")
                processing_success = get_document_processor().process_document(document.id)
                
                if processing_success:
                    stored_chunks = document_storage.get_chunks(document.id)
                    processed_count += 1
                    results.append({
                        "document_id": document.id,
                        "filename": document.filename,
                        "status": "processed",
                        "chunks_count": len(stored_chunks)
                    })
                    logger.info(f"Successfully processed {document.filename}")
                else:
                    failed_count += 1
                    results.append({
                        "document_id": document.id,
                        "filename": document.filename,
                        "status": "failed",
                        "error": "Processing returned failure"
                    })
                    logger.error(f"Failed to process {document.filename}")
                    
            except Exception as doc_error:
                failed_count += 1
                results.append({
                    "document_id": document.id,
                    "filename": document.filename,
                    "status": "failed",
                    "error": str(doc_error)
                })
                logger.error(f"Error processing {document.filename}: {str(doc_error)}")
        
        return JSONResponse(
            status_code=200,
            content={
                "message": f"Batch processing completed: {processed_count} processed, {failed_count} failed",
                "processed_count": processed_count,
                "failed_count": failed_count,
                "total_documents": len(documents),
                "results": results
            },
            headers={
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "*",
                "Access-Control-Allow-Headers": "*",
            }
        )
        
    except Exception as e:
        logger.error(f"Error in batch processing: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error in batch processing: {str(e)}"
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
        
        # Enhanced search with multiple strategies and semantic understanding
        query_lower = request.query.lower()
        query_words = [word.strip() for word in query_lower.split() if len(word.strip()) > 2]
        
        # Expand query for better semantic matching
        semantic_expansions = {
            'name': ['name', 'called', 'named', 'title'],
            'what': ['what', 'who', 'which'],
            'where': ['where', 'location', 'place', 'address'],
            'when': ['when', 'date', 'time'],
            'how': ['how', 'method', 'way'],
            'email': ['email', 'mail', 'contact'],
            'phone': ['phone', 'number', 'contact', 'mobile'],
            'work': ['work', 'job', 'company', 'employer'],
            'education': ['education', 'school', 'university', 'degree', 'study']
        }
        
        # Add semantic expansions to query words
        expanded_words = set(query_words)
        for word in query_words:
            for key, expansions in semantic_expansions.items():
                if word in expansions:
                    expanded_words.update(expansions)
        
        query_words = list(expanded_words)
        
        # For questions like "what is my name", we should always try LLM synthesis
        # even if there are no direct keyword matches
        question_indicators = ['what', 'who', 'where', 'when', 'how', 'tell', 'describe']
        is_question = any(indicator in query_lower for indicator in question_indicators)
        
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
            
            # For questions, include all documents with lower score for LLM analysis
            elif is_question:
                partial_matches.append((doc, 0.4))  # Give questions a chance
            
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
        
        # For questions, ensure we have at least some matches to work with
        if is_question and not unique_matches:
            # Include all documents for question analysis
            for doc in documents:
                unique_matches.append((doc, 0.5))  # Medium score for questions
        
        if not unique_matches:
            # Try to use LLM to answer from full document content even without matches
            try:
                logger.info(f"No direct matches found, trying LLM synthesis with full document content")
                
                # Create chunks from all documents for LLM analysis
                from .models import DocumentChunk
                all_chunks = []
                
                for doc in documents:
                    # Use document chunks if available, otherwise create from content
                    if hasattr(doc, 'chunks') and doc.chunks:
                        for i, chunk_content in enumerate(doc.chunks[:3]):  # Limit chunks per doc
                            chunk = DocumentChunk(
                                document_id=doc.id,
                                chunk_index=i,
                                content=chunk_content,
                                embedding=None
                            )
                            all_chunks.append(chunk)
                    else:
                        # Create chunk from document content
                        content_preview = doc.content[:800]  # Limit content size
                        chunk = DocumentChunk(
                            document_id=doc.id,
                            chunk_index=0,
                            content=content_preview,
                            embedding=None
                        )
                        all_chunks.append(chunk)
                
                # Try LLM synthesis
                llm_service = get_llm_service()
                answer = llm_service.synthesize_answer(request.query, all_chunks)
                
                # Check if LLM provided a meaningful answer
                if answer and len(answer.strip()) > 20 and "no relevant information" not in answer.lower():
                    return JSONResponse(
                        status_code=200,
                        content={
                            "answer": answer,
                            "sources": [doc.filename for doc in documents],
                            "confidence": 0.6  # Medium confidence for LLM synthesis
                        },
                        headers={
                            "Access-Control-Allow-Origin": "*",
                            "Access-Control-Allow-Methods": "*",
                            "Access-Control-Allow-Headers": "*",
                        }
                    )
                    
            except Exception as llm_error:
                logger.warning(f"LLM synthesis for no-matches failed: {str(llm_error)}")
            
            # Fallback to document overview
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
        
        # Use AI to synthesize intelligent answer from matches
        try:
            # Collect relevant contexts from matching documents
            relevant_contexts = []
            sources = []
            max_results = min(request.max_results, len(unique_matches))
            
            for doc, score in unique_matches[:max_results]:
                # Get relevant chunks or full content
                if hasattr(doc, 'chunks') and doc.chunks:
                    # Use chunks if available
                    for chunk in doc.chunks[:3]:  # Limit chunks per document
                        relevant_contexts.append({
                            'content': chunk,
                            'filename': doc.filename,
                            'score': score
                        })
                else:
                    # Use full document content (truncated)
                    content_preview = doc.content[:1000] + "..." if len(doc.content) > 1000 else doc.content
                    relevant_contexts.append({
                        'content': content_preview,
                        'filename': doc.filename,
                        'score': score
                    })
                
                sources.append(doc.filename)
            
            # Use LLM to synthesize answer if we have any matches
            if relevant_contexts:
                try:
                    # Create document chunks for LLM
                    from .models import DocumentChunk
                    llm_chunks = []
                    
                    for i, context in enumerate(relevant_contexts):
                        chunk = DocumentChunk(
                            document_id=f"temp_{i}",
                            chunk_index=i,
                            content=context['content'],
                            embedding=None
                        )
                        llm_chunks.append(chunk)
                    
                    # Get LLM service and synthesize answer
                    llm_service = get_llm_service()
                    logger.info(f"Calling LLM synthesis for query: '{request.query}' with {len(llm_chunks)} chunks")
                    answer = llm_service.synthesize_answer(request.query, llm_chunks)
                    overall_confidence = min(max(score for _, score in unique_matches[:max_results]) + 0.3, 1.0)
                    
                    logger.info(f"LLM synthesis successful for query: '{request.query}', answer length: {len(answer)}")
                    
                    # Ensure we got a meaningful answer
                    if answer and len(answer.strip()) > 10 and "LLM synthesis unavailable" not in answer:
                        logger.info("Using LLM synthesized answer")
                    else:
                        logger.warning("LLM answer seems invalid, will use fallback")
                        raise Exception("Invalid LLM response")
                    
                except Exception as llm_error:
                    logger.warning(f"LLM synthesis failed: {str(llm_error)}, falling back to context extraction")
                    
                    # Fallback to context extraction
                    answer_parts = []
                    for context in relevant_contexts[:3]:
                        score = context['score']
                        confidence_indicator = "High" if score > 0.8 else "Medium" if score > 0.5 else "Low"
                        answer_parts.append(f"**From {context['filename']}** ({confidence_indicator} relevance):\n{context['content']}")
                    
                    answer = "\n\n".join(answer_parts)
                    overall_confidence = max(score for _, score in unique_matches[:max_results])
            else:
                # Low confidence matches - provide context extraction
                answer_parts = []
                for context in relevant_contexts[:2]:
                    answer_parts.append(f"From {context['filename']}: {context['content'][:200]}...")
                
                if answer_parts:
                    answer = "\n\n".join(answer_parts)
                    overall_confidence = max(score for _, score in unique_matches[:max_results])
                else:
                    answer = f"Found some references to '{request.query}' but couldn't extract clear information."
                    overall_confidence = 0.2
                    
        except Exception as synthesis_error:
            logger.error(f"Answer synthesis failed: {str(synthesis_error)}")
            answer = f"Found information related to '{request.query}' but couldn't process it properly."
            overall_confidence = 0.3
        
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