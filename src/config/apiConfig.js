// src/config/apiConfig.js

// กำหนด URL ของ backend - สลับคอมเม้นต์เพื่อเลือกใช้ URL
export let API_ENVIRONMENTS = 'https://gold-predictions.duckdns.org';
// export let API_ENVIRONMENTS = 'http://127.0.0.1:8000';

// สำหรับความเข้ากันได้กับโค้ดเดิม
export const getCurrentEnvironment = () => {
  return 'production';
};

// ดึง URL ของ backend
export const getBaseUrl = () => {
  return API_ENVIRONMENTS;
};

// สำหรับความเข้ากันได้กับโค้ดเดิม
export const setEnvironment = (environment) => {
  console.log('Environment setting through UI is disabled. Please edit apiConfig.js directly.');
  return false;
};