import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { fetchGoldTH, fetchGoldUS, fetchUSDTHB, fetchPredictionsWithParams, fetchPredictionsMonth } from '@/services/apiService';
import GoldChart from '@/components/GoldChartRevised';
import { GoldCoinIcon, BarChartIcon, InfoIcon } from '@/components/icons';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { cn, formatCurrency, formatDate, calculatePercentageChange, formatPercentage } from '@/lib/utils';
import { subDays, subMonths, subYears, format as formatDateFns } from 'date-fns';
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
} from 'chart.js';
import MonthlyPredictions from '@/components/MonthlyPredictions';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const DataCategories = {
  GOLD_TH: 'Gold TH',
  GOLD_US: 'Gold US',
  USDTHB: 'USD THB'
};

const TimeFrames = {
  '7d': '7 Days',
  '1m': '1 Month',
  '1y': '1 Year',
  'all': 'All'
};

// Monthly Prediction Chart Component
const MonthlyPredictionChart = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48">
        <p className="text-amber-700 dark:text-amber-300">No chart data available</p>
      </div>
    );
  }

  const months = data.map(item => item.month_predict);
  const highValues = data.map(item => item.high);
  const lowValues = data.map(item => item.low);
  const openValues = data.map(item => item.open);

  const chartData = {
    labels: months,
    datasets: [
      {
        label: 'High',
        data: highValues,
        borderColor: 'rgb(34, 197, 94)',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        borderWidth: 2,
        tension: 0.3,
      },
      {
        label: 'Open',
        data: openValues,
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderWidth: 2,
        tension: 0.3,
      },
      {
        label: 'Low',
        data: lowValues,
        borderColor: 'rgb(239, 68, 68)',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        borderWidth: 2,
        tension: 0.3,
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: 'white',
        bodyColor: 'rgba(255, 255, 255, 0.8)',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        padding: 10,
        cornerRadius: 6,
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
    scales: {
      y: {
        beginAtZero: false,
        ticks: {
          callback: function(value) {
            return formatCurrency(value, 'THB');
          }
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.05)'
        }
      },
      x: {
        grid: {
          display: false
        }
      }
    }
  };

  return (
    <div className="h-64">
      <Line data={chartData} options={options} />
    </div>
  );
};

const Dashboard = () => {
  const [selectedCategory, setSelectedCategory] = useState(DataCategories.GOLD_TH);
  // console.log('Selected Category: >> ✅✅✅✅✅', selectedCategory);
  const [timeframe, setTimeframe] = useState('1y');
  const [goldThData, setGoldThData] = useState([]);
  const [goldUsData, setGoldUsData] = useState([]);
  const [usdthbData, setUsdthbData] = useState([]);
  const [predictData, setPredictData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [monthlyPredictions, setMonthlyPredictions] = useState([]);
  const [monthlyChartTab, setMonthlyChartTab] = useState('table');

  useEffect(() => {
    const fetchMonthlyPredictions = async () => {
      try {
        const response = await fetchPredictionsMonth();
        if (response.status === 'success') {
          setMonthlyPredictions(response.months);
        }
      } catch (error) {
        console.error('Error fetching monthly predictions:', error);
      }
    };

    fetchMonthlyPredictions();
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const today = new Date();
        let startDate = null;
        let endDate = formatDateFns(today, 'yyyy-MM-dd');

        switch (timeframe) {
          case '7d':
            startDate = formatDateFns(subDays(today, 7), 'yyyy-MM-dd');
            break;
          case '1m':
            startDate = formatDateFns(subMonths(today, 1), 'yyyy-MM-dd');
            break;
          case '1y':
            startDate = formatDateFns(subYears(today, 1), 'yyyy-MM-dd');
            break;
          default:
            startDate = null;
            endDate = null;
        }

        let dataResponse;
        if (selectedCategory === DataCategories.GOLD_TH) {
          dataResponse = await fetchGoldTH(timeframe);
        } else if (selectedCategory === DataCategories.GOLD_US) {
          dataResponse = await fetchGoldUS(timeframe);
        } else if (selectedCategory === DataCategories.USDTHB) {
          dataResponse = await fetchUSDTHB(timeframe);
        }

        const predictionsResponse = await fetchPredictionsWithParams('sort_all', 'chart', startDate, endDate);
        // const predictionsResponse = await fetchPredictionsWithParams('sort_all', 'chart', startDate, endDate, 100);

        if (dataResponse && dataResponse.data) {
          const sortedData = dataResponse.data.sort((a, b) => new Date(a.date) - new Date(b.date));
          if (selectedCategory === DataCategories.GOLD_TH) {
            setGoldThData(sortedData);
          } else if (selectedCategory === DataCategories.GOLD_US) {
            setGoldUsData(sortedData);
          } else if (selectedCategory === DataCategories.USDTHB) {
            setUsdthbData(sortedData);
          }
        } else {
          if (selectedCategory === DataCategories.GOLD_TH) {
            setGoldThData([]);
          } else if (selectedCategory === DataCategories.GOLD_US) {
            setGoldUsData([]);
          } else if (selectedCategory === DataCategories.USDTHB) {
            setUsdthbData([]);
          }
        }

        if (predictionsResponse && predictionsResponse.labels && predictionsResponse.data) {
          const predictionData = predictionsResponse.labels.map((label, index) => ({
            date: label,
            predict: predictionsResponse.data[index]
          }));
          setPredictData(predictionData);
        } else {
          setPredictData([]);
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Error loading data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [timeframe, selectedCategory]);

  const getLatestPrice = () => {
    if (loading) return null;
    let latestData;
    if (selectedCategory === DataCategories.GOLD_TH) {
      latestData = goldThData[goldThData.length - 1];
    } else if (selectedCategory === DataCategories.GOLD_US) {
      latestData = goldUsData[goldUsData.length - 1];
    } else if (selectedCategory === DataCategories.USDTHB) {
      latestData = usdthbData[usdthbData.length - 1];
    }
    return latestData?.price;
  };

  const getPreviousPrice = () => {
    if (loading) return null;
    let previousData;
    if (selectedCategory === DataCategories.GOLD_TH) {
      previousData = goldThData[goldThData.length - 2];
    } else if (selectedCategory === DataCategories.GOLD_US) {
      previousData = goldUsData[goldUsData.length - 2];
    } else if (selectedCategory === DataCategories.USDTHB) {
      previousData = usdthbData[usdthbData.length - 2];
    }
    return previousData?.price;
  };

  const getLatestDate = () => {
    if (loading) return null;
    let latestData;
    if (selectedCategory === DataCategories.GOLD_TH) {
      latestData = goldThData[goldThData.length - 1];
    } else if (selectedCategory === DataCategories.GOLD_US) {
      latestData = goldUsData[goldUsData.length - 1];
    } else if (selectedCategory === DataCategories.USDTHB) {
      latestData = usdthbData[usdthbData.length - 1];
    }
    return latestData?.date ? new Date(latestData.date) : null;
  };

  const priceChange = getPreviousPrice() !== null ? getLatestPrice() - getPreviousPrice() : null;
  const percentChange = priceChange !== null ? calculatePercentageChange(getLatestPrice(), getPreviousPrice()) : null;
  const latestDate = getLatestDate();

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4">
        <Card className="flex-1">
          <CardHeader className="pb-2">
            <CardDescription>Latest Price</CardDescription>
            <div className="flex items-center justify-between">
              <CardTitle className="text-2xl md:text-3xl">
                {loading ? (
                  <Skeleton className="h-8 w-36" />
                ) : getLatestPrice() !== null ? (
                  formatCurrency(getLatestPrice(), 'THB')
                ) : (
                  'No data'
                )}
              </CardTitle>
              <Badge 
                variant={priceChange > 0 ? "success" : priceChange < 0 ? "destructive" : "outline"}
                className={cn(
                  "ml-2 px-2 py-1",
                  loading && "invisible"
                )}
              >
                {!loading && priceChange !== null ? (
                  <span className="flex items-center">
                    {priceChange > 0 ? '▲' : priceChange < 0 ? '▼' : '•'}
                    <span className="ml-1">{formatPercentage(percentChange)}</span>
                  </span>
                ) : null}
              </Badge>
            </div>
            {latestDate && (
              <CardDescription>
                Updated: {formatDate(latestDate)}
              </CardDescription>
            )}
          </CardHeader>
        </Card>

        <Card className="flex-1">
          <CardHeader className="pb-4">
            <div className="flex justify-between items-center">
              <CardTitle>Data Type</CardTitle>
              {selectedCategory === DataCategories.GOLD_TH && predictData?.length > 0 && (
                <Badge variant="outline" className="bg-amber-500/10 text-amber-600 dark:text-amber-400 dark:bg-amber-950/20">
                  Prediction data available
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue={selectedCategory} onValueChange={setSelectedCategory} className="w-full">
              <TabsList className="w-full">
                {Object.values(DataCategories).map(category => (
                  <TabsTrigger
                    key={category}
                    value={category}
                    className="flex-1"
                    disabled={loading}
                  >
                    {category === DataCategories.GOLD_TH ? 'Gold TH' : 
                     category === DataCategories.GOLD_US ? 'Gold US' : 'USD/THB'}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Data Chart</CardTitle>
            <div className="flex gap-2">
              {Object.entries(TimeFrames).map(([key, label]) => (
                <Button
                  key={key}
                  variant={timeframe === key ? "default" : "outline"}
                  size="sm"
                  onClick={() => setTimeframe(key)}
                  disabled={loading}
                >
                  {label}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-[450px]">
            {error ? (
              <div className="flex flex-col items-center justify-center h-full">
                <InfoIcon className="h-8 w-8 text-destructive mb-2" />
                <p className="text-destructive">{error}</p>
                <Button 
                  variant="outline" 
                  className="mt-4" 
                  onClick={() => window.location.reload()}
                >
                  Try Again
                </Button>
              </div>
            ) : (
              <GoldChart
                goldThData={goldThData}
                goldUsData={goldUsData}
                usdthbData={usdthbData}
                predictData={predictData}
                selectedCategory={selectedCategory}
                timeframe={timeframe}
                loading={loading}
              />
            )}
          </div>
        </CardContent>
      </Card>

      <MonthlyPredictions
        monthlyPredictions={monthlyPredictions}
        monthlyChartTab={monthlyChartTab}
        setMonthlyChartTab={setMonthlyChartTab}
      />
    </div>
  );
};

export default Dashboard;