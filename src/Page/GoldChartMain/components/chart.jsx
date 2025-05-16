import React, { useEffect, useRef, useState, useContext, useMemo, useCallback } from 'react';
import { createChart, LineStyle, CrosshairMode, LineType } from 'lightweight-charts';
import { format as formatDateFns, isValid } from 'date-fns';
import { debugChartData } from './chart.debug.js';
import { useTheme } from '@/components/theme-provider';
import { formatDate } from '@/lib/utils.js';


// Chart base options with theme support - no transitions
const getChartOptions = (theme) => ({
    layout: {
        textColor: theme === 'dark' ? '#e1e1e1' : '#333333',
        background: { 
            type: 'solid', 
            color: theme === 'dark' ? '#1a1a1a' : '#ffffff' 
        },
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif",
        // Remove transition for instant theme change
    },
    crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: {
            color: theme === 'dark' ? '#555555' : '#e1e1e1',
            labelBackgroundColor: theme === 'dark' ? '#444444' : '#f0f0f0',
            style: LineStyle.Dashed,
        },
        horzLine: {
            color: theme === 'dark' ? '#555555' : '#e1e1e1',
            labelBackgroundColor: theme === 'dark' ? '#444444' : '#f0f0f0',
            style: LineStyle.Dashed,
        },
    },
    timeScale: {
        fixLeftEdge: true,
        fixRightEdge: true,
        borderVisible: false,
        borderColor: theme === 'dark' ? '#444444' : '#e1e1e1',
        timeVisible: true,
        tickMarkFormatter: (time, tickMarkType, locale) => {
            const date = new Date(time * 1000);
            return formatDateFns(date, "dd MMM ''yy");
        },
        allowTickMarksCompression: false,
    },
    priceScale: {
        autoScale: true,
        position: 'right',
        borderColor: theme === 'dark' ? '#444444' : '#e1e1e1',
    },    
    grid: {
        vertLines: {
            color: theme === 'dark' ? '#292929' : '#f0f0f0',
            style: LineStyle.Solid,
        },
        horzLines: {
            color: theme === 'dark' ? '#292929' : '#f0f0f0',
            style: LineStyle.Solid,
        },
    },
    animation: {
        duration: 0, // set to zero for instant changes
    },
});

const baseSeriesConfigs = {
    GOLD_TH: [
        { key: 'barBuyData', color: 'blue', name: 'Bar Buy', addToChart: true, defaultVisible: true, lineStyle: LineStyle.Solid },
        { key: 'barBuyPredictData', color: '#42a5f5', name: 'Bar Buy (Predict)', addToChart: true, defaultVisible: true, lineStyle: LineStyle.Dashed },
        { key: 'barSellData', color: 'red', name: 'Bar Sell', addToChart: true, defaultVisible: true, lineStyle: LineStyle.Solid },
        { key: 'ornamentBuyData', color: 'green', name: 'Ornament Buy', addToChart: true, defaultVisible: true, lineStyle: LineStyle.Solid },
        { key: 'ornamentSellData', color: 'orange', name: 'Ornament Sell', addToChart: true, defaultVisible: true, lineStyle: LineStyle.Solid },
    ],    
    GOLD_US: {
        line: [
            { key: 'openData', color: 'blue', name: 'Open', addToChart: true, defaultVisible: true, lineStyle: LineStyle.Solid },
            { key: 'highData', color: 'green', name: 'High', addToChart: true, defaultVisible: true, lineStyle: LineStyle.Solid },
            { key: 'lowData', color: 'red', name: 'Low', addToChart: true, defaultVisible: true, lineStyle: LineStyle.Solid },
            { key: 'closeData', color: '#26a69a', name: 'Close', addToChart: true, defaultVisible: true, lineStyle: LineStyle.Solid },
        ],
        candlestick: [
            { key: 'ohlc', name: 'Close', addToChart: true, defaultVisible: true, type: 'candlestick' },
        ]
    },    
    USD_THB: {
        line: [
            { key: 'openData', color: 'blue', name: 'Open', addToChart: true, defaultVisible: true, lineStyle: LineStyle.Solid },
            { key: 'highData', color: 'green', name: 'High', addToChart: true, defaultVisible: true, lineStyle: LineStyle.Solid },
            { key: 'lowData', color: 'red', name: 'Low', addToChart: true, defaultVisible: true, lineStyle: LineStyle.Solid },
            { key: 'closeData', color: '#26a69a', name: 'Close', addToChart: true, defaultVisible: true, lineStyle: LineStyle.Solid },
        ],
        candlestick: [
            { key: 'ohlc', name: 'Close', addToChart: true, defaultVisible: true, type: 'candlestick' },
        ]
    },
};

const processTimeSeriesData = (data, isCandlestick = false) => {
    if (!Array.isArray(data) || data.length === 0) {
        return [];
    }
    
    // Normalize and sort data; assume API returns unique timestamps
    const result = data
      .filter(item => item && typeof item.time === 'number')
      .map(item => {
        if (isCandlestick) {
          // For candlestick chart, ensure all OHLC properties are numbers
          return {
            time: item.time,
            open: typeof item.open === 'number' ? item.open : Number(item.open),
            high: typeof item.high === 'number' ? item.high : Number(item.high),
            low: typeof item.low === 'number' ? item.low : Number(item.low),
            close: typeof item.close === 'number' ? item.close : Number(item.close),
          };
        }
        return {
          time: item.time,
          value: typeof item.value === 'number' ? item.value : Number(item.value),
        };
      });
      
    // Sort by time
    return result.sort((a, b) => a.time - b.time);
};

// Convert OHLC data to line chart format
const convertOhlcDataToLines = (ohlcData) => {
    if (!Array.isArray(ohlcData) || ohlcData.length === 0) {
        return {
            openData: [],
            highData: [],
            lowData: [],
            closeData: []
        };
    }
    
    const openData = [];
    const highData = [];
    const lowData = [];
    const closeData = [];
    
    ohlcData.forEach(item => {
        if (item && typeof item.time === 'number') {
            const time = item.time;
            if (typeof item.open === 'number') {
                openData.push({ time, value: item.open });
            }
            if (typeof item.high === 'number') {
                highData.push({ time, value: item.high });
            }
            if (typeof item.low === 'number') {
                lowData.push({ time, value: item.low });
            }
            if (typeof item.close === 'number') {
                closeData.push({ time, value: item.close });
            }
        }
    });
    
    return {
        openData: openData.sort((a, b) => a.time - b.time),
        highData: highData.sort((a, b) => a.time - b.time),
        lowData: lowData.sort((a, b) => a.time - b.time),
        closeData: closeData.sort((a, b) => a.time - b.time)
    };
};



const Chart = ({ chartData: rawChartData, category = 'GOLD_TH', chartStyle = 'line', dateRange }) => {
  // Process and debug chart data before using it (use full data set)
  const chartRenderIdRef = useRef(Math.random().toString(36).substr(2, 9));
  console.log('[CHART COMPONENT] Props received:', { 
    category, 
    chartStyle, 
    dateRangeFrom: dateRange?.from ? dateRange.from.toISOString() : 'none',
    dateRangeTo: dateRange?.to ? dateRange.to.toISOString() : 'none',
    hasData: !!rawChartData,
    hasOHLC: rawChartData && rawChartData.ohlc ? `Yes (${rawChartData.ohlc.length} items)` : 'No',
    renderId: chartRenderIdRef.current // Use a stable ID for tracking re-renders
  });
  
  const chartData = useMemo(() => {
    console.log(`Calling debugChartData for ${category}...`);
    return debugChartData(rawChartData, category);
  }, [rawChartData, category]);
  
  const chartContainerRef = useRef(null);
  
  // Get current theme from context
  const { theme } = useTheme();
  // For GOLD_TH, we always use line style
  const effectiveChartStyle = category === 'GOLD_TH' ? 'line' : chartStyle;
  
  // Log chart settings for debugging
  console.log('Chart render settings:', { 
    category, 
    chartStyle, 
    effectiveChartStyle,
    isGoldThCategory: category === 'GOLD_TH',
    willUseCandlesticks: effectiveChartStyle === 'candlestick'
  });

  // Store chart settings in a ref to detect changes
  const chartSettingsRef = useRef({
    category,
    effectiveChartStyle,
    theme
  });
  
  // Update the ref when settings change
  useEffect(() => {
    chartSettingsRef.current = {
      category,
      effectiveChartStyle,
      theme
    };
  }, [category, effectiveChartStyle, theme]);
  
  // Get the appropriate series configs based on category and chart style
  let currentSeriesConfigs = [];
  if (category === 'GOLD_TH') {
    currentSeriesConfigs = baseSeriesConfigs[category];
  } else if (category === 'GOLD_US' || category === 'USD_THB') {
    // For GOLD_US or USD_THB, use different configs based on chart style
    if (effectiveChartStyle === 'line') {
      currentSeriesConfigs = baseSeriesConfigs[category].line;    } else if (effectiveChartStyle === 'candlestick') {
      // In candlestick mode, we only want to show the candlestick chart without line overlays
      // So we'll only use the candlestick series configuration
      currentSeriesConfigs = [...baseSeriesConfigs[category].candlestick];
    }
  }
  
  // Prepare data based on chart style
  useEffect(() => {
    if (!chartData) return;
    
    // For line mode, convert OHLC data to line chart format
    if ((category === 'GOLD_US' || category === 'USD_THB')) {
      if (chartData.ohlc) {
        console.log('Processing OHLC data for chart display');
        // Always convert OHLC data to line format for potential overlay
        const lineData = convertOhlcDataToLines(chartData.ohlc);
        Object.assign(chartData, lineData);
        
        if (effectiveChartStyle === 'candlestick') {
          console.log('Using data for candlestick mode, OHLC available:', Boolean(chartData.ohlc));
        }
      }
    }
  }, [category, effectiveChartStyle, chartData]);
  
  const seriesVisibilityRef = useRef({});
  
  // Initialize seriesVisibility once when the configs change
  const seriesVisibility = useMemo(() => {
    console.log('Initializing series visibility state');
    const initial = {};
    currentSeriesConfigs.forEach(config => {
      // Initialize visibility based on chart style
      if (effectiveChartStyle === 'candlestick') {
        if (config.type === 'candlestick') {
          initial[config.key] = true; // Always show candlestick in candlestick mode
        } else if (config.key.startsWith('ohlc_')) {
          initial[config.key] = true; // Show OHLC legends in candlestick mode
        } else {
          initial[config.key] = false; // Hide line series in candlestick mode
        }
      } else {
        initial[config.key] = config.defaultVisible;
      }
    });
    
    // Update the ref - we'll use this for comparisons to avoid unnecessary state updates
    seriesVisibilityRef.current = initial;
    return initial;
  }, [currentSeriesConfigs, effectiveChartStyle]);
  
  // Toggle visibility function (for use in click handlers)
  const toggleSeriesVisibility = useCallback((configKey) => {
    const newVisibility = !seriesVisibilityRef.current[configKey];
    
    // Update the ref immediately
    seriesVisibilityRef.current = {
      ...seriesVisibilityRef.current,
      [configKey]: newVisibility
    };
    
    // Return the new ref value - we'll use this in event handlers
    return seriesVisibilityRef.current;
  }, []);
  
  useEffect(() => {
    // ตรวจสอบว่ามี DOM element สำหรับกราฟหรือไม่
    if (!chartContainerRef.current) {
      return;
    }
    
    // ล้าง container เพื่อสร้างกราฟใหม่ทุกครั้ง
    chartContainerRef.current.innerHTML = '';
    
    // แม้ไม่มีข้อมูลก็ยังสร้างกราฟเปล่าเพื่อให้แสดงผลไว้
    const chartDataToUse = chartData || {};

    // Create container for legends that will be placed above the chart
    const styledLegendContainer = document.createElement('div');
    styledLegendContainer.style = `
      position: relative; 
      display: flex; flex-wrap: wrap; gap: 8px; font-size: 12px;
      font-family: sans-serif; line-height: 18px; font-weight: 300;
      background: ${theme === 'dark' ? '#1a1a1a' : '#ffffff'}; 
      color: ${theme === 'dark' ? '#e1e1e1' : '#333333'};
      padding: 8px; 
      border-bottom: 1px solid ${theme === 'dark' ? '#444444' : '#e5e7eb'};
      margin-bottom: 8px;
      visibility: visible;
      opacity: 1;
      z-index: 5;
    `;
    
    // Create a container for the actual chart
    const chartElement = document.createElement('div');
    chartElement.style = `
      position: relative; 
      width: 100%; 
      height: calc(100% - 40px);
    `;
    
    // Force immediate DOM update to ensure containers are properly mounted
    chartContainerRef.current.appendChild(styledLegendContainer);
    chartContainerRef.current.appendChild(chartElement);
    
    // Apply the chart options based on the current theme
    const chart = createChart(chartElement, {
      ...getChartOptions(theme),
      width: chartElement.clientWidth,
      height: chartElement.clientHeight,
      handleScale: {
        axisPressedMouseMove: true,
      },
      handleScroll: {
        pressedMouseMove: true,
      },
      timeScale: {
        timeVisible: true,
        rightOffset: 12,
        barSpacing: 10,
        fixLeftEdge: true,
        lockVisibleTimeRangeOnResize: true,
        borderColor: theme === 'dark' ? '#444444' : '#e1e1e1',
        tickMarkFormatter: (time) => {
          const date = new Date(time * 1000);
          return formatDateFns(date, "dd MMM ''yy");
        },
        rightBarStaysOnScroll: true,
      },
    });
    
    const seriesInstances = {};
    
    // We won't prepare OHLC line series data for candlestick mode anymore
    // since we're showing only candlesticks in that mode
    
    currentSeriesConfigs.forEach(config => {
        // Should we add this series to the chart?
        const shouldAddToChart = config.addToChart || 
                               (effectiveChartStyle === 'candlestick' && config.type === 'candlestick');
                                 // Skip non-chart series that are not visible in their current mode
        if (!shouldAddToChart && config.key !== 'priceChangeData' && !seriesVisibility[config.key]) {
            console.log(`Skipping addition of series ${config.key} - not for chart display`);
            return;
        }

        let rawSeriesData = [];
        let processedSeriesDataForChart = [];

            if (category === 'GOLD_TH') {
                rawSeriesData = chartDataToUse[config.key] || [];
                processedSeriesDataForChart = processTimeSeriesData(rawSeriesData);
            } else if ((category === 'GOLD_US' || category === 'USD_THB') && config.type === 'candlestick') {
                if (Array.isArray(chartDataToUse.ohlc)) {
                    console.log('Raw OHLC data:', chartDataToUse.ohlc.slice(0, 2));
                    
                    rawSeriesData = chartDataToUse.ohlc.filter(item => 
                        item && typeof item.time === 'number' && 
                        typeof item.open === 'number' && 
                        typeof item.high === 'number' && 
                        typeof item.low === 'number' && 
                        typeof item.close === 'number'
                    );
                    
                    if (rawSeriesData.length === 0) {
                        console.error('No valid OHLC data points found after filtering!');
                    }
                    
                    // Direct mapping for candlestick format with improved robustness
                    processedSeriesDataForChart = rawSeriesData.map(item => ({
                        time: item.time,
                        open: Number(item.open),
                        high: Number(item.high),
                        low: Number(item.low),
                        close: Number(item.close)
                    }))
                    .filter(item => 
                        // Additional validation - ensure all numbers are finite and high >= low
                        isFinite(item.open) && isFinite(item.high) && 
                        isFinite(item.low) && isFinite(item.close) &&
                        item.high >= item.low
                    )
                    .sort((a, b) => a.time - b.time);
                    
                    console.log(`Candlestick data processed: ${processedSeriesDataForChart.length} points, sample:`, 
                        processedSeriesDataForChart.length > 0 ? processedSeriesDataForChart[0] : 'none');
                } else {
                    console.error('No OHLC array found in chartData!', chartDataToUse);
                }
            } else if (category === 'GOLD_US' || category === 'USD_THB') {
                // For line chart style with OHLC data
                rawSeriesData = chartDataToUse[config.key] || [];
                processedSeriesDataForChart = processTimeSeriesData(rawSeriesData);
            }
            
            if (config.addToChart && processedSeriesDataForChart && processedSeriesDataForChart.length > 0) {
                try {
                    if (config.type === 'candlestick') {
                        console.log('Creating candlestick series, visible:', effectiveChartStyle === 'candlestick', 'data points:', processedSeriesDataForChart.length);
                        const candleOptions = {
                            upColor: '#26a69a', 
                            downColor: '#ef5350',
                            borderDownColor: '#ef5350', 
                            borderUpColor: '#26a69a',
                            wickDownColor: '#ef5350', 
                            wickUpColor: '#26a69a',
                            // Always create visible - controlled by style not by toggles
                            visible: effectiveChartStyle === 'candlestick',
                        };
                        console.log('Candlestick options:', candleOptions);
                        
                        // Create the candlestick series
                        seriesInstances[config.key] = chart.addCandlestickSeries(candleOptions);
                        
                        // Set data with logging
                        if (processedSeriesDataForChart.length > 0) {
                            console.log('Setting candlestick data, sample:', processedSeriesDataForChart.slice(0, 2));
                            seriesInstances[config.key].setData(processedSeriesDataForChart);
                            console.log('Candlestick series created and data set successfully');
                            
                            // Ensure the chart can be manipulated properly with candlesticks
                            chart.applyOptions({
                                handleScale: {
                                    axisPressedMouseMove: {
                                        time: true,
                                        price: true,
                                    },
                                    mouseWheel: true,
                                    pinch: true,
                                },
                                handleScroll: {
                                    horzTouchDrag: true,
                                    vertTouchDrag: true,
                                    pressedMouseMove: true,
                                },
                            });
                        } else {
                            console.error('No processed data available for candlestick chart!');
                        }                    } else {
                        // Only create line series when in line chart mode
                        if (effectiveChartStyle !== 'candlestick') {
                            // For line series, standard visibility behavior
                            let isVisible = seriesVisibility[config.key];
                            
                            seriesInstances[config.key] = chart.addLineSeries({
                                color: config.color,
                                lineWidth: 2,
                                visible: isVisible,
                                lineStyle: config.lineStyle || LineStyle.Solid,
                            });
                            seriesInstances[config.key].setData(processedSeriesDataForChart);
                        } else {
                            console.log(`Skipping line series ${config.key} in candlestick mode`);
                        }
                    }
                } catch (e) {
                    console.error(`Error setting data for series ${config.key}:`, e);
                }
            }
            if (config.key === 'priceChangeData' && chartData[config.key]) {                 
                // This section handles ensuring chartData is properly processed for legend logic
            }
        }
    );

    const formatDate = (timestamp) => {
        if (!timestamp && timestamp !== 0) return 'N/A';
        const date = new Date(timestamp * 1000);
        if (!isValid(date)) return 'N/A';

        return formatDateFns(date, 'EEE d MMM yy');
    };

    let effectiveToTimestamp;
    // Get the end of day timestamp for the selected end date
    const originalToTimestamp = dateRange?.to ? Math.floor(dateRange.to.getTime() / 1000) : null;
    
    // For GoldUS and USDTHB, we need to adjust the time to match the data's time
    let adjustedToTimestamp = originalToTimestamp;
    if (originalToTimestamp) {
        if (category === 'GOLD_US') {
            // GoldUS data is at 00:00, so use start of day
            const date = new Date(dateRange.to);
            date.setHours(0, 0, 0, 0);
            adjustedToTimestamp = Math.floor(date.getTime() / 1000);
        } else if (category === 'USD_THB') {
            // USDTHB data is at 17:00, so set to that specific time
            const date = new Date(dateRange.to);
            date.setHours(17, 0, 0, 0);
            adjustedToTimestamp = Math.floor(date.getTime() / 1000);
        } else if (category === 'GOLD_TH') {
            // GoldTH data is at 10:00, so set to that specific time
            const date = new Date(dateRange.to);
            date.setHours(10, 0, 0, 0);
            adjustedToTimestamp = Math.floor(date.getTime() / 1000);
        }
    }
    
    let maxPredictionTimestamp = null;
    
    // We'll only use prediction timestamp for GoldTH and only when showing predictions
    if (category === 'GOLD_TH' && chartDataToUse?.barBuyPredictData && chartDataToUse.barBuyPredictData.length > 0) {
        const processedPredictions = processTimeSeriesData(chartDataToUse.barBuyPredictData);
        if (processedPredictions.length > 0) {
            maxPredictionTimestamp = processedPredictions[processedPredictions.length - 1].time;
        }
    }    // For GoldTH with predictions, consider prediction timestamps
    if (category === 'GOLD_TH' && adjustedToTimestamp) {
        // Always use the selected date for GoldTH, don't extend to prediction dates
        effectiveToTimestamp = adjustedToTimestamp;
    } else if (adjustedToTimestamp) {
        // For GoldUS and USDTHB, always use exactly what user selected
        effectiveToTimestamp = adjustedToTimestamp;
    } else {
        effectiveToTimestamp = null;
    }
    
    if (dateRange && dateRange.from && isValid(dateRange.from) && effectiveToTimestamp) {
        const fromTimestamp = Math.floor(dateRange.from.getTime() / 1000);
        if (fromTimestamp <= effectiveToTimestamp) {
            try {
                chart.timeScale().setVisibleRange({ from: fromTimestamp, to: effectiveToTimestamp });
            } catch (e) {
                console.warn('Chart.jsx: setVisibleRange error, falling back to fitContent.', e);
                chart.timeScale().fitContent();
            }
        } else {
            chart.timeScale().fitContent();
        }
    } else {
        chart.timeScale().fitContent();
    }
    
    // Removed VertLine implementation

    const currentDateTimestamp = Math.floor(new Date(new Date().setHours(17, 0, 0, 0)).getTime() / 1000);
    
    if (seriesInstances.barBuyPredictData) {
        seriesInstances.barBuyPredictData.setMarkers([
            {
                time: currentDateTimestamp,
                position: 'aboveBar',
                color: '#23b8a6',
                shape: 'arrowDown',
                text: 'Current Day',
                size: 1.3,
            },
            {
                time: currentDateTimestamp,
                position: 'inBar',
                color: '#23b8a6',
                shape: 'circle',
                size: 0.2,
            },
        ]);
    }

    // Create legends with improved styling
    const dateLegendRow = document.createElement('div');
    dateLegendRow.style = `
      display: flex; align-items: center; 
      border: 1px solid ${theme === 'dark' ? '#555555' : '#444444'};
      border-radius: 4px; overflow: hidden; box-sizing: border-box; cursor: default;
      opacity: 1;
      visibility: visible;
    `;
    
    const dateLeftBox = document.createElement('div');
    dateLeftBox.style = `
      background: transparent; 
      padding: 4px 8px; 
      text-align: left; 
      color: ${theme === 'dark' ? '#e1e1e1' : '#333333'};
    `;
    dateLeftBox.textContent = 'Date';
    
    const dateRightBox = document.createElement('div');
    dateRightBox.style = `
      background: ${theme === 'dark' ? '#444444' : '#333333'}; 
      color: ${theme === 'dark' ? '#ffffff' : '#ffffff'}; 
      padding: 4px 8px; 
      text-align: center; 
      min-width: 100px;
    `;
    dateRightBox.textContent = 'N/A';
    
    dateLegendRow.appendChild(dateLeftBox);
    dateLegendRow.appendChild(dateRightBox);
    styledLegendContainer.appendChild(dateLegendRow);

    const seriesLegendElements = [];

    const updateLegendStyle = (legendElement, isVisibleConfig, configForStyle) => {
        if (!legendElement || !legendElement.children || legendElement.children.length < 2) return;
        
        const leftBox = legendElement.children[0];
        const valueBox = legendElement.children[1];
        const displayColor = configForStyle.type === 'candlestick' ? (isVisibleConfig ? '#26a69a' : 'grey') : (configForStyle.color || 'grey');

        legendElement.style.opacity = isVisibleConfig ? '1' : '0.5';
        legendElement.style.borderColor = isVisibleConfig ? displayColor : 'grey';
        legendElement.style.visibility = 'visible';
        
        if (leftBox) {
            leftBox.style.textDecoration = isVisibleConfig ? 'none' : 'line-through';
            leftBox.style.color = theme === 'dark' ? '#e1e1e1' : '#333333';
        }
        
        if (valueBox) {
            valueBox.style.textDecoration = isVisibleConfig ? 'none' : 'line-through';
            valueBox.style.background = isVisibleConfig ? displayColor : 'grey';
            valueBox.style.color = 'white';
        }
    };    currentSeriesConfigs.forEach(config => {
        let legendDataExists = false;
        if (category === 'GOLD_TH' && chartDataToUse[config.key]) {
            legendDataExists = true;
        } else if ((category === 'GOLD_US' || category === 'USD_THB')) {
            // In candlestick mode, only show the candlestick legend
            if (effectiveChartStyle === 'candlestick') {
                if (config.type === 'candlestick' && chartDataToUse.ohlc && chartDataToUse.ohlc.length > 0) {
                    legendDataExists = true;
                } else {
                    // Skip non-candlestick items in candlestick mode
                    return;
                }
            } else if (effectiveChartStyle === 'line' && chartDataToUse[config.key] && chartDataToUse[config.key].length > 0) {
                // In line mode, show all line series legends
                legendDataExists = true;
            }
        }
        
        // Show legends even if no data exists
        if (!legendDataExists && config.key !== 'priceChangeData') return;
        
        const legendRow = document.createElement('div');
        const legendBorderColor = config.type === 'candlestick' ? (seriesVisibility[config.key] ? '#26a69a' : 'grey') : (config.color || 'grey');
        legendRow.style = `
            display: flex; align-items: center; border: 1px solid ${legendBorderColor};
            border-radius: 4px; overflow: hidden; box-sizing: border-box;
            cursor: pointer; 
            opacity: 1;
            visibility: visible;
            color: ${theme === 'dark' ? '#e1e1e1' : '#333333'};
        `;
      
      const nameBox = document.createElement('div');
      nameBox.style = `
        background: transparent; 
        padding: 4px 8px; 
        text-align: left; 
        color: ${theme === 'dark' ? '#e1e1e1' : '#333333'};
      `;
      nameBox.textContent = config.name;
      legendRow.appendChild(nameBox);
      
      const valueBox = document.createElement('div');
      valueBox.style = `
        background: ${config.color || (config.type === 'candlestick' ? '#26a69a' : 'transparent')}; 
        color: white; padding: 4px 8px; text-align: center; min-width: 75px;
      `;      
      if (config.type === 'candlestick' && effectiveChartStyle === 'candlestick') {
          valueBox.textContent = 'OHLC';
          valueBox.style.background = '#26a69a'; // Always green for candlestick
      } else {
          valueBox.textContent = '0.00';
      }
      legendRow.appendChild(valueBox);
      styledLegendContainer.appendChild(legendRow);
      
      const legendItem = { element: legendRow, config: config, nameBox, valueBox, clickHandler: null };
      seriesLegendElements.push(legendItem);
      updateLegendStyle(legendRow, seriesVisibility[config.key], config);
      
      legendItem.clickHandler = (e) => {
          e.preventDefault();
          const config = legendItem.config;
          const newVisibilitySetting = toggleSeriesVisibility(config.key);
          const newVisibilityForKey = newVisibilitySetting[config.key];
            // For candlestick mode, we need special handling
          if (effectiveChartStyle === 'candlestick') {
            // In candlestick mode, we only have the candlestick series visible
            if (config.type === 'candlestick') {
              // Always keep the candlestick visible, we just update the UI state
              if (seriesInstances[config.key]) {
                console.log('Toggle clicked on candlestick series, keeping visibility ON');
                seriesInstances[config.key].applyOptions({ visible: true });
              }
            } else {
              // For other series in candlestick mode, we just update the UI
              // but don't actually toggle visibility since we don't show line series in candlestick mode
              console.log(`Toggle clicked on series in candlestick mode: ${config.key}. No action taken as we don't show lines in candlestick mode.`);
            }
          } else if (config.addToChart && seriesInstances[config.key] && seriesInstances[config.key].applyOptions) {
            // In line mode, normal behavior - toggle visibility of the series
            seriesInstances[config.key].applyOptions({ visible: newVisibilityForKey });
          }
          
          // Always update the legend style directly - no need for setState
          updateLegendStyle(legendRow, newVisibilityForKey, config);
        };
      
      legendRow.addEventListener('click', legendItem.clickHandler);
    });
    
    // Force legends to have consistent height
    setTimeout(() => {
        if (!dateLegendRow || !dateLegendRow.isConnected) return;
        const dateLegendHeight = dateLegendRow.offsetHeight;
        if (dateLegendHeight > 0) {
            seriesLegendElements.forEach(item => {
                if (item.element.isConnected) {
                    item.element.style.height = `${dateLegendHeight}px`;
                }
            });
        }
    }, 0);    let dataForDefaultDate = [];
    
    // Choose which data series to use for the default date display
    // and filter it to be within the selected date range if applicable
    if (category === 'GOLD_TH') {
        // For GoldTH, prioritize actual data over predictions
        let selectedSeries = null;
        
        if (chartDataToUse.barBuyData?.length) {
            selectedSeries = [...chartDataToUse.barBuyData];
        } else if (chartDataToUse.barSellData?.length) {
            selectedSeries = [...chartDataToUse.barSellData];
        } else if (chartDataToUse.barBuyPredictData?.length) {
            selectedSeries = [...chartDataToUse.barBuyPredictData];
        }
        
        // If we have a date range, filter the data to be within that range
        if (selectedSeries && dateRange?.to) {
            const date = new Date(dateRange.to);
            date.setHours(10, 0, 0, 0);
            const filterToTimestamp = Math.floor(date.getTime() / 1000);
            
            // Filter to only include data points within the selected date range
            dataForDefaultDate = selectedSeries.filter(
                data => data.time <= filterToTimestamp
            );
            
            // If no data points are within the range, use all data
            if (dataForDefaultDate.length === 0) {
                dataForDefaultDate = selectedSeries;
            }
        } else if (selectedSeries) {
            dataForDefaultDate = selectedSeries;
        }
    } else if ((category === 'GOLD_US' || category === 'USD_THB')) {
        if (effectiveChartStyle === 'candlestick' && chartDataToUse.ohlc?.length) {
            dataForDefaultDate = chartDataToUse.ohlc;
        } else if (effectiveChartStyle === 'line') {            if (chartDataToUse.closeData?.length) dataForDefaultDate = chartDataToUse.closeData;
            else if (chartDataToUse.openData?.length) dataForDefaultDate = chartDataToUse.openData;
            else if (chartDataToUse.highData?.length) dataForDefaultDate = chartDataToUse.highData;
            else if (chartDataToUse.lowData?.length) dataForDefaultDate = chartDataToUse.lowData;
        }
    }
    
    // Process the data to display in the date box
    const processedDataForDefaultDate = processTimeSeriesData(dataForDefaultDate);
    
    // For the default display, prefer to show the selected end date if available
    let displayDate;
    if (dateRange?.to) {
        // Show the selected end date 
        displayDate = formatDate(Math.floor(dateRange.to.getTime() / 1000));
    } else {
        // Fallback to last data point if no date range is selected
        const lastDataPointForDate = processedDataForDefaultDate.length > 0 ? 
            processedDataForDefaultDate[processedDataForDefaultDate.length - 1] : null;
        displayDate = lastDataPointForDate ? formatDate(lastDataPointForDate.time) : 'N/A';
    }
    
    if (dateRightBox) {
        dateRightBox.textContent = displayDate;
    }

    const getDefaultValue = (dataArrayInput, valueKey = 'value') => {
        const sortedArray = processTimeSeriesData(dataArrayInput || []);
        const lastPoint = sortedArray.length > 0 ? sortedArray[sortedArray.length - 1] : null;
        return lastPoint ? lastPoint[valueKey] : null;
    };
    
    const defaultDisplayValues = {};

    seriesLegendElements.forEach(item => {
        const config = item.config;
        let val = null;

        if (config.type === 'candlestick' && effectiveChartStyle === 'candlestick' && (category === 'GOLD_US' || category === 'USD_THB')) {
            const ohlcArr = chartDataToUse.ohlc || [];
            const last = ohlcArr.length > 0 ? ohlcArr[ohlcArr.length - 1] : null;
            if (last) {
                const { close } = last;
                item.valueBox.textContent = close.toFixed(2);
            } else {
                item.valueBox.textContent = '-';
            }
            defaultDisplayValues[config.key] = last || {};
        } else if (config.key.startsWith('ohlc_') && effectiveChartStyle === 'candlestick' && (category === 'GOLD_US' || category === 'USD_THB')) {
            const ohlcArr = chartDataToUse.ohlc || [];
            const last = ohlcArr.length > 0 ? ohlcArr[ohlcArr.length - 1] : null;
            if (last) {
                const ohlcType = config.key.split('_')[1];
                if (last[ohlcType] !== undefined) {
                    item.valueBox.textContent = last[ohlcType].toFixed(2);
                } else {
                    item.valueBox.textContent = '-';
                }
            } else {
                item.valueBox.textContent = '-';
            }
            defaultDisplayValues[config.key] = last || {};
        } else {
            val = getDefaultValue(chartDataToUse[config.key], 'value');
            if (val !== null) item.valueBox.textContent = Number(val).toFixed(2);
            else item.valueBox.textContent = '-';
            defaultDisplayValues[config.key] = val;
        }
    });    const latestPredictionsInRange = chartDataToUse?.barBuyPredictData?.filter(data => {
        const fromTimestamp = dateRange?.from ? Math.floor(dateRange.from.getTime() / 1000) : 0;
        // Use the same adjusted timestamp logic as above for the end date
        let filterToTimestamp;
        if (dateRange?.to) {
            // For all categories, use the exact selected end date with proper time
            if (category === 'GOLD_TH') {
                const date = new Date(dateRange.to);
                date.setHours(10, 0, 0, 0);
                filterToTimestamp = Math.floor(date.getTime() / 1000);
            } else if (category === 'GOLD_US') {
                const date = new Date(dateRange.to);
                date.setHours(0, 0, 0, 0);
                filterToTimestamp = Math.floor(date.getTime() / 1000);
            } else if (category === 'USD_THB') {
                const date = new Date(dateRange.to);
                date.setHours(17, 0, 0, 0);
                filterToTimestamp = Math.floor(date.getTime() / 1000);
            } else {
                filterToTimestamp = Math.floor(dateRange.to.getTime() / 1000);
            }
        } else {
            filterToTimestamp = Infinity;
        }
        return data.time >= fromTimestamp && data.time <= filterToTimestamp;
    }).slice(-10) || [];    const displayedPredictions = chartDataToUse?.barBuyPredictData?.filter(data => {
        const fromTimestamp = dateRange?.from ? Math.floor(dateRange.from.getTime() / 1000) : 0;
        // Use the same adjusted timestamp logic here too
        let filterToTimestamp;
        if (dateRange?.to) {
            // For all categories, use the exact selected end date with proper time
            if (category === 'GOLD_TH') {
                const date = new Date(dateRange.to);
                date.setHours(10, 0, 0, 0);
                filterToTimestamp = Math.floor(date.getTime() / 1000);
            } else if (category === 'GOLD_US') {
                const date = new Date(dateRange.to);
                date.setHours(0, 0, 0, 0);
                filterToTimestamp = Math.floor(date.getTime() / 1000);
            } else if (category === 'USD_THB') {
                const date = new Date(dateRange.to);
                date.setHours(17, 0, 0, 0);
                filterToTimestamp = Math.floor(date.getTime() / 1000);
            } else {
                filterToTimestamp = Math.floor(dateRange.to.getTime() / 1000);
            }
        } else {
            filterToTimestamp = Infinity;
        }
        return data.time >= fromTimestamp && data.time <= filterToTimestamp;
    }).slice(0, 10) || [];    chart.subscribeCrosshairMove(param => {
        const currentTimeAtCrosshair = param.time;

        if (dateRightBox && dateRightBox.isConnected) {
            if (currentTimeAtCrosshair !== undefined) {
                dateRightBox.textContent = formatDate(currentTimeAtCrosshair);
            } else {
                // When not hovering, show the selected end date
                if (dateRange?.to) {
                    dateRightBox.textContent = formatDate(Math.floor(dateRange.to.getTime() / 1000));
                } else {
                    // Only fall back to the last point if no date range selected
                    const lastDataPointForDate = processedDataForDefaultDate.length > 0 ? 
                        processedDataForDefaultDate[processedDataForDefaultDate.length - 1] : null;
                    dateRightBox.textContent = lastDataPointForDate ? formatDate(lastDataPointForDate.time) : 'N/A';
                }
            }
        }
        
        seriesLegendElements.forEach(item => {
            if (!item.valueBox || !item.valueBox.isConnected) return;
            
            const config = item.config;
            const seriesInstance = seriesInstances[config.key];
            let displayValue = '-';
            if (currentTimeAtCrosshair !== undefined) {
                if (config.key.startsWith('ohlc_') && effectiveChartStyle === 'candlestick') {
                    const mainSeries = seriesInstances['ohlc'];
                    if (mainSeries) {
                        const pointData = param.seriesData ? param.seriesData.get(mainSeries) : null;
                        if (pointData) {
                            const ohlcType = config.key.split('_')[1];
                            if (pointData[ohlcType] !== undefined) {
                                displayValue = pointData[ohlcType].toFixed(2);
                            }
                        }
                    }
                } else if (seriesInstance) {
                    const pointData = param.seriesData ? param.seriesData.get(seriesInstance) : null;
                    if (pointData) {                        
                        if (config.type === 'candlestick' && effectiveChartStyle === 'candlestick') {
                            const close = pointData.close !== undefined ? pointData.close.toFixed(2) : '-';
                            displayValue = close;
                        } else if (pointData.value !== undefined) {
                            displayValue = pointData.value.toFixed(2);
                        }
                    }
                }
            } else {
                if (seriesVisibility[config.key]) {
                    const defaultVal = defaultDisplayValues[config.key];
                    if (defaultVal !== null && defaultVal !== undefined) {                        
                        if (config.type === 'candlestick' && typeof defaultVal === 'object') {
                            const close = defaultVal.close !== undefined ? defaultVal.close.toFixed(2) : '-';
                            displayValue = close;
                        } else if (config.key.startsWith('ohlc_') && typeof defaultVal === 'object') {
                            const ohlcType = config.key.split('_')[1];
                            if (defaultVal[ohlcType] !== undefined) {
                                displayValue = defaultVal[ohlcType].toFixed(2);
                            }
                        } else if (typeof defaultVal === 'number') {
                            displayValue = defaultVal.toFixed(2);
                        }
                    }
                } 
            }

            if (item.valueBox) {
                item.valueBox.textContent = displayValue;
            }
        });
    });

    // Save references for cleanup
    const currentChart = chart;
    const currentContainer = styledLegendContainer;
    const currentLegends = [...seriesLegendElements];

    // Clean up function
    return () => {
        // Remove event listeners
        currentLegends.forEach(legendItem => {
            if (legendItem.clickHandler && legendItem.element) {
                legendItem.element.removeEventListener('click', legendItem.clickHandler);
            }
        });
        
        // Remove chart instance
        if (currentChart) {
            currentChart.remove();
        }
    };
  }, [chartData, category, chartStyle, effectiveChartStyle, dateRange, seriesVisibility, theme]);
  
  return <div ref={chartContainerRef} style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }} />;
};

export default Chart;
