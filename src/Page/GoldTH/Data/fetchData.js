import axios from 'axios';

/**
 * ดึงข้อมูลราคาทองไทย
 * @param {Object} params - พารามิเตอร์เพิ่มเติม (ถ้ามี)
 * @returns {Promise<Object>} - ข้อมูลราคาทอง
 */
export const fetchGoldData = async (params = {}) => {
  try {
    const response = await axios.get(
      'https://gold-predictions.duckdns.org/finnomenaGold/get-gold-data/',
      {
        params: {
          db_choice: 0,
          frame: 'all',
          display: 'chart',
          cache: 'True',
          ...params,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error fetching gold data:', error);
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
    return response.data;
  } catch (error) {
    console.error('Error fetching prediction data:', error);
    throw error;
  }
};

/**
 * ดึงข้อมูลราคาทองไทยตามช่วงวันที่
 * @param {string} startDate - วันที่เริ่มต้น (YYYY-MM-DD)
 * @param {string} endDate - วันที่สิ้นสุด (YYYY-MM-DD)
 * @returns {Promise<Object>} - ข้อมูลราคาทอง
 */
export const fetchGoldDataByDateRange = async (startDate, endDate) => {
  try {
    const response = await axios.get(
      'https://gold-predictions.duckdns.org/finnomenaGold/get-gold-data/',
      {
        params: {
          db_choice: 0,
          frame: 'all',
          display: 'chart',
          cache: 'True',
          start_date: startDate,
          end_date: endDate,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error fetching gold data by date range:', error);
    throw error;
  }
};
