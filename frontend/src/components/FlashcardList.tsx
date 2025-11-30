import { useState } from 'react';
import type { FlashcardListProps } from '../types';
import { Flashcard } from './Flashcard';

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

  if (flashcards.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-lg">
          No flashcards yet. Generate topics and create flashcards to get started!
        </p>
      </div>
    );
  }

  // Group flashcards by subject
  const flashcardsBySubject = flashcards.reduce((acc, flashcard) => {
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

  return (
    <div className="w-full max-w-6xl mx-auto">
      <div className="mb-6 flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">
          Your Flashcards ({flashcards.length})
        </h2>
        <div className="flex gap-2">
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
