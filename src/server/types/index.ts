export interface VocabularyItem {
  id: number;
  word: string;
  translation: string;
  learned: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateVocabularyRequest {
  word: string;
  translation: string;
}

export interface UpdateVocabularyRequest {
  word?: string;
  translation?: string;
  learned?: boolean;
}

export interface PracticeSession {
  id: number;
  word: string;
  translation: string;
}

export interface PracticeResult {
  correct: boolean;
  expectedTranslation: string;
  userTranslation: string;
} 