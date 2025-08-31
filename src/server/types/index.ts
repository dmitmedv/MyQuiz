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
  translation_language: string; // Language of the translation (english, serbian, russian)
  learned: boolean;
  mastered: boolean; // Permanently mastered words that persist through progress resets
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
  user: Omit<User, 'password_hash'>;
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
  mastered?: boolean; // Permanently mastered words that persist through progress resets
  synonyms?: string[]; // Additional synonyms/alternative translations
}

export interface Synonym {
  id: number;
  vocabulary_id: number;
  synonym: string;
  created_at: string;
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

// Represents a word with its correctness status for highlighting
export interface WordDifference {
  word: string;           // Original word from user input
  isCorrect: boolean;     // Whether this word is correct
  correctWord?: string;   // What the correct word should be (if different)
  position: number;       // Position in the user's answer
}

export interface PracticeResult {
  correct: boolean;
  expectedTranslation: string;
  userTranslation: string;
  originalAnswer?: string; // The original answer with diacriticals (only included if different from expectedTranslation)
  synonyms?: string[]; // All possible synonyms/alternative translations (only included when answer is incorrect)
  wordDifferences?: WordDifference[]; // Word-level differences for highlighting incorrect words
}

export interface PracticeStats {
  total: number;
  learned: number;
  mastered: number; // Permanently mastered words
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
  skip_button_enabled: boolean; // Whether the skip button is enabled in practice mode
  auto_insert_enabled: boolean; // Whether the auto-insert correct answer button is enabled in practice mode
  help_button_enabled: boolean; // Whether the help button is enabled in practice mode
  created_at: string;
  updated_at: string;
}

export interface UpdateUserSettingsRequest {
  selected_languages: string[];
  skip_button_enabled?: boolean; // Optional field for updating skip button setting
  auto_insert_enabled?: boolean; // Optional field for updating auto-insert setting
  help_button_enabled?: boolean; // Optional field for updating help button setting
} 