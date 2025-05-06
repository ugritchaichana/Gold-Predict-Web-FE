import React, { useState, useEffect, useCallback } from 'react';
import { subDays } from 'date-fns';

import GoldChart from './GoldChart';
import DateRangePickerTH from './Components/DateRangePickerTH';
import SettingsDialog from './Components/SettingsDialog';
import { fetchPredictionData, fetchGoldData } from './Data/fetchData';
import { transformGoldData, transformPredictionData } from './Data/manageData';
import CurrentTime from './Components/CurrentTime';
/**
 * หน้าหลักแสดงข้อมูลราคาทองไทย
 */
const GoldTH = () => {
  // States
  const [goldData, setGoldData] = useState(null);
  const [predictionData, setPredictionData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedModel, setSelectedModel] = useState(7);  const [dateRange, setDateRange] = useState({
    startDate: subDays(new Date(), 30), // Default: 30 วันย้อนหลัง
    endDate: new Date(),
  });
  const [activeDateOption, setActiveDateOption] = useState('1M'); // Track active date preset
  // No need to track custom range anymore with TradingView style
  const [selections, setSelections] = useState({
    barBuy: true,
    barSell: false,
    ornamentBuy: false,
    ornamentSell: false,
    priceChange: true,
    prediction: true,  });
  // โหลดข้อมูลทั้งหมดและใช้ช่วงวันสำหรับการซูม
  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      // ดึงข้อมูลราคาทองทั้งหมด ไม่ใช้ช่วงวัน
      const goldResponse = await fetchGoldData();
      
      const transformedGoldData = transformGoldData(goldResponse);
      setGoldData(transformedGoldData);
        // No need to track oldest date since we're loading all data at once
      
      // ดึงข้อมูล prediction
      const predictionResponse = await fetchPredictionData(selectedModel);
      const transformedPredictionData = transformPredictionData(predictionResponse);
      setPredictionData(transformedPredictionData);
    } catch (err) {
      console.error('Error loading data:', err);
      setError('Failed to load data. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, [selectedModel]);
  // ไม่มีการโหลดข้อมูลเพิ่มเติม เนื่องจากโหลดข้อมูลทั้งหมดมาแล้ว
  const loadMoreHistoricalData = useCallback(() => {
    // This function is now essentially a no-op since we load all data at once
    // We keep it to maintain API compatibility with the GoldChart component
    console.log("Data already loaded fully - no need to load more");
  }, []);

  // โหลดข้อมูลเมื่อ Component โหลดครั้งแรก และเมื่อช่วงวัน หรือ model เปลี่ยน
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Toggle ตัวเลือกสำหรับแสดง/ซ่อนชุดข้อมูลต่างๆ
  const handleToggleSelection = (key) => {
    setSelections(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };  // เปลี่ยนช่วงวันที่
  const handleDateRangeChange = (start, end) => {
    if (start && end) {
      setDateRange({
        startDate: start,
        endDate: end
      });
    } else {
      // กรณีล้างการเลือก (Clear) หรือข้อมูลไม่ถูกต้อง
      // กลับไปที่ค่าเริ่มต้น (30 วันย้อนหลัง)
      setDateRange({
        startDate: subDays(new Date(), 30),
        endDate: new Date()
      });
      console.log("Reset to default range (30 days)");
    }
  };

  // เปลี่ยน Model
  const handleModelChange = (modelNumber) => {
    setSelectedModel(modelNumber);
  };  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl tradingview-style">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold text-gray-800">Thai Gold Price Chart</h1>
        <div className="flex items-center space-x-2">
          {/* <DateRangePickerTH 
            currentRange={{ from: dateRange.startDate, to: dateRange.endDate }}
            activeOption={activeDateOption}  
            onRangeChange={(range, option) => {
              if (range) {
                handleDateRangeChange(range.from, range.to);
              } else {
                handleDateRangeChange(null, null);
              }
              setActiveDateOption(option);
            }}
          /> */}
        </div>
      </div>
      
      {loading && (
        <div className="bg-blue-50 border-l-4 border-blue-400 text-blue-700 px-4 py-2 rounded mb-4 text-sm flex items-center">
          <svg className="animate-spin h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Loading data...
        </div>
      )}
      
      {error ? (
        <div className="bg-red-50 border-l-4 border-red-400 text-red-700 px-4 py-2 rounded mb-4 text-sm">
          {error}
        </div>
      ) : null}
        {/* Chart Section with TradingView style */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
        <GoldChart 
          goldData={goldData} 
          predictionData={predictionData} 
          selections={selections} 
          onLoadMoreData={loadMoreHistoricalData}
          startDate={dateRange.startDate}
          endDate={dateRange.endDate}
        /> 
        <div className="flex justify-between items-center px-4 py-3 bg-gray-50 border-t border-gray-200">
          {/* Left side - Settings */}
          <div>
            <SettingsDialog
              selections={selections}
              onToggleSelection={handleToggleSelection}
              selectedModel={selectedModel}
              onModelChange={handleModelChange}
            />
          </div>
          
          {/* Right side - Current Time */}
          <div className="pr-2">
            <CurrentTime />
          </div>
        </div>
      </div>
    </div>
  );
};

export default GoldTH;
