export interface Flashcard {
  id: string;
  topic: string;
  explanation: string;
}

export interface ConceptInputProps {
  onConceptsSubmit: (concepts: string[]) => void;
}

export interface FlashcardProps {
  flashcard: Flashcard;
}

export interface FlashcardListProps {
  flashcards: Flashcard[];
}

