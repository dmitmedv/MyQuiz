import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../services/api';

const AddVocabulary: React.FC = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ word: '', translation: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!form.word.trim() || !form.translation.trim()) {
      setError('Both word and translation are required');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await apiService.createVocabularyItem({
        word: form.word.trim(),
        translation: form.translation.trim()
      });
      
      // Reset form and redirect to vocabulary list
      setForm({ word: '', translation: '' });
      navigate('/');
    } catch (err) {
      setError('Failed to add vocabulary item');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (error) setError(null);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Add New Word</h2>
        <p className="text-gray-600">Add a new foreign word and its translation to your vocabulary list.</p>
      </div>

      <div className="card">
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-error-50 border border-error-200 text-error-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="word" className="block text-sm font-medium text-gray-700 mb-2">
              Foreign Word
            </label>
            <input
              type="text"
              id="word"
              name="word"
              value={form.word}
              onChange={handleInputChange}
              className="input"
              placeholder="Enter the foreign word or phrase"
              disabled={loading}
              autoFocus
            />
          </div>

          <div>
            <label htmlFor="translation" className="block text-sm font-medium text-gray-700 mb-2">
              Translation
            </label>
            <input
              type="text"
              id="translation"
              name="translation"
              value={form.translation}
              onChange={handleInputChange}
              className="input"
              placeholder="Enter the translation"
              disabled={loading}
            />
          </div>

          <div className="flex space-x-4 pt-4">
            <button
              type="submit"
              disabled={loading || !form.word.trim() || !form.translation.trim()}
              className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Adding...
                </div>
              ) : (
                'Add Word'
              )}
            </button>
            
            <button
              type="button"
              onClick={() => navigate('/')}
              className="btn-secondary flex-1"
              disabled={loading}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>

      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-sm font-medium text-blue-900 mb-2">💡 Tips</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• You can add single words or entire phrases</li>
          <li>• Be consistent with your translations</li>
          <li>• Add words you encounter in your daily learning</li>
          <li>• Practice regularly to mark words as learned</li>
        </ul>
      </div>
    </div>
  );
};

export default AddVocabulary; 