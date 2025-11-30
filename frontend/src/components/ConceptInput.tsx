import { useState } from 'react';
import type { ConceptInputProps } from '../types';

export const ConceptInput = ({ onConceptsSubmit }: ConceptInputProps) => {
  const [inputText, setInputText] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputText.trim()) {
      // Split concepts by commas, semicolons, or newlines
      const concepts = inputText
        .split(/[,;\n]+/)
        .map(concept => concept.trim())
        .filter(concept => concept.length > 0);
      
      if (concepts.length > 0) {
        onConceptsSubmit(concepts);
        setInputText('');
      }
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto mb-8">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label 
            htmlFor="concepts" 
            className="block text-lg font-semibold text-gray-700 mb-2"
          >
            Enter Concepts to Study
          </label>
          <textarea
            id="concepts"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Enter concepts separated by commas, semicolons, or new lines...&#10;Example: Photosynthesis, Newton's Laws, Pythagorean Theorem"
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y min-h-[120px] text-gray-800"
            rows={5}
          />
        </div>
        <button
          type="submit"
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition duration-200 ease-in-out transform hover:scale-[1.02] active:scale-[0.98]"
        >
          Generate Flashcards
        </button>
      </form>
    </div>
  );
};

