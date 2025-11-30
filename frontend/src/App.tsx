import { useState } from 'react';
import { ConceptInput, FlashcardList } from './components';
import type { Flashcard } from './types';
import { extractTopics, explainTopic, APIError } from './services/api';

function App() {
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [isGeneratingFlashcards, setIsGeneratingFlashcards] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConceptsSubmit = async (text: string) => {
    setIsGeneratingFlashcards(true);
    setError(null);
    
    try {
      // Call the API to extract topics from the text
      const topics = await extractTopics(text);
      
      // Create flashcards from the extracted topics (without explanations initially)
      const newFlashcards: Flashcard[] = topics.map((topic, index) => ({
        id: `${Date.now()}-${index}`,
        topic: topic,
        explanation: '', // Explanation will be generated on demand
        isGeneratingExplanation: false,
      }));

      setFlashcards([...flashcards, ...newFlashcards]);
    } catch (err) {
      if (err instanceof APIError) {
        setError(err.message);
      } else {
        setError('Failed to generate flashcards. Please try again.');
      }
      console.error('Error generating flashcards:', err);
    } finally {
      setIsGeneratingFlashcards(false);
    }
  };

  const handleGenerateExplanation = async (id: string, topic: string) => {
    // Set loading state for this specific flashcard
    setFlashcards(prevCards =>
      prevCards.map(card =>
        card.id === id
          ? { ...card, isGeneratingExplanation: true }
          : card
      )
    );
    setError(null);

    try {
      // Call the API to generate explanation
      const explanation = await explainTopic(topic);
      
      // Update the flashcard with the explanation
      setFlashcards(prevCards =>
        prevCards.map(card =>
          card.id === id
            ? { ...card, explanation, isGeneratingExplanation: false }
            : card
        )
      );
    } catch (err) {
      if (err instanceof APIError) {
        setError(err.message);
      } else {
        setError('Failed to generate explanation. Please try again.');
      }
      console.error('Error generating explanation:', err);
      
      // Reset loading state on error
      setFlashcards(prevCards =>
        prevCards.map(card =>
          card.id === id
            ? { ...card, isGeneratingExplanation: false }
            : card
        )
      );
    }
  };

  const handleClearAll = () => {
    setFlashcards([]);
    setError(null);
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
            Transform your text into interactive flashcards with AI
          </p>
        </header>

        {/* Error Message */}
        {error && (
          <div className="max-w-2xl mx-auto mb-6 bg-red-50 border-2 border-red-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <svg className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="flex-1">
                <h3 className="text-red-800 font-semibold mb-1">Error</h3>
                <p className="text-red-700 text-sm">{error}</p>
              </div>
              <button 
                onClick={() => setError(null)}
                className="text-red-600 hover:text-red-800"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Concept Input */}
        <ConceptInput 
          onConceptsSubmit={handleConceptsSubmit}
          isLoading={isGeneratingFlashcards}
        />

        {/* Clear Button */}
        {flashcards.length > 0 && (
          <div className="text-center mb-8">
            <button
              onClick={handleClearAll}
              disabled={isGeneratingFlashcards}
              className="bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-6 rounded-lg transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Clear All Flashcards
            </button>
          </div>
        )}

        {/* Flashcard List */}
        <FlashcardList 
          flashcards={flashcards}
          onGenerateExplanation={handleGenerateExplanation}
        />
      </div>
    </div>
  );
}

export default App;
