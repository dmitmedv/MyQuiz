// Language to country flag mapping
export const getLanguageFlag = (language: string): string => {
  const languageMap: { [key: string]: string } = {
    'serbian': '🇷🇸', // Serbian flag
    'russian': '🇷🇺', // Russian flag
    'english': '🇬🇧', // English flag (UK)
    'sr': '🇷🇸',      // Serbian abbreviation
    'ru': '🇷🇺',      // Russian abbreviation
    'en': '🇬🇧',      // English abbreviation
  };
  
  // Return the flag for the language, or default to Serbian if not found
  return languageMap[language.toLowerCase()] || '🇷🇸';
};

// Get language name for display
export const getLanguageName = (language: string): string => {
  const languageNames: { [key: string]: string } = {
    'serbian': 'Serbian',
    'russian': 'Russian',
    'english': 'English',
    'sr': 'Serbian',
    'ru': 'Russian',
    'en': 'English',
  };
  
  return languageNames[language.toLowerCase()] || 'Serbian';
};
