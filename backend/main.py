import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from app.config import settings
from app.routes import documents_router, query_router

# Load environment variables
load_dotenv()

# Configure logging
settings.configure_logging()
logger = logging.getLogger(__name__)

# Create FastAPI application
app = FastAPI(
    title=settings.API_TITLE,
    description="A minimalistic RAG system for document search and answer synthesis",
    version=settings.API_VERSION
)

# Configure CORS for frontend communication
cors_origins = settings.cors_origins
logger.info(f"Configuring CORS for origins: {cors_origins}")

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "DELETE"],
    allow_headers=["*"],
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
    return {"status": "healthy", "environment": settings.ENVIRONMENT}

# Include routers
app.include_router(documents_router)
app.include_router(query_router)

if __name__ == "__main__":
    import uvicorn
    logger.info(f"Starting server on {settings.HOST}:{settings.PORT} in {settings.ENVIRONMENT} mode")
    uvicorn.run(app, host=settings.HOST, port=settings.PORT)