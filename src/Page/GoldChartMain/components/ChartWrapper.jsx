import React from 'react';
import Chart from './chart';

/**
 * A wrapper component for the Chart component.
 * It now assumes that chartData has been pre-processed and debugged upstream.
 */
const ChartWrapper = ({ chartData, category, dateRange }) => {
  // The chartData is now expected to be fully processed by debugChartData in GoldChart.jsx
  // No further complex processing or OHLC construction should be needed here.
  

  // Don't render anything if there's no data
  if (!chartData) {
    return (
      <div className="flex items-center justify-center h-full w-full">
        <p>No chart data available (ChartWrapper).</p>
      </div>
    );
  }

  // Make sure we have OHLC data for GOLD_US and USD_THB if that's the category
  if ((category === 'GOLD_US' || category === 'USD_THB') && 
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
      chartData={chartData} 
      category={category} 
      dateRange={dateRange} 
    />
  );
};

export default ChartWrapper;
