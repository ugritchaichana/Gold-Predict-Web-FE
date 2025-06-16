import { useQuery } from '@tanstack/react-query';
import { getBaseUrl } from '@/config/apiConfig';
import { useChartDataCache } from './useChartDataCache';
import { validateChartData, processTimeSeriesDataSafe } from '../utils/chartDataValidation';
import { logger } from '../../../utils/logger';

// URLs for different categories
const API_URLS = {
    GOLD_TH: {
        historical: `${getBaseUrl()}/finnomenaGold/get-gold-data/?db_choice=0&frame=all&display=chart2&cache=True`,
        predict: (model = '7') => `${getBaseUrl()}/predicts/week/get_week?display=chart2&model=${model}`,
        lastPredictDate: `${getBaseUrl()}/predicts/week/get_predict_last_date`,
    },
    GOLD_US: {
        historical: `${getBaseUrl()}/finnomenaGold/get-gold-data/?db_choice=1&frame=all&display=chart2&cache=True`,
        // No predict URL specified for GoldUS, can add if needed
    },
    USD_THB: { // Consistent key naming
        historical: `${getBaseUrl()}/currency/get/?frame=all&cache=True&display=chart2`,
        // No predict URL specified for USDTHB
    },
};

// Generic fetch function
const fetchDataFromUrl = async (url, errorMessagePrefix) => {
    if (!url) return null; // If no URL, return null (e.g., predict for non-GoldTH)
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`${errorMessagePrefix}: Network response was not ok (status: ${response.status})`);
    }
    return response.json();
};

const useChartData = (category = 'GOLD_TH', selectedModel = '7') => {
    const historicalUrl = API_URLS[category]?.historical;
    const predictUrl = category === 'GOLD_TH' ? API_URLS[category]?.predict(selectedModel) : null;

    // Add debug logging for predict URL
    // console.log(`useChartData: Fetching data for category=${category}, ACTUAL model=${selectedModel}`, {
    //     predictUrl: predictUrl,
    //     model: selectedModel
    // });

    const {
        data: historicalData,
        isLoading: isLoadingHistorical,
        isError: isErrorHistorical,
        error: errorHistorical,
    } = useQuery({
        queryKey: ['historicalData', category],
        queryFn: () => fetchDataFromUrl(historicalUrl, `Historical data for ${category}`),
        enabled: !!historicalUrl, // Only run query if URL exists
    });    const {
        data: predictData,
        isLoading: isLoadingPredict,
        isError: isErrorPredict,
        error: errorPredict,
    } = useQuery({
        queryKey: ['predictData', category, selectedModel], // Query key depends on category and model
        queryFn: () => fetchDataFromUrl(predictUrl, `Prediction data for ${category} model ${selectedModel}`),
        enabled: !!predictUrl && category === 'GOLD_TH', // Only run if predict URL exists (i.e., for GOLD_TH)
        // Add refetchOnMount and refetchOnWindowFocus to ensure fresh data
        refetchOnMount: true,
        staleTime: 0, // Data is immediately stale, forcing a refetch when dependencies change
    });

    const isLoading = isLoadingHistorical || (category === 'GOLD_TH' && isLoadingPredict);
    const isError = isErrorHistorical || (category === 'GOLD_TH' && isErrorPredict);

    let combinedError = null;
    if (isError) {
        const errorDetails = {};
        if (isErrorHistorical) {
            errorDetails.historical = errorHistorical?.message || `Failed to load historical data for ${category}.`;
        }
        if (category === 'GOLD_TH' && isErrorPredict) {
            errorDetails.predict = errorPredict?.message || `Failed to load prediction data for ${category}.`;
        }
        combinedError = {
            message: 'Error fetching chart data.',
            details: errorDetails,
        };
    }

    if (isLoading) {
        return { data: null, isLoading: true, isError: false, error: null };
    }

    if (isError) {
        return { data: null, isLoading: false, isError: true, error: combinedError };
    }    // Helper function to adjust time to 5:00:00 PM for GOLD_TH items
    const adjustTimeToFivePM = (dataArray) => {
        if (!Array.isArray(dataArray)) return dataArray;
        
        const adjustedData = dataArray
            .filter(item => item && typeof item.time === 'number' && isFinite(item.time))
            .map(item => {
                const date = new Date(item.time * 1000);
                date.setHours(17, 0, 0, 0); // Set to 5:00:00 PM
                return { ...item, time: Math.floor(date.getTime() / 1000) };
            });
        
        // Use the shared validation utility for deduplication and sorting
        return validateChartData(adjustedData, 'adjustTimeToFivePM');
    };// Structure the data based on category
    let structuredData = {};
    if (historicalData) {
        if (category === 'GOLD_TH') {
            // Process historical data arrays to set time to 5:00 PM
            const processedData = {};
            for (const key in historicalData) {
                if (Array.isArray(historicalData[key])) {
                    processedData[key] = adjustTimeToFivePM(historicalData[key]);
                } else {
                    processedData[key] = historicalData[key];
                }
            }

            // Also process prediction data
            const processedPredictData = adjustTimeToFivePM(predictData || []);

            structuredData = {
                ...processedData,
                barBuyPredictData: processedPredictData,
            };
        } else if (category === 'GOLD_US' || category === 'USD_THB') {
            let ohlcDataToProcess = [];
            
            if (Array.isArray(historicalData.ohlc) && historicalData.ohlc.length > 0) {
                ohlcDataToProcess = historicalData.ohlc;
            } else if (
                Array.isArray(historicalData.open) && 
                Array.isArray(historicalData.high) && 
                Array.isArray(historicalData.low) && 
                Array.isArray(historicalData.close)
            ) {
                const minLength = Math.min(
                    historicalData.open.length,
                    historicalData.high.length,
                    historicalData.low.length,
                    historicalData.close.length
                );
                const tempOhlc = [];
                for (let i = 0; i < minLength; i++) {
                    const openItem = historicalData.open[i];
                    const highItem = historicalData.high[i];
                    const lowItem = historicalData.low[i];
                    const closeItem = historicalData.close[i];
                    if (openItem && highItem && lowItem && closeItem && 
                        typeof openItem.time === 'number' && 
                        typeof openItem.value === 'number' &&
                        typeof highItem.value === 'number' &&
                        typeof lowItem.value === 'number' &&
                        typeof closeItem.value === 'number') {
                        tempOhlc.push({
                            time: openItem.time,
                            open: openItem.value,
                            high: highItem.value,
                            low: lowItem.value,
                            close: closeItem.value
                        });
                    }
                }
                ohlcDataToProcess = tempOhlc;
            }            // Sort by time and filter out duplicates with improved validation
            const ohlcData = ohlcDataToProcess.map(item => ({
                time: item.time,
                open: Number(item.open),
                high: Number(item.high),
                low: Number(item.low),
                close: Number(item.close)
            }));
            
            // Use the shared validation utility for OHLC data
            const uniqueSortedOhlc = validateChartData(ohlcData, `${category}_OHLC`);

            structuredData = {
                ...historicalData, // Spread other potential properties
                ohlc: uniqueSortedOhlc
            };
            
            console.log(`Processed ${category} OHLC data: ${ohlcDataToProcess.length} -> ${uniqueSortedOhlc.length} unique points`);
            console.log(`fetchData: Processed data for ${category}:`, {
                hasOhlc: !!structuredData.ohlc,
                ohlcLength: structuredData.ohlc ? structuredData.ohlc.length : 0,
                sampleItem: structuredData.ohlc && structuredData.ohlc.length > 0 ? 
                    structuredData.ohlc[0] : null
            });
        } else {
            structuredData = historicalData; // Default fallback
        }
    } else if (category === 'GOLD_TH' && predictData) {
        structuredData = { barBuyPredictData: adjustTimeToFivePM(predictData) }; // Use predict data if historical is missing
    }
    return {
        data: structuredData,
        isLoading: false,
        isError: false,
        error: null,
    };

    
};

// Hook for fetching last prediction date
const useLastPredictDate = () => {
    const lastPredictDateUrl = API_URLS.GOLD_TH?.lastPredictDate;

    const {
        data: lastPredictData,
        isLoading,
        isError,
        error,
    } = useQuery({
        queryKey: ['lastPredictDate'],
        queryFn: () => fetchDataFromUrl(lastPredictDateUrl, 'Last prediction date'),
        enabled: !!lastPredictDateUrl,
        staleTime: 5 * 60 * 1000, // 5 minutes
        refetchOnWindowFocus: false,
    });

    // Convert timestamp to Date object
    const lastPredictDate = lastPredictData?.time ? new Date(lastPredictData.time * 1000) : null;

    return {
        lastPredictDate,
        isLoading,
        isError,
        error,
    };
};

export { useChartData, API_URLS, useLastPredictDate }; // Export API_URLS if GoldChartMain needs it for category keys