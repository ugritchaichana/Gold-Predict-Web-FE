import { format } from 'date-fns';

/**
 * แปลงรูปแบบข้อมูลราคาทองสากล (US) จากแบบใหม่เป็นแบบที่ใช้กับ Lightweight Charts
 * @param {Array} data - ข้อมูลดิบจาก API
 * @returns {Object} - ข้อมูลที่แปลงรูปแบบแล้ว
 */
export const transformGoldUsData = (data) => {
  if (!data || !Array.isArray(data)) {
    return {
      open: [],
      high: [],
      low: [],
      close: [],
      timestamps: []
    };
  }

  try {
    const transformedData = {
      open: [],
      high: [],
      low: [],
      close: [],
      timestamps: []
    };

    data.forEach(item => {
      // Make sure timestamp is in seconds
      const time = typeof item.timestamp === 'number' 
        ? (String(item.timestamp).length > 10 ? Math.floor(item.timestamp / 1000) : item.timestamp)
        : 0;
      
      transformedData.open.push({
        time,
        value: Number(item.open) || 0
      });
      
      transformedData.high.push({
        time,
        value: Number(item.high) || 0
      });
      
      transformedData.low.push({
        time,
        value: Number(item.low) || 0
      });
      
      transformedData.close.push({
        time,
        value: Number(item.close) || 0
      });
      
      transformedData.timestamps.push({
        time,
        value: Number(item.close) || 0
      });
    });
    
    return transformedData;
  } catch (error) {
    console.error("Error transforming gold US data:", error);
    return {
      open: [],
      high: [],
      low: [],
      close: [],
      timestamps: []
    };
  }
};

/**
 * แปลงรูปแบบข้อมูลอัตราแลกเปลี่ยน USD/THB จากแบบใหม่เป็นแบบที่ใช้กับ Lightweight Charts
 * @param {Array} data - ข้อมูลดิบจาก API
 * @returns {Object} - ข้อมูลที่แปลงรูปแบบแล้ว
 */
export const transformUsdThbData = (data) => {
  if (!data || !Array.isArray(data)) {
    return {
      rate: [],
      timestamps: []
    };
  }

  try {
    const transformedData = {
      open: [],
      high: [],
      low: [],
      close: [],
      timestamps: []
    };

    data.forEach(item => {
      // Make sure timestamp is in seconds
      const time = typeof item.timestamp === 'number' 
        ? (String(item.timestamp).length > 10 ? Math.floor(item.timestamp / 1000) : item.timestamp)
        : 0;
      
      transformedData.open.push({
        time,
        value: Number(item.open) || 0
      });
      
      transformedData.high.push({
        time,
        value: Number(item.high) || 0
      });
      
      transformedData.low.push({
        time,
        value: Number(item.low) || 0
      });
      
      transformedData.close.push({
        time,
        value: Number(item.close) || 0
      });
      
      transformedData.timestamps.push({
        time,
        value: Number(item.close) || 0
      });
    });
    
    return transformedData;
  } catch (error) {
    console.error("Error transforming USD/THB data:", error);
    return {
      open: [],
      high: [],
      low: [],
      close: [],
      timestamps: []
    };
  }
};

/**
 * แปลงข้อมูลจาก API รูปแบบใหม่สำหรับราคาทองไทย
 * @param {Array} data - ข้อมูลดิบจาก API รูปแบบใหม่
 * @returns {Object} - ข้อมูลที่แปลงรูปแบบแล้ว
 */
export const transformNewGoldThData = (data) => {
  if (!data || !Array.isArray(data)) {
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
    const transformedData = {
      barBuy: [],
      barSell: [],
      ornamentBuy: [],
      ornamentSell: [],
      barPriceChange: [],
      timestamps: [],
      dates: [],
    };

    data.forEach(item => {
      // Make sure timestamp is in seconds
      const time = typeof item.time === 'number' 
        ? (String(item.time).length > 10 ? Math.floor(item.time / 1000) : item.time)
        : 0;
        
      const barBuy = Number(item["Bar Buy"]) || 0;
      const barSell = Number(item["Bar Sell"]) || 0;
      const ornamentBuy = Number(item["Ornament Buy"] || item["Oranment Buy"]) || 0; // Handle typo in API
      const ornamentSell = Number(item["Ornament Sell"]) || 0;
      const priceChange = Number(item["Price Change"]) || 0;
      
      transformedData.barBuy.push({
        time,
        value: barBuy
      });
      
      transformedData.barSell.push({
        time,
        value: barSell
      });
      
      transformedData.ornamentBuy.push({
        time,
        value: ornamentBuy
      });
      
      transformedData.ornamentSell.push({
        time,
        value: ornamentSell
      });
      
      transformedData.barPriceChange.push({
        time,
        value: priceChange,
        color: priceChange >= 0 ? 'rgba(0, 150, 136, 0.8)' : 'rgba(255, 82, 82, 0.8)',
      });
      
      transformedData.timestamps.push({
        time,
        value: barBuy
      });
      
      const dateObj = new Date(time * 1000);
      transformedData.dates.push({
        date: format(dateObj, 'dd-MM-yyyy'),
        time,
      });
    });
    
    return transformedData;
  } catch (error) {
    console.error("Error transforming new gold TH data:", error);
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
 * แปลงข้อมูลจาก API รูปแบบใหม่สำหรับคาดการณ์ราคา
 * @param {Array} data - ข้อมูลดิบจาก API รูปแบบใหม่
 * @returns {Array} - ข้อมูลที่แปลงรูปแบบแล้ว
 */
export const transformNewPredictionData = (data) => {
  if (!data || !Array.isArray(data)) {
    return [];
  }

  try {
    return data.map(item => {
      // Make sure timestamp is in seconds
      const time = typeof item.time === 'number' 
        ? (String(item.time).length > 10 ? Math.floor(item.time / 1000) : item.time)
        : 0;
      
      return {
        time,
        value: Number(item.Predict) || 0
      };
    });
  } catch (error) {
    console.error("Error transforming new prediction data:", error);
    return [];
  }
};
