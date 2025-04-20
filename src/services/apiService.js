// src/services/apiService.js
import axios from 'axios';
import { getBaseUrl } from '@/config/apiConfig';

export const fetchGoldTH = async (timeframe = 'all') => {
  try {
    const BASE_URL = getBaseUrl();
    // เปลี่ยนเป็น endpoint ใหม่ที่ส่งข้อมูลในรูปแบบ chart
    const response = await axios.get(`${BASE_URL}/finnomenaGold/get-gold-data/?db_choice=0&frame=${timeframe}&display=chart`);
    console.log(`GoldTH : ${BASE_URL}/finnomenaGold/get-gold-data/?db_choice=0&frame=${timeframe}&display=chart`);
    
    // ตรวจสอบว่าข้อมูลมาในรูปแบบใหม่ และแปลงให้อยู่ในรูปแบบเดิม
    if (response.data && response.data.status === "success" && response.data.data) {
      // รูปแบบใหม่: แปลงข้อมูลจากรูปแบบ datasets เป็นรายการของ objects
      const labels = response.data.data.labels || [];
      const datasets = response.data.data.datasets || [];
      
      // หา index ของ datasets ที่เราต้องใช้
      const dateIndex = datasets.findIndex(ds => ds.label === "Date");
      const priceIndex = datasets.findIndex(ds => ds.label === "Price");
      const createdAtIndex = datasets.findIndex(ds => ds.label === "Created At");
      const barSellPriceIndex = datasets.findIndex(ds => ds.label === "Bar Sell Price");
      const barPriceChangeIndex = datasets.findIndex(ds => ds.label === "Bar Price Change");
      const ornamentBuyPriceIndex = datasets.findIndex(ds => ds.label === "Ornament Buy Price");
      const ornamentSellPriceIndex = datasets.findIndex(ds => ds.label === "Ornament Sell Price");
      
      // แปลงเป็นรูปแบบเดิม พร้อมข้อมูลเพิ่มเติม
      const transformedData = {
        status: response.data.status,
        data: labels.map((label, idx) => ({
          date: dateIndex >= 0 ? datasets[dateIndex].data[idx] : label,
          price: priceIndex >= 0 ? datasets[priceIndex].data[idx] : null,
          created_at: createdAtIndex >= 0 ? datasets[createdAtIndex].data[idx] : null,
          // เพิ่มข้อมูลอื่นๆ
          bar_sell_price: barSellPriceIndex >= 0 ? datasets[barSellPriceIndex].data[idx] : null,
          bar_price_change: barPriceChangeIndex >= 0 ? datasets[barPriceChangeIndex].data[idx] : null,
          ornament_buy_price: ornamentBuyPriceIndex >= 0 ? datasets[ornamentBuyPriceIndex].data[idx] : null,
          ornament_sell_price: ornamentSellPriceIndex >= 0 ? datasets[ornamentSellPriceIndex].data[idx] : null
        })).filter(item => item.price !== null)
      };
      
      // เพิ่มข้อมูลเพิ่มเติมจาก response
      if (response.data.start_date) {
        transformedData.start_date = response.data.start_date;
      }
      if (response.data.end_date) {
        transformedData.end_date = response.data.end_date;
      }
      
      return transformedData;
    }
    
    // ถ้าไม่ใช่รูปแบบใหม่หรือไม่มีข้อมูลที่ต้องการ ส่งข้อมูลเดิมกลับไป
    return response.data;
  } catch (error) {
    console.error('Error fetching Gold TH data:', error);
    throw error;
  }
};

export const fetchGoldUS = async (timeframe = 'all') => {
  try {
    const BASE_URL = getBaseUrl();
    const response = await axios.get(`${BASE_URL}/finnomenaGold/get-gold-data/?db_choice=1&cache=false&frame=${timeframe}&display=chart`);
    console.log(`GoldUS : ${BASE_URL}/finnomenaGold/get-gold-data/?db_choice=1&cache=false&frame=${timeframe}&display=chart`);
    
    // Handle the new data structure
    if (response.data && response.data.status === "success" && response.data.data) {
      // Transform data from datasets structure to array of objects
      const labels = response.data.data.labels || [];
      const datasets = response.data.data.datasets || [];
        // Find indices of required data fields
      const dateIndex = datasets.findIndex(ds => ds.label === "Date");
      const priceIndex = datasets.findIndex(ds => ds.label === "Price");
      const createdAtIndex = datasets.findIndex(ds => ds.label === "Created At");
      const closePriceIndex = datasets.findIndex(ds => ds.label === "Close Price");
      const highPriceIndex = datasets.findIndex(ds => ds.label === "High Price");
      const lowPriceIndex = datasets.findIndex(ds => ds.label === "Low Price");
      const volumeIndex = datasets.findIndex(ds => ds.label === "Volume");
      const vwaIndex = datasets.findIndex(ds => ds.label === "Volume Weighted Average");
      const transactionsIndex = datasets.findIndex(ds => ds.label === "Number of Transactions");
        // Transform to original format with additional data
      const transformedData = {
        status: response.data.status,
        data: labels.map((label, idx) => ({
          date: dateIndex >= 0 ? datasets[dateIndex].data[idx] : label,
          price: priceIndex >= 0 ? datasets[priceIndex].data[idx] : null,
          created_at: createdAtIndex >= 0 ? datasets[createdAtIndex].data[idx] : null,
          // Additional Gold US specific data
          close_price: closePriceIndex >= 0 ? datasets[closePriceIndex].data[idx] : null,
          high_price: highPriceIndex >= 0 ? datasets[highPriceIndex].data[idx] : null,
          low_price: lowPriceIndex >= 0 ? datasets[lowPriceIndex].data[idx] : null,
          volume: volumeIndex >= 0 ? datasets[volumeIndex].data[idx] : null,
          volume_weighted_average: vwaIndex >= 0 ? datasets[vwaIndex].data[idx] : null,
          number_of_transactions: transactionsIndex >= 0 ? datasets[transactionsIndex].data[idx] : null
        })).filter(item => item.price !== null)
      };
      
      // Include additional metadata
      if (response.data.start_date) {
        transformedData.start_date = response.data.start_date;
      }
      if (response.data.end_date) {
        transformedData.end_date = response.data.end_date;
      }
      
      return transformedData;
    }
    
    // Return original data if not in the expected format
    return response.data;
  } catch (error) {
    console.error('Error fetching Gold US data:', error);
    throw error;
  }
};

export const fetchUSDTHB = async (timeframe = 'all') => {
  try {
    const BASE_URL = getBaseUrl();
    const response = await axios.get(`${BASE_URL}/currency/get/?frame=${timeframe}`);
    // const response = await axios.get(`${BASE_URL}/currency/get/?frame=${timeframe}&max=100`);
    console.log(`USDTHB : ${BASE_URL}/currency/get/?frame=${timeframe}`);
    
    return response.data;
  } catch (error) {
    console.error('Error fetching USDTHB data:', error);
    throw error;
  }
};

export const fetchPredictions = async () => {
  try {
    const BASE_URL = getBaseUrl();
    const response = await axios.get(`${BASE_URL}/predicts/week/read`);
    return response.data;
  } catch (error) {
    console.error('Error fetching Prediction data:', error);
    throw error;
  }
};

export const fetchPredictionsWithParams = async (range = 'sort_all', display = 'chart', startdate, enddate) => {
  try {
    const BASE_URL = getBaseUrl();
    const params = new URLSearchParams({
      range,
      display,
      ...(startdate && { startdate }),
      ...(enddate && { enddate }),
    }).toString();

    const fullUrl = `${BASE_URL}/predicts/week/read?${params}`;
    
    const response = await axios.get(fullUrl);
    // console.log('Full API URL: >> ', fullUrl);
    // console.log('Response: >> ', response.data);
    return response.data;
  } catch (error) {
    console.error('Error fetching Prediction data with params:', error);
    throw error;
  }
};


export const fetchPredictionsMonth = async () => {
  try {
    const BASE_URL = getBaseUrl();
    const response = await axios.get(`${BASE_URL}/predicts/month/read_all`);
    return response.data;
  } catch (error) {
    console.error('Error fetching Prediction data:', error);
    throw error;
  }
};