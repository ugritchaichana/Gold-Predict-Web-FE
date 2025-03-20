import React, { useRef, useState, useEffect } from 'react';
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
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { fetchGoldTH, fetchPredictionsWithParams } from '@/services/apiService';

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
  useEffect(() => {
    resetZoom();
  }, [timeframe, selectedCategory]);

  // Process data for the chart based on selected category
  const chartData = (() => {
    if (loading) {
      return { labels: [], datasets: [] };
    }

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
        actualData = [];
    }

    if (!actualData || actualData.length === 0) {
      return { labels: [], datasets: [] };
    }

    const validActualData = actualData
      .filter(item => {
        const hasValidDate = (item && (item.created_at || item.date));
        const hasValidPrice = (item && item.price && !isNaN(parseFloat(item.price)));
        return hasValidDate && hasValidPrice;
      })
      .map(item => {
        try {
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

    const datasets = [
      {
        label: `${selectedCategory} Latest`,
        data: validActualData,
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        borderWidth: 2,
        pointRadius: 0,
        pointHoverRadius: 7,
        tension: 0.1,
        fill: false,
        spanGaps: true,
        parsing: {
          xAxisKey: 'x',
          yAxisKey: 'y'
        },
      }
    ];

    if (selectedCategory === DataCategories.GOLD_TH && predictData?.length) {
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

      if (validPredictData.length > 0) {
        datasets.push({
          label: 'Prediction',
          data: validPredictData,
          borderColor: '#4CAF50',
          backgroundColor: 'rgba(76, 175, 80, 0.2)',
          borderWidth: 2,
          fill: false,
          tension: 0.1,
          pointStyle: 'circle',
          pointRadius: 0,
          pointHoverRadius: 7,
          parsing: {
            xAxisKey: 'x',
            yAxisKey: 'y'
          },
        });

        datasets[0].spanGaps = true;
        datasets[1].spanGaps = true;
      }
    }

    return {
      datasets,
      currency
    };
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
      includeInvisible: (timeframe === '7d' || timeframe === '1m') && chartData.datasets[0]?.data.length <= 100
    },
    elements: {
      line: {
        tension: 0.1,
        spanGaps: true,
      },
      point: {
        radius: 0, // Disable all points globally
        hoverRadius: 0, // Disable hover effect
        hitRadius: 0 // Disable hit detection
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

              const date = context[0].raw.x;
              if (!date || !isValid(new Date(date))) {
                return 'Invalid date';
              }

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