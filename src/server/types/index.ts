export interface VocabularyItem {
  id: number;
  word: string;
  translation: string;
  language: string; // Language of the word/phrase (serbian, russian, english)
  learned: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateVocabularyRequest {
  word: string;
  translation: string;
  language: string; // Language of the word/phrase
}

export interface UpdateVocabularyRequest {
  word?: string;
  translation?: string;
  language?: string; // Language of the word/phrase
  learned?: boolean;
}

// Practice mode types
export type PracticeMode = 'word-translation' | 'translation-word';

export interface PracticeSession {
  id: number;
  word: string;
  translation: string;
  language: string; // Language of the word/phrase
  mode: PracticeMode;
}

export interface PracticeResult {
  correct: boolean;
  expectedTranslation: string;
  userTranslation: string;
  originalAnswer?: string; // The original answer with diacriticals (only included if different from expectedTranslation)
} 