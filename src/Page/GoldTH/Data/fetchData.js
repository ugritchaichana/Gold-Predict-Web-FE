import axios from 'axios';

/**
 * Global cache control
 * Set to true to use cached data, false to always fetch fresh data
 */
export let useCache = true;

/**
 * Toggle cache on/off
 * @param {boolean} state - true to enable cache, false to disable
 */
export const setCacheState = (state) => {
  useCache = !!state;
  console.log(`Cache ${useCache ? 'enabled' : 'disabled'}`);
  return useCache;
};

/**
 * Clear all cached data
 */
export const clearAllCache = () => {
  localStorage.removeItem('goldThData');
  localStorage.removeItem('goldThTimestamp');
  localStorage.removeItem('goldUsData');
  localStorage.removeItem('goldUsTimestamp');
  localStorage.removeItem('usdThbData');
  localStorage.removeItem('usdThbTimestamp');
  
  // Clear all prediction data caches
  for (let i = 1; i <= 7; i++) {
    localStorage.removeItem(`predictionData_model_${i}`);
    localStorage.removeItem(`predictionData_model_${i}_timestamp`);
  }
  
  console.log('All cache cleared');
};

/**
 * ดึงข้อมูลราคาทองไทย
 * @param {Object} params - พารามิเตอร์เพิ่มเติม (ถ้ามี)
 * @returns {Promise<Object>} - ข้อมูลราคาทอง
 */
export const fetchGoldData = async (params = {}) => {
  try {
    // Check if we have cached data in localStorage and it's not too old
    const cachedData = localStorage.getItem('goldThData');
    const cachedTimestamp = localStorage.getItem('goldThTimestamp');
    const currentTime = new Date().getTime();
    
    // If caching is enabled and we have valid cached data, use it
    if (useCache && cachedData && cachedTimestamp && 
        (currentTime - parseInt(cachedTimestamp) < 3600000)) {
      console.log('Using cached gold TH data');
      return JSON.parse(cachedData);
    }
    
    // Otherwise fetch fresh data
    console.log(`Fetching fresh gold TH data (cache ${useCache ? 'enabled' : 'disabled'})`);
    const response = await axios.get(
      'https://gold-predictions.duckdns.org/finnomenaGold/get-gold-data/',
      {
        params: {
          db_choice: 0,
          frame: 'all',
          display: 'chart2',
          cache: 'True',
          ...params,
        },
      }
    );
    
    // Cache the data if caching is enabled
    if (useCache) {
      localStorage.setItem('goldThData', JSON.stringify(response.data));
      localStorage.setItem('goldThTimestamp', currentTime.toString());
    }
    
    return response.data;
  } catch (error) {
    console.error('Error fetching gold data:', error);
    throw error;
  }
};

/**
 * ดึงข้อมูลราคาทองสากล (US)
 * @param {Object} params - พารามิเตอร์เพิ่มเติม (ถ้ามี)
 * @returns {Promise<Object>} - ข้อมูลราคาทองสากล
 */
export const fetchGoldUsData = async (params = {}) => {
  try {
    // Check if we have cached data in localStorage and it's not too old
    const cachedData = localStorage.getItem('goldUsData');
    const cachedTimestamp = localStorage.getItem('goldUsTimestamp');
    const currentTime = new Date().getTime();
    
    // If caching is enabled and we have valid cached data, use it
    if (useCache && cachedData && cachedTimestamp && 
        (currentTime - parseInt(cachedTimestamp) < 3600000)) {
      console.log('Using cached gold US data');
      return JSON.parse(cachedData);
    }
    
    // Otherwise fetch fresh data
    console.log(`Fetching fresh gold US data (cache ${useCache ? 'enabled' : 'disabled'})`);
    const response = await axios.get(
      'https://gold-predictions.duckdns.org/finnomenaGold/get-gold-data/',
      {
        params: {
          db_choice: 1,
          frame: 'all',
          display: 'chart2',
          cache: 'True',
          ...params,
        },
      }
    );
    
    // Cache the data if caching is enabled
    if (useCache) {
      localStorage.setItem('goldUsData', JSON.stringify(response.data));
      localStorage.setItem('goldUsTimestamp', currentTime.toString());
    }
    
    return response.data;
  } catch (error) {
    console.error('Error fetching US gold data:', error);
    throw error;
  }
};

/**
 * ดึงข้อมูลอัตราแลกเปลี่ยน USD/THB
 * @param {Object} params - พารามิเตอร์เพิ่มเติม (ถ้ามี)
 * @returns {Promise<Object>} - ข้อมูลอัตราแลกเปลี่ยน
 */
export const fetchUsdThbData = async (params = {}) => {
  try {
    // Check if we have cached data in localStorage and it's not too old
    const cachedData = localStorage.getItem('usdThbData');
    const cachedTimestamp = localStorage.getItem('usdThbTimestamp');
    const currentTime = new Date().getTime();
    
    // If caching is enabled and we have valid cached data, use it
    if (useCache && cachedData && cachedTimestamp && 
        (currentTime - parseInt(cachedTimestamp) < 3600000)) {
      console.log('Using cached USD/THB data');
      return JSON.parse(cachedData);
    }
    
    // Otherwise fetch fresh data
    console.log(`Fetching fresh USD/THB data (cache ${useCache ? 'enabled' : 'disabled'})`);
    const response = await axios.get(
      'https://gold-predictions.duckdns.org/currency/get/',
      {
        params: {
          frame: 'all',
          cache: 'True',
          display: 'chart2',
          ...params,
        },
      }
    );
    
    // Cache the data if caching is enabled
    if (useCache) {
      localStorage.setItem('usdThbData', JSON.stringify(response.data));
      localStorage.setItem('usdThbTimestamp', currentTime.toString());
    }
    
    return response.data;
  } catch (error) {
    console.error('Error fetching USD/THB data:', error);
    throw error;
  }
};

/**
 * ดึงข้อมูล Prediction
 * @param {Object} params - พารามิเตอร์เพิ่มเติม
 * @param {number} modelNumber - หมายเลขโมเดล (1-7)
 * @returns {Promise<Object>} - ข้อมูล Prediction
 */
export const fetchPredictionData = async (modelNumber = 7, params = {}) => {
  try {
    // Check if we have cached data in localStorage and it's not too old
    const cacheKey = `predictionData_model_${modelNumber}`;
    const cachedData = localStorage.getItem(cacheKey);
    const cachedTimestamp = localStorage.getItem(`${cacheKey}_timestamp`);
    const currentTime = new Date().getTime();
    
    // If caching is enabled and we have valid cached data, use it
    if (useCache && cachedData && cachedTimestamp && 
        (currentTime - parseInt(cachedTimestamp) < 3600000)) {
      console.log(`Using cached prediction data for model ${modelNumber}`);
      return JSON.parse(cachedData);
    }
    
    // Otherwise fetch fresh data
    console.log(`Fetching fresh prediction data for model ${modelNumber} (cache ${useCache ? 'enabled' : 'disabled'})`);
    const response = await axios.get(
      'https://gold-predictions.duckdns.org/predicts/week/get_week',
      {
        params: {
          display: 'chart',
          model: modelNumber,
          ...params,
        },
      }
    );
    
    // Cache the data if caching is enabled
    if (useCache) {
      localStorage.setItem(cacheKey, JSON.stringify(response.data));
      localStorage.setItem(`${cacheKey}_timestamp`, currentTime.toString());
    }
    
    return response.data;
  } catch (error) {
    console.error('Error fetching prediction data:', error);
    throw error;
  }
};

// No need for fetchGoldDataWithCache function as it's a duplicate of fetchGoldData
