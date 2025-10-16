# Load environment variables first
from dotenv import load_dotenv
load_dotenv()

import logging
from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
from app.config import settings
from app.routes import documents_router, query_router
import traceback

# Configure logging
settings.configure_logging()
logger = logging.getLogger(__name__)

# Create FastAPI application
app = FastAPI(
    title=settings.API_TITLE,
    description="A minimalistic RAG system for document search and answer synthesis",
    version=settings.API_VERSION
)

# Add custom CORS middleware that handles ALL requests
@app.middleware("http")
async def add_cors_headers(request: Request, call_next):
    """Add CORS headers to ALL responses"""
    try:
        response = await call_next(request)
    except Exception as e:
        # Even for errors, return with CORS headers
        logger.error(f"Request failed: {str(e)}")
        response = JSONResponse(
            status_code=500,
            content={"detail": "Internal server error", "error": str(e)}
        )
    
    # Add CORS headers to every response
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Methods"] = "*"
    response.headers["Access-Control-Allow-Headers"] = "*"
    response.headers["Access-Control-Max-Age"] = "86400"
    
    return response

# Also add the standard CORS middleware as backup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins
    allow_credentials=False,  # Must be False when allow_origins=["*"]
    allow_methods=["*"],  # Allow all methods
    allow_headers=["*"],  # Allow all headers
)

@app.get("/")
async def root():
    """Root endpoint for health check"""
    logger.info("Root endpoint accessed")
    return {
        "message": "Knowledge Base Search Engine API", 
        "status": "running",
        "environment": settings.ENVIRONMENT
    }

@app.get("/health")
async def health_check():
    """Health check endpoint for deployment monitoring"""
    logger.debug("Health check endpoint accessed")
    try:
        # Basic health checks
        import os
        
        # Check if OpenAI API key is configured
        openai_configured = bool(settings.OPENAI_API_KEY)
        
        # Check if data directory exists or can be created
        data_dir_ok = True
        try:
            os.makedirs(settings.DATA_DIR, exist_ok=True)
        except Exception:
            data_dir_ok = False
        
        health_status = {
            "status": "healthy",
            "environment": settings.ENVIRONMENT,
            "openai_configured": openai_configured,
            "data_directory": data_dir_ok,
            "cors_origins": settings.cors_origins
        }
        
        return health_status
    except Exception as e:
        logger.error(f"Health check failed: {str(e)}")
        return {"status": "unhealthy", "error": str(e)}

# Handle ALL OPTIONS requests globally
@app.options("/{path:path}")
async def handle_options(path: str):
    """Handle preflight OPTIONS requests for all paths"""
    return JSONResponse(
        status_code=200,
        content={"message": "CORS preflight OK"},
        headers={
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "*",
            "Access-Control-Allow-Headers": "*",
            "Access-Control-Max-Age": "86400",
        }
    )

@app.get("/health/services")
async def services_health_check():
    """Detailed health check for services"""
    logger.debug("Services health check endpoint accessed")
    
    health_status = {
        "status": "healthy",
        "services": {}
    }
    
    # Test DocumentProcessor
    try:
        from app.services import get_document_processor
        processor = get_document_processor()
        # Test with a simple embedding
        test_embedding = processor.generate_query_embedding("test")
        health_status["services"]["document_processor"] = {
            "status": "healthy",
            "embedding_dimension": len(test_embedding)
        }
    except Exception as e:
        health_status["services"]["document_processor"] = {
            "status": "unhealthy",
            "error": str(e)
        }
        health_status["status"] = "degraded"
    
    # Test LLMService
    try:
        from app.services import get_llm_service
        llm = get_llm_service()
        health_status["services"]["llm_service"] = {
            "status": "healthy",
            "api_key_configured": bool(llm.api_key)
        }
    except Exception as e:
        health_status["services"]["llm_service"] = {
            "status": "unhealthy",
            "error": str(e)
        }
        health_status["status"] = "degraded"
    
    return health_status

# Error handlers with CORS
@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    """Handle HTTP exceptions with CORS headers"""
    logger.error(f"HTTP {exc.status_code} error on {request.url}: {exc.detail}")
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail, "status_code": exc.status_code},
        headers={
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "*",
            "Access-Control-Allow-Headers": "*",
        }
    )

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Handle request validation errors with CORS headers"""
    logger.error(f"Validation error on {request.url}: {exc.errors()}")
    return JSONResponse(
        status_code=422,
        content={"detail": "Validation error", "errors": exc.errors()},
        headers={
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "*",
            "Access-Control-Allow-Headers": "*",
        }
    )

@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    """Handle general exceptions with CORS headers"""
    logger.error(f"Unhandled exception on {request.url}: {str(exc)}")
    logger.error(traceback.format_exc())
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error", "type": type(exc).__name__},
        headers={
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "*",
            "Access-Control-Allow-Headers": "*",
        }
    )

# Include routers
app.include_router(documents_router)
app.include_router(query_router)

if __name__ == "__main__":
    import uvicorn
    logger.info(f"Starting server on {settings.HOST}:{settings.PORT} in {settings.ENVIRONMENT} mode")
    uvicorn.run(app, host=settings.HOST, port=settings.PORT)