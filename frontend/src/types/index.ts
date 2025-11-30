export interface Flashcard {
  id: string;
  topic: string;
  explanation: string;
  isGeneratingExplanation?: boolean;
}

export interface ConceptInputProps {
  onConceptsSubmit: (text: string) => void;
  isLoading?: boolean;
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
export interface TopicsResponse {
  topics: string[];
}

export interface ExplanationResponse {
  topic: string;
  explanation: string;
}

export interface FlashcardResponse {
  flashcards: Flashcard[];
}
