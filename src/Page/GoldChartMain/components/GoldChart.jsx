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
  dateRange,
  activeDateOption,
  onFullDataLoaded
}) => {
  const { data: chartDataFull, isLoading, isError, error: chartError } = useChartData(category, selectedModel);
  useEffect(() => {
console.log(
`category=${category}
dateRange=${ dateRange ? `${dateRange.from.toISOString()}
to ${dateRange.to.toISOString()}` : 'none'}
activeDateOption=${activeDateOption}
model=${selectedModel}`
);
  }, [category, dateRange, selectedModel, activeDateOption]); // Added activeDateOption to dependency array

  const todayTimestamp = addHours(startOfDay(new Date()), 17).getTime();
  


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