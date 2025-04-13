import axios from 'axios';
import { getBaseUrl } from '@/config/apiConfig';

/**
 * เรียกใช้ endpoint set_database เพื่อตรวจสอบและเติมข้อมูลที่ขาดหาย
 * @param {string} select ประเภทของข้อมูล (USDTHB, GOLDTH, GOLDUS, หรือ ALL)
 * @returns {Promise<Object>} ผลลัพธ์จาก API
 */
export const setDatabase = async (select = 'ALL') => {
  try {
    const BASE_URL = getBaseUrl();
    const response = await axios.get(`${BASE_URL}/data/set_database/?select=${select}`);
    return response.data;
  } catch (error) {
    console.error('Error setting database:', error);
    throw error;
  }
};

/**
 * เรียกใช้ endpoint daily_data เพื่ออัปเดตข้อมูลล่าสุด
 * @returns {Promise<Object>} ผลลัพธ์จาก API
 */
export const updateDailyData = async () => {
  try {
    const BASE_URL = getBaseUrl();
    const response = await axios.get(`${BASE_URL}/data/daily_data/`);
    return response.data;
  } catch (error) {
    console.error('Error updating daily data:', error);
    throw error;
  }
};

/**
 * เรียกข้อมูลสำหรับแสดงในแดชบอร์ด
 * @param {string} select ประเภทของข้อมูล (USDTHB, GOLDTH, GOLDUS)
 * @param {string} start วันที่เริ่มต้น (dd-mm-yy)
 * @param {string} end วันที่สิ้นสุด (dd-mm-yy)
 * @param {string} display รูปแบบการแสดงผล (chart หรือไม่ระบุ)
 * @param {string} timeframe ช่วงเวลา (day, week, month, quarter, year)
 * @returns {Promise<Object>} ผลลัพธ์จาก API
 */
export const getDataForDashboard = async (
  select = 'GOLDTH', 
  start = '', 
  end = '', 
  display = 'chart',
  timeframe = 'day'
) => {
  try {
    const BASE_URL = getBaseUrl();
    const params = new URLSearchParams({
      select,
      start,
      end,
      display,
      timeframe
    }).toString();
    
    const response = await axios.get(`${BASE_URL}/data/get_data/?${params}`);
    return response.data;
  } catch (error) {
    console.error('Error getting data for dashboard:', error);
    throw error;
  }
};

/**
 * สร้างชุดข้อมูลใหม่ตามช่วงเวลา
 * @param {string} select ประเภทของข้อมูล (USDTHB, GOLDTH, GOLDUS)
 * @param {string} start วันที่เริ่มต้น (dd-mm-yy)
 * @param {string} end วันที่สิ้นสุด (dd-mm-yy)
 * @returns {Promise<Object>} ผลลัพธ์จาก API
 */
export const createDataSet = async (select = 'GOLDTH', start = '', end = '') => {
  try {
    const BASE_URL = getBaseUrl();
    const params = new URLSearchParams({
      select,
      start,
      end
    }).toString();
    
    const response = await axios.get(`${BASE_URL}/data/create_data_set/?${params}`);
    return response.data;
  } catch (error) {
    console.error('Error creating data set:', error);
    throw error;
  }
};

/**
 * สร้างชุดข้อมูลแบบแบ่งช่วง (chunk) ตามจำนวนวันที่กำหนด
 * @param {string} select ประเภทของข้อมูล (USDTHB, GOLDTH, GOLDUS)
 * @param {string} start วันที่เริ่มต้น (dd-mm-yy)
 * @param {string} end วันที่สิ้นสุด (dd-mm-yy)
 * @param {number} chunkDays จำนวนวันต่อช่วง
 * @returns {Promise<Object>} ผลลัพธ์ที่รวมข้อมูลจากทุกช่วง
 */
export const createDataSetInChunks = async (select = 'GOLDTH', start = '', end = '', chunkDays = 30) => {
  try {
    // แปลงวันที่เป็นวัตถุ Date
    const parseDate = (dateStr) => {
      const [day, month, year] = dateStr.split('-').map(Number);
      return new Date(2000 + year, month - 1, day);
    };
    
    const startDate = start ? parseDate(start) : new Date(Date.now() - 90 * 24 * 60 * 60 * 1000); // 90 วันย้อนหลังถ้าไม่ระบุ
    const endDate = end ? parseDate(end) : new Date();
    
    // คำนวณจำนวนวันทั้งหมด
    const totalDays = Math.ceil((endDate - startDate) / (24 * 60 * 60 * 1000));
    
    // คำนวณจำนวนช่วง
    const chunks = Math.ceil(totalDays / chunkDays);
    
    let allData = [];
    let currentStartDate = new Date(startDate);
    
    for (let i = 0; i < chunks; i++) {
      // คำนวณวันสิ้นสุดของช่วงปัจจุบัน
      let currentEndDate = new Date(currentStartDate);
      currentEndDate.setDate(currentEndDate.getDate() + chunkDays - 1);
      
      // ถ้าเกินวันสิ้นสุดที่กำหนด ให้ใช้วันสิ้นสุดที่กำหนดแทน
      if (currentEndDate > endDate) {
        currentEndDate = new Date(endDate);
      }
      
      // แปลงวันที่เป็นรูปแบบ dd-mm-yy
      const formatDate = (date) => {
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = String(date.getFullYear()).slice(-2);
        return `${day}-${month}-${year}`;
      };
      
      const chunkStart = formatDate(currentStartDate);
      const chunkEnd = formatDate(currentEndDate);
      
      try {
        // เรียก API สำหรับช่วงปัจจุบัน
        const response = await createDataSet(select, chunkStart, chunkEnd);
        
        if (response.data && Array.isArray(response.data)) {
          allData = [...allData, ...response.data];
        }
      } catch (error) {
        console.error(`Error creating data for chunk ${i+1}/${chunks}:`, error);
        // ดำเนินการต่อไปแม้จะมีข้อผิดพลาดในบางช่วง
      }
      
      // เลื่อนวันเริ่มต้นไปยังวันถัดไปหลังจากวันสิ้นสุดปัจจุบัน
      currentStartDate = new Date(currentEndDate);
      currentStartDate.setDate(currentStartDate.getDate() + 1);
    }
    
    return {
      status: "success",
      message: `Created data in ${chunks} chunks successfully`,
      data: allData,
      chunks: chunks
    };
  } catch (error) {
    console.error('Error creating data set in chunks:', error);
    throw error;
  }
};

// บันทึกการตั้งค่า daily_data ลงใน localStorage
export const saveDailyDataSettings = (frequencyHours) => {
  try {
    localStorage.setItem('dailyDataFrequency', frequencyHours.toString());
    return true;
  } catch (error) {
    console.error('Error saving daily data settings:', error);
    return false;
  }
};

// ดึงการตั้งค่า daily_data จาก localStorage
export const getDailyDataSettings = () => {
  try {
    const frequency = localStorage.getItem('dailyDataFrequency');
    return frequency ? parseInt(frequency, 10) : 12; // ค่าเริ่มต้น 12 ชั่วโมง
  } catch (error) {
    console.error('Error getting daily data settings:', error);
    return 12; // ค่าเริ่มต้น 12 ชั่วโมง
  }
}; 