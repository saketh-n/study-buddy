import os
import json
import logging
import hashlib
import uuid
import base64
from pathlib import Path
from datetime import datetime
from fastapi import FastAPI, HTTPException, File, UploadFile
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
    concise_mode: bool = False


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
    section: Optional[str] = None  # Section within subject
    subsection: Optional[str] = None  # Subsection within section


class SubjectPodcast(BaseModel):
    subject: str
    transcript: str
    generated_at: str


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


class OrganizeFlashcardsRequest(BaseModel):
    flashcard_ids: List[str]  # IDs of flashcards to organize into hierarchy


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
    
    if request.concise_mode:
        system_prompt = """You are a focused, concise study-flashcard generator.

Hard rules:
- Extract 20–50 core topics from text. Focus on major concepts, not granular details.
- Prioritize fundamental concepts, key definitions, and main ideas.
- Group related items (e.g., "Common network ports" instead of each port separately).
- Context notes: 2–6 words only.
- Topic names: 1–6 words, clear and specific.
- For each topic, assign a SUBJECT category (1-2 words) like: "Networking", "Storage", "Security", "Programming", etc.

Return JSON:
{
  "prompt_theme": "short theme (3-7 words)",
  "topics": [
    {"name": "Topic", "context": "brief note", "subject": "Category"},
    ...
  ]
}"""
    else:
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


@app.post("/api/extract-topics-from-image", response_model=TopicsListResponse)
async def extract_topics_from_image(file: UploadFile = File(...)):
    """Extract topics from an uploaded image using Claude Vision API."""
    logger.info("=" * 80)
    logger.info(f"Received image upload: {file.filename}")
    
    # Read and validate image
    try:
        image_data = await file.read()
        
        # Validate file size (max 5MB)
        if len(image_data) > 5 * 1024 * 1024:
            raise HTTPException(status_code=400, detail="Image file too large (max 5MB)")
        
        # Detect media type
        content_type = file.content_type or "image/jpeg"
        if content_type not in ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"]:
            raise HTTPException(status_code=400, detail="Unsupported image format. Use JPEG, PNG, GIF, or WebP.")
        
        # Convert to base64
        image_base64 = base64.standard_b64encode(image_data).decode("utf-8")
        
        logger.info(f"Image size: {len(image_data)} bytes, type: {content_type}")
        
    except Exception as e:
        logger.error(f"Error reading image: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Failed to read image: {str(e)}")
    
    # Use Claude Vision API
    system_prompt = """You are an obsessive, hyper-granular study-flashcard generator analyzing images.

Extract ALL topics, questions, concepts, formulas, diagrams, or text visible in the image:
- Extract 50–200+ topics from dense content.
- Every term, question, formula, diagram label, example, or concept becomes its own topic.
- Context notes: 2–6 words describing where/how it appears.
- Topic names: 1–6 words, maximally specific.
- For each topic, assign a SUBJECT category (1-2 words) like: "Networking", "Math", "Physics", "Chemistry", "Biology", "Programming", etc.

Return JSON:
{
  "prompt_theme": "short theme (3-7 words)",
  "topics": [
    {"name": "Topic", "context": "from diagram/text", "subject": "Category"},
    ...
  ]
}"""

    try:
        # Call Claude Vision API
        logger.info("Calling Claude Vision API...")
        message = anthropic_client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=16384,
            system=system_prompt,
            messages=[
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "image",
                            "source": {
                                "type": "base64",
                                "media_type": content_type,
                                "data": image_base64,
                            },
                        },
                        {
                            "type": "text",
                            "text": "Analyze this image and extract ALL topics, questions, and concepts with their subjects. Return JSON with prompt_theme and topics array:"
                        }
                    ],
                }
            ],
        )
        
        response_text = message.content[0].text
        logger.info(f"Vision API response length: {len(response_text)} characters")
        logger.info(f"Stop reason: {message.stop_reason}, Tokens used: {message.usage}")
        
        # Parse response
        cleaned_response = response_text.strip()
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
        
        prompt_theme = parsed_data.get("prompt_theme", "Image analysis")
        
        topics = [
            Topic(
                id=f"topic-{idx}",
                name=topic.get("name", ""),
                context=topic.get("context", ""),
                subject=topic.get("subject", "General")
            )
            for idx, topic in enumerate(parsed_data["topics"])
        ]
        
        logger.info(f"Successfully extracted {len(topics)} topics from image")
        
        # Generate cache key based on image hash
        image_hash = hashlib.md5(image_data).hexdigest()
        cache_key = f"img_{image_hash}"
        
        # Cache the result
        cache_data = {
            "prompt_theme": prompt_theme,
            "topics": [t.dict() for t in topics],
            "original_text": f"[Image: {file.filename}]",
            "timestamp": datetime.now().isoformat(),
            "source": "image"
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
        logger.error(f"Error in extract_topics_from_image: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/extract-topics-intelligent", response_model=TopicsListResponse)
async def extract_topics_intelligent(request: TextToTopicsRequest):
    """
    Intelligent two-step topic extraction:
    1. First extract all questions from the text
    2. Then use those questions to generate specific, granular topics
    """
    logger.info("=" * 80)
    logger.info(f"Received intelligent extract-topics request at {datetime.now()}")
    logger.info(f"Input text length: {len(request.text)} characters")
    
    cache_key = generate_cache_key(f"intelligent_{request.text}")
    if cache_key in prompt_cache:
        logger.info(f"Returning cached result for key: {cache_key}")
        cached_data = prompt_cache[cache_key]
        return TopicsListResponse(
            prompt_theme=cached_data.get("prompt_theme", "Cached topics"),
            topics=cached_data["topics"],
            cache_key=cache_key
        )
    
    # Step 1: Extract questions
    logger.info("Step 1: Extracting questions from text...")
    
    question_system_prompt = """You are a question extraction expert. Find ALL questions (explicit or implicit) in the text.

Extract:
- Explicit questions (marked with "?")
- Implicit questions (e.g., "important things to know", "key concepts", "what you should understand")
- Study prompts (e.g., "list all X", "understand Y", "know the Z")

Return JSON:
{
  "questions": [
    {"question": "What are the important port numbers?", "context": "networking"},
    {"question": "Which Unix commands are essential?", "context": "system admin"},
    ...
  ]
}"""

    question_prompt = f"""Extract ALL questions (explicit and implicit) from this text:

Text:
{request.text}

Return JSON with questions array:"""

    try:
        # Extract questions
        questions_response = await call_claude(question_prompt, question_system_prompt, max_tokens=8192)
        
        cleaned = questions_response.strip()
        if cleaned.startswith('```json'):
            cleaned = cleaned[7:]
        if cleaned.startswith('```'):
            cleaned = cleaned[3:]
        if cleaned.endswith('```'):
            cleaned = cleaned[:-3]
        cleaned = cleaned.strip()
        
        questions_data = json.loads(cleaned)
        questions = questions_data.get("questions", [])
        
        logger.info(f"Extracted {len(questions)} questions")
        
        # Step 2: Generate granular topics from questions
        logger.info("Step 2: Generating granular topics from questions...")
        
        topics_system_prompt = """You are an obsessive, hyper-granular study-flashcard generator.

For each question provided, generate 5–20+ specific, discrete topics that answer it.

Hard rules:
- Break down questions into atomic topics (e.g., "MySQL port 3306", "SSH port 22", not "common ports")
- Every specific item, number, command, example becomes its own topic
- Never bundle lists
- Context notes: 2–6 words
- Topic names: 1–6 words, maximally specific
- Assign SUBJECT categories (e.g., "Networking", "Database", "Security")

Return JSON:
{
  "prompt_theme": "short theme (3-7 words)",
  "topics": [
    {"name": "MySQL port 3306", "context": "database networking", "subject": "Database"},
    {"name": "SSH port 22", "context": "secure shell", "subject": "Networking"},
    ...
  ]
}"""

        questions_text = "\n".join([f"- {q.get('question', '')}" for q in questions])
        
        topics_prompt = f"""Generate granular topics to answer these questions:

Questions:
{questions_text}

Original context:
{request.text[:500]}...

Return JSON with prompt_theme and topics array (each with name, context, and subject):"""

        topics_response = await call_claude(topics_prompt, topics_system_prompt, max_tokens=16384)
        
        # Parse topics response
        cleaned_topics = topics_response.strip()
        if cleaned_topics.startswith('```json'):
            cleaned_topics = cleaned_topics[7:]
        if cleaned_topics.startswith('```'):
            cleaned_topics = cleaned_topics[3:]
        if cleaned_topics.endswith('```'):
            cleaned_topics = cleaned_topics[:-3]
        cleaned_topics = cleaned_topics.strip()
        
        parsed_data = json.loads(cleaned_topics)
        
        if not isinstance(parsed_data, dict) or "topics" not in parsed_data:
            raise ValueError("Response doesn't have expected 'topics' array")
        
        prompt_theme = parsed_data.get("prompt_theme", "Intelligent topic extraction")
        
        topics = [
            Topic(
                id=f"topic-{idx}",
                name=topic.get("name", ""),
                context=topic.get("context", ""),
                subject=topic.get("subject", "General")
            )
            for idx, topic in enumerate(parsed_data["topics"])
        ]
        
        logger.info(f"Successfully generated {len(topics)} granular topics from {len(questions)} questions")
        
        # Cache the result
        cache_data = {
            "prompt_theme": prompt_theme,
            "topics": [t.dict() for t in topics],
            "original_text": request.text,
            "timestamp": datetime.now().isoformat(),
            "questions_count": len(questions)
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
        logger.error(f"Error in extract_topics_intelligent: {str(e)}", exc_info=True)
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


@app.post("/api/organize-flashcards")
async def organize_flashcards(request: OrganizeFlashcardsRequest):
    """
    Organize flashcards into hierarchical structure using AI:
    1. Group by subjects (already done)
    2. Within each subject, create sections
    3. Within sections, create subsections where appropriate
    4. Assign flashcards to sections/subsections
    
    Returns the updated flashcards with section/subsection metadata
    """
    logger.info("=" * 80)
    logger.info(f"Organizing {len(request.flashcard_ids)} flashcards into hierarchy")
    
    if len(request.flashcard_ids) < 2:
        raise HTTPException(status_code=400, detail="Need at least 2 flashcards to organize")
    
    # Get all flashcards
    flashcards_to_organize = []
    for fid in request.flashcard_ids:
        if fid not in flashcards_storage:
            raise HTTPException(status_code=404, detail=f"Flashcard {fid} not found")
        flashcards_to_organize.append(flashcards_storage[fid])
    
    # Group by subject first
    by_subject = {}
    for fc in flashcards_to_organize:
        subject = fc.get('subject', 'General')
        if subject not in by_subject:
            by_subject[subject] = []
        by_subject[subject].append(fc)
    
    logger.info(f"Found {len(by_subject)} subjects")
    
    # Process each subject to create hierarchy
    updated_count = 0
    
    for subject, subject_flashcards in by_subject.items():
        logger.info(f"Organizing {len(subject_flashcards)} flashcards in subject: {subject}")
        
        # Only organize subjects with 30+ flashcards
        # Smaller subjects don't need hierarchical organization
        if len(subject_flashcards) < 18:
            logger.info(f"Skipping {subject}: only {len(subject_flashcards)} flashcards (threshold: 30)")
            continue
        
        # Prepare flashcard summaries for AI
        flashcard_summaries = "\n".join([
            f"ID: {fc['id']}\nTopic: {fc['topic']}\nExplanation: {fc['explanation'][:150]}..."
            for fc in subject_flashcards
        ])
        
        organize_system_prompt = """You are an expert at creating hierarchical knowledge structures.

Analyze flashcards within a subject and organize them into a 2-3 level hierarchy:
- Sections: Broad thematic groupings (5-15 flashcards per section)
- Subsections (optional): Finer subdivisions within sections (2-5 flashcards per subsection)

Rules:
- Create 3-8 sections per subject
- Only create subsections if a section has 6+ flashcards and clear subdivisions exist
- Every flashcard must be assigned to a section (and optionally a subsection)
- Section/subsection names should be clear, descriptive (2-5 words)

Return JSON:
{
  "sections": [
    {
      "name": "Section Name",
      "subsections": [
        {
          "name": "Subsection Name",
          "flashcard_ids": ["id1", "id2"]
        }
      ],
      "flashcard_ids": ["id3", "id4"]  // Flashcards directly in section (no subsection)
    }
  ]
}"""

        organize_prompt = f"""Organize these flashcards from subject "{subject}" into a hierarchical structure:

{flashcard_summaries}

Create sections and subsections. Return JSON:"""

        try:
            organize_response = await call_claude(organize_prompt, organize_system_prompt, max_tokens=8192)
            
            cleaned = organize_response.strip()
            if cleaned.startswith('```json'):
                cleaned = cleaned[7:]
            if cleaned.startswith('```'):
                cleaned = cleaned[3:]
            if cleaned.endswith('```'):
                cleaned = cleaned[:-3]
            cleaned = cleaned.strip()
            
            hierarchy_data = json.loads(cleaned)
            sections = hierarchy_data.get("sections", [])
            
            logger.info(f"Created {len(sections)} sections for {subject}")
            
            # Apply hierarchy to flashcards
            for section in sections:
                section_name = section.get("name", "Uncategorized")
                subsections = section.get("subsections", [])
                direct_flashcard_ids = section.get("flashcard_ids", [])
                
                # Assign flashcards directly in section (no subsection)
                for fid in direct_flashcard_ids:
                    if fid in flashcards_storage:
                        flashcards_storage[fid]["section"] = section_name
                        flashcards_storage[fid]["subsection"] = None
                        updated_count += 1
                
                # Assign flashcards in subsections
                for subsection in subsections:
                    subsection_name = subsection.get("name", "Uncategorized")
                    subsection_fc_ids = subsection.get("flashcard_ids", [])
                    
                    for fid in subsection_fc_ids:
                        if fid in flashcards_storage:
                            flashcards_storage[fid]["section"] = section_name
                            flashcards_storage[fid]["subsection"] = subsection_name
                            updated_count += 1
            
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse JSON for {subject}: {str(e)}", exc_info=True)
            continue
        except Exception as e:
            logger.error(f"Error organizing {subject}: {str(e)}", exc_info=True)
            continue
    
    # Save all changes
    save_flashcards_to_disk()
    
    logger.info(f"Organization complete: Updated {updated_count} flashcards with hierarchy")
    logger.info("=" * 80)
    
    # Return all flashcards
    all_flashcards = [Flashcard(**data) for data in flashcards_storage.values()]
    return {"message": f"Organized {updated_count} flashcards", "flashcards": all_flashcards}


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


@app.post("/api/generate-podcast/{subject}")
async def generate_podcast(subject: str):
    """
    Generate a podcast transcript for a subject by analyzing all flashcards,
    sections, and subsections to create an engaging narrative.
    """
    logger.info("=" * 80)
    logger.info(f"Generating podcast transcript for subject: {subject}")
    
    # Get all flashcards for this subject
    subject_flashcards = [
        Flashcard(**fc_data)
        for fc_data in flashcards_storage.values()
        if fc_data.get("subject") == subject
    ]
    
    if not subject_flashcards:
        raise HTTPException(status_code=404, detail=f"No flashcards found for subject: {subject}")
    
    # Check if we already have a cached podcast
    cache_key = f"podcast_{subject.replace(' ', '_').lower()}"
    if cache_key in prompt_cache:
        cached_podcast = prompt_cache[cache_key]
        logger.info(f"Returning cached podcast for {subject}")
        return SubjectPodcast(
            subject=subject,
            transcript=cached_podcast["transcript"],
            generated_at=cached_podcast["generated_at"]
        )
    
    # Organize flashcards by section and subsection
    by_section = {}
    no_section = []
    
    for fc in subject_flashcards:
        section = fc.section
        subsection = fc.subsection
        
        if not section:
            no_section.append(fc)
        else:
            if section not in by_section:
                by_section[section] = {"subsections": {}, "direct": []}
            
            if not subsection:
                by_section[section]["direct"].append(fc)
            else:
                if subsection not in by_section[section]["subsections"]:
                    by_section[section]["subsections"][subsection] = []
                by_section[section]["subsections"][subsection].append(fc)
    
    # Build content summary for AI
    content_summary = f"Subject: {subject}\n\n"
    
    # Add unorganized flashcards
    if no_section:
        content_summary += "Core Topics:\n"
        for fc in no_section:
            content_summary += f"- {fc.topic}: {fc.explanation[:200]}...\n"
        content_summary += "\n"
    
    # Add organized content
    for section_name, section_data in by_section.items():
        content_summary += f"\n§ {section_name}:\n"
        
        for fc in section_data["direct"]:
            content_summary += f"  - {fc.topic}: {fc.explanation[:200]}...\n"
        
        for subsection_name, subsection_cards in section_data["subsections"].items():
            content_summary += f"\n  › {subsection_name}:\n"
            for fc in subsection_cards:
                content_summary += f"    - {fc.topic}: {fc.explanation[:200]}...\n"
    
    logger.info(f"Content summary length: {len(content_summary)} characters")
    
    # Generate podcast transcript with AI
    system_prompt = """You are a world-class podcast host and educator, creating engaging audio content.

Create a comprehensive podcast transcript that:
- Starts with a warm, engaging introduction to the subject
- Explains concepts in a natural, conversational tone (like you're talking to a curious friend)
- Uses analogies, examples, and storytelling to make complex topics accessible
- Shows how different concepts connect and relate to each other
- Builds knowledge progressively, from fundamentals to advanced topics
- Includes occasional rhetorical questions to engage the listener
- Uses transitions like "Now let's talk about...", "Here's the interesting part...", "This connects to..."
- Ends with a summary and key takeaways

Write as if you're speaking, not writing. Use contractions, casual language, and enthusiasm.
Length: 1500-3000 words for comprehensive coverage."""

    prompt = f"""Create an engaging podcast transcript about {subject}.

Here's all the content to cover:

{content_summary[:15000]}  # Limit to avoid token overflow

Generate a natural, conversational podcast script that covers all these topics in an engaging way:"""

    try:
        transcript = await call_claude(prompt, system_prompt, max_tokens=16384)
        
        # Cache the result
        podcast_data = {
            "subject": subject,
            "transcript": transcript.strip(),
            "generated_at": datetime.now().isoformat()
        }
        
        prompt_cache[cache_key] = podcast_data
        save_cache_to_disk(cache_key, podcast_data)
        
        logger.info(f"Generated podcast transcript: {len(transcript)} characters")
        logger.info("=" * 80)
        
        return SubjectPodcast(
            subject=subject,
            transcript=transcript.strip(),
            generated_at=podcast_data["generated_at"]
        )
        
    except Exception as e:
        logger.error(f"Error generating podcast: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
