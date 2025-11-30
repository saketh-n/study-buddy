import { useState, useEffect } from 'react';
import { ConceptInput, CachedPrompts, TopicsList, FlashcardList } from './components';
import type { Flashcard, Topic, CachedPrompt } from './types';
import { 
  listCachedPrompts, 
  getCachedPrompt, 
  deleteCachedPrompt,
  regenerateCachedPrompt,
  checkCache, 
  extractTopics, 
  generateFlashcards, 
  explainTopic, 
  APIError 
} from './services/api';

function App() {
  const [cachedPrompts, setCachedPrompts] = useState<CachedPrompt[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [promptTheme, setPromptTheme] = useState<string>('');
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [isExtractingTopics, setIsExtractingTopics] = useState(false);
  const [isGeneratingFlashcards, setIsGeneratingFlashcards] = useState(false);
  const [isLoadingCache, setIsLoadingCache] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [originalText, setOriginalText] = useState<string>('');
  const [cacheInfo, setCacheInfo] = useState<string | null>(null);

  // Load cached prompts on mount
  useEffect(() => {
    loadCachedPrompts();
  }, []);

  const loadCachedPrompts = async () => {
    try {
      const response = await listCachedPrompts();
      setCachedPrompts(response.prompts);
    } catch (err) {
      console.error('Error loading cached prompts:', err);
      // Don't show error to user, just log it
    }
  };

  const handleSelectCachedPrompt = async (cacheKey: string) => {
    setIsLoadingCache(true);
    setError(null);
    setCacheInfo(null);
    
    try {
      const response = await getCachedPrompt(cacheKey);
      setTopics(response.topics);
      setPromptTheme(response.prompt_theme);
      setCacheInfo(`✓ Loaded "${response.prompt_theme}" from cache`);
      // Clear flashcards when loading a cached prompt
      setFlashcards([]);
    } catch (err) {
      if (err instanceof APIError) {
        setError(err.message);
      } else {
        setError('Failed to load cached prompt. Please try again.');
      }
      console.error('Error loading cached prompt:', err);
    } finally {
      setIsLoadingCache(false);
    }
  };

  const handleDeleteCachedPrompt = async (cacheKey: string) => {
    setError(null);
    
    try {
      await deleteCachedPrompt(cacheKey);
      
      // Reload cached prompts list
      await loadCachedPrompts();
      
      // If the deleted prompt was currently loaded, clear it
      const deletedPrompt = cachedPrompts.find(p => p.cache_key === cacheKey);
      if (deletedPrompt) {
        setCacheInfo(`✓ Deleted "${deletedPrompt.prompt_theme}"`);
      }
      
      // Clear current topics if they match the deleted cache
      // (We can't easily check this without storing current cache_key, so we'll just keep them)
      
    } catch (err) {
      if (err instanceof APIError) {
        setError(err.message);
      } else {
        setError('Failed to delete cached prompt. Please try again.');
      }
      console.error('Error deleting cached prompt:', err);
    }
  };

  const handleRegenerateCachedPrompt = async (cacheKey: string) => {
    setIsLoadingCache(true);
    setError(null);
    setCacheInfo(null);
    
    try {
      const response = await regenerateCachedPrompt(cacheKey);
      setTopics(response.topics);
      setPromptTheme(response.prompt_theme);
      setCacheInfo(`✓ Regenerated "${response.prompt_theme}" with fresh AI extraction`);
      
      // Clear flashcards when regenerating
      setFlashcards([]);
      
      // Reload cached prompts list
      await loadCachedPrompts();
    } catch (err) {
      if (err instanceof APIError) {
        setError(err.message);
      } else {
        setError('Failed to regenerate cached prompt. Please try again.');
      }
      console.error('Error regenerating cached prompt:', err);
    } finally {
      setIsLoadingCache(false);
    }
  };

  const handleGenerateTopics = async (text: string) => {
    setIsExtractingTopics(true);
    setError(null);
    setCacheInfo(null);
    setOriginalText(text);
    
    try {
      // Check cache first
      const cacheResult = await checkCache(text);
      
      if (cacheResult.cached && cacheResult.topics && cacheResult.prompt_theme) {
        // Use cached results
        setTopics(cacheResult.topics);
        setPromptTheme(cacheResult.prompt_theme);
        setCacheInfo(`✓ Loaded "${cacheResult.prompt_theme}" from cache (saved API call)`);
        setIsExtractingTopics(false);
        // Reload cached prompts list
        await loadCachedPrompts();
        return;
      }

      // Call the API to extract topics with context from the text
      const response = await extractTopics(text);
      
      setTopics(response.topics);
      setPromptTheme(response.prompt_theme);
      setCacheInfo(`✓ Extracted topics for "${response.prompt_theme}" and cached`);
      
      // Reload cached prompts list to show the new entry
      await loadCachedPrompts();
    } catch (err) {
      if (err instanceof APIError) {
        setError(err.message);
      } else {
        setError('Failed to extract topics. Please try again.');
      }
      console.error('Error extracting topics:', err);
    } finally {
      setIsExtractingTopics(false);
    }
  };

  const handleUpdateTopics = (updatedTopics: Topic[]) => {
    setTopics(updatedTopics);
  };

  const handleGenerateFlashcards = async () => {
    setIsGeneratingFlashcards(true);
    setError(null);
    
    try {
      // Call the API to generate flashcards from the edited topics
      const response = await generateFlashcards(topics, originalText);
      
      // Convert API flashcards to our format
      const newFlashcards: Flashcard[] = response.flashcards.map(card => ({
        ...card,
        isGeneratingExplanation: false,
      }));

      setFlashcards(newFlashcards);
    } catch (err) {
      if (err instanceof APIError) {
        setError(err.message);
      } else {
        setError('Failed to generate flashcards. Please try again.');
      }
      console.error('Error generating flashcards:', err);
    } finally {
      setIsGeneratingFlashcards(false);
    }
  };

  const handleGenerateExplanation = async (id: string, topic: string) => {
    // Find the topic to get its context
    const topicData = topics.find(t => t.name === topic);
    
    // Set loading state for this specific flashcard
    setFlashcards(prevCards =>
      prevCards.map(card =>
        card.id === id
          ? { ...card, isGeneratingExplanation: true }
          : card
      )
    );
    setError(null);

    try {
      // Call the API to generate explanation with context
      const explanation = await explainTopic(topic, topicData?.context);
      
      // Update the flashcard with the explanation
      setFlashcards(prevCards =>
        prevCards.map(card =>
          card.id === id
            ? { ...card, explanation, isGeneratingExplanation: false }
            : card
        )
      );
    } catch (err) {
      if (err instanceof APIError) {
        setError(err.message);
      } else {
        setError('Failed to generate explanation. Please try again.');
      }
      console.error('Error generating explanation:', err);
      
      // Reset loading state on error
      setFlashcards(prevCards =>
        prevCards.map(card =>
          card.id === id
            ? { ...card, isGeneratingExplanation: false }
            : card
        )
      );
    }
  };

  const handleClearAll = () => {
    setTopics([]);
    setPromptTheme('');
    setFlashcards([]);
    setError(null);
    setOriginalText('');
    setCacheInfo(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <header className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-800 mb-3">
            Study Buddy
          </h1>
          <p className="text-gray-600 text-lg">
            Extract topics, edit them, then generate AI-powered flashcards
          </p>
        </header>

        {/* Error Message */}
        {error && (
          <div className="max-w-2xl mx-auto mb-6 bg-red-50 border-2 border-red-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <svg className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="flex-1">
                <h3 className="text-red-800 font-semibold mb-1">Error</h3>
                <p className="text-red-700 text-sm">{error}</p>
              </div>
              <button 
                onClick={() => setError(null)}
                className="text-red-600 hover:text-red-800"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Cache Info */}
        {cacheInfo && (
          <div className="max-w-2xl mx-auto mb-6 bg-green-50 border-2 border-green-200 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <svg className="w-6 h-6 text-green-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-green-700 text-sm font-medium">{cacheInfo}</p>
            </div>
          </div>
        )}

        {/* Cached Prompts */}
        <CachedPrompts 
          cachedPrompts={cachedPrompts}
          onSelectPrompt={handleSelectCachedPrompt}
          onDeletePrompt={handleDeleteCachedPrompt}
          onRegeneratePrompt={handleRegenerateCachedPrompt}
          isLoading={isLoadingCache || isExtractingTopics}
        />

        {/* Step 1: Concept Input */}
        <ConceptInput 
          onGenerateTopics={handleGenerateTopics}
          isLoading={isExtractingTopics}
        />

        {/* Step 2: Topics List (Editable) */}
        {topics.length > 0 && (
          <TopicsList 
            topics={topics}
            promptTheme={promptTheme}
            onUpdateTopics={handleUpdateTopics}
            onGenerateFlashcards={handleGenerateFlashcards}
            isGenerating={isGeneratingFlashcards}
          />
        )}

        {/* Clear Button */}
        {(topics.length > 0 || flashcards.length > 0) && (
          <div className="text-center mb-8">
            <button
              onClick={handleClearAll}
              disabled={isExtractingTopics || isGeneratingFlashcards}
              className="bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-6 rounded-lg transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Clear All & Start Over
            </button>
          </div>
        )}

        {/* Step 3: Flashcard List */}
        <FlashcardList 
          flashcards={flashcards}
          onGenerateExplanation={handleGenerateExplanation}
        />
      </div>
    </div>
  );
}

export default App;
