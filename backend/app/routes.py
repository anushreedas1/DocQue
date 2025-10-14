"""API routes for document management and querying"""

from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse
from typing import List
import PyPDF2
import io
from .storage import document_storage
from .models import QueryRequest, QueryResponse
from .services import document_processor, llm_service

# Create router for document endpoints
documents_router = APIRouter(prefix="/documents", tags=["documents"])
query_router = APIRouter(prefix="/query", tags=["query"])


@documents_router.post("/upload")
async def upload_document(file: UploadFile = File(...)):
    """Upload and process a document (PDF or TXT)"""
    
    # Validate file type
    allowed_types = ["application/pdf", "text/plain"]
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=400, 
            detail=f"Unsupported file type. Only PDF and TXT files are allowed."
        )
    
    try:
        # Read file content
        file_content = await file.read()
        
        # Extract text based on file type
        if file.content_type == "application/pdf":
            text_content = extract_pdf_text(file_content)
        else:  # text/plain
            text_content = file_content.decode('utf-8')
        
        # Validate that we extracted some content
        if not text_content.strip():
            raise HTTPException(
                status_code=400,
                detail="No text content could be extracted from the file"
            )
        
        # Store the document
        doc_id = document_storage.store_document(file.filename, text_content)
        
        # Process the document (chunk and generate embeddings)
        processing_success = document_processor.process_document(doc_id)
        
        if not processing_success:
            # If processing fails, remove the document and raise error
            document_storage.delete_document(doc_id)
            raise HTTPException(
                status_code=500,
                detail="Failed to process document for search indexing"
            )
        
        # Get the processed document to return chunk count
        processed_doc = document_storage.get_document(doc_id)
        
        return JSONResponse(
            status_code=200,
            content={
                "message": "Document uploaded and processed successfully",
                "document_id": doc_id,
                "filename": file.filename,
                "content_length": len(text_content),
                "chunks_created": len(processed_doc.chunks)
            }
        )
        
    except UnicodeDecodeError:
        raise HTTPException(
            status_code=400,
            detail="Unable to decode text file. Please ensure it's in UTF-8 format."
        )
    except Exception as e:
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
    
    # Validate query
    if not request.query.strip():
        raise HTTPException(
            status_code=400,
            detail="Query cannot be empty"
        )
    
    try:
        # Generate embedding for the query
        query_embedding = document_processor.generate_query_embedding(request.query)
        
        # Search for similar chunks
        relevant_chunks = document_storage.search_chunks_by_similarity(
            query_embedding, 
            max_results=request.max_results
        )
        
        # If no relevant chunks found
        if not relevant_chunks:
            return QueryResponse(
                answer="No relevant information found in the uploaded documents.",
                sources=[],
                confidence=0.0
            )
        
        # Use LLM to synthesize answer from relevant chunks
        answer = llm_service.synthesize_answer(request.query, relevant_chunks)
        
        # Collect source information
        sources = []
        for chunk in relevant_chunks:
            doc = document_storage.get_document(chunk.document_id)
            if doc:
                source_info = f"{doc.filename} (chunk {chunk.chunk_index + 1})"
                sources.append(source_info)
        
        return QueryResponse(
            answer=answer,
            sources=sources,
            confidence=1.0 if relevant_chunks else 0.0
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error processing query: {str(e)}"
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