import { useState, useEffect } from 'react';
import type { Flashcard } from '../types';
import { generatePodcast, distillSubject, listCachedDistillPrompts } from '../services/api';
import { renderMarkdown } from '../utils/markdown';

interface WikiViewProps {
  flashcards: Flashcard[];
  onClose: () => void;
}

interface CachedDistillPrompt {
  subject: string;
  user_prompt: string;
  cache_key: string;
  generated_at: string;
}

export const WikiView = ({ flashcards, onClose }: WikiViewProps) => {
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());
  const [collapsedSubsections, setCollapsedSubsections] = useState<Set<string>>(new Set());
  const [showPodcast, setShowPodcast] = useState(false);
  const [showDistill, setShowDistill] = useState(false);
  const [podcastTranscript, setPodcastTranscript] = useState<string>('');
  const [distillSummary, setDistillSummary] = useState<string>('');
  const [distillPrompt, setDistillPrompt] = useState<string>("I am a software engineer with a few years of experience preparing for the next step in my career. What are the most important things to know?");
  const [isGeneratingPodcast, setIsGeneratingPodcast] = useState(false);
  const [isGeneratingDistill, setIsGeneratingDistill] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [cachedDistillPrompts, setCachedDistillPrompts] = useState<CachedDistillPrompt[]>([]);

  const toggleSection = (sectionName: string) => {
    setCollapsedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sectionName)) {
        newSet.delete(sectionName);
      } else {
        newSet.add(sectionName);
      }
      return newSet;
    });
  };

  const toggleSubsection = (subsectionName: string) => {
    setCollapsedSubsections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(subsectionName)) {
        newSet.delete(subsectionName);
      } else {
        newSet.add(subsectionName);
      }
      return newSet;
    });
  };

  // Build hierarchical structure
  interface HierarchyNode {
    sections: Record<string, {
      subsections: Record<string, Flashcard[]>;
      directCards: Flashcard[];
    }>;
    directCards: Flashcard[];
  }

  const hierarchy = flashcards.reduce((acc, flashcard) => {
    const subject = flashcard.subject || 'General';
    const section = flashcard.section;
    const subsection = flashcard.subsection;

    if (!acc[subject]) {
      acc[subject] = { sections: {}, directCards: [] };
    }

    if (!section) {
      acc[subject].directCards.push(flashcard);
    } else {
      if (!acc[subject].sections[section]) {
        acc[subject].sections[section] = { subsections: {}, directCards: [] };
      }

      if (!subsection) {
        acc[subject].sections[section].directCards.push(flashcard);
      } else {
        if (!acc[subject].sections[section].subsections[subsection]) {
          acc[subject].sections[section].subsections[subsection] = [];
        }
        acc[subject].sections[section].subsections[subsection].push(flashcard);
      }
    }

    return acc;
  }, {} as Record<string, HierarchyNode>);

  const subjects = Object.keys(hierarchy).sort();
  const [selectedSubject, setSelectedSubject] = useState(subjects[0] || '');

  const handleGeneratePodcast = async () => {
    setIsGeneratingPodcast(true);
    try {
      const result = await generatePodcast(selectedSubject);
      setPodcastTranscript(result.transcript);
      setShowPodcast(true);
    } catch (error) {
      console.error('Error generating podcast:', error);
      alert('Failed to generate podcast. Please try again.');
    } finally {
      setIsGeneratingPodcast(false);
    }
  };

  const handlePlayAudio = () => {
    if ('speechSynthesis' in window) {
      // Stop any ongoing speech
      window.speechSynthesis.cancel();

      if (isPlayingAudio) {
        setIsPlayingAudio(false);
        return;
      }

      const utterance = new SpeechSynthesisUtterance(podcastTranscript);
      utterance.rate = 0.9; // Slightly slower for clarity
      utterance.pitch = 1;
      utterance.volume = 1;

      utterance.onend = () => {
        setIsPlayingAudio(false);
      };

      utterance.onerror = () => {
        setIsPlayingAudio(false);
        alert('Error playing audio');
      };

      window.speechSynthesis.speak(utterance);
      setIsPlayingAudio(true);
    } else {
      alert('Text-to-speech not supported in your browser');
    }
  };

  const handleDistillSubject = async () => {
    setIsGeneratingDistill(true);
    try {
      const result = await distillSubject(selectedSubject, distillPrompt);
      setDistillSummary(result.summary);
      // Reload cached prompts
      loadCachedDistillPrompts();
    } catch (error) {
      console.error('Error distilling subject:', error);
      alert('Failed to distill subject. Please try again.');
    } finally {
      setIsGeneratingDistill(false);
    }
  };

  const loadCachedDistillPrompts = async () => {
    try {
      const prompts = await listCachedDistillPrompts(selectedSubject);
      setCachedDistillPrompts(prompts);
    } catch (error) {
      console.error('Error loading cached distill prompts:', error);
    }
  };

  const handleSelectCachedPrompt = async (prompt: CachedDistillPrompt) => {
    setDistillPrompt(prompt.user_prompt);
    setIsGeneratingDistill(true);
    try {
      const result = await distillSubject(selectedSubject, prompt.user_prompt);
      setDistillSummary(result.summary);
    } catch (error) {
      console.error('Error loading cached distill:', error);
      alert('Failed to load cached summary.');
    } finally {
      setIsGeneratingDistill(false);
    }
  };

  // Load cached distill prompts when subject changes or distill view opens
  useEffect(() => {
    if (showDistill && selectedSubject) {
      loadCachedDistillPrompts();
    }
  }, [showDistill, selectedSubject]);

  if (flashcards.length === 0) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl p-6 max-w-md">
          <p className="text-gray-600">No flashcards to display</p>
          <button
            onClick={onClose}
            className="mt-4 bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  const currentSubjectData = hierarchy[selectedSubject] || { sections: {}, directCards: [] };

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-95 z-50 overflow-hidden">
      <div className="h-full flex">
        {/* Sidebar - Subject Navigation */}
        <div className="w-64 bg-gray-800 text-white overflow-y-auto border-r border-gray-700">
          <div className="p-4 border-b border-gray-700">
            <h2 className="text-xl font-bold">📚 Wiki Pages</h2>
            <p className="text-xs text-gray-400 mt-1">
              {flashcards.length} total flashcards
            </p>
          </div>
          <nav className="p-2">
            {subjects.map((subject) => {
              const subjectData = hierarchy[subject];
              const totalCount = subjectData.directCards.length +
                Object.values(subjectData.sections).reduce((sum, section) => {
                  return sum + section.directCards.length +
                    Object.values(section.subsections).reduce((subSum, cards) => subSum + cards.length, 0);
                }, 0);
              
              return (
                <button
                  key={subject}
                  onClick={() => setSelectedSubject(subject)}
                  className={`w-full text-left px-4 py-3 rounded-lg mb-1 transition ${
                    selectedSubject === subject
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  <div className="font-semibold">{subject}</div>
                  <div className="text-xs opacity-75">
                    {totalCount} topic{totalCount !== 1 ? 's' : ''}
                  </div>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 bg-white overflow-y-auto">
          {/* Header */}
          <div className="bg-white border-b border-gray-200 shadow-sm">
            <div className="max-w-4xl mx-auto px-8 py-4 flex justify-between items-center">
              <h1 className="text-3xl font-bold text-gray-800">{selectedSubject}</h1>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDistill(true)}
                  disabled={isGeneratingDistill}
                  className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  {isGeneratingDistill ? (
                    <>
                      <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Distilling...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                      </svg>
                      Distill Key Info
                    </>
                  )}
                </button>
                <button
                  onClick={handleGeneratePodcast}
                  disabled={isGeneratingPodcast}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  {isGeneratingPodcast ? (
                    <>
                      <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Generating...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                      </svg>
                      Generate Podcast
                    </>
                  )}
                </button>
                <button
                  onClick={onClose}
                  className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Close Wiki
                </button>
              </div>
            </div>
          </div>

          {/* Podcast View or Wiki Content */}
          {showPodcast ? (
            /* Podcast Transcript View */
            <div className="max-w-4xl mx-auto px-8 py-8">
              <div className="mb-6 flex justify-between items-center">
                <h2 className="text-2xl font-bold text-purple-800 flex items-center gap-2">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                  Podcast: {selectedSubject}
                </h2>
                <div className="flex gap-2">
                  <button
                    onClick={handlePlayAudio}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-semibold transition"
                  >
                    {isPlayingAudio ? (
                      <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Stop
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Play Audio (Basic TTS)
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => setShowPodcast(false)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    Back to Wiki
                  </button>
                </div>
              </div>

              <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl p-8 border-2 border-purple-200">
                <div className="prose prose-lg max-w-none">
                  <div className="text-gray-800 leading-relaxed whitespace-pre-wrap">
                    {podcastTranscript}
                  </div>
                </div>
              </div>

              <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-gray-700">
                  <strong>Note:</strong> Currently using basic browser text-to-speech. 
                  For better quality audio, we can integrate ElevenLabs or NotebookLM in the future.
                </p>
              </div>
            </div>
          ) : showDistill ? (
            /* Distill Summary View */
            <div className="max-w-4xl mx-auto px-8 py-8">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-amber-800 flex items-center gap-2 mb-4">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                  </svg>
                  Key Information: {selectedSubject}
                </h2>
                
                {/* User prompt input */}
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
                  <label className="block text-sm font-semibold text-amber-800 mb-2">
                    Who are you? (This helps tailor the summary)
                  </label>
                  <textarea
                    value={distillPrompt}
                    onChange={(e) => setDistillPrompt(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-2 border border-amber-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                    placeholder="Describe your background and what you need to learn..."
                  />
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={handleDistillSubject}
                      disabled={isGeneratingDistill}
                      className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition"
                    >
                      {isGeneratingDistill ? (
                        <>
                          <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Generating...
                        </>
                      ) : (
                        'Generate Summary'
                      )}
                    </button>
                    <button
                      onClick={() => { setShowDistill(false); setDistillSummary(''); }}
                      className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                      </svg>
                      Back to Wiki
                    </button>
                  </div>
                </div>
              </div>

              {/* Cached Prompts */}
              {cachedDistillPrompts.length > 0 && !distillSummary && (
                <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                  <h3 className="font-semibold text-gray-700 mb-3">Previously Used Prompts</h3>
                  <div className="space-y-2">
                    {cachedDistillPrompts.map((prompt, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSelectCachedPrompt(prompt)}
                        className="w-full text-left p-3 bg-white border border-gray-200 rounded-lg hover:bg-amber-50 hover:border-amber-300 transition"
                      >
                        <div className="text-sm text-gray-800 line-clamp-2">{prompt.user_prompt}</div>
                        <div className="text-xs text-gray-500 mt-1">
                          {new Date(prompt.generated_at).toLocaleDateString()}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {distillSummary && (
                <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-8 border-2 border-amber-200">
                  <div 
                    className="prose prose-lg max-w-none text-gray-800 leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: renderMarkdown(distillSummary) }}
                  />
                </div>
              )}

              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-gray-700">
                  <strong>Tip:</strong> Summaries are cached based on your prompt. Try different prompts for different perspectives!
                </p>
              </div>
            </div>
          ) : (
            /* Wiki Content */
            <div className="max-w-4xl mx-auto px-8 py-8">
            {/* Table of Contents */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
              <h3 className="font-bold text-gray-800 mb-4 text-lg">📖 Table of Contents</h3>
              <div className="max-h-96 overflow-y-auto">
                {/* Direct flashcards */}
                {currentSubjectData.directCards.length > 0 && (
                  <ul className="space-y-1 mb-4">
                    {currentSubjectData.directCards.map((flashcard) => (
                      <li key={flashcard.id}>
                        <a
                          href={`#topic-${flashcard.id}`}
                          className="text-blue-600 hover:text-blue-800 hover:underline text-sm"
                        >
                          • {flashcard.topic}
                        </a>
                      </li>
                    ))}
                  </ul>
                )}

                {/* Sections with subsections and flashcards */}
                {Object.entries(currentSubjectData.sections).map(([sectionName, sectionData]) => (
                  <div key={sectionName} className="mb-4">
                    {/* Section link */}
                    <a
                      href={`#section-${sectionName.replace(/\s+/g, '-')}`}
                      className="font-semibold text-blue-700 hover:text-blue-900 hover:underline text-sm block mb-2"
                    >
                      § {sectionName}
                    </a>

                    {/* Direct flashcards in section */}
                    {sectionData.directCards.length > 0 && (
                      <ul className="ml-4 space-y-1 mb-2">
                        {sectionData.directCards.map((flashcard) => (
                          <li key={flashcard.id}>
                            <a
                              href={`#topic-${flashcard.id}`}
                              className="text-blue-600 hover:text-blue-800 hover:underline text-sm"
                            >
                              • {flashcard.topic}
                            </a>
                          </li>
                        ))}
                      </ul>
                    )}

                    {/* Subsections */}
                    {Object.entries(sectionData.subsections).map(([subsectionName, subsectionCards]) => (
                      <div key={subsectionName} className="ml-4 mb-2">
                        {/* Subsection link */}
                        <a
                          href={`#subsection-${subsectionName.replace(/\s+/g, '-')}`}
                          className="font-medium text-purple-600 hover:text-purple-800 hover:underline text-sm block mb-1"
                        >
                          › {subsectionName}
                        </a>

                        {/* Flashcards in subsection */}
                        <ul className="ml-4 space-y-1">
                          {subsectionCards.map((flashcard) => (
                            <li key={flashcard.id}>
                              <a
                                href={`#topic-${flashcard.id}`}
                                className="text-blue-600 hover:text-blue-800 hover:underline text-sm"
                              >
                                • {flashcard.topic}
                              </a>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>

            {/* Render hierarchical content */}
            <div className="space-y-12">
              {/* Direct flashcards (no section) */}
              {currentSubjectData.directCards.map((flashcard) => (
                <article key={flashcard.id} id={`topic-${flashcard.id}`} className="border-b border-gray-200 pb-8">
                  <h2 className="text-2xl font-bold text-gray-800 mb-4">{flashcard.topic}</h2>
                  <div className="prose prose-lg max-w-none">
                    <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{flashcard.explanation}</p>
                  </div>
                </article>
              ))}

              {/* Sections */}
              {Object.entries(currentSubjectData.sections).map(([sectionName, sectionData]) => {
                const isSectionCollapsed = collapsedSections.has(sectionName);
                
                return (
                  <section key={sectionName} id={`section-${sectionName.replace(/\s+/g, '-')}`} className="border-l-4 border-blue-400 pl-6">
                    {/* Section Title - Collapsible */}
                    <button
                      onClick={() => toggleSection(sectionName)}
                      className="w-full text-left mb-6 flex items-center gap-3 hover:text-blue-900 transition group"
                    >
                      <svg
                        className={`w-6 h-6 text-blue-600 transition-transform ${
                          isSectionCollapsed ? '' : 'rotate-90'
                        }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                      <h2 className="text-3xl font-bold text-blue-800 flex items-center gap-2">
                        <span>§</span> {sectionName}
                      </h2>
                    </button>

                    {!isSectionCollapsed && (
                      <>
                        {/* Direct flashcards in section */}
                        {sectionData.directCards.map((flashcard) => (
                          <article key={flashcard.id} id={`topic-${flashcard.id}`} className="mb-8 pb-6 border-b border-gray-100 last:border-b-0">
                            <h3 className="text-xl font-bold text-gray-800 mb-3">{flashcard.topic}</h3>
                            <div className="prose max-w-none">
                              <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{flashcard.explanation}</p>
                            </div>
                          </article>
                        ))}

                        {/* Subsections */}
                        {Object.entries(sectionData.subsections).map(([subsectionName, subsectionCards]) => {
                          const isSubsectionCollapsed = collapsedSubsections.has(subsectionName);
                          
                          return (
                            <div key={subsectionName} id={`subsection-${subsectionName.replace(/\s+/g, '-')}`} className="ml-4 mt-6 border-l-2 border-purple-300 pl-6">
                              {/* Subsection Title - Collapsible */}
                              <button
                                onClick={() => toggleSubsection(subsectionName)}
                                className="text-left mb-4 flex items-center gap-2 hover:text-purple-900 transition"
                              >
                                <svg
                                  className={`w-5 h-5 text-purple-600 transition-transform ${
                                    isSubsectionCollapsed ? '' : 'rotate-90'
                                  }`}
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                                <h3 className="text-2xl font-semibold text-purple-700 flex items-center gap-2">
                                  <span>›</span> {subsectionName}
                                </h3>
                              </button>

                              {/* Flashcards in subsection */}
                              {!isSubsectionCollapsed && subsectionCards.map((flashcard) => (
                                <article key={flashcard.id} id={`topic-${flashcard.id}`} className="mb-6 pb-4 border-b border-gray-100 last:border-b-0">
                                  <h4 className="text-lg font-bold text-gray-800 mb-2">{flashcard.topic}</h4>
                                  <div className="prose prose-sm max-w-none">
                                    <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{flashcard.explanation}</p>
                                  </div>
                                </article>
                              ))}
                            </div>
                          );
                        })}
                      </>
                    )}
                  </section>
                );
              })}
            </div>

            {/* Footer */}
            <div className="mt-12 pt-8 border-t border-gray-200 text-center text-gray-500 text-sm">
              <p>End of {selectedSubject}</p>
            </div>
          </div>
          )}
        </div>
      </div>
    </div>
  );
};

