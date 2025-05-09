// Debug utility for the Chart component
export function debugChartData(chartData, category, options = {}) {
  // console.log('Chart Debug: Input data structure', { category, chartData: JSON.parse(JSON.stringify(chartData)) });

  if (!chartData) {
    return null;
  }

  // const { limit } = options; // limit removed to keep full data set
  const data = JSON.parse(JSON.stringify(chartData));

  if (category === 'GOLD_US' || category === 'USD_THB') {
    // console.log(`Chart Debug: Initial OHLC Structure for ${category}:`, {
    //   hasOhlcArray: !!data.ohlc,
    //   ohlcArrayType: data.ohlc ? typeof data.ohlc : 'N/A',
    //   isArray: data.ohlc ? Array.isArray(data.ohlc) : false,
    //   length: data.ohlc ? data.ohlc.length : 0,
    //   sampleItem: data.ohlc && data.ohlc.length > 0 ? data.ohlc[0] : 'No items'
    // });

    // Attempt to build OHLC if not present or empty
    if (!data.ohlc || !Array.isArray(data.ohlc) || data.ohlc.length === 0) {
      // console.log(`Chart Debug: OHLC array for ${category} is missing or empty. Attempting to build from components.`);
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
            // console.log(`Chart Debug: Building OHLC for ${category} from ${minLength} component data points.`);
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
                // console.warn(`Chart Debug: Skipping invalid component data point at index ${i} for ${category}:`, {openPoint, highPoint, lowPoint, closePoint});
              }
            }
            data.ohlc = builtOhlc;
            // console.log(`Chart Debug: Successfully built OHLC array for ${category} with ${data.ohlc.length} items.`);
        } else {
            // console.log(`Chart Debug: Component arrays for OHLC for ${category} are empty or have zero minLength.`);
            data.ohlc = []; // Ensure ohlc is an empty array if it couldn't be built
        }
      } else {
        // console.log(`Chart Debug: Missing one or more component arrays (open, high, low, close) for ${category}.`);
        data.ohlc = []; // Ensure ohlc is an empty array
      }
    }

    if (Array.isArray(data.ohlc)) {
      // Filter valid OHLC points
      data.ohlc = data.ohlc.filter(item =>
        item &&
        typeof item.time === 'number' &&
        typeof item.open === 'number' &&
        typeof item.high === 'number' &&
        typeof item.low === 'number' &&
        typeof item.close === 'number'
      );
    } else {
      data.ohlc = [];
    }

    // console.log(`Chart Debug: Final OHLC data for ${category} (${data.ohlc?.length || 0} items), sample:`, 
    //   data.ohlc && data.ohlc.length > 0 ? data.ohlc.slice(0, 3) : 'No items');

  } else if (category === 'GOLD_TH') {
    // console.log('Chart Debug: GOLD_TH data structure:', {
    //   hasBarBuyData: !!data.barBuyData,
    //   hasBarSellData: !!data.barSellData,
    //   hasBarBuyPredictData: !!data.barBuyPredictData,
    //   barBuyDataLength: data.barBuyData ? data.barBuyData.length : 0,
    //   barSellDataLength: data.barSellData ? data.barSellData.length : 0,
    //   barBuyPredictDataLength: data.barBuyPredictData ? data.barBuyPredictData.length : 0,
    //   barBuyDataSample: data.barBuyData && data.barBuyData.length > 0 ? data.barBuyData[0] : null
    // });
    
    for (const key of ['barBuyData', 'barSellData', 'barBuyPredictData']) {
      if (Array.isArray(data[key])) {
        // Filter valid points
        data[key] = data[key].filter(item =>
          item &&
          typeof item.time === 'number' &&
          typeof item.value === 'number'
        );
      }
    }
  }
  
  // console.log('Chart Debug: Output data structure', { category, chartData: JSON.parse(JSON.stringify(data)) });
  return data;
}
