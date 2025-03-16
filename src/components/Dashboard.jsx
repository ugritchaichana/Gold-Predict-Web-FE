import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { fetchGoldTH, fetchPredictionsWithParams } from '@/services/apiService';
import GoldChart from '@/components/GoldChartRevised';
import { GoldCoinIcon, BarChartIcon, InfoIcon } from '@/components/icons';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { cn, formatCurrency, formatDate, calculatePercentageChange, formatPercentage } from '@/lib/utils';
import { subDays, subMonths, subYears, format as formatDateFns } from 'date-fns';

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

const Dashboard = () => {
  const [selectedCategory, setSelectedCategory] = useState(DataCategories.GOLD_TH);
  const [timeframe, setTimeframe] = useState('1m');
  const [goldThData, setGoldThData] = useState([]);
  const [predictData, setPredictData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

        const [goldTHResponse, predictionsResponse] = await Promise.all([
          fetchGoldTH(timeframe),
          fetchPredictionsWithParams('sort_all', 'chart', startDate, endDate, 100)
        ]);

        if (goldTHResponse && goldTHResponse.data) {
          setGoldThData(goldTHResponse.data.sort((a, b) => new Date(a.date) - new Date(b.date)));
        } else {
          setGoldThData([]);
        }
        // console.log('Predictions Response: >> ✅✅✅✅✅', predictionsResponse);
        

        if (predictionsResponse && predictionsResponse.labels && predictionsResponse.data) {
          const predictionData = predictionsResponse.labels.map((label, index) => ({
            date: label,
            predict: predictionsResponse.data[index]
          }));
          setPredictData(predictionData);
          // console.log('Prediction Data: >> ✅✅✅✅✅', predictionData);
          
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
  }, [timeframe]);

  const getLatestPrice = () => {
    if (loading || !goldThData?.length) return null;
    const latestData = goldThData[goldThData.length - 1];
    return latestData?.price;
  };

  const getPreviousPrice = () => {
    if (loading) return null;
    if (goldThData?.length < 2) return null;
    return goldThData[goldThData.length - 2]?.price;
  };

  const getLatestDate = () => {
    if (loading || !goldThData?.length) return null;
    const latestData = goldThData[goldThData.length - 1];
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
                predictData={predictData}
                selectedCategory={selectedCategory}
                timeframe={timeframe}
                loading={loading}
              />
            )}
          </div>
          
          {selectedCategory === DataCategories.GOLD_TH && predictData?.length > 0 && (
            <div className="mt-4 p-4 rounded-md bg-amber-100 dark:bg-amber-900/20 text-amber-800 dark:text-amber-200">
              <div className="flex items-start gap-2">
                <InfoIcon className="h-5 w-5 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">Prediction Data</p>
                  <p className="text-sm opacity-90">Gold price prediction data for the next 7 days is shown as a blue line on the graph. Predictions may be inaccurate and should not be used as the primary basis for investment decisions.</p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;