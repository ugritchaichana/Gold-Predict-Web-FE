import React, { useRef, useState, useEffect } from 'react';
import { 
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  TimeScale,
  Filler,
} from 'chart.js';
import { Chart, Line, Bar } from 'react-chartjs-2';
import zoomPlugin from 'chartjs-plugin-zoom';
import 'chartjs-adapter-date-fns';
import { format } from 'date-fns';
import { enUS } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

// Register ChartJS plugins
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
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

// Constants for chart types
const ChartTypes = {
  LINE: 'line',
  BAR: 'bar',
  CANDLE: 'candle'
};

// Main component
const TradingViewChart = ({
  chartData,
  chartType,
  selectedCategory,
  loading
}) => {
  const chartRef = useRef(null);
  const [resetCount, setResetCount] = useState(0);

  // Reset zoom function
  const resetZoom = () => {
    if (chartRef.current) {
      chartRef.current.resetZoom();
      setResetCount(prev => prev + 1);
    }
  };

  // Process data based on chart type
  const processedData = (() => {
    if (loading || !chartData || !chartData.Time || !chartData.datasets) {
      return { labels: [], datasets: [] };
    }

    const labels = chartData.Time;
    let datasets = [];
    let currency = selectedCategory === DataCategories.GOLD_US ? 'USD' : 'THB';

    // ข้อมูลสำหรับกราฟเส้น
    if (chartType === ChartTypes.LINE) {
      // สร้าง datasets สำหรับกราฟเส้น โดยใช้ข้อมูลทุกชุดที่มี
      datasets = chartData.datasets.map((dataset, index) => {
        // กำหนดสีตามประเภทข้อมูล
        let borderColor, backgroundColor;
        
        switch (dataset.label) {
          case 'Price':
            borderColor = 'rgb(34, 197, 94)'; // สีเขียว
            backgroundColor = 'rgba(34, 197, 94, 0.1)';
            break;
          case 'Close Price':
          case 'Close':
            borderColor = 'rgb(59, 130, 246)'; // สีฟ้า
            backgroundColor = 'rgba(59, 130, 246, 0.1)';
            break;
          case 'High Price':
          case 'High':
            borderColor = 'rgb(16, 185, 129)'; // สีเขียวเข้ม
            backgroundColor = 'rgba(16, 185, 129, 0.1)';
            break;
          case 'Low Price':
          case 'Low':
            borderColor = 'rgb(239, 68, 68)'; // สีแดง
            backgroundColor = 'rgba(239, 68, 68, 0.1)';
            break;
          default:
            // สีสุ่มสำหรับชุดข้อมูลอื่นๆ
            const r = Math.floor(Math.random() * 255);
            const g = Math.floor(Math.random() * 255);
            const b = Math.floor(Math.random() * 255);
            borderColor = `rgb(${r}, ${g}, ${b})`;
            backgroundColor = `rgba(${r}, ${g}, ${b}, 0.1)`;
        }

        return {
          label: dataset.label,
          data: dataset.data,
          borderColor: borderColor,
          backgroundColor: backgroundColor,
          borderWidth: 2,
          pointRadius: 1,
          pointHoverRadius: 5,
          tension: 0.1,
          fill: false,
        };
      });
    }
    // ข้อมูลสำหรับกราฟแท่ง
    else if (chartType === ChartTypes.BAR) {
      // ใช้เฉพาะข้อมูลราคา
      const priceDataset = chartData.datasets.find(d => d.label === 'Price');
      
      if (priceDataset) {
        datasets = [{
          label: 'Price',
          data: priceDataset.data,
          backgroundColor: priceDataset.data.map((value, index) => {
            // ถ้ามีข้อมูลก่อนหน้า ให้ตรวจสอบว่าราคาเพิ่มขึ้นหรือลดลง
            if (index > 0) {
              return value >= priceDataset.data[index - 1] 
                ? 'rgba(16, 185, 129, 0.7)' // สีเขียวเมื่อราคาเพิ่มขึ้นหรือเท่าเดิม
                : 'rgba(239, 68, 68, 0.7)'; // สีแดงเมื่อราคาลดลง
            }
            return 'rgba(16, 185, 129, 0.7)'; // ค่าเริ่มต้นเป็นสีเขียว
          }),
          borderColor: priceDataset.data.map((value, index) => {
            if (index > 0) {
              return value >= priceDataset.data[index - 1] 
                ? 'rgb(16, 185, 129)' 
                : 'rgb(239, 68, 68)';
            }
            return 'rgb(16, 185, 129)';
          }),
          borderWidth: 1,
        }];
      }
    }
    // ข้อมูลสำหรับกราฟแท่งเทียน
    else if (chartType === ChartTypes.CANDLE) {
      // สำหรับกราฟแท่งเทียน เราต้องใช้ข้อมูล Open, High, Low, Close
      const openDataset = chartData.datasets.find(d => 
        d.label === 'Open' || d.label === 'Open Price');
      const highDataset = chartData.datasets.find(d => 
        d.label === 'High' || d.label === 'High Price');
      const lowDataset = chartData.datasets.find(d => 
        d.label === 'Low' || d.label === 'Low Price');
      const closeDataset = chartData.datasets.find(d => 
        d.label === 'Close' || d.label === 'Close Price' || d.label === 'Price');

      // ถ้ามีข้อมูลครบ OHLC ให้สร้างกราฟแท่งเทียน
      if (openDataset && highDataset && lowDataset && closeDataset) {
        // ข้อมูลสำหรับแท่งเทียน 
        const ohlcData = labels.map((date, index) => {
          const open = openDataset.data[index];
          const high = highDataset.data[index];
          const low = lowDataset.data[index];
          const close = closeDataset.data[index];
          
          return { date, open, high, low, close };
        });

        // แสดงเป็นกราฟเส้นที่มีช่วง high-low เป็นพื้นที่
        datasets = [
          // แสดงแท่งราคา 
          {
            label: 'OHLC',
            type: 'bar',
            data: ohlcData.map(item => ({
              x: item.date,
              open: item.open,
              high: item.high,
              low: item.low,
              close: item.close,
            })),
            backgroundColor: ohlcData.map(item => 
              item.close >= item.open 
                ? 'rgba(16, 185, 129, 0.7)' // สีเขียวเมื่อขึ้น
                : 'rgba(239, 68, 68, 0.7)' // สีแดงเมื่อลง
            ),
            borderColor: ohlcData.map(item => 
              item.close >= item.open 
                ? 'rgb(16, 185, 129)' // สีเขียวเมื่อขึ้น
                : 'rgb(239, 68, 68)' // สีแดงเมื่อลง
            ),
            borderWidth: 1,
            barPercentage: 0.5,
          },
          // แสดงเส้น High-Low
          {
            label: 'High-Low Range',
            type: 'line',
            data: ohlcData.map((item, i) => ({
              x: item.date,
              y: [item.low, item.high],
            })),
            backgroundColor: 'rgba(0, 0, 0, 0)',
            borderColor: ohlcData.map(item => 
              item.close >= item.open 
                ? 'rgb(16, 185, 129)' 
                : 'rgb(239, 68, 68)'
            ),
            borderWidth: 1,
            pointRadius: 0,
            pointHoverRadius: 0,
          }
        ];
      }
    }

    return {
      labels,
      datasets,
      currency
    };
  })();

  // Chart options
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 1000,
      easing: 'easeInOutQuad'
    },
    interaction: {
      mode: 'index',
      intersect: false,
    },
    elements: {
      line: {
        tension: 0.1,
      },
      point: {
        radius: 1,
        hoverRadius: 5,
      },
      bar: {
        borderWidth: 1,
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
    scales: {
      x: {
        grid: {
          display: false
        }
      },
      y: {
        beginAtZero: false,
        ticks: {
          callback: function(value) {
            return formatCurrency(value, 
              selectedCategory === DataCategories.GOLD_US ? 'USD' : 'THB');
          }
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.05)'
        }
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
            if (!context || !context.length) return 'No data';
            return context[0].label || 'No data';
          },
          label: function(context) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            
            if (context.parsed.y !== null) {
              if (context.dataset.type === 'bar' && context.dataset.label === 'OHLC') {
                const dataPoint = context.dataset.data[context.dataIndex];
                if (dataPoint) {
                  return [
                    `Open: ${formatCurrency(dataPoint.open, processedData.currency)}`,
                    `High: ${formatCurrency(dataPoint.high, processedData.currency)}`,
                    `Low: ${formatCurrency(dataPoint.low, processedData.currency)}`,
                    `Close: ${formatCurrency(dataPoint.close, processedData.currency)}`
                  ];
                }
              } else {
                label += formatCurrency(context.parsed.y, processedData.currency);
              }
            }
            return label;
          }
        }
      },
      zoom: {
        pan: {
          enabled: true,
          mode: 'x',
        },
        zoom: {
          wheel: {
            enabled: true,
          },
          pinch: {
            enabled: true
          },
          mode: 'x',
        }
      }
    }
  };

  return (
    <div className="relative h-full">
      {loading ? (
        <div className="flex justify-center items-center h-full">
          <Skeleton className="h-full w-full rounded-lg" />
        </div>
      ) : !processedData.datasets.length ? (
        <div className="flex justify-center items-center h-full">
          <p className="text-muted-foreground">No data available for the selected criteria</p>
        </div>
      ) : (
        <>
          {chartType === ChartTypes.LINE && (
            <Line data={processedData} options={options} ref={chartRef} />
          )}
          
          {chartType === ChartTypes.BAR && (
            <Bar data={processedData} options={options} ref={chartRef} />
          )}
          
          {chartType === ChartTypes.CANDLE && (
            <Chart type="bar" data={processedData} options={options} ref={chartRef} />
          )}
          
          <Button
            variant="outline"
            size="sm"
            className="absolute top-2 right-2 z-10"
            onClick={resetZoom}
          >
            Reset Zoom
          </Button>
        </>
      )}
    </div>
  );
};

export default TradingViewChart; 