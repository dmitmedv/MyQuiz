import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../services/api';


const AddVocabulary: React.FC = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ word: '', translation: '', language: 'serbian', translation_language: 'english' });
  const [synonyms, setSynonyms] = useState<string[]>([]);
  const [currentSynonym, setCurrentSynonym] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [duplicateDetails, setDuplicateDetails] = useState<string | null>(null);
  const [existingWord, setExistingWord] = useState<{ word: string; translation: string } | null>(null);

  // Available languages with their flags
  const languages = [
    { value: 'serbian', flag: '🇷🇸', name: 'Serbian' },
    { value: 'russian', flag: '🇷🇺', name: 'Russian' },
    { value: 'english', flag: '🇬🇧', name: 'English' }
  ];

  // Handle adding a new synonym
  const handleAddSynonym = () => {
    const trimmedSynonym = currentSynonym.trim();
    if (trimmedSynonym && !synonyms.includes(trimmedSynonym) && trimmedSynonym !== form.translation.trim()) {
      setSynonyms(prev => [...prev, trimmedSynonym]);
      setCurrentSynonym('');
    }
  };

  // Handle removing a synonym
  const handleRemoveSynonym = (index: number) => {
    setSynonyms(prev => prev.filter((_, i) => i !== index));
  };

  // Handle key press in synonym input
  const handleSynonymKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddSynonym();
    }
  };

  // Check if word already exists in the selected language
  const checkExistingWord = async (word: string, language: string) => {
    if (!word.trim()) {
      setExistingWord(null);
      return;
    }

    try {
      const vocabulary = await apiService.getVocabulary();
      const existing = vocabulary.find(
        item => item.word.toLowerCase() === word.toLowerCase() && item.language === language
      );
      
      if (existing) {
        setExistingWord({ word: existing.word, translation: existing.translation });
      } else {
        setExistingWord(null);
      }
    } catch (err) {
      console.error('Error checking for existing word:', err);
      setExistingWord(null);
    }
  };

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
        translation: form.translation.trim(),
        language: form.language,
        translation_language: form.translation_language,
        synonyms: synonyms.length > 0 ? synonyms : undefined // Only include synonyms if there are any
      });
      
      // Reset form and redirect to vocabulary list
      setForm({ word: '', translation: '', language: 'serbian', translation_language: 'english' });
      setSynonyms([]);
      setCurrentSynonym('');
      setError(null);
      setDuplicateDetails(null);
      setExistingWord(null);
      navigate('/');
    } catch (err: any) {
      // Handle different types of errors with more specific messages
      if (err.message && err.message.includes('already exists')) {
        setError('This word already exists in your vocabulary list');
        setDuplicateDetails(err.details || null);
      } else if (err.message && err.message.includes('Word already exists')) {
        setError('This word already exists in your vocabulary list');
        setDuplicateDetails(err.details || null);
      } else {
        setError('Failed to add vocabulary item');
        setDuplicateDetails(null);
      }
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    // Clear error and duplicate details when user starts typing
    if (error) setError(null);
    if (duplicateDetails) setDuplicateDetails(null);
    if (existingWord) setExistingWord(null);
    
    // Check for existing word when word or language changes
    if (name === 'word' || name === 'language') {
      const wordToCheck = name === 'word' ? value : form.word;
      const languageToCheck = name === 'language' ? value : form.language;
      
      // Debounce the check to avoid too many API calls
      setTimeout(() => {
        checkExistingWord(wordToCheck, languageToCheck);
      }, 500);
    }
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
              <div className="font-medium">{error}</div>
              {duplicateDetails && (
                <div className="mt-2 text-sm text-error-600">
                  {duplicateDetails}
                </div>
              )}
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="language" className="block text-sm font-medium text-gray-700 mb-2">
                Word Language
              </label>
              <select
                id="language"
                name="language"
                value={form.language}
                onChange={handleInputChange}
                className="input"
                disabled={loading}
              >
                {languages.map(lang => (
                  <option key={lang.value} value={lang.value}>
                    {lang.flag} {lang.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label htmlFor="translation_language" className="block text-sm font-medium text-gray-700 mb-2">
                Translation Language
              </label>
              <select
                id="translation_language"
                name="translation_language"
                value={form.translation_language}
                onChange={handleInputChange}
                className="input"
                disabled={loading}
              >
                {languages.map(lang => (
                  <option key={lang.value} value={lang.value}>
                    {lang.flag} {lang.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

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
            {existingWord && (
              <div className="mt-2 bg-yellow-50 border border-yellow-200 text-yellow-700 px-3 py-2 rounded-md text-sm">
                ⚠️ This word already exists in {form.language} with translation: <strong>"{existingWord.translation}"</strong>
              </div>
            )}
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

          {/* Synonyms Section */}
          <div>
            <label htmlFor="synonyms" className="block text-sm font-medium text-gray-700 mb-2">
              Alternative Translations (Synonyms)
              <span className="text-xs text-gray-500 ml-2">(Optional)</span>
            </label>
            
            {/* Add Synonym Input */}
            <div className="flex space-x-2 mb-3">
              <input
                type="text"
                id="synonyms"
                value={currentSynonym}
                onChange={(e) => setCurrentSynonym(e.target.value)}
                onKeyPress={handleSynonymKeyPress}
                className="input flex-1"
                placeholder="Enter alternative translation"
                disabled={loading}
              />
              <button
                type="button"
                onClick={handleAddSynonym}
                disabled={loading || !currentSynonym.trim()}
                className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2 text-sm"
              >
                Add
              </button>
            </div>

            {/* Display Current Synonyms */}
            {synonyms.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs text-gray-600 mb-2">
                  Alternative translations ({synonyms.length}):
                </p>
                <div className="flex flex-wrap gap-2">
                  {synonyms.map((synonym, index) => (
                    <div
                      key={index}
                      className="bg-blue-50 border border-blue-200 text-blue-800 px-3 py-1 rounded-full text-sm flex items-center space-x-2"
                    >
                      <span>{synonym}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveSynonym(index)}
                        disabled={loading}
                        className="text-blue-600 hover:text-blue-800 disabled:opacity-50"
                        title="Remove synonym"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {synonyms.length === 0 && (
              <p className="text-xs text-gray-500 italic">
                Add alternative translations that should also be accepted as correct answers during practice.
              </p>
            )}
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
          <li>• Choose the language of the word and its translation</li>
          <li>• You can add single words or entire phrases</li>
          <li>• Add synonyms/alternative translations to improve practice accuracy</li>
          <li>• All synonyms will be accepted as correct answers during practice</li>
          <li>• Be consistent with your translations</li>
          <li>• Add words you encounter in your daily learning</li>
          <li>• Practice regularly to mark words as learned</li>
          <li>• Each word can only exist once per language</li>
        </ul>
      </div>
    </div>
  );
};

export default AddVocabulary; 