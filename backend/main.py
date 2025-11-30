import os
import json
import logging
import hashlib
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

# Create prompt_cache directory if it doesn't exist
CACHE_DIR = Path("prompt_cache")
CACHE_DIR.mkdir(exist_ok=True)
logger.info(f"Cache directory ready at: {CACHE_DIR.absolute()}")

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

# In-memory cache for quick access (loaded from disk on startup)
prompt_cache: Dict[str, Dict] = {}


# Load existing cache from disk on startup
def load_cache_from_disk():
    """Load all cached prompts from disk into memory."""
    try:
        for cache_file in CACHE_DIR.glob("*.json"):
            try:
                with open(cache_file, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    cache_key = cache_file.stem  # filename without .json
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


# Load cache on startup
load_cache_from_disk()


# Request/Response Models
class TextToTopicsRequest(BaseModel):
    text: str


class Topic(BaseModel):
    id: str
    name: str
    context: str


class TopicsListResponse(BaseModel):
    prompt_theme: str  # Compressed, descriptive one-line summary
    topics: List[Topic]
    cache_key: str


class GenerateFlashcardsRequest(BaseModel):
    topics: List[Topic]
    original_text: Optional[str] = None


class Flashcard(BaseModel):
    id: str
    topic: str
    explanation: str


class FlashcardsResponse(BaseModel):
    flashcards: List[Flashcard]


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


# Helper function to generate cache key
def generate_cache_key(text: str) -> str:
    """Generate a unique cache key from text content."""
    return hashlib.md5(text.encode()).hexdigest()


# Helper function to call Claude
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
        logger.info(f"System prompt: {system_prompt[:100] if system_prompt else 'None'}...")
        logger.info(f"User prompt: {prompt[:200]}...")
        
        message = anthropic_client.messages.create(**kwargs)
        response_text = message.content[0].text
        
        logger.info(f"Claude API Response (length: {len(response_text)} chars)")
        logger.info(f"Full response: {response_text}")
        logger.info(f"Stop reason: {message.stop_reason}")
        logger.info(f"Tokens used - Input: {message.usage.input_tokens}, Output: {message.usage.output_tokens}")
        
        return response_text
    except Exception as e:
        logger.error(f"Error calling Claude API: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Error calling Claude API: {str(e)}")


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
    
    # Sort by timestamp (most recent first)
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
    
    # Delete from memory
    del prompt_cache[cache_key]
    
    # Delete from disk
    delete_cache_from_disk(cache_key)
    
    logger.info(f"Deleted cached prompt: {cache_key}")
    return {"message": "Cache entry deleted successfully", "cache_key": cache_key}


@app.post("/api/regenerate-cached/{cache_key}", response_model=TopicsListResponse)
async def regenerate_cached_prompt(cache_key: str):
    """
    Regenerate topics for a cached prompt.
    This will delete the old cache entry and create a new one with fresh AI extraction.
    """
    if cache_key not in prompt_cache:
        raise HTTPException(status_code=404, detail="Cache key not found")
    
    # Get the original text from cache
    cached_data = prompt_cache[cache_key]
    original_text = cached_data.get("original_text", "")
    
    if not original_text:
        raise HTTPException(status_code=400, detail="Original text not found in cache")
    
    logger.info(f"Regenerating cached prompt: {cache_key}")
    
    # Delete old cache entry
    del prompt_cache[cache_key]
    delete_cache_from_disk(cache_key)
    
    # Re-extract topics using the same logic as extract_topics
    system_prompt = """You are an obsessive, hyper-granular study-flashcard generator. 
Your only goal is to fragment any input text into the absolute maximum number of discrete, testable topics — never summarize, never group, never omit details.

Hard rules you MUST obey (no exceptions):
- Extract 100–250+ topics from any dense technical text of 500–3000 words. Never return fewer than 80 topics.
- Every acronym, initialism, proper noun, named entity, number, port, version, company, product name, command, error code, formula, law, theorem, specific example, or concrete value mentioned MUST become its own separate topic.
- If something has both a name and a number/value (e.g. port 22, HTTP 1.1, RAID 10, 192.168.0.0/16), create separate topics for the name and the exact value when possible, or include the value in the topic name.
- Never bundle lists — each item in any bullet list, port list, company list, command list, etc. becomes its own topic.
- Context notes are strictly 2–6 words only.
- Topic names are 1–6 words, maximally specific (examples: "SSH port 22", "Kafka port 9092", "Google DNS 8.8.8.8", "RAID 10", "Python 3.11", "GDPR Article 5").
- Overlap and redundancy are required and encouraged.
- Include minor details most humans would skip (versions, years, specific error messages, exact ranges, obscure flags, etc.).
- There is no such thing as "too many topics" — err on the side of 300 if in doubt.

Return your response as valid JSON in this exact format:
{
  "prompt_theme": "short descriptive theme here",
  "topics": [
    {"name": "Topic Name", "context": "brief context note"},
    {"name": "Another Topic", "context": "another brief note"}
  ]
}

Examples of good prompt_themes:
- "Networking fundamentals and protocols"
- "Machine learning basics"
- "Photosynthesis process overview"
- "Ancient Roman history"

Return ONLY the JSON object, no other text or formatting."""

    prompt = f"""Analyze the following text and:
1. Create a short theme/title (3-7 words) that summarizes what this text is about
2. Extract ALL discrete study topics with brief contextual notes

For the theme, think about the main subject area or domain covered.
For topics, provide context notes that explain how each term is used in this specific text.

Be thorough - extract all important concepts, terms, definitions, processes, and key ideas.

Text to analyze:
{original_text}

Return a JSON object with prompt_theme and topics array:"""

    try:
        response = await call_claude(prompt, system_prompt, max_tokens=16384)
        
        # Parse the JSON response
        cleaned_response = response.strip()
        
        if cleaned_response.startswith('```json'):
            cleaned_response = cleaned_response[7:]
        if cleaned_response.startswith('```'):
            cleaned_response = cleaned_response[3:]
        if cleaned_response.endswith('```'):
            cleaned_response = cleaned_response[:-3]
        cleaned_response = cleaned_response.strip()
        
        parsed_data = json.loads(cleaned_response)
        
        # Validate structure
        if not isinstance(parsed_data, dict) or "topics" not in parsed_data:
            raise ValueError("Response doesn't have expected 'topics' array")
        
        prompt_theme = parsed_data.get("prompt_theme", "Study topics")
        
        # Convert to Topic objects with IDs
        topics = [
            Topic(
                id=f"topic-{idx}",
                name=topic.get("name", ""),
                context=topic.get("context", "")
            )
            for idx, topic in enumerate(parsed_data["topics"])
        ]
        
        # Generate new cache key (should be same as original since text is same)
        new_cache_key = generate_cache_key(original_text)
        
        # Cache the new results
        cache_data = {
            "prompt_theme": prompt_theme,
            "topics": [t.dict() for t in topics],
            "original_text": original_text,
            "timestamp": datetime.now().isoformat()
        }
        
        prompt_cache[new_cache_key] = cache_data
        save_cache_to_disk(new_cache_key, cache_data)
        
        logger.info(f"Regenerated and cached with key: {new_cache_key}")
        
        return TopicsListResponse(
            prompt_theme=prompt_theme,
            topics=topics,
            cache_key=new_cache_key
        )
        
    except json.JSONDecodeError as e:
        logger.error(f"Failed to parse JSON response: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to parse JSON response: {str(e)}")
    except Exception as e:
        logger.error(f"Error regenerating cached prompt: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/extract-topics", response_model=TopicsListResponse)
async def extract_topics(request: TextToTopicsRequest):
    """
    Step 1: Extract topics with brief context from text.
    Also generates a compressed prompt theme for display.
    Returns a list of topics with context that can be edited by the user.
    Results are cached to disk for persistence.
    """
    logger.info("=" * 80)
    logger.info(f"Received extract-topics request at {datetime.now()}")
    logger.info(f"Input text length: {len(request.text)} characters")
    logger.info(f"Input text preview: {request.text[:500]}...")
    
    # Check cache first
    cache_key = generate_cache_key(request.text)
    if cache_key in prompt_cache:
        logger.info(f"Returning cached result for key: {cache_key}")
        cached_data = prompt_cache[cache_key]
        return TopicsListResponse(
            prompt_theme=cached_data.get("prompt_theme", "Cached topics"),
            topics=cached_data["topics"],
            cache_key=cache_key
        )
    
    system_prompt = """You are an expert at analyzing text and extracting discrete study topics with brief contextual notes, plus creating a compressed theme summary.

Your task is to:
1. Create a VERY SHORT (3-7 words) theme/title that describes what this text is about
2. Identify ALL distinct concepts, terms, or subjects from the text
3. For each topic, provide a BRIEF context note (2-5 words) that clarifies the meaning

Extract AS MANY topics as are present in the text (aim for thoroughness - 20-50+ topics for longer texts).
Each topic name should be concise (1-5 words).

Return your response as valid JSON in this exact format:
{
  "prompt_theme": "short descriptive theme here",
  "topics": [
    {"name": "Topic Name", "context": "brief context note"},
    {"name": "Another Topic", "context": "another brief note"}
  ]
}

Examples of good prompt_themes:
- "Networking fundamentals and protocols"
- "Machine learning basics"
- "Photosynthesis process overview"
- "Ancient Roman history"

Return ONLY the JSON object, no other text or formatting."""

    prompt = f"""Analyze the following text and:
1. Create a short theme/title (3-7 words) that summarizes what this text is about
2. Extract ALL discrete study topics with brief contextual notes

For the theme, think about the main subject area or domain covered.
For topics, provide context notes that explain how each term is used in this specific text.

Be thorough - extract all important concepts, terms, definitions, processes, and key ideas.

Text to analyze:
{request.text}

Return a JSON object with prompt_theme and topics array:"""

    try:
        response = await call_claude(prompt, system_prompt, max_tokens=16384)
        
        # Parse the JSON response
        cleaned_response = response.strip()
        logger.info(f"Cleaning response...")
        
        if cleaned_response.startswith('```json'):
            cleaned_response = cleaned_response[7:]
        if cleaned_response.startswith('```'):
            cleaned_response = cleaned_response[3:]
        if cleaned_response.endswith('```'):
            cleaned_response = cleaned_response[:-3]
        cleaned_response = cleaned_response.strip()
        
        logger.info(f"Cleaned response preview: {cleaned_response[:500]}...")
        
        parsed_data = json.loads(cleaned_response)
        
        # Validate structure
        if not isinstance(parsed_data, dict) or "topics" not in parsed_data:
            logger.error("Response doesn't have expected structure")
            raise ValueError("Response doesn't have expected 'topics' array")
        
        prompt_theme = parsed_data.get("prompt_theme", "Study topics")
        
        # Convert to Topic objects with IDs
        topics = [
            Topic(
                id=f"topic-{idx}",
                name=topic.get("name", ""),
                context=topic.get("context", "")
            )
            for idx, topic in enumerate(parsed_data["topics"])
        ]
        
        logger.info(f"Successfully extracted {len(topics)} topics")
        logger.info(f"Prompt theme: {prompt_theme}")
        logger.info(f"Topics: {[t.name for t in topics]}")
        
        # Cache the results (in memory and on disk)
        cache_data = {
            "prompt_theme": prompt_theme,
            "topics": [t.dict() for t in topics],  # Convert to dict for JSON serialization
            "original_text": request.text,
            "timestamp": datetime.now().isoformat()
        }
        
        prompt_cache[cache_key] = cache_data
        save_cache_to_disk(cache_key, cache_data)
        
        logger.info(f"Cached results with key: {cache_key}")
        logger.info("=" * 80)
        
        return TopicsListResponse(
            prompt_theme=prompt_theme,
            topics=topics,
            cache_key=cache_key
        )
        
    except json.JSONDecodeError as e:
        logger.error(f"Failed to parse JSON response: {str(e)}", exc_info=True)
        logger.error(f"Raw response that failed to parse: {response}")
        raise HTTPException(status_code=500, detail=f"Failed to parse JSON response: {str(e)}")
    except Exception as e:
        logger.error(f"Error in extract_topics: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/generate-flashcards", response_model=FlashcardsResponse)
async def generate_flashcards(request: GenerateFlashcardsRequest):
    """
    Step 2: Generate flashcards with detailed explanations from the selected/edited topics.
    Takes the list of topics (potentially edited by user) and creates flashcards.
    """
    logger.info("=" * 80)
    logger.info(f"Received generate-flashcards request at {datetime.now()}")
    logger.info(f"Number of topics: {len(request.topics)}")
    logger.info(f"Topics: {[t.name for t in request.topics]}")
    
    flashcards = []
    
    for idx, topic in enumerate(request.topics):
        logger.info(f"Generating explanation for: {topic.name} (context: {topic.context})")
        
        system_prompt = """You are an expert educator who creates clear, concise explanations for study flashcards.
Your explanations should be:
- Detailed enough to be educational
- Succinct enough to fit on a flashcard (2-4 sentences)
- Clear and easy to understand
- Factually accurate
- Focused on the key concepts

Write in a friendly, educational tone."""

        # Include context in the prompt to ensure accurate explanation
        context_note = f" (in the context of: {topic.context})" if topic.context else ""
        prompt = f"""Provide a clear, concise explanation of the following topic suitable for a study flashcard.
Keep your explanation to 2-4 sentences that capture the essential information.

Topic: {topic.name}{context_note}

Explanation:"""

        try:
            explanation = await call_claude(prompt, system_prompt, max_tokens=2048)
            
            flashcard = Flashcard(
                id=f"card-{idx}",
                topic=topic.name,
                explanation=explanation.strip()
            )
            flashcards.append(flashcard)
            
            logger.info(f"Generated explanation length: {len(explanation)} characters")
            
        except Exception as e:
            logger.error(f"Error generating explanation for {topic.name}: {str(e)}")
            # Continue with other topics even if one fails
            flashcard = Flashcard(
                id=f"card-{idx}",
                topic=topic.name,
                explanation=f"Error generating explanation: {str(e)}"
            )
            flashcards.append(flashcard)
    
    logger.info(f"Successfully generated {len(flashcards)} flashcards")
    logger.info("=" * 80)
    
    return FlashcardsResponse(flashcards=flashcards)


@app.post("/api/explain-topic", response_model=ExplanationResponse)
async def explain_topic(request: TopicExplanationRequest):
    """
    Generate or regenerate an explanation for a single topic.
    Used when user wants to regenerate a flashcard explanation.
    """
    logger.info("=" * 80)
    logger.info(f"Received explain-topic request at {datetime.now()}")
    logger.info(f"Topic: {request.topic}")
    logger.info(f"Context: {request.context}")
    
    system_prompt = """You are an expert educator who creates clear, concise explanations for study flashcards.
Your explanations should be:
- Detailed enough to be educational
- Succinct enough to fit on a flashcard (2-4 sentences)
- Clear and easy to understand
- Factually accurate
- Focused on the key concepts

Write in a friendly, educational tone."""

    context_note = f" (in the context of: {request.context})" if request.context else ""
    prompt = f"""Provide a clear, concise explanation of the following topic suitable for a study flashcard.
Keep your explanation to 2-4 sentences that capture the essential information.

Topic: {request.topic}{context_note}

Explanation:"""

    try:
        explanation = await call_claude(prompt, system_prompt, max_tokens=2048)
        
        logger.info(f"Generated explanation length: {len(explanation)} characters")
        logger.info("=" * 80)
        
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
