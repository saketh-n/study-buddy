# Study Buddy Backend

FastAPI backend for the Study Buddy application.

## Setup

1. Create a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Configure environment variables:
```bash
cp .env.example .env
# Edit .env with your API keys
```

4. Run the development server:
```bash
uvicorn main:app --reload
```

The API will be available at `http://localhost:8000`

## API Documentation

Once the server is running, visit:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## Endpoints

- `GET /` - Root endpoint
- `GET /health` - Health check
- `POST /api/generate-flashcards` - Generate flashcards with LLM explanations

## TODO

- [ ] Integrate LLM API (OpenAI, Anthropic, or Google Gemini)
- [ ] Add error handling and validation
- [ ] Implement rate limiting
- [ ] Add database for storing flashcards

