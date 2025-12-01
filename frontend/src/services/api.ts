import type { 
  TopicsListResponse, 
  FlashcardsResponse, 
  ExplanationResponse, 
  CacheCheckResponse, 
  ListCachedPromptsResponse,
  ChatResponse,
  Flashcard,
  Topic 
} from '../types';

const API_BASE_URL = 'http://localhost:8000';

export class APIError extends Error {
  public status?: number;
  constructor(message: string, status?: number) {
    super(message);
    this.name = 'APIError';
    this.status = status;
  }
}

/**
 * Get list of all cached prompts
 */
export async function listCachedPrompts(): Promise<ListCachedPromptsResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/cached-prompts`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new APIError(
        errorData.detail || `HTTP error! status: ${response.status}`,
        response.status
      );
    }

    const data: ListCachedPromptsResponse = await response.json();
    return data;
  } catch (error) {
    if (error instanceof APIError) {
      throw error;
    }
    throw new APIError(
      `Failed to list cached prompts: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Get a specific cached prompt by key
 */
export async function getCachedPrompt(cacheKey: string): Promise<TopicsListResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/get-cached/${cacheKey}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new APIError(
        errorData.detail || `HTTP error! status: ${response.status}`,
        response.status
      );
    }

    const data: TopicsListResponse = await response.json();
    return data;
  } catch (error) {
    if (error instanceof APIError) {
      throw error;
    }
    throw new APIError(
      `Failed to get cached prompt: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Delete a cached prompt
 */
export async function deleteCachedPrompt(cacheKey: string): Promise<void> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/delete-cached/${cacheKey}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new APIError(
        errorData.detail || `HTTP error! status: ${response.status}`,
        response.status
      );
    }
  } catch (error) {
    if (error instanceof APIError) {
      throw error;
    }
    throw new APIError(
      `Failed to delete cached prompt: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Regenerate a cached prompt with fresh AI extraction
 */
export async function regenerateCachedPrompt(cacheKey: string): Promise<TopicsListResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/regenerate-cached/${cacheKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new APIError(
        errorData.detail || `HTTP error! status: ${response.status}`,
        response.status
      );
    }

    const data: TopicsListResponse = await response.json();
    return data;
  } catch (error) {
    if (error instanceof APIError) {
      throw error;
    }
    throw new APIError(
      `Failed to regenerate cached prompt: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Check if we have cached results for this text
 */
export async function checkCache(text: string): Promise<CacheCheckResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/check-cache`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new APIError(
        errorData.detail || `HTTP error! status: ${response.status}`,
        response.status
      );
    }

    const data: CacheCheckResponse = await response.json();
    return data;
  } catch (error) {
    if (error instanceof APIError) {
      throw error;
    }
    throw new APIError(
      `Failed to check cache: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Extract topics from an uploaded image using Claude Vision API
 */
export async function extractTopicsFromImage(file: File): Promise<TopicsListResponse> {
  try {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_BASE_URL}/api/extract-topics-from-image`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new APIError(
        errorData.detail || `HTTP error! status: ${response.status}`,
        response.status
      );
    }

    const data: TopicsListResponse = await response.json();
    return data;
  } catch (error) {
    if (error instanceof APIError) {
      throw error;
    }
    throw new APIError(
      `Failed to extract topics from image: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Extract topics with intelligent question-based approach
 */
export async function extractTopicsIntelligent(text: string, conciseMode: boolean = false): Promise<TopicsListResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/extract-topics-intelligent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text, concise_mode: conciseMode }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new APIError(
        errorData.detail || `HTTP error! status: ${response.status}`,
        response.status
      );
    }

    const data: TopicsListResponse = await response.json();
    return data;
  } catch (error) {
    if (error instanceof APIError) {
      throw error;
    }
    throw new APIError(
      `Failed to extract topics intelligently: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Extract topics with brief context from text using Claude AI
 */
export async function extractTopics(text: string, conciseMode: boolean = false): Promise<TopicsListResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/extract-topics`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text, concise_mode: conciseMode }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new APIError(
        errorData.detail || `HTTP error! status: ${response.status}`,
        response.status
      );
    }

    const data: TopicsListResponse = await response.json();
    return data;
  } catch (error) {
    if (error instanceof APIError) {
      throw error;
    }
    throw new APIError(
      `Failed to extract topics: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Generate flashcards from a list of topics
 */
export async function generateFlashcards(topics: Topic[], originalText?: string): Promise<FlashcardsResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/generate-flashcards`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ topics, original_text: originalText }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new APIError(
        errorData.detail || `HTTP error! status: ${response.status}`,
        response.status
      );
    }

    const data: FlashcardsResponse = await response.json();
    return data;
  } catch (error) {
    if (error instanceof APIError) {
      throw error;
    }
    throw new APIError(
      `Failed to generate flashcards: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Create a new flashcard (manually or with AI generation)
 */
export async function createFlashcard(
  topic: string,
  subject: string,
  explanation?: string,
  generateExplanation: boolean = false,
  context?: string
): Promise<Flashcard> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/flashcards`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        topic,
        subject,
        explanation,
        generate_explanation: generateExplanation,
        context,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new APIError(
        errorData.detail || `HTTP error! status: ${response.status}`,
        response.status
      );
    }

    const data: Flashcard = await response.json();
    return data;
  } catch (error) {
    if (error instanceof APIError) {
      throw error;
    }
    throw new APIError(
      `Failed to create flashcard: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Organize flashcards into hierarchical structure (subjects → sections → subsections)
 */
export async function organizeFlashcards(flashcardIds: string[]): Promise<{ message: string; flashcards: Flashcard[] }> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/organize-flashcards`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ flashcard_ids: flashcardIds }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new APIError(
        errorData.detail || `HTTP error! status: ${response.status}`,
        response.status
      );
    }

    const data = await response.json();
    return data;
  } catch (error) {
    if (error instanceof APIError) {
      throw error;
    }
    throw new APIError(
      `Failed to organize flashcards: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Generate podcast transcript for a subject
 */
export async function generatePodcast(subject: string): Promise<{ subject: string; transcript: string; generated_at: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/generate-podcast/${encodeURIComponent(subject)}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new APIError(
        errorData.detail || `HTTP error! status: ${response.status}`,
        response.status
      );
    }

    const data = await response.json();
    return data;
  } catch (error) {
    if (error instanceof APIError) {
      throw error;
    }
    throw new APIError(
      `Failed to generate podcast: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Get all saved flashcards
 */
export async function getAllFlashcards(): Promise<FlashcardsResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/flashcards`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new APIError(
        errorData.detail || `HTTP error! status: ${response.status}`,
        response.status
      );
    }

    const data: FlashcardsResponse = await response.json();
    return data;
  } catch (error) {
    if (error instanceof APIError) {
      throw error;
    }
    throw new APIError(
      `Failed to get flashcards: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Update a flashcard's topic or explanation
 */
export async function updateFlashcard(id: string, field: 'topic' | 'explanation', value: string): Promise<Flashcard> {
  try {
    const body = field === 'topic' ? { topic: value } : { explanation: value };
    
    const response = await fetch(`${API_BASE_URL}/api/flashcards/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new APIError(
        errorData.detail || `HTTP error! status: ${response.status}`,
        response.status
      );
    }

    const data: Flashcard = await response.json();
    return data;
  } catch (error) {
    if (error instanceof APIError) {
      throw error;
    }
    throw new APIError(
      `Failed to update flashcard: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Delete a flashcard
 */
export async function deleteFlashcard(id: string): Promise<void> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/flashcards/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new APIError(
        errorData.detail || `HTTP error! status: ${response.status}`,
        response.status
      );
    }
  } catch (error) {
    if (error instanceof APIError) {
      throw error;
    }
    throw new APIError(
      `Failed to delete flashcard: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Send a chat message about a flashcard
 */
export async function sendChatMessage(flashcardId: string, message: string): Promise<ChatResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/flashcards/${flashcardId}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ flashcard_id: flashcardId, message }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new APIError(
        errorData.detail || `HTTP error! status: ${response.status}`,
        response.status
      );
    }

    const data: ChatResponse = await response.json();
    return data;
  } catch (error) {
    if (error instanceof APIError) {
      throw error;
    }
    throw new APIError(
      `Failed to send chat message: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Clear chat history for a flashcard
 */
export async function clearChatHistory(flashcardId: string): Promise<void> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/flashcards/${flashcardId}/chat`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new APIError(
        errorData.detail || `HTTP error! status: ${response.status}`,
        response.status
      );
    }
  } catch (error) {
    if (error instanceof APIError) {
      throw error;
    }
    throw new APIError(
      `Failed to clear chat history: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Distill chat history into a new explanation
 */
export async function distillChatToExplanation(flashcardId: string): Promise<Flashcard> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/flashcards/${flashcardId}/distill`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new APIError(
        errorData.detail || `HTTP error! status: ${response.status}`,
        response.status
      );
    }

    const data: Flashcard = await response.json();
    return data;
  } catch (error) {
    if (error instanceof APIError) {
      throw error;
    }
    throw new APIError(
      `Failed to distill chat: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Generate an explanation for a specific topic using Claude AI
 */
export async function explainTopic(topic: string, context?: string): Promise<string> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/explain-topic`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ topic, context }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new APIError(
        errorData.detail || `HTTP error! status: ${response.status}`,
        response.status
      );
    }

    const data: ExplanationResponse = await response.json();
    return data.explanation;
  } catch (error) {
    if (error instanceof APIError) {
      throw error;
    }
    throw new APIError(
      `Failed to generate explanation: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}
