export interface User {
  id: number;
  username: string;
  email: string;
  password_hash: string;
  created_at: string;
  updated_at: string;
}

export interface VocabularyItem {
  id: number;
  word: string;
  translation: string;
  language: string; // Language of the word/phrase (serbian, russian, english)
  learned: boolean;
  correct_attempts: number; // Number of correct practice attempts
  wrong_attempts: number; // Number of wrong practice attempts
  user_id: number; // Foreign key to users table
  created_at: string;
  updated_at: string;
}

export interface CreateUserRequest {
  username: string;
  email: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: Omit<User, 'password_hash'>;
  token: string;
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

export interface PracticeStats {
  total: number;
  learned: number;
  unlearned: number;
  progress: number;
  total_correct_attempts: number; // Total correct attempts across all words
  total_wrong_attempts: number; // Total wrong attempts across all words
} 