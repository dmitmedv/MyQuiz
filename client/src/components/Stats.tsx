import React, { useState, useEffect } from 'react';
import { PracticeStats, VocabularyItem } from '../types';
import { apiService } from '../services/api';

const Stats: React.FC = () => {
  const [stats, setStats] = useState<PracticeStats>({ total: 0, learned: 0, unlearned: 0, progress: 0 });
  const [vocabulary, setVocabulary] = useState<VocabularyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [statsData, vocabularyData] = await Promise.all([
        apiService.getPracticeStats(),
        apiService.getVocabulary()
      ]);
      setStats(statsData);
      setVocabulary(vocabularyData);
      setError(null);
    } catch (err) {
      setError('Failed to load statistics');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getRecentWords = () => {
    return vocabulary
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 5);
  };

  const getLearnedWords = () => {
    return vocabulary.filter(item => item.learned);
  };

  const getUnlearnedWords = () => {
    return vocabulary.filter(item => !item.learned);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Learning Statistics</h2>
        <p className="text-gray-600">Track your progress and see how you're doing with your vocabulary learning.</p>
      </div>

      {error && (
        <div className="bg-error-50 border border-error-200 text-error-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Progress Overview */}
      <div className="card">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">Progress Overview</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-primary-600 mb-1">{stats.total}</div>
            <div className="text-sm text-gray-500">Total Words</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-success-600 mb-1">{stats.learned}</div>
            <div className="text-sm text-gray-500">Learned</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-gray-600 mb-1">{stats.unlearned}</div>
            <div className="text-sm text-gray-500">To Learn</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600 mb-1">{stats.progress}%</div>
            <div className="text-sm text-gray-500">Progress</div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-6">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Progress</span>
            <span>{stats.progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div 
              className="bg-gradient-to-r from-primary-500 to-success-500 h-3 rounded-full transition-all duration-500"
              style={{ width: `${stats.progress}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Recently Added</h3>
          {getRecentWords().length > 0 ? (
            <div className="space-y-3">
              {getRecentWords().map((item) => (
                <div key={item.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <div>
                    <div className="font-medium text-gray-900">{item.word}</div>
                    <div className="text-sm text-gray-600">{item.translation}</div>
                  </div>
                  <div className={`px-2 py-1 rounded text-xs font-medium ${
                    item.learned
                      ? 'bg-success-100 text-success-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {item.learned ? 'Learned' : 'Not Learned'}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">No words added yet.</p>
          )}
        </div>

        <div className="card">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Learning Status</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700">Learned Words</span>
                <span className="text-sm text-success-600 font-medium">{stats.learned}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-success-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${stats.total > 0 ? (stats.learned / stats.total) * 100 : 0}%` }}
                ></div>
              </div>
            </div>
            
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700">Words to Learn</span>
                <span className="text-sm text-gray-600 font-medium">{stats.unlearned}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-gray-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${stats.total > 0 ? (stats.unlearned / stats.total) * 100 : 0}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Word Lists */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Learned Words</h3>
          {getLearnedWords().length > 0 ? (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {getLearnedWords().map((item) => (
                <div key={item.id} className="flex justify-between items-center p-2 bg-success-50 rounded">
                  <div>
                    <div className="font-medium text-gray-900">{item.word}</div>
                    <div className="text-sm text-gray-600">{item.translation}</div>
                  </div>
                  <div className="text-success-600 text-xs">✅</div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">No words learned yet. Start practicing!</p>
          )}
        </div>

        <div className="card">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Words to Learn</h3>
          {getUnlearnedWords().length > 0 ? (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {getUnlearnedWords().map((item) => (
                <div key={item.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                  <div>
                    <div className="font-medium text-gray-900">{item.word}</div>
                    <div className="text-sm text-gray-600">{item.translation}</div>
                  </div>
                  <div className="text-gray-400 text-xs">⏳</div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">All words learned! Great job! 🎉</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Stats; 