import React, { useState, useEffect, useRef } from 'react';
import { PracticeSession, PracticeResult, PracticeMode } from '../types';
import { apiService } from '../services/api';

const Practice: React.FC = () => {
  const [currentWord, setCurrentWord] = useState<PracticeSession | null>(null);
  const [userAnswer, setUserAnswer] = useState('');
  const [result, setResult] = useState<PracticeResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const [stats, setStats] = useState({ total: 0, unlearned: 0, learned: 0, progress: 0 });
  const [practiceMode, setPracticeMode] = useState<PracticeMode>('word-translation');
  
  // Ref for the input field to programmatically focus it
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadStats();
    loadNewWord();
  }, []);

  // Load new word when practice mode changes
  useEffect(() => {
    if (currentWord) {
      loadNewWord();
    }
  }, [practiceMode]);

  // Focus the input field whenever a new word is loaded and no result is showing
  useEffect(() => {
    if (currentWord && !result && !loading && inputRef.current) {
      // Small delay to ensure the input is rendered
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [currentWord, result, loading]);

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
  }, [loading, result, userAnswer]); // Dependencies ensure the handler has access to current state

  const loadStats = async () => {
    try {
      const data = await apiService.getPracticeStats();
      setStats(data);
    } catch (err) {
      console.error('Failed to load stats:', err);
    }
  };

  const loadNewWord = async () => {
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
  };

  const handleCheckAnswer = async () => {
    if (!currentWord || !userAnswer.trim()) return;

    try {
      setLoading(true);
      const result = await apiService.checkAnswer(currentWord.id, userAnswer, practiceMode);
      setResult(result);
      
      // Update stats after checking answer
      await loadStats();
    } catch (err) {
      setError('Failed to check answer');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleNextWord = () => {
    loadNewWord();
  };

  // Legacy key handler for input field - now handled globally
  const handleKeyPress = (e: React.KeyboardEvent) => {
    // This is now handled by the global key listener, but keeping for input-specific behavior if needed
    if (e.key === 'Enter' && !loading && !result && userAnswer.trim()) {
      handleCheckAnswer();
    }
  };

  const handleReset = async () => {
    if (!window.confirm('Are you sure you want to reset all progress? This will mark all words as unlearned.')) {
      return;
    }

    try {
      await apiService.resetPractice();
      await loadStats();
      setIsCompleted(false);
      loadNewWord();
    } catch (err) {
      setError('Failed to reset practice');
      setIsCompleted(false);
      console.error(err);
    }
  };

  // Helper function to get the displayed text based on practice mode
  const getDisplayText = () => {
    if (!currentWord) return '';
    return practiceMode === 'word-translation' ? currentWord.word : currentWord.translation;
  };

  // Helper function to get the instruction text based on practice mode
  const getInstructionText = () => {
    return practiceMode === 'word-translation' 
      ? 'Translate this word:' 
      : 'What is the foreign word for:';
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
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Practice Mode</h2>
        <p className="text-gray-600">Choose your practice mode and test your knowledge.</p>
      </div>

      {/* Mode Selection */}
      <div className="card mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Practice Mode</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={() => setPracticeMode('word-translation')}
            disabled={loading}
            className={`p-4 rounded-lg border-2 transition-all duration-200 ${
              practiceMode === 'word-translation'
                ? 'border-primary-500 bg-primary-50 text-primary-700'
                : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
            } ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            <div className="text-left">
              <div className="font-semibold mb-1">Word → Translation</div>
              <div className="text-sm opacity-75">Translate from foreign word to your language</div>
            </div>
          </button>
          
          <button
            onClick={() => setPracticeMode('translation-word')}
            disabled={loading}
            className={`p-4 rounded-lg border-2 transition-all duration-200 ${
              practiceMode === 'translation-word'
                ? 'border-primary-500 bg-primary-50 text-primary-700'
                : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
            } ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            <div className="text-left">
              <div className="font-semibold mb-1">Translation → Word</div>
              <div className="text-sm opacity-75">Translate from your language to foreign word</div>
            </div>
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="card mb-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-primary-600">{stats.total}</div>
            <div className="text-sm text-gray-500">Total Words</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-success-600">{stats.learned}</div>
            <div className="text-sm text-gray-500">Learned</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-600">{stats.unlearned}</div>
            <div className="text-sm text-gray-500">To Learn</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-blue-600">{stats.progress}%</div>
            <div className="text-sm text-gray-500">Progress</div>
          </div>
        </div>
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
            <h3 className="text-2xl font-bold text-gray-900 mb-2">{getInstructionText()}</h3>
            <div className="text-4xl font-bold text-primary-600 mb-4">
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
                  <p className="text-gray-600">
                    Correct answer: <span className="font-medium text-success-700">{result.expectedTranslation}</span>
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

      <div className="mt-6 text-center">
        <button
          onClick={handleReset}
          className="text-sm text-gray-500 hover:text-gray-700 underline"
        >
          Reset all progress
        </button>
      </div>
    </div>
  );
};

export default Practice; 