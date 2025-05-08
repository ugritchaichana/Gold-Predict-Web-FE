import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import LastPrice from './components/lastPrice';
import DataCategory from './components/dataCategory';
import SelectPredictModel from './components/selectPredictModel';
import DateRange from './components/dateRange';
import GoldChart from './components/GoldChart';
import PredictionBadge from './components/predictionBadge';

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

const Models = {
  '1': 'Model 1',
  '2': 'Model 2',
  '3': 'Model 3',
  '4': 'Model 4',
  '5': 'Model 5',
  '6': 'Model 6',
  '7': 'Model 7',
};

const GoldChartMain = () => {
  const [selectedCategory, setSelectedCategory] = useState(DataCategories.GOLD_TH);
  const [timeframe, setTimeframe] = useState('1m');
  const [selectedModel, setSelectedModel] = useState('7');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const mockPrice = selectedCategory === DataCategories.GOLD_US ? 2380.45 : 38750.00;
  const mockPreviousPrice = selectedCategory === DataCategories.GOLD_US ? 2350.20 : 38500.00;
  const mockChange = mockPrice - mockPreviousPrice;
  const mockPercentChange = (mockChange / mockPreviousPrice) * 100;
  const mockDate = new Date();  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4">
        <LastPrice 
          loading={loading}
          price={mockPrice}
          priceChange={mockChange}
          percentChange={mockPercentChange}
          date={mockDate}
          currency={selectedCategory === DataCategories.GOLD_US ? 'USD' : 'THB'}
        />        <DataCategory
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
          dataCategories={DataCategories}
          loading={loading}
          hasPredictionData={selectedCategory === DataCategories.GOLD_TH}
        />
      </div>      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Gold Chart</CardTitle>
            <div className="flex gap-2">
              {selectedCategory === DataCategories.GOLD_TH && (
                <SelectPredictModel 
                  selectedModel={selectedModel}
                  setSelectedModel={setSelectedModel}
                  models={Models}
                  loading={loading}
                />
              )}

              <DateRange
                timeframe={timeframe}
                setTimeframe={setTimeframe}
                timeFrames={TimeFrames}
                loading={loading}
              />
            </div>
          </div>
        </CardHeader>        <CardContent>
          <GoldChart
            loading={loading}
            error={error}
            onRetry={() => window.location.reload()}
            category={selectedCategory}
            timeframe={timeframe}
          />
        </CardContent>        <div className="flex justify-end items-center px-6 pb-4">
          {selectedCategory === DataCategories.GOLD_TH && (
            <PredictionBadge date={new Date()} />
          )}
        </div>
      </Card>
    </div>
  );
};

export default GoldChartMain;
