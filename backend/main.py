import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
from anthropic import Anthropic
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = FastAPI(title="Study Buddy API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Vite's default port
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Anthropic client
anthropic_client = Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))


# Request/Response Models
class TextToTopicsRequest(BaseModel):
    text: str


class TopicsResponse(BaseModel):
    topics: List[str]


class TopicExplanationRequest(BaseModel):
    topic: str


class ExplanationResponse(BaseModel):
    topic: str
    explanation: str


class ConceptRequest(BaseModel):
    concepts: List[str]


class Flashcard(BaseModel):
    id: str
    topic: str
    explanation: str


class FlashcardResponse(BaseModel):
    flashcards: List[Flashcard]


# Helper function to call Claude
async def call_claude(prompt: str, system_prompt: str = None) -> str:
    """Call Claude Sonnet API with the given prompt."""
    try:
        kwargs = {
            "model": "claude-sonnet-4-20250514",
            "max_tokens": 2048,
            "messages": [{"role": "user", "content": prompt}]
        }
        
        if system_prompt:
            kwargs["system"] = system_prompt
        
        message = anthropic_client.messages.create(**kwargs)
        return message.content[0].text
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error calling Claude API: {str(e)}")


@app.get("/")
async def root():
    return {"message": "Welcome to Study Buddy API"}


@app.get("/health")
async def health_check():
    return {"status": "healthy"}


@app.post("/api/extract-topics", response_model=TopicsResponse)
async def extract_topics(request: TextToTopicsRequest):
    """
    Takes a chunk of text and intelligently breaks it up into discrete topics.
    Returns a list of topics extracted from the text.
    """
    system_prompt = """You are an expert at analyzing text and extracting discrete study topics.
Your task is to identify distinct concepts, terms, or subjects that someone would want to study.
Return ONLY a comma-separated list of topics, nothing else.
Each topic should be concise (1-5 words) and represent a clear, distinct concept.
Extract between 3-15 topics depending on the content."""

    prompt = f"""Analyze the following text and extract discrete study topics from it.
Return your response as a simple comma-separated list of topics, with no other text, formatting, or explanation.

Text to analyze:
{request.text}

Topics (comma-separated):"""

    try:
        response = await call_claude(prompt, system_prompt)
        
        # Parse the comma-separated topics
        topics = [topic.strip() for topic in response.split(',') if topic.strip()]
        
        # Remove any empty strings and deduplicate
        topics = list(dict.fromkeys([t for t in topics if t]))
        
        return TopicsResponse(topics=topics)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/explain-topic", response_model=ExplanationResponse)
async def explain_topic(request: TopicExplanationRequest):
    """
    Takes a topic and returns a detailed yet succinct explanation suitable for a flashcard.
    """
    system_prompt = """You are an expert educator who creates clear, concise explanations for study flashcards.
Your explanations should be:
- Detailed enough to be educational
- Succinct enough to fit on a flashcard (2-4 sentences)
- Clear and easy to understand
- Factually accurate
- Focused on the key concepts

Write in a friendly, educational tone."""

    prompt = f"""Provide a clear, concise explanation of the following topic suitable for a study flashcard.
Keep your explanation to 2-4 sentences that capture the essential information.

Topic: {request.topic}

Explanation:"""

    try:
        explanation = await call_claude(prompt, system_prompt)
        
        return ExplanationResponse(
            topic=request.topic,
            explanation=explanation.strip()
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/generate-flashcards", response_model=FlashcardResponse)
async def generate_flashcards(request: ConceptRequest):
    """
    Generate flashcards with explanations for the given concepts.
    This endpoint is kept for backward compatibility but topics should be
    extracted using /api/extract-topics first.
    """
    flashcards = []
    
    for idx, concept in enumerate(request.concepts):
        # Generate explanation for each concept
        explanation_response = await explain_topic(TopicExplanationRequest(topic=concept))
        
        flashcard = Flashcard(
            id=f"card-{idx}",
            topic=concept,
            explanation=explanation_response.explanation
        )
        flashcards.append(flashcard)
    
    return FlashcardResponse(flashcards=flashcards)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
