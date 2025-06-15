import { logger } from '../../../utils/logger';

/**
 * Validate chart data to ensure it meets lightweight-charts requirements
 * - Must be sorted by time in ascending order
 * - No duplicate timestamps
 * - All values must be finite numbers
 */
export const validateChartData = (data, seriesKey = '') => {
    if (!Array.isArray(data) || data.length === 0) {
        return [];
    }
    
    // First, filter out invalid entries
    const validData = data.filter(item => {
        if (!item || typeof item.time !== 'number' || !isFinite(item.time)) {
            return false;
        }
        
        // For candlestick data
        if (item.open !== undefined) {
            return isFinite(item.open) && isFinite(item.high) && 
                   isFinite(item.low) && isFinite(item.close) &&
                   item.high >= Math.max(item.open, item.close) &&
                   item.low <= Math.min(item.open, item.close);
        }
        
        // For line data
        if (item.value !== undefined) {
            return isFinite(item.value);
        }
        
        return false;
    });
    
    if (validData.length === 0) {
        logger.warn(`No valid data points for series ${seriesKey}`);
        return [];
    }
    
    // Sort by time
    validData.sort((a, b) => a.time - b.time);
    
    // Remove duplicates by timestamp, keeping the last occurrence
    const uniqueData = [];
    const timeSet = new Set();
    
    for (let i = validData.length - 1; i >= 0; i--) {
        const item = validData[i];
        if (!timeSet.has(item.time)) {
            timeSet.add(item.time);
            uniqueData.unshift(item);
        }
    }
      // Final validation - ensure data is truly ascending
    for (let i = 1; i < uniqueData.length; i++) {
        if (uniqueData[i].time <= uniqueData[i - 1].time) {
            logger.error(`Data validation failed for ${seriesKey}: time order issue at index ${i}`, {
                current: uniqueData[i],
                previous: uniqueData[i - 1]
            });
            // Remove the problematic item
            uniqueData.splice(i, 1);
            i--; // Adjust index since we removed an item
        }
    }
    
    if (data.length !== uniqueData.length) {
        logger.log(`Validated data for ${seriesKey}: ${data.length} -> ${uniqueData.length} points (removed ${data.length - uniqueData.length} invalid/duplicate entries)`);
    }
    
    return uniqueData;
};

/**
 * Process time series data with validation
 */
export const processTimeSeriesDataSafe = (data, isCandlestick = false, seriesKey = '') => {
    if (!Array.isArray(data) || data.length === 0) {
        return [];
    }
    
    const result = data
      .filter(item => item && typeof item.time === 'number' && isFinite(item.time))
      .map(item => {
        if (isCandlestick) {
          return {
            time: item.time,
            open: typeof item.open === 'number' ? item.open : Number(item.open),
            high: typeof item.high === 'number' ? item.high : Number(item.high),
            low: typeof item.low === 'number' ? item.low : Number(item.low),
            close: typeof item.close === 'number' ? item.close : Number(item.close),
          };
        }
        return {
          time: item.time,
          value: typeof item.value === 'number' ? item.value : Number(item.value),
        };
      });
      
    return validateChartData(result, seriesKey);
};
