import type { TopicsResponse, ExplanationResponse } from '../types';

const API_BASE_URL = 'http://localhost:8000';

export class APIError extends Error {
  public status?: number
  constructor(message: string, status?: number) {
    super(message);
    this.name = 'APIError';
    this.status = status;
  }
}

/**
 * Extract topics from a chunk of text using Claude AI
 */
export async function extractTopics(text: string): Promise<string[]> {
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

    const data: TopicsResponse = await response.json();
    return data.topics;
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
 * Generate an explanation for a specific topic using Claude AI
 */
export async function explainTopic(topic: string): Promise<string> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/explain-topic`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ topic }),
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

