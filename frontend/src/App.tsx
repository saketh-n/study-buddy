import { useState } from 'react';
import { ConceptInput, FlashcardList } from './components';
import type { Flashcard } from './types';

function App() {
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);

  const handleConceptsSubmit = (concepts: string[]) => {
    // Create flashcards from the concepts
    const newFlashcards: Flashcard[] = concepts.map((concept, index) => ({
      id: `${Date.now()}-${index}`,
      topic: concept,
      explanation: '', // This will be populated by the LLM API call later
    }));

    setFlashcards([...flashcards, ...newFlashcards]);
  };

  const handleClearAll = () => {
    setFlashcards([]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <header className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-800 mb-3">
            Study Buddy
          </h1>
          <p className="text-gray-600 text-lg">
            Transform your concepts into interactive flashcards
          </p>
        </header>

        {/* Concept Input */}
        <ConceptInput onConceptsSubmit={handleConceptsSubmit} />

        {/* Clear Button */}
        {flashcards.length > 0 && (
          <div className="text-center mb-8">
            <button
              onClick={handleClearAll}
              className="bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-6 rounded-lg transition duration-200"
            >
              Clear All Flashcards
            </button>
          </div>
        )}

        {/* Flashcard List */}
        <FlashcardList flashcards={flashcards} />
      </div>
    </div>
  );
}

export default App;
