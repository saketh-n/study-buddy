import { useState } from 'react';
import type { FlashcardProps } from '../types';

export const Flashcard = ({ flashcard, onGenerateExplanation }: FlashcardProps) => {
  const [isFlipped, setIsFlipped] = useState(false);

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const handleGenerateExplanation = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card flip when clicking the button
    onGenerateExplanation(flashcard.id, flashcard.topic);
  };

  const hasExplanation = flashcard.explanation && flashcard.explanation.length > 0;
  const isGenerating = flashcard.isGeneratingExplanation;

  return (
    <div 
      className="bg-white rounded-xl shadow-lg p-6 cursor-pointer transition-all duration-300 hover:shadow-xl border-2 border-gray-200 min-h-[250px] flex items-center justify-center"
      onClick={handleFlip}
    >
      <div className="text-center w-full">
        {!isFlipped ? (
          <div>
            <h3 className="text-2xl font-bold text-gray-800 mb-4">
              {flashcard.topic}
            </h3>
            <p className="text-sm text-gray-500 mt-4">
              Click to see explanation
            </p>
          </div>
        ) : (
          <div>
            <h4 className="text-lg font-semibold text-blue-600 mb-4">
              {flashcard.topic}
            </h4>
            
            {isGenerating ? (
              <div className="flex flex-col items-center justify-center py-6">
                <svg className="animate-spin h-8 w-8 text-blue-600 mb-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <p className="text-gray-600 text-sm">Generating new explanation...</p>
              </div>
            ) : hasExplanation ? (
              <div>
                <p className="text-gray-700 leading-relaxed mb-4 text-left">
                  {flashcard.explanation}
                </p>
                <div className="flex flex-col gap-2 mt-4">
                  <button
                    onClick={handleGenerateExplanation}
                    className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg transition duration-200 ease-in-out transform hover:scale-105 text-sm"
                  >
                    Regenerate Explanation
                  </button>
                  <p className="text-sm text-gray-500">
                    Or click anywhere to flip back
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-4 py-4">
                <p className="text-gray-600 text-sm mb-2">
                  No explanation yet
                </p>
                <button
                  onClick={handleGenerateExplanation}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg transition duration-200 ease-in-out transform hover:scale-105"
                >
                  Generate Explanation
                </button>
                <p className="text-sm text-gray-500 mt-2">
                  Or click anywhere to flip back
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
