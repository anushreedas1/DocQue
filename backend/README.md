# Knowledge Base Search Engine - Backend

FastAPI-based backend for document processing and RAG-based query functionality.

## Quick Start

1. **Setup environment**:
   ```bash
   python -m venv venv
   venv\Scripts\activate  # Windows
   # source venv/bin/activate  # macOS/Linux
   pip install -r requirements.txt
   ```

2. **Configure environment**:
   Create `.env` file:
   ```env
   OPENAI_API_KEY=your_openai_api_key_here
   ```

3. **Run development server**:
   ```bash
   python run.py
   ```

## API Documentation
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`
- Health Check: `http://localhost:8000/health`

---

📖 **For complete setup, deployment, and configuration instructions, see the [main README](../README.md)**