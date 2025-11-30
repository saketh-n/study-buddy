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

- 📝 Input multiple concepts at once (comma, semicolon, or newline separated)
- 🎴 Generate interactive flashcards
- 🔄 Flip cards to reveal explanations
- 🎨 Modern, responsive UI with Tailwind CSS
- 🤖 Ready for LLM API integration (OpenAI, Anthropic, Google Gemini)

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
cp .env.example .env
# Edit .env with your API keys when ready
```

5. Start the FastAPI server:
```bash
uvicorn main:app --reload
```

The backend API will be available at `http://localhost:8000`
- API Documentation: `http://localhost:8000/docs`

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

- [x] Set up monorepo structure
- [x] Create React frontend with TypeScript
- [x] Implement flashcard UI components
- [x] Set up FastAPI backend
- [ ] Integrate LLM API for generating explanations
- [ ] Add persistent storage for flashcards
- [ ] Implement user authentication
- [ ] Add study session tracking
- [ ] Export flashcards feature

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

