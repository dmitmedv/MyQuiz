import React, { useState } from 'react';
import { getLanguageFlag, getLanguageName } from '../utils/flags';

interface LanguageSwitcherProps {
  selectedLanguage: string;
  onLanguageChange: (language: string) => void;
}

const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({
  selectedLanguage,
  onLanguageChange
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const languages = [
    { value: 'all', name: 'All Languages', flag: '🌐' },
    { value: 'serbian', name: 'Serbian', flag: getLanguageFlag('serbian') },
    { value: 'english', name: 'English', flag: getLanguageFlag('english') },
    { value: 'russian', name: 'Russian', flag: getLanguageFlag('russian') },
  ];

  const currentLanguage = languages.find(lang => lang.value === selectedLanguage) || languages[0];

  return (
    <div className="relative">
      <button
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        className="flex items-center space-x-2 text-gray-500 hover:text-gray-700 px-3 py-2 rounded-md text-sm font-medium transition-colors"
        title="Select practice language"
      >
        <span className="text-lg">{currentLanguage.flag}</span>
        <span className="hidden sm:inline">{currentLanguage.name}</span>
        <svg
          className={`h-4 w-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isDropdownOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsDropdownOpen(false)}
          />

          {/* Dropdown */}
          <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-20">
            <div className="py-1">
              {languages.map((language) => (
                <button
                  key={language.value}
                  onClick={() => {
                    onLanguageChange(language.value);
                    setIsDropdownOpen(false);
                  }}
                  className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center space-x-3 ${
                    selectedLanguage === language.value ? 'bg-primary-50 text-primary-700' : 'text-gray-700'
                  }`}
                >
                  <span className="text-lg">{language.flag}</span>
                  <span>{language.name}</span>
                  {selectedLanguage === language.value && (
                    <svg className="ml-auto h-4 w-4 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default LanguageSwitcher;
