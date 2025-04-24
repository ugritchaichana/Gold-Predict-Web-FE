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
import { fetchGoldTH, fetchPredictionsWithParams, fetchPredictionsMonth, sortByDateAscending } from '@/services/apiService';

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
  // Check if we have volume data for US Gold
  const hasVolumeData = selectedCategory === DataCategories.GOLD_US && 
    goldUsData.some(item => item.volume || item.volume_weighted_average || item.number_of_transactions);
  // Reset zoom when changing timeframe or category
  useEffect(() => {
    // Add a small delay to ensure chart is fully initialized before resetting zoom
    const timer = setTimeout(() => {
      resetZoom();
    }, 500);
    
    return () => clearTimeout(timer);
  }, [timeframe, selectedCategory]);    
  
  // Process data for the chart based on selected category
  const chartData = (() => {
    if (loading) {
      return { labels: [], datasets: [], minYValue: 0 };
    }

    let actualData = [];
    let currency = 'THB';
    let minYValue = Infinity; // Track minimum Y value for later use

    switch (selectedCategory) {
      case DataCategories.GOLD_TH:
        actualData = sortByDateAscending(goldThData);
        currency = 'THB';
        break;
      case DataCategories.GOLD_US:
        actualData = sortByDateAscending(goldUsData);
        currency = 'USD';
        break;
      case DataCategories.USDTHB:
        actualData = sortByDateAscending(usdthbData);
        currency = 'THB';
        break;
      default:
        actualData = [];
    }

    if (!actualData || actualData.length === 0) {
      return { labels: [], datasets: [], minYValue: 0 };
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
          const price = parseFloat(item.price);
          
          // Update minimum Y value
          if (price < minYValue) {
            minYValue = price;
          }
          
          return {
            x: new Date(dateValue).toISOString().split('T')[0],
            y: price
          };
        } catch (error) {
          const dateValue = item.created_at || item.date;
          return null;
        }
      })
      .filter(item => item !== null);
      
    const datasets = [];
    // Process prediction data first if we're in Gold TH category
    let predictionDataset = null;
    if (selectedCategory === DataCategories.GOLD_TH && predictData?.length) {
      const validPredictData = predictData
        .filter(item => item && item.date && item.predict && !isNaN(parseFloat(item.predict)))
        .map(item => {
          try {
            let dateValue = item.date;
            
            // Check if date is in "DD-MM-YYYY" format and convert it
            if (item.date.match(/^\d{2}-\d{2}-\d{4}$/)) {
              const dateParts = item.date.split('-');
              const day = dateParts[0];
              const month = dateParts[1];
              const year = dateParts[2];
              dateValue = `${year}-${month}-${day}`;
            }
            // If date is already in "YYYY-MM-DD" format, use it as is
            
            const predictPrice = parseFloat(item.predict);
            
            // Update minimum Y value
            if (predictPrice < minYValue) {
              minYValue = predictPrice;
            }
            
            // ใช้รูปแบบการแปลงวันที่เดียวกับ goldTH เพื่อความสอดคล้อง
            return {
              x: new Date(dateValue).toISOString().split('T')[0],
              y: predictPrice
            };
          } catch (error) {
            return null;
          }
        })
        .filter(item => item !== null);

      if (validPredictData.length > 0) {
        predictionDataset = {
          label: 'Prediction Gold Bar (Buy)',
          data: validPredictData,
          borderColor: '#FFD54F',
          backgroundColor: 'rgba(76, 175, 80, 0.2)',
          borderWidth: 2.5,
          fill: false,
          tension: 0.1,
          pointStyle: 'circle',
          pointRadius: 0,
          pointHoverRadius: 7,
          parsing: {
            xAxisKey: 'x',
            yAxisKey: 'y'
          }
        };
        // Add prediction dataset first
        datasets.push(predictionDataset);
      }
    }
    
    if (selectedCategory === DataCategories.GOLD_TH) {
      // For Gold TH, we show multiple price types as separate line series
      // Main price (Gold Price)
      datasets.push({
        label: `Gold Bar (Buy)`,
        data: validActualData,
        borderColor: 'rgb(34, 197, 94)',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        borderWidth: 2.5,
        pointRadius: 1,
        pointHoverRadius: 6,
        tension: 0.2,
        fill: false,
        spanGaps: true,
        parsing: {
          xAxisKey: 'x',
          yAxisKey: 'y'
        }
      });
      
      // Bar sell price (Gold Bar Selling Price)
      const barSellData = actualData
        .filter(item => {
          const hasValidDate = (item && (item.created_at || item.date));
          const hasValidPrice = (item && item.bar_sell_price && !isNaN(parseFloat(item.bar_sell_price)));
          return hasValidDate && hasValidPrice;
        })
        .map(item => {
          try {
            const dateValue = item.created_at || item.date;
            const price = parseFloat(item.bar_sell_price);
            
            // Update minimum Y value
            if (price < minYValue) {
              minYValue = price;
            }
            
            return {
              x: new Date(dateValue).toISOString().split('T')[0],
              y: price
            };
          } catch (error) {
            return null;
          }
        })
        .filter(item => item !== null);
        
      if (barSellData.length > 0) {
        datasets.push({
          label: `Gold Bar (Sell)`,
          data: barSellData,
          borderColor: '#3b82f6',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          borderWidth: 2,
          pointRadius: 1,
          pointHoverRadius: 6,
          tension: 0.2,
          borderDash: [5, 5],
          fill: false,
          spanGaps: true,
          parsing: {
            xAxisKey: 'x',
            yAxisKey: 'y'
          }
        });
      }
      
      // Ornament sell price (Gold Jewelry Selling Price)
      const ornamentSellData = actualData
        .filter(item => {
          const hasValidDate = (item && (item.created_at || item.date));
          const hasValidPrice = (item && item.ornament_sell_price && !isNaN(parseFloat(item.ornament_sell_price)));
          return hasValidDate && hasValidPrice;
        })
        .map(item => {
          try {
            const dateValue = item.created_at || item.date;
            const price = parseFloat(item.ornament_sell_price);
            
            // Update minimum Y value
            if (price < minYValue) {
              minYValue = price;
            }
            
            return {
              x: new Date(dateValue).toISOString().split('T')[0],
              y: price
            };
          } catch (error) {
            return null;
          }
        })
        .filter(item => item !== null);
        
      if (ornamentSellData.length > 0) {
        datasets.push({
          label: `Ornament Gold (Sell)`,
          // label: `Jewelry (Sell)`,
          data: ornamentSellData,
          borderColor: '#f59e0b',
          backgroundColor: 'rgba(245, 158, 11, 0.1)',
          borderWidth: 2,
          pointRadius: 1,
          pointHoverRadius: 6,
          tension: 0.2,
          borderDash: [3, 3],
          fill: false,
          spanGaps: true,
          parsing: {
            xAxisKey: 'x',
            yAxisKey: 'y'
          }
        });
      }
      
      // Ornament buy price (Gold Jewelry Buying Price)
      const ornamentBuyData = actualData
        .filter(item => {
          const hasValidDate = (item && (item.created_at || item.date));
          const hasValidPrice = (item && item.ornament_buy_price && !isNaN(parseFloat(item.ornament_buy_price)));
          return hasValidDate && hasValidPrice;
        })
        .map(item => {
          try {
            const dateValue = item.created_at || item.date;
            const price = parseFloat(item.ornament_buy_price);
            
            // Update minimum Y value
            if (price < minYValue) {
              minYValue = price;
            }
            
            return {
              x: new Date(dateValue).toISOString().split('T')[0],
              y: price
            };
          } catch (error) {
            return null;
          }
        })
        .filter(item => item !== null);
        
      if (ornamentBuyData.length > 0) {
        datasets.push({
          label: `Ornament Gold (Buy)`,
          // label: `Jewelry (Buy)`,
          data: ornamentBuyData,
          borderColor: '#ec4899',
          backgroundColor: 'rgba(236, 72, 153, 0.1)',
          borderWidth: 2,
          pointRadius: 1,
          pointHoverRadius: 6,
          tension: 0.2,
          borderDash: [2, 2],
          fill: false,
          spanGaps: true,
          parsing: {
            xAxisKey: 'x',
            yAxisKey: 'y'
          }
        });
      }
    } else if (selectedCategory === DataCategories.GOLD_US) {
      // For Gold US, show multiple price types available from the new API
      // --- แสดงกราฟเส้นก่อน ---
      // Main price
      datasets.push({
        label: `Open Price`,
        data: validActualData,
        borderColor: 'rgb(34, 197, 94)',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        borderWidth: 2.5,
        pointRadius: 1,
        pointHoverRadius: 6,
        tension: 0.2,
        fill: false,
        spanGaps: true,
        parsing: {
          xAxisKey: 'x',
          yAxisKey: 'y'
        }
      });
      // Close price
      const closePriceData = actualData
        .filter(item => {
          const hasValidDate = (item && (item.created_at || item.date));
          const hasValidPrice = (item && item.close_price && !isNaN(parseFloat(item.close_price)));
          return hasValidDate && hasValidPrice;
        })
        .map(item => {
          try {
            const dateValue = item.created_at || item.date;
            const price = parseFloat(item.close_price);
            if (price < minYValue) minYValue = price;
            return { x: new Date(dateValue).toISOString().split('T')[0], y: price };
          } catch (error) { return null; }
        })
        .filter(item => item !== null);
      if (closePriceData.length > 0) {
        datasets.push({
          label: `Close Price`,
          data: closePriceData,
          borderColor: '#3b82f6',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          borderWidth: 2,
          pointRadius: 1,
          pointHoverRadius: 6,
          tension: 0.2,
          borderDash: [5, 5],
          fill: false,
          spanGaps: true,
          parsing: {
            xAxisKey: 'x',
            yAxisKey: 'y'
          }
        });
      }
      // High price
      const highPriceData = actualData
        .filter(item => {
          const hasValidDate = (item && (item.created_at || item.date));
          const hasValidPrice = (item && item.high_price && !isNaN(parseFloat(item.high_price)));
          return hasValidDate && hasValidPrice;
        })
        .map(item => {
          try {
            const dateValue = item.created_at || item.date;
            const price = parseFloat(item.high_price);
            if (price < minYValue) minYValue = price;
            return { x: new Date(dateValue).toISOString().split('T')[0], y: price };
          } catch (error) { return null; }
        })
        .filter(item => item !== null);
      if (highPriceData.length > 0) {
        datasets.push({
          label: `High Price`,
          data: highPriceData,
          borderColor: '#f59e0b',
          backgroundColor: 'rgba(245, 158, 11, 0.1)',
          borderWidth: 2,
          pointRadius: 1,
          pointHoverRadius: 6,
          tension: 0.2,
          borderDash: [3, 3],
          fill: false,
          spanGaps: true,
          parsing: {
            xAxisKey: 'x',
            yAxisKey: 'y'
          }
        });
      }
      // Low price
      const lowPriceData = actualData
        .filter(item => {
          const hasValidDate = (item && (item.created_at || item.date));
          const hasValidPrice = (item && item.low_price && !isNaN(parseFloat(item.low_price)));
          return hasValidDate && hasValidPrice;
        })
        .map(item => {
          try {
            const dateValue = item.created_at || item.date;
            const price = parseFloat(item.low_price);
            if (price < minYValue) minYValue = price;
            return { x: new Date(dateValue).toISOString().split('T')[0], y: price };
          } catch (error) { return null; }
        })
        .filter(item => item !== null);
      if (lowPriceData.length > 0) {
        datasets.push({
          label: `Low Price`,
          data: lowPriceData,
          borderColor: '#ef4444',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          borderWidth: 2,
          pointRadius: 1,
          pointHoverRadius: 6,
          tension: 0.2,
          borderDash: [2, 2],
          fill: false,
          spanGaps: true,
          parsing: {
            xAxisKey: 'x',
            yAxisKey: 'y'
          }
        });
      }
      // --- แล้วค่อยแสดงกราฟแท่ง (Volume) ---
      const volumeData = actualData
        .filter(item => {
          const hasValidDate = (item && (item.created_at || item.date));
          const hasValidVolume = (item && item.volume && !isNaN(parseFloat(item.volume)));
          return hasValidDate && hasValidVolume;
        })
        .map(item => {
          try {
            const dateValue = item.created_at || item.date;
            return {
              x: new Date(dateValue).toISOString().split('T')[0],
              y: parseFloat(item.volume)
            };
          } catch (error) {
            return null;
          }
        })
        .filter(item => item !== null);
      if (volumeData.length > 0) {
        datasets.push({
          label: `Volume`,
          data: volumeData,
          backgroundColor: 'rgba(59, 130, 246, 0.5)',
          borderColor: 'rgba(59, 130, 246, 0.8)',
          borderWidth: 1,
          pointRadius: 0,
          pointHoverRadius: 0,
          type: 'bar',
          order: 1,
          yAxisID: 'volumeAxis',
          maxBarThickness: 12, // กำหนดความกว้างสูงสุดของแท่งกราฟ Volume (ค่าในหน่วย pixel)
          parsing: {
            xAxisKey: 'x',
            yAxisKey: 'y'
          }
        });
      }
    } else {
      // For other data types, show just the main price
      datasets.push({
        label: `Close Price`,
        // label: `${selectedCategory} Latest`,
        data: validActualData,
        borderColor: 'rgb(34, 197, 94)',
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
        }
      });
      // เพิ่มเส้นกราฟสำหรับข้อมูลอื่นๆ ของ USD/THB
      if (selectedCategory === DataCategories.USDTHB) {
        // Open
        const openData = actualData
          .filter(item => {
            const hasValidDate = (item && (item.created_at || item.date));
            const hasValid = (item && item.open && !isNaN(parseFloat(item.open)));
            return hasValidDate && hasValid;
          })
          .map(item => {
            try {
              const dateValue = item.created_at || item.date;
              const value = parseFloat(item.open);
              if (value < minYValue) minYValue = value;
              return { x: new Date(dateValue).toISOString().split('T')[0], y: value };
            } catch { return null; }
          })
          .filter(item => item !== null);
        if (openData.length > 0) {
          datasets.push({
            label: 'Open Price',
            data: openData,
            borderColor: '#f59e0b',
            backgroundColor: 'rgba(245, 158, 11, 0.1)',
            borderWidth: 1.5,
            pointRadius: 0,
            pointHoverRadius: 5,
            tension: 0.2,
            borderDash: [4, 2],
            fill: false,
            spanGaps: true,
            parsing: { xAxisKey: 'x', yAxisKey: 'y' }
          });
        }
        // High
        const highData = actualData
          .filter(item => {
            const hasValidDate = (item && (item.created_at || item.date));
            const hasValid = (item && item.high && !isNaN(parseFloat(item.high)));
            return hasValidDate && hasValid;
          })
          .map(item => {
            try {
              const dateValue = item.created_at || item.date;
              const value = parseFloat(item.high);
              if (value < minYValue) minYValue = value;
              return { x: new Date(dateValue).toISOString().split('T')[0], y: value };
            } catch { return null; }
          })
          .filter(item => item !== null);
        if (highData.length > 0) {
          datasets.push({
            label: 'High Price',
            data: highData,
            borderColor: '#ef4444',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            borderWidth: 1.5,
            pointRadius: 0,
            pointHoverRadius: 5,
            tension: 0.2,
            borderDash: [2, 2],
            fill: false,
            spanGaps: true,
            parsing: { xAxisKey: 'x', yAxisKey: 'y' }
          });
        }
        // Low
        const lowData = actualData
          .filter(item => {
            const hasValidDate = (item && (item.created_at || item.date));
            const hasValid = (item && item.low && !isNaN(parseFloat(item.low)));
            return hasValidDate && hasValid;
          })
          .map(item => {
            try {
              const dateValue = item.created_at || item.date;
              const value = parseFloat(item.low);
              if (value < minYValue) minYValue = value;
              return { x: new Date(dateValue).toISOString().split('T')[0], y: value };
            } catch { return null; }
          })
          .filter(item => item !== null);
        if (lowData.length > 0) {
          datasets.push({
            label: 'Low Price',
            data: lowData,
            borderColor: '#3b82f6',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            borderWidth: 1.5,
            pointRadius: 0,
            pointHoverRadius: 5,
            tension: 0.2,
            borderDash: [6, 2],
            fill: false,
            spanGaps: true,
            parsing: { xAxisKey: 'x', yAxisKey: 'y' }
          });
        }
        // ลบ Percent Change และ Difference dataset ไม่ต้องแสดง
      }
    }

    // Ensure all datasets have spanGaps enabled for consistent display
    datasets.forEach(dataset => {
      dataset.spanGaps = true;
    });

    // Calculate max volume for volumeAxis
    let maxVolume = 0;
    if (selectedCategory === DataCategories.GOLD_US) {
      const volumeArr = actualData
        .filter(item => item && item.volume && !isNaN(parseFloat(item.volume)))
        .map(item => parseFloat(item.volume));
      if (volumeArr.length > 0) {
        maxVolume = Math.max(...volumeArr);
      }
    }
    let volumeMax = undefined;
    if (["7d", "1m", "1y"].includes(timeframe)) {
      volumeMax = Math.max(4000, Math.ceil(maxVolume * 1.1)); // 10% margin
    } else if (timeframe === "all") {
      volumeMax = Math.max(1300000, Math.ceil(maxVolume * 1.05)); // 5% margin
    }

    // Return chart.js compatible object
    return {
      labels: validActualData.map(item => item.x),
      datasets: datasets,
      currency: currency,
      minYValue: minYValue, // Pass the minimum Y value to be used in options
      volumeMax: volumeMax // Pass the calculated max volume
    };
  })();
  
  // Calculate adjusted minimum Y value (Original min - 50% of original min)
  const calculatedMinYValue = chartData.minYValue !== Infinity 
    ? chartData.minYValue - (chartData.minYValue * 0)
    // ? chartData.minYValue - (chartData.minYValue * 0.05)
    : undefined;
    
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
          boxWidth: 16,
          usePointStyle: true,
          pointStyle: 'circle',
          padding: 16,
          font: {
            family: 'Inter',
            size: 13
          },
          generateLabels: (chart) => {
            const datasets = chart.data.datasets;
            return datasets.map((dataset, i) => {
              const meta = chart.getDatasetMeta(i);
              const hidden = meta.hidden === true || chart.data.datasets[i].hidden === true;
              return {
                text: dataset.label,
                fillStyle: hidden ? 'transparent' : dataset.borderColor, // กลวงโปร่งใสเมื่อปิด
                strokeStyle: dataset.borderColor,
                fontColor: dataset.borderColor,
                lineWidth: hidden ? 2 : 0,
                pointStyle: 'circle',
                borderRadius: 8,
                hidden: hidden,
                datasetIndex: i,
                borderWidth: hidden ? 2 : 0,
                borderColor: dataset.borderColor,
                backgroundColor: hidden ? 'transparent' : dataset.borderColor, // กลวงโปร่งใสเมื่อปิด
                font: {
                  family: 'Inter',
                  size: 13,
                  style: hidden ? 'normal' : 'normal',
                  weight: hidden ? 'normal' : 'bold',
                  lineHeight: 1.2,
                  decoration: hidden ? 'line-through' : undefined
                },
                textDecoration: hidden ? 'line-through' : undefined
              };
            });
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
          threshold: 10, // เพิ่มค่า threshold เพื่อป้องกันการลากโดยไม่ตั้งใจ
          onPanStart: function({chart}) {
            chart.canvas.style.cursor = 'grab';
          },
          onPanComplete: function({chart}) {
            chart.canvas.style.cursor = 'default';
          }
        },
        zoom: {
          wheel: {
            enabled: true,
            speed: 0.1, // ปรับความเร็วการซูม
          },
          pinch: {
            enabled: true,
          },
          mode: 'x',
          speed: 50,
          threshold: 2,
          sensitivity: 3,
        },
        limits: {
          x: {minRange: 86400000 * 2}, // อย่างน้อย 2 วัน (ในหน่วย milliseconds)
        }
      }
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
              return value.toFixed(2);
            }
          }
        },
        // ตั้งค่า min ให้ต่ำกว่าค่าข้อมูลจริง 50% ตามที่ต้องการ
        min: calculatedMinYValue,
        beginAtZero: false
      },
      // Y-axis for volume data with max value set dynamically
      volumeAxis: {
        type: 'linear',
        display: selectedCategory === DataCategories.GOLD_US && hasVolumeData,
        position: 'right',
        grid: {
          drawOnChartArea: false, // only draw grid lines for the volume axis
        },
        ticks: {
          font: {
            size: 10
          },
          color: 'rgba(59, 130, 246, 0.8)',
          callback: (value) => {
            if (value >= 1000000) {
              return (value / 1000000).toFixed(1) + 'M';
            } else if (value >= 1000) {
              return (value / 1000).toFixed(1) + 'K';
            }
            return value;
          }
        },
        max: chartData.volumeMax,
        min: 0,
        beginAtZero: true
      },
      // Second Y-axis for transaction data
      y1: {
        type: 'linear',
        display: false, // ปิดการแสดงผลชั่วคราวเนื่องจากไม่มีการใช้งาน
        position: 'right',
        grid: {
          display: false,
        },
        ticks: {
          font: {
            size: 11
          }
        },
        beginAtZero: true
      }
    }
  };
  
  // Functions to control zoom
  const resetZoom = () => {
    try {
      if (chartRef.current) {
        const chartInstance = chartRef.current;
        if (chartInstance.chart && typeof chartInstance.chart.resetZoom === 'function') {
          chartInstance.chart.resetZoom();
        }
        setResetCount(prev => prev + 1);
      }
    } catch (error) {
      // Error handling
    }
  };
  
  const zoomIn = () => {
    if (chartRef.current && chartRef.current.chart) {
      chartRef.current.chart.zoom(1.2); // ซูมเข้า 20%
    }
  };
  
  const zoomOut = () => {
    if (chartRef.current && chartRef.current.chart) {
      chartRef.current.chart.zoom(0.8); // ซูมออก 20%
    }
  };

  // Loading state
  if (loading) {
    return <Skeleton className="w-full h-full" />;
  }
  
  return (
    <div className="relative h-full">
      <div className="absolute top-0 right-0 z-10 flex gap-2">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={resetZoom}
          className="text-xs"
        >
          Reset Zoom
        </Button>
      </div>
      
      <div className="h-full">
        {chartData.datasets?.length > 0 ? (
          <Line 
            ref={chartRef}
            data={chartData} 
            options={options} 
            onMouseEnter={() => {
              if (chartRef.current?.canvas) {
                chartRef.current.canvas.style.cursor = 'crosshair';
              }
            }}
            onMouseLeave={() => {
              if (chartRef.current?.canvas) {
                chartRef.current.canvas.style.cursor = 'default';
              }
            }}
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