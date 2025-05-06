
"use client";

import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
    createChart,
    LineStyle,
    CrosshairMode,
    ColorType,
    PriceScaleMode,
    isUTCTimestamp,
} from 'lightweight-charts';
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format as dateFnsFormat, parse as dateFnsParse, subDays, subMonths, subYears, startOfYear, isValid, startOfDay, endOfDay, parseISO, isEqual } from 'date-fns';

// --- Constants ---

// Define display name mapping for API labels
const datasetDisplayNameMap = {
    "Price": "Bar Buy Price",
    "Bar Sell Price": "Bar Sell Price",
    "Bar Price Change": "Bar Price Change",
    "Ornament Buy Price": "Ornament Buy Price",
    "Ornament Sell Price": "Ornament Sell Price",
    "Date": "Date",
    "Bar Buy Predict": "Bar Buy Predict"
};

// Define colors for different datasets using display names
const datasetColors = {
    "Bar Buy Price": 'hsl(var(--accent))', // Gold for the main price
    "Bar Sell Price": 'hsl(var(--chart-2))',
    "Ornament Buy Price": 'hsl(var(--chart-4))',
    "Ornament Sell Price": 'hsl(var(--chart-5))',
    "Bar Price Change": 'hsl(var(--chart-3))', // Consider separate axis if needed
    "Bar Buy Predict": 'hsl(var(--chart-1))', // Assign a color for prediction
};

// Define the desired display order for checkboxes and the info display
const datasetDisplayOrder = [
    "Bar Buy Price",
    "Bar Sell Price",
    "Ornament Buy Price",
    "Ornament Sell Price",
    "Bar Price Change",
    "Bar Buy Predict",
];

const primaryDatasetLabel = "Bar Buy Price";
const predictionDatasetLabel = "Bar Buy Predict";

// --- Helper Functions ---

const getCssVariable = (variableName) => {
    if (typeof window === 'undefined') return '';
    try {
        return getComputedStyle(document.documentElement).getPropertyValue(variableName).trim();
    } catch (e) {
        console.error("Failed to get CSS variable", variableName, e);
        return '';
    }
};

const parseApiDate = (dateStr) => {
    if (!dateStr || typeof dateStr !== 'string') {
        console.warn(`Invalid date string provided: ${dateStr}`);
        return null;
    }
    try {
        const parsedDate = dateFnsParse(dateStr, 'dd-MM-yy', new Date());
        if (!isValid(parsedDate)) {
            console.warn(`Invalid date format encountered in API labels: ${dateStr}`);
            return null;
        }
        parsedDate.setUTCHours(12, 0, 0, 0);
        return parsedDate;
    } catch (error) {
        console.error(`Error parsing API date string "${dateStr}":`, error);
        return null;
    }
};

const formatDateForChart = (date) => {
     if (!date || !isValid(date)) {
          console.warn('Invalid date object passed to formatDateForChart');
          return null;
     }
    return dateFnsFormat(date, 'yyyy-MM-dd');
};

const formatChartDateForDisplay = (chartTime) => {
    if (chartTime === null || chartTime === undefined) return null;
    try {
        let date;
        if (isUTCTimestamp(chartTime)) {
            date = new Date(chartTime * 1000);
        } else if (typeof chartTime === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(chartTime)) {
             date = dateFnsParse(`${chartTime}T12:00:00Z`, "yyyy-MM-dd'T'HH:mm:ssX", new Date());
        } else {
            console.warn(`Unexpected chart time format: ${chartTime}`);
            return null;
        }

        if (!date || !isValid(date)) {
            console.warn(`Could not parse chart time: ${chartTime}`);
            return null;
        }
        const day = date.getUTCDate().toString().padStart(2, '0');
        const month = (date.getUTCMonth() + 1).toString().padStart(2, '0');
        const year = date.getUTCFullYear();
        return `${day}-${month}-${year}`;

    } catch (e) {
        console.error("Error formatting chart date for display:", chartTime, e);
        return null;
    }
};

function hslStringToColorString(hslString, fallback) {
    if (!hslString || typeof hslString !== 'string') return fallback;
    const match = hslString.trim().match(/^(\d+(\.\d+)?)\s*,?\s*(\d+(\.\d+)?)%?\s*,?\s*(\d+(\.\d+)?)%?$/);

    if (!match) {
        if (/^(#|rgb|rgba|hsl)/.test(hslString)) return hslString;
        const commaMatch = hslString.trim().match(/^(\d+(\.\d+)?)\s*,\s*(\d+(\.\d+)?)%?\s*,\s*(\d+(\.\d+)?)%?$/);
        if(commaMatch) {
             return hslStringToColorString(`${commaMatch[1]} ${commaMatch[3]}% ${commaMatch[5]}%`, fallback);
        }
        console.warn(`Failed to parse HSL: "${hslString}", using fallback: ${fallback}`);
        return fallback;
    }

    let h = parseFloat(match[1]);
    let s = parseFloat(match[3]);
    let l = parseFloat(match[5]);
    s = s > 1 ? s / 100 : s;
    l = l > 1 ? l / 100 : l;
    h = ((h % 360) + 360) % 360;
    s = Math.max(0, Math.min(1, s));
    l = Math.max(0, Math.min(1, l));

    let c = (1 - Math.abs(2 * l - 1)) * s,
        x = c * (1 - Math.abs(((h / 60) % 2) - 1)),
        m = l - c / 2,
        r = 0, g = 0, b = 0;

    if (0 <= h && h < 60) { r = c; g = x; b = 0; }
    else if (60 <= h && h < 120) { r = x; g = c; b = 0; }
    else if (120 <= h && h < 180) { r = 0; g = c; b = x; }
    else if (180 <= h && h < 240) { r = 0; g = x; b = c; }
    else if (240 <= h && h < 300) { r = x; g = 0; b = c; }
    else if (300 <= h && h < 360) { r = c; g = 0; b = x; }

    r = Math.round((r + m) * 255);
    g = Math.round((g + m) * 255);
    b = Math.round((b + m) * 255);

    const toHex = (c) => c.toString(16).padStart(2, '0');
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

const formatDisplayValue = (value, displayName) => {
    if (value === null || value === undefined || isNaN(value)) return '-';
    const isChangeValue = displayName === 'Bar Price Change';
    if (isChangeValue) {
        return value.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
    }
    return value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const formatPriceChange = (change) => {
    if (change === null || isNaN(change)) return '-';
    const sign = change > 0 ? '+' : '';
    return `${sign}${change.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const formatPriceChangePercent = (percent) => {
    if (percent === null || isNaN(percent)) return '-';
    const sign = percent > 0 ? '+' : '';
    return `${sign}${percent.toFixed(2)}%`;
};

const getPriceChangeColor = (value) => {
    if (value === null || value === undefined || isNaN(value) || value === 0) return 'text-muted-foreground';
    return value > 0 ? 'text-green-600 dark:text-green-500' : 'text-red-600 dark:text-red-500';
};


// --- Data Fetching Functions (from fetchData.js) ---

/**
 * Fetches gold price data from the API.
 * @returns {Promise<GoldPriceDataSets>} A promise that resolves to the gold price datasets.
 */
async function fetchGoldPrices() {
  const apiUrl = 'https://gold-predictions.duckdns.org/finnomenaGold/get-gold-data/?db_choice=0&frame=all&display=chart&cache=True';
  const requestedApiLabels = [
    "Price", // Mapped to "Bar Buy Price"
    "Bar Sell Price",
    "Bar Price Change",
    "Ornament Buy Price",
    "Ornament Sell Price",
  ];

  try {
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}: ${response.statusText}`);
    }

    const apiResponse = await response.json();

    if (apiResponse.status !== 'success' || !apiResponse.data || !apiResponse.data.labels || !apiResponse.data.datasets) {
      throw new Error('Invalid API response format or status not success');
    }

    const apiDates = apiResponse.data.labels;
    const datasets = apiResponse.data.datasets;
    const resultDataSets = {}; // Use API labels as keys here

    for (const apiLabel of requestedApiLabels) {
      const dataset = datasets.find(ds => ds.label === apiLabel);
      if (!dataset) {
        console.warn(`Dataset with API label "${apiLabel}" not found.`);
        continue;
      }

      const data = dataset.data;
      if (apiDates.length !== data.length) {
        console.warn(`Mismatch length for dataset "${apiLabel}".`);
      }

      const timeDataArray = [];
      const minLength = Math.min(apiDates.length, data.length);

      for (let i = 0; i < minLength; i++) {
        const dateStr = apiDates[i];
        const value = data[i];
        const parsedDate = parseApiDate(dateStr);

        if (parsedDate === null) {
          console.warn(`Skipping invalid date "${dateStr}" for "${apiLabel}".`);
          continue;
        }

        let numericValue;
        if (typeof value === 'string') {
          numericValue = parseFloat(value.replace(/,/g, ''));
        } else if (typeof value === 'number') {
          numericValue = value;
        } else {
          console.warn(`Skipping invalid value type for "${apiLabel}": ${typeof value}`);
          continue;
        }

        if (isNaN(numericValue)) {
          console.warn(`Skipping unparseable numeric value "${value}" for "${apiLabel}".`);
          continue;
        }

        timeDataArray.push({
          time: formatDateForChart(parsedDate),
          value: numericValue,
        });
      }

      timeDataArray.sort((a, b) => (a.time).localeCompare(b.time));

      if (timeDataArray.length > 0) {
        resultDataSets[apiLabel] = timeDataArray;
      } else {
        console.warn(`No valid data for dataset "${apiLabel}".`);
      }
    }

    if (!resultDataSets['Price']) {
      throw new Error("Failed to process the essential 'Price' dataset.");
    }
    if (Object.keys(resultDataSets).length === 0) {
      throw new Error('Failed to process any valid datasets.');
    }

    return resultDataSets;
  } catch (error) {
    console.error("Failed to fetch or process gold prices:", error);
    throw error; // Re-throw to be handled by the caller
  }
}

/**
 * Fetches gold prediction data for a specific model.
 * @param {number | string} model The model number or identifier.
 * @returns {Promise<GoldPredictionResult>} A promise that resolves to the prediction data and creation timestamp.
 */
async function fetchGoldPrediction(model) {
  const apiUrl = `https://gold-predictions.duckdns.org/predicts/week/get_week?display=chart&model=${model}`;
  try {
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(`Prediction API request failed: ${response.status}`);
    }

    const apiResponse = await response.json();

    if (!apiResponse || !Array.isArray(apiResponse.labels) || !Array.isArray(apiResponse.data) || !Array.isArray(apiResponse.created_at)) {
      throw new Error('Invalid prediction API response format.');
    }

    const { labels: apiDates, data: apiValues, created_at: apiCreatedAts } = apiResponse;
    const minLength = Math.min(apiDates.length, apiValues.length);
    const timeDataArray = [];
    const validTimestamps = [];

    for (let i = 0; i < minLength; i++) {
      const dateStr = apiDates[i];
      const value = apiValues[i];

      if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
        console.warn(`Invalid date format in prediction: "${dateStr}"`);
        continue;
      }
      if (typeof value !== 'number' || isNaN(value)) {
        console.warn(`Invalid value in prediction: "${value}"`);
        continue;
      }
      timeDataArray.push({ time: dateStr, value: value });
    }

    let latestCreatedAt = null;
    for (const tsStr of apiCreatedAts) {
        try {
            const parsedTs = parseISO(tsStr);
            if (isValid(parsedTs)) {
                 validTimestamps.push(parsedTs);
                 if (latestCreatedAt === null || parsedTs > latestCreatedAt) {
                     latestCreatedAt = parsedTs;
                 }
            }
        } catch (e) {
             console.warn(`Could not parse created_at timestamp: ${tsStr}`, e);
        }
    }

    timeDataArray.sort((a, b) => a.time.localeCompare(b.time));

    const formattedLatestCreatedAt = latestCreatedAt
      ? dateFnsFormat(latestCreatedAt, "dd MMM yyyy HH:mm:ss O")
      : null;

    return { data: timeDataArray, createdAt: formattedLatestCreatedAt };

  } catch (error) {
    console.error(`Error fetching prediction for model ${model}:`, error);
    throw error; // Re-throw
  }
}

// --- Data Management Hook (from manageData.js) ---

const useData = (initialApiData, nameMap, colorMap) => {
  const [displayDataSets, setDisplayDataSets] = useState(() => {
    const mapped = {};
    for (const apiKey in initialApiData) {
      const displayName = nameMap[apiKey] || apiKey;
      if (colorMap[displayName] && displayName !== predictionDatasetLabel) {
        mapped[displayName] = initialApiData[apiKey];
      }
    }
    mapped[predictionDatasetLabel] = []; // Initialize prediction dataset
    return mapped;
  });

  const [predictionData, setPredictionData] = useState([]);
  const [predictionCreatedAt, setPredictionCreatedAt] = useState(null);
  const [isLoadingPrediction, setIsLoadingPrediction] = useState(false);
  const [predictionError, setPredictionError] = useState(null);
  const [selectedModel, setSelectedModel] = useState('7'); // Default model

  const fetchPredictionData = useCallback(async (model) => {
    if (!model) return;
    setIsLoadingPrediction(true);
    setPredictionError(null);
    try {
      const result = await fetchGoldPrediction(model);
      setPredictionData(result.data);
      setPredictionCreatedAt(result.createdAt);
    } catch (error) {
      console.error(`Error in fetchPredictionData for model ${model}:`, error);
      setPredictionError(`Failed to load prediction for Model ${model}.`);
      setPredictionData([]);
      setPredictionCreatedAt(null);
    } finally {
      setIsLoadingPrediction(false);
    }
  }, []);

   // Update displayDataSets when predictionData changes
   useEffect(() => {
    setDisplayDataSets(prevDataSets => ({
      ...prevDataSets,
      [predictionDatasetLabel]: predictionData
    }));
  }, [predictionData, predictionDatasetLabel]);


  return {
    displayDataSets,
    setDisplayDataSets, // Allow chart component to update prediction data directly
    predictionData,
    predictionCreatedAt,
    isLoadingPrediction,
    predictionError,
    selectedModel,
    setSelectedModel,
    fetchPredictionData,
  };
};


// --- GoldTHChart Component ---

const GoldTHChart = ({ initialDataSets }) => {
    const chartContainerRef = useRef(null);
    const chartRef = useRef(null);
    const seriesRefs = useRef(new Map());
    const [_activeRangeOption, _setActiveRangeOption] = useState('ALL');
    const [customDateRange, setCustomDateRange] = useState(undefined);
    const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

    // --- Data Management ---
    const {
        displayDataSets,
        setDisplayDataSets,
        predictionData, // We get prediction data from the hook now
        predictionCreatedAt,
        isLoadingPrediction,
        predictionError,
        selectedModel,
        setSelectedModel,
        fetchPredictionData
    } = useData(initialDataSets, datasetDisplayNameMap, datasetColors);

    const [visibleDataSets, setVisibleDataSets] = useState(() => {
        const initialVisible = new Set(datasetDisplayOrder.filter(name => name !== predictionDatasetLabel));
        return initialVisible;
    });

    const [displayInfo, setDisplayInfo] = useState({
        date: null,
        values: {},
        primaryChange: { change: null, percent: null }
    });

    const [chartColors, setChartColors] = useState(null);
    const [chartVisibleRange, setChartVisibleRange] = useState(null);

    // Define activeRangeOption based on customDateRange presence
    const activeRangeOption = customDateRange?.from ? 'CUSTOM' : _activeRangeOption;


    // --- Fetch Prediction Data Effect ---
    useEffect(() => {
        fetchPredictionData(selectedModel); // Fetch prediction when model changes
    }, [selectedModel, fetchPredictionData]);


    const { earliestDate, latestDate } = React.useMemo(() => {
        const primaryData = displayDataSets[primaryDatasetLabel];
        if (!primaryData || primaryData.length === 0) {
            return { earliestDate: undefined, latestDate: new Date() };
        }
        try {
            const parseChartTime = (time) => {
                if (typeof time === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(time)) {
                    const parsed = dateFnsParse(time, 'yyyy-MM-dd', new Date());
                    return isValid(parsed) ? parsed : null;
                } else if (isUTCTimestamp(time)) {
                    const dateFromTimestamp = new Date(time * 1000);
                    return isValid(dateFromTimestamp) ? dateFromTimestamp : null;
                }
                return null;
            };

            const firstDate = parseChartTime(primaryData[0].time);
            const lastDate = parseChartTime(primaryData[primaryData.length - 1].time);

            return {
                earliestDate: firstDate ? startOfDay(firstDate) : undefined,
                latestDate: lastDate ? endOfDay(lastDate) : new Date()
            };
        } catch (e) {
            console.error("Error determining date range:", e);
            return { earliestDate: undefined, latestDate: new Date() };
        }
    }, [displayDataSets, primaryDatasetLabel]);


     const calculatePresetRange = React.useCallback((presetRange, endDate = new Date()) => {
        if (!endDate || !isValid(endDate)) {
            endDate = new Date();
            console.warn("Invalid latestDate, using current date.");
        }
        const end = endOfDay(endDate);
        let start;

        switch (presetRange) {
             case '1D': start = startOfDay(end); break;
             case '5D': start = startOfDay(subDays(end, 4)); break;
             case '1M': start = startOfDay(subMonths(end, 1)); break;
             case '3M': start = startOfDay(subMonths(end, 3)); break;
             case '6M': start = startOfDay(subMonths(end, 6)); break;
             case 'YTD': start = startOfYear(end); break;
             case '1Y': start = startOfDay(subYears(end, 1)); break;
             case '5Y': start = startOfDay(subYears(end, 5)); break;
             case 'ALL':
             default:
                 if (earliestDate && isValid(earliestDate)) {
                    return { from: startOfDay(earliestDate), to: end };
                 }
                 console.warn("Earliest date invalid for 'ALL'.");
                 return { from: startOfYear(end), to: end };
        }

         if (earliestDate && isValid(earliestDate) && start < earliestDate) {
            start = startOfDay(earliestDate);
         }

         if (!isValid(start)) {
              console.warn(`Invalid start date for preset ${presetRange}.`);
              const fallbackStart = earliestDate && isValid(earliestDate) ? startOfDay(earliestDate) : startOfYear(end);
              return { from: fallbackStart, to: end };
         }
         return { from: start, to: end };
    }, [earliestDate, latestDate]);


    useEffect(() => {
        if (typeof window === 'undefined' || !chartContainerRef.current) return;

        const updateColors = () => {
            const computedStyle = getComputedStyle(document.documentElement);
            const backgroundHsl = computedStyle.getPropertyValue('--background').trim();
            const foregroundHsl = computedStyle.getPropertyValue('--foreground').trim();
            const borderHsl = computedStyle.getPropertyValue('--border').trim();
            const mutedForegroundHsl = computedStyle.getPropertyValue('--muted-foreground').trim();

            const isValidHsl = (hsl) => /^\d+(\.\d+)?\s+\d+(\.\d+)?%?\s+\d+(\.\d+)?%?$/.test(hsl);

             const background = isValidHsl(backgroundHsl) ? hslStringToColorString(backgroundHsl, '#ffffff') : (document.body.classList.contains('dark') ? '#09090b' : '#ffffff');
             const foreground = isValidHsl(foregroundHsl) ? hslStringToColorString(foregroundHsl, '#000000') : (document.body.classList.contains('dark') ? '#fafafa' : '#09090b');
             const border = isValidHsl(borderHsl) ? hslStringToColorString(borderHsl, '#e5e7eb') : (document.body.classList.contains('dark') ? '#27272a' : '#e4e4e7');
             const mutedForeground = isValidHsl(mutedForegroundHsl) ? hslStringToColorString(mutedForegroundHsl, '#6b7280') : (document.body.classList.contains('dark') ? '#a1a1aa' : '#71717a');

            const resolvedDatasetColors = {};
            Object.keys(datasetColors).forEach(displayName => {
                 const cssVarMatch = datasetColors[displayName]?.match(/--[\w-]+/);
                 const cssVar = cssVarMatch ? cssVarMatch[0] : null;
                 let colorHsl = cssVar ? getCssVariable(cssVar) : datasetColors[displayName];

                 if (!colorHsl || !isValidHsl(colorHsl)) {
                     colorHsl = '';
                 }
                 resolvedDatasetColors[displayName] = hslStringToColorString(colorHsl, '#8884d8');
            });

            setChartColors({
                background: background,
                foreground: foreground,
                border: border,
                mutedForeground: mutedForeground,
                datasetSpecific: resolvedDatasetColors,
            });

            if (chartRef.current) {
                chartRef.current.applyOptions({
                    layout: { background: { type: ColorType.Solid, color: background }, textColor: foreground },
                    grid: { vertLines: { color: border }, horzLines: { color: border } },
                    crosshair: { vertLine: { color: mutedForeground }, horzLine: { color: mutedForeground } },
                    timeScale: { borderColor: border },
                    rightPriceScale: { borderColor: border },
                });
                seriesRefs.current.forEach((series, displayName) => {
                    if (resolvedDatasetColors[displayName]) {
                        series.applyOptions({ color: resolvedDatasetColors[displayName] });
                    }
                });
            }
        };

        updateColors();
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const themeChangeListener = () => setTimeout(updateColors, 50);
        mediaQuery.addEventListener('change', themeChangeListener);

        return () => {
            mediaQuery.removeEventListener('change', themeChangeListener);
        };
    }, []);


    const findDataPoint = useCallback((seriesData, time) => {
        if (!seriesData || seriesData.length === 0 || time === null || time === undefined) return undefined;
        return seriesData.find(p => {
            if (p.time === undefined || p.time === null) return false;
             if (typeof time === 'string' && typeof p.time === 'string') return p.time === time;
             if (isUTCTimestamp(time) && isUTCTimestamp(p.time)) return p.time === time;

            try {
                 if (isUTCTimestamp(time) && typeof p.time === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(p.time)) {
                    const dataDate = dateFnsParse(p.time, 'yyyy-MM-dd', new Date());
                     dataDate.setUTCHours(12, 0, 0, 0);
                    return dataDate.getTime() / 1000 === time;
                 }
                 if (typeof time === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(time) && isUTCTimestamp(p.time)) {
                    const targetDate = dateFnsParse(time, 'yyyy-MM-dd', new Date());
                    targetDate.setUTCHours(12, 0, 0, 0);
                     return targetDate.getTime() / 1000 === p.time;
                 }
            } catch (e) {
                console.error("Error comparing times:", time, p.time, e);
                 return false;
            }
            return false;
        });
    }, []);


    const getFilteredData = useCallback((rangeOpt, customRange, data) => {
        if (!data || data.length === 0) return [];

        const sortedData = [...data].sort((a, b) => {
            const timeA = a.time;
            const timeB = b.time;
            if (typeof timeA === 'string' && typeof timeB === 'string') return timeA.localeCompare(timeB);
            if (typeof timeA === 'number' && typeof timeB === 'number') return timeA - timeB;
            return 0;
        });

        const latestDataPoint = sortedData[sortedData.length - 1];
        if (!latestDataPoint) return [];

         let latestDataDate;
         try {
             const timeStr = latestDataPoint.time;
             if (typeof timeStr === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(timeStr)) {
                 latestDataDate = dateFnsParse(timeStr, 'yyyy-MM-dd', new Date());
             } else if (isUTCTimestamp(timeStr)){
                  latestDataDate = new Date(timeStr * 1000);
             } else { throw new Error("Invalid latest date format"); }
             if (!isValid(latestDataDate)) throw new Error("Invalid latest date parsed");
             latestDataDate = endOfDay(latestDataDate);
         } catch {
             console.error("Invalid date format in latest data point:", latestDataPoint.time);
             return sortedData;
         }

        let startDate;
        let endDate = latestDate && isValid(latestDate) ? endOfDay(latestDate) : latestDataDate;

        if (rangeOpt === 'CUSTOM' && customRange?.from && isValid(customRange.from)) {
            startDate = startOfDay(customRange.from);
            endDate = customRange.to && isValid(customRange.to) ? endOfDay(customRange.to) : endOfDay(customRange.from);
        } else if (rangeOpt && rangeOpt !== 'ALL' && rangeOpt !== 'CUSTOM') {
            const calculatedRange = calculatePresetRange(rangeOpt, endDate);
            if (calculatedRange?.from && isValid(calculatedRange.from)) {
                startDate = calculatedRange.from;
            }
             if (calculatedRange?.to && isValid(calculatedRange.to)) {
                 endDate = calculatedRange.to < endDate ? calculatedRange.to : endDate;
             }

            const earliestAvailableDate = earliestDate && isValid(earliestDate) ? startOfDay(earliestDate) : undefined;
            if (startDate && earliestAvailableDate && startDate < earliestAvailableDate) {
                startDate = earliestAvailableDate;
            }
        }

        if (!startDate || rangeOpt === 'ALL') {
            const absoluteEarliest = earliestDate && isValid(earliestDate) ? startOfDay(earliestDate) : undefined;
            const absoluteLatest = latestDate && isValid(latestDate) ? endOfDay(latestDate) : latestDataDate;

            return sortedData.filter(item => {
                try {
                    let itemDate;
                    const itemTime = item.time;
                    if (typeof itemTime === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(itemTime)) {
                        itemDate = dateFnsParse(itemTime, 'yyyy-MM-dd', new Date());
                    } else if (isUTCTimestamp(itemTime)) {
                        itemDate = new Date(itemTime * 1000);
                    } else return false;

                    if (!isValid(itemDate)) return false;
                    const itemStart = startOfDay(itemDate);
                    const afterEarliest = absoluteEarliest ? itemStart >= absoluteEarliest : true;
                    const beforeLatest = absoluteLatest ? itemStart <= absoluteLatest : true;
                    return afterEarliest && beforeLatest;
                } catch { return false; }
            });
        }

        return sortedData.filter(item => {
            try {
                let itemDate;
                const itemTime = item.time;
                 if (typeof itemTime === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(itemTime)) {
                     itemDate = dateFnsParse(itemTime, 'yyyy-MM-dd', new Date());
                 } else if (isUTCTimestamp(itemTime)) {
                     itemDate = new Date(itemTime * 1000);
                 } else return false;

                if (!isValid(itemDate)) return false;
                const itemStartOfDay = startOfDay(itemDate);
                return itemStartOfDay >= startDate && itemStartOfDay <= endDate;
            } catch { return false; }
        });

    }, [earliestDate, latestDate, calculatePresetRange]);


    const calculatePriceChange = useCallback((currentValue, dataSetForRange) => {
        if (currentValue === null || isNaN(currentValue) || !dataSetForRange || dataSetForRange.length < 1) {
            return { change: null, percent: null };
        }

        let firstValidValueInRange = null;
        for (const point of dataSetForRange) {
            if (typeof point.value === 'number' && !isNaN(point.value)) {
                firstValidValueInRange = point.value;
                break;
            }
        }

        if (firstValidValueInRange === null) return { change: null, percent: null };
        const change = currentValue - firstValidValueInRange;
        const changePercent = firstValidValueInRange !== 0 ? (change / firstValidValueInRange) * 100 : 0;
        return { change, percent: changePercent };
    }, []);


     const updateDisplayInfo = useCallback((time) => {
         const currentValues = {};
         let currentPrimaryValue = null;
         let primaryChangeInfo = { change: null, percent: null };

         const primaryDataForRange = getFilteredData(activeRangeOption, customDateRange, displayDataSets[primaryDatasetLabel] || []);
         const targetTime = time ?? (primaryDataForRange.length > 0 ? primaryDataForRange[primaryDataForRange.length - 1].time : null);

         if (targetTime !== null) {
             datasetDisplayOrder.forEach(displayName => {
                 const data = displayDataSets[displayName];
                 const dataPoint = findDataPoint(data, targetTime);
                 currentValues[displayName] = dataPoint?.value ?? null;
             });

             currentPrimaryValue = currentValues[primaryDatasetLabel];

             if (typeof currentPrimaryValue === 'number' && primaryDataForRange.length > 0) {
                 const currentPointInRange = findDataPoint(primaryDataForRange, targetTime);
                 if (currentPointInRange && typeof currentPointInRange.value === 'number') {
                      primaryChangeInfo = calculatePriceChange(currentPointInRange.value, primaryDataForRange);
                 } else if (time === null && primaryDataForRange.length > 0) {
                      const lastPointInRange = primaryDataForRange[primaryDataForRange.length - 1];
                     if (lastPointInRange && typeof lastPointInRange.value === 'number') {
                          primaryChangeInfo = calculatePriceChange(lastPointInRange.value, primaryDataForRange);
                     }
                 }
             }
         } else {
              datasetDisplayOrder.forEach(displayName => { currentValues[displayName] = null; });
              primaryChangeInfo = { change: null, percent: null };
         }

         setDisplayInfo({ date: targetTime, values: currentValues, primaryChange: primaryChangeInfo });

     }, [displayDataSets, primaryDatasetLabel, activeRangeOption, customDateRange, getFilteredData, findDataPoint, calculatePriceChange]);



    const applyTimeRange = useCallback((rangeOpt, range, calledFromUpdate = false) => {
         if (!chartRef.current || !displayDataSets[primaryDatasetLabel] || displayDataSets[primaryDatasetLabel].length === 0) {
             if (chartRef.current?.timeScale) {
                 try { chartRef.current.timeScale().resetTimeScale(); } catch(e) { console.error("Error resetting time scale:", e); }
             }
             updateDisplayInfo(null);
             return;
         }

        const primaryData = displayDataSets[primaryDatasetLabel];
        let targetRange = undefined;

        try {
            if (rangeOpt === 'CUSTOM' && range?.from && isValid(range.from)) {
                const fromDate = range.from;
                 const toDate = (range.to && isValid(range.to)) ? range.to : fromDate;
                 const fromChartTime = formatDateForChart(startOfDay(fromDate));
                 const toChartTime = formatDateForChart(endOfDay(toDate));

                 if (fromChartTime && toChartTime) {
                     targetRange = { from: fromChartTime, to: toChartTime };
                 } else { console.warn("Invalid custom range:", range); }

            } else if (rangeOpt && rangeOpt !== 'ALL' && rangeOpt !== 'CUSTOM') {
                 const calculatedRange = calculatePresetRange(rangeOpt, latestDate);
                 if (calculatedRange?.from && isValid(calculatedRange.from) && calculatedRange?.to && isValid(calculatedRange.to)) {
                     const fromChartTime = formatDateForChart(calculatedRange.from);
                     const toChartTime = formatDateForChart(calculatedRange.to);
                      if (fromChartTime && toChartTime) {
                         targetRange = { from: fromChartTime, to: toChartTime };
                     } else { console.warn("Invalid preset calculation:", rangeOpt, calculatedRange); }
                 } else { console.warn("Failed to calculate preset:", rangeOpt); }
            }

            if (chartRef.current?.timeScale) {
                 if (targetRange?.from && targetRange?.to) {
                    chartRef.current.timeScale().setVisibleRange(targetRange);
                } else {
                    chartRef.current.timeScale().fitContent();
                }
            }

        } catch (e) {
            console.error("Error setting visible range:", e, targetRange);
             if (chartRef.current?.timeScale) {
                 try { chartRef.current.timeScale().fitContent(); } catch(e) { console.error("Error fitting content:", e); }
             }
        }
        // Update info display based on latest data within the *new* view
        updateDisplayInfo(null);

    }, [displayDataSets, primaryDatasetLabel, calculatePresetRange, latestDate, updateDisplayInfo]);


    const handleRangeChange = useCallback((range, option) => {
         if (option && option !== 'CUSTOM') {
            setCustomDateRange(undefined);
            _setActiveRangeOption(option);
            const newRange = calculatePresetRange(option, latestDate);
            applyTimeRange(option, newRange);
            setIsDatePickerOpen(false); // Close popover on preset selection
         } else if (range?.from && isValid(range.from)) {
             const finalRange = {
                 from: startOfDay(range.from),
                 to: range.to && isValid(range.to) ? endOfDay(range.to) : endOfDay(range.from)
             };
             if (finalRange.to < finalRange.from) {
                 finalRange.to = finalRange.from;
             }
             setCustomDateRange(finalRange);
             _setActiveRangeOption('CUSTOM');
             applyTimeRange('CUSTOM', finalRange);

             // Close only if a full range is selected
             if (finalRange.from && finalRange.to) {
                 setIsDatePickerOpen(false);
             }
         } else {
             setCustomDateRange(undefined);
             _setActiveRangeOption('ALL');
             applyTimeRange('ALL', undefined);
             setIsDatePickerOpen(false);
         }
     }, [calculatePresetRange, latestDate, applyTimeRange, updateDisplayInfo, earliestDate]); // Added updateDisplayInfo dependency


    const crosshairMoveHandlerRef = useRef(null);
    crosshairMoveHandlerRef.current = (param) => {
        if (!param.point || !param.time) {
             updateDisplayInfo(null);
             return;
        }
        updateDisplayInfo(param.time);
    };


    // Effect for Chart Initialization and Updates
    useEffect(() => {
        if (!chartContainerRef.current || !chartColors || !displayDataSets[primaryDatasetLabel] || displayDataSets[primaryDatasetLabel].length === 0) {
             if (chartRef.current && chartColors) {
                 try {
                     chartRef.current.applyOptions({
                         layout: { background: { type: ColorType.Solid, color: chartColors.background }, textColor: chartColors.foreground },
                         grid: { vertLines: { color: chartColors.border }, horzLines: { color: chartColors.border } },
                         crosshair: { vertLine: { color: chartColors.mutedForeground }, horzLine: { color: chartColors.mutedForeground } },
                         timeScale: { borderColor: chartColors.border },
                         rightPriceScale: { borderColor: chartColors.border },
                     });
                 } catch (e) { console.error("Error applying colors:", e); }
             }
            return;
        }

        const handleResize = () => {
            if (chartRef.current && chartContainerRef.current) {
                 try { chartRef.current.applyOptions({ width: chartContainerRef.current.clientWidth }); }
                 catch (e) { console.error("Resize error:", e); }
            }
        };

        if (!chartRef.current) {
             try {
                 chartRef.current = createChart(chartContainerRef.current, {
                    width: chartContainerRef.current.clientWidth,
                    height: 400,
                    layout: { background: { type: ColorType.Solid, color: chartColors.background }, textColor: chartColors.foreground },
                    grid: { vertLines: { color: chartColors.border }, horzLines: { color: chartColors.border } },
                    crosshair: {
                        mode: CrosshairMode.Normal,
                        vertLine: { color: chartColors.mutedForeground, style: LineStyle.Dashed, labelVisible: false },
                        horzLine: { color: chartColors.mutedForeground, style: LineStyle.Dashed, labelVisible: false },
                    },
                    timeScale: {
                        borderColor: chartColors.border,
                        timeVisible: true,
                        secondsVisible: false,
                        fixLeftEdge: false,
                        fixRightEdge: false,
                        rightOffset: 10,
                    },
                    rightPriceScale: { borderColor: chartColors.border },
                    handleScroll: { mouseWheel: true, pressedMouseMove: true, horzTouchDrag: true, vertTouchDrag: true },
                    handleScale: { axisPressedMouseMove: true, mouseWheel: true, pinch: true },
                 });

                // Subscribe to events
                 if (chartRef.current) {
                    chartRef.current.timeScale().subscribeVisibleTimeRangeChange(setChartVisibleRange);
                    // Ensure the handler exists before subscribing
                     if (crosshairMoveHandlerRef.current) {
                         chartRef.current.subscribeCrosshairMove(crosshairMoveHandlerRef.current);
                     }
                 }

             } catch (e) {
                 console.error("Chart init error:", e);
                 return;
             }

        } else {
            try {
                 chartRef.current.applyOptions({
                    layout: { background: { type: ColorType.Solid, color: chartColors.background }, textColor: chartColors.foreground },
                    grid: { vertLines: { color: chartColors.border }, horzLines: { color: chartColors.border } },
                     crosshair: { vertLine: { color: chartColors.mutedForeground }, horzLine: { color: chartColors.mutedForeground } },
                    timeScale: { borderColor: chartColors.border },
                    rightPriceScale: { borderColor: chartColors.border },
                });
            } catch (e) { console.error("Apply options error:", e); }
        }

        // Add/Update Series
        datasetDisplayOrder.forEach(displayName => {
            const seriesData = displayDataSets[displayName];
            let series = seriesRefs.current.get(displayName);

            if (!Array.isArray(seriesData)) {
                console.warn(`${displayName} data not array.`);
                if (series && chartRef.current?.removeSeries) {
                     try { chartRef.current.removeSeries(series); } catch (e) { console.error("Remove series error:", e); }
                     seriesRefs.current.delete(displayName);
                }
                return;
            }

             const seriesColor = chartColors.datasetSpecific[displayName] || '#8884d8';
             const isPrediction = displayName === predictionDatasetLabel;
             const seriesOptions = {
                 color: seriesColor,
                 lineWidth: displayName === primaryDatasetLabel ? 2 : (isPrediction ? 2 : 1.5),
                 lineStyle: isPrediction ? LineStyle.Dashed : LineStyle.Solid,
                 lastValueVisible: false,
                 priceLineVisible: false,
                 crosshairMarkerVisible: true,
             };

            if (visibleDataSets.has(displayName) && seriesData.length > 0) {
                if (!series) {
                     try {
                         series = chartRef.current?.addLineSeries(seriesOptions);
                         if (series) {
                             seriesRefs.current.set(displayName, series);
                             series.setData(seriesData);
                         }
                     } catch (e) { console.error(`Add series ${displayName} error:`, e); }
                } else {
                     try {
                         series.applyOptions(seriesOptions);
                         series.setData(seriesData);
                     } catch (e) { console.error(`Update series ${displayName} error:`, e); }
                }
            } else {
                if (series && chartRef.current?.removeSeries) {
                     try { chartRef.current.removeSeries(series); }
                     catch (e) { console.error(`Remove series ${displayName} error:`, e); }
                     seriesRefs.current.delete(displayName);
                }
            }
        });

        applyTimeRange(activeRangeOption, customDateRange, true);
        window.addEventListener('resize', handleResize);

        const chartInstance = chartRef.current;
        const handler = crosshairMoveHandlerRef.current;

        return () => {
            window.removeEventListener('resize', handleResize);
             if (chartInstance) {
                try {
                     if (chartInstance.timeScale) {
                         chartInstance.timeScale().unsubscribeVisibleTimeRangeChange(setChartVisibleRange);
                     }
                     if (chartInstance.unsubscribeCrosshairMove && handler) {
                         chartInstance.unsubscribeCrosshairMove(handler);
                     }
                    chartInstance.remove();
                 } catch (e) { console.error("Cleanup error:", e); }
             }
             chartRef.current = null;
             seriesRefs.current.clear();
        };
    }, [
        displayDataSets, chartColors, visibleDataSets, activeRangeOption, customDateRange,
        primaryDatasetLabel, predictionDatasetLabel, applyTimeRange, updateDisplayInfo
    ]); // Simplified dependencies


     // Initial display info update
     useEffect(() => {
        updateDisplayInfo(null);
     }, [activeRangeOption, customDateRange, displayDataSets, visibleDataSets, updateDisplayInfo]);


    const toggleDatasetVisibility = (displayName) => {
        setVisibleDataSets(prev => {
            const newSet = new Set(prev);
            if (newSet.has(displayName)) {
                if (newSet.size > 1 || displayName !== primaryDatasetLabel) {
                    newSet.delete(displayName);
                }
            } else {
                newSet.add(displayName);
            }
            return newSet;
        });
         updateDisplayInfo(null); // Update display info after toggle
    };

     const activeRangeDisplayLabel = (() => {
         if (activeRangeOption && activeRangeOption !== 'ALL' && activeRangeOption !== 'CUSTOM') {
             const preset = DateRangePicker.presets.find(p => p.range === activeRangeOption);
              if (preset?.label === 'MAX') return "(All Time)";
             return `(${preset?.label || activeRangeOption})`;
         } else if (activeRangeOption === 'CUSTOM' && customDateRange?.from && isValid(customDateRange.from)) {
             if (customDateRange.to && isValid(customDateRange.to)) {
                 if (isEqual(startOfDay(customDateRange.from), startOfDay(customDateRange.to))) {
                     return `(${dateFnsFormat(customDateRange.from, "dd MMM yyyy")})`;
                 }
                 return `(${dateFnsFormat(customDateRange.from, "dd MMM")} - ${dateFnsFormat(customDateRange.to, "dd MMM yyyy")})`;
             }
             return `(${dateFnsFormat(customDateRange.from, "dd MMM yyyy")})`;
         }
          return "(All Time)";
     })();


    const visibleRangeString = (() => {
        if (!chartVisibleRange || !chartVisibleRange.from || !chartVisibleRange.to) return null;
        try {
            const from = formatChartDateForDisplay(chartVisibleRange.from);
            const to = formatChartDateForDisplay(chartVisibleRange.to);
            if (from && to) return `${from} - ${to}`;
        } catch (e) { console.error("Error formatting visible range:", e); }
        return null;
    })();

     // Format prediction createdAt timestamp for display
     const formattedPredictionTimestamp = predictionCreatedAt
          ? `Data from: ${predictionCreatedAt}` // Already formatted
          : "Prediction data unavailable.";


    return (
        <div className="flex flex-col space-y-4">
             {/* Info Display Line */}
            <div className="px-1 text-sm text-foreground min-h-[4em] flex flex-col justify-center">
                 <p className="font-semibold">
                    {formatChartDateForDisplay(displayInfo.date) || "Latest"}
                    <span className="ml-2 font-normal text-muted-foreground text-xs">{activeRangeDisplayLabel}</span>
                 </p>
                <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs items-center">
                     {datasetDisplayOrder.map(displayName => {
                        if (visibleDataSets.has(displayName) && displayName in displayInfo.values) {
                            const value = displayInfo.values[displayName];
                            const color = chartColors?.datasetSpecific[displayName] ?? 'hsl(var(--foreground))';
                            const formattedValue = formatDisplayValue(value, displayName); // Pass displayName
                            const valueColorClass = displayName === 'Bar Price Change' ? getPriceChangeColor(value) : 'text-foreground';

                            return (
                                <span key={displayName} className="flex items-center whitespace-nowrap">
                                     <span style={{ color: color, fontSize: '1.2em' }} className="mr-1.5 leading-none">&#9679;</span>
                                     <span className="text-muted-foreground mr-1">{displayName}:</span>
                                     <span className={`font-medium ${valueColorClass}`}>{formattedValue}</span>
                                </span>
                             );
                         }
                        return null;
                    })}
                </div>
                 {visibleDataSets.has(primaryDatasetLabel) && displayInfo.primaryChange && displayInfo.primaryChange.change !== null && (
                     <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs mt-1">
                         <span className="flex items-center whitespace-nowrap">
                            <span className="text-muted-foreground mr-1">{primaryDatasetLabel} Change:</span>
                            <span className={`font-medium ${getPriceChangeColor(displayInfo.primaryChange.change)}`}>
                                {formatPriceChange(displayInfo.primaryChange.change)}
                            </span>
                            <span className={`font-medium ml-1 ${getPriceChangeColor(displayInfo.primaryChange.change)}`}>
                                ({formatPriceChangePercent(displayInfo.primaryChange.percent)})
                            </span>
                         </span>
                     </div>
                 )}
                {visibleDataSets.has(predictionDatasetLabel) && (
                    <div className="text-xs text-muted-foreground mt-1">
                        {isLoadingPrediction ? "Loading prediction..." :
                         predictionError ? <span className="text-destructive">{predictionError}</span> :
                         formattedPredictionTimestamp}
                    </div>
                )}
            </div>


            {/* Chart */}
            <div ref={chartContainerRef} className="w-full h-[400px] cursor-crosshair rounded-md shadow-inner bg-card border border-border" />

             {/* Visible Range Display */}
             {visibleRangeString && (
                <div className="text-center text-xs text-muted-foreground mt-1">
                    Visible Range: {visibleRangeString}
                </div>
            )}


             {/* Controls Area */}
             <div className="flex flex-col md:flex-row md:items-start md:justify-between px-1 pt-4 gap-4 border-t border-border">

                  {/* Legend/Dataset Toggles (Top Right on MD+) */}
                 <div className="flex flex-wrap gap-x-4 gap-y-2 justify-start md:justify-end md:order-2 md:pt-0 pt-2">
                      {datasetDisplayOrder
                          .filter(displayName => displayDataSets[displayName])
                          .map((displayName) => (
                          <div key={displayName} className="flex items-center space-x-2">
                              <Checkbox
                                  id={`checkbox-${displayName.replace(/\s+/g, '-')}`}
                                  checked={visibleDataSets.has(displayName)}
                                  onCheckedChange={() => toggleDatasetVisibility(displayName)}
                                  disabled={visibleDataSets.size === 1 && visibleDataSets.has(displayName) && displayName === primaryDatasetLabel}
                                  className="border-muted-foreground data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground disabled:opacity-50 disabled:cursor-not-allowed"
                                  aria-label={`Toggle visibility for ${displayName}`}
                              />
                              <Label
                                  htmlFor={`checkbox-${displayName.replace(/\s+/g, '-')}`}
                                  className="text-sm font-medium text-foreground cursor-pointer flex items-center gap-1.5"
                              >
                                  <span
                                     className="inline-block w-3 h-3 rounded-sm border border-border"
                                     style={{
                                         backgroundColor: chartColors?.datasetSpecific[displayName] ?? 'transparent',
                                         borderStyle: displayName === predictionDatasetLabel ? 'dashed' : 'solid',
                                         borderColor: chartColors?.datasetSpecific[displayName] ?? 'hsl(var(--border))'
                                     }}>
                                  </span>
                                  <span style={{ color: chartColors?.datasetSpecific[displayName] ?? 'currentColor' }}>
                                     {displayName}
                                  </span>
                              </Label>
                          </div>
                      ))}
                  </div>

                  {/* Date Range Picker & Model Select (Bottom Left on MD+) */}
                 <div className="flex flex-wrap gap-2 items-center justify-start md:order-1">
                     <DateRangePicker
                         currentRange={customDateRange}
                         activeOption={activeRangeOption}
                         onRangeChange={handleRangeChange}
                         earliestDate={earliestDate}
                         latestDate={latestDate}
                         align="start"
                         isOpen={isDatePickerOpen}
                         onOpenChange={setIsDatePickerOpen}
                     />
                     <Select value={selectedModel} onValueChange={setSelectedModel}>
                         <SelectTrigger className="w-[180px] h-9 text-xs">
                             <SelectValue placeholder="Select Model" />
                         </SelectTrigger>
                         <SelectContent>
                             {[...Array(7)].map((_, i) => (
                                 <SelectItem key={i + 1} value={(i + 1).toString()}>
                                     Model {i + 1}
                                 </SelectItem>
                             ))}
                         </SelectContent>
                     </Select>
                 </div>

            </div>

        </div>
    );
};

// --- GoldTH Component (from GoldTH.jsx) ---

const GoldTH = ({ initialDataSets, error }) => {
  return (
    <main className="flex min-h-screen flex-col items-center justify-start p-4 md:p-8 lg:p-12 bg-background">
      <Card className="w-full max-w-6xl shadow-lg rounded-lg">
        <CardHeader className="border-b">
          <CardTitle className="text-2xl font-semibold text-foreground">Gold Price Tracker</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          {error ? (
            <div className="text-center text-destructive p-4 border border-destructive/50 rounded-md bg-destructive/10">
                <p className="font-semibold">Error Loading Data</p>
                <p className="text-sm">{error}</p>
            </div>
          ) : initialDataSets ? (
            <GoldTHChart initialDataSets={initialDataSets} />
          ) : (
             <div className="text-center text-muted-foreground">Loading chart data...</div>
          )}
        </CardContent>
      </Card>
    </main>
  );
};


// --- Main App Component (from page.jsx) ---

export default function GoldChartApp() {
  const [goldPriceDataSets, setGoldPriceDataSets] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true); // Add loading state

  useEffect(() => {
    async function loadData() {
      setIsLoading(true); // Start loading
      setError(null); // Clear previous errors
      try {
        const data = await fetchGoldPrices();
        setGoldPriceDataSets(data);
      } catch (e) {
        console.error("Failed to fetch initial gold prices:", e);
        setError(`Failed to load gold price data: ${e instanceof Error ? e.message : String(e)}. Please try again later.`);
        setGoldPriceDataSets(null); // Ensure data is null on error
      } finally {
        setIsLoading(false); // Finish loading
      }
    }
    loadData();
  }, []); // Run only once on mount


  // Render loading state, error state, or the chart component
  if (isLoading) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-4 md:p-8 lg:p-12 bg-background">
        <p className="text-muted-foreground">Loading chart data...</p>
      </main>
    );
  }

  return (
     <GoldTH initialDataSets={goldPriceDataSets} error={error} />
  );
}