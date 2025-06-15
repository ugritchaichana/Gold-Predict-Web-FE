// src/config/apiConfig.js

// Get API URL from environment variables
const getApiUrl = () => {
  // Check if we have environment variable first
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }
  
  // Fallback based on mode
  if (import.meta.env.DEV) {
    return 'http://127.0.0.1:8000'; // Development
  } else {
    return 'https://gold-predictions.duckdns.org'; // Production
  }
};

export const API_ENVIRONMENTS = getApiUrl();

export const getCurrentEnvironment = () => {
  return import.meta.env.VITE_ENVIRONMENT || (import.meta.env.DEV ? 'development' : 'production');
};

export const getBaseUrl = () => {
  // Debug info (only in development)
  if (import.meta.env.DEV) {
    console.log('🔧 API Config:', {
      mode: import.meta.env.MODE,
      dev: import.meta.env.DEV,
      prod: import.meta.env.PROD,
      apiUrl: API_ENVIRONMENTS,
      environment: getCurrentEnvironment()
    });
  }
  
  return API_ENVIRONMENTS;
};

export const setEnvironment = (environment) => {
  console.log('Environment setting through UI is disabled. Please use environment variables.');
  return false;
};