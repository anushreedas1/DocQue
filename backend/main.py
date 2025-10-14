from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from app.config import settings
from app.routes import documents_router, query_router

# Load environment variables
load_dotenv()

# Create FastAPI application
app = FastAPI(
    title=settings.API_TITLE,
    description="A minimalistic RAG system for document search and answer synthesis",
    version=settings.API_VERSION
)

# Configure CORS for frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "DELETE"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    """Root endpoint for health check"""
    return {"message": "Knowledge Base Search Engine API", "status": "running"}

@app.get("/health")
async def health_check():
    """Health check endpoint for deployment monitoring"""
    return {"status": "healthy"}

# Include routers
app.include_router(documents_router)
app.include_router(query_router)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host=settings.HOST, port=settings.PORT)