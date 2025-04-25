import React, { useState, useEffect } from 'react';
import Calendar from '@/components/ui/calendar.jsx';
import { format } from 'date-fns';
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
import { CircularProgress } from '@mui/material';
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

const prepareChartData = (rows) => {
  if (!rows || rows.length === 0) return { labels: [], datasets: [] };

  const labels = rows.map(row => row.date);
  
  const datasets = [
    {
      label: 'Predicted Price',
      data: rows.map(row => row.predict),
      borderColor: 'rgb(34, 197, 94)', // Green color matching GoldChartRevised
      backgroundColor: 'rgba(34, 197, 94, 0.1)',
      borderWidth: 2.5,
      tension: 0.2,
      pointRadius: 3,
      pointHoverRadius: 6,
    },
    {
      label: 'Actual Price',
      data: rows.map(row => row.actual),
      borderColor: '#3b82f6', // Blue color matching GoldChartRevised
      backgroundColor: 'rgba(59, 130, 246, 0.1)',
      borderWidth: 2,
      tension: 0.2,
      pointRadius: 3,
      pointHoverRadius: 6,
      pointStyle: 'circle',
    }
  ];

  return { labels, datasets };
};

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  animation: {
    duration: 1000,
    easing: 'easeInOutQuad'
  },
  scales: {
    x: {
      grid: {
        display: false
      },
      ticks: {
        font: {
          size: 11
        }
      }
    },
    y: {
      ticks: {
        callback: function(value) {
          return formatCurrency(value, 'THB');
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
        label: function(context) {
          let label = context.dataset.label || '';
          if (label) {
            label += ': ';
          }
          if (context.parsed.y !== null) {
            label += formatCurrency(context.parsed.y, 'THB');
          }
          return label;
        }
      }
    }
  },
  interaction: {
    mode: 'index',
    intersect: false,
  },
  elements: {
    line: {
      tension: 0.2,
      spanGaps: true,
    }
  },
};

const SelectPrediction = () => {
  const [availableDates, setAvailableDates] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [predictionData, setPredictionData] = useState(null);
  const [fetchingPrediction, setFetchingPrediction] = useState(false);

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
    console.log('[SelectPrediction] useEffect selectedDate', selectedDate);
    const fetchPredictionData = async () => {
      if (selectedDate) {
        setFetchingPrediction(true);
        setPredictionData(null);
        const formattedDate = selectedDate.format('DD-MM-YYYY');
        try {
          console.log('[SelectPrediction] Fetching prediction data for date:', formattedDate);
          const data = await fetchPredictionWeekWithSingleDate(formattedDate);
          console.log('[SelectPrediction] Prediction data structure:', 
            data && data[0] ? {
              hasPredict: !!data[0].predict_data,
              predictLength: data[0].predict_data?.length,
              samplePredict: data[0].predict_data?.[0],
              hasActual: !!data[0].actual_data,
              actualLength: data[0].actual_data?.length,
            } : 'No data'
          );
          setPredictionData(data);
          console.log('[SelectPrediction] Prediction data:', data);
        } catch (error) {
          setPredictionData(null);
          console.error('[SelectPrediction] Error fetching prediction data:', error);
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
    console.log('[SelectPrediction] handleDateSelect', { date, selectedDate });
    if (!date) return;
    setFetchingPrediction(true);
    setPredictionData(null);
    if (selectedDate && dayjs(date).isSame(selectedDate, 'day')) {
      setSelectedDate(null);
      setTimeout(() => {
        console.log('[SelectPrediction] setSelectedDate (force)', date);
        setSelectedDate(date);
      }, 0);
    } else {
      console.log('[SelectPrediction] setSelectedDate', date);
      setSelectedDate(date);
    }
  };

  const handleFetchPrediction = async () => {
    if (selectedDate) {
      setFetchingPrediction(true);
      setPredictionData(null);
      const formattedDate = selectedDate.format('DD-MM-YYYY');
      try {
        console.log('[SelectPrediction] [Refresh] Fetching prediction data for date:', formattedDate);
        const data = await fetchPredictionWeekWithSingleDate(formattedDate);
        setPredictionData(data);
        console.log('[SelectPrediction] [Refresh] Prediction data:', data);
      } catch (error) {
        setPredictionData(null);
        console.error('[SelectPrediction] [Refresh] Error fetching prediction data:', error);
      } finally {
        setFetchingPrediction(false);
      }
    }
  };
  function getPredictionRows(predictionData) {
    console.log('[Table] getPredictionRows input:', predictionData);
    
    if (!predictionData || !Array.isArray(predictionData) || !predictionData[0]) {
      console.log('[Table] No prediction data found');
      return [];
    }
    
    const predictDataArray = predictionData[0].predict_data;
    if (!Array.isArray(predictDataArray) || predictDataArray.length === 0) {
      console.log('[Table] No predict_data array found');
      return [];
    }
    
    const predict = predictDataArray[0];
    console.log('[Table] Using predict data:', predict);
    
    const actualArr = predictionData[0].actual_data || [];
    console.log('[Table] Actual data:', actualArr);
    
    if (!predict) {
      console.log('[Table] No valid prediction object found');
      return [];
    }
    
    const rows = [];
    
    const today = dayjs().format('YYYY-MM-DD');
    console.log('[Table] Current date:', today);
    
    for (let i = 1; i <= 7; i++) {
      const dateKey = `date_${i}`;
      const priceKey = `price_${i}`;
      
      if (predict[dateKey] && predict[priceKey] !== undefined) {
        const predictDate = predict[dateKey];
        
        if (predictDate === today) {
          console.log('[Table] Skipping current day:', today);
          continue;
        }
        
        rows.push({
          date: predictDate,
          predict: predict[priceKey],
          actual: findActualPrice(predictDate, actualArr)
        });
      }
    }
    
    console.log('[Table] Generated future-only rows:', rows);
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
    return <div className="flex justify-center items-center min-h-[300px]"><CircularProgress /></div>;
  }

  const rows = Array.isArray(predictionData) && predictionData[0] && predictionData[0].predict_data 
    ? getPredictionRows(predictionData)
    : [];
  const chartData = prepareChartData(rows);  return (
    <Card className="w-full mb-6 shadow-md bg-card/90 backdrop-blur-sm">
      <CardHeader className="pb-0">
        <div className="flex flex-row items-center justify-between">
          <div className="flex items-center space-x-2">
            <CardTitle className="text-2xl font-bold">Select Prediction By Date</CardTitle>
          </div>
          <div className="w-60">
            <Card className="shadow-lg border border-amber-200/30 dark:border-amber-700/20 bg-gradient-to-b from-amber-50/80 to-background/95 dark:from-amber-950/10 dark:to-background/95 hover:shadow-amber-200/10 dark:hover:shadow-amber-700/5 transition-all duration-300 rounded-xl overflow-hidden">
              <CardContent className="p-3">
                <Calendar 
                  value={selectedDate} 
                  onChange={handleDateSelect} 
                  className="w-full" 
                  disabled={isDateDisabled}
                  classNames={{
                    container: "space-y-2",
                    caption: "flex justify-center pt-1 relative items-center",
                    caption_label: "text-sm font-medium",
                    nav: "space-x-1 flex items-center",
                    nav_button: "h-7 w-7 bg-transparent hover:bg-muted rounded-full transition-colors flex items-center justify-center",
                    nav_button_previous: "absolute left-1",
                    nav_button_next: "absolute right-1",
                    table: "w-full border-collapse space-y-1",
                    head_row: "flex mb-1",
                    head_cell: "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
                    row: "flex w-full mt-1",
                    cell: "text-center text-sm relative p-0 rounded-md focus-within:relative focus-within:z-20",
                    day: "h-9 w-9 p-0 font-normal aria-selected:opacity-100 hover:bg-accent/50 rounded-full transition-colors",
                    day_selected: "bg-primary text-primary-foreground hover:bg-primary/90 focus:bg-primary hover:text-primary-foreground focus:text-primary-foreground",
                    day_today: "bg-accent text-accent-foreground",
                    day_disabled: "text-muted-foreground/60 opacity-40",
                    day_outside: "text-muted-foreground/60 opacity-40",
                    day_range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
                    day_hidden: "invisible",
                  }}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-6 pb-4">
        <div className="flex flex-col md:flex-row gap-6">
          <div className="md:w-3/5 flex-none">
            <Card className="h-full shadow-sm border-0 bg-card/50 backdrop-blur-sm hover:shadow-md transition-all">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-base font-medium flex items-center">
                    Prediction Chart
                  </CardTitle>
                  <Badge variant="outline" className="bg-amber-500/10 text-amber-600 dark:text-amber-400 dark:bg-amber-950/20">
                    Forecast
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-4">
                {(fetchingPrediction || predictionData === null) ? (
                  <div className="flex justify-center items-center h-[420px]">
                    <CircularProgress size={40} style={{color: '#f59e0b'}} />
                  </div>
                ) : rows.length > 0 ? (
                  <div className="h-[420px]">
                    <Line data={chartData} options={chartOptions} />
                  </div>
                ) : (
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
                  <CardTitle className="text-base font-medium flex items-center">
                    Price Data
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-4 overflow-y-auto">
                {(fetchingPrediction || predictionData === null) ? (
                  <div className="flex justify-center items-center h-[420px]">
                    <CircularProgress size={40} style={{color: '#f59e0b'}} />
                  </div>
                ) : (Array.isArray(predictionData) && predictionData[0] && predictionData[0].predict_data) ? (
                  <div className="max-h-[420px] overflow-y-auto">
                    <Table>
                      <TableHeader className="sticky top-0 bg-card shadow-sm z-10">
                        <TableRow className="border-b border-muted/50">
                          <TableHead className="font-semibold text-muted-foreground">Date</TableHead>
                          <TableHead className="font-semibold text-muted-foreground">Predicted (THB)</TableHead>
                          <TableHead className="font-semibold text-muted-foreground">Actual (THB)</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {rows.map((row, idx) => (
                          <TableRow key={idx} className="hover:bg-amber-50/10 dark:hover:bg-amber-950/20 transition-colors">
                            <TableCell className="font-medium">{row.date}</TableCell>
                            <TableCell className="text-emerald-600 dark:text-emerald-400 font-medium">{row.predict ? row.predict.toLocaleString(undefined, {maximumFractionDigits:2}) : '-'}</TableCell>
                            <TableCell className="text-blue-600 dark:text-blue-400 font-medium">{row.actual ? row.actual.toLocaleString(undefined, {maximumFractionDigits:2}) : '-'}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
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
