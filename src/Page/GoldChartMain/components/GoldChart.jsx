import React, { useEffect, useMemo } from 'react';
import { addHours, startOfDay } from 'date-fns';
import { ThreeDot } from 'react-loading-indicators';
import { InfoIcon } from '@/components/icons';
import { Button } from '@/components/ui/button';
import ChartWrapper from './ChartWrapper';
import { useChartData } from '../hook/fetchData';
import { debugChartData } from './chart.debug';

const GoldChart = ({
  onRetry = () => window.location.reload(),
  category = 'GOLD_TH',
  selectedModel = '7',
  chartStyle = 'line',
  dateRange,
  activeDateOption,
  onFullDataLoaded,
  onLastPriceUpdate
}) => {
  const { data: chartDataFull, isLoading, isError, error: chartError } = useChartData(category, selectedModel);
  useEffect(() => {
  }, [category, dateRange, selectedModel, activeDateOption, chartStyle]);
  
  useEffect(() => {
    if (chartDataFull && onFullDataLoaded) {
      onFullDataLoaded(chartDataFull);
    }
  }, [chartDataFull, onFullDataLoaded]);
  const dataForChart = useMemo(() => {
    
    if (!chartDataFull) {
      return null;
    }
    
    const debuggedData = debugChartData(chartDataFull, category);
    
    return debuggedData;
  }, [chartDataFull, category]);
  useEffect(() => {
    if (chartDataFull != null) {
      let lastValue = 0;
      let lastTime = 0;
      let percentChange = 0;
      let lastDataPoint = null;
      let previousDataPoint = null;
      
      if (category === 'GOLD_TH' && chartDataFull.barBuyData && chartDataFull.barBuyData.length > 0) {
          lastDataPoint = chartDataFull.barBuyData[chartDataFull.barBuyData.length - 1];
          previousDataPoint = chartDataFull.barBuyData[chartDataFull.barBuyData.length - 2];
      } else if ((category === 'GOLD_US' || category === 'USD_THB') && chartDataFull.close && chartDataFull.close.length > 0) {
          lastDataPoint = chartDataFull.close[chartDataFull.close.length - 1];
          previousDataPoint = chartDataFull.close[chartDataFull.close.length - 2];
      }
        if (lastDataPoint) {
        lastValue = lastDataPoint.value;
        lastTime = lastDataPoint.time;
        percentChange = previousDataPoint ? ((lastValue - previousDataPoint.value) / previousDataPoint.value) * 100 : 0;
        console.log(`Last data point for category ${category}: value=${lastValue}, time=${new Date(lastTime * 1000).toISOString()}, percentChange=${percentChange.toFixed(2)}%`);
        
        // Ensure we call onLastPriceUpdate with valid data
        if (onLastPriceUpdate && lastValue && lastTime) {
          console.log("Calling onLastPriceUpdate with values:", { value: lastValue, time: lastTime, percentChange, dataCategory: category });
          onLastPriceUpdate({ 
            value: lastValue, 
            time: lastTime, 
            percentChange: percentChange,
            dataCategory: category 
          });
        }
      }
    }
  }, [chartDataFull, category, onLastPriceUpdate]);


  return (
    <div className="h-[450px]">
      {isLoading ? (
        <div className="flex flex-col items-center justify-center h-full">
          <ThreeDot color={["#32cd32", "#327fcd", "#cd32cd", "#cd8032"]} />
        </div>
      ) : isError ? (
        <div className="flex flex-col items-center justify-center h-full">
          <InfoIcon className="h-8 w-8 text-destructive mb-2" />
          <p className="text-destructive">{chartError?.message || 'เกิดข้อผิดพลาดในการโหลดข้อมูล'}</p>
          {chartError?.details && (
            <div className="text-xs text-muted-foreground mt-1">
              {Object.entries(chartError.details).map(([key, value]) => (
                <p key={key}><strong>{key}:</strong> {String(value)}</p>
              ))}
            </div>
          )}
          <Button
            variant="outline"
            className="mt-4"
            onClick={onRetry}
          >
            Try Again
          </Button>
        </div>
      ) : dataForChart ? (
        <div className="flex items-center justify-center h-full w-full">
          <ChartWrapper 
            chartData={dataForChart} 
            category={category} 
            chartStyle={chartStyle}
            dateRange={dateRange} 
          />
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center h-full">
          <p>No data available for the selected criteria.</p>
        </div>
      )}
    </div>
  );
};

export default GoldChart;