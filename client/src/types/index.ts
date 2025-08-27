export interface User {
  id: number;
  username: string;
  email: string;
  created_at: string;
  updated_at: string;
}

export interface VocabularyItem {
  id: number;
  word: string;
  translation: string;
  language: string; // Language of the word/phrase (serbian, russian, english)
  translation_language: string; // Language of the translation (english, serbian, russian)
  learned: boolean;
  correct_attempts: number; // Number of correct practice attempts
  wrong_attempts: number; // Number of wrong practice attempts
  user_id: number; // Foreign key to users table
  created_at: string;
  updated_at: string;
  synonyms?: string[]; // Additional synonyms/alternative translations
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
  user: User;
  token: string;
}

export interface CreateVocabularyRequest {
  word: string;
  translation: string;
  language: string; // Language of the word/phrase
  translation_language: string; // Language of the translation
  synonyms?: string[]; // Additional synonyms/alternative translations
}

export interface UpdateVocabularyRequest {
  word?: string;
  translation?: string;
  language?: string; // Language of the word/phrase
  translation_language?: string; // Language of the translation
  learned?: boolean;
  synonyms?: string[]; // Additional synonyms/alternative translations
}

// Practice mode types
export type PracticeMode = 'word-translation' | 'translation-word';

export interface PracticeSession {
  id: number;
  word: string;
  translation: string;
  language: string; // Language of the word/phrase
  translation_language: string; // Language of the translation
  mode: PracticeMode;
  synonyms?: string[]; // Additional synonyms/alternative translations
}

export interface PracticeResult {
  correct: boolean;
  expectedTranslation: string;
  userTranslation: string;
  originalAnswer?: string; // The original answer with diacriticals (only included if different from expectedTranslation)
  synonyms?: string[]; // All possible synonyms/alternative translations (only included when answer is incorrect)
}

export interface PracticeStats {
  total: number;
  learned: number;
  unlearned: number;
  progress: number;
  total_correct_attempts: number; // Total correct attempts across all words
  total_wrong_attempts: number; // Total wrong attempts across all words
}

export interface Language {
  value: string;
  flag: string;
  name: string;
}

export interface UserSettings {
  id: number;
  user_id: number;
  selected_languages: string[]; // Array of language codes (e.g., ['english', 'spanish'])
  created_at: string;
  updated_at: string;
}

export interface UpdateUserSettingsRequest {
  selected_languages: string[];
} 