import { useState, useEffect, useRef, useMemo } from 'react';
import type { TopicsListProps, Topic } from '../types';

export const TopicsList = ({ topics, promptTheme, onUpdateTopics, onGenerateFlashcards, isGenerating, isExtractingTopics, generationProgress, processingTopicIds }: TopicsListProps) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editContext, setEditContext] = useState('');
  const [editSubject, setEditSubject] = useState('');
  const [editSection, setEditSection] = useState('');
  const [editSubsection, setEditSubsection] = useState('');
  const [newTopicName, setNewTopicName] = useState('');
  const [newTopicContext, setNewTopicContext] = useState('');
  const [newTopicSubject, setNewTopicSubject] = useState('');
  const [selectedTopics, setSelectedTopics] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [isAutoScrolling, setIsAutoScrolling] = useState(false);
  const [scrollSpeed, setScrollSpeed] = useState(3); // 1-5 speed levels
  const [currentBatchTopics, setCurrentBatchTopics] = useState<string[]>([]);
  const [currentBatchNumber, setCurrentBatchNumber] = useState<number>(0);
  const listRef = useRef<HTMLDivElement>(null);
  const autoScrollRef = useRef<number | null>(null);
  const topicRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Track current batch topics across progress updates
  useEffect(() => {
    if (generationProgress?.type === 'batch_start' && generationProgress.topics) {
      setCurrentBatchTopics(generationProgress.topics);
      setCurrentBatchNumber(generationProgress.batch || 0);
    } else if (generationProgress?.type === 'complete' || !isGenerating) {
      setCurrentBatchTopics([]);
      setCurrentBatchNumber(0);
    }
  }, [generationProgress, isGenerating]);

  // Initialize all topics as selected when topics change
  useEffect(() => {
    setSelectedTopics(new Set(topics.map(t => t.id)));
  }, [topics]);

  // Filter topics based on search query
  const filteredTopics = useMemo(() => {
    if (!searchQuery.trim()) return topics;
    const query = searchQuery.toLowerCase();
    return topics.filter(topic =>
      topic.name.toLowerCase().includes(query) ||
      topic.context.toLowerCase().includes(query) ||
      topic.subject.toLowerCase().includes(query) ||
      (topic.section?.toLowerCase().includes(query)) ||
      (topic.subsection?.toLowerCase().includes(query))
    );
  }, [topics, searchQuery]);

  // Auto-navigate to first processing topic when batch changes
  useEffect(() => {
    if (processingTopicIds && processingTopicIds.length > 0 && listRef.current) {
      const firstProcessingId = processingTopicIds[0];
      const element = topicRefs.current[firstProcessingId];
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [processingTopicIds]);

  // Auto-scroll feature for demos with speed control
  useEffect(() => {
    if (isAutoScrolling && listRef.current) {
      const scrollContainer = listRef.current;
      let lastTime = 0;
      const speedMultiplier = scrollSpeed * 0.5; // 0.5 to 2.5 pixels per frame
      
      const scrollStep = (currentTime: number) => {
        if (currentTime - lastTime > 16) { // ~60fps
          if (scrollContainer.scrollTop < scrollContainer.scrollHeight - scrollContainer.clientHeight) {
            scrollContainer.scrollTop += speedMultiplier;
          } else {
            // Reset to top and continue
            scrollContainer.scrollTop = 0;
          }
          lastTime = currentTime;
        }
        autoScrollRef.current = requestAnimationFrame(scrollStep);
      };
      autoScrollRef.current = requestAnimationFrame(scrollStep);
    } else if (autoScrollRef.current) {
      cancelAnimationFrame(autoScrollRef.current);
    }
    return () => {
      if (autoScrollRef.current) {
        cancelAnimationFrame(autoScrollRef.current);
      }
    };
  }, [isAutoScrolling, scrollSpeed]);

  const handleToggleTopic = (id: string) => {
    setSelectedTopics(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    setSelectedTopics(new Set(topics.map(t => t.id)));
  };

  const handleDeselectAll = () => {
    setSelectedTopics(new Set());
  };

  const handleGenerateSelected = () => {
    onGenerateFlashcards(Array.from(selectedTopics));
  };

  const handleDelete = (id: string) => {
    onUpdateTopics(topics.filter(t => t.id !== id));
  };

  const handleStartEdit = (topic: Topic) => {
    setEditingId(topic.id);
    setEditName(topic.name);
    setEditContext(topic.context);
    setEditSubject(topic.subject);
    setEditSection(topic.section || '');
    setEditSubsection(topic.subsection || '');
  };

  const handleSaveEdit = () => {
    if (editingId) {
      onUpdateTopics(
        topics.map(t =>
          t.id === editingId
            ? { ...t, name: editName, context: editContext, subject: editSubject, section: editSection || undefined, subsection: editSubsection || undefined }
            : t
        )
      );
      setEditingId(null);
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditName('');
    setEditContext('');
    setEditSubject('');
    setEditSection('');
    setEditSubsection('');
  };

  const handleAddTopic = () => {
    if (newTopicName.trim()) {
      const newTopic: Topic = {
        id: `topic-${Date.now()}`,
        name: newTopicName.trim(),
        context: newTopicContext.trim(),
        subject: newTopicSubject.trim() || 'General',
      };
      onUpdateTopics([...topics, newTopic]);
      setNewTopicName('');
      setNewTopicContext('');
      setNewTopicSubject('');
    }
  };

  if (topics.length === 0) {
    return null;
  }

  return (
    <div className="w-full max-w-4xl mx-auto mb-8">
      <div className="bg-white rounded-xl shadow-lg border-2 border-gray-200">
        {/* Collapsible Header */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="w-full flex items-center justify-between p-6 hover:bg-gray-50 transition rounded-t-xl"
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
            <div className="text-left">
              <h2 className="text-2xl font-bold text-gray-800">
                Topics Found ({topics.length})
              </h2>
              {promptTheme && (
                <p className="text-sm text-gray-600 italic mt-1">
                  Theme: {promptTheme}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-600">
              {isCollapsed ? 'Click to expand' : 'Click to collapse'}
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleGenerateSelected();
              }}
              disabled={isGenerating || selectedTopics.size === 0}
              className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-6 rounded-lg transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isGenerating ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Generating...</span>
                </>
              ) : (
                `Generate ${selectedTopics.size} Flashcard${selectedTopics.size !== 1 ? 's' : ''}`
              )}
            </button>
          </div>
        </button>

        {/* Collapsible Content */}
        {!isCollapsed && (
          <div className="p-6 pt-0">
            <p className="text-gray-600 text-sm mb-4">
              Review and edit topics below. Delete unwanted items, edit names/context, or add new topics.
            </p>

            {/* Generation Progress */}
            {isGenerating && generationProgress && (
              <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                {/* Progress Bar - Always visible at top */}
                {generationProgress.total && (
                  <div className="mb-3">
                    <div className="flex justify-between text-sm text-blue-800 mb-1">
                      <span className="font-medium">Overall Progress</span>
                      <span className="font-bold">{generationProgress.completed || 0} / {generationProgress.total} flashcards</span>
                    </div>
                    <div className="w-full bg-blue-200 rounded-full h-4 shadow-inner">
                      <div 
                        className="bg-gradient-to-r from-blue-500 to-blue-600 h-4 rounded-full transition-all duration-300 flex items-center justify-center"
                        style={{ width: `${Math.max(5, ((generationProgress.completed || 0) / generationProgress.total) * 100)}%` }}
                      >
                        {((generationProgress.completed || 0) / generationProgress.total) > 0.1 && (
                          <span className="text-xs text-white font-bold">
                            {Math.round(((generationProgress.completed || 0) / generationProgress.total) * 100)}%
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Divider */}
                <div className="border-t border-blue-200 my-3"></div>
                
                {/* Status Message */}
                <div className="flex items-center gap-3 mb-2">
                  <svg className="animate-spin h-5 w-5 text-blue-600 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span className="font-semibold text-blue-800">
                    {generationProgress.type === 'start' && `Starting generation of ${generationProgress.total} flashcards...`}
                    {generationProgress.type === 'batch_start' && `Processing batch ${generationProgress.batch}...`}
                    {generationProgress.type === 'progress' && `✓ Generated: ${generationProgress.topic}`}
                    {generationProgress.type === 'complete' && `🎉 Completed! Generated ${generationProgress.total} flashcards`}
                  </span>
                </div>

                {/* Current Batch Topics - Always visible when there's a batch */}
                {currentBatchTopics.length > 0 && (
                  <div className="text-sm text-blue-700 bg-blue-100 rounded-lg p-3 border border-blue-200">
                    <div className="font-semibold mb-1">📦 Batch {currentBatchNumber} - Processing:</div>
                    <div className="flex flex-wrap gap-1">
                      {currentBatchTopics.map((topicName, idx) => (
                        <span key={idx} className="px-2 py-0.5 bg-white rounded text-xs border border-blue-300">
                          {topicName}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Topic Extraction Progress */}
            {isExtractingTopics && (
              <div className="mb-4 p-4 bg-purple-50 border border-purple-200 rounded-lg">
                <div className="flex items-center gap-3">
                  <svg className="animate-spin h-5 w-5 text-purple-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span className="font-semibold text-purple-800">
                    Extracting topics from text...
                  </span>
                </div>
                <div className="mt-2 h-1 bg-purple-200 rounded-full overflow-hidden">
                  <div className="h-full bg-purple-600 rounded-full animate-pulse" style={{ width: '60%' }} />
                </div>
              </div>
            )}

            {/* Search Bar */}
            <div className="mb-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search topics by name, context, subject, section..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                />
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
              {searchQuery && (
                <p className="mt-1 text-sm text-gray-600">
                  Showing {filteredTopics.length} of {topics.length} topics
                </p>
              )}
            </div>

            {/* Selection Controls */}
            <div className="flex items-center justify-between mb-4 p-3 bg-gray-50 rounded-lg flex-wrap gap-2">
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium text-gray-700">
                  {selectedTopics.size} of {topics.length} selected
                </span>
                <button
                  onClick={handleSelectAll}
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                  Select All
                </button>
                <button
                  onClick={handleDeselectAll}
                  className="text-sm text-gray-600 hover:text-gray-800 font-medium"
                >
                  Deselect All
                </button>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsAutoScrolling(!isAutoScrolling)}
                  className={`text-sm px-3 py-1 rounded-lg transition ${
                    isAutoScrolling 
                      ? 'bg-green-500 text-white' 
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                  title="Auto-scroll for demos"
                >
                  {isAutoScrolling ? '⏸ Stop' : '▶ Auto-Scroll'}
                </button>
                {isAutoScrolling && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">Speed:</span>
                    <input
                      type="range"
                      min="1"
                      max="5"
                      value={scrollSpeed}
                      onChange={(e) => setScrollSpeed(parseInt(e.target.value))}
                      className="w-16 h-2 accent-green-500"
                    />
                    <span className="text-xs text-gray-600 w-4">{scrollSpeed}x</span>
                  </div>
                )}
              </div>
            </div>

            {/* Topics List */}
            <div ref={listRef} className="space-y-2 mb-6 max-h-96 overflow-y-auto scroll-smooth">
          {filteredTopics.map((topic) => {
            const isProcessing = processingTopicIds?.includes(topic.id);
            return (
            <div
              key={topic.id}
              ref={(el) => { topicRefs.current[topic.id] = el; }}
              className={`flex items-center gap-3 p-3 rounded-lg transition-all duration-300 ${
                isProcessing
                  ? 'bg-yellow-100 border-2 border-yellow-400 shadow-lg scale-[1.02]'
                  : selectedTopics.has(topic.id) 
                    ? 'bg-blue-50 hover:bg-blue-100 border border-blue-200' 
                    : 'bg-gray-50 hover:bg-gray-100 border border-transparent'
              }`}
            >
              {/* Processing indicator */}
              {isProcessing && (
                <svg className="animate-spin h-5 w-5 text-yellow-600 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              )}
              {/* Checkbox */}
              {!isProcessing && (
                <input
                  type="checkbox"
                  checked={selectedTopics.has(topic.id)}
                  onChange={() => handleToggleTopic(topic.id)}
                  className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                />
              )}
              {editingId === topic.id ? (
                // Edit Mode
                <div className="flex-1 flex flex-col gap-2">
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="px-3 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Topic name"
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={editContext}
                      onChange={(e) => setEditContext(e.target.value)}
                      className="flex-1 px-3 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      placeholder="Context"
                    />
                    <input
                      type="text"
                      value={editSubject}
                      onChange={(e) => setEditSubject(e.target.value)}
                      className="flex-1 px-3 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      placeholder="Subject"
                    />
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={editSection}
                      onChange={(e) => setEditSection(e.target.value)}
                      className="flex-1 px-3 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      placeholder="Section (optional)"
                    />
                    <input
                      type="text"
                      value={editSubsection}
                      onChange={(e) => setEditSubsection(e.target.value)}
                      className="flex-1 px-3 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      placeholder="Subsection (optional)"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleSaveEdit}
                      className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm"
                    >
                      Save
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-1 rounded text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                // View Mode
                <>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="font-semibold text-gray-800">{topic.name}</div>
                      <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-800 rounded">
                        {topic.subject}
                      </span>
                      {topic.section && (
                        <span className="text-xs px-2 py-0.5 bg-purple-100 text-purple-700 rounded">
                          {topic.section}
                        </span>
                      )}
                      {topic.subsection && (
                        <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded">
                          {topic.subsection}
                        </span>
                      )}
                    </div>
                    {topic.context && (
                      <div className="text-sm text-gray-600 italic">Context: {topic.context}</div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleStartEdit(topic)}
                      className="text-blue-600 hover:text-blue-800 p-1"
                      title="Edit"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDelete(topic.id)}
                      className="text-red-600 hover:text-red-800 p-1"
                      title="Delete"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </>
              )}
            </div>
            );
          })}
            </div>

            {/* Add New Topic */}
            <div className="border-t pt-4">
          <h3 className="font-semibold text-gray-700 mb-2">Add New Topic</h3>
          <div className="flex flex-col gap-2">
            <input
              type="text"
              value={newTopicName}
              onChange={(e) => setNewTopicName(e.target.value)}
              placeholder="Topic name"
              className="px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAddTopic();
              }}
            />
            <div className="flex gap-2">
              <input
                type="text"
                value={newTopicContext}
                onChange={(e) => setNewTopicContext(e.target.value)}
                placeholder="Context (optional)"
                className="flex-1 px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAddTopic();
                }}
              />
              <input
                type="text"
                value={newTopicSubject}
                onChange={(e) => setNewTopicSubject(e.target.value)}
                placeholder="Subject (optional)"
                className="flex-1 px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAddTopic();
                }}
              />
              <button
                onClick={handleAddTopic}
                disabled={!newTopicName.trim()}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add
              </button>
            </div>
          </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

