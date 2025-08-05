import React, { useState, useEffect } from 'react';
import { VocabularyItem } from '../types';
import { apiService } from '../services/api';

const VocabularyList: React.FC = () => {
  const [vocabulary, setVocabulary] = useState<VocabularyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({ word: '', translation: '' });

  useEffect(() => {
    loadVocabulary();
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

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this word?')) {
      return;
    }

    try {
      await apiService.deleteVocabularyItem(id);
      setVocabulary(vocabulary.filter(item => item.id !== id));
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
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {vocabulary.map((item) => (
            <div key={item.id} className="card">
              {editingId === item.id ? (
                <div className="space-y-3">
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
                  <div className="flex space-x-2">
                    <button onClick={handleSaveEdit} className="btn-success flex-1">
                      Save
                    </button>
                    <button onClick={handleCancelEdit} className="btn-secondary flex-1">
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        {item.word}
                      </h3>
                      <p className="text-gray-600">{item.translation}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => toggleLearned(item)}
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          item.learned
                            ? 'bg-success-100 text-success-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {item.learned ? 'Learned' : 'Not Learned'}
                      </button>
                    </div>
                  </div>
                  
                  <div className="flex space-x-2 pt-2 border-t border-gray-100">
                    <button
                      onClick={() => handleEdit(item)}
                      className="btn-secondary flex-1 text-sm"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="btn-error flex-1 text-sm"
                    >
                      Delete
                    </button>
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