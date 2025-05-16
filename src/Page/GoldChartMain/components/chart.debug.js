// Debug utility for the Chart component
export function debugChartData(chartData, category, options = {}) {
  console.log(`Chart Debug: Processing data for ${category}`);

  if (!chartData) {
    console.warn(`Chart Debug: No chart data provided for ${category}`);
    return null;
  }

  // Clone the data to avoid mutating the original
  const data = JSON.parse(JSON.stringify(chartData));
  
  // Process OHLC data for GOLD_US or USD_THB
  if (category === 'GOLD_US' || category === 'USD_THB') {
    console.log(`Chart Debug: Processing OHLC data for ${category}`, {
      hasOhlcArray: !!data.ohlc,
      ohlcArrayType: data.ohlc ? typeof data.ohlc : 'N/A',
      isArray: data.ohlc ? Array.isArray(data.ohlc) : false,
      length: data.ohlc ? data.ohlc.length : 0,
      sampleItem: data.ohlc && data.ohlc.length > 0 ? data.ohlc[0] : 'No items'
    });

    // Attempt to build OHLC if not present or empty
    if (!data.ohlc || !Array.isArray(data.ohlc) || data.ohlc.length === 0) {
      console.log(`Chart Debug: OHLC array for ${category} is missing or empty. Attempting to build from components.`);      
      if (data.open && data.high && data.low && data.close &&
          Array.isArray(data.open) && Array.isArray(data.high) &&
          Array.isArray(data.low) && Array.isArray(data.close)) {
        
        console.log(`Chart Debug: Found component arrays for ${category}, will build OHLC from them:`, {
          openLength: data.open.length,
          highLength: data.high.length,
          lowLength: data.low.length,
          closeLength: data.close.length
        });
        
        const minLength = Math.min(
          data.open.length || 0,
          data.high.length || 0,
          data.low.length || 0,
          data.close.length || 0
        );
        
        const builtOhlc = [];
        if (minLength > 0) {
            console.log(`Chart Debug: Building OHLC for ${category} from ${minLength} component data points.`);
            
            // Group points by time to ensure data integrity
            const timeMap = new Map();
            
            // Collect all time points from each array
            [data.open, data.high, data.low, data.close].forEach((array, idx) => {
              const names = ['open', 'high', 'low', 'close'];
              array.forEach(point => {
                if (point && typeof point.time === 'number' && typeof point.value === 'number' && isFinite(point.value)) {
                  const time = point.time;
                  if (!timeMap.has(time)) {
                    timeMap.set(time, { time });
                  }
                  timeMap.get(time)[names[idx]] = Number(point.value);
                }
              });
            });
            
            // Convert map to array and filter for complete OHLC points
            for (const [time, point] of timeMap.entries()) {
              if (typeof point.open === 'number' && 
                  typeof point.high === 'number' && 
                  typeof point.low === 'number' && 
                  typeof point.close === 'number' &&
                  isFinite(point.open) &&
                  isFinite(point.high) &&
                  isFinite(point.low) &&
                  isFinite(point.close)) {
                  
                // Ensure high >= low
                if (point.high < point.low) {
                  // Swap high and low
                  const temp = point.high;
                  point.high = point.low;
                  point.low = temp;
                }
                
                builtOhlc.push(point);
              }
            }
            
            // Sort by time
            builtOhlc.sort((a, b) => a.time - b.time);
            
            data.ohlc = builtOhlc;
            console.log(`Chart Debug: Successfully built OHLC array for ${category} with ${data.ohlc.length} items.`);
            
            // Create individual OHLC line series data
            // Generate opening data array
            data.openData = data.ohlc.map(item => ({
              time: item.time,
              value: item.open
            }));
            
            // Generate high data array
            data.highData = data.ohlc.map(item => ({
              time: item.time,
              value: item.high
            }));
            
            // Generate low data array
            data.lowData = data.ohlc.map(item => ({
              time: item.time,
              value: item.low
            }));
            
            // Generate close data array
            data.closeData = data.ohlc.map(item => ({
              time: item.time,
              value: item.close
            }));
            
            if (data.ohlc.length > 0) {
              console.log('Sample OHLC item:', data.ohlc[0]);
            }
        } else {
            console.log(`Chart Debug: Component arrays for OHLC for ${category} are empty or have zero minLength.`);
            data.ohlc = []; // Ensure ohlc is an empty array if it couldn't be built
        }
      } else {
        console.log(`Chart Debug: Missing one or more component arrays (open, high, low, close) for ${category}.`);
        data.ohlc = []; // Ensure ohlc is an empty array
      }
    }

    if (Array.isArray(data.ohlc)) {
      // Filter valid OHLC points
      const originalLength = data.ohlc.length;
      data.ohlc = data.ohlc.filter(item =>
        item &&
        typeof item.time === 'number' &&
        typeof item.open === 'number' &&
        typeof item.high === 'number' &&
        typeof item.low === 'number' &&
        typeof item.close === 'number' &&
        isFinite(item.open) &&
        isFinite(item.high) &&
        isFinite(item.low) &&
        isFinite(item.close)
      );
      
      if (data.ohlc.length !== originalLength) {
        console.log(`Chart Debug: Filtered out ${originalLength - data.ohlc.length} invalid OHLC data points`);
      }
      
      // Check if high is always >= low (data integrity)
      const invalidHighLowItems = data.ohlc.filter(item => item.high < item.low);
      if (invalidHighLowItems.length > 0) {
        console.warn(`Chart Debug: Found ${invalidHighLowItems.length} OHLC items where high < low, fixing them`);
        // Fix high/low values if needed
        data.ohlc = data.ohlc.map(item => {
          if (item.high < item.low) {
            // Swap high and low values
            return { ...item, high: item.low, low: item.high };
          }
          return item;
        });
      }
      
      // Sort data by time to ensure chronological order
      data.ohlc.sort((a, b) => a.time - b.time);
      
      // Regenerate the line data after filtering
      if (data.ohlc.length > 0) {
        // Open data
        data.openData = data.ohlc.map(item => ({
          time: item.time,
          value: item.open
        }));
        
        // High data
        data.highData = data.ohlc.map(item => ({
          time: item.time,
          value: item.high
        }));
        
        // Low data
        data.lowData = data.ohlc.map(item => ({
          time: item.time,
          value: item.low
        }));
        
        // Close data
        data.closeData = data.ohlc.map(item => ({
          time: item.time,
          value: item.close
        }));
      }
    } else {
      data.ohlc = [];
    }

    console.log(`Chart Debug: Final OHLC data for ${category} (${data.ohlc?.length || 0} items), sample:`, 
      data.ohlc && data.ohlc.length > 0 ? data.ohlc.slice(0, 3) : 'No items');

  } else if (category === 'GOLD_TH') {
    // Process data for GOLD_TH category
    for (const key of ['barBuyData', 'barSellData', 'barBuyPredictData', 'ornamentBuyData', 'ornamentSellData']) {
      if (Array.isArray(data[key])) {
        const originalLength = data[key].length;
        // Filter valid points
        data[key] = data[key].filter(item =>
          item &&
          typeof item.time === 'number' &&
          typeof item.value === 'number' &&
          isFinite(item.value)
        );
        
        // Sort by time
        data[key].sort((a, b) => a.time - b.time);
        
        if (data[key].length !== originalLength) {
          console.log(`Chart Debug: Filtered out ${originalLength - data[key].length} invalid points from ${key}`);
        }
      }
    }
  }
  
  return data;
}
