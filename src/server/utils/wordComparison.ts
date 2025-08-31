/**
 * Utility functions for comparing user answers with correct answers
 * and identifying word-level differences for highlighting
 */

/**
 * Normalizes text for comparison by removing diacritical marks,
 * converting to lowercase, and trimming whitespace
 */
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritical marks
    .trim();
}

/**
 * Splits text into words, handling multiple spaces and punctuation
 */
function splitIntoWords(text: string): string[] {
  return text
    .trim()
    .split(/\s+/) // Split on one or more whitespace characters
    .filter(word => word.length > 0); // Remove empty strings
}

/**
 * Represents a word with its correctness status
 */
export interface WordDifference {
  word: string;           // Original word from user input
  isCorrect: boolean;     // Whether this word is correct
  correctWord?: string;   // What the correct word should be (if different)
  position: number;       // Position in the user's answer
}

/**
 * Compares user answer with the correct answer and identifies word-level differences
 * @param userAnswer - The user's input answer
 * @param correctAnswer - The expected correct answer
 * @returns Array of WordDifference objects showing which words are correct/incorrect
 */
export function compareAnswers(userAnswer: string, correctAnswer: string): WordDifference[] {
  const userWords = splitIntoWords(userAnswer);
  const correctWords = splitIntoWords(correctAnswer);
  const result: WordDifference[] = [];

  // Compare word by word
  const maxLength = Math.max(userWords.length, correctWords.length);
  
  for (let i = 0; i < maxLength; i++) {
    const userWord = userWords[i] || '';
    const correctWord = correctWords[i] || '';
    
    if (userWord) {
      // Check if this user word matches the expected word at this position
      const isCorrect = normalizeText(userWord) === normalizeText(correctWord);
      
      result.push({
        word: userWord,
        isCorrect: isCorrect,
        correctWord: isCorrect ? undefined : correctWord,
        position: i
      });
    }
  }

  return result;
}

/**
 * Checks if two answers are equivalent (for overall correctness)
 * @param userAnswer - The user's input answer
 * @param correctAnswer - The expected correct answer
 * @returns boolean indicating if answers are equivalent
 */
export function areAnswersEquivalent(userAnswer: string, correctAnswer: string): boolean {
  return normalizeText(userAnswer) === normalizeText(correctAnswer);
}

/**
 * Compares user answer against multiple possible correct answers
 * and returns the best match with word differences
 * @param userAnswer - The user's input answer
 * @param possibleAnswers - Array of possible correct answers
 * @returns Object with the best matching answer and word differences
 */
export function compareWithMultipleAnswers(
  userAnswer: string, 
  possibleAnswers: string[]
): {
  isCorrect: boolean;
  bestMatch: string;
  wordDifferences: WordDifference[];
  matchedAnswer?: string;
} {
  // First check if user answer exactly matches any possible answer
  for (const answer of possibleAnswers) {
    if (areAnswersEquivalent(userAnswer, answer)) {
      return {
        isCorrect: true,
        bestMatch: answer,
        wordDifferences: [],
        matchedAnswer: answer
      };
    }
  }

  // If no exact match, find the closest match for showing differences
  let bestMatch = possibleAnswers[0] || '';
  let minDifferences = Infinity;
  let bestWordDifferences: WordDifference[] = [];

  for (const answer of possibleAnswers) {
    const differences = compareAnswers(userAnswer, answer);
    const incorrectCount = differences.filter(d => !d.isCorrect).length;
    
    if (incorrectCount < minDifferences) {
      minDifferences = incorrectCount;
      bestMatch = answer;
      bestWordDifferences = differences;
    }
  }

  return {
    isCorrect: false,
    bestMatch,
    wordDifferences: bestWordDifferences
  };
}
