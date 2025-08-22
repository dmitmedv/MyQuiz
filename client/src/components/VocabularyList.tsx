import React, { useState, useEffect } from 'react';
import { VocabularyItem, PracticeStats } from '../types';
import { apiService } from '../services/api';

const VocabularyList: React.FC = () => {
  const [vocabulary, setVocabulary] = useState<VocabularyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({ word: '', translation: '' });
  const [stats, setStats] = useState<PracticeStats>({ total: 0, unlearned: 0, learned: 0, progress: 0 });

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
    setEditForm({ word: item.word, translation: item.translation });
  };

  const handleSaveEdit = async () => {
    if (!editingId) return;

    try {
      const updatedItem = await apiService.updateVocabularyItem(editingId, editForm);
      setVocabulary(vocabulary.map(item => 
        item.id === editingId ? updatedItem : item
      ));
      setEditingId(null);
      setEditForm({ word: '', translation: '' });
      // Refresh stats after editing an item
      await loadStats();
    } catch (err) {
      setError('Failed to update vocabulary item');
      console.error(err);
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditForm({ word: '', translation: '' });
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
        <div className="text-sm text-gray-500">
          {vocabulary.length} words total
        </div>
      </div>

      {/* Statistics Panel */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Learning Progress</h3>
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
          {/* Table header */}
          <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
            <div className="grid grid-cols-12 gap-4 items-center">
              <div className="col-span-4 text-sm font-medium text-gray-700">Word</div>
              <div className="col-span-4 text-sm font-medium text-gray-700">Translation</div>
              <div className="col-span-2 text-sm font-medium text-gray-700">Status</div>
              <div className="col-span-2 text-sm font-medium text-gray-700">Actions</div>
            </div>
          </div>
          
          {/* Vocabulary items */}
          {vocabulary.map((item, index) => (
            <div key={item.id} className={`px-4 py-3 ${index !== vocabulary.length - 1 ? 'border-b border-gray-100' : ''}`}>
              {editingId === item.id ? (
                // Edit mode - full width form
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
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
                  </div>
                  <div className="flex space-x-2 justify-end">
                    <button onClick={handleSaveEdit} className="btn-success px-4 py-1 text-sm">
                      Save
                    </button>
                    <button onClick={handleCancelEdit} className="btn-secondary px-4 py-1 text-sm">
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                // Display mode - compact list row
                <div className="grid grid-cols-12 gap-4 items-center">
                  <div className="col-span-4">
                    <span className="font-medium text-gray-900">{item.word}</span>
                  </div>
                  <div className="col-span-4">
                    <span className="text-gray-600">{item.translation}</span>
                  </div>
                  <div className="col-span-2">
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
                  </div>
                  <div className="col-span-2">
                    <div className="flex space-x-1">
                      <button
                        onClick={() => handleEdit(item)}
                        className="btn-secondary px-2 py-1 text-xs"
                        title="Edit word"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="btn-error px-2 py-1 text-xs"
                        title="Delete word"
                      >
                        Del
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default VocabularyList; 