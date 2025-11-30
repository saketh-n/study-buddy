# Quick Start Guide - Study Buddy

## Prerequisites

✅ Your ANTHROPIC_API_KEY is already set in `backend/.env`

## Start the App (One Command)

```bash
./dev.sh
```

This starts both:
- Frontend: http://localhost:5173
- Backend: http://localhost:8000

## First Time Setup (If Needed)

If you get errors, run these once:

```bash
# Backend setup
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cd ..

# Frontend setup
cd frontend
npm install
cd ..

# Then run
./dev.sh
```

## Using the App

### 1. Generate Flashcards

**Paste some text:**
```
Photosynthesis is the process by which plants convert light 
energy into chemical energy. It occurs in chloroplasts and 
produces oxygen as a byproduct. The Calvin Cycle is the 
light-independent phase where carbon dioxide is fixed into 
organic molecules.
```

**Click:** "Generate Flashcards"

**Result:** AI extracts topics like:
- Photosynthesis
- Chloroplasts
- Calvin Cycle
- Light-independent reactions

### 2. Get Explanations

1. Click any flashcard to flip it
2. Click "Generate Explanation"
3. Wait 2-3 seconds
4. Read the AI-generated explanation
5. Click anywhere to flip back

### 3. Clear and Restart

Click "Clear All Flashcards" to start fresh

## API Documentation

While backend is running, visit:
- **Swagger UI:** http://localhost:8000/docs
- **Test endpoints directly in the browser**

## Troubleshooting

### "Failed to generate flashcards"
```bash
# Check if backend is running
curl http://localhost:8000/health

# Should return: {"status":"healthy"}
```

### API Key Issues
```bash
# Verify .env file exists
cat backend/.env | grep ANTHROPIC_API_KEY
```

### Port Already in Use
```bash
# Kill existing processes
lsof -ti:8000 | xargs kill  # Backend
lsof -ti:5173 | xargs kill  # Frontend
```

## Quick Test

1. Open http://localhost:5173
2. Paste: "Machine learning is a subset of AI"
3. Click "Generate Flashcards"
4. Should see cards for "Machine Learning" and "AI"
5. Flip a card, generate explanation
6. Should see 2-4 sentence explanation

## Architecture

```
Frontend (React)          Backend (FastAPI)          Claude AI
     ↓                          ↓                         ↓
Text Input  →  API Call  →  /extract-topics  →  Claude analyzes
     ↓                          ↓                         ↓
Display Cards              Returns topics           Topic list
     ↓                          ↓                         ↓
Click Card  →  API Call  →  /explain-topic   →  Claude explains
     ↓                          ↓                         ↓
Show Explanation          Returns text            Explanation
```

## File Structure

```
study-buddy/
├── frontend/           # React app
│   └── src/
│       ├── components/    # UI components
│       ├── services/      # API calls
│       └── types/         # TypeScript types
├── backend/            # FastAPI server
│   └── main.py           # API endpoints
├── dev.sh             # Start script
└── README.md          # Full docs
```

## Key Files

- **Backend API:** `backend/main.py`
- **Frontend App:** `frontend/src/App.tsx`
- **API Service:** `frontend/src/services/api.ts`
- **Components:** `frontend/src/components/`

## Next Steps

1. ✅ Everything is set up and working
2. Try different types of study material
3. Generate multiple flashcard sets
4. Study your topics with AI explanations

## Need Help?

- **API Docs:** http://localhost:8000/docs
- **Implementation Details:** See `IMPLEMENTATION.md`
- **Testing Guide:** See `TESTING.md`
- **Architecture:** See `ARCHITECTURE.md`

## Success Checklist

- [ ] Both servers running
- [ ] Frontend loads at http://localhost:5173
- [ ] Can paste text and generate flashcards
- [ ] Can flip cards
- [ ] Can generate explanations
- [ ] Explanations are relevant and helpful

If all checked ✅ - You're ready to study! 🎉

