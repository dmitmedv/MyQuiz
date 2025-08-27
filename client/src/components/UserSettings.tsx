import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Language, UserSettings as UserSettingsType } from '../types';
import { apiService } from '../services/api';

// Available languages with their flags
const AVAILABLE_LANGUAGES: Language[] = [
  { value: 'english', flag: '🇬🇧', name: 'English' },
  { value: 'serbian', flag: '🇷🇸', name: 'Serbian' },
  { value: 'russian', flag: '🇷🇺', name: 'Russian' },
  { value: 'spanish', flag: '🇪🇸', name: 'Spanish' },
  { value: 'french', flag: '🇫🇷', name: 'French' },
  { value: 'german', flag: '🇩🇪', name: 'German' },
  { value: 'italian', flag: '🇮🇹', name: 'Italian' },
  { value: 'portuguese', flag: '🇵🇹', name: 'Portuguese' },
  { value: 'chinese', flag: '🇨🇳', name: 'Chinese' },
  { value: 'japanese', flag: '🇯🇵', name: 'Japanese' },
  { value: 'korean', flag: '🇰🇷', name: 'Korean' },
  { value: 'arabic', flag: '🇸🇦', name: 'Arabic' },
  { value: 'hindi', flag: '🇮🇳', name: 'Hindi' }
];

const UserSettings: React.FC = () => {
  const navigate = useNavigate();
  const [settings, setSettings] = useState<UserSettingsType | null>(null);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  const [skipButtonEnabled, setSkipButtonEnabled] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Load user settings on component mount
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const userSettings = await apiService.getUserSettings();
      setSettings(userSettings);
      setSelectedLanguages(userSettings.selected_languages);
      setSkipButtonEnabled(userSettings.skip_button_enabled);
    } catch (err: any) {
      console.error('Error loading user settings:', err);
      setError('Failed to load language settings');
    } finally {
      setLoading(false);
    }
  };

  const handleLanguageToggle = (languageCode: string) => {
    setSelectedLanguages(prev => {
      const newSelection = prev.includes(languageCode)
        ? prev.filter(lang => lang !== languageCode)
        : [...prev, languageCode];
      
      // Clear success message when user makes changes
      if (successMessage) {
        setSuccessMessage(null);
      }
      
      return newSelection;
    });
  };

  const handleSave = async () => {
    if (selectedLanguages.length === 0) {
      setError('Please select at least one language');
      return;
    }

    try {
      setSaving(true);
      setError(null);
      setSuccessMessage(null);
      
      const updatedSettings = await apiService.updateUserSettings({
        selected_languages: selectedLanguages,
        skip_button_enabled: skipButtonEnabled
      });
      
      setSettings(updatedSettings);
      setSuccessMessage('Language preferences saved successfully!');
      
      // Auto-hide success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
      
    } catch (err: any) {
      console.error('Error saving user settings:', err);
      setError(err.message || 'Failed to save language settings');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (settings) {
      setSelectedLanguages(settings.selected_languages);
      setSkipButtonEnabled(settings.skip_button_enabled);
      setError(null);
      setSuccessMessage(null);
    }
  };

  const hasUnsavedChanges = settings && (
    JSON.stringify(selectedLanguages.sort()) !== JSON.stringify(settings.selected_languages.sort()) ||
    skipButtonEnabled !== settings.skip_button_enabled
  );

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">User Settings</h2>
        <p className="text-gray-600">
          Choose the languages you want to use for vocabulary learning. These will be available when adding new words.
        </p>
      </div>

      <div className="card">
        <div className="mb-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Available Languages</h3>
          <p className="text-sm text-gray-600 mb-4">
            Select the languages you want to use for your vocabulary learning. You need at least one language selected.
          </p>
          
          {/* Error/Success Messages */}
          {error && (
            <div className="mb-4 bg-error-50 border border-error-200 text-error-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}
          
          {successMessage && (
            <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
              {successMessage}
            </div>
          )}

          {/* Language Selection Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {AVAILABLE_LANGUAGES.map((language) => {
              const isSelected = selectedLanguages.includes(language.value);
              return (
                <label
                  key={language.value}
                  className={`
                    flex items-center p-3 border rounded-lg cursor-pointer transition-all duration-200
                    ${isSelected 
                      ? 'border-primary-300 bg-primary-50 text-primary-900' 
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }
                  `}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => handleLanguageToggle(language.value)}
                    className="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500 focus:ring-2"
                  />
                  <div className="ml-3 flex items-center">
                    <span className="text-2xl mr-2">{language.flag}</span>
                    <span className="font-medium">{language.name}</span>
                  </div>
                </label>
              );
            })}
          </div>

          {/* Selection Summary */}
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <span className="text-blue-400">ℹ️</span>
              </div>
              <div className="ml-2 text-sm text-blue-800">
                <p className="font-medium">
                  {selectedLanguages.length} language{selectedLanguages.length !== 1 ? 's' : ''} selected
                </p>
                {selectedLanguages.length > 0 && (
                  <p className="mt-1">
                    Selected: {selectedLanguages.map(langCode => {
                      const lang = AVAILABLE_LANGUAGES.find(l => l.value === langCode);
                      return lang ? `${lang.flag} ${lang.name}` : langCode;
                    }).join(', ')}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Practice Mode Settings */}
        <div className="mb-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Practice Mode Settings</h3>
          <p className="text-sm text-gray-600 mb-4">
            Configure options for your practice sessions.
          </p>

          <div className="space-y-4">
            <label className="flex items-center p-4 border border-gray-200 rounded-lg hover:border-gray-300 hover:bg-gray-50 transition-colors">
              <input
                type="checkbox"
                checked={skipButtonEnabled}
                onChange={(e) => setSkipButtonEnabled(e.target.checked)}
                className="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500 focus:ring-2"
              />
              <div className="ml-3">
                <div className="font-medium text-gray-900">Enable Skip Button</div>
                <div className="text-sm text-gray-600">
                  Show a skip button during practice sessions to skip difficult words or phrases
                </div>
              </div>
            </label>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-gray-200">
          <button
            onClick={handleSave}
            disabled={saving || selectedLanguages.length === 0}
            className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Saving...
              </div>
            ) : (
              'Save Settings'
            )}
          </button>
          
          {hasUnsavedChanges && (
            <button
              onClick={handleReset}
              disabled={saving}
              className="btn-secondary flex-1"
            >
              Reset Changes
            </button>
          )}
          
          <button
            onClick={() => navigate('/')}
            disabled={saving}
            className="btn-secondary flex-1"
          >
            Back to Vocabulary
          </button>
        </div>
      </div>

      {/* Help Section */}
      <div className="mt-8 bg-gray-50 border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">💡 How Settings Work</h3>
        <div className="space-y-4">
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Language Settings</h4>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>• <strong>Selected languages</strong> will appear in the language dropdowns when adding new vocabulary</li>
              <li>• You can choose both the <strong>word language</strong> and <strong>translation language</strong> from your selected languages</li>
              <li>• This allows you to learn multiple languages simultaneously (e.g., Serbian → English, English → Spanish)</li>
              <li>• You can change these settings anytime - existing vocabulary won't be affected</li>
              <li>• At least one language must be selected to add new vocabulary</li>
            </ul>
          </div>

          <div>
            <h4 className="font-medium text-gray-900 mb-2">Practice Mode Settings</h4>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>• <strong>Skip button</strong> allows you to skip difficult words or phrases during practice sessions</li>
              <li>• When enabled, you'll see a skip button that moves to the next word without marking it as correct or wrong</li>
              <li>• This is useful for words you find particularly challenging or want to revisit later</li>
              <li>• The skip button setting can be changed anytime and takes effect immediately</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserSettings;
