import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { fetchGoldDataNew } from '@/services/betaApiService';
import { GoldCoinIcon, BarChartIcon, InfoIcon } from '@/components/icons';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { cn, formatCurrency, formatDate, calculatePercentageChange, formatPercentage } from '@/lib/utils';
import { subDays, subMonths, subYears, format as formatDateFns } from 'date-fns';
import LightweightTradingViewChart from '@/components/LightweightTradingViewChart';

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

const ChartTypes = {
  LINE: 'line',
  BAR: 'bar',
  CANDLE: 'candle'
};

const Beta = () => {
  const [selectedCategory, setSelectedCategory] = useState(DataCategories.GOLD_TH);
  const [timeframe, setTimeframe] = useState('1y');
  const [chartType, setChartType] = useState(ChartTypes.LINE);
  const [chartData, setChartData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const today = new Date();
        let startDate = null;
        let endDate = formatDateFns(today, 'dd-MM-yy');

        switch (timeframe) {
          case '7d':
            startDate = formatDateFns(subDays(today, 7), 'dd-MM-yy');
            break;
          case '1m':
            startDate = formatDateFns(subMonths(today, 1), 'dd-MM-yy');
            break;
          case '1y':
            startDate = formatDateFns(subYears(today, 1), 'dd-MM-yy');
            break;
          default:
            startDate = null;
            endDate = null;
        }

        // สร้างชื่อพารามิเตอร์จากประเภทข้อมูลที่เลือก
        let dataType;
        if (selectedCategory === DataCategories.GOLD_TH) {
          dataType = 'GoldTH';
        } else if (selectedCategory === DataCategories.GOLD_US) {
          dataType = 'GoldUS';
        } else if (selectedCategory === DataCategories.USDTHB) {
          dataType = 'USDTHB';
        }

        const response = await fetchGoldDataNew(dataType, startDate, endDate);
        
        if (response && response.status === 'success') {
          setChartData(response.data);
        } else {
          setChartData(null);
          throw new Error('Failed to fetch data');
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
    if (loading || !chartData || !chartData.datasets || chartData.datasets.length === 0) return null;
    
    // ใช้ราคาล่าสุดจากชุดข้อมูลแรก
    const priceDataset = chartData.datasets.find(dataset => dataset.label === 'Price');
    if (priceDataset && priceDataset.data && priceDataset.data.length > 0) {
      return priceDataset.data[priceDataset.data.length - 1];
    }
    
    return null;
  };

  const getPreviousPrice = () => {
    if (loading || !chartData || !chartData.datasets || chartData.datasets.length === 0) return null;
    
    // ใช้ราคาก่อนหน้าจากชุดข้อมูลแรก
    const priceDataset = chartData.datasets.find(dataset => dataset.label === 'Price');
    if (priceDataset && priceDataset.data && priceDataset.data.length > 1) {
      return priceDataset.data[priceDataset.data.length - 2];
    }
    
    return null;
  };

  const getLatestDate = () => {
    if (loading || !chartData || !chartData.Time || chartData.Time.length === 0) return null;
    return chartData.Time[chartData.Time.length - 1];
  };

  const priceChange = getLatestPrice() !== null && getPreviousPrice() !== null ? 
    getLatestPrice() - getPreviousPrice() : null;
  const percentChange = priceChange !== null ? 
    calculatePercentageChange(getLatestPrice(), getPreviousPrice()) : null;
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
                  formatCurrency(getLatestPrice(), selectedCategory === DataCategories.GOLD_US ? 'USD' : 'THB')
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
                Updated: {latestDate}
              </CardDescription>
            )}
          </CardHeader>
        </Card>

        <Card className="flex-1">
          <CardHeader className="pb-4">
            <div className="flex justify-between items-center">
              <CardTitle>Data Type</CardTitle>
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
            <CardTitle>Chart Settings</CardTitle>
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
          <div className="mb-4 flex gap-2">
            <Button
              variant={chartType === ChartTypes.LINE ? "default" : "outline"}
              size="sm"
              onClick={() => setChartType(ChartTypes.LINE)}
              disabled={loading}
            >
              Line
            </Button>
            <Button
              variant={chartType === ChartTypes.BAR ? "default" : "outline"}
              size="sm"
              onClick={() => setChartType(ChartTypes.BAR)}
              disabled={loading}
            >
              Bar
            </Button>
            <Button
              variant={chartType === ChartTypes.CANDLE ? "default" : "outline"}
              size="sm"
              onClick={() => setChartType(ChartTypes.CANDLE)}
              disabled={loading}
            >
              Candle
            </Button>
          </div>
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
              <LightweightTradingViewChart
                chartData={chartData}
                chartType={chartType}
                selectedCategory={selectedCategory}
                loading={loading}
              />
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Beta; 