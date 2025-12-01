import { useState, useMemo } from 'react';
import type { FlashcardListProps, Flashcard as FlashcardType } from '../types';
import { Flashcard } from './Flashcard';
import { exportFlashcardsAsPDF } from '../utils/pdfExport';

export const FlashcardList = ({ 
  flashcards, 
  onUpdate,
  onDelete,
  onSendChatMessage,
  onClearChat,
  onDistillChat,
  onGenerateExplanation,
  onOrganize,
  onOpenWiki,
  onOpenLearnMode
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

  // Build hierarchical structure: Subject → Section → Subsection → Flashcards
  interface HierarchyNode {
    sections: Record<string, {
      subsections: Record<string, FlashcardType[]>;
      directCards: FlashcardType[];
    }>;
    directCards: FlashcardType[]; // Cards without section
  }

  const hierarchy = filteredFlashcards.reduce((acc, flashcard) => {
    const subject = flashcard.subject || 'General';
    const section = flashcard.section;
    const subsection = flashcard.subsection;

    if (!acc[subject]) {
      acc[subject] = { sections: {}, directCards: [] };
    }

    if (!section) {
      // Flashcard without section (legacy or unorganized)
      acc[subject].directCards.push(flashcard);
    } else {
      // Flashcard with section
      if (!acc[subject].sections[section]) {
        acc[subject].sections[section] = { subsections: {}, directCards: [] };
      }

      if (!subsection) {
        // Flashcard directly in section
        acc[subject].sections[section].directCards.push(flashcard);
      } else {
        // Flashcard in subsection
        if (!acc[subject].sections[section].subsections[subsection]) {
          acc[subject].sections[section].subsections[subsection] = [];
        }
        acc[subject].sections[section].subsections[subsection].push(flashcard);
      }
    }

    return acc;
  }, {} as Record<string, HierarchyNode>);

  const subjects = Object.keys(hierarchy).sort();

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
          <div className="flex gap-2 flex-wrap">
            {onOpenLearnMode && flashcards.length > 0 && (
              <button
                onClick={onOpenLearnMode}
                className="text-sm bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded flex items-center gap-2 font-semibold transition"
                title="Interactive quiz mode with AI scoring"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                <span>Learn Mode</span>
              </button>
            )}
            {onOpenWiki && flashcards.length > 0 && (
              <button
                onClick={onOpenWiki}
                className="text-sm bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded flex items-center gap-2 font-semibold transition"
                title="View flashcards as a wiki with organized pages"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                <span>Wiki View</span>
              </button>
            )}
            {onOrganize && flashcards.length >= 2 && (
              <button
                onClick={onOrganize}
                className="text-sm bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded flex items-center gap-2 font-semibold transition"
                title="AI-powered organization: Create hierarchical structure with sections and subsections"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
                <span>Organize</span>
              </button>
            )}
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
        const subjectData = hierarchy[subject];
        const isCollapsed = collapsedSubjects.has(subject);
        
        // Count total flashcards in subject
        const totalCount = subjectData.directCards.length +
          Object.values(subjectData.sections).reduce((sum, section) => {
            return sum + section.directCards.length +
              Object.values(section.subsections).reduce((subSum, cards) => subSum + cards.length, 0);
          }, 0);

        return (
          <div key={subject} className="mb-8">
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
                  ({totalCount} card{totalCount !== 1 ? 's' : ''})
                </span>
              </div>
              <span className="text-sm text-gray-600">
                {isCollapsed ? 'Click to expand' : 'Click to collapse'}
              </span>
            </button>

            {/* Subject content */}
            {!isCollapsed && (
              <div className="ml-4 space-y-6">
                {/* Direct flashcards (no section) */}
                {subjectData.directCards.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {subjectData.directCards.map((flashcard) => (
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

                {/* Sections */}
                {Object.entries(subjectData.sections).map(([sectionName, sectionData]) => {
                  const sectionTotal = sectionData.directCards.length +
                    Object.values(sectionData.subsections).reduce((sum, cards) => sum + cards.length, 0);
                  
                  return (
                    <div key={sectionName} className="border-l-4 border-blue-300 pl-4">
                      {/* Section header */}
                      <h4 className="text-lg font-bold text-gray-700 mb-3 flex items-center gap-2">
                        <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                        </svg>
                        {sectionName}
                        <span className="text-sm font-normal text-gray-500">
                          ({sectionTotal} card{sectionTotal !== 1 ? 's' : ''})
                        </span>
                      </h4>

                      {/* Direct flashcards in section */}
                      {sectionData.directCards.length > 0 && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-4">
                          {sectionData.directCards.map((flashcard) => (
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

                      {/* Subsections */}
                      {Object.entries(sectionData.subsections).map(([subsectionName, subsectionCards]) => (
                        <div key={subsectionName} className="ml-4 mb-4 border-l-2 border-purple-200 pl-4">
                          {/* Subsection header */}
                          <h5 className="text-md font-semibold text-gray-600 mb-3 flex items-center gap-2">
                            <svg className="w-4 h-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                            {subsectionName}
                            <span className="text-xs font-normal text-gray-500">
                              ({subsectionCards.length} card{subsectionCards.length !== 1 ? 's' : ''})
                            </span>
                          </h5>

                          {/* Flashcards in subsection */}
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {subsectionCards.map((flashcard) => (
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
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
