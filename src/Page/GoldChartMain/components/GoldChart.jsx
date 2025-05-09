import React, { useEffect, useMemo } from 'react';
import { ThreeDot } from 'react-loading-indicators';
import { InfoIcon } from '@/components/icons';
import { Button } from '@/components/ui/button';
import ChartWrapper from './ChartWrapper';
import { useChartData } from '../hook/fetchData';
import { debugChartData } from './chart.debug';

/**
 * A component that displays gold price charts for different categories (GOLD_TH, GOLD_US, USD_THB)
 * with support for date range filtering and prediction data for GOLD_TH
 */
const GoldChart = ({
  onRetry = () => window.location.reload(),
  category = 'GOLD_TH',
  selectedModel = '7',
  dateRange,
  onFullDataLoaded
}) => {
  const { data: chartDataFull, isLoading, isError, error: chartError } = useChartData(category, selectedModel);
  console.log('chartDataFull ->>> ',chartDataFull);

  // Log data on initial load
  useEffect(() => {
    if (chartDataFull) {
      console.log(`GoldChart: Received ${category} data:`, {
        hasData: !!chartDataFull,
        dataKeys: chartDataFull ? Object.keys(chartDataFull) : []
      });
    }
  }, [chartDataFull, category]);

  useEffect(() => {
    if (chartDataFull && onFullDataLoaded) {
      onFullDataLoaded(chartDataFull);
    }
  }, [chartDataFull, onFullDataLoaded]);

  const dataForChart = useMemo(() => {
    console.log("GoldChart: useMemo triggered. Data ready:", chartDataFull ? true : false);
    
    if (!chartDataFull) {
      console.log("GoldChart: No chartDataFull, returning null.");
      return null;
    }
    
    // Use our debug utility to validate and fix chart data
    const debuggedData = debugChartData(chartDataFull, category);
    
    // Return the debugged data which has been validated and fixed if needed
    return debuggedData;
  }, [chartDataFull, category]);


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
          <ChartWrapper chartData={dataForChart} category={category} dateRange={dateRange} />
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