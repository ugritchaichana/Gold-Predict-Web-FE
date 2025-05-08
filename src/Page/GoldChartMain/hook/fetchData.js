import { useQuery } from '@tanstack/react-query';
import { getBaseUrl } from '@/config/apiConfig';

// URLs for different categories
const API_URLS = {
    GOLD_TH: {
        historical: `${getBaseUrl()}/finnomenaGold/get-gold-data/?db_choice=0&frame=all&display=chart2&cache=True`,
        predict: (model = '7') => `${getBaseUrl()}/predicts/week/get_week?display=chart2&model=${model}`,
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

    const {
        data: historicalData,
        isLoading: isLoadingHistorical,
        isError: isErrorHistorical,
        error: errorHistorical,
    } = useQuery({
        queryKey: ['historicalData', category], // Query key depends on category
        queryFn: () => fetchDataFromUrl(historicalUrl, `Historical data for ${category}`),
        enabled: !!historicalUrl, // Only run query if URL exists
    });

    const {
        data: predictData,
        isLoading: isLoadingPredict,
        isError: isErrorPredict,
        error: errorPredict,
    } = useQuery({
        queryKey: ['predictData', category, selectedModel], // Query key depends on category and model
        queryFn: () => fetchDataFromUrl(predictUrl, `Prediction data for ${category} model ${selectedModel}`),
        enabled: !!predictUrl && category === 'GOLD_TH', // Only run if predict URL exists (i.e., for GOLD_TH)
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
    }

    // Structure the data based on category
    let structuredData = {};
    if (historicalData) {
        if (category === 'GOLD_TH') {
            structuredData = {
                ...historicalData, // barBuyData, barSellData, etc.
                barBuyPredictData: predictData || [],
            };
        } else if (category === 'GOLD_US' || category === 'USD_THB') {
            // For GoldUS and USDTHB, the historicalData is an object like {open: [], high: [], low: [], close: []}
            // We can pass this structure directly or transform it if needed.
            // For now, let's assume Chart.jsx will be adapted to handle this.
            structuredData = historicalData;
        } else {
            structuredData = historicalData; // Default fallback
        }
    } else if (category === 'GOLD_TH' && predictData) {
        // Case where historical might fail but predict succeeds (less likely but possible)
        structuredData = { barBuyPredictData: predictData };
    }


    return {
        data: structuredData,
        isLoading: false,
        isError: false,
        error: null,
    };
};

export { useChartData, API_URLS }; // Export API_URLS if GoldChartMain needs it for category keys