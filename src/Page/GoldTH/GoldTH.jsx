import React, { useState, useEffect, useCallback } from 'react';
import { subDays } from 'date-fns';

import GoldChart from './GoldChart';
import DateRangePickerTH from './Components/DateRangePickerTH';
import SettingsDialog from './Components/SettingsDialog';
import { useGoldThData, usePredictionData, useGoldUsData, useUsdThbData } from './Data/hooks';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import CurrentTime from './Components/CurrentTime';

// Define data categories constants
const DataCategories = {
  GOLD_TH: 'gold_th',
  GOLD_US: 'gold_us',
  USDTHB: 'usd_thb'
};

/**
 * หน้าหลักแสดงข้อมูลราคาทองไทย
 */
const GoldTH = () => {  // States
  const [goldData, setGoldData] = useState(null);
  console.log("Gold Data:", goldData);
  const [goldUsData, setGoldUsData] = useState(null);
  const [usdThbData, setUsdThbData] = useState(null);
  const [predictionData, setPredictionData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);  const [selectedModel, setSelectedModel] = useState(7);
  const [selectedCategory, setSelectedCategory] = useState(DataCategories.GOLD_TH);
  const [dateRange, setDateRange] = useState({
    startDate: subDays(new Date(), 30), // Default: 30 วันย้อนหลัง
    endDate: new Date(),
  });
  const [activeDateOption, setActiveDateOption] = useState('1M'); // Track active date preset
  const [selections, setSelections] = useState({
    barBuy: true,
    barSell: false,
    ornamentBuy: false,
    ornamentSell: false,
    priceChange: false,
    prediction: true,
  });  // ใช้ React Query hooks เพื่อดึงข้อมูล
  const goldThQuery = useGoldThData({
    refetchInterval: 60000 // Refetch every 60 seconds (1 minute)
  });  
  const predictionQuery = usePredictionData(selectedModel, {
    refetchInterval: 300000 // Refetch predictions every 5 minutes
  });
  const goldUsQuery = useGoldUsData({
    refetchInterval: 60000 // Refetch every 60 seconds
  });
  const usdThbQuery = useUsdThbData({
    refetchInterval: 60000 // Refetch every 60 seconds
  });
  
  // ตัวแปร loading และ error รวมจาก queries ทั้งหมด
  useEffect(() => {
    // กำหนดสถานะ loading จาก query ที่กำลังทำงานอยู่
    let isLoading = false;
    let errorMessage = null;
    
    switch (selectedCategory) {
      case DataCategories.GOLD_TH:
        isLoading = goldThQuery.isLoading || predictionQuery.isLoading;
        errorMessage = goldThQuery.error?.message || predictionQuery.error?.message || null;
        break;
      case DataCategories.GOLD_US:
        isLoading = goldUsQuery.isLoading;
        errorMessage = goldUsQuery.error?.message || null;
        break;
      case DataCategories.USDTHB:
        isLoading = usdThbQuery.isLoading;
        errorMessage = usdThbQuery.error?.message || null;
        break;
    }
    
    setLoading(isLoading);
    setError(errorMessage);
    
  }, [
    selectedCategory, 
    goldThQuery.isLoading, goldThQuery.error,
    predictionQuery.isLoading, predictionQuery.error,
    goldUsQuery.isLoading, goldUsQuery.error,
    usdThbQuery.isLoading, usdThbQuery.error
  ]);  // ไม่มีการโหลดข้อมูลเพิ่มเติม เนื่องจากโหลดข้อมูลทั้งหมดมาแล้ว
  const loadMoreHistoricalData = useCallback(() => {
    // This function is now essentially a no-op since we load all data at once
    // We keep it to maintain API compatibility with the GoldChart component
    console.log("Data already loaded fully - no need to load more");
  }, []);
  
  // กำหนดค่าข้อมูลจาก react-query
  useEffect(() => {
    if (goldThQuery.data) {
      setGoldData(goldThQuery.data);
    }
    
    if (predictionQuery.data) {
      setPredictionData(predictionQuery.data);
    }
    
    if (goldUsQuery.data) {
      setGoldUsData(goldUsQuery.data);
    }
    
    if (usdThbQuery.data) {
      setUsdThbData(usdThbQuery.data);
    }
  }, [
    goldThQuery.data,
    predictionQuery.data,
    goldUsQuery.data,
    usdThbQuery.data
  ]);

  // อัปเดตช่วงวันที่เมื่อข้อมูลโหลดเสร็จสมบูรณ์
  useEffect(() => {
    // Only update date range after data is loaded for the selected category
    if (!loading && (
      (selectedCategory === DataCategories.GOLD_TH && goldData) ||
      (selectedCategory === DataCategories.GOLD_US && goldUsData) ||
      (selectedCategory === DataCategories.USDTHB && usdThbData)
    )) {
      // Get the latest date from the data
      const latestDate = getLatestDateFromData();
      
      // Update the date range based on the active date option
      if (activeDateOption === '1M') {
        setDateRange({
          startDate: subDays(latestDate, 30),  // 1 month back from latest date
          endDate: latestDate
        });
      } else if (activeDateOption === '7D') {
        setDateRange({
          startDate: subDays(latestDate, 6),  // 7 days back from latest date
          endDate: latestDate
        });
      } else if (activeDateOption === 'YTD') {
        // Year to date - from January 1 to latest date
        const startOfYear = new Date(latestDate.getFullYear(), 0, 1);
        setDateRange({
          startDate: startOfYear,
          endDate: latestDate
        });
      }
    }
  }, [loading, goldData, goldUsData, usdThbData, selectedCategory, activeDateOption]);

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
      // กลับไปที่ค่าเริ่มต้น (30 วันย้อนหลังจากวันที่ล่าสุดในข้อมูล)
      const latestDate = getLatestDateFromData();
      setDateRange({
        startDate: subDays(latestDate, 30),
        endDate: latestDate
      });
      console.log("Reset to default range (30 days from latest data point)");
    }
  };

  // เปลี่ยน Model
  const handleModelChange = (modelNumber) => {
    setSelectedModel(modelNumber);
  };
  // เปลี่ยน Category
  const handleCategoryChange = (category) => {
    setSelectedCategory(category);
    // Reset selections when changing category
    setSelections({
      barBuy: true,
      barSell: false,
      ornamentBuy: false,
      ornamentSell: false,
      priceChange: false,
      prediction: true,
    });
  };
  
  // Helper function to get the latest date from dataset
  const getLatestDateFromData = () => {
    switch (selectedCategory) {
      case DataCategories.GOLD_TH:
        if (goldData && goldData.timestamps && goldData.timestamps.length > 0) {
          const latestTimestamp = Math.max(...goldData.timestamps.map(point => point.time));
          return new Date(latestTimestamp * 1000);
        }
        break;
      case DataCategories.GOLD_US:
        if (goldUsData && goldUsData.timestamps && goldUsData.timestamps.length > 0) {
          const latestTimestamp = Math.max(...goldUsData.timestamps.map(point => point.time));
          return new Date(latestTimestamp * 1000);
        }
        break;
      case DataCategories.USDTHB:
        if (usdThbData && usdThbData.timestamps && usdThbData.timestamps.length > 0) {
          const latestTimestamp = Math.max(...usdThbData.timestamps.map(point => point.time));
          return new Date(latestTimestamp * 1000);
        }
        break;
    }
    return new Date(); // Default to current date if no data available
  };
  
  // Helper function to get the earliest date from dataset
  const getEarliestDateFromData = () => {
    switch (selectedCategory) {
      case DataCategories.GOLD_TH:
        if (goldData && goldData.timestamps && goldData.timestamps.length > 0) {
          const earliestTimestamp = Math.min(...goldData.timestamps.map(point => point.time));
          return new Date(earliestTimestamp * 1000);
        }
        break;
      case DataCategories.GOLD_US:
        if (goldUsData && goldUsData.timestamps && goldUsData.timestamps.length > 0) {
          const earliestTimestamp = Math.min(...goldUsData.timestamps.map(point => point.time));
          return new Date(earliestTimestamp * 1000);
        }
        break;
      case DataCategories.USDTHB:
        if (usdThbData && usdThbData.timestamps && usdThbData.timestamps.length > 0) {
          const earliestTimestamp = Math.min(...usdThbData.timestamps.map(point => point.time));
          return new Date(earliestTimestamp * 1000);
        }
        break;
    }
    return new Date(2020, 0, 1); // Default to January 1, 2020 if no data available
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl tradingview-style">      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-gray-800">Financial Data Chart</h1>
          <Select value={selectedCategory} onValueChange={handleCategoryChange}>
            <SelectTrigger className="w-[180px] h-9 border border-gray-200 shadow-sm">
              <SelectValue placeholder="Select data category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={DataCategories.GOLD_TH}>ทองคำไทย (Gold TH)</SelectItem>
              <SelectItem value={DataCategories.GOLD_US}>ทองคำสากล (Gold US)</SelectItem>
              <SelectItem value={DataCategories.USDTHB}>อัตราแลกเปลี่ยน USD/THB</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center space-x-2">
          <DateRangePickerTH 
            currentRange={{ from: dateRange.startDate, to: dateRange.endDate }}
            activeOption={activeDateOption}
            latestDate={getLatestDateFromData()}
            earliestDate={getEarliestDateFromData()}
            onRangeChange={(range, option) => {
              if (range) {
                handleDateRangeChange(range.from, range.to);
              } else {
                handleDateRangeChange(null, null);
              }
              setActiveDateOption(option);
            }}
          />
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
          goldData={selectedCategory === DataCategories.GOLD_TH ? goldData : null} 
          goldUsData={selectedCategory === DataCategories.GOLD_US ? goldUsData : null}
          usdThbData={selectedCategory === DataCategories.USDTHB ? usdThbData : null}
          predictionData={selectedCategory === DataCategories.GOLD_TH ? predictionData : []}
          category={selectedCategory}
          selections={selections} 
          onLoadMoreData={loadMoreHistoricalData}
          startDate={dateRange.startDate}
          endDate={dateRange.endDate}
        />
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-gray-50 to-gray-100 border-t border-gray-200">
          {/* Left side - Chart Display */}
          <div className="flex items-center gap-1 md:gap-4">
            <div className="flex items-center">
              <span className="text-sm font-medium text-gray-700 mr-3">Chart Display</span>
              <div className="h-5 w-[1px] bg-gray-300 mr-3"></div>
            </div>
            
            <div className="flex flex-wrap gap-1 md:gap-2">
              {/* Gold TH specific controls */}
              {selectedCategory === DataCategories.GOLD_TH && (
                <>
                  {/* Checkbox for Prediction */}
                  <div 
                    className={`flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer transition-colors ${selections.prediction ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-100'}`}
                    onClick={() => handleToggleSelection('prediction')}
                  >
                    <div className={`flex h-4 w-4 items-center justify-center rounded border ${selections.prediction ? 'bg-blue-500 border-blue-500' : 'border-gray-300'}`}>
                      {selections.prediction && (
                        <svg width="10" height="10" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M11.4669 3.72684C11.7558 3.91574 11.8369 4.30308 11.648 4.59198L7.39799 11.092C7.29783 11.2452 7.13556 11.3467 6.95402 11.3699C6.77247 11.3931 6.58989 11.3355 6.45446 11.2124L3.70446 8.71241C3.44905 8.48022 3.43023 8.08494 3.66242 7.82953C3.89461 7.57412 4.28989 7.55529 4.5453 7.78749L6.75292 9.79441L10.6018 3.90792C10.7907 3.61902 11.178 3.53795 11.4669 3.72684Z" fill="white" fillRule="evenodd" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                    <span className="text-sm select-none">Prediction</span>
                  </div>

                  {/* Checkbox for Bar Buy */}
                  <div 
                    className={`flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer transition-colors ${selections.barBuy ? 'bg-amber-50 text-amber-800' : 'hover:bg-gray-100'}`}
                    onClick={() => handleToggleSelection('barBuy')}
                  >
                    <div className={`flex h-4 w-4 items-center justify-center rounded border ${selections.barBuy ? 'bg-amber-500 border-amber-500' : 'border-gray-300'}`}>
                      {selections.barBuy && (
                        <svg width="10" height="10" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M11.4669 3.72684C11.7558 3.91574 11.8369 4.30308 11.648 4.59198L7.39799 11.092C7.29783 11.2452 7.13556 11.3467 6.95402 11.3699C6.77247 11.3931 6.58989 11.3355 6.45446 11.2124L3.70446 8.71241C3.44905 8.48022 3.43023 8.08494 3.66242 7.82953C3.89461 7.57412 4.28989 7.55529 4.5453 7.78749L6.75292 9.79441L10.6018 3.90792C10.7907 3.61902 11.178 3.53795 11.4669 3.72684Z" fill="white" fillRule="evenodd" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                    <span className="text-sm select-none">Bar Buy</span>
                  </div>

                  {/* Checkbox for Bar Sell */}
                  <div 
                    className={`flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer transition-colors ${selections.barSell ? 'bg-amber-50 text-amber-900' : 'hover:bg-gray-100'}`}
                    onClick={() => handleToggleSelection('barSell')}
                  >
                    <div className={`flex h-4 w-4 items-center justify-center rounded border ${selections.barSell ? 'bg-amber-700 border-amber-700' : 'border-gray-300'}`}>
                      {selections.barSell && (
                        <svg width="10" height="10" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M11.4669 3.72684C11.7558 3.91574 11.8369 4.30308 11.648 4.59198L7.39799 11.092C7.29783 11.2452 7.13556 11.3467 6.95402 11.3699C6.77247 11.3931 6.58989 11.3355 6.45446 11.2124L3.70446 8.71241C3.44905 8.48022 3.43023 8.08494 3.66242 7.82953C3.89461 7.57412 4.28989 7.55529 4.5453 7.78749L6.75292 9.79441L10.6018 3.90792C10.7907 3.61902 11.178 3.53795 11.4669 3.72684Z" fill="white" fillRule="evenodd" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                    <span className="text-sm select-none">Bar Sell</span>
                  </div>

                  {/* Checkbox for Ornament Buy */}
                  <div 
                    className={`flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer transition-colors ${selections.ornamentBuy ? 'bg-teal-50 text-teal-700' : 'hover:bg-gray-100'}`}
                    onClick={() => handleToggleSelection('ornamentBuy')}
                  >
                    <div className={`flex h-4 w-4 items-center justify-center rounded border ${selections.ornamentBuy ? 'bg-teal-500 border-teal-500' : 'border-gray-300'}`}>
                      {selections.ornamentBuy && (
                        <svg width="10" height="10" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M11.4669 3.72684C11.7558 3.91574 11.8369 4.30308 11.648 4.59198L7.39799 11.092C7.29783 11.2452 7.13556 11.3467 6.95402 11.3699C6.77247 11.3931 6.58989 11.3355 6.45446 11.2124L3.70446 8.71241C3.44905 8.48022 3.43023 8.08494 3.66242 7.82953C3.89461 7.57412 4.28989 7.55529 4.5453 7.78749L6.75292 9.79441L10.6018 3.90792C10.7907 3.61902 11.178 3.53795 11.4669 3.72684Z" fill="white" fillRule="evenodd" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                    <span className="text-sm select-none">Ornament Buy</span>
                  </div>

                  {/* Checkbox for Ornament Sell */}
                  <div 
                    className={`flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer transition-colors ${selections.ornamentSell ? 'bg-purple-50 text-purple-700' : 'hover:bg-gray-100'}`}
                    onClick={() => handleToggleSelection('ornamentSell')}
                  >
                    <div className={`flex h-4 w-4 items-center justify-center rounded border ${selections.ornamentSell ? 'bg-purple-500 border-purple-500' : 'border-gray-300'}`}>
                      {selections.ornamentSell && (
                        <svg width="10" height="10" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M11.4669 3.72684C11.7558 3.91574 11.8369 4.30308 11.648 4.59198L7.39799 11.092C7.29783 11.2452 7.13556 11.3467 6.95402 11.3699C6.77247 11.3931 6.58989 11.3355 6.45446 11.2124L3.70446 8.71241C3.44905 8.48022 3.43023 8.08494 3.66242 7.82953C3.89461 7.57412 4.28989 7.55529 4.5453 7.78749L6.75292 9.79441L10.6018 3.90792C10.7907 3.61902 11.178 3.53795 11.4669 3.72684Z" fill="white" fillRule="evenodd" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                    <span className="text-sm select-none">Ornament Sell</span>
                  </div>

                  {/* Checkbox for Price Change */}
                  <div 
                    className={`flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer transition-colors ${selections.priceChange ? 'bg-green-50 text-green-700' : 'hover:bg-gray-100'}`}
                    onClick={() => handleToggleSelection('priceChange')}
                  >
                    <div className={`flex h-4 w-4 items-center justify-center rounded border ${selections.priceChange ? 'bg-green-500 border-green-500' : 'border-gray-300'}`}>
                      {selections.priceChange && (
                        <svg width="10" height="10" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M11.4669 3.72684C11.7558 3.91574 11.8369 4.30308 11.648 4.59198L7.39799 11.092C7.29783 11.2452 7.13556 11.3467 6.95402 11.3699C6.77247 11.3931 6.58989 11.3355 6.45446 11.2124L3.70446 8.71241C3.44905 8.48022 3.43023 8.08494 3.66242 7.82953C3.89461 7.57412 4.28989 7.55529 4.5453 7.78749L6.75292 9.79441L10.6018 3.90792C10.7907 3.61902 11.178 3.53795 11.4669 3.72684Z" fill="white" fillRule="evenodd" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                    <span className="text-sm select-none">Price Change</span>
                  </div>
                </>
              )}
              
              {/* Gold US specific controls */}
              {selectedCategory === DataCategories.GOLD_US && (
                <>
                  <div 
                    className={`flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer transition-colors bg-yellow-50 text-yellow-800`}
                  >
                    <div className={`flex h-4 w-4 items-center justify-center rounded border bg-yellow-500 border-yellow-500`}>
                      <svg width="10" height="10" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M11.4669 3.72684C11.7558 3.91574 11.8369 4.30308 11.648 4.59198L7.39799 11.092C7.29783 11.2452 7.13556 11.3467 6.95402 11.3699C6.77247 11.3931 6.58989 11.3355 6.45446 11.2124L3.70446 8.71241C3.44905 8.48022 3.43023 8.08494 3.66242 7.82953C3.89461 7.57412 4.28989 7.55529 4.5453 7.78749L6.75292 9.79441L10.6018 3.90792C10.7907 3.61902 11.178 3.53795 11.4669 3.72684Z" fill="white" fillRule="evenodd" clipRule="evenodd" />
                      </svg>
                    </div>
                    <span className="text-sm select-none">Gold Price (USD)</span>
                  </div>
                </>
              )}
              
              {/* USD/THB specific controls */}
              {selectedCategory === DataCategories.USDTHB && (
                <>
                  <div 
                    className={`flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer transition-colors bg-blue-50 text-blue-800`}
                  >
                    <div className={`flex h-4 w-4 items-center justify-center rounded border bg-blue-500 border-blue-500`}>
                      <svg width="10" height="10" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M11.4669 3.72684C11.7558 3.91574 11.8369 4.30308 11.648 4.59198L7.39799 11.092C7.29783 11.2452 7.13556 11.3467 6.95402 11.3699C6.77247 11.3931 6.58989 11.3355 6.45446 11.2124L3.70446 8.71241C3.44905 8.48022 3.43023 8.08494 3.66242 7.82953C3.89461 7.57412 4.28989 7.55529 4.5453 7.78749L6.75292 9.79441L10.6018 3.90792C10.7907 3.61902 11.178 3.53795 11.4669 3.72684Z" fill="white" fillRule="evenodd" clipRule="evenodd" />
                      </svg>
                    </div>
                    <span className="text-sm select-none">USD/THB Rate</span>
                  </div>
                </>
              )}
            </div>
          </div>
          <div className="flex items-center">
            {selectedCategory === DataCategories.GOLD_TH && (
              <>
                <div className="flex items-center space-x-2">
                  <div className="h-5 w-[1px] bg-gray-300 mr-3"></div>
                  <span className="text-sm font-medium text-gray-700">Predict Model</span>
                </div>
                <div className="relative ml-3">
                  <select 
                    value={selectedModel} 
                    onChange={(e) => handleModelChange(Number(e.target.value))}
                    className="appearance-none bg-white border border-gray-200 shadow-sm rounded-lg pl-3 pr-9 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 cursor-pointer transition-all hover:border-indigo-300"
                  >
                    <option value={1}>Model 1</option>
                    <option value={2}>Model 2</option>
                    <option value={3}>Model 3</option>
                    <option value={4}>Model 4</option>
                    <option value={5}>Model 5</option>
                    <option value={6}>Model 6</option>
                    <option value={7}>Model 7</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-indigo-500 bg-gradient-to-r from-transparent to-white/90 rounded-r-lg">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="m6 9 6 6 6-6"/>
                    </svg>
                  </div>
                </div>
              </>
            )}
            {(selectedCategory === DataCategories.GOLD_US || selectedCategory === DataCategories.USDTHB) && (
              <div className="flex items-center">
                <div className="h-5 w-[1px] bg-gray-300 mr-3"></div>
                <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700">
                  {selectedCategory === DataCategories.GOLD_US ? "Gold price data from global markets" : "Exchange rate data USD to THB"}
                </span>
              </div>
            )}
          </div>
        </div>
        </div>
    </div>
  );
};

export default GoldTH;
