import React from 'react';
import { ThreeDot } from 'react-loading-indicators';
import { InfoIcon } from '@/components/icons';
import { Button } from '@/components/ui/button';
import Chart from './Chart';
import { useChartData } from '../hook/fetchData'; // Keep this for now, or pass all data down

const GoldChart = ({
  // Removed loading, error, data props as useChartData will handle it internally
  onRetry = () => window.location.reload(), // Default onRetry
  category = 'GOLD_TH', // Default category
  timeframe = '', // Timeframe might be used by Chart.jsx later for filtering
  selectedModel = '7' // Pass selectedModel
}) => {
  // Pass category and selectedModel to useChartData
  const { data: chartData, isLoading, isError, error: chartError } = useChartData(category, selectedModel);

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
      ) : chartData ? ( // Ensure chartData is not null/undefined
        <div className="flex items-center justify-center h-full w-full">
          {/* Pass category and the actual chartData to Chart component */}
          <Chart chartData={chartData} category={category} />
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