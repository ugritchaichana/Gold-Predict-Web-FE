import { parseISO, format, isValid } from 'date-fns';

/**
 * แปลงรูปแบบข้อมูลให้เหมาะสมสำหรับแสดงบน Lightweight Charts
 * @param {Object|Array} goldData - ข้อมูลราคาทองดิบจาก API
 * @returns {Object} - ข้อมูลที่แปลงรูปแบบแล้ว
 */
export const transformGoldData = (goldData) => {
  // ตรวจสอบรูปแบบข้อมูลแบบใหม่ (Array ของ object ที่มี Bar Buy และ time)
  const isNewDataFormat = Array.isArray(goldData) && 
                         goldData.length > 0 && 
                         goldData[0] && 
                         'Bar Buy' in goldData[0] && 
                         'time' in goldData[0];

  // กรณีเป็นข้อมูลรูปแบบใหม่ [{ "Bar Buy": X, "Bar Sell": Y, ... }]
  if (isNewDataFormat) {
    const transformedData = {
      barBuy: [],
      barSell: [],
      ornamentBuy: [],
      ornamentSell: [],
      barPriceChange: [],
      timestamps: [],
      dates: [],
    };
    
    // Create a temporary array to hold all data points with their timestamps
    const dataPoints = [];

    for (const item of goldData) {
      // Format for lightweight charts (time in seconds)
      const time = item.time || 0;
      
      // Skip invalid timestamps (zero or negative)
      if (time <= 0) continue;
      
      dataPoints.push({
        time,
        date: new Date(time * 1000).toISOString(),
        barBuy: parseFloat(item['Bar Buy']) || 0,
        barSell: parseFloat(item['Bar Sell']) || 0,
        ornamentBuy: parseFloat(item['Ornament Buy']) || 0,
        ornamentSell: parseFloat(item['Ornament Sell']) || 0,
        barPriceChange: parseFloat(item['Price Change']) || 0,
      });
    }

    // Sort data points by time in ascending order
    dataPoints.sort((a, b) => a.time - b.time);
    
    // Now build the transformed data with sorted points
    for (const point of dataPoints) {
      transformedData.timestamps.push({
        time: point.time,
        value: point.barBuy
      });
      
      transformedData.barBuy.push({
        time: point.time,
        value: point.barBuy
      });
      
      transformedData.barSell.push({
        time: point.time,
        value: point.barSell
      });
      
      transformedData.ornamentBuy.push({
        time: point.time,
        value: point.ornamentBuy
      });
      
      transformedData.ornamentSell.push({
        time: point.time,
        value: point.ornamentSell
      });
      
      transformedData.barPriceChange.push({
        time: point.time,
        value: point.barPriceChange,
        color: point.barPriceChange >= 0 ? 'rgba(0, 150, 136, 0.8)' : 'rgba(255, 82, 82, 0.8)',
      });
      
      if (point.date) {
        transformedData.dates.push({
          date: point.date,
          time: point.time,
        });
      }
    }
    
    return transformedData;
  }
  
  // กรณีเป็นข้อมูลรูปแบบเดิม (goldData.data.labels และ goldData.data.datasets)
  if (!goldData || !goldData.data || !goldData.data.labels) {
    return {
      barBuy: [],
      barSell: [],
      ornamentBuy: [],
      ornamentSell: [],
      barPriceChange: [],
      timestamps: [],
      dates: [],
    };
  }

  try {
    const { labels, datasets } = goldData.data;
    const transformedData = {
      barBuy: [],
      barSell: [],
      ornamentBuy: [],
      ornamentSell: [],
      barPriceChange: [],
      timestamps: [],
      dates: [],
    };
    
    // Find dataset indexes
    const datesetIndex = datasets.findIndex(set => set.label === 'Date');
    const timestampIndex = datasets.findIndex(set => set.label === 'Timestamp');
    const barBuyIndex = datasets.findIndex(set => set.label === 'Price');
    const barSellIndex = datasets.findIndex(set => set.label === 'Bar Sell Price');
    const ornamentBuyIndex = datasets.findIndex(set => set.label === 'Ornament Buy Price');
    const ornamentSellIndex = datasets.findIndex(set => set.label === 'Ornament Sell Price');
    const barChangeIndex = datasets.findIndex(set => set.label === 'Bar Price Change');
    
    // Create a temporary array to hold all data points with their timestamps
    const dataPoints = [];
    
    for (let i = 0; i < labels.length; i++) {
      const timestamp = datasets[timestampIndex]?.data[i];
      const date = datasets[datesetIndex]?.data[i];
      
      // Format for lightweight charts (time in seconds)
      const time = timestamp ? Math.floor(timestamp / 1000) : 0;
      
      // Skip invalid timestamps (zero or negative)
      if (time <= 0) continue;
      
      dataPoints.push({
        time,
        date,
        barBuy: datasets[barBuyIndex]?.data[i] || 0,
        barSell: datasets[barSellIndex]?.data[i] || 0,
        ornamentBuy: datasets[ornamentBuyIndex]?.data[i] || 0,
        ornamentSell: datasets[ornamentSellIndex]?.data[i] || 0,
        barPriceChange: datasets[barChangeIndex]?.data[i] || 0,
      });
    }
    
    // Sort data points by time in ascending order
    dataPoints.sort((a, b) => a.time - b.time);
    
    // Now build the transformed data with sorted points
    for (const point of dataPoints) {
      transformedData.timestamps.push({
        time: point.time,
        value: point.barBuy
      });
      
      transformedData.barBuy.push({
        time: point.time,
        value: point.barBuy
      });
      
      transformedData.barSell.push({
        time: point.time,
        value: point.barSell
      });
      
      transformedData.ornamentBuy.push({
        time: point.time,
        value: point.ornamentBuy
      });
      
      transformedData.ornamentSell.push({
        time: point.time,
        value: point.ornamentSell
      });
      
      transformedData.barPriceChange.push({
        time: point.time,
        value: point.barPriceChange,
        color: point.barPriceChange >= 0 ? 'rgba(0, 150, 136, 0.8)' : 'rgba(255, 82, 82, 0.8)',
      });
      
      transformedData.dates.push({
        date: point.date,
        time: point.time,
      });
    }
      
    return transformedData;
  } catch (error) {
    console.error("Error transforming gold data:", error);
    return {
      barBuy: [],
      barSell: [],
      ornamentBuy: [],
      ornamentSell: [],
      barPriceChange: [],
      timestamps: [],
      dates: [],
    };
  }
};

/**
 * แปลงรูปแบบข้อมูล Prediction ให้เหมาะสมสำหรับแสดงบน Lightweight Charts
 * @param {Object} predictionData - ข้อมูล Prediction จาก API
 * @returns {Array} - ข้อมูล Prediction ที่แปลงรูปแบบแล้ว
 */
export const transformPredictionData = (predictionData) => {
  if (!predictionData || !predictionData.labels || !predictionData.data) {
    return [];
  }

  try {
    const { labels, data } = predictionData;
    const transformedData = labels.map((label, index) => {
      // Convert string date to timestamp (seconds since epoch)
      let time;
      try {
        const dateObj = parseISO(label);
        if (isValid(dateObj)) {
          // Convert to seconds since epoch
          time = Math.floor(dateObj.getTime() / 1000);
        } else {
          // Fallback: Try to parse DD-MM-YY format
          const parts = label.split('-');
          if (parts.length === 3) {
            // Assuming DD-MM-YY format
            const dateStr = `20${parts[2]}-${parts[1]}-${parts[0]}`;
            const newDateObj = parseISO(dateStr);
            time = Math.floor(newDateObj.getTime() / 1000);
          } else {
            console.warn(`Invalid date format: ${label}`);
            // Use current time plus index days as fallback
            time = Math.floor(Date.now() / 1000) + index * 86400;
          }
        }
      } catch (error) {
        console.warn(`Error parsing date: ${label}`, error);
        // Use current time plus index days as fallback
        time = Math.floor(Date.now() / 1000) + index * 86400;
      }

      return {
        time,
        value: data[index],
      };
    });
    
    // Sort the transformed data by time in ascending order
    return transformedData.sort((a, b) => a.time - b.time);
  } catch (error) {
    console.error("Error transforming prediction data:", error);
    return [];
  }
};

/**
 * รวมข้อมูลเดิมกับข้อมูลเพิ่มเติม (ใช้เมื่อโหลดข้อมูลเพิ่มเติม)
 * @param {Object} existingData
 * @param {Object} newData
 * @returns {Object}
 */
export const mergeGoldData = (existingData, newData) => {
  if (!existingData || !newData) return existingData || newData || {};
  
  const existingTimestamps = new Set(existingData.timestamps.map(item => item.time));
  
  const mergedData = {
    barBuy: [...existingData.barBuy],
    barSell: [...existingData.barSell],
    ornamentBuy: [...existingData.ornamentBuy],
    ornamentSell: [...existingData.ornamentSell],
    barPriceChange: [...existingData.barPriceChange],
    timestamps: [...existingData.timestamps],
    dates: [...existingData.dates],
  };
  
  // เพิ่มข้อมูลใหม่ที่ไม่ซ้ำกับข้อมูลเดิม
  newData.timestamps.forEach((item, index) => {
    if (!existingTimestamps.has(item.time)) {
      mergedData.timestamps.push(item);
      mergedData.barBuy.push(newData.barBuy[index]);
      mergedData.barSell.push(newData.barSell[index]);
      mergedData.ornamentBuy.push(newData.ornamentBuy[index]);
      mergedData.ornamentSell.push(newData.ornamentSell[index]);
      mergedData.barPriceChange.push(newData.barPriceChange[index]);
      mergedData.dates.push(newData.dates[index]);
    }
  });
  
  // เรียงข้อมูลตามเวลา
  const sortByTime = (a, b) => a.time - b.time;
  mergedData.timestamps.sort(sortByTime);
  mergedData.barBuy.sort(sortByTime);
  mergedData.barSell.sort(sortByTime);
  mergedData.ornamentBuy.sort(sortByTime);
  mergedData.ornamentSell.sort(sortByTime);
  mergedData.barPriceChange.sort(sortByTime);
  mergedData.dates.sort((a, b) => a.time - b.time);
  
  return mergedData;
};

/**
 * จัดรูปแบบวันที่สำหรับแสดงผล
 * @param {string|number|Date} date - วันที่ในรูปแบบ timestamp, string หรือ Date object
 * @returns {string} - วันที่ในรูปแบบ DD-MM-YYYY
 */
export const formatDate = (date) => {
  try {
    // Handle null or undefined
    if (date === null || date === undefined) {
      return 'Invalid Date';
    }
    
    // Handle Date object
    if (date instanceof Date) {
      return format(date, 'dd-MM-yyyy');
    }
    
    // Handle number (timestamp)
    if (typeof date === 'number') {
      // Check if timestamp is in seconds (10 digits) or milliseconds (13 digits)
      const timestamp = date.toString().length <= 10 ? date * 1000 : date;
      const dateObj = new Date(timestamp);
      if (isValid(dateObj)) {
        return format(dateObj, 'dd-MM-yyyy');
      }
    } 
    // Handle string
    else if (typeof date === 'string') {
      // Check if it's already in DD-MM-YY format
      const ddmmyyRegex = /^(\d{1,2})-(\d{1,2})-(\d{2})$/;
      if (ddmmyyRegex.test(date)) {
        const parts = date.split('-');
        return `${parts[0].padStart(2, '0')}-${parts[1].padStart(2, '0')}-20${parts[2]}`;
      }
      
      // Check if it's in DD-MM-YYYY format
      const ddmmyyyyRegex = /^(\d{1,2})-(\d{1,2})-(\d{4})$/;
      if (ddmmyyyyRegex.test(date)) {
        const parts = date.split('-');
        return `${parts[0].padStart(2, '0')}-${parts[1].padStart(2, '0')}-${parts[2]}`;
      }
      
      // Try to parse using parseISO for ISO format dates
      const parsed = parseISO(date);
      if (isValid(parsed)) {
        return format(parsed, 'dd-MM-yyyy');
      }
      
      // Fallback: try creating a new Date object
      const dateObj = new Date(date);
      if (isValid(dateObj)) {
        return format(dateObj, 'dd-MM-yyyy');
      }
    }
    
    return 'Invalid Date';
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid Date';
  }
};

/**
 * จัดรูปแบบการแสดงผลการเปลี่ยนแปลงราคา
 * @param {number} change - ค่าการเปลี่ยนแปลง
 * @param {number} originalPrice - ราคาก่อนเปลี่ยนแปลง
 * @returns {string} - ข้อความแสดงการเปลี่ยนแปลงพร้อมเปอร์เซ็นต์
 */
export const formatPriceChange = (change, originalPrice) => {
  try {
    // Handle null, undefined, or non-numeric values
    if (change === null || change === undefined || isNaN(parseFloat(change))) {
      return '+0 (0%)';
    }
    
    // Parse the values to ensure they're numbers
    const numericChange = parseFloat(change);
    const numericOriginalPrice = parseFloat(originalPrice);
    
    const sign = numericChange >= 0 ? '+' : '';
    
    // Calculate percentage change safely
    let percentChange = '0.00';
    if (numericOriginalPrice && numericOriginalPrice !== 0) {
      percentChange = ((numericChange / numericOriginalPrice) * 100).toFixed(2);
      // Handle potential NaN or Infinity
      if (isNaN(percentChange) || !isFinite(percentChange)) {
        percentChange = '0.00';
      }
    }
    
    return `${sign}${numericChange.toFixed(2)} (${sign}${percentChange}%)`;
  } catch (error) {
    console.error("Error formatting price change:", error);
    return '+0 (0%)';
  }
};
