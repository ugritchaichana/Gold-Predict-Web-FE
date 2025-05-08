import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import LastPrice from './components/lastPrice';
import DataCategory from './components/dataCategory';
import SelectPredictModel from './components/selectPredictModel';
import DateRange from './components/dateRange';
import GoldChart from './components/GoldChart';
import PredictionBadge from './components/predictionBadge';

// These are the display names and also the keys used by Tabs component
// Ensure these keys match what's expected by useChartData and Chart components for API_URLS and baseSeriesConfigs
const DataCategories = {
  GOLD_TH: 'Gold TH',
  GOLD_US: 'Gold US',
  USD_THB: 'USD THB' // Make sure this key 'USD_THB' matches the one in API_URLS and baseSeriesConfigs
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
  // Initialize with the KEY of the default category
  const [selectedCategory, setSelectedCategory] = useState('GOLD_TH'); 
  const [timeframe, setTimeframe] = useState('1m');
  const [selectedModel, setSelectedModel] = useState('7');
  
  // Mock data should ideally be fetched or updated based on selectedCategory
  const mockPrice = selectedCategory === 'GOLD_US' ? 2380.45 : 38750.00;
  const mockPreviousPrice = selectedCategory === 'GOLD_US' ? 2350.20 : 38500.00;
  const mockChange = mockPrice - mockPreviousPrice;
  const mockPercentChange = (mockChange / mockPreviousPrice) * 100;
  const mockDate = new Date();
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4">
        <LastPrice 
          price={mockPrice}
          priceChange={mockChange}
          percentChange={mockPercentChange}
          date={mockDate}
          currency={selectedCategory === 'GOLD_US' ? 'USD' : 'THB'}
        />
        <DataCategory
          selectedCategory={selectedCategory} // This is the key, e.g., 'GOLD_TH'
          setSelectedCategory={setSelectedCategory} // This function expects a key
          dataCategories={DataCategories} // This is the object {GOLD_TH: 'Gold TH', ...}
          hasPredictionData={selectedCategory === 'GOLD_TH'}
        />
      </div>
        <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Gold Chart</CardTitle>
            <div className="flex gap-2">
              {selectedCategory === 'GOLD_TH' && (
                <SelectPredictModel 
                  selectedModel={selectedModel}
                  setSelectedModel={setSelectedModel}
                  models={Models}
                />
              )}

              <DateRange
                timeframe={timeframe}
                setTimeframe={setTimeframe}
                timeFrames={TimeFrames}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <GoldChart
            category={selectedCategory} // Pass the key
            timeframe={timeframe}
            selectedModel={selectedModel}
          />
        </CardContent>
        <div className="flex justify-end items-center px-6 pb-4">
          {selectedCategory === 'GOLD_TH' && (
            <PredictionBadge date={new Date()} />
          )}
        </div>
      </Card>
    </div>
  );
};

export default GoldChartMain;