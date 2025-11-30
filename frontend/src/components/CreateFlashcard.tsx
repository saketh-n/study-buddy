import { useState } from 'react';

interface CreateFlashcardProps {
  onCreateFlashcard: (
    topic: string,
    subject: string,
    explanation: string,
    generateExplanation: boolean,
    context: string
  ) => Promise<void>;
}

export const CreateFlashcard = ({ onCreateFlashcard }: CreateFlashcardProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [topic, setTopic] = useState('');
  const [subject, setSubject] = useState('');
  const [explanation, setExplanation] = useState('');
  const [context, setContext] = useState('');
  const [useAI, setUseAI] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!topic.trim() || !subject.trim()) {
      return;
    }

    if (!useAI && !explanation.trim()) {
      return;
    }

    setIsCreating(true);
    try {
      await onCreateFlashcard(
        topic.trim(),
        subject.trim(),
        explanation.trim(),
        useAI,
        context.trim()
      );
      
      // Reset form
      setTopic('');
      setSubject('');
      setExplanation('');
      setContext('');
      setUseAI(false);
      setIsExpanded(false);
    } catch (error) {
      console.error('Failed to create flashcard:', error);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto mb-8">
      <div className="bg-white rounded-xl shadow-lg border-2 border-gray-200">
        {/* Header */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center justify-between p-6 hover:bg-gray-50 transition rounded-t-xl"
        >
          <div className="flex items-center gap-3">
            <svg
              className={`w-6 h-6 text-gray-700 transition-transform ${
                isExpanded ? 'rotate-90' : ''
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            <h2 className="text-2xl font-bold text-gray-800">
              Create New Flashcard
            </h2>
          </div>
          <span className="text-sm text-gray-600">
            {isExpanded ? 'Click to collapse' : 'Click to expand'}
          </span>
        </button>

        {/* Form */}
        {isExpanded && (
          <form onSubmit={handleSubmit} className="p-6 pt-0">
            <div className="space-y-4">
              {/* Topic */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Topic (required)
                </label>
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g., TCP Three-Way Handshake"
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 transition"
                  required
                />
              </div>

              {/* Subject */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Subject/Category (required)
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g., Networking"
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 transition"
                  required
                />
              </div>

              {/* AI Generation Toggle */}
              <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg">
                <input
                  type="checkbox"
                  id="useAI"
                  checked={useAI}
                  onChange={(e) => setUseAI(e.target.checked)}
                  className="w-5 h-5 text-blue-600"
                />
                <label htmlFor="useAI" className="text-sm font-medium text-gray-700 cursor-pointer">
                  Generate explanation with AI
                </label>
              </div>

              {/* Context (only if using AI) */}
              {useAI && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Context (optional)
                  </label>
                  <input
                    type="text"
                    value={context}
                    onChange={(e) => setContext(e.target.value)}
                    placeholder="e.g., In the context of network protocols"
                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 transition"
                  />
                </div>
              )}

              {/* Explanation (only if not using AI) */}
              {!useAI && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Explanation (required)
                  </label>
                  <textarea
                    value={explanation}
                    onChange={(e) => setExplanation(e.target.value)}
                    placeholder="Enter your explanation here..."
                    rows={4}
                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 transition resize-none"
                    required={!useAI}
                  />
                </div>
              )}

              {/* Submit Button */}
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={isCreating || !topic.trim() || !subject.trim() || (!useAI && !explanation.trim())}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isCreating ? (
                    <>
                      <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Creating...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      <span>Create Flashcard</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTopic('');
                    setSubject('');
                    setExplanation('');
                    setContext('');
                    setUseAI(false);
                  }}
                  className="bg-gray-500 hover:bg-gray-600 text-white font-semibold py-3 px-6 rounded-lg transition duration-200"
                >
                  Clear
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

