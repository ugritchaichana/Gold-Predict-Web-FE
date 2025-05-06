import React, { useEffect, useRef, useState } from 'react';
import { createChart } from 'lightweight-charts';
import { formatDate, formatPriceChange } from './Data/manageData';
import CurrentTime from './Components/CurrentTime';
import PriceDisplay from './Components/PriceDisplay';
import DateRangePickerTH from './Components/DateRangePickerTH';

/**
 * Component หลักสำหรับแสดงกราฟราคาทอง
 */
const GoldChart = ({ goldData, predictionData, selections, onLoadMoreData, startDate, endDate }) => {
  const chartContainerRef = useRef(null);
  const chart = useRef(null);
  const series = useRef({});
  const [hoveredData, setHoveredData] = useState(null);
  const [filteredPredictionData, setFilteredPredictionData] = useState([]);
  const [latestData, setLatestData] = useState(null);
  const [dateRange, setDateRange] = useState({ startDate, endDate });
  const [activeDateOption, setActiveDateOption] = useState('1M');
  
  // Update date range when props change
  useEffect(() => {
    setDateRange({ startDate, endDate });
  }, [startDate, endDate]);// Filter prediction data based on date range and extract latest data for display
  useEffect(() => {
    if (!predictionData || predictionData.length === 0) {
      setFilteredPredictionData([]);
      return;
    }

    // For TradingView style, we always show all prediction data and just zoom the chart
    setFilteredPredictionData(predictionData);
    
  }, [predictionData]);  // Extract latest data for display
  useEffect(() => {
    if (!goldData) return;
    
    try {
      // Handle different goldData formats and safely extract latest data
      let latestGoldData = null;
      
      if (Array.isArray(goldData)) {
        // If goldData is an array, sort it by date
        if (goldData.length > 0) {
          latestGoldData = [...goldData].sort((a, b) => {
            return new Date(b.time || b.date) - new Date(a.time || a.date);
          })[0];
        }
      } else if (typeof goldData === 'object') {
        // If goldData is an object with arrays inside (like goldData.barBuy)
        if (goldData.barBuy && goldData.barBuy.length > 0) {
          const latestIndex = goldData.barBuy.length - 1;
          latestGoldData = {
            date: goldData.dates?.[latestIndex]?.time || new Date(),
            barBuy: goldData.barBuy?.[latestIndex]?.value,
            barSell: goldData.barSell?.[latestIndex]?.value,
            ornamentBuy: goldData.ornamentBuy?.[latestIndex]?.value,
            ornamentSell: goldData.ornamentSell?.[latestIndex]?.value
          };
        }
      }
      
      if (!latestGoldData) return;
      
      // Get latest prediction if available
      let latestPrediction = null;
      if (predictionData && Array.isArray(predictionData) && predictionData.length > 0) {
        latestPrediction = [...predictionData].sort((a, b) => {
          return new Date(b.time || b.date) - new Date(a.time || a.date);
        })[0];
      }
      
      // Combine data for display
      setLatestData({
        date: latestGoldData.time || latestGoldData.date,
        barBuy: latestGoldData.barBuy || latestGoldData.bar_buy,
        barSell: latestGoldData.barSell || latestGoldData.bar_sell,
        ornamentBuy: latestGoldData.ornamentBuy || latestGoldData.ornament_buy,
        ornamentSell: latestGoldData.ornamentSell || latestGoldData.ornament_sell,
        predictedPrice: latestPrediction?.value
      });
    } catch (error) {
      console.error("Error processing gold data:", error);
    }
  }, [goldData, predictionData]);

  // Initialize chart
  useEffect(() => {
    if (!chartContainerRef.current) return;
    
    // Cleanup any existing chart
    if (chart.current) {
      chart.current.remove();
      chart.current = null;
      series.current = {};
    }
      // Create new chart with TradingView-style look
    chart.current = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: 500,
      layout: {
        background: { color: '#ffffff' },
        textColor: '#333',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Trebuchet MS", Roboto, Ubuntu, sans-serif',
      },
      grid: {
        vertLines: { color: 'rgba(42, 46, 57, 0.05)' },
        horzLines: { color: 'rgba(42, 46, 57, 0.05)' },
      },
      timeScale: {
        timeVisible: true,
        secondsVisible: false,
        borderColor: 'rgba(197, 203, 206, 0.4)',
        tickMarkFormatter: (time) => {
          const date = new Date(time * 1000);
          return `${date.getDate()}/${date.getMonth() + 1}`;
        },
        barSpacing: 10,
        fixLeftEdge: true,
        fixRightEdge: true,
        lockVisibleTimeRangeOnResize: true,
      },
      rightPriceScale: {
        borderColor: 'rgba(197, 203, 206, 0.4)',
        scaleMargins: {
          top: 0.1,
          bottom: 0.1,
        },
        autoScale: true,
      },
      crosshair: {
        mode: 1,
        vertLine: {
          width: 1,
          color: '#2962FF',
          style: 1, // Dashed line
          labelBackgroundColor: '#2962FF',
        },
        horzLine: {
          width: 1,
          color: '#2962FF',
          style: 1, // Dashed line
          labelBackgroundColor: '#2962FF',
        },
      },
      handleScroll: {
        mouseWheel: true,
        pressedMouseMove: true,
      },
      handleScale: {
        axisPressedMouseMove: true,
        mouseWheel: true,
        pinch: true,
      },
    });
      // Add series with improved TradingView style
    series.current.barBuy = chart.current.addLineSeries({
      color: '#D4AF37',
      lineWidth: 2,
      title: 'Bar Buy (BB)',
      priceLineVisible: true,
      lastValueVisible: true,
      priceLineWidth: 1,
      priceLineColor: '#D4AF37',
      priceLineStyle: 2, // Dashed
      crosshairMarkerVisible: true,
      crosshairMarkerRadius: 4,
      lineType: 0, // LineType.Simple
    });

    series.current.barSell = chart.current.addLineSeries({
      color: '#8B4513',
      lineWidth: 2,
      title: 'Bar Sell (BS)',
      priceLineVisible: true,
      lastValueVisible: true,
      priceLineWidth: 1,
      priceLineColor: '#8B4513',
      priceLineStyle: 2, // Dashed
      crosshairMarkerVisible: true,
      crosshairMarkerRadius: 4,
      lineType: 0, // LineType.Simple
    });

    series.current.ornamentBuy = chart.current.addLineSeries({
      color: '#00796B',
      lineWidth: 2,
      title: 'Ornament Buy (OB)',
      priceLineVisible: true,
      lastValueVisible: true,
      priceLineWidth: 1,
      priceLineColor: '#00796B',
      priceLineStyle: 2, // Dashed
      crosshairMarkerVisible: true,
      crosshairMarkerRadius: 4,
      lineType: 0, // LineType.Simple
    });

    series.current.ornamentSell = chart.current.addLineSeries({
      color: '#6A1B9A',
      lineWidth: 2,
      title: 'Ornament Sell (OS)',
      priceLineVisible: true,
      lastValueVisible: true,
      priceLineWidth: 1,
      priceLineColor: '#6A1B9A',
      priceLineStyle: 2, // Dashed
      crosshairMarkerVisible: true,
      crosshairMarkerRadius: 4,
      lineType: 0, // LineType.Simple
    });
    
    series.current.prediction = chart.current.addLineSeries({
      color: '#2962FF', // TradingView blue
      lineWidth: 2,
      lineStyle: 1, // Dotted
      title: 'Predict (BP)',
      priceLineVisible: true,
      lastValueVisible: true,
      priceLineWidth: 1,
      priceLineColor: '#2962FF',
      priceLineStyle: 2, // Dashed
      crosshairMarkerVisible: true,
      crosshairMarkerRadius: 5,
      crosshairMarkerBorderColor: '#2962FF',
      crosshairMarkerBackgroundColor: '#ffffff',
      lineType: 0, // LineType.Simple
    });
    
    series.current.priceChange = chart.current.addHistogramSeries({
      color: 'rgba(76, 175, 80, 0.5)', // Green with transparency
      priceFormat: {
        type: 'price',
        precision: 0,
        minMove: 1,
      },
      title: 'Price Change (BC)',
      priceLineVisible: false,
      lastValueVisible: true,
    });
    
    // Handle window resize
    const handleResize = () => {
      if (chart.current && chartContainerRef.current) {
        chart.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
        });
      }
    };
    
    window.addEventListener('resize', handleResize);
    
    // Clean up
    return () => {
      window.removeEventListener('resize', handleResize);
      if (chart.current) {
        chart.current.remove();
        chart.current = null;
      }
    };
  }, []);
  // Update chart data
  useEffect(() => {
    if (!chart.current || !series.current || !goldData) return;
    
    // Update data for each series
    try {      // Process gold data based on its structure
      let barBuyData = [];
      let barSellData = [];
      let ornamentBuyData = [];
      let ornamentSellData = [];
      let barPriceChangeData = [];
      let datesArray = [];
      
      // Check if goldData exists and is valid
      if (!goldData) {
        console.warn("Gold data is null or undefined");
        return;
      }
      
      // Check if goldData is an array or object
      if (Array.isArray(goldData)) {
        // If it's an array, convert each item into the format expected by the chart
        barBuyData = goldData.map(item => {
          if (!item) return null;
          return {
            time: new Date(item.time || item.date).getTime() / 1000,
            value: item.barBuy || item.bar_buy || 0
          };
        }).filter(Boolean); // Remove null items
        
        barSellData = goldData.map(item => {
          if (!item) return null;
          return {
            time: new Date(item.time || item.date).getTime() / 1000,
            value: item.barSell || item.bar_sell || 0
          };
        }).filter(Boolean); // Remove null items
          ornamentBuyData = goldData.map(item => {
          if (!item) return null;
          return {
            time: new Date(item.time || item.date).getTime() / 1000,
            value: item.ornamentBuy || item.ornament_buy || 0
          };
        }).filter(Boolean); // Remove null items
        
        ornamentSellData = goldData.map(item => {
          if (!item) return null;
          return {
            time: new Date(item.time || item.date).getTime() / 1000,
            value: item.ornamentSell || item.ornament_sell || 0
          };
        }).filter(Boolean); // Remove null items
        
        barPriceChangeData = goldData.map(item => {
          if (!item) return null;
          return {
            time: new Date(item.time || item.date).getTime() / 1000,
            value: item.barPriceChange || item.price_change || 0,
            color: (item.barPriceChange || item.price_change || 0) >= 0 ? 'rgba(76, 175, 80, 0.5)' : 'rgba(255, 82, 82, 0.5)'
          };
        }).filter(Boolean); // Remove null items
        
        datesArray = goldData.map(item => {
          if (!item) return null;
          return {
            time: new Date(item.time || item.date).getTime() / 1000,
            date: item.time || item.date
          };
        }).filter(Boolean); // Remove null items
      } else if (typeof goldData === 'object') {
        // If it's an object with arrays, use those arrays directly
        barBuyData = goldData.barBuy || [];
        barSellData = goldData.barSell || [];
        ornamentBuyData = goldData.ornamentBuy || [];
        ornamentSellData = goldData.ornamentSell || [];
        barPriceChangeData = goldData.barPriceChange || [];
        datesArray = goldData.dates || [];
      }
      
      // Update chart with processed data
      series.current.barBuy.setData(barBuyData);
      series.current.barSell.setData(barSellData);
      series.current.ornamentBuy.setData(ornamentBuyData);
      series.current.ornamentSell.setData(ornamentSellData);
      series.current.priceChange.setData(barPriceChangeData);
      
      // Use filtered prediction data instead of all prediction data
      if (filteredPredictionData && filteredPredictionData.length > 0) {
        series.current.prediction.setData(filteredPredictionData);
      }
        // Set initial hover data
      if (!hoveredData) {
        let latestData = null;
        
        if (barBuyData.length > 0) {
          const lastIndex = barBuyData.length - 1;
          latestData = {
            date: datesArray?.[lastIndex]?.date || 'DD-MM-YYYY',
            barBuy: barBuyData[lastIndex].value,
            barSell: barSellData?.[lastIndex]?.value || 0,
            ornamentBuy: ornamentBuyData?.[lastIndex]?.value || 0,
            ornamentSell: ornamentSellData?.[lastIndex]?.value || 0,
            barPriceChange: barPriceChangeData?.[lastIndex]?.value || 0,
            prediction: filteredPredictionData?.[filteredPredictionData.length - 1]?.value || 0,
          };
          setHoveredData(latestData);
        }
      }
      
      // Fit content
      chart.current.timeScale().fitContent();
      
      // Add scroll handler for loading more data
      chart.current.timeScale().subscribeVisibleLogicalRangeChange((range) => {
        if (range && range.from < 5 && onLoadMoreData) {
          onLoadMoreData();
        }
      });
    } catch (error) {
      console.error("Error updating chart data:", error);
    }  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [goldData, predictionData, filteredPredictionData, onLoadMoreData]);  // Handle date range changes by zooming the chart to the selected range
  useEffect(() => {
    if (!chart.current) return;
    
    try {
      if (startDate && endDate) {
        // Validate dates before using them
        const validStartDate = startDate instanceof Date && !isNaN(startDate) ? startDate : new Date();
        const validEndDate = endDate instanceof Date && !isNaN(endDate) ? endDate : new Date();
        
        // Convert startDate and endDate to timestamp format used by the chart
        const startTime = validStartDate.getTime() / 1000;
        const endTime = validEndDate.getTime() / 1000;
        
        // Make sure we have data to display
        if (goldData && Array.isArray(goldData) && goldData.length > 0) {
          // Use built-in LightweightCharts methods for better performance
          chart.current.timeScale().fitContent();
          
          // Find the closest visible indices based on timestamps
          const visibleTimeRange = {
            from: startTime,
            to: endTime
          };
          
          // Apply the time range with animation
          chart.current.timeScale().setVisibleRange(visibleTimeRange, { 
            animation: {
              duration: 500, // Animation duration in milliseconds
              easing: 'easeInOutCubic'
            } 
          });
        } else {
          // If no data, just fit content
          chart.current.timeScale().fitContent();
        }
      } else {
        // If no date range specified, fit all content
        chart.current.timeScale().fitContent();
      }
    } catch (error) {
      console.error("Error setting date range:", error);
    }
  }, [startDate, endDate, goldData]);// Setup crosshair handler in a separate effect to prevent infinite rerenders
  useEffect(() => {
    if (!chart.current) return;
    
    const handleCrosshairMove = (param) => {
      if (
        !param || 
        param.time === undefined || 
        !param.point || 
        param.point.x < 0 || 
        param.point.y < 0
      ) {
        return;
      }
      
      const timestamp = param.time;
      
      // Find closest value helper - with safe handling of various data structures
      const findClosestValue = (dataArray, time) => {
        if (!dataArray || !Array.isArray(dataArray) || dataArray.length === 0) return null;
        
        try {
          const exact = dataArray.find(item => item && item.time === time);
          if (exact) return exact.value;
          
          const closest = dataArray.reduce((prev, curr) => {
            if (!prev || !prev.time) return curr;
            if (!curr || !curr.time) return prev;
            return Math.abs(curr.time - time) < Math.abs(prev.time - time) ? curr : prev;
          });
          
          return closest && closest.value !== undefined ? closest.value : null;
        } catch (error) {
          console.error("Error finding closest value:", error);
          return null;
        }
      };
        // Find date string - safely accessing data structures
      const findDateString = () => {
        // Safety check for goldData
        if (!goldData) return "DD-MM-YYYY";
        
        // First check if goldData is an object with dates array
        if (goldData && goldData.dates && Array.isArray(goldData.dates) && goldData.dates.length > 0) {
          try {
            // Filter out any invalid dates first
            const validDates = goldData.dates.filter(d => d && typeof d === 'object' && d.time !== undefined);
            
            if (validDates.length === 0) return "DD-MM-YYYY";
            
            const dateObj = validDates.find(d => d.time === timestamp);
            if (dateObj) return dateObj.date;
            
            const closestDateObj = validDates.reduce((prev, curr) => {
              return Math.abs(curr.time - timestamp) < Math.abs(prev.time - timestamp) ? curr : prev;
            });
            
            return closestDateObj && closestDateObj.date ? closestDateObj.date : "DD-MM-YYYY";
          } catch (error) {
            console.error("Error finding date string:", error);
            return "DD-MM-YYYY";
          }
        }        // If goldData is an array of objects
        else if (Array.isArray(goldData) && goldData.length > 0) {
          try {
            // Filter out any invalid items
            const validData = goldData.filter(d => d && typeof d === 'object');
            
            if (validData.length === 0) return "DD-MM-YYYY";
            
            const dateObj = validData.find(d => {
              if (!d) return false;
              const itemTime = d.time || (d.date ? new Date(d.date).getTime()/1000 : null);
              return itemTime === timestamp;
            });
            
            if (dateObj) return dateObj.date || dateObj.time || "DD-MM-YYYY";
            
            // If no exact match, find the closest
            try {
              const closestDateObj = validData.reduce((prev, curr) => {
                if (!prev) return curr;
                if (!curr) return prev;
              
                // Safely extract times
                const prevTime = prev.time || (prev.date ? new Date(prev.date).getTime()/1000 : null);
                const currTime = curr.time || (curr.date ? new Date(curr.date).getTime()/1000 : null);
              
                // Skip invalid times
                if (prevTime === null) return curr;
                if (currTime === null) return prev;
              
                return Math.abs(currTime - timestamp) < Math.abs(prevTime - timestamp) ? curr : prev;
              });
              
              if (closestDateObj) {
                return closestDateObj.date || closestDateObj.time || "DD-MM-YYYY";
              }
            } catch (reduceError) {
              console.error("Error in reduce for finding closest date:", reduceError);
              return "DD-MM-YYYY";
            }
            
            return "DD-MM-YYYY";
          } catch (error) {
            console.error("Error finding date in array data:", error);
            return "DD-MM-YYYY";
          }
        }
        
        return "DD-MM-YYYY";
      };
      
      try {
        // Extract data based on the structure of goldData
        let barBuy = null;
        let barSell = null;
        let ornamentBuy = null;
        let ornamentSell = null;
        let barPriceChange = null;
        
        if (goldData && typeof goldData === 'object' && !Array.isArray(goldData)) {
          // Object with arrays data structure
          barBuy = findClosestValue(goldData.barBuy, timestamp);
          barSell = findClosestValue(goldData.barSell, timestamp);
          ornamentBuy = findClosestValue(goldData.ornamentBuy, timestamp);
          ornamentSell = findClosestValue(goldData.ornamentSell, timestamp);
          barPriceChange = findClosestValue(goldData.barPriceChange, timestamp);
        } else if (Array.isArray(goldData) && goldData.length > 0) {
          // Array of objects data structure
          const item = goldData.find(d => d && (d.time === timestamp || d.time/1000 === timestamp));
          if (item) {
            barBuy = item.barBuy || item.bar_buy;
            barSell = item.barSell || item.bar_sell;
            ornamentBuy = item.ornamentBuy || item.ornament_buy;
            ornamentSell = item.ornamentSell || item.ornament_sell;
            barPriceChange = item.barPriceChange || item.price_change;
          } else {
            const closest = goldData.reduce((prev, curr) => {
              if (!prev || (!prev.time && !prev.date)) return curr;
              if (!curr || (!curr.time && !curr.date)) return prev;
              const prevTime = prev.time || new Date(prev.date).getTime()/1000;
              const currTime = curr.time || new Date(curr.date).getTime()/1000;
              return Math.abs(currTime - timestamp) < Math.abs(prevTime - timestamp) ? curr : prev;
            });
            
            if (closest) {
              barBuy = closest.barBuy || closest.bar_buy;
              barSell = closest.barSell || closest.bar_sell;
              ornamentBuy = closest.ornamentBuy || closest.ornament_buy;
              ornamentSell = closest.ornamentSell || closest.ornament_sell;
              barPriceChange = closest.barPriceChange || closest.price_change;
            }
          }
        }
        
        // Find prediction value
        const prediction = filteredPredictionData && Array.isArray(filteredPredictionData) && filteredPredictionData.length > 0 
          ? findClosestValue(filteredPredictionData, timestamp) : null;
        
        setHoveredData({
          date: findDateString(),
          barBuy,
          barSell,
          ornamentBuy,
          ornamentSell,
          barPriceChange,
          prediction,
        });
      } catch (error) {
        console.error("Error processing crosshair data:", error);
      }
    };
    
    // Subscribe to crosshair movements
    chart.current.subscribeCrosshairMove(handleCrosshairMove);
    
    // Cleanup
    return () => {
      if (chart.current) {
        chart.current.unsubscribeCrosshairMove(handleCrosshairMove);
      }
    };
  }, [goldData, filteredPredictionData]);// Don't include hoveredData here to avoid infinite loop
  
  // Update series visibility
  useEffect(() => {
    if (!chart.current || !series.current) return;
    
    // Update visibility of each series
    if (series.current.barBuy) series.current.barBuy.applyOptions({ visible: selections.barBuy });
    if (series.current.barSell) series.current.barSell.applyOptions({ visible: selections.barSell });
    if (series.current.ornamentBuy) series.current.ornamentBuy.applyOptions({ visible: selections.ornamentBuy });
    if (series.current.ornamentSell) series.current.ornamentSell.applyOptions({ visible: selections.ornamentSell });
    if (series.current.priceChange) series.current.priceChange.applyOptions({ visible: selections.priceChange });
    if (series.current.prediction) series.current.prediction.applyOptions({ visible: selections.prediction });
  }, [selections]);
  
  // Handle date range change
  const handleDateRangeChange = (start, end) => {
    const newRange = {
      startDate: start || dateRange.startDate,
      endDate: end || dateRange.endDate
    };
    setDateRange(newRange);
    
    // Notify the parent component of date range changes
    if (onLoadMoreData) {
      onLoadMoreData(start, end);
    }
    
    // If chart exists, update the visible time range
    if (chart.current) {
      chart.current.timeScale().setVisibleRange({
        from: start ? start.getTime() / 1000 : dateRange.startDate.getTime() / 1000,
        to: end ? end.getTime() / 1000 : dateRange.endDate.getTime() / 1000
      });
    }
  };return (
    <div className="flex flex-col w-full tradingview-style">      {/* TradingView-style data detail panel with current time */}
      <div className="tv-data-panel p-2 bg-white border-b border-gray-100 shadow-sm flex justify-between items-center">
        {/* Left side - Price info */}
        <div className="flex-1">
          {hoveredData ? (
            <div className="flex items-start w-full">
              <div className="mr-4">
                <div className="font-medium">
                  <span className="text-gray-600">{formatDate(hoveredData.date)}</span>
                </div>
              </div>
              <div className="flex flex-wrap gap-4">
                {selections.prediction && 
                  <div className="flex flex-col items-end tv-animate-hover">
                    <span className="data-label">BP (Predict)</span>
                    <span className="data-value text-blue-600">
                      {(hoveredData.prediction !== null && hoveredData.prediction !== undefined) ? 
                        parseFloat(hoveredData.prediction).toFixed(2) : 'N/A'}
                    </span>
                  </div>
                }
                {selections.barBuy && 
                  <div className="flex flex-col items-end tv-animate-hover">
                    <span className="data-label">BB (Bar Buy)</span>
                    <span className="data-value text-yellow-600">
                      {(hoveredData.barBuy !== null && hoveredData.barBuy !== undefined) ? 
                        parseFloat(hoveredData.barBuy).toFixed(2) : 'N/A'}
                    </span>
                  </div>
                }
                {selections.barSell && 
                  <div className="flex flex-col items-end tv-animate-hover">
                    <span className="data-label">BS (Bar Sell)</span>
                    <span className="data-value text-amber-800">
                      {(hoveredData.barSell !== null && hoveredData.barSell !== undefined) ? 
                        parseFloat(hoveredData.barSell).toFixed(2) : 'N/A'}
                    </span>
                  </div>
                }
                {selections.ornamentBuy && 
                  <div className="flex flex-col items-end tv-animate-hover">
                    <span className="data-label">OB (Ornament Buy)</span>
                    <span className="data-value text-teal-600">
                      {(hoveredData.ornamentBuy !== null && hoveredData.ornamentBuy !== undefined) ? 
                        parseFloat(hoveredData.ornamentBuy).toFixed(2) : 'N/A'}
                    </span>
                  </div>
                }
                {selections.ornamentSell && 
                  <div className="flex flex-col items-end tv-animate-hover">
                    <span className="data-label">OS (Ornament Sell)</span>
                    <span className="data-value text-purple-800">
                      {(hoveredData.ornamentSell !== null && hoveredData.ornamentSell !== undefined) ? 
                        parseFloat(hoveredData.ornamentSell).toFixed(2) : 'N/A'}
                    </span>
                  </div>
                }
                {selections.priceChange && hoveredData.barPriceChange !== null && hoveredData.barPriceChange !== undefined && (
                  <div className="flex flex-col items-end tv-animate-hover">
                    <span className="data-label">BC (Price Change)</span>
                    <span className={`data-value ${parseFloat(hoveredData.barPriceChange) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatPriceChange(
                        hoveredData.barPriceChange, 
                        (hoveredData.barBuy !== null && hoveredData.barPriceChange !== null) ? 
                          parseFloat(hoveredData.barBuy) - parseFloat(hoveredData.barPriceChange) : 0
                      )}
                    </span>
                  </div>                )}
              </div>
            </div>
          ) : !hoveredData && latestData ? (
            <PriceDisplay data={latestData} />
          ) : (
            <div className="text-sm text-gray-500">Loading chart data...</div>
          )}
        </div>        {/* Right side - DateRangePicker */}
        <div className="text-right ml-auto">
          <DateRangePickerTH 
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
          />
        </div>
      </div>
      
      {/* Chart container with TradingView styling */}
      <div ref={chartContainerRef} className="tv-chart-container w-full h-[500px] relative" />
    </div>
  );
};

export default GoldChart;
