// src/services/apiService.js
import axios from 'axios';
import { getBaseUrl } from '@/config/apiConfig';

// ฟังก์ชันสำหรับเรียงข้อมูลตามวันที่ (ascending)
export function sortByDateAscending(data, dateKey1 = 'created_at', dateKey2 = 'date') {
  if (!Array.isArray(data)) return [];
  return [...data].sort((a, b) => {
    const dateA = new Date(a[dateKey1] || a[dateKey2]);
    const dateB = new Date(b[dateKey1] || b[dateKey2]);
    return dateA - dateB;
  });
}

export const fetchGoldTH = async (timeframe = 'all') => {
  try {
    const BASE_URL = getBaseUrl();
    // เพิ่ม params max=50 ถ้า timeframe เป็น 1y หรือ all
    const maxParam = (timeframe === '1y' || timeframe === 'all') ? '&max=100' : '';
    const response = await axios.get(`${BASE_URL}/finnomenaGold/get-gold-data/?db_choice=0&frame=${timeframe}&display=chart${maxParam}`);
    // console.log(`GoldTH : ${BASE_URL}/finnomenaGold/get-gold-data/?db_choice=0&frame=${timeframe}&display=chart`);
    
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
      let transformedData = {
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

      // เรียงข้อมูลตามวันที่จากน้อยไปมาก (ascending)
      transformedData.data = transformedData.data.sort((a, b) => new Date(a.created_at || a.date) - new Date(b.created_at || b.date));
      
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
    // เพิ่ม params max=50 ถ้า timeframe เป็น 1y หรือ all
    const maxParam = (timeframe === '1y' || timeframe === 'all') ? '&max=50' : '';
    const response = await axios.get(`${BASE_URL}/finnomenaGold/get-gold-data/?db_choice=1&frame=${timeframe}&display=chart${maxParam}`);
    
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
    // เพิ่ม params max=50 ถ้า timeframe เป็น 1y หรือ all
    const maxParam = (timeframe === '1y' || timeframe === 'all') ? '&max=50' : '';
    const response = await axios.get(`${BASE_URL}/currency/get/?frame=${timeframe}&cache=True&display=chart${maxParam}`);
    // console.log(`USDTHB : ${BASE_URL}/currency/get/?frame=${timeframe}&cache=True&display=chart`);

    if (response.data && response.data.status === "success" && response.data.data) {
      const labels = response.data.data.labels || [];
      const datasets = response.data.data.datasets || [];
      const dateIndex = datasets.findIndex(ds => ds.label === "Date");
      const priceIndex = datasets.findIndex(ds => ds.label === "Price");
      const openIndex = datasets.findIndex(ds => ds.label === "Open");
      const highIndex = datasets.findIndex(ds => ds.label === "High");
      const lowIndex = datasets.findIndex(ds => ds.label === "Low");
      const percentChangeIndex = datasets.findIndex(ds => ds.label === "Percent Change");
      const diffIndex = datasets.findIndex(ds => ds.label === "Difference");

      const transformedData = {
        status: response.data.status,
        data: labels.map((label, idx) => ({
          date: dateIndex >= 0 ? datasets[dateIndex].data[idx] : label,
          price: priceIndex >= 0 ? datasets[priceIndex].data[idx] : null,
          open: openIndex >= 0 ? datasets[openIndex].data[idx] : null,
          high: highIndex >= 0 ? datasets[highIndex].data[idx] : null,
          low: lowIndex >= 0 ? datasets[lowIndex].data[idx] : null,
          percent_change: percentChangeIndex >= 0 ? datasets[percentChangeIndex].data[idx] : null,
          difference: diffIndex >= 0 ? datasets[diffIndex].data[idx] : null
        })).filter(item => item.price !== null)
      };
      if (response.data.start_date) {
        transformedData.start_date = response.data.start_date;
      }
      if (response.data.end_date) {
        transformedData.end_date = response.data.end_date;
      }
      return transformedData;
    }
    console.log('response.data 🌟🌟🌟',response.data);
    
    return response.data;
  } catch (error) {
    console.error('Error fetching USDTHB data:', error);
    throw error;
  }
};

export const fetchPredictionsWithParams = async () => {
  try {
    const BASE_URL = getBaseUrl();
    const fullUrl = `${BASE_URL}/predicts/week/get_week?display=chart`;
    
    // console.log('[PREDICT] เริ่มดึงข้อมูลการคาดการณ์จาก:', fullUrl);
    const response = await axios.get(fullUrl);
    
    // จัดการ response ที่มีโครงสร้างใหม่
    let predict_data_all = {};
    let predict_data_7d = {};
    let predict_data_1m = {};
    let predict_data_1y = {};
      if (response.data && response.data.labels && response.data.data) {
      // console.log('[PREDICT] รูปแบบข้อมูลที่ได้จาก API:', {
      //   labels_count: response.data.labels.length,
      //   data_count: response.data.data.length,
      //   first_label: response.data.labels[0],
      //   last_label: response.data.labels[response.data.labels.length-1],
      //   sample_data: response.data.data.slice(0, 3)
      // });
      
      // เก็บข้อมูลทั้งหมด
      predict_data_all = {
        labels: response.data.labels,
        data: response.data.data
      };        try {
        // ดึงข้อมูล goldTH สำหรับแต่ละ timeframe
        const goldAllResponse = await fetchGoldTH('all');
        const gold7dResponse = await fetchGoldTH('7d');
        const gold1mResponse = await fetchGoldTH('1m');
        const gold1yResponse = await fetchGoldTH('1y');
        
        // เตรียมข้อมูลวันที่สุดท้ายสำหรับแต่ละ timeframe
        let goldLastDateAll = null;
        let goldLastDate7d = null;
        let goldLastDate1m = null;
        let goldLastDate1y = null;
        
        // ดึงวันที่สุดท้ายของแต่ละ timeframe
        if (goldAllResponse?.data?.length > 0) {
          const lastItemAll = goldAllResponse.data[goldAllResponse.data.length - 1];
          goldLastDateAll = new Date(lastItemAll.created_at || lastItemAll.date);
          // console.log('[PREDICT] วันที่สุดท้ายของ goldTH (all):', goldLastDateAll, lastItemAll.date);
        }
        
        if (gold7dResponse?.data?.length > 0) {
          const lastItem7d = gold7dResponse.data[gold7dResponse.data.length - 1];
          goldLastDate7d = new Date(lastItem7d.created_at || lastItem7d.date);
          // console.log('[PREDICT] วันที่สุดท้ายของ goldTH (7d):', goldLastDate7d, lastItem7d.date);
        }
        
        if (gold1mResponse?.data?.length > 0) {
          const lastItem1m = gold1mResponse.data[gold1mResponse.data.length - 1];
          goldLastDate1m = new Date(lastItem1m.created_at || lastItem1m.date);
          // console.log('[PREDICT] วันที่สุดท้ายของ goldTH (1m):', goldLastDate1m, lastItem1m.date);
        }
        
        if (gold1yResponse?.data?.length > 0) {
          const lastItem1y = gold1yResponse.data[gold1yResponse.data.length - 1];
          goldLastDate1y = new Date(lastItem1y.created_at || lastItem1y.date);
          // console.log('[PREDICT] วันที่สุดท้ายของ goldTH (1y):', goldLastDate1y, lastItem1y.date);
        }
        
        // ช่วยแสดงข้อมูลเพื่อตรวจสอบ
        // if (goldAllResponse?.data?.length > 0) {
        //   console.log('[PREDICT] ข้อมูล goldTH วันแรก (all):', goldAllResponse.data[0]);
        //   console.log('[PREDICT] ข้อมูล goldTH วันสุดท้าย (all):', goldAllResponse.data[goldAllResponse.data.length - 1]);
        // }
        
        // เตรียมข้อมูล prediction ทั้งหมด
        const predictLabels = response.data.labels;
        const predictData = response.data.data;
        
        // กรองข้อมูล prediction ทั้งหมด (all)
        // กรณี all ให้แสดง goldpredict ทั้งหมด ไม่ต้อง slice
        predict_data_all = {
          labels: predictLabels,
          data: predictData
        };
        
        // ----- สำหรับ 7 วัน -----
        let startIdx7d = 0;
        let gold7dStartDate = null;
        if (gold7dResponse?.data?.length > 0) {
          const firstItem7d = gold7dResponse.data[0];
          gold7dStartDate = new Date(firstItem7d.created_at || firstItem7d.date);
          // หา index ของวันที่ใน predict ที่ตรงกับ startDate ของ goldth 7d
          startIdx7d = predictLabels.findIndex(dateStr => {
            const predictDate = new Date(dateStr);
            // เทียบแค่วันที่ (ไม่เอาเวลา)
            return predictDate.toISOString().split('T')[0] === gold7dStartDate.toISOString().split('T')[0];
          });
          if (startIdx7d === -1) {
            // ถ้าไม่เจอวันที่ตรงกัน ไม่เติม dummy ให้แสดงเฉพาะข้อมูลที่มีใน predict เท่านั้น
            predict_data_7d = {
              labels: [],
              data: []
            };
          } else {
            predict_data_7d = {
              labels: predictLabels.slice(startIdx7d),
              data: predictData.slice(startIdx7d, startIdx7d + predictLabels.slice(startIdx7d).length)
            };
          }
        } else {
          // fallback เดิม
          predict_data_7d = {
            labels: predictLabels.slice(-7),
            data: predictData.slice(-7)
          };
        }

        // ----- สำหรับ 1 เดือน -----
        let startIdx1m = 0;
        let gold1mStartDate = null;
        if (gold1mResponse?.data?.length > 0) {
          const firstItem1m = gold1mResponse.data[0];
          gold1mStartDate = new Date(firstItem1m.created_at || firstItem1m.date);
          startIdx1m = predictLabels.findIndex(dateStr => {
            const predictDate = new Date(dateStr);
            return predictDate.toISOString().split('T')[0] === gold1mStartDate.toISOString().split('T')[0];
          });
          if (startIdx1m === -1) {
            predict_data_1m = {
              labels: [],
              data: []
            };
          } else {
            // Slice ตั้งแต่ startIdx1m ถึงสุดท้ายของ prediction
            predict_data_1m = {
              labels: predictLabels.slice(startIdx1m),
              data: predictData.slice(startIdx1m)
            };
          }
        } else {
          predict_data_1m = {
            labels: [],
            data: []
          };
        }

        // ----- สำหรับ 1 ปี -----
        let startIdx1y = 0;
        let gold1yStartDate = null;
        if (gold1yResponse?.data?.length > 0) {
          const firstItem1y = gold1yResponse.data[0];
          gold1yStartDate = new Date(firstItem1y.created_at || firstItem1y.date);
          startIdx1y = predictLabels.findIndex(dateStr => {
            const predictDate = new Date(dateStr);
            return predictDate.toISOString().split('T')[0] === gold1yStartDate.toISOString().split('T')[0];
          });
          if (startIdx1y === -1) {
            predict_data_1y = {
              labels: [],
              data: []
            };
          } else {
            predict_data_1y = {
              labels: predictLabels.slice(startIdx1y),
              data: predictData.slice(startIdx1y)
            };
          }
        } else {
          predict_data_1y = {
            labels: [],
            data: []
          };
        }
      } catch (filterError) {
        console.error('[PREDICT] เกิดข้อผิดพลาดในการกรองข้อมูล:', filterError);
        // หากเกิดข้อผิดพลาด ใช้ข้อมูลทั้งหมดแทน
        predict_data_7d = {
          labels: response.data.labels.slice(-7),
          data: response.data.data.slice(-7)
        };
        predict_data_1m = {
          labels: response.data.labels.slice(-30),
          data: response.data.data.slice(-30)
        };
        predict_data_1y = {
          labels: response.data.labels.slice(-365),
          data: response.data.data.slice(-365)
        };
      }
      // console.log('[PREDICT] 1 ปีล่าสุด:', {
      //   labels_count: predict_data_1y.labels.length,
      //   data_count: predict_data_1y.data.length
      // });
      
      // เพิ่มข้อมูลตัวแปรต่างๆ ลงใน response
      response.data.predict_data_all = predict_data_all;
      response.data.predict_data_7d = predict_data_7d;
      response.data.predict_data_1m = predict_data_1m;
      response.data.predict_data_1y = predict_data_1y;
    } else {
      console.error('[PREDICT] ข้อมูลไม่ตรงกับโครงสร้างที่คาดหวัง:', response.data);
    }
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