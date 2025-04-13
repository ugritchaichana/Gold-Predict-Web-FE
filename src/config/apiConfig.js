// src/config/apiConfig.js

// กำหนด URL ของ backend
export const API_ENVIRONMENTS = {
  production: 'https://goldpredictions.duckdns.org',
  development: 'http://127.0.0.1:8000'
};

// ดึงค่า environment ปัจจุบันจาก localStorage หรือใช้ค่าเริ่มต้นเป็น production
export const getCurrentEnvironment = () => {
  return localStorage.getItem('apiEnvironment') || 'production';
};

// ดึง URL ของ backend ตาม environment ปัจจุบัน
export const getBaseUrl = () => {
  const currentEnv = getCurrentEnvironment();
  return API_ENVIRONMENTS[currentEnv] || API_ENVIRONMENTS.production;
};

// เปลี่ยน environment และบันทึกลงใน localStorage
export const setEnvironment = (environment) => {
  if (API_ENVIRONMENTS[environment]) {
    localStorage.setItem('apiEnvironment', environment);
    return true;
  }
  return false;
}; 