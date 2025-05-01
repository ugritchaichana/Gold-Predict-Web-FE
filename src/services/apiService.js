import axios from 'axios';
import { getBaseUrl } from '@/config/apiConfig';

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
    const maxParam = (timeframe === '1y' || timeframe === 'all') ? '&max=100' : '';
    const response = await axios.get(`${BASE_URL}/finnomenaGold/get-gold-data/?db_choice=0&frame=${timeframe}&display=chart${maxParam}`);
    // console.log(`GoldTH : ${BASE_URL}/finnomenaGold/get-gold-data/?db_choice=0&frame=${timeframe}&display=chart`);
    
    if (response.data && response.data.status === "success" && response.data.data) {
      const labels = response.data.data.labels || [];
      const datasets = response.data.data.datasets || [];
      
      const dateIndex = datasets.findIndex(ds => ds.label === "Date");
      const priceIndex = datasets.findIndex(ds => ds.label === "Price");
      const createdAtIndex = datasets.findIndex(ds => ds.label === "Created At");
      const barSellPriceIndex = datasets.findIndex(ds => ds.label === "Bar Sell Price");
      const barPriceChangeIndex = datasets.findIndex(ds => ds.label === "Bar Price Change");
      const ornamentBuyPriceIndex = datasets.findIndex(ds => ds.label === "Ornament Buy Price");
      const ornamentSellPriceIndex = datasets.findIndex(ds => ds.label === "Ornament Sell Price");
      
      let transformedData = {
        status: response.data.status,
        data: labels.map((label, idx) => ({
          date: dateIndex >= 0 ? datasets[dateIndex].data[idx] : label,
          price: priceIndex >= 0 ? datasets[priceIndex].data[idx] : null,
          created_at: createdAtIndex >= 0 ? datasets[createdAtIndex].data[idx] : null,
          bar_sell_price: barSellPriceIndex >= 0 ? datasets[barSellPriceIndex].data[idx] : null,
          bar_price_change: barPriceChangeIndex >= 0 ? datasets[barPriceChangeIndex].data[idx] : null,
          ornament_buy_price: ornamentBuyPriceIndex >= 0 ? datasets[ornamentBuyPriceIndex].data[idx] : null,
          ornament_sell_price: ornamentSellPriceIndex >= 0 ? datasets[ornamentSellPriceIndex].data[idx] : null
        })).filter(item => item.price !== null)
      };

      transformedData.data = transformedData.data.sort((a, b) => new Date(a.created_at || a.date) - new Date(b.created_at || b.date));
      
      if (response.data.start_date) {
        transformedData.start_date = response.data.start_date;
      }
      if (response.data.end_date) {
        transformedData.end_date = response.data.end_date;
      }
      
      return transformedData;
    }    
    return response.data;
  } catch (error) {
    console.error('Error fetching Gold TH data:', error);
    throw error;
  }
};

export const fetchGoldUS = async (timeframe = 'all') => {
  try {
    const BASE_URL = getBaseUrl();
    const maxParam = (timeframe === '1y' || timeframe === 'all') ? '&max=50' : '';
    const response = await axios.get(`${BASE_URL}/finnomenaGold/get-gold-data/?db_choice=1&frame=${timeframe}&display=chart${maxParam}`);
    
    if (response.data && response.data.status === "success" && response.data.data) {
      const labels = response.data.data.labels || [];
      const datasets = response.data.data.datasets || [];
      const dateIndex = datasets.findIndex(ds => ds.label === "Date");
      const priceIndex = datasets.findIndex(ds => ds.label === "Price");
      const createdAtIndex = datasets.findIndex(ds => ds.label === "Created At");
      const closePriceIndex = datasets.findIndex(ds => ds.label === "Close Price");
      const highPriceIndex = datasets.findIndex(ds => ds.label === "High Price");
      const lowPriceIndex = datasets.findIndex(ds => ds.label === "Low Price");
      const volumeIndex = datasets.findIndex(ds => ds.label === "Volume");
      const vwaIndex = datasets.findIndex(ds => ds.label === "Volume Weighted Average");
      const transactionsIndex = datasets.findIndex(ds => ds.label === "Number of Transactions");
      const transformedData = {
        status: response.data.status,
        data: labels.map((label, idx) => ({
          date: dateIndex >= 0 ? datasets[dateIndex].data[idx] : label,
          price: priceIndex >= 0 ? datasets[priceIndex].data[idx] : null,
          created_at: createdAtIndex >= 0 ? datasets[createdAtIndex].data[idx] : null,
          close_price: closePriceIndex >= 0 ? datasets[closePriceIndex].data[idx] : null,
          high_price: highPriceIndex >= 0 ? datasets[highPriceIndex].data[idx] : null,
          low_price: lowPriceIndex >= 0 ? datasets[lowPriceIndex].data[idx] : null,
          volume: volumeIndex >= 0 ? datasets[volumeIndex].data[idx] : null,
          volume_weighted_average: vwaIndex >= 0 ? datasets[vwaIndex].data[idx] : null,
          number_of_transactions: transactionsIndex >= 0 ? datasets[transactionsIndex].data[idx] : null
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
    
    return response.data;
  } catch (error) {
    console.error('Error fetching Gold US data:', error);
    throw error;
  }
};

export const fetchUSDTHB = async (timeframe = 'all') => {
  try {
    const BASE_URL = getBaseUrl();
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
    
    return response.data;
  } catch (error) {
    console.error('Error fetching USDTHB data:', error);
    throw error;
  }
};

export const fetchPredictionsWithParams = async (params = {}) => {
  try {
    const BASE_URL = getBaseUrl();
    const model = params.model || '1';
    const fullUrl = `${BASE_URL}/predicts/week/get_week?display=chart&model=${model}`;
    
    const response = await axios.get(fullUrl);
    
    let predict_data_all = {};
    let predict_data_7d = {};
    let predict_data_1m = {};
    let predict_data_1y = {};
      if (response.data && response.data.labels && response.data.data) {
      
      predict_data_all = {
        labels: response.data.labels,
        data: response.data.data
      };
      try {
        const goldAllResponse = await fetchGoldTH('all');
        const gold7dResponse = await fetchGoldTH('7d');
        const gold1mResponse = await fetchGoldTH('1m');
        const gold1yResponse = await fetchGoldTH('1y');
        
        let goldLastDateAll = null;
        let goldLastDate7d = null;
        let goldLastDate1m = null;
        let goldLastDate1y = null;
        
        if (goldAllResponse?.data?.length > 0) {
          const lastItemAll = goldAllResponse.data[goldAllResponse.data.length - 1];
          goldLastDateAll = new Date(lastItemAll.created_at || lastItemAll.date);
        }
        
        if (gold7dResponse?.data?.length > 0) {
          const lastItem7d = gold7dResponse.data[gold7dResponse.data.length - 1];
          goldLastDate7d = new Date(lastItem7d.created_at || lastItem7d.date);
        }
        
        if (gold1mResponse?.data?.length > 0) {
          const lastItem1m = gold1mResponse.data[gold1mResponse.data.length - 1];
          goldLastDate1m = new Date(lastItem1m.created_at || lastItem1m.date);
        }
        
        if (gold1yResponse?.data?.length > 0) {
          const lastItem1y = gold1yResponse.data[gold1yResponse.data.length - 1];
          goldLastDate1y = new Date(lastItem1y.created_at || lastItem1y.date);
        }
        const predictLabels = response.data.labels;
        const predictData = response.data.data;
        
        predict_data_all = {
          labels: predictLabels,
          data: predictData
        };
        
        let startIdx7d = 0;
        let gold7dStartDate = null;
        if (gold7dResponse?.data?.length > 0) {
          const firstItem7d = gold7dResponse.data[0];
          gold7dStartDate = new Date(firstItem7d.created_at || firstItem7d.date);
          startIdx7d = predictLabels.findIndex(dateStr => {
            const predictDate = new Date(dateStr);
            return predictDate.toISOString().split('T')[0] === gold7dStartDate.toISOString().split('T')[0];
          });
          if (startIdx7d === -1) {
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
          predict_data_7d = {
            labels: predictLabels.slice(-7),
            data: predictData.slice(-7)
          };
        }

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
    // console.log(`${BASE_URL}/predicts/month/read_all`);
    return response.data;
  } catch (error) {
    console.error('Error fetching Prediction data:', error);
    throw error;
  }
};

export const fetchPredictionWeekWithSingleDate = async (date) => {
  if (!date) {
    throw new Error('Date parameter is required for fetchPredictionWeekWithSingleDate');
  }
  try {
    const BASE_URL = getBaseUrl();
    // Use the provided date parameter in the URL  
    // console.log(`${BASE_URL}/predicts/week/select_predict?date=${date}&display=chart`);  
    // const response = await axios.get(`${BASE_URL}/predicts/week/select_predict?date=${date}`);
    const response = await axios.get(`${BASE_URL}/predicts/week/select_predict?date=${date}&display=chart`);
    // const response = await axios.get(`${BASE_URL}/predicts/week/read/?display=chart&date=${date}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching Prediction data for date ${date}:`, error);
    throw error;
  }
};

export const fetchPredictionWeekDate = async () => {
  try {
    const BASE_URL = getBaseUrl();
    const response = await axios.get(`${BASE_URL}/predicts/week/get_predict_date`);
    // console.log('fetchPredictionWeekDate response.data', response.data);
    
    return response.data;
  } catch (error) {
    console.error('Error fetching Prediction week dates:', error);
    throw error;
  }
};