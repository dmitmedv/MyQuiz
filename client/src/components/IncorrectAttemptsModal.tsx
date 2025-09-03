import React, { useState, useEffect } from 'react';
import { IncorrectAttempt, VocabularyItem } from '../types';
import { apiService } from '../services/api';

interface IncorrectAttemptsModalProps {
  isOpen: boolean;
  onClose: () => void;
  vocabularyItem: VocabularyItem;
}

const IncorrectAttemptsModal: React.FC<IncorrectAttemptsModalProps> = ({
  isOpen,
  onClose,
  vocabularyItem
}) => {
  const [incorrectAttempts, setIncorrectAttempts] = useState<IncorrectAttempt[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load incorrect attempts when modal opens
  useEffect(() => {
    if (isOpen && vocabularyItem) {
      loadIncorrectAttempts();
    }
  }, [isOpen, vocabularyItem]);

  const loadIncorrectAttempts = async () => {
    try {
      setLoading(true);
      setError(null);
      const attempts = await apiService.getIncorrectAttempts(vocabularyItem.id);
      setIncorrectAttempts(attempts);
    } catch (err) {
      setError('Failed to load incorrect attempts');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get display mode text
  const getModeText = (mode: string) => {
    return mode === 'word-translation' ? 'Word → Translation' : 'Translation → Word';
  };

  // Close modal when clicking backdrop
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Close modal on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Incorrect Attempts
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              <span className="font-medium">{vocabularyItem.word}</span> → <span className="font-medium">{vocabularyItem.translation}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            title="Close modal"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {loading && (
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
          )}

          {error && (
            <div className="bg-error-50 border border-error-200 text-error-700 px-4 py-3 rounded-lg mb-4">
              {error}
            </div>
          )}

          {!loading && !error && (
            <>
              {incorrectAttempts.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-gray-400 text-6xl mb-4">🎯</div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No incorrect attempts yet</h3>
                  <p className="text-gray-500">
                    This word hasn't been answered incorrectly during practice.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="text-sm text-gray-600 mb-4">
                    Total incorrect attempts: <span className="font-medium text-error-600">{incorrectAttempts.length}</span>
                  </div>

                  {/* Attempts list */}
                  <div className="space-y-3">
                    {incorrectAttempts.map((attempt, index) => (
                      <div
                        key={attempt.id}
                        className="bg-gray-50 border border-gray-200 rounded-lg p-4"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex-1">
                            <div className="text-sm text-gray-500 mb-1">
                              {getModeText(attempt.practice_mode)} • {formatDate(attempt.attempted_at)}
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <span className="text-xs font-medium text-gray-700 uppercase tracking-wide">Your Answer</span>
                                <div className="bg-error-50 border border-error-200 text-error-800 px-3 py-2 rounded-md mt-1">
                                  {attempt.incorrect_answer || '(empty)'}
                                </div>
                              </div>
                              <div>
                                <span className="text-xs font-medium text-gray-700 uppercase tracking-wide">Correct Answer</span>
                                <div className="bg-success-50 border border-success-200 text-success-800 px-3 py-2 rounded-md mt-1">
                                  {attempt.expected_answer}
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="text-xs text-gray-500 ml-4 text-right">
                            #{incorrectAttempts.length - index}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="btn-secondary px-6 py-2"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default IncorrectAttemptsModal;
