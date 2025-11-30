# Study Buddy - Architecture Overview

## Project Structure

```
study-buddy/                      # Root monorepo
├── frontend/                     # React + TypeScript + Tailwind
│   ├── src/
│   │   ├── components/
│   │   │   ├── ConceptInput.tsx      # Input form component
│   │   │   ├── Flashcard.tsx         # Single flashcard with flip
│   │   │   ├── FlashcardList.tsx     # Grid of flashcards
│   │   │   └── index.ts              # Component exports
│   │   ├── types/
│   │   │   └── index.ts              # TypeScript interfaces
│   │   ├── App.tsx                   # Main application
│   │   ├── main.tsx                  # Entry point
│   │   └── index.css                 # Tailwind imports
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   └── README.md
│
├── backend/                      # FastAPI Python server
│   ├── main.py                       # FastAPI application
│   ├── requirements.txt              # Python dependencies
│   ├── .env.example                  # Environment template
│   └── README.md
│
├── dev.sh                        # Development script
├── package.json                  # Root package.json
├── README.md                     # Main documentation
└── ARCHITECTURE.md               # This file
```

## Technology Stack

### Frontend
- **React 19** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server (fast HMR)
- **Tailwind CSS** - Utility-first CSS framework
- **ESLint** - Code quality

### Backend
- **FastAPI** - Modern async Python web framework
- **Pydantic** - Data validation
- **Uvicorn** - ASGI server
- **Python 3.8+** - Programming language

## Data Flow

### Current Implementation

```
User Input
    ↓
ConceptInput Component
    ↓
Parse concepts (split by comma/semicolon/newline)
    ↓
Generate Flashcard objects
    ↓
FlashcardList Component
    ↓
Flashcard Component (individual cards)
    ↓
Display with flip interaction
```

### Future Implementation (with LLM)

```
User Input
    ↓
ConceptInput Component
    ↓
Parse concepts
    ↓
Send to Backend API (/api/generate-flashcards)
    ↓
FastAPI processes request
    ↓
Call LLM API (OpenAI/Anthropic/Google)
    ↓
Generate explanations for each concept
    ↓
Return flashcards with explanations
    ↓
Update Frontend state
    ↓
Display flashcards
```

## Component Architecture

### Frontend Components

#### App.tsx
- Main application component
- Manages flashcard state
- Coordinates between ConceptInput and FlashcardList

#### ConceptInput
- Text area for concept input
- Parses user input (comma, semicolon, newline separated)
- Validates and submits concepts
- **Props**: `onConceptsSubmit: (concepts: string[]) => void`

#### FlashcardList
- Grid layout for flashcards
- Responsive design (1 column mobile, 2 columns desktop)
- Empty state handling
- **Props**: `flashcards: Flashcard[]`

#### Flashcard
- Individual card component
- Click to flip functionality
- Shows topic on front, explanation on back
- **Props**: `flashcard: Flashcard`

### Backend Endpoints

#### GET /
- Root endpoint
- Returns welcome message

#### GET /health
- Health check endpoint
- Returns status

#### POST /api/generate-flashcards
- Accepts: `{ concepts: string[] }`
- Returns: `{ flashcards: Flashcard[] }`
- **TODO**: Integrate LLM API call

## Type Definitions

```typescript
interface Flashcard {
  id: string;
  topic: string;
  explanation: string;
}

interface ConceptInputProps {
  onConceptsSubmit: (concepts: string[]) => void;
}

interface FlashcardProps {
  flashcard: Flashcard;
}

interface FlashcardListProps {
  flashcards: Flashcard[];
}
```

## Styling Approach

- **Tailwind CSS** utility classes for all styling
- No custom CSS files (except Tailwind imports)
- Responsive design with mobile-first approach
- Modern gradient background
- Card-based UI with shadows and hover effects
- Smooth transitions and animations

## Development Workflow

1. **Start Development**
   ```bash
   ./dev.sh
   ```

2. **Frontend** runs on `http://localhost:5173`
3. **Backend** runs on `http://localhost:8000`
4. **API Docs** available at `http://localhost:8000/docs`

## Future Enhancements

### Phase 1: LLM Integration
- [ ] Add LLM API client (OpenAI/Anthropic/Google)
- [ ] Implement explanation generation
- [ ] Add loading states
- [ ] Error handling for API failures

### Phase 2: Persistence
- [ ] Add database (PostgreSQL/MongoDB)
- [ ] Save flashcard sets
- [ ] User authentication
- [ ] Flashcard history

### Phase 3: Advanced Features
- [ ] Spaced repetition algorithm
- [ ] Study session tracking
- [ ] Progress analytics
- [ ] Export/import flashcard sets
- [ ] Shareable flashcard collections

### Phase 4: Enhancements
- [ ] Text-to-speech for flashcards
- [ ] Image support in flashcards
- [ ] Multiple choice quiz mode
- [ ] Collaborative study sets
- [ ] Mobile app (React Native)

## API Integration Guide

To integrate an LLM API later:

1. Add API key to `backend/.env`:
   ```env
   OPENAI_API_KEY=your_key_here
   ```

2. Update `backend/main.py` in the `generate_flashcards` endpoint:
   ```python
   # Example with OpenAI
   import openai
   
   response = openai.ChatCompletion.create(
       model="gpt-4",
       messages=[{
           "role": "user",
           "content": f"Explain {concept} in 2-3 sentences"
       }]
   )
   explanation = response.choices[0].message.content
   ```

3. Update frontend to call backend API:
   ```typescript
   const response = await fetch('http://localhost:8000/api/generate-flashcards', {
       method: 'POST',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify({ concepts })
   });
   const data = await response.json();
   ```

## Configuration

### Frontend (Vite)
- Port: 5173
- Hot Module Replacement enabled
- TypeScript strict mode
- ESLint configured

### Backend (FastAPI)
- Port: 8000
- CORS enabled for localhost:5173
- Auto-reload enabled in development
- API documentation auto-generated

## Security Considerations

- [ ] Add rate limiting for API endpoints
- [ ] Implement API key rotation
- [ ] Add input sanitization
- [ ] Set up environment variable validation
- [ ] Add HTTPS in production
- [ ] Implement authentication/authorization

## Deployment

### Frontend
- Build: `npm run build`
- Deploy to: Vercel, Netlify, or Cloudflare Pages

### Backend
- Deploy to: Railway, Render, or AWS Lambda
- Set environment variables in deployment platform
- Use production ASGI server (Uvicorn with workers)

## License

MIT

