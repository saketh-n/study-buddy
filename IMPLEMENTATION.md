# Study Buddy - Implementation Details

## Overview

Study Buddy is now fully integrated with Claude Sonnet AI to intelligently extract topics from text and generate detailed explanations for flashcards.

## Features Implemented

### Backend (FastAPI + Claude Sonnet)

#### 1. `/api/extract-topics` (POST)
- **Purpose**: Intelligently extracts discrete study topics from any text input
- **Input**: `{ "text": "your text here" }`
- **Output**: `{ "topics": ["topic1", "topic2", ...] }`
- **AI Model**: Claude Sonnet 4 (claude-sonnet-4-20250514)
- **Behavior**: 
  - Analyzes text content
  - Identifies 3-15 distinct concepts
  - Returns concise topic names (1-5 words each)
  - Deduplicates and cleans results

#### 2. `/api/explain-topic` (POST)
- **Purpose**: Generates a detailed yet succinct explanation for a topic
- **Input**: `{ "topic": "topic name" }`
- **Output**: `{ "topic": "topic name", "explanation": "detailed explanation" }`
- **AI Model**: Claude Sonnet 4 (claude-sonnet-4-20250514)
- **Behavior**:
  - Creates educational flashcard-style explanations
  - Keeps explanations to 2-4 sentences
  - Focuses on key concepts
  - Uses friendly, educational tone

#### 3. `/api/generate-flashcards` (POST)
- **Purpose**: Backward compatibility endpoint
- **Input**: `{ "concepts": ["topic1", "topic2"] }`
- **Output**: `{ "flashcards": [...] }`
- **Behavior**: Generates explanations for pre-defined topics

### Frontend (React + TypeScript)

#### Updated Components

1. **ConceptInput Component**
   - Now accepts full text input instead of comma-separated concepts
   - Shows loading animation during API call
   - Disables input during generation
   - Displays "Generating Flashcards..." with spinner

2. **Flashcard Component**
   - Interactive flip functionality
   - On-demand explanation generation
   - Shows "Generate Explanation" button when flipped without explanation
   - Loading spinner during explanation generation
   - Three states:
     - Front: Topic name
     - Back (no explanation): Button to generate
     - Back (with explanation): Full explanation text

3. **App Component**
   - Handles async topic extraction
   - Manages loading states per flashcard
   - Error handling with user-friendly messages
   - Creates flashcards without explanations initially (on-demand generation)

#### New API Service Layer

**Location**: `frontend/src/services/api.ts`

- `extractTopics(text: string): Promise<string[]>`
  - Calls `/api/extract-topics`
  - Returns array of topic strings
  
- `explainTopic(topic: string): Promise<string>`
  - Calls `/api/explain-topic`
  - Returns explanation text

- `APIError` class for structured error handling

## User Flow

### Generating Flashcards

1. User pastes text into the input area
2. Clicks "Generate Flashcards"
3. UI shows loading state: "Generating Flashcards..." with spinner
4. Backend calls Claude to extract topics
5. Frontend creates flashcards with topics (no explanations yet)
6. Cards appear in grid layout

### Generating Explanations

1. User clicks on a flashcard to flip it
2. Sees "Generate Explanation" button
3. Clicks the button
4. Loading spinner appears: "Generating explanation..."
5. Backend calls Claude to create explanation
6. Explanation appears on the card
7. User can flip back to front

## Technical Implementation

### Loading States

```typescript
// App-level state
const [isGeneratingFlashcards, setIsGeneratingFlashcards] = useState(false);

// Per-flashcard state
interface Flashcard {
  id: string;
  topic: string;
  explanation: string;
  isGeneratingExplanation?: boolean; // Per-card loading
}
```

### Error Handling

- API errors are caught and displayed in a dismissible error banner
- Network failures show user-friendly messages
- Individual card errors don't block other operations
- Console logging for debugging

### Performance Optimizations

- Explanations generated on-demand (not all at once)
- Loading states prevent duplicate API calls
- Debounced user interactions

## Environment Configuration

Required in `backend/.env`:
```env
ANTHROPIC_API_KEY=your_key_here
```

## API Documentation

Once backend is running, visit:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Testing the Implementation

1. Start both servers:
   ```bash
   ./dev.sh
   ```

2. Test topic extraction:
   - Paste a Wikipedia article or study notes
   - Click "Generate Flashcards"
   - Verify topics are intelligently extracted

3. Test explanation generation:
   - Click a flashcard to flip it
   - Click "Generate Explanation"
   - Verify explanation is relevant and concise

## Future Enhancements

- [ ] Batch explanation generation option
- [ ] Save/load flashcard sets
- [ ] Adjust explanation detail level
- [ ] Support for images in flashcards
- [ ] Export to Anki format
- [ ] Study mode with spaced repetition

