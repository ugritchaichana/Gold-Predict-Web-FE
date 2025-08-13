import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { format as formatDateFns } from 'date-fns';
import { useTranslation } from 'react-i18next';
import { usePredictionErrorStats } from '@/store/PredictionErrorStatsStore';
import dayjs from 'dayjs';

const SELECTED_DATE_KEY = 'selectprediction-selected-date';

const formatPrice = (price, showDecimals = false) => {
  if (price === null || price === undefined || isNaN(price)) {
    return '0';
  }
  
  const formattedPrice = price.toLocaleString(undefined, {
    minimumFractionDigits: showDecimals ? 2 : 0,
    maximumFractionDigits: 2
  });
  
  const hasDecimal = formattedPrice.includes('.') || formattedPrice.includes(',');
  const decimalSeparator = formattedPrice.includes('.') ? '.' : ',';
  
  if (hasDecimal) {
    const parts = formattedPrice.split(decimalSeparator);
    const decimalPart = parts[1];
    
    if (decimalPart === '00') {
      return parts[0];
    }
  }
  
  return formattedPrice;
};

const LastPrice = ({ 
  loading = false, 
  price = 0, 
  priceChange = 0, 
  percentChange = 0, 
  date = new Date(), 
  currency = 'THB',
  showDecimals = false,
  priceDetails = null,
  customLabel = null,
  textStyle = null,
  errorStats = null,
  showPredictionDate = false
}) => {  const isLoading = loading || (price === null || price === 0) && !priceDetails && !errorStats;
  const { t } = useTranslation();
  const { predictionData, selectedDate } = usePredictionErrorStats();
  const [selectedPrediction, setSelectedPrediction] = useState(null);
  const [localSelectedDate, setLocalSelectedDate] = useState(null);
    useEffect(() => {
    try {
      const savedDateStr = localStorage.getItem(SELECTED_DATE_KEY);
      if (savedDateStr) {
        setLocalSelectedDate(dayjs(savedDateStr));
      }
    } catch (error) {
      console.error('Error loading selected date from localStorage:', error);
    }
  }, []);

  // Listen for changes in localStorage (when SelectPrediction updates the date)
  useEffect(() => {
    const handleStorageChange = () => {
      try {
        const savedDateStr = localStorage.getItem(SELECTED_DATE_KEY);
        if (savedDateStr) {
          setLocalSelectedDate(dayjs(savedDateStr));
        }
      } catch (error) {
        console.error('Error loading selected date from localStorage:', error);
      }
    };

    // Listen for storage events (doesn't work for same-tab changes)
    window.addEventListener('storage', handleStorageChange);
    
    // Custom event for same-tab localStorage changes
    window.addEventListener('localStorageChange', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('localStorageChange', handleStorageChange);
    };
  }, []);

  // Also listen for changes in the store's selectedDate
  useEffect(() => {
    if (selectedDate) {
      setLocalSelectedDate(selectedDate);
    }
  }, [selectedDate]);
  
  useEffect(() => {
    if (predictionData && predictionData.length > 0) {
      const actualData = predictionData.filter(item => item.actual !== null);
      if (actualData.length > 0) {
        const latestData = actualData[actualData.length - 1];
        setSelectedPrediction(latestData);
      }
    }
  }, [predictionData]);
  
  const isPriceUp = percentChange > 0;
  const isPriceDown = percentChange < 0;
  const priceDirection = isPriceUp ? '▲' : isPriceDown ? '▼' : '•';
  const badgeVariant = isPriceUp ? "success" : isPriceDown ? "destructive" : "outline";
  
  // Get translated currency name
  const getFormattedCurrency = (currencyCode) => {
    return t(`goldChart.currencies.${currencyCode}`);
  };
  
  const formatDate = (date) => {
    const days = t('goldChart.time.days', { returnObjects: true });
    const dayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const dayName = days[dayOfWeek];
    const day = date.getDate();
    const months = t('goldChart.time.months', { returnObjects: true });
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    
    return `${dayName} ${day} ${month} ${year}`;
  };  return (
    <Card className="flex-1 h-full">
      <CardHeader className="p-3 h-full flex flex-col justify-center">
        <CardDescription className="text-xs">{errorStats ? t('goldChart.lastPrice.error') : (customLabel || t('goldChart.lastPrice.title'))}</CardDescription>
        
        {isLoading ? (
          <div className="flex items-center justify-between">
            <CardTitle className={cn(
              "text-2xl md:text-3xl",
              textStyle === "error" && "text-red-500"
            )}>
              <div className="flex flex-col gap-1">
                <Skeleton className="h-8 w-36 rounded-md" />
                <Skeleton className="h-6 w-24 rounded-md" />
              </div>
            </CardTitle>
            {textStyle === "error" ? null : <Skeleton className="h-6 w-16 rounded-full" />}
          </div>        ) : errorStats ? (          <>
            <CardTitle className="flex flex-col items-center justify-center text-base space-y-2">              <div className="grid grid-cols-3 w-full gap-1">                <div className="flex items-center justify-center py-0.5 px-1 bg-slate-900/5 dark:bg-slate-900/10 rounded">
                  <span className="font-medium text-slate-600 dark:text-slate-300 text-lg">{t('goldChart.lastPrice.errorStats.high')}</span>
                  <span className="text-green-600 dark:text-green-400 font-bold text-lg ml-1">{errorStats.high}%</span>
                </div>
                <div className="flex items-center justify-center py-0.5 px-1 bg-blue-900/5 dark:bg-blue-900/10 rounded">
                  <span className="font-medium text-slate-600 dark:text-slate-300 text-lg">{t('goldChart.lastPrice.errorStats.average')}</span>
                  <span className="text-blue-600 dark:text-blue-400 font-bold text-lg ml-1">{errorStats.average}%</span>
                </div>
                <div className="flex items-center justify-center py-0.5 px-1 bg-slate-900/5 dark:bg-slate-900/10 rounded">
                  <span className="font-medium text-slate-600 dark:text-slate-300 text-lg">{t('goldChart.lastPrice.errorStats.low')}</span>
                  <span className="text-yellow-600 dark:text-yellow-400 font-bold text-lg ml-1">{errorStats.low}%</span>
                </div>
              </div><div className="text-xs font-medium text-slate-700 dark:text-slate-300 self-start">
                {t('goldChart.lastPrice.predictionFor')}: {localSelectedDate ? formatDate(localSelectedDate.toDate()) : selectedDate ? formatDate(selectedDate.toDate()) : formatDate(date)}
              </div>
            </CardTitle>
          </>
        ) : (
          <div className="flex items-center justify-between">
            <CardTitle className={cn(
              "text-2xl md:text-3xl",
              textStyle === "error" && "text-red-500"
            )}>
              {typeof price === 'string' ? (
                price
              ) : (
                `${formatPrice(price, showDecimals)} ${getFormattedCurrency(currency)}`
              )}
            </CardTitle>
            <Badge 
              variant={badgeVariant}
              className="ml-2 px-1.5 py-0.5"
            >
              <span className="flex items-center text-sm">
                {priceDirection}
                <span className="ml-1">{percentChange !== null ? percentChange.toFixed(2) : '0.00'}%</span>
              </span>
            </Badge>
          </div>
        )}
        {!errorStats && (
          <div className="text-xs text-muted-foreground mt-auto">
            {isLoading ? (
              <div className="flex gap-1 items-center">
                <Skeleton className="h-3 w-20 rounded-md" />
                <Skeleton className="h-3 w-12 rounded-md" />
              </div>
            ) : priceDetails ? (
              <div className="font-medium">{priceDetails}</div>
            ) : (
              `${t('goldChart.lastPrice.updated')}: ${formatDate(date)}`
            )}
            
            {showPredictionDate && !isLoading ? (
              <div className="font-medium mt-1">
                {t('goldChart.lastPrice.predictionFor')}: {localSelectedDate ? formatDate(localSelectedDate.toDate()) : selectedDate ? formatDate(selectedDate.toDate()) : formatDate(date)}
              </div>
            ) : (priceDetails && !isLoading) ? (
              <div className="mt-1">{`${t('goldChart.lastPrice.updated')}: ${formatDate(date)}`}</div>
            ) : null}
          </div>
        )}
      </CardHeader>
    </Card>
  );
};

export default LastPrice;
