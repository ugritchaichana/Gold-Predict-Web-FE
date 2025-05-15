import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
// Import subMonths and subYears
import { endOfDay, startOfDay, subDays, subMonths, subYears, startOfYear, isValid } from 'date-fns';
import LastPrice from './components/lastPrice';
import DataCategory from './components/dataCategory';
import SelectPredictModel from './components/selectPredictModel';
import SelectStyleChart from './components/selectStyleChart';
import DateRangePicker, { PRESETS } from './components/dateRangePicker';
import GoldChart from './components/GoldChart';
import PredictionBadge from './components/predictionBadge';
import CurrentTime from './components/currentTime';
import { useChartData } from './hook/fetchData';

const DataCategories = {
  GOLD_TH: 'Gold TH',
  GOLD_US: 'Gold US',
  USD_THB: 'USD THB'
};

const Models = {
  '1': '1',
  '2': '2',
  '3': '3',
  '4': '4',
  '5': '5',
  '6': '6',
  '7': '7',
};

const getEarliestAvailableDate = (allChartData) => {
    if (allChartData) {
        const allTimestamps = Object.values(allChartData)
            .filter(Array.isArray)
            .flat()
            .map(point => point?.time)
            .filter(time => typeof time === 'number' && isFinite(time));
        if (allTimestamps.length > 0) {
            const earliestTimestamp = Math.min(...allTimestamps);
            return new Date(earliestTimestamp * 1000);
        }
    }
    return subYears(new Date(), 5);
};


const GoldChartMain = () => {
  const [selectedCategory, setSelectedCategory] = useState('GOLD_TH');
  const [selectedModel, setSelectedModel] = useState('7');
  const [selectedChartStyle, setSelectedChartStyle] = useState('line');
  const [lastPriceData, setLastPriceData] = useState({
    price: 0,
    previousPrice: 0,
    date: new Date(),
    isLoading: true
  });

  const initialDefaultRangePreset = PRESETS.find(p => p.label === "MAX") || PRESETS[0];
  const [activeDateOption, setActiveDateOption] = useState(initialDefaultRangePreset.range);
  const [earliestDataDate, setEarliestDataDate] = useState(null);
  const latestDataDateFromApi = new Date(); // Placeholder, should be dynamic

  const calculateInitialRange = useCallback((presetRangeKey, earliestAllowed, latestAllowed) => {
    const preset = PRESETS.find(p => p.range === presetRangeKey);
    // Ensure latestAllowed is a valid date, default to now if not.
    const endCandidate = latestAllowed && isValid(latestAllowed) ? latestAllowed : new Date();
    const end = endOfDay(endCandidate);
    let start;

    if (!preset) { // Fallback if preset not found
        // Default to 7 days if earliestAllowed is not set, or earliestAllowed if it is.
        const defaultStart = earliestAllowed && isValid(earliestAllowed) ? startOfDay(earliestAllowed) : startOfDay(subDays(end, 6));
        return { from: defaultStart, to: end };
    }

    switch (preset.range) {
      case '7D': start = startOfDay(subDays(end, 6)); break;
      case '1M': start = startOfDay(subMonths(end, 1)); break;      case '3M': start = startOfDay(subMonths(end, 3)); break;
      case '6M': start = startOfDay(subMonths(end, 6)); break;
      case 'YTD': start = startOfYear(end); break;
      case '1Y': start = startOfDay(subYears(end, 1)); break;
      case '5Y': start = startOfDay(subYears(end, 5)); break;
      case 'ALL':
      default:
        start = earliestAllowed && isValid(earliestAllowed) ? startOfDay(earliestAllowed) : startOfDay(subYears(end, 1)); // Default to 1 year or actual earliest for ALL
        break;
    }

    // Ensure start date is valid and not before earliestAllowed if provided
    if (earliestAllowed && isValid(earliestAllowed) && start < earliestAllowed) {
        start = startOfDay(earliestAllowed);
    }
    
    // Ensure start is a valid date, fallback if not.
    if (!isValid(start)) {
        // Fallback to earliestAllowed if valid, otherwise 1 year ago
        start = earliestAllowed && isValid(earliestAllowed) ? startOfDay(earliestAllowed) : startOfDay(subYears(end,1));
    }

    return { from: start, to: end };
  }, []); // This useCallback's dependencies are tricky. If PRESETS could change, it should be a dep.
           // For now, assuming PRESETS is constant. The values it operates on (earliestAllowed, latestAllowed)
           // are passed as arguments, and the calling useEffect handles their changes.

  const [currentDateRange, setCurrentDateRange] = useState(() => 
    calculateInitialRange(activeDateOption, earliestDataDate, latestDataDateFromApi)
  );

  useEffect(() => {
    const newCalculatedRange = calculateInitialRange(activeDateOption, earliestDataDate, latestDataDateFromApi);
    
    const fromChanged = (!currentDateRange?.from && newCalculatedRange.from) || 
                        (currentDateRange?.from && !newCalculatedRange.from) || 
                        (newCalculatedRange.from && currentDateRange?.from && newCalculatedRange.from.getTime() !== currentDateRange.from.getTime());
    
    const toChanged = (!currentDateRange?.to && newCalculatedRange.to) ||
                      (currentDateRange?.to && !newCalculatedRange.to) ||
                      (newCalculatedRange.to && currentDateRange?.to && newCalculatedRange.to.getTime() !== currentDateRange.to.getTime());

    if (fromChanged || toChanged) {
      setCurrentDateRange(newCalculatedRange);
    }
  }, [activeDateOption, earliestDataDate, latestDataDateFromApi, calculateInitialRange, currentDateRange]);


  const handleDateRangeChange = (newRange, newActiveOption) => {
    if (newRange && isValid(newRange.from) && isValid(newRange.to)) {
      setCurrentDateRange({ from: newRange.from, to: newRange.to });
    } else {
      // Fallback to a calculated range based on the newActiveOption
      setCurrentDateRange(calculateInitialRange(newActiveOption, earliestDataDate, latestDataDateFromApi));
    }
    setActiveDateOption(newActiveOption);
  };

  // Reset chart style to 'line' when selecting GOLD_TH category
  useEffect(() => {
    if (selectedCategory === 'GOLD_TH') {
      setSelectedChartStyle('line');
    }
  }, [selectedCategory]);

  // Function to get the last price based on the selected category
  const getLastPriceFromChartData = (chartData, category) => {
    if (!chartData) return null;

    let price = 0;
    let previousPrice = 0;
    let date = new Date();
    
    if (category === 'GOLD_TH') {
      // Get Bar Buy price for GOLD_TH
      const barBuyData = chartData.barBuyData || [];
      if (barBuyData.length > 0) {
        // Sort by time to ensure we get the most recent
        const sortedData = [...barBuyData].sort((a, b) => b.time - a.time);
        price = sortedData[0]?.value || 0;
        previousPrice = sortedData[1]?.value || price;
        date = new Date(sortedData[0]?.time * 1000);
      }
    } else if (category === 'GOLD_US' || category === 'USD_THB') {
      // Get Close price for GOLD_US or USD_THB
      const ohlcData = chartData.ohlc || [];
      if (ohlcData.length > 0) {
        // Sort by time to ensure we get the most recent
        const sortedData = [...ohlcData].sort((a, b) => b.time - a.time);
        price = sortedData[0]?.close || 0;
        previousPrice = sortedData[1]?.close || price;
        date = new Date(sortedData[0]?.time * 1000);
      }
    }

    return {
      price,
      previousPrice,
      date,
      isLoading: false
    };
  };

  // Fetch chart data using the useChartData hook
  const { data: chartDataFull, isLoading: isChartDataLoading } = useChartData(selectedCategory, selectedModel);
  
  // Update last price when chart data changes
  useEffect(() => {
    if (chartDataFull) {
      const priceData = getLastPriceFromChartData(chartDataFull, selectedCategory);
      if (priceData) {
        setLastPriceData(priceData);
      }
    } else {
      setLastPriceData(prev => ({ ...prev, isLoading: isChartDataLoading }));
    }
  }, [chartDataFull, selectedCategory, isChartDataLoading]);

  // Set loading state when changing categories
  useEffect(() => {
    setLastPriceData(prev => ({ ...prev, isLoading: true }));
  }, [selectedCategory]);

  // Calculate price change values
  const priceChange = lastPriceData.price - lastPriceData.previousPrice;
  const percentChange = lastPriceData.previousPrice ? (priceChange / lastPriceData.previousPrice) * 100 : 0;

  // For fallback mock data  // For fallback mock data (used above)
  const mockPrice = selectedCategory === 'GOLD_US' ? 2380.45 : 38750.00;
  const mockPreviousPrice = selectedCategory === 'GOLD_US' ? 2350.20 : 38500.00;
  const mockChange = mockPrice - mockPreviousPrice;
  const mockPercentChange = (mockChange / mockPreviousPrice) * 100;

  return (
    <div className="space-y-2">
      <div className="flex flex-col md:flex-row gap-4">        <LastPrice
          loading={lastPriceData.isLoading}
          price={lastPriceData.price || mockPrice}
          priceChange={priceChange || mockChange}
          percentChange={percentChange || mockPercentChange}
          date={lastPriceData.date || new Date()}
          currency={selectedCategory === 'GOLD_US' ? 'USD' : 'THB'}
          showDecimals={selectedCategory === 'GOLD_US' || selectedCategory === 'USD_THB'}
        />
        <DataCategory
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
          dataCategories={DataCategories}
          hasPredictionData={selectedCategory === 'GOLD_TH'}
        />
      </div>
      <Card>
        <CardHeader className="p-0 pt-4 px-2">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <CardTitle className="mx-auto">Gold Chart</CardTitle>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              {selectedCategory === 'GOLD_TH' && (
                <SelectPredictModel
                  selectedModel={selectedModel}
                  setSelectedModel={setSelectedModel}
                  models={Models}
                />
              )}
              <SelectStyleChart
                selectedCategory={selectedCategory}
                selectedStyle={selectedChartStyle}
                setSelectedStyle={setSelectedChartStyle}
              />
              <DateRangePicker
                currentRange={currentDateRange}
                activeOption={activeDateOption}
                onRangeChange={handleDateRangeChange}
                earliestDate={earliestDataDate}
                latestDate={latestDataDateFromApi}
              />
              
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0 mx-2 my-4">
          <GoldChart
            category={selectedCategory}
            selectedModel={selectedModel}
            dateRange={currentDateRange}
            chartStyle={selectedChartStyle}
            activeDateOption={activeDateOption}
            onFullDataLoaded={(allData) => {
                const earliest = getEarliestAvailableDate(allData);
                if (earliest && isValid(earliest)) {
                    if (!earliestDataDate || earliest.getTime() !== earliestDataDate.getTime()) {
                      setEarliestDataDate(earliest);
                    }
                }
            }}
          />
        </CardContent>
        <div className="flex justify-between items-center px-6 pb-4">
          <div>
            {selectedCategory === 'GOLD_TH' && <PredictionBadge date={new Date()} />}
          </div>
          <CurrentTime />
        </div>
      </Card>
    </div>
  );
};

export default GoldChartMain;