// Topic with context and subject for editing
export interface Topic {
  id: string;
  name: string;
  context: string;
  subject: string; // NEW: Category like "Networking", "Storage", "Security"
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface Flashcard {
  id: string;
  topic: string;
  subject: string; // NEW: For categorization
  explanation: string;
  chat_history: ChatMessage[];
  isGeneratingExplanation?: boolean;
}

export interface ConceptInputProps {
  onGenerateTopics: (text: string, filterNovelOnly: boolean) => void;
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
  onUpdate: (id: string, field: 'topic' | 'explanation', value: string) => void;
  onDelete: (id: string) => void;
  onSendChatMessage: (id: string, message: string) => void;
  onClearChat: (id: string) => void;
  onDistillChat: (id: string) => void;
  onGenerateExplanation: (id: string, topic: string) => void;
}

export interface FlashcardListProps {
  flashcards: Flashcard[];
  onUpdate: (id: string, field: 'topic' | 'explanation', value: string) => void;
  onDelete: (id: string) => void;
  onSendChatMessage: (id: string, message: string) => void;
  onClearChat: (id: string) => void;
  onDistillChat: (id: string) => void;
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

export interface ChatResponse {
  response: string;
  chat_history: ChatMessage[];
}

export interface CreateFlashcardRequest {
  topic: string;
  subject: string;
  explanation?: string;
  generate_explanation: boolean;
  context?: string;
}

export interface DistillResponse {
  flashcard: Flashcard;
}
