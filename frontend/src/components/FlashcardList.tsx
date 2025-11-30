import { useState, useMemo } from 'react';
import type { FlashcardListProps } from '../types';
import { Flashcard } from './Flashcard';
import { exportFlashcardsAsPDF } from '../utils/pdfExport';

export const FlashcardList = ({ 
  flashcards, 
  onUpdate,
  onDelete,
  onSendChatMessage,
  onClearChat,
  onDistillChat,
  onGenerateExplanation
}: FlashcardListProps) => {
  const [collapsedSubjects, setCollapsedSubjects] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [isExporting, setIsExporting] = useState(false);

  // Filter flashcards based on search query (must be before early return to follow Rules of Hooks)
  const filteredFlashcards = useMemo(() => {
    if (!searchQuery.trim()) {
      return flashcards;
    }
    
    const query = searchQuery.toLowerCase();
    return flashcards.filter(flashcard => 
      flashcard.topic.toLowerCase().includes(query) ||
      flashcard.explanation.toLowerCase().includes(query) ||
      (flashcard.subject || 'General').toLowerCase().includes(query)
    );
  }, [flashcards, searchQuery]);

  if (flashcards.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-lg">
          No flashcards yet. Generate topics and create flashcards to get started!
        </p>
      </div>
    );
  }

  // Group filtered flashcards by subject
  const flashcardsBySubject = filteredFlashcards.reduce((acc, flashcard) => {
    const subject = flashcard.subject || 'General';
    if (!acc[subject]) {
      acc[subject] = [];
    }
    acc[subject].push(flashcard);
    return acc;
  }, {} as Record<string, typeof flashcards>);

  const subjects = Object.keys(flashcardsBySubject).sort();

  const toggleSubject = (subject: string) => {
    setCollapsedSubjects(prev => {
      const newSet = new Set(prev);
      if (newSet.has(subject)) {
        newSet.delete(subject);
      } else {
        newSet.add(subject);
      }
      return newSet;
    });
  };

  const collapseAll = () => {
    setCollapsedSubjects(new Set(subjects));
  };

  const expandAll = () => {
    setCollapsedSubjects(new Set());
  };

  const handleExportPDF = async () => {
    setIsExporting(true);
    try {
      // Small delay to show loading state
      await new Promise(resolve => setTimeout(resolve, 100));
      exportFlashcardsAsPDF(flashcards);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto">
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-800">
            Your Flashcards ({flashcards.length})
          </h2>
          <div className="flex gap-2">
            <button
              onClick={handleExportPDF}
              disabled={isExporting}
              className="text-sm bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded flex items-center gap-2 font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
              title="Export all flashcards as PDF"
            >
              {isExporting ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Exporting...</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span>Export to PDF</span>
                </>
              )}
            </button>
            <button
              onClick={expandAll}
              className="text-sm bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded"
            >
              Expand All
            </button>
            <button
              onClick={collapseAll}
              className="text-sm bg-gray-500 hover:bg-gray-600 text-white px-3 py-1 rounded"
            >
              Collapse All
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <input
            type="text"
            placeholder="Search flashcards by topic, content, or subject..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-3 pr-12 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 transition"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              aria-label="Clear search"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
          {!searchQuery && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          )}
        </div>
        
        {/* Search results info */}
        {searchQuery && (
          <p className="mt-2 text-sm text-gray-600">
            Showing {filteredFlashcards.length} of {flashcards.length} flashcard{flashcards.length !== 1 ? 's' : ''}
          </p>
        )}
      </div>

      {subjects.length === 0 && searchQuery ? (
        <div className="text-center py-12">
          <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M12 12h.01M12 12h.01M12 12h.01M12 12h.01M12 12h.01M12 12h.01M12 12h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-gray-500 text-lg">No flashcards match your search</p>
          <p className="text-gray-400 text-sm mt-2">Try a different search term</p>
        </div>
      ) : null}

      {subjects.map((subject) => {
        const subjectFlashcards = flashcardsBySubject[subject];
        const isCollapsed = collapsedSubjects.has(subject);

        return (
          <div key={subject} className="mb-6">
            {/* Subject header */}
            <button
              onClick={() => toggleSubject(subject)}
              className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-blue-100 to-purple-100 hover:from-blue-200 hover:to-purple-200 rounded-lg shadow mb-4 transition"
            >
              <div className="flex items-center gap-3">
                <svg
                  className={`w-6 h-6 text-gray-700 transition-transform ${
                    isCollapsed ? '' : 'rotate-90'
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                <h3 className="text-xl font-bold text-gray-800">
                  {subject}
                </h3>
                <span className="text-sm text-gray-600">
                  ({subjectFlashcards.length} card{subjectFlashcards.length !== 1 ? 's' : ''})
                </span>
              </div>
              <span className="text-sm text-gray-600">
                {isCollapsed ? 'Click to expand' : 'Click to collapse'}
              </span>
            </button>

            {/* Flashcards grid */}
            {!isCollapsed && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {subjectFlashcards.map((flashcard) => (
                  <Flashcard
                    key={flashcard.id}
                    flashcard={flashcard}
                    onUpdate={onUpdate}
                    onDelete={onDelete}
                    onSendChatMessage={onSendChatMessage}
                    onClearChat={onClearChat}
                    onDistillChat={onDistillChat}
                    onGenerateExplanation={onGenerateExplanation}
                  />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
