import React, { useState, useEffect } from 'react';
import { VocabularyItem, PracticeStats } from '../types';
import { apiService } from '../services/api';
import { getLanguageFlag, getLanguageName } from '../utils/flags';

const VocabularyList: React.FC = () => {
  const [vocabulary, setVocabulary] = useState<VocabularyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({ word: '', translation: '', language: 'serbian' });
  const [editSynonyms, setEditSynonyms] = useState<string[]>([]);
  const [currentEditSynonym, setCurrentEditSynonym] = useState('');
  const [stats, setStats] = useState<PracticeStats>({ 
    total: 0, 
    unlearned: 0, 
    learned: 0, 
    progress: 0, 
    total_correct_attempts: 0, 
    total_wrong_attempts: 0 
  });

  // Available languages for editing
  const languages = [
    { value: 'serbian', flag: '🇷🇸', name: 'Serbian' },
    { value: 'russian', flag: '🇷🇺', name: 'Russian' },
    { value: 'english', flag: '🇬🇧', name: 'English' }
  ];

  // Handle adding a new synonym during editing
  const handleAddEditSynonym = () => {
    const trimmedSynonym = currentEditSynonym.trim();
    if (trimmedSynonym && !editSynonyms.includes(trimmedSynonym) && trimmedSynonym !== editForm.translation.trim()) {
      setEditSynonyms(prev => [...prev, trimmedSynonym]);
      setCurrentEditSynonym('');
    }
  };

  // Handle removing a synonym during editing
  const handleRemoveEditSynonym = (index: number) => {
    setEditSynonyms(prev => prev.filter((_, i) => i !== index));
  };

  // Handle key press in synonym input during editing
  const handleEditSynonymKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddEditSynonym();
    }
  };

  useEffect(() => {
    loadVocabulary();
    loadStats();
  }, []);

  const loadVocabulary = async () => {
    try {
      setLoading(true);
      const data = await apiService.getVocabulary();
      setVocabulary(data);
      setError(null);
    } catch (err) {
      setError('Failed to load vocabulary');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const data = await apiService.getPracticeStats();
      setStats(data);
    } catch (err) {
      console.error('Failed to load stats:', err);
    }
  };

  // Function to export vocabulary data to a JSON file
  const handleExportVocabulary = () => {
    try {
      // Create export data with timestamp and metadata
      const exportData = {
        exportDate: new Date().toISOString(),
        totalWords: vocabulary.length,
        vocabulary: vocabulary.map(item => ({
          word: item.word,
          translation: item.translation,
          language: item.language,
          translation_language: item.translation_language,
          synonyms: item.synonyms || [],
          learned: item.learned,
          correct_attempts: item.correct_attempts,
          wrong_attempts: item.wrong_attempts
        }))
      };

      // Create blob and download link
      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json'
      });
      
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `vocabulary-backup-${new Date().toISOString().split('T')[0]}.json`;
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up URL object
      URL.revokeObjectURL(url);
      
      // Show success message (optional)
      setError(null);
    } catch (err) {
      setError('Failed to export vocabulary data');
      console.error('Export error:', err);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this word?')) {
      return;
    }

    try {
      await apiService.deleteVocabularyItem(id);
      setVocabulary(vocabulary.filter(item => item.id !== id));
      // Refresh stats after deleting an item
      await loadStats();
    } catch (err) {
      setError('Failed to delete vocabulary item');
      console.error(err);
    }
  };

  const handleEdit = (item: VocabularyItem) => {
    setEditingId(item.id);
    setEditForm({ word: item.word, translation: item.translation, language: item.language });
    // Load existing synonyms for editing
    setEditSynonyms(item.synonyms || []);
    setCurrentEditSynonym('');
  };

  const handleSaveEdit = async () => {
    if (!editingId) return;

    try {
      const updatedItem = await apiService.updateVocabularyItem(editingId, {
        ...editForm,
        synonyms: editSynonyms.length > 0 ? editSynonyms : undefined // Include synonyms in update
      });
      setVocabulary(vocabulary.map(item => 
        item.id === editingId ? updatedItem : item
      ));
      setEditingId(null);
      setEditForm({ word: '', translation: '', language: 'serbian' });
      setEditSynonyms([]);
      setCurrentEditSynonym('');
      // Refresh stats after editing an item
      await loadStats();
    } catch (err) {
      setError('Failed to update vocabulary item');
      console.error(err);
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditForm({ word: '', translation: '', language: 'serbian' });
    setEditSynonyms([]);
    setCurrentEditSynonym('');
  };

  const handleResetAttempts = async (item: VocabularyItem) => {
    if (!window.confirm(`Reset attempt counts for "${item.word}"? This will set both correct and wrong attempts to 0.`)) {
      return;
    }

    try {
      const result = await apiService.resetAttempts(item.id);
      // Update the vocabulary item with reset attempt counts
      setVocabulary(vocabulary.map(v => 
        v.id === item.id ? result.item : v
      ));
      // Refresh stats after resetting attempts
      await loadStats();
      setError(null);
    } catch (err) {
      setError('Failed to reset attempt counts');
      console.error(err);
    }
  };

  const toggleLearned = async (item: VocabularyItem) => {
    try {
      const updatedItem = await apiService.updateVocabularyItem(item.id, {
        learned: !item.learned
      });
      setVocabulary(vocabulary.map(v => 
        v.id === item.id ? updatedItem : v
      ));
      // Refresh stats after toggling learned status
      await loadStats();
    } catch (err) {
      setError('Failed to update vocabulary item');
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-gray-900">Vocabulary List</h2>
        <div className="flex items-center space-x-4">
          {/* Export button */}
          <button
            onClick={handleExportVocabulary}
            className="btn-primary px-4 py-2 text-sm flex items-center space-x-2"
            title="Export all vocabulary to JSON file"
          >
            <span>💾</span>
            <span>Save Backup</span>
          </button>
          <div className="text-sm text-gray-500">
            {vocabulary.length} words total
          </div>
        </div>
      </div>

      {/* Statistics Panel */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Learning Progress</h3>
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 text-center">
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
          <div>
            <div className="text-2xl font-bold text-success-600">{stats.total_correct_attempts || 0}</div>
            <div className="text-sm text-gray-500">Total Correct</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-error-600">{stats.total_wrong_attempts || 0}</div>
            <div className="text-sm text-gray-500">Total Wrong</div>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-error-50 border border-error-200 text-error-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {vocabulary.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">📚</div>
          <h3 className="text-xl font-medium text-gray-900 mb-2">No vocabulary yet</h3>
          <p className="text-gray-500 mb-4">Start by adding some words to your vocabulary list.</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          {/* Proper HTML table */}
          <table className="w-full">
            {/* Table header */}
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Word</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Translation</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Language</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Status</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Attempts</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Actions</th>
              </tr>
            </thead>
            
            {/* Table body */}
            <tbody className="divide-y divide-gray-100">
              {vocabulary.map((item, index) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  {editingId === item.id ? (
                    // Edit mode - full width form spanning all columns
                    <td colSpan={6} className="px-4 py-3">
                      <div className="space-y-4">
                        <div className="grid grid-cols-3 gap-4">
                          <input
                            type="text"
                            value={editForm.word}
                            onChange={(e) => setEditForm({ ...editForm, word: e.target.value })}
                            className="input"
                            placeholder="Foreign word"
                          />
                          <input
                            type="text"
                            value={editForm.translation}
                            onChange={(e) => setEditForm({ ...editForm, translation: e.target.value })}
                            className="input"
                            placeholder="Translation"
                          />
                          <select
                            value={editForm.language}
                            onChange={(e) => setEditForm({ ...editForm, language: e.target.value })}
                            className="input"
                          >
                            {languages.map(lang => (
                              <option key={lang.value} value={lang.value}>
                                {lang.flag} {lang.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Synonyms Section */}
                        <div className="border-t border-gray-200 pt-3">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Alternative Translations (Synonyms)
                            <span className="text-xs text-gray-500 ml-2">(Optional)</span>
                          </label>
                          
                          {/* Add Synonym Input */}
                          <div className="flex space-x-2 mb-3">
                            <input
                              type="text"
                              value={currentEditSynonym}
                              onChange={(e) => setCurrentEditSynonym(e.target.value)}
                              onKeyPress={handleEditSynonymKeyPress}
                              className="input flex-1"
                              placeholder="Enter alternative translation"
                            />
                            <button
                              type="button"
                              onClick={handleAddEditSynonym}
                              disabled={!currentEditSynonym.trim()}
                              className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed px-3 py-1 text-sm"
                            >
                              Add
                            </button>
                          </div>

                          {/* Display Current Synonyms */}
                          {editSynonyms.length > 0 && (
                            <div className="mb-3">
                              <p className="text-xs text-gray-600 mb-2">
                                Alternative translations ({editSynonyms.length}):
                              </p>
                              <div className="flex flex-wrap gap-2">
                                {editSynonyms.map((synonym, index) => (
                                  <div
                                    key={index}
                                    className="bg-blue-50 border border-blue-200 text-blue-800 px-2 py-1 rounded-full text-sm flex items-center space-x-1"
                                  >
                                    <span>{synonym}</span>
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveEditSynonym(index)}
                                      className="text-blue-600 hover:text-blue-800 ml-1"
                                      title="Remove synonym"
                                    >
                                      ×
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {editSynonyms.length === 0 && (
                            <p className="text-xs text-gray-500 italic mb-3">
                              Add alternative translations that should also be accepted as correct answers.
                            </p>
                          )}
                        </div>

                        <div className="flex space-x-2 justify-end border-t border-gray-200 pt-3">
                          <button onClick={handleSaveEdit} className="btn-success px-4 py-2 text-sm">
                            Save Changes
                          </button>
                          <button onClick={handleCancelEdit} className="btn-secondary px-4 py-2 text-sm">
                            Cancel
                          </button>
                        </div>
                      </div>
                    </td>
                  ) : (
                    // Display mode - proper table cells
                    <>
                      <td className="px-4 py-3">
                        <span className="font-medium text-gray-900">{item.word}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <span className="text-gray-600">{item.translation}</span>
                          {(() => {
                            // Filter out synonyms that are the same as the main translation
                            const uniqueSynonyms = item.synonyms?.filter(
                              synonym => synonym.trim().toLowerCase() !== item.translation.trim().toLowerCase()
                            ) || [];
                            
                            // Only render if there are unique synonyms to show
                            return uniqueSynonyms.length > 0 && (
                              <div className="mt-1 flex flex-wrap gap-1">
                                {uniqueSynonyms.map((synonym, synonymIndex) => (
                                  <span
                                    key={synonymIndex}
                                    className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-blue-50 text-blue-700 border border-blue-200"
                                  >
                                    {synonym}
                                  </span>
                                ))}
                              </div>
                            );
                          })()}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center text-sm text-gray-600">
                          <span className="mr-1">{getLanguageFlag(item.language)}</span>
                          {getLanguageName(item.language)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => toggleLearned(item)}
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            item.learned
                              ? 'bg-success-100 text-success-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {item.learned ? 'Learned' : 'Learning'}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm text-gray-600">
                          <div className="flex flex-col space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="text-success-600 font-medium">✓ {item.correct_attempts || 0}</span>
                              <span className="text-error-600 font-medium">✗ {item.wrong_attempts || 0}</span>
                            </div>
                            {((item.correct_attempts || 0) + (item.wrong_attempts || 0)) > 0 && (
                              <div className="text-xs text-gray-500">
                                {item.correct_attempts && item.wrong_attempts 
                                  ? `${Math.round((item.correct_attempts / (item.correct_attempts + item.wrong_attempts)) * 100)}% success`
                                  : item.correct_attempts 
                                    ? '100% success' 
                                    : '0% success'
                                }
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex space-x-1">
                          <button
                            onClick={() => handleEdit(item)}
                            className="btn-secondary px-2 py-1 text-xs"
                            title="Edit word"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleResetAttempts(item)}
                            className="btn-warning px-2 py-1 text-xs"
                            title="Reset attempts"
                          >
                            Reset
                          </button>
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="btn-error px-2 py-1 text-xs"
                            title="Delete word"
                          >
                            Del
                          </button>
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
            
            {/* Table footer with summary */}
            {vocabulary.length > 0 && (
              <tfoot className="bg-gray-50 border-t border-gray-200">
                <tr>
                  <td colSpan={4} className="px-4 py-3 text-sm text-gray-600 font-medium">
                    Summary
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-sm text-gray-600">
                      <div className="flex flex-col space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-success-600 font-medium">
                            ✓ {vocabulary.reduce((sum, item) => sum + (item.correct_attempts || 0), 0)}
                          </span>
                          <span className="text-error-600 font-medium">
                            ✗ {vocabulary.reduce((sum, item) => sum + (item.wrong_attempts || 0), 0)}
                          </span>
                        </div>
                        <div className="text-xs text-gray-500">
                          Total attempts across all words
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3"></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      )}
    </div>
  );
};

export default VocabularyList; 