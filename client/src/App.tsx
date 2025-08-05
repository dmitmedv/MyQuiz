import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import VocabularyList from './components/VocabularyList';
import AddVocabulary from './components/AddVocabulary';
import Practice from './components/Practice';
import Stats from './components/Stats';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                <h1 className="text-2xl font-bold text-primary-600">MyQuiz</h1>
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
                <button className="text-gray-700 hover:text-primary-600 p-2">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
              </div>
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