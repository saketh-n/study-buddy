// Topic with context for editing
export interface Topic {
  id: string;
  name: string;
  context: string; // Brief context note (e.g., "networking device", "programming language")
}

export interface Flashcard {
  id: string;
  topic: string;
  explanation: string;
  isGeneratingExplanation?: boolean;
}

export interface ConceptInputProps {
  onGenerateTopics: (text: string) => void;
  isLoading?: boolean;
}

export interface CachedPrompt {
  cache_key: string;
  prompt_theme: string;
  topic_count: number;
  timestamp: string;
}

export interface CachedPromptsProps {
  cachedPrompts: CachedPrompt[];
  onSelectPrompt: (cacheKey: string) => void;
  onDeletePrompt: (cacheKey: string) => void;
  onRegeneratePrompt: (cacheKey: string) => void;
  isLoading?: boolean;
}

export interface TopicsListProps {
  topics: Topic[];
  promptTheme?: string;
  onUpdateTopics: (topics: Topic[]) => void;
  onGenerateFlashcards: () => void;
  isGenerating?: boolean;
}

export interface FlashcardProps {
  flashcard: Flashcard;
  onGenerateExplanation: (id: string, topic: string) => void;
}

export interface FlashcardListProps {
  flashcards: Flashcard[];
  onGenerateExplanation: (id: string, topic: string) => void;
}

// API Response types
export interface TopicsListResponse {
  prompt_theme: string;
  topics: Topic[];
  cache_key: string;
}

export interface FlashcardsResponse {
  flashcards: Flashcard[];
}

export interface ExplanationResponse {
  topic: string;
  explanation: string;
}

export interface CacheCheckResponse {
  cached: boolean;
  cache_key?: string;
  prompt_theme?: string;
  topics?: Topic[];
}

export interface ListCachedPromptsResponse {
  prompts: CachedPrompt[];
}
