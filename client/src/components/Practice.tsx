import React, { useState, useEffect } from 'react';
import { PracticeSession, PracticeResult } from '../types';
import { apiService } from '../services/api';

const Practice: React.FC = () => {
  const [currentWord, setCurrentWord] = useState<PracticeSession | null>(null);
  const [userAnswer, setUserAnswer] = useState('');
  const [result, setResult] = useState<PracticeResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const [stats, setStats] = useState({ total: 0, unlearned: 0, learned: 0, progress: 0 });

  useEffect(() => {
    loadStats();
    loadNewWord();
  }, []);

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
      
      const word = await apiService.getPracticeWord();
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
      const result = await apiService.checkAnswer(currentWord.id, userAnswer);
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

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !loading && !result) {
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
        <p className="text-gray-600">Translate the foreign word to test your knowledge.</p>
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
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Translate this word:</h3>
            <div className="text-4xl font-bold text-primary-600 mb-4">
              {currentWord.word}
            </div>
          </div>

          {!result ? (
            <div className="space-y-4">
              <input
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