import React, { useState, useEffect, useCallback, useContext } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
// Import subMonths and subYears
import { endOfDay, startOfDay, subDays, subMonths, subYears, startOfYear, isValid, format as formatDateFns, parse } from 'date-fns';
import { th } from 'date-fns/locale';
import LastPrice from './components/lastPrice';
import DataCategory from './components/dataCategory';
import SelectPredictModel from './components/selectPredictModel';
import SelectStyleChart from './components/selectStyleChart';
import DateRangePicker, { PRESETS } from './components/dateRangePicker';
import GoldChart from './components/GoldChart';
import PredictionBadge from './components/predictionBadge';
import CurrentTime from './components/currentTime';
import CacheStatus from './components/CacheStatus';
import { useChartData } from './hook/fetchData';
import { useTranslation } from 'react-i18next';
import SelectPrediction from '@/components/SelectPrediction';
import MonthlyPredictions from '@/components/MonthlyPredictions';
import { PredictionContext } from '@/context/PredictionContext';
import { usePredictionErrorStats } from '../../store/PredictionErrorStatsStore';
import { fetchPredictionsMonth } from '@/services/apiService';
import { formatCurrency } from '@/lib/utils';
import { useQueryClient } from '@tanstack/react-query';
// Import localStorage utility functions
import {
  saveChartTypePreference,
  getChartTypePreference,
  saveDateRangePreference,
  getDateRangePreference,
  saveDateOptionPreference,
  getDateOptionPreference,
  saveSelectedModelPreference,
  getSelectedModelPreference,
  saveLegendVisibilityPreference,
  getLegendVisibilityPreference,
  saveSelectedCategoryPreference,
  getSelectedCategoryPreference
} from './utils/chartPreferences';

const DataCategories = {
  GOLD_TH: 'GOLD_TH',
  GOLD_US: 'GOLD_US',
  USD_THB: 'USD_THB',
  SELECT_PREDICTION: 'SELECT_PREDICTION',
  MONTHLY_PREDICTION: 'MONTHLY_PREDICTION'
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
  const queryClient = useQueryClient();
  // Use localStorage for initial state values
  const [selectedCategory, setSelectedCategory] = useState(() => {
    return getSelectedCategoryPreference('GOLD_TH');
  });
  
  const [selectedModel, setSelectedModel] = useState(() => {
    return getSelectedModelPreference('7');
  });
  
  // Handle model changes, save to localStorage, and invalidate cache
  const handleModelChange = (newModel) => {
    // Invalidate the predict query for the current model before changing
    queryClient.invalidateQueries({ 
      queryKey: ['predictData', 'GOLD_TH', selectedModel] 
    });
    
    // Set the new model and save to localStorage
    setSelectedModel(newModel);
    saveSelectedModelPreference(newModel);
  };
  
  // Initialize chart style from localStorage based on category
  const [selectedChartStyle, setSelectedChartStyle] = useState(() => {
    return getChartTypePreference(selectedCategory, 'line');
  });
  
  // Handle chart style changes and save to localStorage
  const handleChartStyleChange = (newStyle) => {
    setSelectedChartStyle(newStyle);
    saveChartTypePreference(selectedCategory, newStyle);
  };
  
  const [monthlyChartTab, setMonthlyChartTab] = useState('table');
  const { t, i18n } = useTranslation();
  
  // Initialize date option from localStorage
  const initialDefaultRangePreset = PRESETS.find(p => p.label === "MAX") || PRESETS[0];
  const [activeDateOption, setActiveDateOption] = useState(() => {
    return getDateOptionPreference(selectedCategory, initialDefaultRangePreset.range);
  });
  
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
      case '1M': start = startOfDay(subMonths(end, 1)); break;      
      case '3M': start = startOfDay(subMonths(end, 3)); break;      
      case '6M': start = startOfDay(subMonths(end, 6)); break;
      case 'YTD': start = startOfYear(end); break;
      case '1Y': start = startOfDay(subYears(end, 1)); break;
      case '3Y': start = startOfDay(subYears(end, 3)); break;
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

  // Get saved date range or calculate default
  const [currentDateRange, setCurrentDateRange] = useState(() => {
    // Try to get saved date range from localStorage first
    const savedRange = getDateRangePreference(selectedCategory);
    
    if (savedRange && savedRange.from && savedRange.to) {
      return savedRange;
    }
    
    // Otherwise calculate based on selected preset
    return calculateInitialRange(activeDateOption, earliestDataDate, latestDataDateFromApi);
  });

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


  // Effect to handle date option changes and update range
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
      // Save to localStorage when date range changes
      saveDateRangePreference(selectedCategory, newCalculatedRange);
    }
  }, [activeDateOption, earliestDataDate, latestDataDateFromApi, calculateInitialRange, currentDateRange, selectedCategory]);

  const handleDateRangeChange = (newRange, newActiveOption) => {
    console.log('Received range:', {
      range: newRange, 
      option: newActiveOption,
      from: newRange?.from ? newRange.from.toISOString() : 'none',
      to: newRange?.to ? newRange.to.toISOString() : 'none'
    });
    
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
      
      // Save date range preference to localStorage
      saveDateRangePreference(selectedCategory, cleanRange);
    } else {
      // Fallback to a calculated range based on the newActiveOption
      // Ensure earliestDataDate and latestDataDateFromApi are valid before passing
      const validEarliest = earliestDataDate instanceof Date && isValid(earliestDataDate) ? earliestDataDate : null;
      const validLatest = latestDataDateFromApi instanceof Date && isValid(latestDataDateFromApi) ? latestDataDateFromApi : new Date();
      const calculatedRange = calculateInitialRange(newActiveOption, validEarliest, validLatest);
      
      setCurrentDateRange(calculatedRange);
      
      // Save date range preference to localStorage
      saveDateRangePreference(selectedCategory, calculatedRange);
    }
    
    // Save date option preference
    setActiveDateOption(newActiveOption);
    saveDateOptionPreference(selectedCategory, newActiveOption);
  };
  
  // Handle category change with preference saving
  const handleCategoryChange = (newCategory) => {
    setSelectedCategory(newCategory);
    saveSelectedCategoryPreference(newCategory);
    
    // Load saved preferences for the new category
    const savedChartType = getChartTypePreference(newCategory, 'line');
    setSelectedChartStyle(savedChartType);
    
    const savedDateOption = getDateOptionPreference(newCategory, initialDefaultRangePreset.range);
    setActiveDateOption(savedDateOption);
    
    // Either load saved date range or calculate based on preset
    const savedRange = getDateRangePreference(newCategory);
    if (savedRange && savedRange.from && savedRange.to) {
      setCurrentDateRange(savedRange);
    } else {
      const newRange = calculateInitialRange(savedDateOption, earliestDataDate, latestDataDateFromApi);
      setCurrentDateRange(newRange);
    }
  };
  
  // Reset chart style to 'line' and set loading state when selecting a different data category
  useEffect(() => {
    // Reset to loading state when category changes and clear any previous price data
    setIsLastPriceLoading(true);
    setLastPrice(null);
    setPreviousPrice(null);
    setLastTime(null);
    setPricePercentChange(null);
    
    // Load appropriate chart style from localStorage based on category
    // No need to save here, as this is triggered by category change, which is handled above
  }, [selectedCategory]);
  
  // Log when chart style changes to help debug
  useEffect(() => {
    // When chart style changes, save to localStorage
    saveChartTypePreference(selectedCategory, selectedChartStyle);
    
    // console.log('GoldChartMain: Chart style changed:', {
    //   selectedChartStyle,
    //   category: selectedCategory,
    //   isCandlestickDisabled: selectedCategory === 'GOLD_TH'
    // });
  }, [selectedChartStyle, selectedCategory]);
  
  // Define stateful variables for the last price data
  const [lastPrice, setLastPrice] = useState(null);
  const [previousPrice, setPreviousPrice] = useState(null);
  const [lastTime, setLastTime] = useState(null);
  const [pricePercentChange, setPricePercentChange] = useState(null);  const [isLastPriceLoading, setIsLastPriceLoading] = useState(true);
  const [monthlyPredictions, setMonthlyPredictions] = useState([]);
  // console.log('monthlyPredictions for',monthlyPredictions[monthlyPredictions.length-1].month_predict);
  const [isMonthlyPredictionsLoading, setIsMonthlyPredictionsLoading] = useState(true);
  const { errorStats: predictionErrorStats, predictionData: storedPredictionData, selectedDate } = usePredictionErrorStats();
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
  // Fetch monthly predictions data from API
  useEffect(() => {
    const fetchMonthlyPredictions = async () => {
      setIsMonthlyPredictionsLoading(true);
      try {
        const response = await fetchPredictionsMonth();
        // console.log('Monthly predictions data:', response);
        if (Array.isArray(response)) {
          const sortedData = [...response].sort((a, b) => {
            if (a.timestamp && b.timestamp) {
              return a.timestamp - b.timestamp;
            }
            return new Date(a.date) - new Date(b.date);
          });
          setMonthlyPredictions(sortedData);
        } else if (response.status === 'success' && response.months) {
          const sortedMonths = [...response.months].sort((a, b) => {
            if (a.timestamp && b.timestamp) {
              return a.timestamp - b.timestamp;
            }
            return new Date(a.date) - new Date(b.date);
          });
          setMonthlyPredictions(sortedMonths);
        } else {
          console.warn('Unexpected response format from monthly predictions API:', response);
        }
      } catch (error) {
        console.error('Error fetching monthly predictions:', error);
      } finally {
        setIsMonthlyPredictionsLoading(false);
      }
    };

    fetchMonthlyPredictions();
  }, []);
  return (
    <div className="space-y-2">
      <div className="flex flex-col md:flex-row gap-4">        <div className="w-full md:w-[35%]">          {selectedCategory === 'SELECT_PREDICTION' ? (
            <div className="h-full">
              <LastPrice
                loading={false}
                price={t('goldChart.lastPrice.error')}
                priceDetails={null}
                errorStats={{
                  average: predictionErrorStats.average,
                  high: predictionErrorStats.high,
                  low: predictionErrorStats.low              }}
                customLabel={t('goldChart.lastPrice.error')}
                date={selectedDate || predictionErrorStats.date || new Date()}
                showDecimals={false}
                textStyle="error"
                showPredictionDate={true}
              />
            </div>          ) : selectedCategory === 'MONTHLY_PREDICTION' ? (<Card className="flex-1 h-full">
              <div className="space-y-1.5 p-3 h-full flex flex-col justify-center">
                <p className="text-muted-foreground text-xs">{t('goldChart.monthlyPredict.title', 'Monthly Predict')}</p>
                <div className="flex items-center justify-between">
                  {isMonthlyPredictionsLoading ? (
                    <Skeleton className="h-8 w-36 rounded-md" />
                  ) : monthlyPredictions && monthlyPredictions.length > 0 ? (
                    <>
                      <div className="grid grid-cols-2 gap-4 w-full">
                        {(() => {
                          const lastMonth = monthlyPredictions[monthlyPredictions.length-1];
                          const prevMonth = monthlyPredictions.length > 1 ? monthlyPredictions[monthlyPredictions.length-2] : null;
                          
                          const highValue = lastMonth.high;
                          const lowValue = lastMonth.low;
                          
                          let highChangePercent = 0;
                          let lowChangePercent = 0;
                          
                          if (prevMonth) {
                            highChangePercent = ((highValue - prevMonth.high) / prevMonth.high) * 100;
                            lowChangePercent = ((lowValue - prevMonth.low) / prevMonth.low) * 100;
                          }
                          
                          const highTrend = highChangePercent > 0 ? '▲' : highChangePercent < 0 ? '▼' : '•';
                          const lowTrend = lowChangePercent > 0 ? '▲' : lowChangePercent < 0 ? '▼' : '•';
                          
                          return (
                            <>
                            <div className="flex flex-col">
                              <span className="text-sm font-medium text-muted-foreground">{t('goldChart.monthlyPredict.high', 'High')}</span>
                                <div className="flex items-center">                                  <span className="font-semibold tracking-tight text-xl md:text-xl">
                                    {formatCurrency(highValue, 'THB', i18n.language === 'th' ? 'th-TH' : 'en-US')}
                                  </span>
                                  <span className={`ml-2 text-sm font-medium flex items-center ${highChangePercent > 0 ? 'text-green-500' : highChangePercent < 0 ? 'text-red-500' : 'text-gray-500'}`}>
                                    {highTrend} {Math.abs(highChangePercent).toFixed(2)}%
                                  </span>
                                </div>
                              </div>                              <div className="flex flex-col">
                                <span className="text-sm font-medium text-muted-foreground">{t('goldChart.monthlyPredict.low', 'Low')}</span>
                                <div className="flex items-center">                                  <span className="font-semibold tracking-tight text-xl md:text-xl">
                                    {formatCurrency(lowValue, 'THB', i18n.language === 'th' ? 'th-TH' : 'en-US')}
                                  </span>
                                  <span className={`ml-2 text-sm font-medium flex items-center ${lowChangePercent > 0 ? 'text-green-500' : lowChangePercent < 0 ? 'text-red-500' : 'text-gray-500'}`}>
                                    {lowTrend} {Math.abs(lowChangePercent).toFixed(2)}%
                                  </span>
                                </div>
                              </div>
                            </>
                          );
                        })()}
                      </div>
                    </>
                  ) : (
                    <div className="w-full">
                      <span className="font-semibold tracking-tight text-xl">{t('goldChart.monthlyPredict.noData', 'No prediction data available')}</span>
                    </div>
                  )}
                  </div>                  <div className="text-xs text-muted-foreground mt-auto">
                    <div className="mt-1">                    {monthlyPredictions && monthlyPredictions.length > 0 
                      ? `${t('goldChart.monthlyPredict.predictionFor', 'Prediction for')}: ${
                          i18n.language === 'th' 
                            ? (() => {
                                const date = parse(monthlyPredictions[monthlyPredictions.length-1].month_predict, 'yyyy-MM', new Date());
                                // Get the Thai month abbreviations from monthsShort object
                                const thaiMonthsObj = t('goldChart.dateRange.monthsShort', { returnObjects: true });
                                // Convert to array or use the correct property for the month
                                const monthKey = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][date.getMonth()];
                                return `${thaiMonthsObj[monthKey]} ${date.getFullYear() + 543}`;
                              })()
                            : formatDateFns(
                                parse(monthlyPredictions[monthlyPredictions.length-1].month_predict, 'yyyy-MM', new Date()), 
                                'MMM yyyy'
                              )
                        }`
                      : `${t('goldChart.monthlyPredict.predictionFor', 'Prediction for')}: ${
                          i18n.language === 'th'
                            ? (() => {
                                const date = new Date();
                                // Get the Thai month abbreviations from monthsShort object
                                const thaiMonthsObj = t('goldChart.dateRange.monthsShort', { returnObjects: true });
                                // Convert to array or use the correct property for the month
                                const monthKey = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][date.getMonth()];
                                return `${thaiMonthsObj[monthKey]} ${date.getFullYear() + 543}`;
                              })()
                            : formatDateFns(new Date(), 'MMM yyyy')
                        }`
                    }
                  </div>
                </div>
              </div>
            </Card>          ) : (
            <div className="h-full">
              <LastPrice
                loading={isLastPriceLoading}
                price={lastPrice}
                priceChange={lastPrice != null && previousPrice != null ? lastPrice - previousPrice : 0}
                percentChange={pricePercentChange}
                date={lastTime ? new Date(lastTime * 1000) : new Date()}
                currency={selectedCategory === 'GOLD_US' ? 'USD' : 'THB'}
                showDecimals={showDecimals}
              />
            </div>
          )}
        </div>        <div className="w-full md:w-[65%] h-full">
          <DataCategory
            selectedCategory={selectedCategory}
            setSelectedCategory={handleCategoryChange} // Use our new handler that saves to localStorage
            dataCategories={DataCategories}
            hasPredictionData={selectedCategory === 'GOLD_TH' || selectedCategory === 'SELECT_PREDICTION' || selectedCategory === 'MONTHLY_PREDICTION'}
          />
        </div>
      </div>
      {selectedCategory === 'SELECT_PREDICTION' ? (
        <SelectPrediction />
      ) : selectedCategory === 'MONTHLY_PREDICTION' ? (
        <MonthlyPredictions 
          monthlyPredictions={monthlyPredictions}
          monthlyChartTab={monthlyChartTab}
          setMonthlyChartTab={setMonthlyChartTab}
          loading={isMonthlyPredictionsLoading}
        />
      ) : (
        <Card className="flex flex-col h-[75vh] w-full">
          <CardHeader className="p-0 pt-4 px-2 flex-shrink-0">
            <div className="flex flex-col sm:flex-row justify-center items-center gap-2 w-full">
              <div className="flex flex-col sm:flex-row gap-2 justify-center items-center">                {selectedCategory === 'GOLD_TH' && (
                  <SelectPredictModel
                    selectedModel={selectedModel}
                    setSelectedModel={handleModelChange}
                    models={Models}
                  />
                )}
                <DateRangePicker
                  currentRange={currentDateRange}
                  activeOption={activeDateOption}
                  onRangeChange={handleDateRangeChange}
                  earliestDate={earliestDataDate}
                  latestDate={latestDataDateFromApi}
                />                <SelectStyleChart
                  selectedCategory={selectedCategory}
                  selectedStyle={selectedChartStyle}
                  setSelectedStyle={handleChartStyleChange}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0 flex-grow overflow-hidden">
            <GoldChart
              category={selectedCategory}
              selectedModel={selectedModel}
              chartStyle={selectedChartStyle}
              dateRange={currentDateRange}
              onLastPriceUpdate={handleLastPriceUpdate}
              showDecimals={showDecimals}
              earliestDate={earliestDataDate}
              latestDate={latestDataDateFromApi}
            />
          </CardContent>
          <div className="flex justify-between items-center px-6 py-2 flex-shrink-0">
            <div>              {selectedCategory === 'GOLD_TH' && <PredictionBadge date={new Date()} />}
            </div>
            <CurrentTime />
          </div>
        </Card>
      )}
      
      {/* Cache Status Component for debugging */}
      <CacheStatus />
    </div>
  );
};


export default GoldChartMain;