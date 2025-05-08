import React from 'react';
import { ThreeDot } from 'react-loading-indicators';
import { InfoIcon } from '@/components/icons';
import { Button } from '@/components/ui/button';
import Chart from './Chart';
import { useChartData } from '../hook/fetchData';

const GoldChart = ({
  loading = false,
  error = null,
  onRetry = () => {},
  data = [],
  category = '',
  timeframe = ''
}) => {
  const { data: ChartData, isLoading, isError } = useChartData();
//   console.log('✅ GoldChart data:', ChartData);
  

  return (
    <div className="h-[450px]">
      {loading || isLoading ? (
        <div className="flex flex-col items-center justify-center h-full">
          <ThreeDot color={["#32cd32", "#327fcd", "#cd32cd", "#cd8032"]} />
        </div>
      ) : error || isError ? (
        <div className="flex flex-col items-center justify-center h-full">
          <InfoIcon className="h-8 w-8 text-destructive mb-2" />
          <p className="text-destructive">{error || 'เกิดข้อผิดพลาดในการโหลดข้อมูล'}</p>
          <Button 
            variant="outline" 
            className="mt-4" 
            onClick={onRetry}
          >
            Try Again
          </Button>
        </div>
      ) : (
        <div className="flex items-center justify-center h-full w-full">
          <Chart/>
        </div>
      )}
    </div>
  );
};

export default GoldChart;