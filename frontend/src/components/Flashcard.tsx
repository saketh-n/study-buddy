import { useState } from 'react';
import type { FlashcardProps } from '../types';

export const Flashcard = ({ 
  flashcard, 
  onUpdate, 
  onDelete,
  onSendChatMessage,
  onClearChat,
  onDistillChat,
  onGenerateExplanation
}: FlashcardProps) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const [isEditingTopic, setIsEditingTopic] = useState(false);
  const [isEditingExplanation, setIsEditingExplanation] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [editTopicValue, setEditTopicValue] = useState(flashcard.topic);
  const [editExplanationValue, setEditExplanationValue] = useState(flashcard.explanation);
  const [chatMessage, setChatMessage] = useState('');
  const [isSendingChat, setIsSendingChat] = useState(false);

  const handleFlip = () => {
    if (!isEditingTopic && !isEditingExplanation && !isChatOpen) {
      setIsFlipped(!isFlipped);
    }
  };

  const handleSaveTopic = () => {
    if (editTopicValue.trim() && editTopicValue !== flashcard.topic) {
      onUpdate(flashcard.id, 'topic', editTopicValue.trim());
    }
    setIsEditingTopic(false);
  };

  const handleSaveExplanation = () => {
    if (editExplanationValue.trim() && editExplanationValue !== flashcard.explanation) {
      onUpdate(flashcard.id, 'explanation', editExplanationValue.trim());
    }
    setIsEditingExplanation(false);
  };

  const handleSendChat = async () => {
    if (!chatMessage.trim() || isSendingChat) return;
    
    setIsSendingChat(true);
    try {
      await onSendChatMessage(flashcard.id, chatMessage.trim());
      setChatMessage('');
    } finally {
      setIsSendingChat(false);
    }
  };

  const handleClearChat = () => {
    if (window.confirm('Clear all chat history for this flashcard?')) {
      onClearChat(flashcard.id);
    }
  };

  const handleDistill = () => {
    if (window.confirm('Create a new explanation from the chat history?')) {
      onDistillChat(flashcard.id);
      setIsChatOpen(false);
    }
  };

  const hasExplanation = flashcard.explanation && flashcard.explanation.length > 0;
  const isGenerating = flashcard.isGeneratingExplanation;

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-gray-200 min-h-[300px] flex flex-col">
      {/* Header with subject badge and actions */}
      <div className="flex justify-between items-start mb-4">
        <span className="text-xs font-semibold px-2 py-1 bg-blue-100 text-blue-800 rounded">
          {flashcard.subject}
        </span>
        <div className="flex gap-2">
          <button
            onClick={() => setIsChatOpen(!isChatOpen)}
            className="p-1 text-blue-600 hover:text-blue-800"
            title="Chat about this topic"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </button>
          <button
            onClick={() => onDelete(flashcard.id)}
            className="p-1 text-red-600 hover:text-red-800"
            title="Delete flashcard"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* Chat Panel */}
      {isChatOpen && (
        <div className="mb-4 border-2 border-blue-200 rounded-lg p-4 bg-blue-50">
          <div className="flex justify-between items-center mb-2">
            <h4 className="font-semibold text-blue-900">Chat about this topic</h4>
            <div className="flex gap-2">
              {flashcard.chat_history.length > 0 && (
                <>
                  <button
                    onClick={handleDistill}
                    className="text-xs bg-green-500 hover:bg-green-600 text-white px-2 py-1 rounded"
                    title="Create new explanation from chat"
                  >
                    Distill
                  </button>
                  <button
                    onClick={handleClearChat}
                    className="text-xs bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded"
                    title="Clear chat history"
                  >
                    Clear
                  </button>
                </>
              )}
            </div>
          </div>
          
          {/* Chat history */}
          <div className="max-h-48 overflow-y-auto mb-3 space-y-2">
            {flashcard.chat_history.map((msg, idx) => (
              <div
                key={idx}
                className={`p-2 rounded ${
                  msg.role === 'user'
                    ? 'bg-blue-100 text-right'
                    : 'bg-gray-100 text-left'
                }`}
              >
                <div className="text-xs font-semibold mb-1">
                  {msg.role === 'user' ? 'You' : 'Claude'}
                </div>
                <div className="text-sm">{msg.content}</div>
              </div>
            ))}
          </div>

          {/* Chat input */}
          <div className="flex gap-2">
            <input
              type="text"
              value={chatMessage}
              onChange={(e) => setChatMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendChat();
                }
              }}
              placeholder="Ask a question..."
              className="flex-1 px-3 py-2 border border-blue-300 rounded text-sm"
              disabled={isSendingChat}
            />
            <button
              onClick={handleSendChat}
              disabled={!chatMessage.trim() || isSendingChat}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm disabled:opacity-50"
            >
              {isSendingChat ? '...' : 'Send'}
            </button>
          </div>
        </div>
      )}

      {/* Card content */}
      <div onClick={handleFlip} className="flex-1 flex items-center justify-center cursor-pointer">
        {!isFlipped ? (
          <div className="text-center w-full">
            {isEditingTopic ? (
              <div onClick={(e) => e.stopPropagation()} className="w-full">
                <input
                  type="text"
                  value={editTopicValue}
                  onChange={(e) => setEditTopicValue(e.target.value)}
                  onBlur={handleSaveTopic}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveTopic();
                    if (e.key === 'Escape') setIsEditingTopic(false);
                  }}
                  className="text-2xl font-bold text-gray-800 w-full px-2 py-1 border-2 border-blue-500 rounded"
                  autoFocus
                />
              </div>
            ) : (
              <div className="group">
                <h3 className="text-2xl font-bold text-gray-800 mb-2">
                  {flashcard.topic}
                </h3>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditTopicValue(flashcard.topic);
                    setIsEditingTopic(true);
                  }}
                  className="opacity-0 group-hover:opacity-100 text-xs text-blue-600 hover:text-blue-800"
                >
                  Edit topic
                </button>
              </div>
            )}
            <p className="text-sm text-gray-500 mt-4">
              Click to see explanation
            </p>
          </div>
        ) : (
          <div className="text-center w-full">
            <h4 className="text-lg font-semibold text-blue-600 mb-3">
              {flashcard.topic}
            </h4>
            
            {isGenerating ? (
              <div className="flex flex-col items-center justify-center py-6">
                <svg className="animate-spin h-8 w-8 text-blue-600 mb-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <p className="text-gray-600 text-sm">Generating explanation...</p>
              </div>
            ) : hasExplanation ? (
              <div onClick={(e) => e.stopPropagation()}>
                {isEditingExplanation ? (
                  <div className="w-full">
                    <textarea
                      value={editExplanationValue}
                      onChange={(e) => setEditExplanationValue(e.target.value)}
                      onBlur={handleSaveExplanation}
                      className="text-gray-700 leading-relaxed w-full px-2 py-1 border-2 border-blue-500 rounded min-h-[100px]"
                      autoFocus
                    />
                  </div>
                ) : (
                  <div className="group">
                    <p className="text-gray-700 leading-relaxed mb-4 text-left">
                      {flashcard.explanation}
                    </p>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditExplanationValue(flashcard.explanation);
                        setIsEditingExplanation(true);
                      }}
                      className="opacity-0 group-hover:opacity-100 text-xs text-blue-600 hover:text-blue-800"
                    >
                      Edit explanation
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center gap-4 py-4">
                <p className="text-gray-600 text-sm mb-2">
                  No explanation yet
                </p>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onGenerateExplanation(flashcard.id, flashcard.topic);
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg"
                >
                  Generate Explanation
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
