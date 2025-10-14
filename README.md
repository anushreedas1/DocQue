# Knowledge Base Search Engine

A full-stack AI-powered document search and question-answering system built with FastAPI (backend) and Next.js (frontend). Upload documents, ask questions, and get intelligent answers with source citations.

## 🚀 Features

- **Document Upload**: Support for PDF and TXT files
- **AI-Powered Search**: RAG (Retrieval-Augmented Generation) using OpenAI embeddings
- **Intelligent Answers**: Get contextual answers with source citations
- **Modern UI**: Clean, responsive interface built with Next.js and Tailwind CSS
- **Production Ready**: Comprehensive error handling, logging, and deployment configurations

## 🏗️ Architecture

- **Frontend**: Next.js 14 with TypeScript, Tailwind CSS
- **Backend**: FastAPI with Python 3.11
- **AI/ML**: OpenAI GPT-4 and text-embedding-ada-002
- **Storage**: In-memory storage with vector similarity search
- **Deployment**: Vercel (frontend) + Render (backend)

## 📋 Prerequisites

- Node.js 18+ and npm
- Python 3.11+
- OpenAI API key

## 🛠️ Local Development Setup

### Backend Setup

1. **Navigate to backend directory**:
   ```bash
   cd backend
   ```

2. **Create and activate virtual environment**:
   ```bash
   python -m venv venv
   
   # Windows
   venv\Scripts\activate
   
   # macOS/Linux
   source venv/bin/activate
   ```

3. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

4. **Configure environment variables**:
   Create a `.env` file in the backend directory:
   ```env
   OPENAI_API_KEY=your_openai_api_key_here
   ENVIRONMENT=development
   ALLOWED_ORIGINS=http://localhost:3000
   LOG_LEVEL=DEBUG
   ```

5. **Run the backend**:
   ```bash
   python run.py
   ```
   
   The API will be available at `http://localhost:8000`
   - API Documentation: `http://localhost:8000/docs`
   - Health Check: `http://localhost:8000/health`

### Frontend Setup

1. **Navigate to frontend directory**:
   ```bash
   cd frontend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure environment variables**:
   Create a `.env.local` file in the frontend directory:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:8000
   NEXT_PUBLIC_ENVIRONMENT=development
   ```

4. **Run the frontend**:
   ```bash
   npm run dev
   ```
   
   The application will be available at `http://localhost:3000`

## 🚀 Production Deployment

### Backend Deployment (Render)

1. **Connect Repository**: Link your GitHub repository to Render

2. **Create Web Service**: 
   - Build Command: `docker build -t app .`
   - Start Command: `docker run -p $PORT:8000 app`

3. **Environment Variables**:
   ```env
   OPENAI_API_KEY=your_openai_api_key_here
   ENVIRONMENT=production
   ALLOWED_ORIGINS=https://your-frontend.vercel.app
   LOG_LEVEL=INFO
   ```

4. **Docker Configuration**: The project includes a production-ready Dockerfile with:
   - Multi-stage build optimization
   - Non-root user for security
   - Health checks
   - Proper logging configuration

### Frontend Deployment (Vercel)

#### Option A: Vercel CLI
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy from frontend directory
cd frontend
vercel

# Set environment variables
vercel env add NEXT_PUBLIC_API_URL
vercel env add NEXT_PUBLIC_ENVIRONMENT

# Deploy to production
vercel --prod
```

#### Option B: Vercel Dashboard
1. Connect your GitHub repository to Vercel
2. Import the project (set root directory to `frontend`)
3. Configure environment variables:
   ```env
   NEXT_PUBLIC_API_URL=https://your-backend.onrender.com
   NEXT_PUBLIC_ENVIRONMENT=production
   NEXT_PUBLIC_ENABLE_LOGGING=false
   ```
4. Deploy

## 🔧 Configuration

### Backend Configuration

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `OPENAI_API_KEY` | OpenAI API key for embeddings and chat | - | ✅ |
| `ENVIRONMENT` | Environment mode (development/production) | development | ❌ |
| `ALLOWED_ORIGINS` | CORS allowed origins (comma-separated) | http://localhost:3000 | ✅ (production) |
| `HOST` | Server host | 0.0.0.0 | ❌ |
| `PORT` | Server port | 8000 | ❌ |
| `LOG_LEVEL` | Logging level (DEBUG/INFO/WARNING/ERROR) | INFO (prod), DEBUG (dev) | ❌ |

### Frontend Configuration

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `NEXT_PUBLIC_API_URL` | Backend API URL | http://localhost:8000 | ✅ |
| `NEXT_PUBLIC_ENVIRONMENT` | Environment mode | development | ❌ |
| `NEXT_PUBLIC_ENABLE_LOGGING` | Enable production logging | false | ❌ |

## 🛡️ Production Features

### Security
- **CORS Protection**: Strict origin validation in production
- **Security Headers**: X-Frame-Options, X-Content-Type-Options, etc.
- **Input Validation**: File type and size validation
- **Error Handling**: Production-safe error messages

### Performance
- **API Retry Logic**: Exponential backoff for failed requests
- **Image Optimization**: Next.js automatic image optimization
- **Compression**: Gzip compression enabled
- **Caching**: Proper HTTP caching headers

### Monitoring
- **Health Checks**: 
  - Backend: `/health`
  - Frontend: `/api/health`
- **Error Boundaries**: Comprehensive error handling with recovery options
- **Logging**: Structured logging for production debugging
- **Ready for Monitoring**: Error boundaries configured for external services

## 🧪 API Endpoints

### Documents
- `POST /documents/upload` - Upload a document
- `GET /documents/` - List all documents
- `DELETE /documents/{id}` - Delete a document

### Query
- `POST /query/` - Submit a query and get AI-generated answer

### System
- `GET /` - Root endpoint with system info
- `GET /health` - Health check endpoint

## 🔍 Usage

1. **Upload Documents**: Use the upload interface to add PDF or TXT files
2. **Ask Questions**: Type your question in the search box
3. **Get Answers**: Receive AI-generated answers with source citations
4. **Manage Documents**: View and delete uploaded documents

## 🐛 Troubleshooting

### Common Issues

#### CORS Errors
- Ensure backend `ALLOWED_ORIGINS` includes your frontend domain
- Verify `NEXT_PUBLIC_API_URL` is correctly configured

#### Build Failures
- Check all required environment variables are set
- Verify TypeScript compilation passes
- Ensure OpenAI API key is valid

#### API Connection Issues
- Verify backend is accessible and healthy
- Check network logs in browser developer tools
- Confirm environment variables match deployment URLs

### Health Checks
- **Local Backend**: `http://localhost:8000/health`
- **Local Frontend**: `http://localhost:3000/api/health`
- **Production**: Use your deployed URLs

## 📁 Project Structure

```
knowledge-base-search-engine/
├── backend/                 # FastAPI backend
│   ├── app/                # Application modules
│   │   ├── config.py       # Configuration settings
│   │   ├── models.py       # Data models
│   │   ├── routes.py       # API routes
│   │   ├── services.py     # Business logic
│   │   └── storage.py      # Data storage
│   ├── Dockerfile          # Docker configuration
│   ├── requirements.txt    # Python dependencies
│   └── main.py            # Application entry point
├── frontend/               # Next.js frontend
│   ├── src/
│   │   ├── app/           # Next.js app router
│   │   ├── components/    # React components
│   │   ├── contexts/      # React contexts
│   │   ├── lib/          # Utilities and configuration
│   │   └── types/        # TypeScript types
│   ├── vercel.json       # Vercel configuration
│   └── package.json      # Node.js dependencies
└── README.md             # This file
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

If you encounter issues:

1. Check the troubleshooting section above
2. Verify your environment variables
3. Check the health endpoints
4. Review the logs for error details

For additional support, please open an issue in the repository.

---

**Built with ❤️ using FastAPI, Next.js, and OpenAI**