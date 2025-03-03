import React, { useState, useEffect } from 'react';
import GoldChart from './components/GoldChart';

function App() {
  const [darkMode, setDarkMode] = useState(false);

  // Check dark mode preference from localStorage first, then system preference
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      setDarkMode(savedTheme === 'dark');
    } else {
      const isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setDarkMode(isDarkMode);
    }
    
    // Add listener for system preference changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e) => {
      if (!localStorage.getItem('theme')) {
        setDarkMode(e.matches);
      }
    };
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Apply dark mode to the whole document
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    // Save preference to localStorage
    localStorage.setItem('theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  return (
    <div className="min-h-screen">
      <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-night-800 dark:to-night-900 min-h-screen transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <header className="flex justify-between items-center mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-gold-400 to-gold-600 rounded-lg flex items-center justify-center shadow-lg">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-white">
                  <path d="M12 7.25c-4.142 0-7.5 3.358-7.5 7.5 0 4.142 3.358 7.5 7.5 7.5 4.142 0 7.5-3.358 7.5-7.5 0-4.142-3.358-7.5-7.5-7.5ZM10.5 13.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3ZM14.25 15a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5ZM12 4.25c.689 0 1.249.56 1.249 1.25a.75.75 0 0 0 1.5 0c0-1.517-1.232-2.75-2.749-2.75a.75.75 0 0 0 0 1.5Z" />
                  <path d="M4.25 5c.415 0 .75.335.75.75v.826c.361-.238.611-.615.611-1.051 0-1.138-1.513-1.75-2.611-1.75-.335 0-.75.083-.75.75v.325c0 .415.335.75.75.75.275 0 .611.159.611.35 0 .158-.254.25-.488.25a.75.75 0 0 0 0 1.5c.415 0 .75.335.75.75v.826c.361-.238.611-.615.611-1.051 0-1.138-1.513-1.75-2.611-1.75-.335 0-.75.083-.75.75v.325c0 .415.335.75.75.75.275 0 .611.159.611.35 0 .158-.254.25-.488.25a.75.75 0 0 0 0 1.5Z" />
                  <path d="M19.75 5c.415 0 .75.335.75.75v.826c.361-.238.611-.615.611-1.051 0-1.138-1.513-1.75-2.611-1.75-.335 0-.75.083-.75.75v.325c0 .415.335.75.75.75.275 0 .611.159.611.35 0 .158-.254.25-.488.25a.75.75 0 0 0 0 1.5c.415 0 .75.335.75.75v.826c.361-.238.611-.615.611-1.051 0-1.138-1.513-1.75-2.611-1.75-.335 0-.75.083-.75.75v.325c0 .415.335.75.75.75.275 0 .611.159.611.35 0 .158-.254.25-.488.25a.75.75 0 0 0 0 1.5Z" />
                </svg>
              </div>
              <h1 className="text-3xl md:text-4xl font-display bg-gradient-to-r from-gold-600 to-royal-600 text-transparent bg-clip-text">Gold Prediction</h1>
            </div>
            
            <button 
              onClick={toggleDarkMode} 
              className="p-2 rounded-lg bg-white dark:bg-night-700 shadow-md hover:shadow-lg transition-all text-night-800 dark:text-gray-100"
              aria-label="Toggle dark mode"
            >
              {darkMode ? (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z" />
                </svg>
              )}
            </button>
          </header>
          
          <main>
            <GoldChart darkMode={darkMode} />
          </main>
          
          <footer className="mt-12 pt-6 border-t border-gray-200 dark:border-night-700">
            <div className="text-sm text-gray-500 dark:text-gray-400 flex flex-wrap justify-between items-center gap-4">
              <p>© {new Date().getFullYear()} Gold Prediction. All rights reserved.</p>
              <div className="flex gap-4">
                <a href="#" className="hover:text-royal-600 dark:hover:text-royal-400 transition-colors">Terms</a>
                <a href="#" className="hover:text-royal-600 dark:hover:text-royal-400 transition-colors">Privacy</a>
                <a href="#" className="hover:text-royal-600 dark:hover:text-royal-400 transition-colors">Contact</a>
              </div>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}

export default App;