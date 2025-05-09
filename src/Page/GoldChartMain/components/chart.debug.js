// Debug utility for the Chart component
export function debugChartData(chartData, category) {
  console.log('Chart Debug: Input data structure', { category, chartData: JSON.parse(JSON.stringify(chartData)) });

  if (!chartData) {
    console.log('Chart Debug: No chart data provided, returning null.');
    return null; // Return null if no chartData
  }

  // Create a deep copy to avoid mutating the original data passed into this function
  // and to ensure we are working with a mutable copy.
  const data = JSON.parse(JSON.stringify(chartData));

  if (category === 'GOLD_US' || category === 'USD_THB') {
    console.log(`Chart Debug: Initial OHLC Structure for ${category}:`, {
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
        
        const minLength = Math.min(
          data.open.length || 0,
          data.high.length || 0,
          data.low.length || 0,
          data.close.length || 0
        );
        
        const builtOhlc = [];
        if (minLength > 0) {
            console.log(`Chart Debug: Building OHLC for ${category} from ${minLength} component data points.`);
            for (let i = 0; i < minLength; i++) {
              const openPoint = data.open[i];
              const highPoint = data.high[i];
              const lowPoint = data.low[i];
              const closePoint = data.close[i];
              
              if (openPoint && highPoint && lowPoint && closePoint &&
                  typeof openPoint.time === 'number' && typeof openPoint.value === 'number' &&
                  typeof highPoint.value === 'number' && typeof lowPoint.value === 'number' &&
                  typeof closePoint.value === 'number') {
                builtOhlc.push({
                  time: openPoint.time,
                  open: Number(openPoint.value),
                  high: Number(highPoint.value),
                  low: Number(lowPoint.value),
                  close: Number(closePoint.value)
                });
              } else {
                console.warn(`Chart Debug: Skipping invalid component data point at index ${i} for ${category}:`, {openPoint, highPoint, lowPoint, closePoint});
              }
            }
            data.ohlc = builtOhlc;
            console.log(`Chart Debug: Successfully built OHLC array for ${category} with ${data.ohlc.length} items.`);
        } else {
            console.log(`Chart Debug: Component arrays for OHLC for ${category} are empty or have zero minLength.`);
            data.ohlc = []; // Ensure ohlc is an empty array if it couldn't be built
        }
      } else {
        console.log(`Chart Debug: Missing one or more component arrays (open, high, low, close) for ${category}.`);
        data.ohlc = []; // Ensure ohlc is an empty array
      }
    }

    // Process existing or newly built OHLC data
    if (data.ohlc && Array.isArray(data.ohlc)) {
      console.log(`Chart Debug: Processing OHLC array for ${category} with ${data.ohlc.length} items.`);
      
      // 1. Filter out invalid items and ensure numeric types, convert if necessary
      let processedOhlc = data.ohlc.map((item, index) => {
        if (!item || typeof item.time !== 'number') {
          console.warn(`Chart Debug: Invalid item or time at index ${index} for ${category}:`, item);
          return null; // Mark for removal
        }
        return {
          time: item.time,
          open: item.open !== undefined && !isNaN(Number(item.open)) ? Number(item.open) : NaN,
          high: item.high !== undefined && !isNaN(Number(item.high)) ? Number(item.high) : NaN,
          low: item.low !== undefined && !isNaN(Number(item.low)) ? Number(item.low) : NaN,
          close: item.close !== undefined && !isNaN(Number(item.close)) ? Number(item.close) : NaN,
        };
      }).filter(item => 
        item !== null && // Remove items marked for removal
        !isNaN(item.open) && 
        !isNaN(item.high) && 
        !isNaN(item.low) && 
        !isNaN(item.close)
      );

      console.log(`Chart Debug: After initial filtering & type conversion for ${category}, ${processedOhlc.length} items remain.`);
      if (processedOhlc.length > 0) console.log('Chart Debug: Sample after type conversion:', processedOhlc.slice(0,3));

      // 2. Sort by time
      processedOhlc.sort((a, b) => a.time - b.time);
      console.log(`Chart Debug: Sorted OHLC data for ${category}.`);
      if (processedOhlc.length > 0) console.log('Chart Debug: Sample after sorting:', processedOhlc.slice(0,3));

      // 3. Deduplicate by time, keeping the first occurrence
      const timeSet = new Set();
      const uniqueOhlc = [];
      for (const item of processedOhlc) {
        if (!timeSet.has(item.time)) {
          timeSet.add(item.time);
          uniqueOhlc.push(item);
        } else {
          console.log(`Chart Debug: Duplicate timestamp found and removed for ${category}: ${item.time}`);
        }
      }
      processedOhlc = uniqueOhlc;
      console.log(`Chart Debug: Deduplicated OHLC data for ${category}, ${processedOhlc.length} items remain.`);
      if (processedOhlc.length > 0) console.log('Chart Debug: Sample after deduplication:', processedOhlc.slice(0,3));
      
      data.ohlc = processedOhlc;
    } else {
      console.log(`Chart Debug: No valid OHLC data array to process for ${category}. Setting to empty array.`);
      data.ohlc = []; // Ensure it's an empty array if something went wrong
    }

    console.log(`Chart Debug: Final OHLC data for ${category} (${data.ohlc?.length || 0} items), sample:`, 
      data.ohlc && data.ohlc.length > 0 ? data.ohlc.slice(0, 3) : 'No items');

  } else if (category === 'GOLD_TH') {
    console.log('Chart Debug: GOLD_TH data structure:', {
      hasBarBuyData: !!data.barBuyData,
      hasBarSellData: !!data.barSellData,
      hasBarBuyPredictData: !!data.barBuyPredictData,
      barBuyDataLength: data.barBuyData ? data.barBuyData.length : 0,
      barSellDataLength: data.barSellData ? data.barSellData.length : 0,
      barBuyPredictDataLength: data.barBuyPredictData ? data.barBuyPredictData.length : 0,
      barBuyDataSample: data.barBuyData && data.barBuyData.length > 0 ? data.barBuyData[0] : null
    });
    
    for (const key of ['barBuyData', 'barSellData', 'barBuyPredictData']) {
      if (data[key] && Array.isArray(data[key])) {
        console.log(`Chart Debug: Processing ${key} for GOLD_TH with ${data[key].length} initial items.`);
        // Filter for valid time and value
        let processedSeries = data[key]
          .filter(item => item && typeof item.time === 'number' && typeof item.value === 'number' && !isNaN(item.value));
        console.log(`Chart Debug: After filtering ${key}, ${processedSeries.length} items remain.`);
        
        // Sort by time
        processedSeries.sort((a,b) => a.time - b.time);
        console.log(`Chart Debug: Sorted ${key}.`);
        if (processedSeries.length > 0) console.log(`Chart Debug: Sample of ${key} after sorting:`, processedSeries.slice(0,3));

        // Deduplicate by time, keeping the first occurrence
        const timeSet = new Set();
        const uniqueSeries = [];
        for (const item of processedSeries) {
          if (!timeSet.has(item.time)) {
            timeSet.add(item.time);
            uniqueSeries.push(item);
          } else {
            console.log(`Chart Debug: Duplicate timestamp found and removed for ${key} (GOLD_TH): ${item.time}`);
          }
        }
        data[key] = uniqueSeries;
        console.log(`Chart Debug: Deduplicated ${key}, ${data[key].length} items remain.`);
        if (data[key].length > 0) console.log(`Chart Debug: Sample of ${key} after deduplication:`, data[key].slice(0,3));
        
        if (data[key].length > 0) {
          const firstItem = data[key][0];
          const firstDate = new Date(firstItem.time * 1000);
          console.log(`Chart Debug: ${key} first item time (after sort & filter):`, {
              timestamp: firstItem.time,
              date: firstDate.toISOString(),
              hours: firstDate.getHours(),
              minutes: firstDate.getMinutes()
          });
        }
      }
    }
  }
  
  console.log('Chart Debug: Output data structure', { category, chartData: JSON.parse(JSON.stringify(data)) });
  return data;
}
