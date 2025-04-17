// src/config/apiConfig.js

export let API_ENVIRONMENTS = 'https://gold-predictions.duckdns.org';
// export let API_ENVIRONMENTS = 'http://127.0.0.1:8000';

export const getCurrentEnvironment = () => {
  return 'production';
};

export const getBaseUrl = () => {
  return API_ENVIRONMENTS;
};

export const setEnvironment = (environment) => {
  console.log('Environment setting through UI is disabled. Please edit apiConfig.js directly.');
  return false;
};