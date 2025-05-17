import React from 'react';
import { useTranslation } from 'react-i18next';

export function LanguageSelector() {
  const { i18n, t } = useTranslation();

  const changeLanguage = (language) => {
    i18n.changeLanguage(language);
  };

  const isActive = (language) => i18n.language === language ? 'font-bold' : '';

  return (
    <div className="flex items-center space-x-2">
      <button
        onClick={() => changeLanguage('en')}
        className={`px-2 py-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors ${isActive('en')}`}
      >
        EN
      </button>
      <span className="text-gray-500">|</span>
      <button
        onClick={() => changeLanguage('th')}
        className={`px-2 py-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors ${isActive('th')}`}
      >
        TH
      </button>
    </div>
  );
}
