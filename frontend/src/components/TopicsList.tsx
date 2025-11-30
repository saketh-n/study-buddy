import { useState } from 'react';
import type { TopicsListProps, Topic } from '../types';

export const TopicsList = ({ topics, promptTheme, onUpdateTopics, onGenerateFlashcards, isGenerating }: TopicsListProps) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editContext, setEditContext] = useState('');
  const [newTopicName, setNewTopicName] = useState('');
  const [newTopicContext, setNewTopicContext] = useState('');

  const handleDelete = (id: string) => {
    onUpdateTopics(topics.filter(t => t.id !== id));
  };

  const handleStartEdit = (topic: Topic) => {
    setEditingId(topic.id);
    setEditName(topic.name);
    setEditContext(topic.context);
  };

  const handleSaveEdit = () => {
    if (editingId) {
      onUpdateTopics(
        topics.map(t =>
          t.id === editingId
            ? { ...t, name: editName, context: editContext }
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
  };

  const handleAddTopic = () => {
    if (newTopicName.trim()) {
      const newTopic: Topic = {
        id: `topic-${Date.now()}`,
        name: newTopicName.trim(),
        context: newTopicContext.trim(),
      };
      onUpdateTopics([...topics, newTopic]);
      setNewTopicName('');
      setNewTopicContext('');
    }
  };

  if (topics.length === 0) {
    return null;
  }

  return (
    <div className="w-full max-w-4xl mx-auto mb-8">
      <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-gray-200">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">
              Topics Found ({topics.length})
            </h2>
            {promptTheme && (
              <p className="text-sm text-gray-600 italic mt-1">
                Theme: {promptTheme}
              </p>
            )}
          </div>
          <button
            onClick={onGenerateFlashcards}
            disabled={isGenerating || topics.length === 0}
            className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-6 rounded-lg transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isGenerating ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Generating Flashcards...</span>
              </>
            ) : (
              'Generate Flashcards from Topics'
            )}
          </button>
        </div>

        <p className="text-gray-600 text-sm mb-4">
          Review and edit topics below. Delete unwanted items, edit names/context, or add new topics.
        </p>

        {/* Topics List */}
        <div className="space-y-2 mb-6 max-h-96 overflow-y-auto">
          {topics.map((topic) => (
            <div
              key={topic.id}
              className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
            >
              {editingId === topic.id ? (
                // Edit Mode
                <div className="flex-1 flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="flex-1 px-3 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Topic name"
                    autoFocus
                  />
                  <input
                    type="text"
                    value={editContext}
                    onChange={(e) => setEditContext(e.target.value)}
                    className="flex-1 px-3 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    placeholder="Context (optional)"
                  />
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
                    <div className="font-semibold text-gray-800">{topic.name}</div>
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
          ))}
        </div>

        {/* Add New Topic */}
        <div className="border-t pt-4">
          <h3 className="font-semibold text-gray-700 mb-2">Add New Topic</h3>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={newTopicName}
              onChange={(e) => setNewTopicName(e.target.value)}
              placeholder="Topic name"
              className="flex-1 px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAddTopic();
              }}
            />
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
  );
};

