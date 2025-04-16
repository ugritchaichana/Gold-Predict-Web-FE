import axios from 'axios';
import { getBaseUrl } from '@/config/apiConfig';

/**
 * ฟังก์ชันสำหรับดึงข้อมูลทองคำ, ทองคำสหรัฐ และอัตราแลกเปลี่ยน USD/THB จาก API ใหม่
 * @param {string} select - ประเภทของข้อมูล: 'GoldTH', 'GoldUS', หรือ 'USDTHB'
 * @param {string} start - วันที่เริ่มต้น (รูปแบบ dd-mm-yy)
 * @param {string} end - วันที่สิ้นสุด (รูปแบบ dd-mm-yy)
 * @returns {Promise} - Promise ที่คืนค่าข้อมูลที่ดึงมา
 */
export const fetchGoldDataNew = async (select, start, end) => {
  try {
    const BASE_URL = getBaseUrl();
    let url = `${BASE_URL}/data/get_data/?select=${select}&display=chart`;
    
    // เพิ่มพารามิเตอร์ start และ end หากมีการกำหนด
    if (start) {
      url += `&start=${start}`;
    }
    if (end) {
      url += `&end=${end}`;
    }
    
    console.log(`Fetching data from: ${url}`);
    const response = await axios.get(url);
    
    return response.data;
  } catch (error) {
    console.error(`Error fetching ${select} data:`, error);
    throw error;
  }
};

/**
 * ฟังก์ชันสำหรับดึงข้อมูลทองคำไทย
 * @param {string} start - วันที่เริ่มต้น (รูปแบบ dd-mm-yy)
 * @param {string} end - วันที่สิ้นสุด (รูปแบบ dd-mm-yy)
 * @returns {Promise} - Promise ที่คืนค่าข้อมูลทองคำไทย
 */
export const fetchGoldTHNew = async (start, end) => {
  return fetchGoldDataNew('GOLDTH', start, end);
};

/**
 * ฟังก์ชันสำหรับดึงข้อมูลทองคำสหรัฐ
 * @param {string} start - วันที่เริ่มต้น (รูปแบบ dd-mm-yy)
 * @param {string} end - วันที่สิ้นสุด (รูปแบบ dd-mm-yy)
 * @returns {Promise} - Promise ที่คืนค่าข้อมูลทองคำสหรัฐ
 */
export const fetchGoldUSNew = async (start, end) => {
  return fetchGoldDataNew('GOLDUS', start, end);
};

/**
 * ฟังก์ชันสำหรับดึงข้อมูลอัตราแลกเปลี่ยน USD/THB
 * @param {string} start - วันที่เริ่มต้น (รูปแบบ dd-mm-yy)
 * @param {string} end - วันที่สิ้นสุด (รูปแบบ dd-mm-yy)
 * @returns {Promise} - Promise ที่คืนค่าข้อมูลอัตราแลกเปลี่ยน USD/THB
 */
export const fetchUSDTHBNew = async (start, end) => {
  return fetchGoldDataNew('USDTHB', start, end);
};

/**
 * ฟังก์ชันสำหรับดึงข้อมูลการทำนายราคาทองรายสัปดาห์
 * @param {string} startdate - วันที่เริ่มต้น (รูปแบบ YYYY-MM-DD)
 * @param {string} enddate - วันที่สิ้นสุด (รูปแบบ YYYY-MM-DD)
 * @returns {Promise} - Promise ที่คืนค่าข้อมูลการทำนาย
 */
export const fetchPredictionsNew = async (startdate, enddate) => {
  try {
    const BASE_URL = getBaseUrl();
    let url = `${BASE_URL}/predicts/week/read/?range=sort_all&display=chart`;
    
    // เพิ่มพารามิเตอร์ startdate และ enddate หากมีการกำหนด
    if (startdate) {
      url += `&startdate=${startdate}`;
    }
    if (enddate) {
      url += `&enddate=${enddate}`;
    }
    
    console.log(`Fetching predictions from: ${url}`);
    const response = await axios.get(url);
    
    return response.data;
  } catch (error) {
    console.error('Error fetching prediction data:', error);
    throw error;
  }
}; 