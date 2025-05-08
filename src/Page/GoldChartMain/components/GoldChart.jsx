import React, { useEffect, useMemo } from 'react'; // Added useEffect
import { ThreeDot } from 'react-loading-indicators';
import { InfoIcon } from '@/components/icons';
import { Button } from '@/components/ui/button';
import Chart from './Chart';
import { useChartData } from '../hook/fetchData';

const GoldChart = ({
  onRetry = () => window.location.reload(),
  category = 'GOLD_TH',
  selectedModel = '7',
  dateRange, // Receive dateRange
  onFullDataLoaded // Callback to pass all data for earliest date calculation
}) => {
  // Pass category, selectedModel, AND dateRange to useChartData
  // useChartData needs to be adapted to use dateRange for fetching or initial filtering.
  const { data: chartDataFull, isLoading, isError, error: chartError } = useChartData(category, selectedModel /*, dateRange (if API supports) */);
  console.log('chartDataFull ->>> ',chartDataFull);

  useEffect(() => {
    if (chartDataFull && onFullDataLoaded) {
      onFullDataLoaded(chartDataFull); // Pass all loaded data (unfiltered by date yet)
    }
  }, [chartDataFull, onFullDataLoaded]);


  // Client-side filtering with useMemo
  const dataForChart = useMemo(() => {
    console.log("GoldChart: useMemo triggered. Dependencies:", { chartDataFull, dateRange, category }); // Added category

    if (!chartDataFull) {
      console.log("GoldChart: No chartDataFull, returning null.");
      return null;
    }

    // Deep copy to avoid mutating original chartDataFull
    let processedData = JSON.parse(JSON.stringify(chartDataFull));

    // Normalize time to start of day if category is GOLD_TH
    if (category === 'GOLD_TH') {
      console.log("GoldChart: Normalizing time for GOLD_TH");
      for (const key in processedData) {
        if (Array.isArray(processedData[key])) {
          processedData[key] = processedData[key].map(item => {
            // Ensure item and item.time are valid before processing
            if (item && typeof item.time === 'number' && isFinite(item.time)) {
              const date = new Date(item.time * 1000);
              date.setUTCHours(0, 0, 0, 0); // Normalize to start of UTC day
              return { ...item, time: Math.floor(date.getTime() / 1000) };
            }
            // Log warning for invalid items/timestamps and return item unchanged
            console.warn("GoldChart: Invalid item or time value encountered in GOLD_TH normalization, skipping normalization for this item:", item);
            return item; 
          });
        }
      }
    }

    if (dateRange && dateRange.from && dateRange.to) {
      console.log("GoldChart: Before filtering with range:", dateRange, "Input data keys:", Object.keys(processedData)); // Use processedData
      
      // Normalize dateRange timestamps to start of UTC day for filtering
      const fromDate = new Date(dateRange.from.getTime());
      fromDate.setUTCHours(0, 0, 0, 0);
      const normalizedFromTimestamp = Math.floor(fromDate.getTime() / 1000);

      const toDate = new Date(dateRange.to.getTime());
      // Normalize toDate to the start of the day for an inclusive upper bound when item.time is also start-of-day
      toDate.setUTCHours(0, 0, 0, 0); 
      const normalizedToTimestamp = Math.floor(toDate.getTime() / 1000);

      const filteredData = {};
      let RENDER_LOG_CHECK = true; // Existing variable
      for (const key in processedData) { // Iterate over processedData
        if (Array.isArray(processedData[key])) {
          const originalLength = processedData[key].length;
          // Filter processedData (which has normalized times if GOLD_TH)
          filteredData[key] = processedData[key].filter(item => {
            // Ensure item and item.time are valid before filtering
            if (item && typeof item.time === 'number' && isFinite(item.time)) {
              // item.time is already start-of-day if GOLD_TH and normalization occurred
              // normalizedFromTimestamp and normalizedToTimestamp are also start-of-day
              return item.time >= normalizedFromTimestamp && item.time <= normalizedToTimestamp;
            }
            console.warn("GoldChart: Invalid item or time value encountered during filtering, skipping this item:", item);
            return false; // Exclude invalid items from filtered results
          });
          const filteredLength = filteredData[key].length;
          if (RENDER_LOG_CHECK) {
            console.log(`GoldChart: Filtering series '${key}'. Original length: ${originalLength}, Filtered length: ${filteredLength}. Reduction: ${originalLength - filteredLength}`);
          }
        } else {
          filteredData[key] = processedData[key]; // Copy other properties if any
        }
      }
      console.log("GoldChart: After filtering. Output data keys:", Object.keys(filteredData));
      return filteredData;
    } else {
      console.log("GoldChart: No dateRange or incomplete dateRange, using processedData directly (which might be time-normalized for GOLD_TH).");
      return processedData; // Return processedData (potentially normalized)
    }
  }, [chartDataFull, dateRange, category]); // Added category to dependencies


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
          <Chart chartData={dataForChart} category={category} /> {/* Pass filtered data */}
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