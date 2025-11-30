import { useState } from 'react';
import type { ConceptInputProps } from '../types';

export const ConceptInput = ({ onGenerateTopics, isLoading }: ConceptInputProps) => {
  const [inputText, setInputText] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputText.trim() && !isLoading) {
      onGenerateTopics(inputText.trim());
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
            Enter Text to Study
          </label>
          <textarea
            id="concepts"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Paste any text, article, or notes here. AI will extract key topics...&#10;&#10;Example: A network bridge is a device that connects multiple network segments at the data link layer. Bridges filter traffic based on MAC addresses..."
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y min-h-[160px] text-gray-800 disabled:bg-gray-100 disabled:cursor-not-allowed"
            rows={6}
            disabled={isLoading}
          />
        </div>
        <button
          type="submit"
          disabled={!inputText.trim() || isLoading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition duration-200 ease-in-out transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Extracting Topics...</span>
            </>
          ) : (
            'Extract Topics'
          )}
        </button>
      </form>
    </div>
  );
};
