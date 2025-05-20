import React, { useEffect, useState, useRef, useMemo } from 'react';
import Chart from './chart';

/**
 * A wrapper component for the Chart component.
 * It now assumes that chartData has been pre-processed and debugged upstream.
 */
const ChartWrapper = ({ chartData, category, dateRange, chartStyle = 'line' }) => {
  // Create memoized key to avoid unnecessary re-renders
  const chartKey = useMemo(() => {
    const timestamp = Date.now();
    const uniqueKey = `chart-${category}-${chartStyle}-${timestamp}`;
    // console.log('Generated chartKey:', uniqueKey);
    return uniqueKey;
  }, [category, chartStyle]);
  
  // Skip re-renders unless we need a new chart
  const chartDataRef = useRef(chartData);
  const dateRangeRef = useRef(dateRange);
  const shouldUpdateChart = useRef(true);
  
  // Check if we need to update the chart
  if (chartDataRef.current !== chartData || 
      dateRangeRef.current?.from?.getTime() !== dateRange?.from?.getTime() ||
      dateRangeRef.current?.to?.getTime() !== dateRange?.to?.getTime()) {
    chartDataRef.current = chartData;
    dateRangeRef.current = dateRange;
    shouldUpdateChart.current = true;
  }
  
  // console.log('ChartWrapper received props:', {
  //   category,
  //   chartStyle,
  //   chartKey,
  //   hasChartData: !!chartData,
  //   hasOHLC: chartData && chartData.ohlc ? `Yes (${chartData.ohlc.length} items)` : 'No',
  //   dateRangeFrom: dateRange?.from ? dateRange.from.toISOString() : 'none',
  //   dateRangeTo: dateRange?.to ? dateRange.to.toISOString() : 'none',
  //   shouldUpdateChart: shouldUpdateChart.current
  // });
  
  // If in candlestick mode, log ohlc data details
  if (chartStyle === 'candlestick' && chartData && chartData.ohlc) {
    console.log('OHLC data sample for candlestick chart:', 
      chartData.ohlc.length > 0 ? chartData.ohlc.slice(0, 2) : 'No OHLC data');
    
    // Additional validation for OHLC data
    const validOHLCCount = chartData.ohlc.filter(item => 
      item && 
      typeof item.time === 'number' && 
      typeof item.open === 'number' && 
      typeof item.high === 'number' && 
      typeof item.low === 'number' && 
      typeof item.close === 'number' &&
      isFinite(item.open) &&
      isFinite(item.high) &&
      isFinite(item.low) &&
      isFinite(item.close) &&
      item.high >= item.low
    ).length;
    
    console.log(`ChartWrapper: OHLC validation - ${validOHLCCount} of ${chartData.ohlc.length} items are valid`);
  }
  
  // Reset the update flag after render
  useEffect(() => {
    shouldUpdateChart.current = false;
  });
  
  // Don't render anything if there's no data
  if (!chartData) {
    return (
      <div className="flex items-center justify-center h-full w-full">
        <p>No chart data available (ChartWrapper).</p>
      </div>
    );
  }

  // Make sure we have OHLC data for GOLD_US and USD_THB if that's the category and using candlestick
  if ((category === 'GOLD_US' || category === 'USD_THB') && 
      chartStyle === 'candlestick' &&
      (!chartData.ohlc || !Array.isArray(chartData.ohlc) || chartData.ohlc.length === 0)) {
    console.warn(`ChartWrapper: No OHLC data available for ${category} after upstream processing.`);
    return (
      <div className="flex items-center justify-center h-full w-full">
        <p>No valid OHLC data available for {category} to display.</p>
      </div>
    );
  }
  
  // Pass the (already processed) data directly to the Chart component
  return (
    <Chart 
      key={chartKey}
      chartData={chartData} 
      category={category} 
      chartStyle={chartStyle}
      dateRange={dateRange} 
    />
  );
};

// Use React.memo with a custom comparison function to prevent unnecessary re-renders
export default React.memo(ChartWrapper, (prevProps, nextProps) => {
  // Always re-render if category or chartStyle changes
  if (prevProps.category !== nextProps.category || 
      prevProps.chartStyle !== nextProps.chartStyle) {
    return false; // Not equal, should re-render
  }
  
  // Check date range
  const prevFrom = prevProps.dateRange?.from?.getTime();
  const nextFrom = nextProps.dateRange?.from?.getTime();
  const prevTo = prevProps.dateRange?.to?.getTime();
  const nextTo = nextProps.dateRange?.to?.getTime();
  
  if (prevFrom !== nextFrom || prevTo !== nextTo) {
    return false; // Date range changed, should re-render
  }
  
  // Only check chart data if we have both
  if (prevProps.chartData && nextProps.chartData) {
    // For simple check, just see if they're the same object reference
    // A more thorough approach would be to check key data points
    if (prevProps.chartData !== nextProps.chartData) {
      return false; // Chart data changed, should re-render
    }
  } else if (prevProps.chartData !== nextProps.chartData) {
    // One is null and the other isn't
    return false;
  }
  
  // Props are equal enough, no need to re-render
  return true;
});
