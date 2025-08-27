import React, { useState, useEffect, useRef, useCallback } from 'react';
import { PracticeSession, PracticeResult, PracticeMode } from '../types';
import { apiService } from '../services/api';
import { getLanguageFlag } from '../utils/flags';

const Practice: React.FC = () => {
  const [currentWord, setCurrentWord] = useState<PracticeSession | null>(null);
  const [userAnswer, setUserAnswer] = useState('');
  const [result, setResult] = useState<PracticeResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const [practiceMode, setPracticeMode] = useState<PracticeMode>('word-translation');
  
  // Ref for the input field to programmatically focus it
  const inputRef = useRef<HTMLInputElement>(null);


  const loadNewWord = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setIsCompleted(false);
      setResult(null);
      setUserAnswer('');
      
      const word = await apiService.getPracticeWord(practiceMode);
      setCurrentWord(word);
    } catch (err: any) {
      if (err.message.includes('No unlearned words available for practice')) {
        setIsCompleted(true);
        setError(null);
      } else {
        setError('Failed to load practice word');
        setIsCompleted(false);
      }
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [practiceMode]);

  const handleCheckAnswer = useCallback(async () => {
    if (!currentWord || !userAnswer.trim()) return;

    try {
      setLoading(true);
      const result = await apiService.checkAnswer(currentWord.id, userAnswer, practiceMode);
      setResult(result);
    } catch (err) {
      setError('Failed to check answer');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [currentWord, userAnswer, practiceMode]);

  const handleNextWord = useCallback(() => {
    loadNewWord();
  }, [loadNewWord]);

  // Legacy key handler for input field - now handled globally
  const handleKeyPress = (e: React.KeyboardEvent) => {
    // This is now handled by the global key listener, but keeping for input-specific behavior if needed
    if (e.key === 'Enter' && !loading && !result && userAnswer.trim()) {
      handleCheckAnswer();
    }
  };

  // Add global key event listener for Enter key
  useEffect(() => {
    const handleGlobalKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && !loading) {
        // If no result is shown, check the answer (only if there's an answer)
        if (!result && userAnswer.trim()) {
          handleCheckAnswer();
        } 
        // If result is shown, move to next word
        else if (result) {
          handleNextWord();
        }
      }
    };

    // Add event listener
    document.addEventListener('keydown', handleGlobalKeyPress);

    // Cleanup event listener on component unmount
    return () => {
      document.removeEventListener('keydown', handleGlobalKeyPress);
    };
  }, [loading, result, userAnswer, handleCheckAnswer, handleNextWord]); // Dependencies ensure the handler has access to current state

  // Initial load effect
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    loadNewWord();
  }, []); // Only run once on mount

  // Load new word when practice mode changes
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    // Reset current word and load new one when practice mode changes
    setCurrentWord(null);
    setResult(null);
    setUserAnswer('');
    loadNewWord();
  }, [practiceMode]); // Only depend on practiceMode

  // Focus the input field whenever a new word is loaded and no result is showing
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (currentWord && !result && !loading && inputRef.current) {
      // Small delay to ensure the input is rendered
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [currentWord, result, loading]);

  // Auto-switch to next word after 1 second when answer is correct
  useEffect(() => {
    if (result?.correct) {
      // Automatically move to next word after 1 second for correct answers
      const timer = setTimeout(() => {
        handleNextWord();
      }, 500);
      
      // Cleanup timer if component unmounts or result changes
      return () => clearTimeout(timer);
    }
  }, [result, handleNextWord]);

  const handleReset = useCallback(async () => {
    if (!window.confirm('Are you sure you want to reset all progress? This will mark all words as unlearned.')) {
      return;
    }

    try {
      await apiService.resetPractice();
      setIsCompleted(false);
      loadNewWord();
    } catch (err) {
      setError('Failed to reset practice');
      setIsCompleted(false);
      console.error(err);
    }
  }, [loadNewWord]);

  // Helper function to get the displayed text based on practice mode
  const getDisplayText = () => {
    if (!currentWord) return '';
    return practiceMode === 'word-translation' ? currentWord.word : currentWord.translation;
  };

  // Helper function to get the language of the displayed text based on practice mode
  const getDisplayLanguage = () => {
    if (!currentWord) return 'serbian'; // default fallback
    return practiceMode === 'word-translation' ? currentWord.language : currentWord.translation_language;
  };



  if (loading && !currentWord) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
      </div>

      {/* Completion State */}
      {isCompleted && (
        <div className="card mb-6">
          <div className="text-center">
            <div className="text-gray-400 text-6xl mb-4">🎉</div>
            <h3 className="text-xl font-medium text-gray-900 mb-2">Great job!</h3>
            <p className="text-gray-600 mb-4">Congratulations! You have learned all your vocabulary words.</p>
            <button onClick={handleReset} className="btn-primary">
              Reset Progress
            </button>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && !isCompleted && (
        <div className="card mb-6">
          <div className="text-center">
            <div className="text-gray-400 text-6xl mb-4">⚠️</div>
            <h3 className="text-xl font-medium text-gray-900 mb-2">Oops!</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <button onClick={loadNewWord} className="btn-primary">
              Try Again
            </button>
          </div>
        </div>
      )}

      {currentWord && !error && !isCompleted && (
        <div className="card">
          <div className="text-center mb-6">
            <div className="text-4xl font-bold text-primary-600 mb-4">
              {/* Display flag for the language of the word/phrase being shown */}
              <span className="mr-2">{getLanguageFlag(getDisplayLanguage())}</span>
              {getDisplayText()}
            </div>
          </div>

          {!result ? (
            <div className="space-y-4">
              <input
                ref={inputRef}
                type="text"
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value)}
                onKeyPress={handleKeyPress}
                className="input text-center text-lg"
                placeholder="Enter your translation..."
                disabled={loading}
                autoFocus
              />
              <button
                onClick={handleCheckAnswer}
                disabled={loading || !userAnswer.trim()}
                className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Checking...
                  </div>
                ) : (
                  'Check Answer'
                )}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className={`p-4 rounded-lg text-center ${
                result.correct 
                  ? 'bg-success-50 border border-success-200' 
                  : 'bg-error-50 border border-error-200'
              }`}>
                <div className="text-4xl mb-2">
                  {result.correct ? '✅' : '❌'}
                </div>
                <h4 className={`text-lg font-semibold mb-2 ${
                  result.correct ? 'text-success-800' : 'text-error-800'
                }`}>
                  {result.correct ? 'Correct!' : 'Incorrect'}
                </h4>
                <p className="text-gray-600 mb-2">
                  Your answer: <span className="font-medium">{result.userTranslation}</span>
                </p>
                {!result.correct && (
                  <div className="space-y-1">
                    <p className="text-gray-600">
                      Correct answer: <span className="font-medium text-success-700">{result.expectedTranslation}</span>
                    </p>
                    {/* Display all synonyms/alternative answers when available */}
                    {result.synonyms && result.synonyms.length > 0 && (
                      <p className="text-gray-600 text-sm">
                        Other correct answers: <span className="font-medium text-success-600">
                          {result.synonyms.join(', ')}
                        </span>
                      </p>
                    )}
                  </div>
                )}
                {result.correct && result.originalAnswer && (
                  <p className="text-gray-600">
                    Original: <span className="font-medium text-primary-700">{result.originalAnswer}</span>
                  </p>
                )}
              </div>
              
              <button
                onClick={handleNextWord}
                className="btn-primary w-full"
              >
                Next Word
              </button>
            </div>
          )}
        </div>
      )}

      {/* Mode Selection - Moved below and made smaller */}
      <div className="card mt-6 p-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-gray-900">Practice Mode</h3>
          <div className="flex items-center space-x-2">
            <span className={`text-xs ${practiceMode === 'word-translation' ? 'text-primary-600 font-medium' : 'text-gray-500'}`}>
              Word → Translation
            </span>
            <button
              onClick={() => setPracticeMode(practiceMode === 'word-translation' ? 'translation-word' : 'word-translation')}
              disabled={loading}
              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
                practiceMode === 'translation-word' ? 'bg-primary-600' : 'bg-gray-200'
              } ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <span
                className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                  practiceMode === 'translation-word' ? 'translate-x-5' : 'translate-x-1'
                }`}
              />
            </button>
            <span className={`text-xs ${practiceMode === 'translation-word' ? 'text-primary-600 font-medium' : 'text-gray-500'}`}>
              Translation → Word
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Practice; 