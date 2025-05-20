import React, { useEffect, useMemo, useRef } from 'react';
import { addHours, startOfDay, fromUnixTime } from 'date-fns';
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
  chartStyle = 'line', // This is now correctly receiving the "chartStyle" prop from GoldChartMain
  dateRange,
  activeDateOption,
  onFullDataLoaded,
  onLastPriceUpdate
}) => {  const { data: chartDataFull, isLoading, isError, error: chartError } = useChartData(category, selectedModel);
  
  // Track render cycles
  const renderCount = useRef(0);
  renderCount.current++;
  
  // Track the candlestick style selection
  const chartStyleRef = useRef(chartStyle);
  
  // Track the model changes
  const modelRef = useRef(selectedModel);
  
  useEffect(() => {
    // console.log('GoldChart component props:', {
    //   renderId: renderCount.current,
    //   category,
    //   selectedModel,
    //   chartStyle,
    //   dateRange: dateRange ? {
    //     from: dateRange.from?.toISOString(),
    //     to: dateRange.to?.toISOString()
    //   } : 'No date range'
    // });
    
    // Log model changes
    if (modelRef.current !== selectedModel) {
      console.log(`Model changed from ${modelRef.current} to ${selectedModel}`);
      modelRef.current = selectedModel;
    }
    
    // Log prediction data details if available
    if (chartDataFull && chartDataFull.barBuyPredictData && chartDataFull.barBuyPredictData.length > 0) {
      const lastPredictionPoint = chartDataFull.barBuyPredictData[chartDataFull.barBuyPredictData.length - 1];
      // console.log(`Prediction data for model ${selectedModel}:`, {
      //   timestamp: lastPredictionPoint.time,
      //   formattedDate: fromUnixTime(lastPredictionPoint.time).toISOString(),
      //   value: lastPredictionPoint.value,
      // });
    }
    
    // Log when chart style changes
    if (chartStyleRef.current !== chartStyle) {
      console.log(`Chart style changed from ${chartStyleRef.current} to ${chartStyle}`);
      chartStyleRef.current = chartStyle;
    }
  }, [category, dateRange, selectedModel, chartStyle, chartDataFull]);
  
  useEffect(() => {
    if (chartDataFull && onFullDataLoaded) {
      onFullDataLoaded(chartDataFull);
    }
  }, [chartDataFull, onFullDataLoaded]);
  
  // Use useMemo more effectively
  const dataForChart = useMemo(() => {
    if (!chartDataFull) {
      return null;
    }
    
    // console.log(`Processing chart data for ${category}, style: ${chartStyle}`);
    // Use debugChartData to validate and process the data
    return debugChartData(chartDataFull, category);
  }, [chartDataFull, category]);
  
  // Handle the last price update effect
  useEffect(() => {
    if (!chartDataFull) return;
    
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
      
      // Ensure we call onLastPriceUpdate with valid data
      if (onLastPriceUpdate && lastValue && lastTime) {
        onLastPriceUpdate({ 
          value: lastValue, 
          time: lastTime, 
          percentChange: percentChange,
          dataCategory: category 
        });
      }
    }
  }, [chartDataFull, category, onLastPriceUpdate]);

  return (
    <div className="h-full w-full">
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
            chartStyle={chartStyle} // Correct prop name
            dateRange={{
              from: dateRange?.from ? new Date(dateRange.from.getTime()) : undefined,
              to: dateRange?.to ? new Date(dateRange.to.getTime()) : undefined
            }}
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

export default React.memo(GoldChart);