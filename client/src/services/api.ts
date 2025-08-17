import { 
  VocabularyItem, 
  CreateVocabularyRequest, 
  UpdateVocabularyRequest,
  PracticeSession,
  PracticeResult,
  PracticeStats,
  PracticeMode
} from '../types';

const API_BASE = process.env.REACT_APP_API_BASE || '/api';

class ApiService {
  // Vocabulary endpoints
  async getVocabulary(): Promise<VocabularyItem[]> {
    const response = await fetch(`${API_BASE}/vocabulary`);
    if (!response.ok) {
      throw new Error('Failed to fetch vocabulary');
    }
    return response.json();
  }

  async getVocabularyItem(id: number): Promise<VocabularyItem> {
    const response = await fetch(`${API_BASE}/vocabulary/${id}`);
    if (!response.ok) {
      throw new Error('Failed to fetch vocabulary item');
    }
    return response.json();
  }

  async createVocabularyItem(data: CreateVocabularyRequest): Promise<VocabularyItem> {
    const response = await fetch(`${API_BASE}/vocabulary`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error('Failed to create vocabulary item');
    }
    return response.json();
  }

  async updateVocabularyItem(id: number, data: UpdateVocabularyRequest): Promise<VocabularyItem> {
    const response = await fetch(`${API_BASE}/vocabulary/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error('Failed to update vocabulary item');
    }
    return response.json();
  }

  async deleteVocabularyItem(id: number): Promise<void> {
    const response = await fetch(`${API_BASE}/vocabulary/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error('Failed to delete vocabulary item');
    }
  }

  // Practice endpoints
  async getPracticeWord(mode: PracticeMode = 'word-translation'): Promise<PracticeSession> {
    const response = await fetch(`${API_BASE}/practice/word?mode=${mode}`);
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.error || 'Failed to fetch practice word';
      throw new Error(errorMessage);
    }
    return response.json();
  }

  async checkAnswer(id: number, userTranslation: string, mode: PracticeMode = 'word-translation'): Promise<PracticeResult> {
    const response = await fetch(`${API_BASE}/practice/check`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ id, userTranslation, mode }),
    });
    if (!response.ok) {
      throw new Error('Failed to check answer');
    }
    return response.json();
  }

  async getPracticeStats(): Promise<PracticeStats> {
    const response = await fetch(`${API_BASE}/practice/stats`);
    if (!response.ok) {
      throw new Error('Failed to fetch practice stats');
    }
    return response.json();
  }

  async resetPractice(): Promise<{ message: string }> {
    const response = await fetch(`${API_BASE}/practice/reset`, {
      method: 'POST',
    });
    if (!response.ok) {
      throw new Error('Failed to reset practice');
    }
    return response.json();
  }
}

export const apiService = new ApiService(); 