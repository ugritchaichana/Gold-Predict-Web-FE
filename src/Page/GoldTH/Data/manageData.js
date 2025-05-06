import { parseISO, format, isValid } from 'date-fns';

/**
 * แปลงรูปแบบข้อมูลให้เหมาะสมสำหรับแสดงบน Lightweight Charts
 * @param {Object} goldData - ข้อมูลราคาทองดิบจาก API
 * @returns {Object} - ข้อมูลที่แปลงรูปแบบแล้ว
 */
export const transformGoldData = (goldData) => {
  if (!goldData || !goldData.data || !goldData.data.labels) {
    return {
      barBuy: [],
      barSell: [],
      ornamentBuy: [],
      ornamentSell: [],
      barPriceChange: [],
      timestamps: [],
    };
  }

  try {
    const { labels, datasets } = goldData.data;
    
    // Find dataset indexes
    const datesetIndex = datasets.findIndex(set => set.label === 'Date');
    const timestampIndex = datasets.findIndex(set => set.label === 'Timestamp');
    const barBuyIndex = datasets.findIndex(set => set.label === 'Price');
    const barSellIndex = datasets.findIndex(set => set.label === 'Bar Sell Price');
    const ornamentBuyIndex = datasets.findIndex(set => set.label === 'Ornament Buy Price');
    const ornamentSellIndex = datasets.findIndex(set => set.label === 'Ornament Sell Price');
    const barChangeIndex = datasets.findIndex(set => set.label === 'Bar Price Change');
    
    // Map the data
    const transformedData = {
      barBuy: [],
      barSell: [],
      ornamentBuy: [],
      ornamentSell: [],
      barPriceChange: [],
      timestamps: [],
      dates: [],
    };
    
    for (let i = 0; i < labels.length; i++) {
      const timestamp = datasets[timestampIndex]?.data[i];
      const date = datasets[datesetIndex]?.data[i];
      
      // Format for lightweight charts (time in seconds)
      const time = timestamp ? Math.floor(timestamp / 1000) : 0;
      
      transformedData.timestamps.push({
        time,
        value: datasets[barBuyIndex]?.data[i] || 0
      });
      
      transformedData.barBuy.push({
        time,
        value: datasets[barBuyIndex]?.data[i] || 0
      });
      
      transformedData.barSell.push({
        time,
        value: datasets[barSellIndex]?.data[i] || 0
      });
      
      transformedData.ornamentBuy.push({
        time,
        value: datasets[ornamentBuyIndex]?.data[i] || 0
      });
      
      transformedData.ornamentSell.push({
        time,
        value: datasets[ornamentSellIndex]?.data[i] || 0
      });
      
      transformedData.barPriceChange.push({
        time,
        value: datasets[barChangeIndex]?.data[i] || 0,
        color: (datasets[barChangeIndex]?.data[i] || 0) >= 0 ? 'rgba(0, 150, 136, 0.8)' : 'rgba(255, 82, 82, 0.8)',
      });
      
      transformedData.dates.push({
        date,
        time,
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
    return labels.map((label, index) => {
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