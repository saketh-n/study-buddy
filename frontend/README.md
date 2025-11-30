# Study Buddy Frontend

React + TypeScript + Tailwind CSS frontend for the Study Buddy application.

## Features

- 📝 Input multiple concepts (comma, semicolon, or newline separated)
- 🎴 Interactive flashcard display with flip animation
- 🎨 Modern, responsive design with Tailwind CSS
- ⚡ Fast development with Vite
- 🔒 Type-safe with TypeScript

## Tech Stack

- React 19
- TypeScript
- Vite
- Tailwind CSS
- ESLint for code quality

## Getting Started

### Prerequisites

- Node.js (v18 or higher recommended)
- npm or yarn

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Build

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

### Lint

```bash
npm run lint
```

## Project Structure

```
src/
├── components/
│   ├── ConceptInput.tsx    # Input form for concepts
│   ├── Flashcard.tsx        # Individual flashcard component
│   ├── FlashcardList.tsx    # List of flashcards
│   └── index.ts             # Component exports
├── types/
│   └── index.ts             # TypeScript type definitions
├── App.tsx                  # Main app component
├── main.tsx                 # Entry point
└── index.css                # Tailwind imports
```

## Components

### ConceptInput
Allows users to input multiple concepts separated by commas, semicolons, or newlines.

### Flashcard
Individual flashcard that displays a topic and can be flipped to show the explanation.

### FlashcardList
Grid display of all generated flashcards.

## Future Enhancements

- [ ] Connect to backend API for LLM-generated explanations
- [ ] Add loading states during API calls
- [ ] Implement flashcard persistence
- [ ] Add study session tracking
- [ ] Export/import flashcard sets
- [ ] Add spaced repetition algorithm
