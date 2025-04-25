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
      borderColor: 'rgb(53, 162, 235)',
      backgroundColor: 'rgba(53, 162, 235, 0.5)',
      borderWidth: 2,
      tension: 0.3,
      pointRadius: 3,
    },
    {
      label: 'Actual Price',
      data: rows.map(row => row.actual),
      borderColor: 'rgb(255, 99, 132)',
      backgroundColor: 'rgba(255, 99, 132, 0.5)',
      borderWidth: 2,
      tension: 0.3,
      pointRadius: 3,
      pointStyle: 'rectRot',
    }
  ];

  return { labels, datasets };
};

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  scales: {
    x: {
      grid: {
        display: false
      }
    },
    y: {
      ticks: {
        callback: function(value) {
          return formatCurrency(value, 'THB');
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
        boxWidth: 15,
        usePointStyle: true
      }
    },
    tooltip: {
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
};

const DemoCalendar = () => {
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
    console.log('[Calendar] useEffect selectedDate', selectedDate);
    const fetchPredictionData = async () => {
      if (selectedDate) {
        setFetchingPrediction(true);
        setPredictionData(null);
        const formattedDate = selectedDate.format('DD-MM-YYYY');
        try {
          console.log('[Calendar] Fetching prediction data for date:', formattedDate);
          const data = await fetchPredictionWeekWithSingleDate(formattedDate);
          console.log('[Calendar] Prediction data structure:', 
            data && data[0] ? {
              hasPredict: !!data[0].predict_data,
              predictLength: data[0].predict_data?.length,
              samplePredict: data[0].predict_data?.[0],
              hasActual: !!data[0].actual_data,
              actualLength: data[0].actual_data?.length,
            } : 'No data'
          );
          setPredictionData(data);
          console.log('[Calendar] Prediction data:', data);
        } catch (error) {
          setPredictionData(null);
          console.error('[Calendar] Error fetching prediction data:', error);
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
    console.log('[Calendar] handleDateSelect', { date, selectedDate });
    if (!date) return;
    setFetchingPrediction(true);
    setPredictionData(null);
    if (selectedDate && dayjs(date).isSame(selectedDate, 'day')) {
      setSelectedDate(null);
      setTimeout(() => {
        console.log('[Calendar] setSelectedDate (force)', date);
        setSelectedDate(date);
      }, 0);
    } else {
      console.log('[Calendar] setSelectedDate', date);
      setSelectedDate(date);
    }
  };

  const handleFetchPrediction = async () => {
    if (selectedDate) {
      setFetchingPrediction(true);
      setPredictionData(null);
      const formattedDate = selectedDate.format('DD-MM-YYYY');
      try {
        console.log('[Calendar] [Refresh] Fetching prediction data for date:', formattedDate);
        const data = await fetchPredictionWeekWithSingleDate(formattedDate);
        setPredictionData(data);
        console.log('[Calendar] [Refresh] Prediction data:', data);
      } catch (error) {
        setPredictionData(null);
        console.error('[Calendar] [Refresh] Error fetching prediction data:', error);
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
    return <div className="container mx-auto p-4 flex justify-center items-center min-h-[300px]"><CircularProgress /></div>;
  }

  const rows = Array.isArray(predictionData) && predictionData[0] && predictionData[0].predict_data 
    ? getPredictionRows(predictionData)
    : [];
  const chartData = prepareChartData(rows);
  
  return (
    <Card className="container mx-auto p-4">
        <div className="flex flex-row items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Select Prediction By Date</h1>
        <div className="w-64">
            <Card className="shadow-sm">
                <CardContent className="p-2">
                    <Calendar 
                        value={selectedDate} 
                        onChange={handleDateSelect} 
                        className="w-full" 
                    />
                </CardContent>
            </Card>
        </div>
      </div>
      
      <div className="flex flex-col md:flex-row gap-6 mb-6">
        <div className="md:w-3/5 flex-1">
          <Card className="mb-6 flex flex-col h-full shadow-md">
            <CardHeader className="pb-0">
                <CardTitle>Gold Price Prediction Chart</CardTitle>
            </CardHeader>
            <CardContent className="flex-grow">
              {(fetchingPrediction || predictionData === null) ? (
                <div className="flex justify-center items-center h-[400px]">
                  <CircularProgress />
                </div>
              ) : rows.length > 0 ? (
                <div className="h-[400px]">
                  <Line data={chartData} options={chartOptions} />
                </div>
              ) : (
                <div className="flex justify-center items-center h-[400px] text-gray-400">
                    No chart data available
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="md:w-2/5 flex-1">
          <Card className="h-full flex flex-col shadow-md">
            <CardHeader className="pb-0">
              <CardTitle>Prediction Data Table</CardTitle>
            </CardHeader>
            <CardContent className="flex-grow overflow-y-auto">
              {(fetchingPrediction || predictionData === null) ? (
                <div className="flex justify-center items-center h-full">
                  <CircularProgress />
                </div>
              ) : (Array.isArray(predictionData) && predictionData[0] && predictionData[0].predict_data) ? (
                <>
                  <Table>
                    <TableHeader className="sticky top-0 bg-white shadow-sm z-10">
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Predict Price (THB)</TableHead>
                        <TableHead>Actual Price (THB)</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rows.map((row, idx) => (
                        <TableRow key={idx}>
                          <TableCell className="font-medium">{row.date}</TableCell>
                          <TableCell>{row.predict ? row.predict.toLocaleString(undefined, {maximumFractionDigits:2}) : '-'}</TableCell>
                          <TableCell>{row.actual ? row.actual.toLocaleString(undefined, {maximumFractionDigits:2}) : '-'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </>
              ) : (
                <div className="text-center text-gray-400 h-full flex items-center justify-center">
                  No prediction data
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      </Card>
    );
};

export default DemoCalendar;