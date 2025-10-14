# Deployment Guide

## Docker Deployment

### Building the Docker Image

```bash
# Build the image
docker build -t knowledge-base-api .

# Run the container
docker run -p 8000:8000 --env-file .env knowledge-base-api
```

### Using Docker Compose

```bash
# Start the service
docker-compose up -d

# View logs
docker-compose logs -f

# Stop the service
docker-compose down
```

### Environment Variables

Required environment variables:

- `OPENAI_API_KEY`: Your OpenAI API key for LLM integration

Optional environment variables:

- `HOST`: Server host (default: 0.0.0.0)
- `PORT`: Server port (default: 8000)
- `ALLOWED_ORIGINS`: Comma-separated list of allowed CORS origins

### Render Deployment

1. Connect your repository to Render
2. Create a new Web Service
3. Set the following configuration:
   - **Build Command**: `docker build -t app .`
   - **Start Command**: `docker run -p $PORT:8000 app`
   - **Environment Variables**: Add `OPENAI_API_KEY`

### Health Check

The application includes a health check endpoint at `/health` that returns:

```json
{
  "status": "healthy"
}
```

This endpoint is used by Docker's health check mechanism and can be used by deployment platforms for monitoring.

### Security Notes

- The Dockerfile creates a non-root user for security
- Sensitive files are excluded via .dockerignore
- Environment variables should be configured securely in production