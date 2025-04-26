import React, { useState, useEffect } from 'react';
import Calendar from '@/components/ui/calendar.jsx';
import { format } from 'date-fns';
import { enUS } from 'date-fns/locale';
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
  TimeScale
);

const LEGEND_KEY = 'selectprediction-legend-visibility';

const prepareChartData = (rows, legendVisibility) => {
  if (!rows || rows.length === 0) return { labels: [], datasets: [] };

  const labels = rows.map(row => {
    // แปลงรูปแบบวันที่เป็น ISO format เพื่อให้ chart.js จัดการได้อย่างถูกต้อง
    const date = dayjs(row.date).format('YYYY-MM-DD');
    return date;
  });
  
  const datasets = [
    {
      label: 'Predicted Price',
      data: rows.map(row => row.predict),
      borderColor: 'rgb(34, 197, 94)',
      backgroundColor: 'rgba(34, 197, 94, 0.1)',
      borderWidth: 2.5,
      tension: 0.2,
      pointRadius: 3,
      pointHoverRadius: 6,
      hidden: legendVisibility && legendVisibility['Predicted Price'] === false,
    },
    {
      label: 'Actual Price',
      data: rows.map(row => row.actual),
      borderColor: '#3b82f6',
      backgroundColor: 'rgba(59, 130, 246, 0.1)',
      borderWidth: 2,
      tension: 0.2,
      hidden: legendVisibility && legendVisibility['Actual Price'] === false,
      pointRadius: 3,
      pointHoverRadius: 6,
      pointStyle: 'circle',
    }
  ];

  return { labels, datasets };
};

const getChartOptions = (legendVisibility, setLegendVisibility, saveLegendVisibility) => ({
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
  },  scales: {
    x: {
      type: 'time',
      time: {
        unit: 'day',
        displayFormats: {
          day: 'dd MMM'
        },
        tooltipFormat: 'dd MMMM yyyy'
      },
      adapters: {
        date: {
          locale: enUS
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
          return value.toLocaleString(undefined, {maximumFractionDigits:2}) + ' THB';
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
  },  plugins: {
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
      },      onClick: (e, legendItem, legend) => {
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
    },    tooltip: {
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      titleColor: 'white',
      bodyColor: 'rgba(255, 255, 255, 0.8)',
      borderColor: 'rgba(255, 255, 255, 0.1)',
      borderWidth: 1,
      padding: 12,
      cornerRadius: 8,
      displayColors: true,
      callbacks: {
        title: function(tooltipItems) {
          // แปลง format จาก YYYY-MM-DD เป็น DD MMMM YYYY
          if (tooltipItems.length > 0) {
            const dateStr = tooltipItems[0].label;
            if (dateStr) {
              const [year, month, day] = dateStr.split('-');
              if (year && month && day) {
                const date = new Date(year, month - 1, day);
                return date.getDate() + ' ' + date.toLocaleString('en-US', { month: 'long' }) + ' ' + date.getFullYear();
              }
            }
          }
          return tooltipItems[0].label;
        },        label: function(context) {
          let label = context.dataset.label || '';
          if (label) {
            label += ': ';
          }
          if (context.parsed.y !== null) {
            // แสดงราคาพร้อมกับสกุลเงิน THB ต่อท้ายตัวเลข
            label += context.parsed.y.toLocaleString(undefined, {maximumFractionDigits:2}) + ' THB';
          }
          return label;
        }
      }
    }
  },
  interaction: {
    mode: 'index',
    intersect: false,
  },  elements: {
    line: {
      tension: 0.2,
      spanGaps: true,
    }
  }
});

const SelectPrediction = () => {
  const [availableDates, setAvailableDates] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [predictionData, setPredictionData] = useState(null);
  const [fetchingPrediction, setFetchingPrediction] = useState(false);
  const [legendVisibility, setLegendVisibility] = useState({});  useEffect(() => {
    try {
      const savedVisibility = localStorage.getItem(LEGEND_KEY);
      if (savedVisibility) {
        const parsedVisibility = JSON.parse(savedVisibility);
        setLegendVisibility(parsedVisibility);
      }
    } catch (error) {
      console.error('Error loading legend visibility settings:', error);
    }
  }, []);  const saveLegendVisibility = (visibility) => {
    try {
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
        const today = dayjs();
        const lastWeek = today.subtract(9, 'day');
        const lastWeekStr = lastWeek.format('YYYY-MM-DD');

        const lastWeekAvailable = data.some(item => item.date === lastWeekStr);
        if (lastWeekAvailable) {
          setSelectedDate(lastWeek);
        } else {
          setSelectedDate(data.length > 0 ? dayjs(data[0].date) : null);
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
  };

  const handleDateSelect = (date) => {
    if (!date) return;
    setFetchingPrediction(true);
    setPredictionData(null);
    if (selectedDate && dayjs(date).isSame(selectedDate, 'day')) {
      setSelectedDate(null);
      setTimeout(() => {
        setSelectedDate(date);
      }, 0);
    } else {
      setSelectedDate(date);
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
        
        if (predictDate === today) {
          continue;
        }
        
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
      return found ? found.price : null;
    }
  }
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
  const chartData = prepareChartData(rows, legendVisibility);return (
    <Card className="w-full mb-6 shadow-md bg-card/90 backdrop-blur-sm">
      <CardHeader className="pb-0">
        <div className="flex flex-row items-center justify-between">
          <div className="flex items-center space-x-2">
            <CardTitle className="text-2xl font-bold">Select Prediction By Date</CardTitle>
          </div>
          <div className="w-60 ml-auto">
            <Card className="shadow-lg border border-amber-200/30 dark:border-amber-700/20 bg-gradient-to-b from-amber-50/80 to-background/95 dark:from-amber-950/10 dark:to-background/95 hover:shadow-amber-200/10 dark:hover:shadow-amber-700/5 transition-all duration-300 rounded-xl overflow-hidden">
              <CardContent className="p-3 flex flex-col items-end space-y-2">
                <Calendar 
                  value={selectedDate} 
                  onChange={handleDateSelect} 
                  className="w-full"
                  disabled={isDateDisabled}
                />
                <Badge 
                  variant="outline" 
                  className="bg-amber-500/10 text-amber-600 dark:text-amber-400 dark:bg-amber-950/20 ml-auto"
                >
                  Forecast
                </Badge>
              </CardContent>
            </Card>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-6 pb-4">
        <div className="flex flex-col md:flex-row gap-6">
          <div className="md:w-3/5 flex-none">
            <Card className="h-full shadow-sm border-0 bg-card/50 backdrop-blur-sm hover:shadow-md transition-all">
              <CardContent className="p-4">
                {(fetchingPrediction || predictionData === null) ? (
                  <div className="flex flex-col items-center justify-center h-[420px]">
                    <ThreeDot color={["#32cd32", "#327fcd", "#cd32cd", "#cd8032"]} />
                  </div>
                ) : rows.length > 0 ? (
                  <div className="h-[420px]">
                    <Line data={chartData} options={getChartOptions(legendVisibility, setLegendVisibility, saveLegendVisibility)} />
                  </div>
                ) :(
                  <div className="flex justify-center items-center h-[420px] text-muted-foreground">
                    <div className="text-center">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mx-auto mb-2 text-muted">
                        <circle cx="12" cy="12" r="10"></circle>
                        <path d="M12 8v4"></path>
                        <path d="M12 16h.01"></path>
                      </svg>
                      <p>No chart data available</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="md:w-2/5 flex-none">
            <Card className="h-full shadow-sm border-0 bg-card/50 backdrop-blur-sm hover:shadow-md transition-all">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                  {/* <CardTitle className="text-base font-medium flex items-center">
                    Price Data
                  </CardTitle> */}
                </div>
              </CardHeader>
              <CardContent className="p-4 overflow-y-auto">                {(fetchingPrediction || predictionData === null) ? (
                  <div className="flex flex-col items-center justify-center h-[420px]">
                    <ThreeDot color={["#32cd32", "#327fcd", "#cd32cd", "#cd8032"]} />
                  </div>
                ) : (Array.isArray(predictionData) && predictionData[0] && predictionData[0].predict_data) ? (                  <div className="max-h-[420px] overflow-y-auto overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="bg-gradient-to-r from-amber-50 to-amber-100/30 dark:from-amber-950/30 dark:to-amber-900/10">                          <th className="px-6 py-3 text-center text-xs font-semibold text-amber-800 dark:text-amber-300 uppercase tracking-wider border-b border-amber-200/30 dark:border-amber-800/20">
                            Date
                          </th>
                          <th className="px-6 py-3 text-center text-xs font-semibold text-amber-800 dark:text-amber-300 uppercase tracking-wider border-b border-amber-200/30 dark:border-amber-800/20">
                            Predicted
                          </th>
                          <th className="px-6 py-3 text-center text-xs font-semibold text-amber-800 dark:text-amber-300 uppercase tracking-wider border-b border-amber-200/30 dark:border-amber-800/20">
                            Actual
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-amber-100/50 dark:divide-amber-900/30">
                        {rows.map((row, idx) => (
                          <tr 
                            key={idx} 
                            className="transition-colors hover:bg-amber-50/50 dark:hover:bg-amber-950/20"
                          >                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-amber-900 dark:text-amber-100 text-center">
                              {dayjs(row.date).format('DD-MM-YYYY')}
                            </td><td className="px-6 py-4 whitespace-nowrap text-sm text-center text-emerald-600 dark:text-emerald-400 font-medium">
                              <span className="font-mono">{row.predict ? `${row.predict.toLocaleString(undefined, {maximumFractionDigits:2})} THB` : '-'}</span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-blue-600 dark:text-blue-400 font-medium">
                              <span className="font-mono">{row.actual ? `${row.actual.toLocaleString(undefined, {maximumFractionDigits:2})} THB` : '-'}</span>
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
                      <p>No prediction data available</p>
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
