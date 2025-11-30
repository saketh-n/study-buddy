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
- 🎯 **Context-Aware Definitions** - Automatically generates definitions based on how terms are used in your text
- 💾 **Persistent Caching** - Previous study sessions are saved and can be reused instantly
- 📚 **Recent Sessions** - Click on cached prompts to load them without re-entering text
- 📝 **Smart Text Processing** - Works with articles, notes, textbooks, or any educational content
- 🎴 **Interactive Flashcards** - Click to flip and reveal context-aware explanations
- 🔄 **Regenerate Explanations** - Get alternative explanations with one click
- ⚡ **Real-time Loading States** - Visual feedback during AI generation
- 🎨 **Modern, Responsive UI** - Beautiful interface with Tailwind CSS
- 🚀 **Fast & Efficient** - Async operations with smooth animations

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

### Quick Start: Use Recent Sessions
1. **Browse Cached Prompts**
   - See your recent study sessions at the top
   - Each shows a descriptive theme and topic count
   - Click any session to instantly reload it (no API call needed!)

### Step 1: Extract Topics (New Content)
2. **Paste Your Study Material**
   - Copy any educational text (Wikipedia articles, lecture notes, textbook passages)
   - Paste it into the text area on the Study Buddy homepage
   - Click "Extract Topics"

3. **AI Analyzes Your Text**
   - Claude AI creates a short theme describing your content (e.g., "Networking fundamentals")
   - Extracts all key topics with brief context notes
   - Context helps distinguish meanings (e.g., "bridge" → "networking device" vs "physical structure")
   - Results are saved to disk and cached for future use

### Step 2: Edit Topics List
4. **Review & Edit Topics**
   - See the AI-generated theme at the top (e.g., "Machine learning basics")
   - See all extracted topics in an editable list
   - **Delete** topics you don't want to study
   - **Edit** topic names or context notes
   - **Add** new topics manually
   - Topics are ready when you are!

### Step 3: Generate Flashcards
5. **Create Flashcards**
   - Click "Generate Flashcards from Topics"
   - AI generates detailed explanations for each topic
   - Flashcards appear in a grid layout

### Step 4: Study
6. **Study with Flashcards**
   - Click any flashcard to flip it over and see the explanation
   - Click "Regenerate Explanation" for alternative wording
   - Flip back by clicking anywhere on the card

### Benefits
- ✅ **Control**: Edit topics before generating flashcards
- ✅ **Efficiency**: Cached results save API calls & time
- ✅ **Persistence**: Cache survives server restarts
- ✅ **Flexibility**: Add/remove topics as needed
- ✅ **Context-Aware**: Definitions match your specific domain
- ✅ **Quick Access**: Reuse previous sessions with one click

### Example Workflow

```
Step 1: Input Text
"A network bridge is a device that connects multiple network 
segments at the data link layer. Bridges filter traffic 
based on MAC addresses to reduce network congestion..."

Step 2: AI Extracts Topics with Context
✓ Network Bridge (context: "networking device")
✓ Data Link Layer (context: "OSI model layer")
✓ MAC Addresses (context: "hardware addressing")
✓ Traffic Filtering (context: "network optimization")

Step 3: Edit Topics (Optional)
- Delete "Traffic Filtering" (already know it)
- Add "OSI Model" manually
- Edit context for clarity

Step 4: Generate Flashcards
- AI creates detailed explanations using the context
- Each flashcard has 2-4 sentence explanation

Step 5: Study!
- Flip cards to review
- Regenerate explanations if needed
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

