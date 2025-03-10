import React, { useRef, useState } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale,
  Filler,
} from 'chart.js';
import zoomPlugin from 'chartjs-plugin-zoom';
import 'chartjs-adapter-date-fns';
import { format, isValid } from 'date-fns';
import { enUS } from 'date-fns/locale';
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

// Register ChartJS plugins
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale,
  Filler,
  zoomPlugin
);

// Constants for data categories
const DataCategories = {
  GOLD_TH: 'Gold TH',
  GOLD_US: 'Gold US',
  USDTHB: 'USD THB'
};

// Constants for timeframes
const TimeFrames = {
  LAST_7_DAYS: '7d',
  LAST_30_DAYS: '30d'
};

// Main component
const GoldChart = ({
  goldThData,
  goldUsData,
  usdthbData,
  predictData,
  selectedCategory,
  timeframe,
  loading
}) => {
  const chartRef = useRef(null);
  const [resetCount, setResetCount] = useState(0);

  // Reset zoom when changing timeframe or category
  React.useEffect(() => {
    resetZoom();
  }, [timeframe, selectedCategory]);

  // Process data for the chart based on selected category
  const chartData = (() => {
    if (loading || !goldThData?.length) {
      return { labels: [], datasets: [] };
    }

    try {
      // Select data based on category
      let actualData = [];
      let currency = 'THB';
      
      switch (selectedCategory) {
        case DataCategories.GOLD_TH:
          actualData = goldThData;
          currency = 'THB';
          break;
        case DataCategories.GOLD_US:
          actualData = goldUsData;
          currency = 'USD';
          break;
        case DataCategories.USDTHB:
          actualData = usdthbData;
          currency = 'THB';
          break;
        default:
          actualData = goldThData;
      }

      // Handle loading state
      if (loading) {
        return (
          <div className="flex justify-center items-center h-full w-full">
            <div className="w-full h-60 bg-gray-200 animate-pulse rounded-lg"></div>
          </div>
        );
      }

      // Ensure we have data to display
      if (!actualData || actualData.length === 0) {
        return (
          <div className="flex justify-center items-center h-full w-full">
            <p className="text-gray-500">No data found</p>
          </div>
        );
      }

      console.log("actualData before processing:", actualData);
      console.log("actualData type:", selectedCategory);
      console.log("predictData before processing:", predictData);

      // Filter and map actualData for the chart
      const validActualData = actualData
        .filter(item => {
          // Handle both gold data (created_at) and currency data (date)
          const hasValidDate = (item && (item.created_at || item.date));
          const hasValidPrice = (item && item.price && !isNaN(parseFloat(item.price)));
          return hasValidDate && hasValidPrice;
        })
        .map(item => {
          try {
            // Use created_at for gold data or date for currency data
            const dateValue = item.created_at || item.date;
            return {
              x: new Date(dateValue).toISOString().split('T')[0],
              y: parseFloat(item.price)
            };
          } catch (error) {
            const dateValue = item.created_at || item.date;
            console.error(`Invalid date in actualData: ${dateValue}`, error);
            return null;
          }
        })
        .filter(item => item !== null);

      console.log("validActualData after processing:", validActualData);

      const datasets = [
        {
          label: `${selectedCategory} Latest`,
          data: validActualData,
          borderColor: 'rgb(75, 192, 192)',
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          borderWidth: 2,
          pointRadius: 2,
          pointHoverRadius: 4,
          tension: 0.3,
          fill: false,
          spanGaps: true,
          parsing: {
            xAxisKey: 'x',
            yAxisKey: 'y'
          },
        }
      ];

      console.log("Chart.js actual dataset:", datasets[0]);

      // Add prediction data if available and Gold TH is selected
      if (selectedCategory === DataCategories.GOLD_TH && predictData?.length) {
        // Process prediction data
        const validPredictData = predictData
          .filter(item => item && item.date && item.predict && !isNaN(parseFloat(item.predict)))
          .map(item => {
            try {
              return {
                x: new Date(item.date).toISOString().split('T')[0],
                y: parseFloat(item.predict)
              };
            } catch (error) {
              console.error(`Invalid date in predictData: ${item.date}`, error);
              return null;
            }
          })
          .filter(item => item !== null);

        console.log("validPredictData before filtering overlaps:", validPredictData);

        // Filter out prediction data that has the same date as actual data
        // Give priority to actual data
        const actualDataDates = new Set(validActualData.map(item => item.x));
        const filteredPredictData = validPredictData.filter(item => !actualDataDates.has(item.x));
        
        console.log("filteredPredictData after removing overlaps:", filteredPredictData);

        // Log overlapping dates
        const overlapCount = validPredictData.length - filteredPredictData.length;
        if (overlapCount > 0) {
          console.log(`Found and filtered ${overlapCount} overlapping prediction records with actual data`);
        }

        // Add prediction dataset if available - CONNECTED TO ACTUAL DATA
        if (filteredPredictData.length > 0) {
          datasets.push({
            label: 'Prediction',
            data: filteredPredictData,
            borderColor: '#4CAF50',
            backgroundColor: 'rgba(76, 175, 80, 0.2)',
            borderWidth: 2,
            fill: false,
            tension: 0.3,
            pointStyle: 'circle',
            pointRadius: 4,
            pointHoverRadius: 6,
            parsing: {
              xAxisKey: 'x',
              yAxisKey: 'y'
            },
          });
          
          // For chart styling to make the lines appear connected
          // Update the options property for the chart
          datasets[0].spanGaps = true; // Allow spanning gaps in data
          datasets[1].spanGaps = true; // Allow spanning gaps in prediction data
          
          console.log("Chart.js prediction dataset:", datasets[1]);
        }
      }

      return {
        datasets,
        currency
      };
    } catch (error) {
      console.error('Error preparing chart data:', error);
      return { labels: [], datasets: [], currency: 'THB' };
    }
  })();

  // Chart options with zoom capability
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 1000,
      easing: 'easeInOutQuad'
    },
    interaction: {
      mode: 'nearest',
      intersect: false,
      axis: 'x',
      // Show pointer only for 7d and 1m timeframes
      includeInvisible: (timeframe === '7d' || timeframe === '1m') && chartData.datasets[0]?.data.length <= 100
    },
    elements: {
      line: {
        tension: 0.3,
        spanGaps: true,
      },
      point: {
        radius: 2,
        hoverRadius: 4,
        hitRadius: 10
      }
    },
    layout: {
      padding: {
        left: 10,
        right: 10,
        top: 20,
        bottom: 10
      }
    },
    plugins: {
      legend: {
        position: 'top',
        labels: {
          boxWidth: 12,
          usePointStyle: true,
          pointStyle: 'circle',
          padding: 16,
          font: {
            family: 'Inter',
            size: 12
          }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: 'white',
        bodyColor: 'rgba(255, 255, 255, 0.8)',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        padding: 12,
        cornerRadius: 8,
        displayColors: true,
        callbacks: {
          title: (context) => {
            try {
              if (!context || !context.length || !context[0].parsed || !context[0].raw) {
                return 'No data';
              }
              
              // Display raw data for debugging
              console.log('Tooltip context:', context[0]);
              
              // Extract date from x value
              const date = context[0].raw.x;
              if (!date || !isValid(new Date(date))) {
                return 'Invalid date';
              }
              
              // Format date as "DD MMMM YYYY" in specified locale
              // Changed from Thai to English locale
              return format(new Date(date), 'dd MMMM yyyy');
            } catch (error) {
              console.error('Error formatting tooltip date:', error);
              return 'Date error';
            }
          },
          label: (context) => {
            if (!context.dataset || !context.parsed) {
              return 'No data';
            }
            
            const label = context.dataset.label || '';
            const value = context.parsed.y;
            const currency = chartData.currency;
            
            // Special case for USDTHB exchange rate
            let formattedValue;
            if (selectedCategory === DataCategories.USDTHB) {
              formattedValue = value.toFixed(2);
            } else {
              formattedValue = formatCurrency(value, currency);
            }
            
            return `${label}: ${formattedValue}`;
          }
        }
      },
      // Add zoom plugin options
      zoom: {
        pan: {
          enabled: true,
          mode: 'x',
          modifierKey: 'shift',
        },
        zoom: {
          wheel: {
            enabled: true,
          },
          pinch: {
            enabled: true,
          },
          mode: 'x',
          // Limit zoom level
          speed: 100,
          threshold: 2,
          sensitivity: 3,
        },
      },
    },
    scales: {
      x: {
        type: 'time',
        time: {
          unit: timeframe === '7d' 
            ? 'day' 
            : timeframe === '1m' 
              ? 'day' 
              : 'month',
          displayFormats: {
            day: 'dd MMM',
            week: 'dd MMM',
            month: 'MMM yyyy'
          },
          tooltipFormat: 'dd MMMM yyyy',
          // For '1m' timeframe, show more ticks (approximately every 3-4 days)
          stepSize: timeframe === '1m' ? 3 : undefined
        },
        adapters: {
          date: {
            locale: enUS
          }
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
          borderDash: [5, 5],
        },
        ticks: {
          font: {
            size: 11
          },
          autoSkip: true,
          maxTicksLimit: timeframe === '1m' ? 10 : (timeframe === '7d' ? 7 : undefined),
          maxRotation: 30,
          minRotation: 0,
          source: 'auto'
        },
        bounds: 'data',
        parsing: true,
        distribution: 'linear',
        offset: false,
        alignToPixels: true
      },
      y: {
        grid: {
          display: true,
          color: 'rgba(0, 0, 0, 0.05)',
          borderDash: [5, 5],
        },
        ticks: {
          font: {
            size: 11
          },
          callback: (value) => {
            try {
              const currency = chartData.currency;
              // Special case for USDTHB exchange rate
              if (selectedCategory === DataCategories.USDTHB) {
                return value.toFixed(2);
              }
              return formatCurrency(value, currency);
            } catch (err) {
              console.error('Error formatting y-axis tick:', err);
              return value.toFixed(2);
            }
          }
        },
        // Start y-axis at zero for better comparison
        beginAtZero: false
      }
    }
  };

  // Function to reset zoom
  const resetZoom = () => {
    if (chartRef.current && chartRef.current.chart) {
      chartRef.current.chart.resetZoom();
      setResetCount(prev => prev + 1);
    }
  };

  // Loading state
  if (loading) {
    return <Skeleton className="w-full h-full" />;
  }

  return (
    <div className="relative h-full">
      <div className="absolute top-0 right-0 z-10">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={resetZoom}
          className="text-xs"
        >
          Zoom Reset
        </Button>
      </div>
      <div className="h-full">
        {chartData.datasets?.length > 0 ? (
          <Line 
            ref={chartRef}
            data={{ datasets: chartData.datasets }} 
            options={options} 
          />
        ) : (
          <div className="flex flex-col min-h-[350px] w-full justify-center items-center">
            <p className="text-muted-foreground">No data found</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default GoldChart;