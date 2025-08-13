// src/config/apiConfig.js

// Get API URL from environment variables
const getApiUrl = () => {
  return import.meta.env.VITE_API_BASE_URL || 'https://gold-predictions.duckdns.org';
};

export const API_ENVIRONMENTS = getApiUrl();

export const getBaseUrl = () => {
  return API_ENVIRONMENTS;
};