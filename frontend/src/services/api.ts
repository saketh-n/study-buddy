import type { 
  TopicsListResponse, 
  FlashcardsResponse, 
  ExplanationResponse, 
  CacheCheckResponse, 
  ListCachedPromptsResponse,
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
 * Extract topics with brief context from text using Claude AI
 * Returns a list of topics with a prompt theme that can be edited before generating flashcards
 */
export async function extractTopics(text: string): Promise<TopicsListResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/extract-topics`, {
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
