import React, { useEffect, useRef, useState } from 'react';
import { createChart } from 'lightweight-charts';
import { formatDate, formatPriceChange } from './Data/manageData';
// Import new timestamp helper functions
import { getSafeDate, isValidDate, getChartTimestamp } from './fixTimestamps';
import CurrentTime from './Components/CurrentTime';
import PriceDisplay from './Components/PriceDisplay';
import DateRangePickerTH from './Components/DateRangePickerTH';

/**
 * Component หลักสำหรับแสดงกราฟราคาทอง
 */
const GoldChart = ({ 
  goldData, 
  goldUsData, 
  usdThbData,
  predictionData, 
  category,
  selections, 
  onLoadMoreData, 
  startDate, 
  endDate 
}) => {
  const chartContainerRef = useRef(null);
  const chart = useRef(null);
  const series = useRef({});
  const [hoveredData, setHoveredData] = useState(null);
  const [filteredPredictionData, setFilteredPredictionData] = useState([]);
  const [latestData, setLatestData] = useState(null);
  const [refreshCounter, setRefreshCounter] = useState(0);
  
  // Create a refresh timer to periodically update the latest data
  useEffect(() => {
    // Set a timer to trigger a refresh every 60 seconds
    const refreshTimer = setInterval(() => {
      setRefreshCounter(prev => prev + 1);
    }, 60000); // 60 seconds
    
    return () => clearInterval(refreshTimer);
  }, []);
  
  const [dateRange, setDateRange] = useState({ startDate, endDate });
  const [activeDateOption, setActiveDateOption] = useState('1M');
  
  // Update date range when props change
  useEffect(() => {
    setDateRange({ startDate, endDate });
  }, [startDate, endDate]);
  
  // Filter prediction data based on date range and extract latest data for display
  useEffect(() => {
    if (category !== 'gold_th' || !predictionData || predictionData.length === 0) {
      setFilteredPredictionData([]);
      return;
    }

    // For TradingView style, we always show all prediction data and just zoom the chart
    setFilteredPredictionData(predictionData);
    
  }, [category, predictionData]);
    // Extract latest data for display based on data type
  useEffect(() => {
    try {
      const currentTime = new Date().toISOString();
      console.log(`Updating latest data at ${currentTime}`);
      
      switch (category) {
        case 'gold_th':
          if (!goldData) return;
          
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
                date: goldData.dates?.[latestIndex]?.time || new Date().getTime() / 1000,
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
          }          // Use the actual timestamp from data if available, otherwise fallback to current time
          // Using our helper function from fixTimestamps.js to ensure valid dates
          let dataTimestamp;
          
          if (latestGoldData.date) {
            try {
              // Use the helper function to get a safe date
              const safeDate = getSafeDate(latestGoldData.date);
              dataTimestamp = safeDate.getTime();
            } catch (e) {
              console.warn("Error parsing date from data:", e);
              dataTimestamp = new Date().getTime();
            }
          } else {
            // No date in the data, use current time
            dataTimestamp = new Date().getTime();
          }
          
          // Combine data for display
          setLatestData({
            date: dataTimestamp, // Use either data timestamp or current time
            barBuy: latestGoldData.barBuy || latestGoldData.bar_buy,
            barSell: latestGoldData.barSell || latestGoldData.bar_sell,
            ornamentBuy: latestGoldData.ornamentBuy || latestGoldData.ornament_buy,
            ornamentSell: latestGoldData.ornamentSell || latestGoldData.ornament_sell,
            predictedPrice: latestPrediction?.value,
            lastUpdated: new Date().toISOString() // Add last updated time
          });
          break;
          
        case 'gold_us':
          if (!goldUsData || !Array.isArray(goldUsData.close)) return;
            // For Gold US, use the last close price
          const latestGoldUsIndex = goldUsData.close.length - 1;
          if (latestGoldUsIndex >= 0) {
            setLatestData({
              date: new Date().getTime(), // Current timestamp in milliseconds
              goldUsPrice: goldUsData.close?.[latestGoldUsIndex]?.value,
              lastUpdated: new Date().toISOString()
            });
          }
          break;
          
        case 'usd_thb':
          if (!usdThbData || !Array.isArray(usdThbData.close)) return;
            // For USD/THB, use the last close rate
          const latestUsdThbIndex = usdThbData.close.length - 1;
          if (latestUsdThbIndex >= 0) {
            setLatestData({
              date: new Date().getTime(), // Current timestamp in milliseconds
              usdThbRate: usdThbData.close?.[latestUsdThbIndex]?.value,
              lastUpdated: new Date().toISOString()
            });
          }
          break;
          
        default:
          console.warn('Unknown data category:', category);
      }
    } catch (error) {
      console.error("Error processing data:", error);
    }
  }, [category, goldData, goldUsData, usdThbData, predictionData, refreshCounter]);
    // Initialize chart
  useEffect(() => {
    if (!chartContainerRef.current) return;
    
    // Store series references to properly clean them up
    let currentSeries = {};
    
    // Cleanup any existing chart
    if (chart.current) {
      try {
        // Properly dispose all series first
        Object.values(series.current).forEach(seriesRef => {
          if (seriesRef && chart.current) {
            try {
              chart.current.removeSeries(seriesRef);
            } catch (e) {
              // Series might already be removed or disposed
              console.log("Series cleanup warning:", e);
            }
          }
        });
        
        // Then remove the chart
        chart.current.remove();
      } catch (e) {
        console.log("Chart cleanup warning:", e);
      }
      
      // Reset references
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
      },      timeScale: {
        timeVisible: true,
        secondsVisible: false,
        borderColor: 'rgba(197, 203, 206, 0.4)',
        tickMarkFormatter: (time) => {
          try {
            // Validate the timestamp
            if (!time || time < 10000) {
              console.warn(`Invalid timestamp in tickMarkFormatter: ${time}`);
              return '';
            }
            
            // Check if time is in seconds or milliseconds and convert appropriately
            const timestamp = time.toString().length <= 10 ? time * 1000 : time;
            const date = new Date(timestamp);
            
            // Enhanced validation for the date object
            if (!date || isNaN(date.getTime())) {
              console.warn(`Invalid date in tickMarkFormatter: ${date}`);
              return '';
            }
            
            // Additional validation to detect unreasonable years
            if (date.getFullYear() < 2000 || date.getFullYear() > 2050) {
              console.warn(`Suspicious year in tickMarkFormatter: ${date.getFullYear()}`);
              return '';
            }
            
            // Format date: pad single digit dates/months with leading zero for consistency
            const day = date.getDate().toString().padStart(2, '0');
            const month = (date.getMonth() + 1).toString().padStart(2, '0');
            return `${day}/${month}`;
          } catch (e) {
            console.error("Error in tickMarkFormatter:", e);
            return '';
          }
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
    
    // Add series based on data category
    switch (category) {
      case 'gold_th':
        // Gold TH series
        series.current.barBuy = chart.current.addLineSeries({
          color: '#D4AF37',
          lineWidth: 2,
          // title: 'Bar Buy',
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
          // title: 'Bar Sell',
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
          // title: 'Ornament Buy',
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
          // title: 'Ornament Sell',
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
          // title: 'Bar Buy (Predict)',
          priceLineVisible: true,
          lastValueVisible: true,
          priceLineWidth: 1,
          priceLineColor: '#2962FF',
          priceLineStyle: 2, // Dashed
          crosshairMarkerVisible: true,
          crosshairMarkerRadius: 5,
          crosshairMarkerBorderColor: '#2962FF',
          crosshairMarkerBackgroundColor: '#ffffff',
          lineType: 0 // LineType.Simple
        });
        
        series.current.priceChange = chart.current.addHistogramSeries({
          color: 'rgba(76, 175, 80, 0.5)', // Green with transparency
          priceFormat: {
            type: 'price',
            precision: 0,
            minMove: 1,
          },
          // title: 'Price Change',
          priceLineVisible: false,
          lastValueVisible: true,
          visible: false // Set default visibility to false
        });
        break;      case 'gold_us':
        // Gold US series
        series.current.goldUsPrice = chart.current.addLineSeries({
          color: '#FFD700',  // Gold color
          lineWidth: 2,
          // title: 'Gold Price (USD)',
          priceLineVisible: true,
          lastValueVisible: true,
          priceLineWidth: 1,
          priceLineColor: '#FFD700',
          priceLineStyle: 2, // Dashed
          crosshairMarkerVisible: true,
          crosshairMarkerRadius: 4,
          lineType: 0, // LineType.Simple
        });
        break;

      case 'usd_thb':
        // USD/THB series
        series.current.usdThbRate = chart.current.addLineSeries({
          color: '#4285F4',  // Blue color
          lineWidth: 2,
          // title: 'USD/THB Rate',
          priceLineVisible: true,
          lastValueVisible: true,
          priceLineWidth: 1,
          priceLineColor: '#4285F4',
          priceLineStyle: 2, // Dashed
          crosshairMarkerVisible: true,
          crosshairMarkerRadius: 4,
          lineType: 0, // LineType.Simple
        });
        break;

      default:
        console.warn('Unknown category:', category);
    }
      // Handle window resize
    const handleResize = () => {
      if (chart.current && chartContainerRef.current) {
        chart.current.applyOptions({
          width: chartContainerRef.current.clientWidth
        });
      }
    };
    
    window.addEventListener('resize', handleResize);
      // Clean up
    return () => {
      window.removeEventListener('resize', handleResize);
      if (chart.current) {
        try {
          // Properly dispose all series first to avoid "Object is disposed" errors
          Object.values(series.current).forEach(seriesRef => {
            if (seriesRef && chart.current) {
              try {
                chart.current.removeSeries(seriesRef);
              } catch (e) {
                // Series might already be removed or disposed
                console.log("Series cleanup warning:", e);
              }
            }
          });
          
          // Then remove the chart
          chart.current.remove();
        } catch (e) {
          console.log("Chart cleanup warning:", e);
        }
        
        // Reset references
        chart.current = null;
        series.current = {};
      }
    };
  }, [category]);
  
  // Update chart data
  useEffect(() => {
    if (!chart.current || !series.current) return;
    
    // Update data for each series based on category
    try {
      switch (category) {
        case 'gold_th':
          if (!goldData) {
            console.warn("Gold TH data is null or undefined");
            return;
          }
          
          // Process gold data based on its structure
          let barBuyData = [];
          let barSellData = [];
          let ornamentBuyData = [];
          let ornamentSellData = [];
          let barPriceChangeData = [];
          let datesArray = [];
            // Check if goldData is an array or object
          if (Array.isArray(goldData)) {
            // If it's an array, convert each item into the format expected by the chart
            barBuyData = goldData.map(item => {
              if (!item) return null;
              
              let timestamp;
              try {
                if (item.time) {
                  // If timestamp is in seconds (10 digits), convert to milliseconds
                  timestamp = item.time.toString().length <= 10 ? 
                    item.time * 1000 : item.time;
                } else if (item.date) {
                  // Parse date string to timestamp
                  const dateObj = new Date(item.date);
                  if (isNaN(dateObj.getTime())) {
                    return null; // Skip invalid dates
                  }
                  timestamp = dateObj.getTime();
                } else {
                  return null; // Skip if no valid time/date
                }
                
                // Validate timestamp
                if (!timestamp || timestamp < 10000) {
                  return null; // Skip invalid timestamps
                }
                
                // Convert timestamp to seconds for chart
                const timeInSeconds = Math.floor(timestamp / 1000);
                
                return {
                  time: timeInSeconds,
                  value: item.barBuy || item.bar_buy || 0
                };
              } catch (e) {
                console.error("Error processing barBuy data point:", e);
                return null;
              }
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
          
            // Filter out any null or invalid data points
            barBuyData = barBuyData.filter(point => point && point.time && point.value !== null && point.value !== undefined);
            barSellData = barSellData.filter(point => point && point.time && point.value !== null && point.value !== undefined);
            ornamentBuyData = ornamentBuyData.filter(point => point && point.time && point.value !== null && point.value !== undefined);
            ornamentSellData = ornamentSellData.filter(point => point && point.time && point.value !== null && point.value !== undefined);
            
            // Sort data by time to ensure it's in ascending order
            barBuyData.sort((a, b) => a.time - b.time);
            barSellData.sort((a, b) => a.time - b.time);
            ornamentBuyData.sort((a, b) => a.time - b.time);
            ornamentSellData.sort((a, b) => a.time - b.time);
            
            // Set the data for each series
            try {
              if (series.current.barBuy) {
                series.current.barBuy.setData(barBuyData);
              }
              
              if (series.current.barSell) {
                series.current.barSell.setData(barSellData);
              }
              
              if (series.current.ornamentBuy) {
                series.current.ornamentBuy.setData(ornamentBuyData);
              }
              
              if (series.current.ornamentSell) {
                series.current.ornamentSell.setData(ornamentSellData);
              }
            } catch (e) {
              console.error("Error setting chart data:", e);
            }
            
            // Set visibility based on selections
            series.current.barBuy?.applyOptions({ visible: selections.barBuy });
            series.current.barSell?.applyOptions({ visible: selections.barSell });
            series.current.ornamentBuy?.applyOptions({ visible: selections.ornamentBuy });
            series.current.ornamentSell?.applyOptions({ visible: selections.ornamentSell });
          } else if (typeof goldData === 'object' && goldData !== null) {
            // If it's an object with arrays, process differently
            if (goldData.dates && goldData.barBuy && goldData.barSell) {
              barBuyData = goldData.barBuy
                .filter((_, i) => goldData.dates[i])
                .map((item, i) => ({
                  time: new Date(goldData.dates[i].time || goldData.dates[i].date).getTime() / 1000,
                  value: item.value
                }));
                
              barSellData = goldData.barSell
                .filter((_, i) => goldData.dates[i])
                .map((item, i) => ({
                  time: new Date(goldData.dates[i].time || goldData.dates[i].date).getTime() / 1000,
                  value: item.value
                }));
                
              ornamentBuyData = goldData.ornamentBuy
                .filter((_, i) => goldData.dates[i])
                .map((item, i) => ({
                  time: new Date(goldData.dates[i].time || goldData.dates[i].date).getTime() / 1000,
                  value: item.value
                }));
                
              ornamentSellData = goldData.ornamentSell
                .filter((_, i) => goldData.dates[i])
                .map((item, i) => ({
                  time: new Date(goldData.dates[i].time || goldData.dates[i].date).getTime() / 1000,
                  value: item.value
                }));
                
              // Filter out any null or invalid data points
              barBuyData = barBuyData.filter(point => point && point.time && point.value !== null && point.value !== undefined);
              barSellData = barSellData.filter(point => point && point.time && point.value !== null && point.value !== undefined);
              ornamentBuyData = ornamentBuyData.filter(point => point && point.time && point.value !== null && point.value !== undefined);
              ornamentSellData = ornamentSellData.filter(point => point && point.time && point.value !== null && point.value !== undefined);
              
              // Sort data by time to ensure it's in ascending order
              barBuyData.sort((a, b) => a.time - b.time);
              barSellData.sort((a, b) => a.time - b.time);
              ornamentBuyData.sort((a, b) => a.time - b.time);
              ornamentSellData.sort((a, b) => a.time - b.time);
              
              // Set the data for each series
              try {
                if (series.current.barBuy) {
                  series.current.barBuy.setData(barBuyData);
                }
                
                if (series.current.barSell) {
                  series.current.barSell.setData(barSellData);
                }
                
                if (series.current.ornamentBuy) {
                  series.current.ornamentBuy.setData(ornamentBuyData);
                }
                
                if (series.current.ornamentSell) {
                  series.current.ornamentSell.setData(ornamentSellData);
                }
              } catch (e) {
                console.error("Error setting chart data:", e);
              }
              
              // Set visibility based on selections
              series.current.barBuy?.applyOptions({ visible: selections.barBuy });
              series.current.barSell?.applyOptions({ visible: selections.barSell });
              series.current.ornamentBuy?.applyOptions({ visible: selections.ornamentBuy });
              series.current.ornamentSell?.applyOptions({ visible: selections.ornamentSell });
            }
          }
          break;
          
        case 'gold_us':
          if (!goldUsData) {
            console.warn("Gold US data is null or undefined");
            return;
          }
          
          // Process Gold US data
          if (goldUsData.timestamps && goldUsData.close) {
            const goldUsChartData = goldUsData.close
              .filter((_, i) => goldUsData.timestamps[i])
              .map((item, i) => ({
                time: new Date(goldUsData.timestamps[i].time || goldUsData.timestamps[i].date).getTime() / 1000,
                value: item.value
              }))
              .filter(point => point && point.time && point.value !== null && point.value !== undefined);
            
            // Sort data by time to ensure it's in ascending order
            goldUsChartData.sort((a, b) => a.time - b.time);
            
            // Set data for Gold US series
            try {
              if (series.current.goldUsPrice) {
                series.current.goldUsPrice.setData(goldUsChartData);
              }
            } catch (e) {
              console.error("Error setting Gold US chart data:", e);
            }
          }
          break;
          
        case 'usd_thb':
          if (!usdThbData) {
            console.warn("USD/THB data is null or undefined");
            return;
          }
          
          // Process USD/THB data
          if (usdThbData.timestamps && usdThbData.close) {
            const usdThbChartData = usdThbData.close
              .filter((_, i) => usdThbData.timestamps[i])
              .map((item, i) => ({
                time: new Date(usdThbData.timestamps[i].time || usdThbData.timestamps[i].date).getTime() / 1000,
                value: item.value
              }))
              .filter(point => point && point.time && point.value !== null && point.value !== undefined);
            
            // Sort data by time to ensure it's in ascending order
            usdThbChartData.sort((a, b) => a.time - b.time);
            
            // Set data for USD/THB series
            try {
              if (series.current.usdThbRate) {
                series.current.usdThbRate.setData(usdThbChartData);
              }
            } catch (e) {
              console.error("Error setting USD/THB chart data:", e);
            }
          }
          break;
          
        default:
          console.warn('Unknown category for chart data update:', category);
      }
    } catch (error) {
      console.error("Error updating chart data:", error);
    }
  }, [category, goldData, goldUsData, usdThbData, selections]);
    // Update prediction data on chart
  useEffect(() => {
    if (!chart.current || !series.current || !series.current.prediction) return;
    if (category !== 'gold_th' || !predictionData || predictionData.length === 0) {
      // Clear prediction data if not gold TH category or no data
      try {
        series.current.prediction?.setData([]);
      } catch (e) {
        console.warn("Error clearing prediction data:", e);
      }
      return;
    }
    
    try {
      // Process prediction data for the chart
      const predictionChartData = predictionData
        .map(item => {
          if (!item) return null;
          return {
            time: new Date(item.time || item.date).getTime() / 1000,
            value: item.value || 0
          };
        })
        .filter(point => point && point.time && point.value !== null && point.value !== undefined);
      
      // Ensure data is sorted by time in ascending order
      predictionChartData.sort((a, b) => a.time - b.time);
      
      // Set the prediction data on the chart
      if (series.current.prediction && predictionChartData.length > 0) {
        try {
          series.current.prediction.setData(predictionChartData);
          // Set prediction series visibility based on selections
          if (selections) {
            series.current.prediction.applyOptions({ visible: selections.prediction });
          }
        } catch (e) {
          console.error("Error setting prediction chart data:", e);
        }
      }
      
      // Fit content safely
      try {
        if (chart.current && chart.current.timeScale) {
          chart.current.timeScale().fitContent();
        }
      } catch (e) {
        console.warn("Error fitting chart content:", e);
      }
      
      // Add scroll handler for loading more data
      try {
        if (chart.current && chart.current.timeScale) {
          chart.current.timeScale().subscribeVisibleLogicalRangeChange((range) => {
            if (range && range.from < 5 && onLoadMoreData) {
              onLoadMoreData();
            }
          });
        }
      } catch (e) {
        console.warn("Error setting up scroll handler:", e);
      }
    } catch (error) {
      console.error("Error updating prediction data:", error);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [predictionData, filteredPredictionData, category, selections]);
  
  // Handle date range changes by zooming the chart to the selected range
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
        if (goldData && Array.isArray(goldData) && goldData.length > 0) {              // Use built-in LightweightCharts methods for better performance
          chart.current.timeScale().fitContent();
          
          // Find the closest visible indices based on timestamps
          const visibleTimeRange = {
            from: Math.min(startTime, endTime), // Ensure from < to
            to: Math.max(startTime, endTime)    // Ensure to > from
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
  }, [startDate, endDate, goldData, goldUsData, usdThbData, category]);
  
  // Setup crosshair handler in a separate effect to prevent infinite rerenders
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
      };      // Find date string - using the timestamp directly with improved validation
      const findDateString = () => {
        // The most reliable approach is to convert the timestamp to a proper date
        // timestamp is in seconds (UNIX timestamp), so multiply by 1000 for JS Date
        try {
          // Validate timestamp first
          if (!timestamp || timestamp < 10000) {
            console.warn(`Invalid timestamp detected: ${timestamp}, using current time instead`);
            return new Date().toISOString();
          }
          
          // Check if timestamp is in seconds (10 digits) or milliseconds (13 digits)
          const timestampMs = timestamp.toString().length <= 10 ? timestamp * 1000 : timestamp;
          const date = new Date(timestampMs);
          
          // Validate the resulting date 
          if (date && !isNaN(date.getTime())) {
            // Additional validation: check if date is within a reasonable range
            if (date.getFullYear() < 2000 || date.getFullYear() > 2050) {
              console.warn(`Suspicious date detected: ${date.toISOString()}, using current time instead`);
              return new Date().toISOString();
            }
            return date.toISOString();
          }
        } catch (error) {
          console.error("Error creating date from timestamp:", error);
        }
        
        // If we have valid goldData, try to find matching date as fallback
        if (goldData) {
          // First check if goldData is an object with dates array
          if (goldData.dates && Array.isArray(goldData.dates) && goldData.dates.length > 0) {
            try {
              // Find exact match first
              const exactMatch = goldData.dates.find(d => d && d.time === timestamp);
              if (exactMatch) return exactMatch.date || new Date(timestamp * 1000).toISOString();
              
              // Then try closest
              const closest = goldData.dates.reduce((prev, curr) => {
                if (!prev || !prev.time) return curr;
                if (!curr || !curr.time) return prev;
                return Math.abs(curr.time - timestamp) < Math.abs(prev.time - timestamp) ? curr : prev;
              }, null);
              
              if (closest) return closest.date || new Date(timestamp * 1000).toISOString();
            } catch (error) {
              console.error("Error finding date in dates array:", error);
            }
          }
          // If goldData is an array of data points
          else if (Array.isArray(goldData) && goldData.length > 0) {
            try {
              const exactMatch = goldData.find(item => 
                item && item.time === timestamp
              );
              
              if (exactMatch) return exactMatch.date || new Date(timestamp * 1000).toISOString();
              
              // Try finding the closest
              const closest = goldData.reduce((prev, curr) => {
                if (!prev || !prev.time) return curr;
                if (!curr || !curr.time) return prev;
                return Math.abs(curr.time - timestamp) < Math.abs(prev.time - timestamp) ? curr : prev;
              }, null);
              
              if (closest) return closest.date || new Date(timestamp * 1000).toISOString();
            } catch (error) {
              console.error("Error finding date in data array:", error);
            }
          }
        }
        
        // Final fallback - just use the timestamp directly
        return new Date(timestamp * 1000).toISOString();
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
          ? findClosestValue(filteredPredictionData, timestamp) : null;        // Get the date string from timestamp - ensure it's properly converted and validated
        let dateString = null;
        if (timestamp) {
          try {
            // Validate the timestamp first
            if (timestamp < 10000) {
              console.warn(`Invalid timestamp for hover data: ${timestamp}, using current time`);
              dateString = new Date().toISOString();
            } else {
              // If timestamp looks like seconds (10 digits or less), convert to milliseconds
              const timestampMs = timestamp.toString().length <= 10 ? timestamp * 1000 : timestamp;
              const date = new Date(timestampMs);
              
              // Check if the date is valid and reasonable
              if (!isNaN(date.getTime()) && date.getFullYear() >= 2000 && date.getFullYear() <= 2050) {
                dateString = date.toISOString();
              } else {
                console.warn(`Invalid date for hover data: ${date}, using current time`);
                dateString = new Date().toISOString();
              }
            }
          } catch (e) {
            console.error("Error formatting date for hover:", e);
            dateString = new Date().toISOString();
          }
        }
        
        setHoveredData({
          date: dateString,
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
    // Always show prediction line regardless of selection
    if (series.current.prediction) series.current.prediction.applyOptions({ visible: true });
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
  };
  
  return (
    <div className="flex flex-col w-full tradingview-style">
      {/* TradingView-style data detail panel with current time */}
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
                    <span className="data-label">Bar Buy (Predict)</span>
                    <span className="data-value text-blue-600">
                      {(hoveredData.prediction !== null && hoveredData.prediction !== undefined) ? 
                        parseFloat(hoveredData.prediction).toFixed(2) : 'N/A'}
                    </span>
                  </div>
                }
                {selections.barBuy && 
                  <div className="flex flex-col items-end tv-animate-hover">
                    <span className="data-label">Bar Buy</span>
                    <span className="data-value text-yellow-600">
                      {(hoveredData.barBuy !== null && hoveredData.barBuy !== undefined) ? 
                        parseFloat(hoveredData.barBuy).toFixed(2) : 'N/A'}
                    </span>
                  </div>
                }
                {selections.barSell && 
                  <div className="flex flex-col items-end tv-animate-hover">
                    <span className="data-label">Bar Sell</span>
                    <span className="data-value text-amber-800">
                      {(hoveredData.barSell !== null && hoveredData.barSell !== undefined) ? 
                        parseFloat(hoveredData.barSell).toFixed(2) : 'N/A'}
                    </span>
                  </div>
                }
                {selections.ornamentBuy && 
                  <div className="flex flex-col items-end tv-animate-hover">
                    <span className="data-label">Ornament Buy</span>
                    <span className="data-value text-teal-600">
                      {(hoveredData.ornamentBuy !== null && hoveredData.ornamentBuy !== undefined) ? 
                        parseFloat(hoveredData.ornamentBuy).toFixed(2) : 'N/A'}
                    </span>
                  </div>
                }
                {selections.ornamentSell && 
                  <div className="flex flex-col items-end tv-animate-hover">
                    <span className="data-label">Ornament Sell</span>
                    <span className="data-value text-purple-800">
                      {(hoveredData.ornamentSell !== null && hoveredData.ornamentSell !== undefined) ? 
                        parseFloat(hoveredData.ornamentSell).toFixed(2) : 'N/A'}
                    </span>
                  </div>
                }
                {selections.priceChange && hoveredData.barPriceChange !== null && hoveredData.barPriceChange !== undefined && (
                  <div className="flex flex-col items-end tv-animate-hover">
                    <span className="data-label">Price Change</span>
                    <span className={`data-value ${parseFloat(hoveredData.barPriceChange) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatPriceChange(
                        hoveredData.barPriceChange, 
                        (hoveredData.barBuy !== null && hoveredData.barPriceChange !== null) ? 
                          parseFloat(hoveredData.barBuy) - parseFloat(hoveredData.barPriceChange) : 0
                      )}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ) : !hoveredData && latestData ? (
            <PriceDisplay data={latestData} category={category} />
          ) : (
            <div className="text-sm text-gray-500">Loading chart data...</div>
          )}
        </div>
        {/* Right side - DateRangePicker */}
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
        <CurrentTime />
      </div>
      
      {/* Chart container with TradingView styling */}
      <div ref={chartContainerRef} className="tv-chart-container w-full h-[500px] relative" />
    </div>
  );
};

export default GoldChart;
