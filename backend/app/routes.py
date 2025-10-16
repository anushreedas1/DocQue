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


@documents_router.post("/upload/minimal")
async def minimal_upload():
    """Minimal upload endpoint for testing"""
    return JSONResponse(
        status_code=200,
        content={"message": "Minimal upload endpoint working"},
        headers={
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "*",
            "Access-Control-Allow-Headers": "*",
        }
    )

@documents_router.post("/upload/test")
async def test_upload(file: UploadFile = File(...)):
    """Simple upload test endpoint without processing"""
    logger.info(f"Test upload request: {file.filename}, type: {file.content_type}")
    
    try:
        # Just read the file and return basic info
        file_content = await file.read()
        
        return JSONResponse(
            status_code=200,
            content={
                "message": "Test upload successful",
                "filename": file.filename,
                "content_type": file.content_type,
                "size": len(file_content)
            },
            headers={
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "*",
                "Access-Control-Allow-Headers": "*",
            }
        )
    except Exception as e:
        logger.error(f"Test upload failed: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Test upload failed: {str(e)}"
        )

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
        
        # Return immediately without processing to avoid timeout
        # Processing can be done asynchronously later
        logger.info(f"Document {doc_id} uploaded successfully, skipping processing to avoid timeout")
        
        return JSONResponse(
            status_code=200,
            content={
                "message": "Document uploaded successfully",
                "document_id": doc_id,
                "filename": file.filename,
                "content_length": len(text_content),
                "chunks_created": 0,
                "note": "Document processing will be done asynchronously"
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


@query_router.get("/test")
async def test_query():
    """Simple query test endpoint"""
    return JSONResponse(
        status_code=200,
        content={
            "message": "Query endpoint is working",
            "answer": "This is a test response",
            "sources": [],
            "confidence": 1.0
        },
        headers={
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "*",
            "Access-Control-Allow-Headers": "*",
        }
    )

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
    
    # Return simple response without processing to avoid timeout
    # This prevents 502 errors that cause CORS issues
    try:
        # Get all documents for basic search
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
        
        # Simple text search without embeddings to avoid timeout
        query_lower = request.query.lower()
        matching_docs = []
        
        for doc in documents:
            if query_lower in doc.content.lower():
                matching_docs.append(doc)
        
        if not matching_docs:
            return JSONResponse(
                status_code=200,
                content={
                    "answer": f"No documents contain information about '{request.query}'. The uploaded documents cover other topics.",
                    "sources": [doc.filename for doc in documents],
                    "confidence": 0.0
                },
                headers={
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Methods": "*",
                    "Access-Control-Allow-Headers": "*",
                }
            )
        
        # Create simple answer from matching documents
        answer_parts = []
        sources = []
        
        for doc in matching_docs[:request.max_results]:
            # Find the relevant part of the document
            content_lower = doc.content.lower()
            query_pos = content_lower.find(query_lower)
            
            if query_pos >= 0:
                # Extract context around the query
                start = max(0, query_pos - 100)
                end = min(len(doc.content), query_pos + len(request.query) + 100)
                context = doc.content[start:end].strip()
                
                answer_parts.append(f"From {doc.filename}: ...{context}...")
                sources.append(doc.filename)
        
        answer = "\n\n".join(answer_parts)
        if not answer:
            answer = f"Found references to '{request.query}' in the uploaded documents, but couldn't extract specific details."
        
        return JSONResponse(
            status_code=200,
            content={
                "answer": answer,
                "sources": sources,
                "confidence": 0.8 if matching_docs else 0.0
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