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
  const [selectedModel, setSelectedModel] = useState('7');  const [selectedChartStyle, setSelectedChartStyle] = useState('line');

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

  // Effect to update earliestDataDate when allChartData is available
  const { data: allChartData } = useChartData(); // Assuming useChartData provides all data sets
  useEffect(() => {
    if (allChartData) {
      const earliest = getEarliestAvailableDate(allChartData);
      if (earliest && (!earliestDataDate || earliest.getTime() !== earliestDataDate.getTime())) {
        setEarliestDataDate(earliest);
      }
    }
  }, [allChartData, earliestDataDate]);


  useEffect(() => {
    // If activeDateOption is 'CUSTOM', the currentDateRange is authoritative and
    // should have been set by handleDateRangeChange. This effect should not
    // override it by attempting to calculate a preset-based range.
    // Child components (DateRangePicker, GoldChart) receive earliest/latest dates
    // and should adapt their behavior or displayed data accordingly if those boundaries change.
    if (activeDateOption === 'CUSTOM') {
      return;
    }

    // For preset activeDateOptions, calculate and apply the range.
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
    console.log('Received range:', newRange);
    
    // Ensure newRange and its properties are valid Date objects
    if (newRange && newRange.from instanceof Date && isValid(newRange.from) && 
        newRange.to instanceof Date && isValid(newRange.to)) {
      
      // IMPORTANT: Use the direct date objects without any transformations
      // This ensures the exact same dates are used as selected in the picker
      const cleanRange = {
        from: newRange.from,  // Use direct date object
        to: newRange.to       // Use direct date object
      };
      
      console.log('Setting clean range:', {
        from: cleanRange.from.toISOString(),
        to: cleanRange.to.toISOString(),
        fromFormatted: cleanRange.from.toLocaleDateString('en-GB'),
        toFormatted: cleanRange.to.toLocaleDateString('en-GB')
      });
      
      setCurrentDateRange(cleanRange);
    } else {
      // Fallback to a calculated range based on the newActiveOption
      // Ensure earliestDataDate and latestDataDateFromApi are valid before passing
      const validEarliest = earliestDataDate instanceof Date && isValid(earliestDataDate) ? earliestDataDate : null;
      const validLatest = latestDataDateFromApi instanceof Date && isValid(latestDataDateFromApi) ? latestDataDateFromApi : new Date();
      setCurrentDateRange(calculateInitialRange(newActiveOption, validEarliest, validLatest));
    }
    setActiveDateOption(newActiveOption);
  };// Reset chart style to 'line' and set loading state when selecting a different data category
  useEffect(() => {
    // Reset to loading state when category changes and clear any previous price data
    setIsLastPriceLoading(true);
    setLastPrice(null);
    setPreviousPrice(null);
    setLastTime(null);
    setPricePercentChange(null);
    
    if (selectedCategory === 'GOLD_TH') {
      setSelectedChartStyle('line');
    }
  }, [selectedCategory]);
  
  // Define stateful variables for the last price data
  const [lastPrice, setLastPrice] = useState(null);
  const [previousPrice, setPreviousPrice] = useState(null);
  const [lastTime, setLastTime] = useState(null);
  const [pricePercentChange, setPricePercentChange] = useState(null);
  const [isLastPriceLoading, setIsLastPriceLoading] = useState(true);
  const handleLastPriceUpdate = useCallback(({ value, time, percentChange: newPercentChange, dataCategory }) => {
    // Only update if the data category matches the currently selected category
    if (dataCategory === selectedCategory) {
      setPreviousPrice(lastPrice);
      setLastPrice(value);
      setLastTime(time);
      setPricePercentChange(newPercentChange);
      setIsLastPriceLoading(false); // Data loaded successfully
      // console.log(`Updated last price for ${dataCategory}: ${value}`);
    }
  }, [lastPrice, selectedCategory]);
  
  const showDecimals = selectedCategory === 'GOLD_US';


  return (
    <div className="space-y-2">
      <div className="flex flex-col md:flex-row gap-4">
        <LastPrice
          loading={isLastPriceLoading}
          price={lastPrice}
          priceChange={lastPrice != null && previousPrice != null ? lastPrice - previousPrice : 0}
          percentChange={pricePercentChange}
          date={lastTime ? new Date(lastTime * 1000) : new Date()}
          currency={selectedCategory === 'GOLD_US' ? 'USD' : 'THB'}
          showDecimals={showDecimals}
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
        <CardContent className="p-0 m-0 h-[500px] w-full relative">
          <GoldChart
            category={selectedCategory}
            model={selectedModel}
            style={selectedChartStyle}
            dateRange={currentDateRange} // Ensure this is the correctly updated state
            onLastPriceUpdate={handleLastPriceUpdate}
            showDecimals={showDecimals}
            earliestDate={earliestDataDate} // Pass earliestDataDate
            latestDate={latestDataDateFromApi} // Pass latestDataDateFromApi
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