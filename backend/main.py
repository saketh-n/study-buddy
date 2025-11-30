from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List

app = FastAPI(title="Study Buddy API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Vite's default port
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ConceptRequest(BaseModel):
    concepts: List[str]


class Flashcard(BaseModel):
    id: str
    topic: str
    explanation: str


class FlashcardResponse(BaseModel):
    flashcards: List[Flashcard]


@app.get("/")
async def root():
    return {"message": "Welcome to Study Buddy API"}


@app.get("/health")
async def health_check():
    return {"status": "healthy"}


@app.post("/api/generate-flashcards", response_model=FlashcardResponse)
async def generate_flashcards(request: ConceptRequest):
    """
    Generate flashcards with explanations for the given concepts.
    
    TODO: Integrate LLM API call to generate explanations for each concept.
    For now, this returns placeholder explanations.
    """
    flashcards = []
    
    for idx, concept in enumerate(request.concepts):
        flashcard = Flashcard(
            id=f"card-{idx}",
            topic=concept,
            explanation=f"This is a placeholder explanation for {concept}. LLM integration coming soon!"
        )
        flashcards.append(flashcard)
    
    return FlashcardResponse(flashcards=flashcards)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

