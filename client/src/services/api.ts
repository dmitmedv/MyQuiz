import { 
  VocabularyItem, 
  CreateVocabularyRequest, 
  UpdateVocabularyRequest,
  PracticeSession,
  PracticeResult,
  PracticeStats,
  PracticeMode,
  UserSettings,
  UpdateUserSettingsRequest
} from '../types';

const API_BASE = process.env.REACT_APP_API_BASE || '/api';

class ApiService {
  // Helper method to get auth headers
  private getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem('auth_token');
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    return headers;
  }
  // Vocabulary endpoints
  async getVocabulary(): Promise<VocabularyItem[]> {
    const response = await fetch(`${API_BASE}/vocabulary`, {
      headers: this.getAuthHeaders(),
    });
    if (!response.ok) {
      throw new Error('Failed to fetch vocabulary');
    }
    return response.json();
  }

  async getVocabularyItem(id: number): Promise<VocabularyItem> {
    const response = await fetch(`${API_BASE}/vocabulary/${id}`, {
      headers: this.getAuthHeaders(),
    });
    if (!response.ok) {
      throw new Error('Failed to fetch vocabulary item');
    }
    return response.json();
  }

  async createVocabularyItem(data: CreateVocabularyRequest): Promise<VocabularyItem> {
    const response = await fetch(`${API_BASE}/vocabulary`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
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
      headers: this.getAuthHeaders(),
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
      headers: this.getAuthHeaders(),
    });
    if (!response.ok) {
      throw new Error('Failed to delete vocabulary item');
    }
  }

  async resetAttempts(id: number): Promise<{ message: string; item: VocabularyItem }> {
    const response = await fetch(`${API_BASE}/vocabulary/${id}/reset-attempts`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
    });
    if (!response.ok) {
      throw new Error('Failed to reset attempt counts');
    }
    return response.json();
  }

  // Practice endpoints
  async getPracticeWord(mode: PracticeMode = 'word-translation'): Promise<PracticeSession> {
    const response = await fetch(`${API_BASE}/practice/word?mode=${mode}`, {
      headers: this.getAuthHeaders(),
    });
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
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ id, userTranslation, mode }),
    });
    if (!response.ok) {
      throw new Error('Failed to check answer');
    }
    return response.json();
  }

  async getPracticeStats(): Promise<PracticeStats> {
    const response = await fetch(`${API_BASE}/practice/stats`, {
      headers: this.getAuthHeaders(),
    });
    if (!response.ok) {
      throw new Error('Failed to fetch practice stats');
    }
    return response.json();
  }

  async resetPractice(): Promise<{ message: string }> {
    const response = await fetch(`${API_BASE}/practice/reset`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
    });
    if (!response.ok) {
      throw new Error('Failed to reset practice');
    }
    return response.json();
  }

  // User Settings endpoints
  async getUserSettings(): Promise<UserSettings> {
    const response = await fetch(`${API_BASE}/user/settings`, {
      headers: this.getAuthHeaders(),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to fetch user settings');
    }
    return response.json();
  }

  async updateUserSettings(data: UpdateUserSettingsRequest): Promise<UserSettings> {
    const response = await fetch(`${API_BASE}/user/settings`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to update user settings');
    }
    return response.json();
  }
}

export const apiService = new ApiService(); 