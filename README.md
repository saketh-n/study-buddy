# Study Buddy

A modern web application that helps you study by transforming concepts into interactive flashcards with AI-generated explanations.

## Project Structure

This is a monorepo containing:

```
study-buddy/
├── frontend/          # React + TypeScript + Tailwind CSS
│   ├── src/
│   │   ├── components/
│   │   ├── types/
│   │   └── App.tsx
│   └── package.json
├── backend/           # FastAPI Python server
│   ├── main.py
│   └── requirements.txt
└── README.md
```

## Features

- 🤖 **AI-Powered Topic Extraction** - Paste any text and Claude Sonnet intelligently extracts study topics
- 📝 **Smart Text Processing** - Works with articles, notes, textbooks, or any educational content
- 🎴 **Interactive Flashcards** - Click to flip and reveal detailed explanations
- ⚡ **On-Demand Explanations** - Generate explanations only when needed using Claude AI
- 🔄 **Real-time Loading States** - Visual feedback during AI generation
- 🎨 **Modern, Responsive UI** - Beautiful interface with Tailwind CSS
- 🚀 **Fast & Efficient** - Async operations with per-card loading states

## Getting Started

### Quick Start (Recommended)

Use the included development script to start both frontend and backend servers:

```bash
./dev.sh
```

This will:
- Create virtual environment and install Python dependencies (if needed)
- Install Node.js dependencies (if needed)
- Start both frontend and backend servers concurrently

Press `Ctrl+C` to stop both servers.

### Manual Setup

#### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The frontend will be available at `http://localhost:5173`

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Create a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Configure environment variables:
```bash
# Create .env file with your Anthropic API key
echo "ANTHROPIC_API_KEY=your_anthropic_api_key_here" > .env
```
**Note:** You need a valid Anthropic API key. Get one at https://console.anthropic.com/

5. Start the FastAPI server:
```bash
uvicorn main:app --reload
```

The backend API will be available at `http://localhost:8000`
- API Documentation: `http://localhost:8000/docs`

## How to Use

1. **Paste Your Study Material**
   - Copy any educational text (Wikipedia articles, lecture notes, textbook passages)
   - Paste it into the text area on the Study Buddy homepage

2. **Generate Flashcards**
   - Click "Generate Flashcards"
   - Watch as AI extracts key topics from your text
   - Flashcards appear automatically in a grid

3. **Study with Flashcards**
   - Click any flashcard to flip it over
   - Click "Generate Explanation" to get AI-powered details
   - Flip back by clicking anywhere on the card

4. **Manage Your Set**
   - Use "Clear All Flashcards" to start fresh
   - Generate multiple sets from different texts

### Example Workflow

```
Input: "Photosynthesis is the process by which plants convert 
        sunlight into energy. It occurs in chloroplasts..."

AI Extracts Topics:
✓ Photosynthesis
✓ Chloroplasts  
✓ Light-dependent reactions
✓ Calvin Cycle

Click a card → Generate Explanation → Study!
```

## Tech Stack

### Frontend
- **React** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Styling
- **Modern ES6+** - Latest JavaScript features

### Backend
- **FastAPI** - Modern Python web framework
- **Pydantic** - Data validation
- **Uvicorn** - ASGI server
- **CORS** - Cross-origin resource sharing enabled

## Roadmap

### Completed ✅
- [x] Set up monorepo structure
- [x] Create React frontend with TypeScript
- [x] Implement flashcard UI components
- [x] Set up FastAPI backend
- [x] Integrate Claude Sonnet API for topic extraction
- [x] Integrate Claude Sonnet API for explanations
- [x] Add loading states and error handling
- [x] Implement on-demand explanation generation

### Coming Soon 🚀
- [ ] Add persistent storage for flashcards
- [ ] Implement user authentication
- [ ] Add study session tracking
- [ ] Export flashcards feature
- [ ] Batch explanation generation
- [ ] Spaced repetition algorithm

## Development

### Frontend Commands

```bash
npm run dev       # Start dev server
npm run build     # Build for production
npm run preview   # Preview production build
```

### Backend Commands

```bash
uvicorn main:app --reload  # Start dev server with hot reload
python main.py             # Start production server
```

## Contributing

This is a personal project, but feel free to fork and customize for your own use!

## License

MIT

