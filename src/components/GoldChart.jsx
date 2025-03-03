// src/components/GoldChart.jsx
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, TimeScale, Filler } from 'chart.js';
import 'chartjs-adapter-date-fns';
import { fetchGoldTH, fetchGoldUS, fetchUSDTHB, fetchPredictions } from '../services/apiService';
import { format, compareAsc, isValid, parseISO, parse } from 'date-fns';
import { enUS } from 'date-fns/locale';

ChartJS.register(
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  Title, 
  Tooltip, 
  Legend, 
  TimeScale,
  Filler
);

const DataCategories = {
  GOLD_TH: 'Gold TH',
  GOLD_US: 'Gold US',
  USDTHB: 'USD THB'
};

// Helper function to validate and clean date data
const validateAndCleanData = (data) => {
  if (!Array.isArray(data)) {
    console.warn("Data is not an array:", data);
    return [];
  }
  
  console.log("Validating data:", data.slice(0, 2)); // Log first 2 items for debugging
  
  const validData = data.filter(item => {
    // Must have both x and y
    if (!item || typeof item.x === 'undefined' || typeof item.y === 'undefined') {
      console.warn("Invalid data item missing x or y:", item);
      return false;
    }
    
    // Convert y to number if it's a string
    if (typeof item.y === 'string') {
      item.y = parseFloat(item.y);
      if (isNaN(item.y)) {
        console.warn("Invalid y value cannot be converted to number:", item.y);
        return false;
      }
    }
    
    // Accept more date formats even if we can't parse them perfectly
    // Just log the issue but don't filter out the item
    if (typeof item.x === 'string') {
      try {
        // Try ISO format first
        let date = parseISO(item.x);
        
        // If not valid, try other common formats
        if (!isValid(date)) {
          // Try DD/MM/YYYY format
          date = parse(item.x, 'dd/MM/yyyy', new Date());
          
          // If still not valid, try MM/DD/YYYY format
          if (!isValid(date)) {
            date = parse(item.x, 'MM/dd/yyyy', new Date());
          }
          
          // If still not valid, try YYYY-MM-DD format
          if (!isValid(date)) {
            date = parse(item.x, 'yyyy-MM-dd', new Date());
          }
        }
        
        if (isValid(date)) {
          // Store as ISO string
          item.x = date.toISOString();
        } else {
          console.warn("Could not parse date string but keeping data:", item.x);
          // Still return true to keep the item
        }
      } catch (err) {
        console.error("Error parsing date but keeping data:", err, item.x);
        // Still return true to keep the item
      }
    }
    
    // If x is a number (timestamp), convert to Date but don't filter out if invalid
    if (typeof item.x === 'number') {
      try {
        const date = new Date(item.x);
        if (isValid(date)) {
          // Store as ISO string
          item.x = date.toISOString();
        } else {
          console.warn("Invalid timestamp but keeping data:", item.x);
        }
      } catch (err) {
        console.error("Error converting timestamp but keeping data:", err, item.x);
      }
    }
    
    // If x is already a Date object, convert to ISO string
    if (item.x instanceof Date) {
      if (isValid(item.x)) {
        item.x = item.x.toISOString();
      } else {
        console.warn("Invalid Date object but keeping data:", item.x);
      }
    }
    
    // Keep all items with x and y values
    return true;
  });
  
  console.log(`Data validation - Original: ${data.length}, Valid: ${validData.length}`);
  return validData;
};

const GoldChart = ({ darkMode }) => {
  const [selectedCategory, setSelectedCategory] = useState(DataCategories.GOLD_TH);
  const [goldThData, setGoldThData] = useState([]);
  const [goldUsData, setGoldUsData] = useState([]);
  const [usdthbData, setUsdthbData] = useState([]);
  const [predictData, setPredictData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeframe, setTimeframe] = useState('7d'); // Default to 7 daysawa
  const chartRef = useRef(null);

  // Fetch data logic
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        console.log("✅Loading data for category:", selectedCategory, "timeframe:", timeframe);
        
        // Always reload data when timeframe or category changes
        if (selectedCategory === DataCategories.GOLD_TH) {
          try {
            const goldThResponse = await fetchGoldTH(timeframe);
            console.log("✅Gold TH API response:", goldThResponse);

            console.log("✅ Data : ", goldThResponse.data);
            
            if (goldThResponse && goldThResponse.data && Array.isArray(goldThResponse.data)) {
              // First, log the structure of the first item to understand its format
              console.log("Gold TH data first item structure:", goldThResponse.data[0]);
              
              // Process data based on the actual structure
              const processedData = goldThResponse.data.map(item => {
                // Determine the date and price fields based on the response structure
                // These names may vary - adjust based on the actual API response
                // const dateValue = item.date || item.timestamp || item.time || Object.keys(item)[0];
                const dateValue = item.created_at || item.date || item.timestamp || item.time || Object.keys(item)[0];
                const priceValue = item.price || item.value || item.gold_price || Object.values(item)[0];
                
                return {
                  x: dateValue,
                  y: typeof priceValue === 'string' ? parseFloat(priceValue) : priceValue
                };
              }).filter(item => item.x && item.y !== undefined && !isNaN(item.y));
              
              console.log("Processed Gold TH data:", processedData.slice(0, 2));
              console.log("✅Processed Gold TH data:", processedData);
              
              // Clean data
              const cleanData = validateAndCleanData(processedData);
              console.log("Cleaned Gold TH data count:", cleanData.length, "First two items:", cleanData.slice(0, 2));
              
              if (cleanData.length === 0) {
                console.error("Gold TH data was cleaned to zero length. Original data:", goldThResponse.data.slice(0, 5));
              }
              
              setGoldThData(cleanData);
              
              // Fetch predictions for GoldTH
              try {
                const predictionResponse = await fetchPredictions();
                console.log("Prediction API response:", predictionResponse);
                
                if (predictionResponse && predictionResponse.status === 'success' && predictionResponse.week) {
                  // The prediction data is in a different format - it's an object with date keys and price values
                  // Convert it to the expected {x, y} format
                  const processedPredictions = [];
                  const weekData = predictionResponse.week;
                  
                  // Process each date-value pair in the week object
                  // Skip special fields like 'date', 'created_at', and 'timestamp'
                  Object.entries(weekData).forEach(([key, value]) => {
                    // Skip non-date or metadata keys
                    if (['date', 'created_at', 'timestamp'].includes(key)) {
                      return;
                    }
                    
                    // Skip null values
                    if (value === null) {
                      return;
                    }
                    
                    // Verify this is a date key (YYYY-MM-DD format)
                    if (/^\d{4}-\d{2}-\d{2}$/.test(key)) {
                      try {
                        processedPredictions.push({
                          x: key, // The date string
                          y: typeof value === 'string' ? parseFloat(value) : value
                        });
                      } catch (err) {
                        console.warn(`Error processing prediction for date ${key}:`, err);
                      }
                    }
                  });
                  
                  // Sort by date
                  processedPredictions.sort((a, b) => new Date(a.x) - new Date(b.x));
                  
                  // Clean prediction data
                  const cleanPredictions = validateAndCleanData(processedPredictions);
                  console.log("Processed prediction data:", cleanPredictions);
                  setPredictData(cleanPredictions);
                } else {
                  console.warn("Prediction data format is not as expected:", predictionResponse);
                  setPredictData([]);
                }
              } catch (predErr) {
                console.error("Error fetching prediction data:", predErr);
                setPredictData([]);
              }
            } else {
              console.warn("Gold TH data format is not as expected:", goldThResponse);
              setError("Invalid data format received from server");
              setGoldThData([]);
            }
          } catch (err) {
            console.error("Error fetching Gold TH data:", err);
            setError("Failed to load Gold TH data");
            setGoldThData([]);
          }
        }
        
        if (selectedCategory === DataCategories.GOLD_US) {
          try {
            const goldUsResponse = await fetchGoldUS(timeframe);
            console.log("Gold US API response:", goldUsResponse);
            
            if (goldUsResponse && goldUsResponse.data && Array.isArray(goldUsResponse.data)) {
              // First, log the structure of the first item to understand its format
              console.log("Gold US data first item structure:", goldUsResponse.data[0]);
              
              // Process data based on the actual structure
              const processedData = goldUsResponse.data.map(item => {
                // Determine the date and price fields based on the response structure
                // These names may vary - adjust based on the actual API response
                const dateValue = item.created_at || item.date || item.timestamp || item.time || Object.keys(item)[0];
                const priceValue = item.price || item.value || item.gold_price || Object.values(item)[0];
                
                return {
                  x: dateValue,
                  y: typeof priceValue === 'string' ? parseFloat(priceValue) : priceValue
                };
              }).filter(item => item.x && item.y !== undefined && !isNaN(item.y));
              
              console.log("Processed Gold US data:", processedData.slice(0, 2));
              
              // Clean data
              const cleanData = validateAndCleanData(processedData);
              console.log("Cleaned Gold US data:", cleanData);
              setGoldUsData(cleanData);
            } else {
              console.warn("Gold US data format is not as expected:", goldUsResponse);
              setError("Invalid data format received from server");
              setGoldUsData([]);
            }
          } catch (err) {
            console.error("Error fetching Gold US data:", err);
            setError("Failed to load Gold US data");
            setGoldUsData([]);
          }
        }
        
        if (selectedCategory === DataCategories.USDTHB) {
          try {
            const usdthbResponse = await fetchUSDTHB(timeframe);
            console.log("USD/THB API response:", usdthbResponse);
            
            if (usdthbResponse && usdthbResponse.data && Array.isArray(usdthbResponse.data)) {
              // First, log the structure of the first item to understand its format
              console.log("USD/THB data first item structure:", usdthbResponse.data[0]);
              
              // Process data based on the actual structure
              const processedData = usdthbResponse.data.map(item => {
                // Determine the date and price fields based on the response structure
                // These names may vary - adjust based on the actual API response
                const dateValue = item.created_at || item.date || item.timestamp || item.time || Object.keys(item)[0];
                const priceValue = item.price || item.value || item.exchange_rate || Object.values(item)[0];
                
                return {
                  x: dateValue,
                  y: typeof priceValue === 'string' ? parseFloat(priceValue) : priceValue
                };
              }).filter(item => item.x && item.y !== undefined && !isNaN(item.y));
              
              console.log("Processed USD/THB data:", processedData.slice(0, 2));
              
              // Clean data
              const cleanData = validateAndCleanData(processedData);
              console.log("Cleaned USD/THB data:", cleanData);
              setUsdthbData(cleanData);
            } else {
              console.warn("USD/THB data format is not as expected:", usdthbResponse);
              setError("Invalid data format received from server");
              setUsdthbData([]);
            }
          } catch (err) {
            console.error("Error fetching USD/THB data:", err);
            setError("Failed to load USD/THB data");
            setUsdthbData([]);
          }
        }
      } catch (err) {
        console.error("Failed to load data:", err);
        setError('Failed to load data: ' + err.message);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [selectedCategory, timeframe]);

  const downsampleData = (data, maxPoints = 200) => {
    if (!data || data.length <= maxPoints) return data;
    
    const factor = Math.ceil(data.length / maxPoints);
    const result = [];
    
    for (let i = 0; i < data.length; i += factor) {
      let sum = 0;
      let count = 0;
      let minDate = new Date(8640000000000000);
      
      for (let j = 0; j < factor && i + j < data.length; j++) {
        sum += data[i + j].y;
        count++;
        
        // Find the earliest date in the range
        try {
          const itemDate = new Date(data[i + j].x);
          if (isValid(itemDate) && itemDate < minDate) {
            minDate = itemDate;
          }
        } catch (err) {
          console.warn("Error parsing date in downsample:", data[i + j].x, err);
        }
      }
      
      if (count > 0) {
        result.push({
          x: minDate.toISOString(),
          y: sum / count
        });
      }
    }
    
    return result;
  };

  // เตรียมข้อมูลสำหรับกราฟตามหมวดหมู่ที่เลือก
  const chartData = useMemo(() => {
    // Function to validate if a date is in a reasonable range
    const isDateInReasonableRange = (dateObj) => {
      if (!dateObj || !isValid(dateObj)) return false;
      
      // Consider dates within a reasonable range (e.g., 1950 to 2050)
      const minDate = new Date(1950, 0, 1);
      const maxDate = new Date(2050, 0, 1);
      
      return dateObj >= minDate && dateObj <= maxDate;
    };
    
    let data = [];
    let predictions = [];
    
    switch (selectedCategory) {
      case DataCategories.GOLD_TH:
        data = goldThData;
        if (predictData && Array.isArray(predictData)) {
          predictions = predictData;
        }
        break;
      case DataCategories.GOLD_US:
        data = goldUsData;
        break;
      case DataCategories.USDTHB:
        data = usdthbData;
        break;
      default:
        data = goldThData;
    }
    
    // Filter data with unreasonable dates that would break the chart rendering
    const filterInvalidDates = (data) => {
      if (!data || !Array.isArray(data)) return [];
      
      return data.filter(item => {
        try {
          if (!item || item.x === undefined) {
            return false;
          }
          
          // If item.x is a Date object
          if (item.x instanceof Date) {
            return isDateInReasonableRange(item.x);
          }
          
          // If item.x is a timestamp (number)
          if (typeof item.x === 'number') {
            const dateObj = new Date(item.x);
            return isDateInReasonableRange(dateObj);
          }
          
          // If item.x is a string
          if (typeof item.x === 'string') {
            const dateObj = parseISO(item.x);
            return isDateInReasonableRange(dateObj);
          }
          
          return false;
        } catch (err) {
          console.warn("Error validating date range:", err, item.x);
          return false;
        }
      });
    };
    
    data = filterInvalidDates(data);
    if (predictions.length > 0) {
      predictions = filterInvalidDates(predictions);
    }
    
    if (data.length > 0) {
      data = downsampleData(data);
    }
    
    if (predictions.length > 0) {
      predictions = downsampleData(predictions);
    }
    
    console.log("Chart data before processing:", data.slice(0, 2));
    
    const hasPredictions = predictions && Array.isArray(predictions) && predictions.length > 0;
    
    // Only proceed if we have either data or predictions
    if ((!data || data.length === 0) && !hasPredictions) {
      console.warn("No data available for chart rendering");
      return {
        labels: [],
        datasets: []
      };
    }
    
    // If we only have predictions but no data, we can still show the predictions
    const allDates = [];
    
    // Add dates from historical data if available
    if (data && data.length > 0) {
      data.forEach(item => {
        try {
          const date = new Date(item.x);
          if (isValid(date)) {
            allDates.push(format(date, 'yyyy-MM-dd'));
          }
        } catch (err) {
          console.warn("Invalid date in data:", item.x, err);
        }
      });
    }
    
    // Add dates from predictions if available
    if (hasPredictions) {
      predictions.forEach(item => {
        try {
          const date = new Date(item.x);
          if (isValid(date) && !allDates.includes(format(date, 'yyyy-MM-dd'))) {
            allDates.push(format(date, 'yyyy-MM-dd'));
          }
        } catch (err) {
          console.warn("Invalid date in predictions:", item.x, err);
        }
      });
    }
    
    // If we still have no valid dates, return empty chart
    if (allDates.length === 0) {
      console.warn("No valid dates found for chart rendering");
      return {
        labels: [],
        datasets: []
      };
    }
    
    // Sort dates chronologically
    allDates.sort((a, b) => new Date(a) - new Date(b));
    
    console.log("Chart data before processing:", data.slice(0, 2));
    
    // Gather all dates from both datasets
    const dateSet = new Set();
    const dateMap = new Map(); // Map to store date string -> Date object
    
    // Process data dates if available
    if (data && data.length > 0) {
      data.forEach(item => {
        try {
          let dateObj;
          if (typeof item.x === 'string') {
            dateObj = parseISO(item.x);
          } else if (item.x instanceof Date) {
            dateObj = item.x;
          }
          
          if (isValid(dateObj)) {
            const dateStr = format(dateObj, 'yyyy-MM-dd');
            dateSet.add(dateStr);
            dateMap.set(dateStr, dateObj);
          }
        } catch (err) {
          console.warn("Error processing date for chart:", item.x, err);
        }
      });
    }
    
    // Process prediction dates if available
    if (hasPredictions) {
      predictions.forEach(item => {
        try {
          let dateObj;
          if (typeof item.x === 'string') {
            dateObj = parseISO(item.x);
          } else if (item.x instanceof Date) {
            dateObj = item.x;
          }
          
          if (isValid(dateObj)) {
            const dateStr = format(dateObj, 'yyyy-MM-dd');
            dateSet.add(dateStr);
            dateMap.set(dateStr, dateObj);
          }
        } catch (err) {
          console.warn("Error processing prediction date for chart:", item.x, err);
        }
      });
    }
    
    // Convert Set to sorted array
    const sortedDates = Array.from(dateSet).sort();
    
    // If we have no valid dates, return empty chart
    if (sortedDates.length === 0) {
      console.warn("No valid dates found for chart rendering");
      return {
        labels: [],
        datasets: []
      };
    }
    
    // Convert dates back to Date objects for chart
    const dateObjects = sortedDates.map(dateStr => dateMap.get(dateStr));
    
    // Prepare datasets
    const datasets = [];
    
    // Find the last valid Gold TH data point
    let lastGoldThPoint = null;
    let lastGoldThDate = null;
    
    if (data && data.length > 0) {
      // Sort data by date first to ensure we get the truly last point
      const sortedData = [...data].sort((a, b) => {
        try {
          const dateA = typeof a.x === 'string' ? parseISO(a.x) : a.x;
          const dateB = typeof b.x === 'string' ? parseISO(b.x) : b.x;
          return dateA - dateB;
        } catch (err) {
          console.warn("Error sorting data points:", err);
          return 0;
        }
      });

      // Get the last valid point
      for (let i = sortedData.length - 1; i >= 0; i--) {
        const item = sortedData[i];
        try {
          if (item && item.y !== null && item.y !== undefined && !isNaN(item.y)) {
            lastGoldThPoint = item.y;
            
            let dateObj;
            if (typeof item.x === 'string') {
              dateObj = parseISO(item.x);
            } else if (item.x instanceof Date) {
              dateObj = item.x;
            }
            
            if (isValid(dateObj)) {
              lastGoldThDate = format(dateObj, 'yyyy-MM-dd');
              console.log("Found last valid Gold TH point:", {
                value: lastGoldThPoint,
                date: lastGoldThDate,
                originalDate: item.x
              });
              break;
            }
          }
        } catch (err) {
          console.warn("Error finding last valid gold TH point:", item, err);
        }
      }
    }
    
    // Only add data dataset if it has values
    if (data && data.length > 0) {
      datasets.push({
        label: `${selectedCategory}`,
        data: sortedDates.map(dateStr => {
          const matchingItem = data.find(item => {
            try {
              if (typeof item.x === 'string') {
                return format(parseISO(item.x), 'yyyy-MM-dd') === dateStr;
              } else if (item.x instanceof Date) {
                return format(item.x, 'yyyy-MM-dd') === dateStr;
              }
              return false;
            } catch {
              return false;
            }
          });
          return matchingItem ? matchingItem.y : null;
        }),
        borderColor: darkMode ? 'rgba(255, 99, 132, 1)' : 'rgba(255, 99, 132, 1)',
        backgroundColor: 'rgba(0, 0, 0, 0)',
        tension: 0.4,
      });
    }
    
    // Only add prediction dataset if it has values
    if (hasPredictions) {
      // If we have valid predictions, create a modified array with the first prediction 
      // having the same value as the last Gold TH point
      let modifiedPredictions = [...predictions];
      
      if (lastGoldThPoint !== null && modifiedPredictions.length > 0) {
        // Sort predictions by date to ensure we modify the correct point
        modifiedPredictions.sort((a, b) => {
          try {
            const dateA = typeof a.x === 'string' ? parseISO(a.x) : a.x;
            const dateB = typeof b.x === 'string' ? parseISO(b.x) : b.x;
            return dateA - dateB;
          } catch (err) {
            console.warn("Error sorting predictions:", err);
            return 0;
          }
        });

        // Find the earliest prediction that comes after the last Gold TH point
        const firstFuturePrediction = modifiedPredictions.find(pred => {
          try {
            const predDate = typeof pred.x === 'string' ? parseISO(pred.x) : pred.x;
            const lastGoldDate = parseISO(lastGoldThDate);
            return predDate > lastGoldDate;
          } catch (err) {
            console.warn("Error comparing prediction date:", err);
            return false;
          }
        });

        if (firstFuturePrediction) {
          console.log("Setting first future prediction point to match last Gold TH point:", {
            predictionDate: firstFuturePrediction.x,
            originalValue: firstFuturePrediction.y,
            newValue: lastGoldThPoint
          });
          firstFuturePrediction.y = lastGoldThPoint;
        }
      }
      
      datasets.push({
        label: "Prediction",
        data: sortedDates.map(dateStr => {
          // First check if we have real data for this date
          const hasRealData = data.some(item => {
            try {
              if (typeof item.x === 'string') {
                return format(parseISO(item.x), 'yyyy-MM-dd') === dateStr;
              } else if (item.x instanceof Date) {
                return format(item.x, 'yyyy-MM-dd') === dateStr;
              }
              return false;
            } catch {
              return false;
            }
          });
          
          // If we have real data for this date, don't show prediction
          if (hasRealData) {
            return null;
          }
          
          // For all prediction dates
          const matchingItem = modifiedPredictions.find(item => {
            try {
              if (typeof item.x === 'string') {
                return format(parseISO(item.x), 'yyyy-MM-dd') === dateStr;
              } else if (item.x instanceof Date) {
                return format(item.x, 'yyyy-MM-dd') === dateStr;
              }
              return false;
            } catch {
              return false;
            }
          });
          return matchingItem ? matchingItem.y : null;
        }),
        borderColor: darkMode ? 'rgba(75, 192, 192, 1)' : 'rgba(75, 192, 192, 1)',
        backgroundColor: 'rgba(0, 0, 0, 0)',
        tension: 0.2,
        borderDash: [5, 5],
        spanGaps: true,  // This will help connect across null values
      });
    }
    
    return {
      labels: dateObjects,
      datasets: datasets
    };
  }, [selectedCategory, goldThData, goldUsData, usdthbData, predictData, darkMode]);

  // Chart options
  const options = useMemo(() => {
    return {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'index',
        intersect: false,
      },
      plugins: {
        legend: {
          display: true,
          position: 'top',
          labels: {
            color: darkMode ? '#f3f4f6' : '#1f2937',
            font: {
              family: "'Inter', sans-serif",
              size: 12
            },
            usePointStyle: true,
            boxWidth: 6
          }
        },
        tooltip: {
          enabled: true,
          backgroundColor: darkMode ? 'rgba(31, 41, 55, 0.8)' : 'rgba(255, 255, 255, 0.8)',
          titleColor: darkMode ? '#f3f4f6' : '#1f2937',
          bodyColor: darkMode ? '#d1d5db' : '#4b5563',
          bodyFont: {
            family: "'Inter', sans-serif"
          },
          padding: 12,
          cornerRadius: 8,
          displayColors: true,
          usePointStyle: true,
          borderColor: darkMode ? 'rgba(75, 85, 99, 0.2)' : 'rgba(229, 231, 235, 0.8)',
          borderWidth: 1,
          callbacks: {
            title: function(tooltipItems) {
              if (!tooltipItems.length) return '';
              const xValue = tooltipItems[0].parsed.x;
              
              // Check if parsed x is valid
              if (xValue === null || isNaN(xValue)) {
                return 'Invalid date';
              }
              
              try {
                const date = new Date(xValue);
                // Only format if it's a valid date
                if (isValid(date)) {
                  return format(date, 'dd MMMM yyyy', { locale: enUS });
                } else {
                  return 'Invalid date';
                }
              } catch (err) {
                console.error('Error formatting date in tooltip:', err);
                return 'Invalid date';
              }
            },
            label: function(tooltipItem) {
              let label = tooltipItem.dataset.label || '';
              
              if (label) {
                label += ': ';
              }
              if (tooltipItem.parsed.y !== null) {
                label += new Intl.NumberFormat('en-US').format(tooltipItem.parsed.y);
              }
              return label;
            }
          }
        },
      },
      scales: {
        x: {
          type: 'time',
          time: {
            unit: timeframe === '7d' ? 'day' : timeframe === '1m' ? 'week' : 'month',
            tooltipFormat: 'dd MMMM yyyy',
            displayFormats: {
              day: 'd MMM',
              week: 'dd MMM',
              month: 'MMM yyyy'
            }
          },
          grid: {
            color: darkMode ? 'rgba(75, 85, 99, 0.15)' : 'rgba(229, 231, 235, 0.5)',
          },
          ticks: {
            color: darkMode ? '#9ca3af' : '#4b5563',
            font: {
              family: "'Inter', sans-serif",
              size: 10
            }
          },
          border: {
            color: darkMode ? 'rgba(75, 85, 99, 0.2)' : 'rgba(229, 231, 235, 0.8)'
          }
        },
        y: {
          grid: {
            color: darkMode ? 'rgba(75, 85, 99, 0.15)' : 'rgba(229, 231, 235, 0.5)',
          },
          ticks: {
            color: darkMode ? '#9ca3af' : '#4b5563',
            font: {
              family: "'Inter', sans-serif",
              size: 10
            },
            callback: function(value) {
              return new Intl.NumberFormat('en-US', { 
                minimumFractionDigits: 0,
                maximumFractionDigits: 2 
              }).format(value);
            }
          },
          border: {
            color: darkMode ? 'rgba(75, 85, 99, 0.2)' : 'rgba(229, 231, 235, 0.8)'
          }
        }
      }
    };
  }, [timeframe, darkMode]);

  // Update chart tooltip on theme change
  useEffect(() => {
    if (chartRef.current) {
      const chart = chartRef.current;
      
      // Force update on dark mode change
      if (chart.data && chart.options) {
        chart.update();
      }
    }
  }, [darkMode]);

  const handleCategoryChange = (category) => {
    setSelectedCategory(category);
  };

  const handleTimeframeChange = (newTimeframe) => {
    setTimeframe(newTimeframe);
  };

  // Calculate statistics for the selected category
  const calculateStats = () => {
    let currentData;
    
    switch (selectedCategory) {
      case DataCategories.GOLD_TH:
        currentData = goldThData;
        break;
      case DataCategories.GOLD_US:
        currentData = goldUsData;
        break;
      case DataCategories.USDTHB:
        currentData = usdthbData;
        break;
      default:
        currentData = goldThData;
    }
    
    if (!currentData || currentData.length === 0) {
      return {
        currentPrice: '-',
        change: 0,
        percentChange: 0,
        minPrice: '-',
        maxPrice: '-',
        minMaxRange: '-'
      };
    }
    
    // Sort data by date
    const sortedData = [...currentData].sort((a, b) => {
      return compareAsc(new Date(a.x), new Date(b.x));
    });
    
    const latestPrice = sortedData[sortedData.length - 1].y;
    const previousPrice = sortedData.length > 1 ? sortedData[sortedData.length - 2].y : latestPrice;
    
    const change = latestPrice - previousPrice;
    const percentChange = ((change / previousPrice) * 100);
    
    // Find min and max values
    const prices = sortedData.map(item => item.y);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    
    return {
      currentPrice: latestPrice,
      change,
      percentChange,
      minPrice,
      maxPrice,
      minMaxRange: `${minPrice} - ${maxPrice}`
    };
  };
  
  const stats = calculateStats();

  return (
    <div className="card overflow-hidden">
      <div className="p-4 sm:p-6 space-y-6">
        {/* Chart Header and Controls */}
        <div className="space-y-4">
          {/* Statistic Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="stats-item">
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Current Price</span>
              <span className="text-2xl font-bold text-night-900 dark:text-white tracking-tight">{typeof stats.currentPrice === 'number' ? new Intl.NumberFormat('en-US').format(stats.currentPrice) : stats.currentPrice}</span>
            </div>
            
            <div className="stats-item">
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Change</span>
              <div className="flex items-center">
                <span className={`text-lg font-bold tracking-tight ${stats.change > 0 ? 'text-emerald-500' : stats.change < 0 ? 'text-rose-500' : 'text-gray-600 dark:text-gray-400'}`}>
                  {stats.change > 0 ? '+' : ''}{typeof stats.change === 'number' ? new Intl.NumberFormat('en-US').format(stats.change) : stats.change}
                </span>
                <span className={`ml-1 text-sm ${stats.change > 0 ? 'text-emerald-500' : stats.change < 0 ? 'text-rose-500' : 'text-gray-600 dark:text-gray-400'}`}>
                  ({stats.change > 0 ? '+' : ''}{typeof stats.percentChange === 'number' ? stats.percentChange.toFixed(2) : stats.percentChange}%)
                </span>
              </div>
            </div>
            
            <div className="stats-item">
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Min-Max Range</span>
              <span className="text-lg font-bold text-night-900 dark:text-white tracking-tight">{stats.minMaxRange}</span>
            </div>
          </div>
          
          {/* Currency and Time Controls */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <button 
                onClick={() => handleCategoryChange(DataCategories.GOLD_TH)}
                className={`btn ${selectedCategory === DataCategories.GOLD_TH ? 'btn-primary' : 'btn-secondary'}`}
              >
                Gold TH
              </button>
              <button 
                onClick={() => handleCategoryChange(DataCategories.GOLD_US)}
                className={`btn ${selectedCategory === DataCategories.GOLD_US ? 'btn-primary' : 'btn-secondary'}`}
              >
                Gold US
              </button>
              <button 
                onClick={() => handleCategoryChange(DataCategories.USDTHB)}
                className={`btn ${selectedCategory === DataCategories.USDTHB ? 'btn-primary' : 'btn-secondary'}`}
              >
                USD/THB
              </button>
            </div>
            
            <div className="flex flex-wrap items-center gap-2">
              <button 
                onClick={() => handleTimeframeChange('7d')}
                className={`btn ${timeframe === '7d' ? 'btn-gold' : 'btn-secondary'}`}
              >
                7 Days
              </button>
              <button 
                onClick={() => handleTimeframeChange('1m')}
                className={`btn ${timeframe === '1m' ? 'btn-gold' : 'btn-secondary'}`}
              >
                1 Month
              </button>
              <button 
                onClick={() => handleTimeframeChange('1y')}
                className={`btn ${timeframe === '1y' ? 'btn-gold' : 'btn-secondary'}`}
              >
                1 Year
              </button>
              <button 
                onClick={() => handleTimeframeChange('all')}
                className={`btn ${timeframe === 'all' ? 'btn-gold' : 'btn-secondary'}`}
              >
                All
              </button>
            </div>
          </div>
        </div>
        
        {/* Chart Container */}
        <div className="relative h-80 md:h-96">
          {loading ? (
            <div className="absolute inset-0 flex items-center justify-center bg-white/70 dark:bg-night-800/70 backdrop-blur-sm rounded-xl z-10">
              <div className="flex flex-col items-center space-y-3">
                <div className="w-10 h-10 rounded-full border-2 border-t-royal-600 border-gray-200 dark:border-night-600 animate-spin"></div>
                <span className="text-sm text-gray-600 dark:text-gray-300">Loading data...</span>
              </div>
            </div>
          ) : null}
          
          {error ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center space-y-2">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 text-rose-500 mx-auto">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                </svg>
                <h3 className="font-medium text-rose-500">Error</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">{error}</p>
                <button 
                  onClick={() => window.location.reload()} 
                  className="btn btn-secondary mt-2"
                >
                  Retry
                </button>
              </div>
            </div>
          ) : null}
          
          <Line data={chartData} options={options} ref={chartRef} />
          
          {/* Legend for Prediction */}
          {selectedCategory === DataCategories.GOLD_TH && predictData && predictData.length > 0 && (
            <div className="mt-4 p-3 bg-gray-50 dark:bg-night-700/30 rounded-lg">
              <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                <div className="flex items-center mr-4">
                  <span className="inline-block w-3 h-3 mr-2 rounded-full bg-cyan-600 dark:bg-teal-400"></span>
                  <span>ราคาปัจจุบัน</span>
                </div>
                <div className="flex items-center">
                  <span className="inline-block w-3 h-3 mr-2 rounded-full bg-rose-600 dark:bg-rose-400"></span>
                  <span>การพยากรณ์</span>
                </div>
              </div>
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">ข้อมูลการพยากรณ์อ้างอิงจากแบบจำลองทางสถิติ ไม่ใช่คำแนะนำในการลงทุน</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GoldChart;