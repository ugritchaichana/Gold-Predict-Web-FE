import React, { useRef, useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  BarController,
  Title,
  Tooltip,
  Legend,
  TimeScale,
  Filler
} from 'chart.js';
import zoomPlugin from 'chartjs-plugin-zoom';
import annotationPlugin from 'chartjs-plugin-annotation';
import 'chartjs-adapter-date-fns';
import { format, isValid } from 'date-fns';
import { enUS } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { fetchGoldTH, fetchPredictionsWithParams, fetchPredictionsMonth, sortByDateAscending } from '@/services/apiService';
import { useTheme } from 'next-themes';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  BarController,
  Title,
  Tooltip,
  Legend,
  TimeScale,
  Filler,
  zoomPlugin,
  annotationPlugin
);

const DataCategories = {
  GOLD_TH: 'Gold TH',
  GOLD_US: 'Gold US',
  USDTHB: 'USD THB'
};

const TimeFrames = {
  LAST_7_DAYS: '7d',
  LAST_30_DAYS: '30d'
};

const LEGEND_KEY_MAP = {
  [DataCategories.GOLD_TH]: 'goldth-legend-visibility',
  [DataCategories.GOLD_US]: 'goldus-legend-visibility',
  [DataCategories.USDTHB]: 'usdthb-legend-visibility',
};

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
  const { theme } = useTheme();

  const [isDarkTheme, setIsDarkTheme] = useState(false);

  const [legendVisibility, setLegendVisibility] = useState({});

  useEffect(() => {
    setIsDarkTheme(document.documentElement.classList.contains('dark'));
    
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class') {
          const isDark = document.documentElement.classList.contains('dark');
          setIsDarkTheme(isDark);
        }
      });
    });
    
    observer.observe(document.documentElement, { attributes: true });
    
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const key = LEGEND_KEY_MAP[selectedCategory];
    if (key) {
      const saved = localStorage.getItem(key);
      if (saved) {
        try {
          setLegendVisibility(JSON.parse(saved));
        } catch {
          setLegendVisibility({});
        }
      } else {
        setLegendVisibility({});
      }
    }
  }, [selectedCategory]);

  const saveLegendVisibility = (vis) => {
    const key = LEGEND_KEY_MAP[selectedCategory];
    if (key) {
      localStorage.setItem(key, JSON.stringify(vis));
    }
  };
  const hasVolumeData = false;
  useEffect(() => {
    const timer = setTimeout(() => {
      resetZoom();
    }, 500);
    
    return () => clearTimeout(timer);
  }, [timeframe, selectedCategory]);    
  
  const chartData = (() => {
    if (loading) {
      return { labels: [], datasets: [], minYValue: 0 };
    }

    let actualData = [];
    let currency = 'THB';
    let minYValue = Infinity;

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
    
    let firstActualDate = null;
    if (validActualData.length > 0) {
      firstActualDate = validActualData[0].x;
    }
      
    const datasets = [];
    let predictionDataset = null;
    if (selectedCategory === DataCategories.GOLD_TH && predictData?.length) {
      const validPredictData = predictData
        .filter(item => item && item.date && item.predict && !isNaN(parseFloat(item.predict)))
        .map(item => {
          try {
            let dateValue = item.date;
            
            if (item.date.match(/^\d{2}-\d{2}-\d{4}$/)) {
              const dateParts = item.date.split('-');
              const day = dateParts[0];
              const month = dateParts[1];
              const year = dateParts[2];
              dateValue = `${year}-${month}-${day}`;
            }
            
            const predictPrice = parseFloat(item.predict);
            
            if (predictPrice < minYValue) {
              minYValue = predictPrice;
            }
            
            return {
              x: new Date(dateValue).toISOString().split('T')[0],
              y: predictPrice
            };
          } catch (error) {
            return null;
          }
        })
        .filter(item => item !== null)
        .filter(item => {
          if (!firstActualDate) return true;
          return item.x >= firstActualDate;
        });

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
          },
          hidden: legendVisibility['Prediction Gold Bar (Buy)'] === undefined ? false : legendVisibility['Prediction Gold Bar (Buy)']
        };
        datasets.push(predictionDataset);
      }
    }
    
    if (selectedCategory === DataCategories.GOLD_TH) {
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
        },
        hidden: legendVisibility['Gold Bar (Buy)'] === undefined ? false : legendVisibility['Gold Bar (Buy)']
      });
      
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
          hidden: legendVisibility['Gold Bar (Sell)'] === undefined ? true : legendVisibility['Gold Bar (Sell)'],
          parsing: {
            xAxisKey: 'x',
            yAxisKey: 'y'
          }
        });
      }
      
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
          hidden: legendVisibility['Ornament Gold (Sell)'] === undefined ? true : legendVisibility['Ornament Gold (Sell)'],
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
          hidden: legendVisibility['Ornament Gold (Buy)'] === undefined ? true : legendVisibility['Ornament Gold (Buy)'],
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
        },
        hidden: legendVisibility['Open Price'] === undefined ? false : legendVisibility['Open Price']
      });
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
          },
          hidden: legendVisibility['Close Price'] === undefined ? false : legendVisibility['Close Price']
        });
      }
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
          hidden: legendVisibility['High Price'] === undefined ? true : legendVisibility['High Price'],
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
          hidden: legendVisibility['Low Price'] === undefined ? true : legendVisibility['Low Price'],
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
      }      // ลบการแสดงข้อมูล Volume
    } else {
      datasets.push({
        label: `Close Price`,
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
        },
        hidden: legendVisibility['Close Price'] === undefined ? false : legendVisibility['Close Price']
      });
      if (selectedCategory === DataCategories.USDTHB) {
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
            parsing: { xAxisKey: 'x', yAxisKey: 'y' },
            hidden: legendVisibility['Open Price'] === undefined ? true : legendVisibility['Open Price']
          });
        }
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
            hidden: legendVisibility['High Price'] === undefined ? true : legendVisibility['High Price'],
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
            hidden: legendVisibility['Low Price'] === undefined ? true : legendVisibility['Low Price'],
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
      }
    }

    datasets.forEach(dataset => {
      dataset.spanGaps = true;
    });
    let volumeMax = undefined;

    return {
      labels: validActualData.map(item => item.x),
      datasets: datasets,
      currency: currency,
      minYValue: minYValue,
      volumeMax: volumeMax
    };
  })();
  
  const calculatedMinYValue = chartData.minYValue !== Infinity 
    ? chartData.minYValue - (chartData.minYValue * 0)
    : undefined;
    
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
        radius: 0,
        hoverRadius: 0,
        hitRadius: 0
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
        },
        onClick: (e, legendItem, legend) => {
          const ci = legend.chart;
          const index = legendItem.datasetIndex;
          const meta = ci.getDatasetMeta(index);
          meta.hidden = meta.hidden === null ? !ci.data.datasets[index].hidden : null;
          ci.update();
          const label = ci.data.datasets[index].label;
          const newVis = { ...legendVisibility, [label]: !(meta.hidden === null ? !ci.data.datasets[index].hidden : !meta.hidden) };
          setLegendVisibility(newVis);
          saveLegendVisibility(newVis);
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
          }, label: (context) => {
            if (!context.dataset || !context.parsed) {
              return 'No data';
            }

            const label = context.dataset.label || '';
            const value = context.parsed.y;
            const currency = chartData.currency;

            let formattedValue;
            if (selectedCategory === DataCategories.USDTHB) {
              formattedValue = value.toFixed(2) + " THB";
            } else if (selectedCategory === DataCategories.GOLD_US) {
              formattedValue = value.toLocaleString(undefined, {maximumFractionDigits:2}) + " USD";
            } else {
              formattedValue = value.toLocaleString(undefined, {maximumFractionDigits:2}) + " THB";
            }

            return `${label}: ${formattedValue}`;
          }
        }
      },
      zoom: {
        pan: {
          enabled: true,
          mode: 'x',
          threshold: 10,
          onPanStart: function({chart}) {
            if (chart && chart.canvas) chart.canvas.style.cursor = 'grabbing';
          },
          onPanComplete: function({chart}) {
            if (chart && chart.canvas) chart.canvas.style.cursor = 'default';
          }
        },
        zoom: {
          wheel: {
            enabled: true,
            speed: 0.1,
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
          x: {
            minRange: 86400000 * 2,
            min: 'original',
            max: 'original'
          }
        }
      },
      annotation: {
        annotations: (() => {
          if (selectedCategory === DataCategories.GOLD_TH && chartData.labels && chartData.labels.length > 0) {
            const lastGoldThLabel = chartData.labels[chartData.labels.length - 1];
            
            return {
              lastGoldThLine: {
                type: 'line',
                xMin: lastGoldThLabel,
                xMax: lastGoldThLabel,
                borderColor: isDarkTheme ? '#fff' : '#222',
                borderWidth: 2,
                borderDash: [6, 6],
                label: {
                  display: true,
                  content: 'C\u00A0u\u00A0r\u00A0r\u00A0e\u00A0n\u00A0t  \u00A0D\u00A0a\u00A0y',
                  color: isDarkTheme ? '#fff' : '#222',
                  backgroundColor: isDarkTheme ? 'rgba(34,34,34,0.9)' : 'rgba(255,255,255,0.9)',
                  position: 'start',
                  rotation: -90,
                  font: {
                    size: 14,
                    weight: 'bold',
                    family: 'Inter, Arial, sans-serif',
                    lineHeight: 1.2,
                  },
                  xAdjust: 20,
                  yAdjust: -20,
                  padding: { top: 8, bottom: 8, left: 12, right: 12 },
                  cornerRadius: 6,
                },
                z: 99,
              },
            };
          }
          return {};
        })()
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
          },          callback: (value) => {
            try {
              const currency = chartData.currency;
              if (selectedCategory === DataCategories.USDTHB) {
                return value.toFixed(2) + " THB";
              } else if (selectedCategory === DataCategories.GOLD_US) {
                return value.toLocaleString(undefined, {maximumFractionDigits:2}) + " USD";
              } else {
                return value.toLocaleString(undefined, {maximumFractionDigits:2}) + " THB";
              }
            } catch (err) {
              return value.toFixed(2);
            }
          }
        },
        min: calculatedMinYValue,
        beginAtZero: false
      },      volumeAxis: {
        type: 'linear',
        display: false, // ปิดการแสดง Volume Axis
        position: 'right',
        grid: {
          drawOnChartArea: false,
        },
        ticks: {
          display: false
        }
      },
      y1: {
        type: 'linear',
        display: false,
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
      console.error('Error resetting zoom:', error);
    }
  };
  
  const zoomIn = () => {
    if (chartRef.current && chartRef.current.chart) {
      chartRef.current.chart.zoom(1.2);
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
              if (chartRef.current && chartRef.current.canvas) {
                chartRef.current.canvas.style.cursor = 'crosshair';
              }
            }}
            onMouseLeave={() => {
              if (chartRef.current && chartRef.current.canvas) {
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