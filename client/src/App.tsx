import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import VocabularyList from './components/VocabularyList';
import AddVocabulary from './components/AddVocabulary';
import Practice from './components/Practice';
import Stats from './components/Stats';

function App() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                {/* Make the logo clickable by wrapping it with a Link */}
                <Link to="/" className="hover:opacity-80 transition-opacity">
                  <h1 className="text-2xl font-bold text-primary-600">MyQuiz</h1>
                </Link>
              </div>
              <nav className="hidden md:flex space-x-8">
                <Link 
                  to="/" 
                  className="text-gray-700 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Vocabulary
                </Link>
                <Link 
                  to="/add" 
                  className="text-gray-700 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Add Word
                </Link>
                <Link 
                  to="/practice" 
                  className="text-gray-700 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Practice
                </Link>
                <Link 
                  to="/stats" 
                  className="text-gray-700 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Stats
                </Link>
              </nav>
              
              {/* Mobile menu button */}
              <div className="md:hidden">
                <button
                  type="button"
                  aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
                  aria-expanded={isMobileMenuOpen}
                  aria-controls="mobile-menu"
                  className="text-gray-700 hover:text-primary-600 p-2"
                  onClick={() => setIsMobileMenuOpen((prev) => !prev)}
                >
                  {isMobileMenuOpen ? (
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  ) : (
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          </div>
          {/* Mobile menu panel */}
          <div
            id="mobile-menu"
            className={`${isMobileMenuOpen ? 'block' : 'hidden'} md:hidden border-t border-gray-200`}
          >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 space-y-1">
              <Link
                to="/"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block text-gray-700 hover:text-primary-600 hover:bg-gray-50 px-3 py-2 rounded-md text-base font-medium transition-colors"
              >
                Vocabulary
              </Link>
              <Link
                to="/add"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block text-gray-700 hover:text-primary-600 hover:bg-gray-50 px-3 py-2 rounded-md text-base font-medium transition-colors"
              >
                Add Word
              </Link>
              <Link
                to="/practice"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block text-gray-700 hover:text-primary-600 hover:bg-gray-50 px-3 py-2 rounded-md text-base font-medium transition-colors"
              >
                Practice
              </Link>
              <Link
                to="/stats"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block text-gray-700 hover:text-primary-600 hover:bg-gray-50 px-3 py-2 rounded-md text-base font-medium transition-colors"
              >
                Stats
              </Link>
            </div>
          </div>
        </header>

        {/* Main content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Routes>
            <Route path="/" element={<VocabularyList />} />
            <Route path="/add" element={<AddVocabulary />} />
            <Route path="/practice" element={<Practice />} />
            <Route path="/stats" element={<Stats />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App; 