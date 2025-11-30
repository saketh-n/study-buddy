import os
import json
import logging
import hashlib
import uuid
from pathlib import Path
from datetime import datetime
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, List, Optional
from anthropic import Anthropic
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('api.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# Create directories
CACHE_DIR = Path("prompt_cache")
FLASHCARDS_FILE = Path("flashcards_storage.json")

CACHE_DIR.mkdir(exist_ok=True)
logger.info(f"Cache directory ready at: {CACHE_DIR.absolute()}")

app = FastAPI(title="Study Buddy API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Anthropic client
anthropic_client = Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

# In-memory caches
prompt_cache: Dict[str, Dict] = {}
flashcards_storage: Dict[str, Dict] = {}  # {flashcard_id: flashcard_data}


# Storage functions
def load_cache_from_disk():
    """Load all cached prompts from disk into memory."""
    try:
        for cache_file in CACHE_DIR.glob("*.json"):
            try:
                with open(cache_file, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    cache_key = cache_file.stem
                    prompt_cache[cache_key] = data
                    logger.info(f"Loaded cache entry: {cache_key}")
            except Exception as e:
                logger.error(f"Error loading cache file {cache_file}: {e}")
        logger.info(f"Loaded {len(prompt_cache)} cache entries from disk")
    except Exception as e:
        logger.error(f"Error loading cache from disk: {e}")


def save_cache_to_disk(cache_key: str, data: Dict):
    """Save a cache entry to disk."""
    try:
        cache_file = CACHE_DIR / f"{cache_key}.json"
        with open(cache_file, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        logger.info(f"Saved cache entry to disk: {cache_key}")
    except Exception as e:
        logger.error(f"Error saving cache to disk: {e}")


def delete_cache_from_disk(cache_key: str):
    """Delete a cache entry from disk."""
    try:
        cache_file = CACHE_DIR / f"{cache_key}.json"
        if cache_file.exists():
            cache_file.unlink()
            logger.info(f"Deleted cache file from disk: {cache_key}")
            return True
        return False
    except Exception as e:
        logger.error(f"Error deleting cache from disk: {e}")
        return False


def load_flashcards_from_disk():
    """Load all flashcards from disk into memory."""
    global flashcards_storage
    try:
        if FLASHCARDS_FILE.exists():
            with open(FLASHCARDS_FILE, 'r', encoding='utf-8') as f:
                flashcards_storage = json.load(f)
            logger.info(f"Loaded {len(flashcards_storage)} flashcards from disk")
        else:
            flashcards_storage = {}
            logger.info("No existing flashcards file found, starting fresh")
    except Exception as e:
        logger.error(f"Error loading flashcards from disk: {e}")
        flashcards_storage = {}


def save_flashcards_to_disk():
    """Save all flashcards to disk."""
    try:
        with open(FLASHCARDS_FILE, 'w', encoding='utf-8') as f:
            json.dump(flashcards_storage, f, indent=2, ensure_ascii=False)
        logger.info(f"Saved {len(flashcards_storage)} flashcards to disk")
    except Exception as e:
        logger.error(f"Error saving flashcards to disk: {e}")


# Load on startup
load_cache_from_disk()
load_flashcards_from_disk()


# Request/Response Models
class TextToTopicsRequest(BaseModel):
    text: str


class Topic(BaseModel):
    id: str
    name: str
    context: str
    subject: str  # NEW: e.g., "Networking", "Storage", "Security"


class TopicsListResponse(BaseModel):
    prompt_theme: str
    topics: List[Topic]
    cache_key: str


class ChatMessage(BaseModel):
    role: str  # "user" or "assistant"
    content: str
    timestamp: str


class Flashcard(BaseModel):
    id: str
    topic: str
    subject: str  # NEW: for categorization
    explanation: str
    chat_history: List[ChatMessage] = []


class GenerateFlashcardsRequest(BaseModel):
    topics: List[Topic]
    original_text: Optional[str] = None


class FlashcardsResponse(BaseModel):
    flashcards: List[Flashcard]


class UpdateFlashcardRequest(BaseModel):
    topic: Optional[str] = None
    explanation: Optional[str] = None


class CreateFlashcardRequest(BaseModel):
    topic: str
    subject: str
    explanation: Optional[str] = None
    generate_explanation: bool = False  # If True, use AI to generate explanation
    context: Optional[str] = None  # Context for AI generation


class ChatRequest(BaseModel):
    flashcard_id: str
    message: str


class ChatResponse(BaseModel):
    response: str
    chat_history: List[ChatMessage]


class DistillChatRequest(BaseModel):
    flashcard_id: str


class TopicExplanationRequest(BaseModel):
    topic: str
    context: Optional[str] = None


class ExplanationResponse(BaseModel):
    topic: str
    explanation: str


class CacheCheckRequest(BaseModel):
    text: str


class CachedPrompt(BaseModel):
    cache_key: str
    prompt_theme: str
    topic_count: int
    timestamp: str


class CacheCheckResponse(BaseModel):
    cached: bool
    cache_key: Optional[str] = None
    prompt_theme: Optional[str] = None
    topics: Optional[List[Topic]] = None


class ListCachedPromptsResponse(BaseModel):
    prompts: List[CachedPrompt]


# Helper functions
def generate_cache_key(text: str) -> str:
    """Generate a unique cache key from text content."""
    return hashlib.md5(text.encode()).hexdigest()


async def call_claude(prompt: str, system_prompt: str = None, max_tokens: int = 16384) -> str:
    """Call Claude Sonnet API with the given prompt."""
    try:
        kwargs = {
            "model": "claude-sonnet-4-20250514",
            "max_tokens": max_tokens,
            "messages": [{"role": "user", "content": prompt}]
        }
        
        if system_prompt:
            kwargs["system"] = system_prompt
        
        logger.info(f"Calling Claude API with max_tokens={max_tokens}")
        
        message = anthropic_client.messages.create(**kwargs)
        response_text = message.content[0].text
        
        logger.info(f"Claude API Response (length: {len(response_text)} chars)")
        logger.info(f"Stop reason: {message.stop_reason}")
        logger.info(f"Tokens used - Input: {message.usage.input_tokens}, Output: {message.usage.output_tokens}")
        
        return response_text
    except Exception as e:
        logger.error(f"Error calling Claude API: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Error calling Claude API: {str(e)}")


# Endpoints
@app.get("/")
async def root():
    return {"message": "Welcome to Study Buddy API"}


@app.get("/health")
async def health_check():
    return {"status": "healthy"}


@app.get("/api/cached-prompts", response_model=ListCachedPromptsResponse)
async def list_cached_prompts():
    """List all cached prompts with their themes."""
    prompts = []
    
    for cache_key, data in prompt_cache.items():
        prompts.append(CachedPrompt(
            cache_key=cache_key,
            prompt_theme=data.get("prompt_theme", "Untitled prompt"),
            topic_count=len(data.get("topics", [])),
            timestamp=data.get("timestamp", "")
        ))
    
    prompts.sort(key=lambda x: x.timestamp, reverse=True)
    
    logger.info(f"Returning {len(prompts)} cached prompts")
    return ListCachedPromptsResponse(prompts=prompts)


@app.post("/api/check-cache", response_model=CacheCheckResponse)
async def check_cache(request: CacheCheckRequest):
    """Check if we have cached results for this text."""
    cache_key = generate_cache_key(request.text)
    
    if cache_key in prompt_cache:
        logger.info(f"Cache HIT for key: {cache_key}")
        cached_data = prompt_cache[cache_key]
        return CacheCheckResponse(
            cached=True,
            cache_key=cache_key,
            prompt_theme=cached_data.get("prompt_theme", ""),
            topics=cached_data["topics"]
        )
    
    logger.info(f"Cache MISS for key: {cache_key}")
    return CacheCheckResponse(cached=False)


@app.get("/api/get-cached/{cache_key}", response_model=TopicsListResponse)
async def get_cached_prompt(cache_key: str):
    """Retrieve a cached prompt by its key."""
    if cache_key not in prompt_cache:
        raise HTTPException(status_code=404, detail="Cache key not found")
    
    cached_data = prompt_cache[cache_key]
    logger.info(f"Retrieved cached prompt: {cache_key}")
    
    return TopicsListResponse(
        prompt_theme=cached_data.get("prompt_theme", ""),
        topics=cached_data["topics"],
        cache_key=cache_key
    )


@app.delete("/api/delete-cached/{cache_key}")
async def delete_cached_prompt(cache_key: str):
    """Delete a cached prompt from both memory and disk."""
    if cache_key not in prompt_cache:
        raise HTTPException(status_code=404, detail="Cache key not found")
    
    del prompt_cache[cache_key]
    delete_cache_from_disk(cache_key)
    
    logger.info(f"Deleted cached prompt: {cache_key}")
    return {"message": "Cache entry deleted successfully", "cache_key": cache_key}


@app.post("/api/regenerate-cached/{cache_key}", response_model=TopicsListResponse)
async def regenerate_cached_prompt(cache_key: str):
    """Regenerate topics for a cached prompt with fresh AI extraction."""
    if cache_key not in prompt_cache:
        raise HTTPException(status_code=404, detail="Cache key not found")
    
    cached_data = prompt_cache[cache_key]
    original_text = cached_data.get("original_text", "")
    
    if not original_text:
        raise HTTPException(status_code=400, detail="Original text not found in cache")
    
    logger.info(f"Regenerating cached prompt: {cache_key}")
    
    del prompt_cache[cache_key]
    delete_cache_from_disk(cache_key)
    
    # Re-extract using extract_topics logic
    request = TextToTopicsRequest(text=original_text)
    return await extract_topics(request)


@app.post("/api/extract-topics", response_model=TopicsListResponse)
async def extract_topics(request: TextToTopicsRequest):
    """Extract topics with context and subject categorization from text."""
    logger.info("=" * 80)
    logger.info(f"Received extract-topics request at {datetime.now()}")
    logger.info(f"Input text length: {len(request.text)} characters")
    
    cache_key = generate_cache_key(request.text)
    if cache_key in prompt_cache:
        logger.info(f"Returning cached result for key: {cache_key}")
        cached_data = prompt_cache[cache_key]
        return TopicsListResponse(
            prompt_theme=cached_data.get("prompt_theme", "Cached topics"),
            topics=cached_data["topics"],
            cache_key=cache_key
        )
    
    system_prompt = """You are an obsessive, hyper-granular study-flashcard generator.

Hard rules:
- Extract 100–250+ topics from dense technical text (500–3000 words). Minimum 80 topics.
- Every acronym, number, port, version, company, product, command, error code, formula, law, theorem, example, or value becomes its own topic.
- Never bundle lists — each item is separate.
- Context notes: 2–6 words only.
- Topic names: 1–6 words, maximally specific (e.g., "SSH port 22", "Python 3.11").
- For each topic, assign a SUBJECT category (1-2 words) like: "Networking", "Storage", "Security", "Programming", "Hardware", "Database", "Cloud", "Math", "Physics", etc.

Return JSON:
{
  "prompt_theme": "short theme (3-7 words)",
  "topics": [
    {"name": "Topic", "context": "brief note", "subject": "Category"},
    ...
  ]
}"""

    prompt = f"""Analyze this text and extract ALL discrete topics with subjects:

Text:
{request.text}

Return JSON with prompt_theme, and topics array (each with name, context, and subject):"""

    try:
        response = await call_claude(prompt, system_prompt, max_tokens=16384)
        
        cleaned_response = response.strip()
        if cleaned_response.startswith('```json'):
            cleaned_response = cleaned_response[7:]
        if cleaned_response.startswith('```'):
            cleaned_response = cleaned_response[3:]
        if cleaned_response.endswith('```'):
            cleaned_response = cleaned_response[:-3]
        cleaned_response = cleaned_response.strip()
        
        parsed_data = json.loads(cleaned_response)
        
        if not isinstance(parsed_data, dict) or "topics" not in parsed_data:
            raise ValueError("Response doesn't have expected 'topics' array")
        
        prompt_theme = parsed_data.get("prompt_theme", "Study topics")
        
        topics = [
            Topic(
                id=f"topic-{idx}",
                name=topic.get("name", ""),
                context=topic.get("context", ""),
                subject=topic.get("subject", "General")
            )
            for idx, topic in enumerate(parsed_data["topics"])
        ]
        
        logger.info(f"Successfully extracted {len(topics)} topics")
        
        cache_data = {
            "prompt_theme": prompt_theme,
            "topics": [t.dict() for t in topics],
            "original_text": request.text,
            "timestamp": datetime.now().isoformat()
        }
        
        prompt_cache[cache_key] = cache_data
        save_cache_to_disk(cache_key, cache_data)
        
        logger.info("=" * 80)
        
        return TopicsListResponse(
            prompt_theme=prompt_theme,
            topics=topics,
            cache_key=cache_key
        )
        
    except json.JSONDecodeError as e:
        logger.error(f"Failed to parse JSON response: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to parse JSON response: {str(e)}")
    except Exception as e:
        logger.error(f"Error in extract_topics: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/generate-flashcards", response_model=FlashcardsResponse)
async def generate_flashcards(request: GenerateFlashcardsRequest):
    """Generate flashcards from topics and save to storage."""
    logger.info("=" * 80)
    logger.info(f"Generating flashcards for {len(request.topics)} topics")
    
    flashcards = []
    
    for topic in request.topics:
        # Generate unique ID
        flashcard_id = str(uuid.uuid4())
        
        logger.info(f"Generating explanation for: {topic.name} (subject: {topic.subject})")
        
        system_prompt = """You are an expert educator. Create clear, concise explanations for study flashcards (2-4 sentences)."""
        
        context_note = f" (context: {topic.context})" if topic.context else ""
        prompt = f"""Explain this topic for a flashcard:

Topic: {topic.name}{context_note}

Explanation:"""

        try:
            explanation = await call_claude(prompt, system_prompt, max_tokens=2048)
            
            flashcard = Flashcard(
                id=flashcard_id,
                topic=topic.name,
                subject=topic.subject,
                explanation=explanation.strip(),
                chat_history=[]
            )
            flashcards.append(flashcard)
            
            # Save to storage
            flashcards_storage[flashcard_id] = flashcard.dict()
            
        except Exception as e:
            logger.error(f"Error generating explanation for {topic.name}: {str(e)}")
            flashcard = Flashcard(
                id=flashcard_id,
                topic=topic.name,
                subject=topic.subject,
                explanation=f"Error: {str(e)}",
                chat_history=[]
            )
            flashcards.append(flashcard)
            flashcards_storage[flashcard_id] = flashcard.dict()
    
    # Save all flashcards to disk
    save_flashcards_to_disk()
    
    logger.info(f"Generated and saved {len(flashcards)} flashcards")
    logger.info("=" * 80)
    
    return FlashcardsResponse(flashcards=flashcards)


@app.post("/api/flashcards", response_model=Flashcard)
async def create_flashcard(request: CreateFlashcardRequest):
    """Create a new flashcard manually or with AI-generated explanation."""
    logger.info("=" * 80)
    logger.info(f"Creating flashcard for topic: {request.topic}")
    
    flashcard_id = str(uuid.uuid4())
    explanation = request.explanation or ""
    
    # If generate_explanation is True, use AI to generate the explanation
    if request.generate_explanation:
        logger.info(f"Generating AI explanation for: {request.topic}")
        system_prompt = """You are an expert educator. Create clear, concise explanations for study flashcards (2-4 sentences)."""
        
        context_note = f" (context: {request.context})" if request.context else ""
        prompt = f"""Explain this topic for a flashcard:

Topic: {request.topic}{context_note}

Explanation:"""
        
        try:
            explanation = await call_claude(prompt, system_prompt, max_tokens=2048)
            explanation = explanation.strip()
        except Exception as e:
            logger.error(f"Error generating explanation: {str(e)}")
            explanation = f"Error generating explanation: {str(e)}"
    
    flashcard = Flashcard(
        id=flashcard_id,
        topic=request.topic,
        subject=request.subject,
        explanation=explanation,
        chat_history=[]
    )
    
    # Save to storage
    flashcards_storage[flashcard_id] = flashcard.dict()
    save_flashcards_to_disk()
    
    logger.info(f"Created flashcard: {flashcard_id}")
    logger.info("=" * 80)
    
    return flashcard


@app.get("/api/flashcards", response_model=FlashcardsResponse)
async def get_all_flashcards():
    """Get all saved flashcards."""
    flashcards = [Flashcard(**data) for data in flashcards_storage.values()]
    return FlashcardsResponse(flashcards=flashcards)


@app.get("/api/flashcards/{flashcard_id}", response_model=Flashcard)
async def get_flashcard(flashcard_id: str):
    """Get a specific flashcard."""
    if flashcard_id not in flashcards_storage:
        raise HTTPException(status_code=404, detail="Flashcard not found")
    return Flashcard(**flashcards_storage[flashcard_id])


@app.put("/api/flashcards/{flashcard_id}")
async def update_flashcard(flashcard_id: str, request: UpdateFlashcardRequest):
    """Update flashcard topic or explanation."""
    if flashcard_id not in flashcards_storage:
        raise HTTPException(status_code=404, detail="Flashcard not found")
    
    if request.topic is not None:
        flashcards_storage[flashcard_id]["topic"] = request.topic
    if request.explanation is not None:
        flashcards_storage[flashcard_id]["explanation"] = request.explanation
    
    save_flashcards_to_disk()
    
    return Flashcard(**flashcards_storage[flashcard_id])


@app.delete("/api/flashcards/{flashcard_id}")
async def delete_flashcard(flashcard_id: str):
    """Delete a flashcard."""
    if flashcard_id not in flashcards_storage:
        raise HTTPException(status_code=404, detail="Flashcard not found")
    
    del flashcards_storage[flashcard_id]
    save_flashcards_to_disk()
    
    return {"message": "Flashcard deleted", "id": flashcard_id}


@app.post("/api/flashcards/{flashcard_id}/chat", response_model=ChatResponse)
async def chat_with_flashcard(flashcard_id: str, request: ChatRequest):
    """Chat with Claude about a flashcard topic."""
    if flashcard_id not in flashcards_storage:
        raise HTTPException(status_code=404, detail="Flashcard not found")
    
    flashcard = flashcards_storage[flashcard_id]
    chat_history = flashcard.get("chat_history", [])
    
    # Add user message
    user_message = ChatMessage(
        role="user",
        content=request.message,
        timestamp=datetime.now().isoformat()
    )
    chat_history.append(user_message.dict())
    
    # Build context for Claude
    system_prompt = f"""You are a helpful tutor discussing the topic: {flashcard['topic']}

Current explanation: {flashcard['explanation']}

Answer the user's questions clearly and help them understand the concept better."""
    
    # Get Claude's response
    try:
        response_text = await call_claude(request.message, system_prompt, max_tokens=2048)
        
        assistant_message = ChatMessage(
            role="assistant",
            content=response_text,
            timestamp=datetime.now().isoformat()
        )
        chat_history.append(assistant_message.dict())
        
        # Save updated chat history
        flashcards_storage[flashcard_id]["chat_history"] = chat_history
        save_flashcards_to_disk()
        
        return ChatResponse(
            response=response_text,
            chat_history=[ChatMessage(**msg) for msg in chat_history]
        )
        
    except Exception as e:
        logger.error(f"Error in chat: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/api/flashcards/{flashcard_id}/chat")
async def clear_chat_history(flashcard_id: str):
    """Clear chat history for a flashcard."""
    if flashcard_id not in flashcards_storage:
        raise HTTPException(status_code=404, detail="Flashcard not found")
    
    flashcards_storage[flashcard_id]["chat_history"] = []
    save_flashcards_to_disk()
    
    return {"message": "Chat history cleared", "id": flashcard_id}


@app.post("/api/flashcards/{flashcard_id}/distill", response_model=Flashcard)
async def distill_chat_to_explanation(flashcard_id: str):
    """Distill chat history into an updated explanation."""
    if flashcard_id not in flashcards_storage:
        raise HTTPException(status_code=404, detail="Flashcard not found")
    
    flashcard = flashcards_storage[flashcard_id]
    chat_history = flashcard.get("chat_history", [])
    
    if not chat_history:
        raise HTTPException(status_code=400, detail="No chat history to distill")
    
    # Build prompt to distill chat into new explanation
    chat_text = "\n\n".join([
        f"{msg['role'].upper()}: {msg['content']}"
        for msg in chat_history
    ])
    
    system_prompt = """You are an expert at synthesizing information. 
Create a comprehensive but concise flashcard explanation (3-5 sentences) that incorporates insights from the conversation."""
    
    prompt = f"""Topic: {flashcard['topic']}

Original explanation: {flashcard['explanation']}

Conversation:
{chat_text}

Create an improved flashcard explanation that incorporates key insights from the conversation:"""

    try:
        new_explanation = await call_claude(prompt, system_prompt, max_tokens=2048)
        
        flashcards_storage[flashcard_id]["explanation"] = new_explanation.strip()
        save_flashcards_to_disk()
        
        return Flashcard(**flashcards_storage[flashcard_id])
        
    except Exception as e:
        logger.error(f"Error distilling chat: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/explain-topic", response_model=ExplanationResponse)
async def explain_topic(request: TopicExplanationRequest):
    """Generate explanation for a single topic."""
    logger.info(f"Explaining topic: {request.topic}")
    
    system_prompt = """You are an expert educator. Create clear, concise explanations (2-4 sentences)."""
    
    context_note = f" (context: {request.context})" if request.context else ""
    prompt = f"""Explain this topic for a flashcard:

Topic: {request.topic}{context_note}

Explanation:"""

    try:
        explanation = await call_claude(prompt, system_prompt, max_tokens=2048)
        return ExplanationResponse(
            topic=request.topic,
            explanation=explanation.strip()
        )
    except Exception as e:
        logger.error(f"Error in explain_topic: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
