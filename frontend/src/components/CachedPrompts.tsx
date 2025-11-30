import type { CachedPromptsProps } from '../types';

export const CachedPrompts = ({ 
  cachedPrompts, 
  onSelectPrompt, 
  onDeletePrompt,
  onRegeneratePrompt,
  isLoading 
}: CachedPromptsProps) => {
  if (cachedPrompts.length === 0) {
    return null;
  }

  const formatDate = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays < 7) return `${diffDays}d ago`;
      return date.toLocaleDateString();
    } catch {
      return 'Recently';
    }
  };

  const handleDelete = (e: React.MouseEvent, cacheKey: string) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this cached session?')) {
      onDeletePrompt(cacheKey);
    }
  };

  const handleRegenerate = (e: React.MouseEvent, cacheKey: string) => {
    e.stopPropagation();
    if (window.confirm('Regenerate this session? This will create fresh topics using AI.')) {
      onRegeneratePrompt(cacheKey);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto mb-8">
      <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-gray-200">
        <h2 className="text-xl font-bold text-gray-800 mb-4">
          📚 Recent Study Sessions ({cachedPrompts.length})
        </h2>
        <p className="text-gray-600 text-sm mb-4">
          Click on a previous session to reuse it (saves time & API calls!)
        </p>
        
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {cachedPrompts.map((prompt) => (
            <div
              key={prompt.cache_key}
              className="group relative"
            >
              <button
                onClick={() => onSelectPrompt(prompt.cache_key)}
                disabled={isLoading}
                className="w-full text-left p-3 bg-gradient-to-r from-blue-50 to-purple-50 hover:from-blue-100 hover:to-purple-100 rounded-lg transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed border border-gray-200 hover:border-blue-300"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1 min-w-0 mr-2">
                    <div className="font-semibold text-gray-800 truncate">
                      {prompt.prompt_theme}
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      {prompt.topic_count} topic{prompt.topic_count !== 1 ? 's' : ''} • {formatDate(prompt.timestamp)}
                    </div>
                  </div>
                  
                  {/* Action buttons - show on hover */}
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => handleRegenerate(e, prompt.cache_key)}
                      disabled={isLoading}
                      className="p-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded transition disabled:opacity-50"
                      title="Regenerate with AI"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    </button>
                    <button
                      onClick={(e) => handleDelete(e, prompt.cache_key)}
                      disabled={isLoading}
                      className="p-1.5 bg-red-500 hover:bg-red-600 text-white rounded transition disabled:opacity-50"
                      title="Delete"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                  
                  {/* Arrow icon */}
                  <svg 
                    className="w-5 h-5 text-gray-400 flex-shrink-0 ml-2" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M9 5l7 7-7 7" 
                    />
                  </svg>
                </div>
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
