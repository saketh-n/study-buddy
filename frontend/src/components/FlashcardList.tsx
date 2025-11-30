import type { FlashcardListProps } from '../types';
import { Flashcard } from './Flashcard';

export const FlashcardList = ({ flashcards, onGenerateExplanation }: FlashcardListProps) => {
  if (flashcards.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-lg">
          No flashcards yet. Enter some text above to get started!
        </p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800">
          Your Flashcards ({flashcards.length})
        </h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {flashcards.map((flashcard) => (
          <Flashcard 
            key={flashcard.id} 
            flashcard={flashcard}
            onGenerateExplanation={onGenerateExplanation}
          />
        ))}
      </div>
    </div>
  );
};
