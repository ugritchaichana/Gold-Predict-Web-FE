import { useState, useEffect } from 'react';
import { fetchGoldTH, fetchGoldUS, fetchUSDTHB, fetchPredictionsWithParams, fetchPredictionsMonth } from '@/services/apiService';
import { subDays, subMonths, subYears, format as formatDateFns } from 'date-fns';

// Custom hook สำหรับการดึงข้อมูล Gold Chart
export const useGoldChartData = (selectedCategory, timeframe, selectedModel) => {
  const [goldThData, setGoldThData] = useState([]);
  const [goldUsData, setGoldUsData] = useState([]);
  const [usdthbData, setUsdthbData] = useState([]);
  const [predictData, setPredictData] = useState([]);
  const [monthlyPredictions, setMonthlyPredictions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ดึงข้อมูลการทำนายรายเดือน
  useEffect(() => {
    const fetchMonthlyPredictions = async () => {
      try {
        const response = await fetchPredictionsMonth();
        if (Array.isArray(response)) {
          const sortedData = [...response].sort((a, b) => {
            if (a.timestamp && b.timestamp) {
              return a.timestamp - b.timestamp;
            }
            return new Date(a.date) - new Date(b.date);
          });
          setMonthlyPredictions(sortedData);
        } else if (response.status === 'success' && response.months) {
          const sortedMonths = [...response.months].sort((a, b) => {
            if (a.timestamp && b.timestamp) {
              return a.timestamp - b.timestamp;
            }
            return new Date(a.date) - new Date(b.date);
          });
          setMonthlyPredictions(sortedMonths);
        } else {
          console.warn('Unexpected response format from monthly predictions API:', response);
        }
      } catch (error) {
        console.error('Error fetching monthly predictions:', error);
      }
    };

    fetchMonthlyPredictions();
  }, []);

  // ดึงข้อมูลราคาทอง และการทำนาย
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const today = new Date();
        let startDate = null;
        let endDate = formatDateFns(today, 'yyyy-MM-dd');
        
        switch (timeframe) {
          case '7d':
            startDate = formatDateFns(subDays(today, 7), 'yyyy-MM-dd');
            break;
          case '1m':
            startDate = formatDateFns(subMonths(today, 1), 'yyyy-MM-dd');
            break;
          case '1y':
            startDate = formatDateFns(subYears(today, 1), 'yyyy-MM-dd');
            break;
          default:
            startDate = null;
            endDate = null;
        }

        // ดึงข้อมูลราคา
        let dataResponse;
        if (selectedCategory === 'GOLD_TH') {
          dataResponse = await fetchGoldTH(timeframe);
        } else if (selectedCategory === 'GOLD_US') {
          dataResponse = await fetchGoldUS(timeframe);
        } else if (selectedCategory === 'USDTHB') {
          dataResponse = await fetchUSDTHB(timeframe);
        }
        
        // ดึงข้อมูลการทำนาย
        const predictionsResponse = await fetchPredictionsWithParams({
          model: selectedModel
        });
        
        // จัดการข้อมูลราคา
        if (dataResponse && dataResponse.data) {
          const sortedData = dataResponse.data.sort((a, b) => new Date(a.date) - new Date(b.date));
          
          if (selectedCategory === 'GOLD_TH') {
            setGoldThData(sortedData);
          } else if (selectedCategory === 'GOLD_US') {
            setGoldUsData(sortedData);
          } else if (selectedCategory === 'USDTHB') {
            setUsdthbData(sortedData);
          }
        } else {
          if (selectedCategory === 'GOLD_TH') {
            setGoldThData([]);
          } else if (selectedCategory === 'GOLD_US') {
            setGoldUsData([]);
          } else if (selectedCategory === 'USDTHB') {
            setUsdthbData([]);
          }
        }
        
        // จัดการข้อมูลการทำนาย
        if (predictionsResponse) {
          let predictionData = [];
          let predictions;
          
          if (timeframe === '7d' && predictionsResponse.predict_data_7d) {
            predictions = predictionsResponse.predict_data_7d;
          } else if (timeframe === '1m' && predictionsResponse.predict_data_1m) {
            predictions = predictionsResponse.predict_data_1m;
          } else if (timeframe === '1y' && predictionsResponse.predict_data_1y) {
            predictions = predictionsResponse.predict_data_1y;
          } else if (predictionsResponse.predict_data_all) {
            predictions = predictionsResponse.predict_data_all;
          }
          
          if (predictions && predictions.labels && predictions.data) {
            const createdAt = predictionsResponse.created_at || new Date().toISOString();
            predictionData = predictions.labels.map((date, index) => ({
              date,
              predict: predictions.data[index],
              created_at: createdAt
            }));
            setPredictData(predictionData);
          } else {
            setPredictData([]);
          }
        } else {
          setPredictData([]);
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Error loading data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [timeframe, selectedCategory, selectedModel]);

  // ฟังก์ชันสำหรับดึงราคาล่าสุด
  const getLatestPrice = () => {
    if (loading) return null;
    
    let latestData;
    if (selectedCategory === 'GOLD_TH') {
      latestData = goldThData[goldThData.length - 1];
    } else if (selectedCategory === 'GOLD_US') {
      latestData = goldUsData[goldUsData.length - 1];
    } else if (selectedCategory === 'USDTHB') {
      latestData = usdthbData[usdthbData.length - 1];
    }
    
    return latestData?.price;
  };
  
  // ฟังก์ชันสำหรับดึงราคาก่อนหน้า
  const getPreviousPrice = () => {
    if (loading) return null;
    
    let previousData;
    if (selectedCategory === 'GOLD_TH') {
      previousData = goldThData[goldThData.length - 2];
    } else if (selectedCategory === 'GOLD_US') {
      previousData = goldUsData[goldUsData.length - 2];
    } else if (selectedCategory === 'USDTHB') {
      previousData = usdthbData[usdthbData.length - 2];
    }
    
    return previousData?.price;
  };
  
  // ฟังก์ชันสำหรับดึงวันที่ล่าสุด
  const getLatestDate = () => {
    if (loading) return null;
    
    let latestData;
    if (selectedCategory === 'GOLD_TH') {
      latestData = goldThData[goldThData.length - 1];      
    } else if (selectedCategory === 'GOLD_US') {
      latestData = goldUsData[goldUsData.length - 1];
    } else if (selectedCategory === 'USDTHB') {
      latestData = usdthbData[usdthbData.length - 1];
    }
    
    if (!latestData) return null;
    
    const dateValue = latestData.created_at || latestData.date;
    if (!dateValue) return null;
    
    try {
      const date = new Date(dateValue);
      if (isNaN(date.getTime())) {
        console.warn('Invalid date value:', dateValue);
        return null;
      }      
      return date;
    } catch (error) {
      console.error('Error parsing date:', error);
      return null;
    }
  };

  // คำนวณความเปลี่ยนแปลงของราคา
  const calculatePriceChange = () => {
    const latestPrice = getLatestPrice();
    const previousPrice = getPreviousPrice();
    
    if (latestPrice === null || previousPrice === null) return { change: null, percentChange: null };
    
    const change = latestPrice - previousPrice;
    const percentChange = (change / previousPrice) * 100;
    
    return { change, percentChange };
  };

  return {
    goldThData,
    goldUsData,
    usdthbData,
    predictData,
    monthlyPredictions,
    loading,
    error,
    getLatestPrice,
    getPreviousPrice,
    getLatestDate,
    calculatePriceChange
  };
};