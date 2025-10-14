# Knowledge Base Search Engine - Backend

A FastAPI-based backend for the Knowledge Base Search Engine that provides document processing and RAG-based query functionality.

## Setup

1. Create and activate a virtual environment:
```bash
python -m venv venv
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Set up environment variables:
Create a `.env` file with your OpenAI API key:
```
OPENAI_API_KEY=your_openai_api_key_here
```

## Running the Application

### Development
```bash
python run.py
```

### Production
```bash
python main.py
```

The API will be available at `http://localhost:8000`

## API Documentation

Once running, visit:
- API docs: `http://localhost:8000/docs`
- Alternative docs: `http://localhost:8000/redoc`

## Health Check

- Root endpoint: `GET /`
- Health check: `GET /health`