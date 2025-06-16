import React, { useState, useEffect, useRef, useCallback } from 'react';
import Calendar from '@/components/ui/calendar.jsx';
import { format } from 'date-fns';
import { enUS, th } from 'date-fns/locale';
import dayjs from 'dayjs';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { fetchPredictionWeekDate, fetchPredictionWeekWithSingleDate } from '@/services/apiService';
import { ThreeDot } from 'react-loading-indicators';
import { Line } from 'react-chartjs-2';
import { useTranslation } from 'react-i18next';
import { LanguageSelector } from '@/components/LanguageSelector';
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
} from 'chart.js';
import annotationPlugin from 'chartjs-plugin-annotation';
import 'chartjs-adapter-date-fns';
import { formatCurrency } from '@/lib/utils';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale,
  annotationPlugin
);

import { usePredictionErrorStats } from '../store/PredictionErrorStatsStore';

const LEGEND_KEY = 'selectprediction-legend-visibility';
const SELECTED_DATE_KEY = 'selectprediction-selected-date';

// Helper function to dispatch custom localStorage change event
const dispatchLocalStorageChange = () => {
  window.dispatchEvent(new CustomEvent('localStorageChange'));
};

const prepareChartData = (rows, legendVisibility, latestDate, t) => {
  if (!rows || rows.length === 0) return { labels: [], datasets: [] };

  const labels = rows.map(row => {
    const date = dayjs(row.date).format('YYYY-MM-DD');
    return date;
  });
  
  const datasets = [
    {
      label: t('selectPrediction.chart.predictionGoldBar'),
      data: rows.map(row => row.predict),
      borderColor: '#FFD54F',
      // borderColor: 'rgb(34, 197, 94)',
      backgroundColor: 'rgba(34, 197, 94, 0.1)',
      borderWidth: 2.5,
      tension: 0.2,
      pointRadius: 3,
      pointHoverRadius: 6,
      hidden: legendVisibility && legendVisibility['Predicted Price'] === false,
    },
    {
      label: t('selectPrediction.chart.actualGoldBar'),
      data: rows.map(row => row.actual),
      borderColor: 'rgb(34, 197, 94)',
      backgroundColor: 'rgba(59, 130, 246, 0.1)',
      borderWidth: 2,
      tension: 0.2,
      hidden: legendVisibility && legendVisibility['Actual Price'] === false,
      pointRadius: 3,
      pointHoverRadius: 6,
      pointStyle: 'circle',
    }
  ];
  
  let lastActualDate = null;
  for (let i = rows.length - 1; i >= 0; i--) {
    if (rows[i].actual !== null && rows[i].actual !== undefined) {
      lastActualDate = rows[i].date;
      break;
    }
  }

  const shouldShowAnnotation = lastActualDate && latestDate && lastActualDate === latestDate;

  return { 
    labels, 
    datasets,
    lastActualDate: shouldShowAnnotation ? lastActualDate : null
  };
};

const getChartOptions = (legendVisibility, setLegendVisibility, saveLegendVisibility, chartData, hoveredDate, updateHoveredDate, t, currentLocale) => ({
  responsive: true,
  maintainAspectRatio: false,  animation: {
    duration: 800,
    easing: 'easeOutQuart',
    animateScale: true,
    animateRotate: true
  },
  transitions: {
    show: {
      animations: {
        x: {
          from: 0
        },
        y: {
          from: 0
        }
      }
    },
    hide: {
      animations: {
        x: {
          to: 0
        },
        y: {
          to: 0
        }
      }
    }
  },
  scales: {
    x: {
      type: 'time',
      time: {
        unit: 'day',
        displayFormats: {
          day: 'dd MMM'
        },
        tooltipFormat: 'dd MMMM yyyy'
      },      adapters: {
        date: {
          locale: currentLocale
        }
      },
      grid: {
        display: false
      },
      ticks: {
        font: {
          size: 11
        }
      }
    },    y: {
      ticks: {
        callback: function(value) {
          return value.toLocaleString(undefined, {maximumFractionDigits:2}) + ' ' + t('selectPrediction.currency');
        },
        font: {
          size: 11
        }
      },
      grid: {
        color: 'rgba(0, 0, 0, 0.05)',
        borderDash: [5, 5]
      },
      beginAtZero: false
    }
  },
  plugins: {
    annotation: {
      annotations: (() => {
        if (chartData && chartData.lastActualDate) {
          return {
            lastActualLine: {
              type: 'line',
              xMin: chartData.lastActualDate,
              xMax: chartData.lastActualDate,
              borderColor: document.documentElement.classList.contains('dark') ? '#fff' : '#222',
              borderWidth: 2,
              borderDash: [6, 6],              label: {
                display: true,
                content: t('selectPrediction.chart.currentDay'),
                color: document.documentElement.classList.contains('dark') ? '#fff' : '#222',
                backgroundColor: document.documentElement.classList.contains('dark') ? 'rgba(34,34,34,0.9)' : 'rgba(255,255,255,0.9)',
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
            }
          };
        }
        return {};
      })()
    },
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
              fillStyle: hidden ? 'transparent' : dataset.borderColor,
              strokeStyle: dataset.borderColor,
              fontColor: dataset.borderColor,
              lineWidth: hidden ? 2 : 0,
              pointStyle: 'circle',
              borderRadius: 8,
              hidden: hidden,
              datasetIndex: i,
              borderWidth: hidden ? 2 : 0,
              borderColor: dataset.borderColor,
              backgroundColor: hidden ? 'transparent' : dataset.borderColor,
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
      },onClick: (e, legendItem, legend) => {
        const ci = legend.chart;
        const index = legendItem.datasetIndex;
        const meta = ci.getDatasetMeta(index);
        const currentHidden = meta.hidden === null ? ci.data.datasets[index].hidden : meta.hidden;

        meta.hidden = !currentHidden;
        ci.update();

        const label = ci.data.datasets[index].label;
        const newVis = { ...legendVisibility, [label]: !meta.hidden };
        setLegendVisibility(newVis);
        saveLegendVisibility(newVis);
      }
    },
    tooltip: {
      enabled: false,
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      titleColor: 'white',
      bodyColor: 'rgba(255, 255, 255, 0.8)',
      borderColor: 'rgba(255, 255, 255, 0.1)',
      borderWidth: 1,
      padding: 12,
      cornerRadius: 8,
      displayColors: true,
      events: ['mousemove', 'mouseenter', 'mouseout', 'click', 'touchstart', 'touchmove'],
      mode: 'index',
      intersect: false,      external: function(context) {
        if (hoveredDate) {
          const chart = context.chart;
          const datasets = chart.data.datasets;
          
          const index = chart.data.labels.findIndex(label => {
            return label === hoveredDate;
          });
          
          if (index !== -1) {
            const activeElements = [];
            
            datasets.forEach((dataset, datasetIndex) => {
              if (!dataset.hidden) {
                activeElements.push({
                  datasetIndex,
                  index
                });
              }
            });
            
            let shouldUpdate = true;
            if (chart._active && chart._active.length === activeElements.length) {
              shouldUpdate = false;
              for (let i = 0; i < chart._active.length; i++) {
                const activeElement = chart._active[i];
                if (activeElement.datasetIndex !== activeElements[i].datasetIndex || 
                    activeElement.index !== activeElements[i].index) {
                  shouldUpdate = true;
                  break;
                }
              }
            }
            
            if (shouldUpdate) {
              chart.setActiveElements(activeElements);
              chart.tooltip.setActiveElements(activeElements, {});
              chart.update('none');
            }
          }
        }
      },
      callbacks: {
        title: function(tooltipItems) {          if (tooltipItems.length > 0) {
            const dateStr = tooltipItems[0].label;
            if (dateStr) {
              const [year, month, day] = dateStr.split('-');
              if (year && month && day) {
                const date = new Date(year, month - 1, day);
                return format(date, 'd MMMM yyyy', { locale: currentLocale });
              }
            }
          }
          return tooltipItems[0].label;
        },
        label: function(context) {
          let label = context.dataset.label || '';
          if (label) {
            label += ': ';
          }          if (context.parsed && context.parsed.y !== null && context.parsed.y !== undefined) {
            try {
              label += context.parsed.y.toLocaleString(undefined, {maximumFractionDigits:2}) + ' ' + t('selectPrediction.currency');
            } catch (error) {
              label += context.parsed.y + ' ' + t('selectPrediction.currency');
            }
          }
          return label;
        }
      }
    }
  },  interaction: {
    mode: 'index',
    intersect: false,
  },  onHover: (event, chartElements, chart) => {
    requestAnimationFrame(() => {
      try {
        if (chartElements && chartElements.length > 0) {
          const element = chartElements[0];
          const index = element.index;
          
          const chartInstance = chart || (chartRef.current ? chartRef.current : null);
          
          if (chartInstance && chartInstance.data && chartInstance.data.labels && index !== undefined) {
            const date = chartInstance.data.labels[index];
            if (date !== hoveredDate) {
              updateHoveredDate(date);
            }
          }
        } else if (hoveredDate !== null) {
          updateHoveredDate(null);
        }
      } catch (error) {
        console.error("Error in chart hover handler:", error);
      }
    });
  },elements: {
    line: {
      tension: 0.2,
      spanGaps: true,
    }
  }
});

const SelectPrediction = () => {
  const { t, i18n } = useTranslation();
  const [availableDates, setAvailableDates] = useState([]);
  const [latestDate, setLatestDate] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [predictionData, setPredictionData] = useState(null);
  const [fetchingPrediction, setFetchingPrediction] = useState(false);
  const [legendVisibility, setLegendVisibility] = useState({});  const [hoveredDate, setHoveredDate] = useState(null);
  const chartRef = useRef(null);
  const hoverTimeoutRef = useRef(null);
  const tooltipTimeoutRef = useRef(null);
  
  // Get current locale for date-fns
  const currentLocale = i18n.language === 'th' ? th : enUS;
    // เพิ่ม usePredictionErrorStats hook
  const { setErrorStats, setPredictionData: storePredictionData, setSelectedDate: storeSelectedDate } = usePredictionErrorStats();
  
  const updateHoveredDate = useCallback((date) => {
    setHoveredDate(date);
    
    if (date && chartRef.current) {
      if (tooltipTimeoutRef.current) {
        clearTimeout(tooltipTimeoutRef.current);
      }
      
      tooltipTimeoutRef.current = setTimeout(() => {
        const chartObj = chartRef.current;
        if (chartObj && chartObj.setActiveElements) {
          try {
            const chartInstance = chartObj;
            const index = chartInstance.data.labels.findIndex(label => label === date);
            
            if (index !== -1) {
              const activeElements = [];
              chartInstance.data.datasets.forEach((dataset, datasetIndex) => {
                const meta = chartInstance.getDatasetMeta(datasetIndex);
                if (!meta.hidden && !dataset.hidden) {
                  activeElements.push({
                    datasetIndex,
                    index
                  });
                }
              });
              
              if (activeElements.length > 0) {
                chartObj.setActiveElements(activeElements);
                chartObj.update('none');
              }
            }
          } catch (e) {
            console.error('Error updating chart tooltip:', e);
          }
        }
      }, 20);
    }
  }, [chartRef, tooltipTimeoutRef, setHoveredDate]);
  
  useEffect(() => {
    try {
      const savedVisibility = localStorage.getItem(LEGEND_KEY);
      if (savedVisibility) {
        const parsedVisibility = JSON.parse(savedVisibility);
        setLegendVisibility(parsedVisibility);
      }
    } catch (error) {
      console.error('Error loading legend visibility settings:', error);
    }
  }, []);
  
  const saveLegendVisibility = (visibility) => {    try {
      localStorage.setItem(LEGEND_KEY, JSON.stringify(visibility));
    } catch (error) {
      console.error('Error saving legend visibility settings:', error);
    }
  };
  
  useEffect(() => {
    const loadAvailableDates = async () => {
      try {
        setIsLoading(true);
        const data = await fetchPredictionWeekDate();
        setAvailableDates(data);
        
        if (data && data.length > 0) {
          const sortedDates = [...data].sort((a, b) => {
            return new Date(b.date) - new Date(a.date);
          });
          setLatestDate(sortedDates[0].date);
        }
        
        const savedDateStr = localStorage.getItem(SELECTED_DATE_KEY);
        
        if (savedDateStr && data.some(item => item.date === savedDateStr)) {
          setSelectedDate(dayjs(savedDateStr));
        } else {
          const today = dayjs();
          const lastWeek = today.subtract(6, 'day');
          const lastWeekStr = lastWeek.format('YYYY-MM-DD');

          const lastWeekAvailable = data.some(item => item.date === lastWeekStr);
          if (lastWeekAvailable) {
            setSelectedDate(lastWeek);
          } else {
            setSelectedDate(data.length > 0 ? dayjs(data[0].date) : null);
          }
        }
      } catch (error) {
        console.error('Error loading prediction dates:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadAvailableDates();
  }, []);

  useEffect(() => {
    const fetchPredictionData = async () => {
      if (selectedDate) {
        setFetchingPrediction(true);
        setPredictionData(null);
        const formattedDate = selectedDate.format('DD-MM-YYYY');
        try {
          const data = await fetchPredictionWeekWithSingleDate(formattedDate);
          setPredictionData(data);
        } catch (error) {
          setPredictionData(null);
        } finally {
          setFetchingPrediction(false);
        }
      } else {
        setFetchingPrediction(false);
      }
    };
    fetchPredictionData();
  }, [selectedDate]);

  const isDateDisabled = (date) => {
    return !availableDates.find(availableDate => {
      const availableDay = new Date(availableDate.date);
      return (
        date.getFullYear() === availableDay.getFullYear() &&
        date.getMonth() === availableDay.getMonth() &&
        date.getDate() === availableDay.getDate()
      );
    });
  };  const handleDateSelect = (date) => {
    if (!date) return;
    setFetchingPrediction(true);
    setPredictionData(null);
    
    // เก็บวันที่ที่เลือกใน store
    storeSelectedDate(date);
    
    if (selectedDate && dayjs(date).isSame(selectedDate, 'day')) {
      setSelectedDate(null);      setTimeout(() => {
        setSelectedDate(date);
        // บันทึกวันที่ที่ผู้ใช้เลือกลงใน localStorage
        try {
          const dateStr = dayjs(date).format('YYYY-MM-DD');
          localStorage.setItem(SELECTED_DATE_KEY, dateStr);
          dispatchLocalStorageChange();
        } catch (error) {
          console.error('Error saving selected date to localStorage:', error);
        }
      }, 0);    } else {
      setSelectedDate(date);
      // บันทึกวันที่ที่ผู้ใช้เลือกลงใน localStorage
      try {
        const dateStr = dayjs(date).format('YYYY-MM-DD');
        localStorage.setItem(SELECTED_DATE_KEY, dateStr);
        dispatchLocalStorageChange();
      } catch (error) {
        console.error('Error saving selected date to localStorage:', error);
      }
    }
  };

  const handleFetchPrediction = async () => {
    if (selectedDate) {
      setFetchingPrediction(true);
      setPredictionData(null);
      const formattedDate = selectedDate.format('DD-MM-YYYY');
      try {
        const data = await fetchPredictionWeekWithSingleDate(formattedDate);
        setPredictionData(data);
      } catch (error) {
        setPredictionData(null);
      } finally {
        setFetchingPrediction(false);
      }
    }
  };
  function getPredictionRows(predictionData) {
    
    if (!predictionData || !Array.isArray(predictionData) || !predictionData[0]) {
      return [];
    }
    
    const predictDataArray = predictionData[0].predict_data;
    if (!Array.isArray(predictDataArray) || predictDataArray.length === 0) {
      return [];
    }
    
    const predict = predictDataArray[0];
    
    const actualArr = predictionData[0].actual_data || [];
    
    if (!predict) {
      return [];
    }
    
    const rows = [];
    
    const today = dayjs().format('YYYY-MM-DD');
      for (let i = 1; i <= 7; i++) {
      const dateKey = `date_${i}`;
      const priceKey = `price_${i}`;
      
      if (predict[dateKey] && predict[priceKey] !== undefined) {
        const predictDate = predict[dateKey];
        rows.push({
          date: predictDate,
          predict: predict[priceKey],
          actual: findActualPrice(predictDate, actualArr)
        });
      }
    }
    
    return rows;
  }
  function findActualPrice(dateStr, actualArr) {
    if (!dateStr) return null;
    if (!actualArr || !Array.isArray(actualArr) || actualArr.length === 0) return null;
    
    if (actualArr[0] && Array.isArray(actualArr[0])) {
      const dateFormat = dateStr.split('-');
      const searchDateFormat = `${dateFormat[2]}-${dateFormat[1]}-${dateFormat[0].substring(2)}`;
      
      const foundEntry = actualArr.find(entry => {
        const dateObj = entry.find(item => item.label === "Date");
        return dateObj && dateObj.data === searchDateFormat;
      });
      
      if (foundEntry) {
        const priceObj = foundEntry.find(item => item.label === "Price");
        return priceObj ? priceObj.data : null;
      }
      return null;
    } 
    else {
      const d = dayjs(dateStr).format('DD-MM-YY');
      const found = actualArr.find(a => a.date === d);
      return found ? found.price : null;    }
  }
  useEffect(() => {
    if (chartRef.current && hoveredDate) {
      tooltipTimeoutRef.current = setTimeout(() => {
        updateHoveredDate(hoveredDate);
      }, 100);
    }
    
    return () => {
      if (tooltipTimeoutRef.current) {
        clearTimeout(tooltipTimeoutRef.current);
      }
    };
  }, [chartRef, hoveredDate, tooltipTimeoutRef, updateHoveredDate]);
  
  useEffect(() => {
    if (predictionData) {
      // เมื่อได้รับข้อมูล prediction ให้อัปเดตข้อมูลไปยัง store
      const rows = Array.isArray(predictionData) && predictionData[0] && predictionData[0].predict_data 
        ? getPredictionRows(predictionData)
        : [];
        // คำนวณค่าความแม่นยำจากข้อมูล prediction
      if (rows.length > 0) {
        const accuracyPercentages = rows
          .filter(row => row.actual !== null && row.predict !== null)
          .map(row => {
            const actualValue = parseFloat(row.actual);
            const predictValue = parseFloat(row.predict);
            if (isNaN(actualValue) || isNaN(predictValue) || actualValue === 0) return null;
            // คำนวณความแม่นยำ (100% - ค่าความผิดพลาด)
            return 100 - (Math.abs((predictValue - actualValue) / actualValue) * 100);
          })
          .filter(accuracy => accuracy !== null);
          
        if (accuracyPercentages.length > 0) {
          const average = accuracyPercentages.reduce((sum, accuracy) => sum + accuracy, 0) / accuracyPercentages.length;
          const high = Math.max(...accuracyPercentages);
          const low = Math.min(...accuracyPercentages);
          
          // อัปเดตข้อมูลไปยัง store
          setErrorStats({
            average: parseFloat(average.toFixed(2)),
            high: parseFloat(high.toFixed(2)),
            low: parseFloat(low.toFixed(2)),
            date: new Date()
          });
          
          // อัปเดตข้อมูล rows ไปยัง store
          storePredictionData(rows);
        }
      }
    }
  }, [predictionData, setErrorStats, storePredictionData]);
  
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[300px]">
        <ThreeDot color={["#32cd32", "#327fcd", "#cd32cd", "#cd8032"]} />
      </div>
    );
  }
    const rows = Array.isArray(predictionData) && predictionData[0] && predictionData[0].predict_data 
    ? getPredictionRows(predictionData)
    : [];
  
  const chartData = prepareChartData(rows, legendVisibility, latestDate, t);
    return (
    <Card className="w-full mb-6 overflow-hidden border-amber-200/20 dark:border-amber-800/20">      {/* <CardHeader className="border-b bg-gradient-to-r from-amber-50 to-amber-100/30 dark:from-amber-950/30 dark:to-amber-900/10">
        <div className="flex flex-row items-center justify-between">
          <div className="flex items-center space-x-2">
            <CardTitle>{t('selectPrediction.title')}</CardTitle>
          </div>
          <div className="flex items-center">
            <Badge 
              variant="outline" 
              className="bg-amber-500/10 text-amber-600 dark:text-amber-400 dark:bg-amber-950/20"
            >
              {t('selectPrediction.forecast')}
            </Badge>
          </div>
        </div>
      </CardHeader> */}
      <CardContent className="pt-6 pb-4">
        <div className="flex flex-col md:flex-row gap-6">
          <div className="md:w-3/6 flex-none">
            <Card className="h-full shadow-sm border-0 bg-card/50 backdrop-blur-sm hover:shadow-md transition-all">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-center">                  <CardTitle className="text-base font-medium flex items-center">
                    {t('selectPrediction.predictionChart')}
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-4">
                {(fetchingPrediction || predictionData === null) ? (
                  <div className="flex flex-col items-center justify-center h-[420px]">
                    <ThreeDot color={["#32cd32", "#327fcd", "#cd32cd", "#cd8032"]} />
                  </div>                ) : rows.length > 0 ? (
                  <div className="h-[420px]">                    <Line 
                      ref={chartRef}
                      data={chartData} 
                      options={getChartOptions(legendVisibility, setLegendVisibility, saveLegendVisibility, chartData, hoveredDate, updateHoveredDate, t, currentLocale)} 
                    />
                  </div>
                ) :(
                  <div className="flex justify-center items-center h-[420px] text-muted-foreground">
                    <div className="text-center">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mx-auto mb-2 text-muted">
                        <circle cx="12" cy="12" r="10"></circle>
                        <path d="M12 8v4"></path>
                        <path d="M12 16h.01"></path>
                      </svg>
                      <p>{t('selectPrediction.noChartData')}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          <div className="md:w-3/6 flex-none">
            <Card className="h-full shadow-sm border-0 bg-card/50 backdrop-blur-sm hover:shadow-md transition-all">              <CardHeader className="pb-2">
                <div className="flex justify-between items-center">                  <CardTitle className="text-base font-medium">
                    {t('selectPrediction.priceData')}
                  </CardTitle>
                  <div className="flex justify-end">
                    <Calendar 
                      value={selectedDate} 
                      onChange={handleDateSelect} 
                      disabled={isDateDisabled}
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4 overflow-y-auto">{(fetchingPrediction || predictionData === null) ? (
                  <div className="flex flex-col items-center justify-center h-[420px]">
                    <ThreeDot color={["#32cd32", "#327fcd", "#cd32cd", "#cd8032"]} />
                  </div>
                ) : (Array.isArray(predictionData) && predictionData[0] && predictionData[0].predict_data) ? (
                  <div className="max-h-[420px] overflow-y-auto overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>                        <tr className="bg-gradient-to-r from-amber-50 to-amber-100/30 dark:from-amber-950/30 dark:to-amber-900/10">
                          <th className="px-6 py-3 text-center text-xs font-semibold text-amber-800 dark:text-amber-300 uppercase tracking-wider border-b border-amber-200/30 dark:border-amber-800/20">
                            {t('selectPrediction.table.date')}
                          </th>
                          <th className="px-6 py-3 text-center text-xs font-semibold text-amber-800 dark:text-amber-300 uppercase tracking-wider border-b border-amber-200/30 dark:border-amber-800/20">
                            {t('selectPrediction.table.predictionGold')}
                          </th>
                          <th className="px-6 py-3 text-center text-xs font-semibold text-amber-800 dark:text-amber-300 uppercase tracking-wider border-b border-amber-200/30 dark:border-amber-800/20">
                            {t('selectPrediction.table.actualGold')}
                          </th>
                          <th className="px-6 py-3 text-center text-xs font-semibold text-amber-800 dark:text-amber-300 uppercase tracking-wider border-b border-amber-200/30 dark:border-amber-800/20">
                            {t('selectPrediction.table.accuracy')}
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-amber-100/50 dark:divide-amber-900/30">
                        {[...rows].sort((a, b) => {
                          return new Date(b.date) - new Date(a.date);
                        }).map((row, idx) => (
                          <tr
                            key={idx} 
                            className={`transition-colors hover:bg-amber-100/70 dark:hover:bg-amber-800/40 ${hoveredDate === row.date ? 'bg-amber-100/70 dark:bg-amber-800/40' : ''}`}
                            onMouseEnter={() => {
                              if (hoverTimeoutRef.current) {
                                clearTimeout(hoverTimeoutRef.current);
                              }
                              hoverTimeoutRef.current = setTimeout(() => {
                                setHoveredDate(row.date);
                                
                                if (chartRef.current) {
                                  const chart = chartRef.current;
                                  const index = chart.data.labels.findIndex(label => label === row.date);
                                  
                                  if (index !== -1) {
                                    const activeElements = [];
                                    chart.data.datasets.forEach((dataset, datasetIndex) => {
                                      const meta = chart.getDatasetMeta(datasetIndex);
                                      if (!meta.hidden && !dataset.hidden) {
                                        activeElements.push({
                                          datasetIndex,
                                          index
                                        });
                                      }
                                    });
                                    
                                    if (activeElements.length > 0) {
                                      chart.setActiveElements(activeElements);
                                      chart.tooltip.setActiveElements(activeElements, {});
                                      chart.update('none');
                                    }
                                  }
                                }
                              }, 50);
                            }}
                            onMouseLeave={() => {
                              if (hoverTimeoutRef.current) {
                                clearTimeout(hoverTimeoutRef.current);
                              }
                              hoverTimeoutRef.current = setTimeout(() => {
                                setHoveredDate(null);
                                
                                if (chartRef.current) {
                                  chartRef.current.setActiveElements([]);
                                  chartRef.current.update('none');
                                }
                              }, 50);
                            }}
                          >
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-amber-900 dark:text-amber-100 text-center">
                              {dayjs(row.date).format('DD-MM-YYYY')}
                            </td>                            <td className="px-6 py-4 whitespace-nowrap text-sm text-center font-medium" style={{ color: '#FFD54F' }}>
                              <span className="font-mono">{row.predict ? `${row.predict.toLocaleString(undefined, {maximumFractionDigits:2})} ${t('selectPrediction.currency')}` : '-'}</span>
                            </td>                            <td className="px-6 py-4 whitespace-nowrap text-sm text-center font-medium" style={{ color: '#22C55E' }}>
                              <span className="font-mono">{row.actual ? `${row.actual.toLocaleString(undefined, {maximumFractionDigits:2})} ${t('selectPrediction.currency')}` : '-'}</span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-center font-medium text-black dark:text-white">
                              {row.actual && row.predict ? 
                                <span className="font-mono">
                                  {(100 - ((Math.abs(row.actual - row.predict) / row.actual) * 100)).toFixed(2)} %
                                </span> : 
                                '-'
                              }
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center text-muted-foreground h-[420px] flex items-center justify-center">
                    <div className="text-center">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mx-auto mb-2 text-muted">
                        <circle cx="12" cy="12" r="10"></circle>
                        <path d="M12 8v4"></path>
                        <path d="M12 16h.01"></path>
                      </svg>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SelectPrediction;
