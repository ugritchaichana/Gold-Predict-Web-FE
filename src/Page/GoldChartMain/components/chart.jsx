import React, { useEffect, useRef, useState } from 'react';
import { createChart, LineStyle, CrosshairMode } from 'lightweight-charts'; // Added CrosshairMode
import { format as formatDateFns, isValid } from 'date-fns'; // Added isValid
import { debugChartData } from './chart.debug.js';

// Chart base options
const chartOptions = {
    layout: {
        textColor: 'black',
        background: { type: 'solid', color: 'white' },
    },
    crosshair: {
        mode: CrosshairMode.Normal, // Use enum for clarity
    },
    // Optional: Add time scale options if needed, e.g., for date formatting
    timeScale: {
        // fixLeftEdge: true, // Optional: keeps the latest bar from being partially off-screen
        // fixRightEdge: true, // Optional
        // borderVisible: false,
        // tickMarkFormatter: (time, tickMarkType, locale) => {
        //     // Your custom date formatting for the time scale
        //     const date = new Date(time * 1000);
        //     return `${date.getDate()}/${date.getMonth() + 1}`;
        // },
    },
    // Optional: Price scale options
    // priceScale: {
    // autoScale: true,
    // position: 'right',
    // },
};

const baseSeriesConfigs = {
    GOLD_TH: [
        { key: 'barBuyData', color: 'blue', name: 'Bar Buy', addToChart: true, defaultVisible: true, lineStyle: LineStyle.Solid },
        { key: 'barBuyPredictData', color: '#42a5f5', name: 'Bar Buy (Predict)', addToChart: true, defaultVisible: true, lineStyle: LineStyle.Dashed },
        { key: 'barSellData', color: 'red', name: 'Bar Sell', addToChart: true, defaultVisible: true, lineStyle: LineStyle.Solid },
        { key: 'ornamentBuyData', color: 'green', name: 'Ornament Buy', addToChart: true, defaultVisible: true, lineStyle: LineStyle.Solid },
        { key: 'ornamentSellData', color: 'orange', name: 'Ornament Sell', addToChart: true, defaultVisible: true, lineStyle: LineStyle.Solid },
    ],
    GOLD_US: [
        { key: 'ohlc', name: 'Gold US', addToChart: true, defaultVisible: true, type: 'candlestick' },
    ],
    USD_THB: [
        { key: 'ohlc', name: 'USD/THB', addToChart: true, defaultVisible: true, type: 'candlestick' },
    ],
};

const processTimeSeriesData = (data, isCandlestick = false) => {
    if (!Array.isArray(data) || data.length === 0) {
        return [];
    }
    const uniqueTimeData = [];
    const timeMap = new Map();
    
    for (const item of data) {
        if (!item || typeof item.time !== 'number') {
            console.warn(`Invalid data entry (missing time or not a number):`, item);
            continue;
        }
        
        // For candlestick data (OHLC format)
        if (isCandlestick) {
            // Handle OHLC data - open, high, low, close properties
            // Convert any string values to numbers and provide defaults
            const processedItem = {
                time: item.time,
                open: Number(item.open || 0),
                high: Number(item.high || 0),
                low: Number(item.low || 0),
                close: Number(item.close || 0)
            };
            
            if (!timeMap.has(item.time)) {
                timeMap.set(item.time, processedItem);
            } else {
                console.warn(`Duplicate time detected: ${item.time}, skipping entry.`);
            }
        } 
        // For regular time series data (value format)
        else if (typeof item.value === 'number' || typeof item.value === 'string') {
            const processedItem = {
                time: item.time,
                value: Number(item.value)
            };
            
            if (!timeMap.has(item.time)) {
                timeMap.set(item.time, processedItem);
            } else {
                console.warn(`Duplicate time detected: ${item.time}, skipping entry.`);
            }
        } else {
            console.warn(`Invalid data entry (missing value property):`, item);
        }
    }
    
    timeMap.forEach(value => uniqueTimeData.push(value));
    return uniqueTimeData.sort((a, b) => a.time - b.time);
};

const Chart = ({ chartData: rawChartData, category = 'GOLD_TH', dateRange }) => {
  // Process and debug chart data before using it
  const chartData = debugChartData(rawChartData, category);
  
  const chartContainerRef = useRef(null);
  const currentSeriesConfigs = baseSeriesConfigs[category] || [];

  const [seriesVisibility, setSeriesVisibility] = useState(() => {
    const initial = {};
    currentSeriesConfigs.forEach(config => {
        initial[config.key] = config.defaultVisible;
    });
    return initial;
  });

  useEffect(() => {
    const initial = {};
    currentSeriesConfigs.forEach(config => {
        initial[config.key] = config.defaultVisible;
    });
    setSeriesVisibility(initial);
  }, [category]);

  useEffect(() => {
    if (!chartData) {
        if (chartContainerRef.current) chartContainerRef.current.innerHTML = '';
        return;
    }
    if (!chartContainerRef.current) {
        return;
    }

    chartContainerRef.current.innerHTML = '';
    const chart = createChart(chartContainerRef.current, {
      ...chartOptions,
      width: chartContainerRef.current.clientWidth,
      height: chartContainerRef.current.clientHeight,
    });

    const seriesInstances = {};    // Debug the chart data
    console.log(`Chart component received data for ${category}:`, chartData);

    currentSeriesConfigs.forEach(config => {
        if (!seriesVisibility[config.key] && config.key !== 'priceChangeData') {
             return;
        }

        if (config.addToChart || config.key === 'priceChangeData') {
            let rawSeriesData = [];
            let processedSeriesDataForChart = [];            if (category === 'GOLD_TH') {
                rawSeriesData = chartData[config.key] || [];
                processedSeriesDataForChart = processTimeSeriesData(rawSeriesData);
            } else if ((category === 'GOLD_US' || category === 'USD_THB') && config.type === 'candlestick') {
                // Handle candlestick data as OHLC array (should be provided by our debug utility)
                if (Array.isArray(chartData.ohlc)) {
                    console.log(`Using OHLC array for ${category}, ${chartData.ohlc.length} items`);
                    // Ensure the data is valid for candlestick chart
                    rawSeriesData = chartData.ohlc.filter(item => 
                        item && typeof item.time === 'number' && 
                        typeof item.open === 'number' && 
                        typeof item.high === 'number' && 
                        typeof item.low === 'number' && 
                        typeof item.close === 'number'
                    );
                    
                    // No need to process through processTimeSeriesData since we're dealing directly with OHLC data
                    processedSeriesDataForChart = rawSeriesData;
                    
                    // Log the data we're using
                    console.log(`Processed ${rawSeriesData.length} valid OHLC data points for ${category}`);
                    if (rawSeriesData.length > 0) {
                        console.log("Sample data:", rawSeriesData.slice(0, 3));
                    }
                }
            } else if (category === 'GOLD_US' || category === 'USD_THB') { // For individual lines if not candlestick
                rawSeriesData = chartData[config.key] || [];
                processedSeriesDataForChart = processTimeSeriesData(rawSeriesData);
            }

            if (config.addToChart && processedSeriesDataForChart && processedSeriesDataForChart.length > 0) {
                try {
                    if (config.type === 'candlestick') {
                        seriesInstances[config.key] = chart.addCandlestickSeries({
                            upColor: '#26a69a', downColor: '#ef5350',
                            borderDownColor: '#ef5350', borderUpColor: '#26a69a',
                            wickDownColor: '#ef5350', wickUpColor: '#26a69a',
                            visible: seriesVisibility[config.key],
                        });
                    } else {
                        seriesInstances[config.key] = chart.addLineSeries({
                            color: config.color,
                            lineWidth: 2,
                            visible: seriesVisibility[config.key],
                            lineStyle: config.lineStyle || LineStyle.Solid,
                        });
                    }
                    seriesInstances[config.key].setData(processedSeriesDataForChart);
                } catch (e) {
                    console.error(`Error setting data for series ${config.key}:`, e);
                    const match = e.message?.match(/index=(\d+)/);
                    if (match && match[1]) {
                        const problematicIndex = parseInt(match[1], 10);
                        console.error("Data around problematic index:", processedSeriesDataForChart.slice(Math.max(0, problematicIndex - 2), problematicIndex + 3));
                    } else {
                        console.error("Problematic data sample:", processedSeriesDataForChart.slice(0,5));
                    }
                }
            }
            // Store processed data for legend (especially for non-chart series like priceChangeData)
            if (config.key === 'priceChangeData' && chartData[config.key]) {                 // This section handles ensuring chartData is properly processed for legend logic
                 // The getDefaultValue function will process its own data
            }
        }
    });

    const formatDate = (timestamp) => {
        if (!timestamp && timestamp !== 0) return 'N/A'; // Return string
        const date = new Date(timestamp * 1000);
        if (!isValid(date)) return 'N/A'; // Return string

        // Format for display: e.g., Thu 8 May 25
        return formatDateFns(date, 'EEE d MMM yy');
    };

    // Determine the effective 'to' timestamp for the visible range
    let effectiveToTimestamp;
    const originalToTimestamp = dateRange?.to ? Math.floor(dateRange.to.getTime() / 1000) : null;

    let maxPredictionTimestamp = null;
    if (chartData?.barBuyPredictData && chartData.barBuyPredictData.length > 0) {
        // Ensure predictions are sorted to find the true latest point
        const processedPredictions = processTimeSeriesData(chartData.barBuyPredictData);
        if (processedPredictions.length > 0) {
            maxPredictionTimestamp = processedPredictions[processedPredictions.length - 1].time;
        }
    }

    if (originalToTimestamp && maxPredictionTimestamp) {
        effectiveToTimestamp = Math.max(originalToTimestamp, maxPredictionTimestamp);
    } else if (maxPredictionTimestamp) {
        effectiveToTimestamp = maxPredictionTimestamp;
    } else if (originalToTimestamp) {
        effectiveToTimestamp = originalToTimestamp;
    } else {
        effectiveToTimestamp = null; // Will lead to fitContent if from is also missing
    }
    
    // Set visible range after all series data is set
    if (dateRange && dateRange.from && isValid(dateRange.from) && effectiveToTimestamp) {
        const fromTimestamp = Math.floor(dateRange.from.getTime() / 1000);
        // Ensure 'from' is not after 'to'; if so, fitContent might be better or adjust 'from'.
        // For now, we assume 'from' is reasonably set.
        if (fromTimestamp <= effectiveToTimestamp) { 
            chart.timeScale().setVisibleRange({
                from: fromTimestamp,
                to: effectiveToTimestamp,
            });
        } else {
            // This case (from > to) might indicate an issue with dateRange logic upstream
            // or very short/specific prediction data. Fallback to fitContent.
            console.warn(`Chart.jsx: fromTimestamp (${fromTimestamp}) > effectiveToTimestamp (${effectiveToTimestamp}). Falling back to fitContent.`);
            chart.timeScale().fitContent();
        }
    } else {
        chart.timeScale().fitContent(); 
    }


    // --- Legend Setup ---
    const styledLegendContainer = document.createElement('div');
    styledLegendContainer.style = `
      position: absolute; left: 12px; top: 12px; z-index: 1001;
      display: flex; flex-wrap: wrap; gap: 8px; font-size: 12px;
      font-family: sans-serif; line-height: 18px; font-weight: 300;
      background: rgba(255, 255, 255, 0.85); padding: 8px; border-radius: 4px;
    `;

    const dateLegendRow = document.createElement('div');
    dateLegendRow.style = `
      display: flex; align-items: center; border: 1px solid black;
      border-radius: 4px; overflow: hidden; box-sizing: border-box; cursor: default;
    `;
    const dateLeftBox = document.createElement('div');
    dateLeftBox.style = `background: transparent; padding: 4px 8px; text-align: left;`;
    dateLeftBox.textContent = 'Date';
    const dateRightBox = document.createElement('div');
    dateRightBox.style = `background: black; color: white; padding: 4px 8px; text-align: center; min-width: 100px;`;
    dateRightBox.textContent = 'N/A';
    dateLegendRow.appendChild(dateLeftBox);
    dateLegendRow.appendChild(dateRightBox);
    styledLegendContainer.appendChild(dateLegendRow);

    const seriesLegendElements = [];

    const updateLegendStyle = (legendElement, isVisibleConfig, configForStyle) => {
        const leftBox = legendElement.children[0];
        const valueBox = legendElement.children[1];
        const displayColor = configForStyle.type === 'candlestick' ? (isVisibleConfig ? '#26a69a' : 'grey') : (configForStyle.color || 'grey');

        legendElement.style.opacity = isVisibleConfig ? '1' : '0.5';
        legendElement.style.borderColor = isVisibleConfig ? displayColor : 'grey';
        if (leftBox) leftBox.style.textDecoration = isVisibleConfig ? 'none' : 'line-through';
        
        if (valueBox) {
            valueBox.style.textDecoration = isVisibleConfig ? 'none' : 'line-through';
            if (configForStyle.type !== 'candlestick') {
                 valueBox.style.background = isVisibleConfig ? displayColor : 'grey';
                 valueBox.style.color = 'white';
            } else {
                valueBox.style.background = 'transparent';
                valueBox.style.color = isVisibleConfig ? 'black' : 'grey';
            }
        }
    };

    currentSeriesConfigs.forEach(config => {
      let legendDataExists = false;
      if (category === 'GOLD_TH' && chartData[config.key]) {
          legendDataExists = true;
      } else if ((category === 'GOLD_US' || category === 'USD_THB')) {
          if (config.type === 'candlestick' && chartData.open) legendDataExists = true; // Check for ohlc data presence
          else if (chartData[config.key] && config.type !== 'candlestick') legendDataExists = true;
      }
      if (!legendDataExists && config.key !== 'priceChangeData') return; // priceChangeData handled separately if needed

      const legendRow = document.createElement('div');
      const legendBorderColor = config.type === 'candlestick' ? (seriesVisibility[config.key] ? '#26a69a' : 'grey') : (config.color || 'grey');
      legendRow.style = `
        display: flex; align-items: center; border: 1px solid ${legendBorderColor};
        border-radius: 4px; overflow: hidden; box-sizing: border-box;
        cursor: pointer; transition: opacity 0.2s ease, border-color 0.2s ease;
      `;
      const nameBox = document.createElement('div');
      nameBox.style = `background: transparent; padding: 4px 8px; text-align: left;`;
      nameBox.textContent = config.name;
      legendRow.appendChild(nameBox);

      const valueBox = document.createElement('div');
      if (config.type !== 'candlestick' || category === 'GOLD_TH') {
          valueBox.style = `
            background: ${config.color || 'transparent'}; 
            color: white; padding: 4px 8px; text-align: center; min-width: 75px;
          `;
          valueBox.textContent = '0.00';
      } else { // Candlestick legend for GOLD_US, USD_THB
          valueBox.style = `
            background: transparent; color: black; 
            padding: 4px 8px; text-align: left; min-width: 160px; font-size: 10px; white-space: nowrap;
          `;
          valueBox.textContent = 'O: - H: - L: - C: -';
      }
      legendRow.appendChild(valueBox);
      styledLegendContainer.appendChild(legendRow);
      
      const legendItem = { element: legendRow, config: config, nameBox, valueBox, clickHandler: null };
      seriesLegendElements.push(legendItem);
      updateLegendStyle(legendRow, seriesVisibility[config.key], config);

      legendItem.clickHandler = () => {
        setSeriesVisibility(prevVisibility => {
            const newVisibilityForKey = !prevVisibility[config.key];
            if (config.addToChart && seriesInstances[config.key] && seriesInstances[config.key].applyOptions) {
                 seriesInstances[config.key].applyOptions({ visible: newVisibilityForKey });
            }
            // For candlestick, visibility is handled by not adding it if !seriesVisibility[config.key]
            // or by full re-render. The applyOptions({visible}) might not work directly.
            // The component will re-render due to setSeriesVisibility, and useEffect will rebuild series.
            return { ...prevVisibility, [config.key]: newVisibilityForKey };
        });
      };
      legendRow.addEventListener('click', legendItem.clickHandler);
    });

    chartContainerRef.current.appendChild(styledLegendContainer);

    requestAnimationFrame(() => { // Ensure dateLegendRow is in DOM for height calculation
        if (!dateLegendRow || !dateLegendRow.isConnected) return;
        const dateLegendHeight = dateLegendRow.offsetHeight;
        if (dateLegendHeight > 0) {
            seriesLegendElements.forEach(item => {
                if (item.element.isConnected) {
                    item.element.style.height = `${dateLegendHeight}px`;
                }
            });
        }
    });

    // Get default date from the (already date-filtered) chartData
    let dataForDefaultDate = [];
    if (category === 'GOLD_TH' && chartData.barBuyData && chartData.barBuyData.length > 0) { // Prioritize actual data
      dataForDefaultDate = chartData.barBuyData;
    } else if ((category === 'GOLD_US' || category === 'USD_THB') && chartData.open && chartData.open.length > 0) { // Prioritize actual data
      dataForDefaultDate = chartData.open;
    } else if (chartData.barBuyPredictData && chartData.barBuyPredictData.length > 0) { // Fallback to predictions if no actual
      dataForDefaultDate = chartData.barBuyPredictData;
    } else if (category === 'GOLD_TH' && chartData.barSellData && chartData.barSellData.length > 0) { // Further fallback for GOLD_TH
        dataForDefaultDate = chartData.barSellData;
    }
    // Add more fallbacks if necessary for other primary series


    const processedDataForDefaultDate = processTimeSeriesData(dataForDefaultDate);
    const lastDataPointForDate = processedDataForDefaultDate.length > 0 ? processedDataForDefaultDate[processedDataForDefaultDate.length - 1] : null;
    if (dateRightBox) {
        dateRightBox.textContent = lastDataPointForDate ? formatDate(lastDataPointForDate.time) : 'N/A';
    }

    // Function to get default value (last point in the filtered and processed data)
    const getDefaultValue = (dataArrayInput, valueKey = 'value') => {
        const sortedArray = processTimeSeriesData(dataArrayInput || []);
        const lastPoint = sortedArray.length > 0 ? sortedArray[sortedArray.length - 1] : null;
        return lastPoint ? lastPoint[valueKey] : null; // Return null if no data
    };
    
    const defaultDisplayValues = {}; // For initial legend display
    seriesLegendElements.forEach(item => {
        const config = item.config;
        let val = null;
        if (config.type === 'candlestick' && category !== 'GOLD_TH') {
            const openVal = getDefaultValue(chartData.open, 'value');
            const highVal = getDefaultValue(chartData.high, 'value');
            const lowVal = getDefaultValue(chartData.low, 'value');
            const closeVal = getDefaultValue(chartData.close, 'value');
            if (closeVal !== null) { // Only display if close value exists
                 item.valueBox.textContent = `O:${openVal?.toFixed(2) || '-'} H:${highVal?.toFixed(2) || '-'} L:${lowVal?.toFixed(2) || '-'} C:${closeVal?.toFixed(2) || '-'}`;
            } else {
                 item.valueBox.textContent = 'O: - H: - L: - C: -';
            }
            defaultDisplayValues[config.key] = { open: openVal, high: highVal, low: lowVal, close: closeVal }; // Store for crosshair
        } else {
            val = getDefaultValue(chartData[config.key], 'value');
            if (val !== null) item.valueBox.textContent = Number(val).toFixed(2);
            else item.valueBox.textContent = '-';
            defaultDisplayValues[config.key] = val;
        }
    });

    // Log the latest 10 predictions filtered by date range
    const latestPredictionsInRange = chartData?.barBuyPredictData?.filter(data => {
        const fromTimestamp = dateRange?.from ? Math.floor(dateRange.from.getTime() / 1000) : 0;
        const toTimestamp = dateRange?.to ? Math.floor(dateRange.to.getTime() / 1000) : Infinity;
        return data.time >= fromTimestamp && data.time <= toTimestamp;
    }).slice(-10) || [];
    console.log('Latest 10 Predictions (Filtered by Date Range):', latestPredictionsInRange);

    // Log the 10 predictions currently displayed (filtered by date range)
    const displayedPredictions = chartData?.barBuyPredictData?.filter(data => {
        const fromTimestamp = dateRange?.from ? Math.floor(dateRange.from.getTime() / 1000) : 0;
        const toTimestamp = dateRange?.to ? Math.floor(dateRange.to.getTime() / 1000) : Infinity;
        return data.time >= fromTimestamp && data.time <= toTimestamp;
    }).slice(0, 10) || [];
    console.log('Displayed Predictions in Date Range:', displayedPredictions);

    chart.subscribeCrosshairMove(param => {
        const currentTimeAtCrosshair = param.time;

        // Update Date Legend
        if (dateRightBox) {
            if (currentTimeAtCrosshair !== undefined) {
                dateRightBox.textContent = formatDate(currentTimeAtCrosshair);
            } else {
                dateRightBox.textContent = lastDataPointForDate ? formatDate(lastDataPointForDate.time) : 'N/A';
            }
        }
        seriesLegendElements.forEach(item => {
            const config = item.config;
            const seriesInstance = seriesInstances[config.key];
            let displayValue = '-'; // Default to '-'

            if (currentTimeAtCrosshair !== undefined) { // Crosshair is IN the chart area
                if (seriesInstance) {
                    const pointData = param.seriesData ? param.seriesData.get(seriesInstance) : null;
                    if (pointData) {
                        if (config.type === 'candlestick' && category !== 'GOLD_TH') {
                            const open = pointData.open !== undefined ? pointData.open.toFixed(2) : '-';
                            const high = pointData.high !== undefined ? pointData.high.toFixed(2) : '-';
                            const low = pointData.low !== undefined ? pointData.low.toFixed(2) : '-';
                            const close = pointData.close !== undefined ? pointData.close.toFixed(2) : '-';
                            displayValue = `O:${open} H:${high} L:${low} C:${close}`;
                        } else if (pointData.value !== undefined) { // For line series
                            displayValue = pointData.value.toFixed(2);
                        }
                        // If pointData exists but doesn't have expected properties (value/ohlc), displayValue remains '-'
                    }
                    // If no pointData for this series at this time (series has a gap), displayValue remains '-'
                }
                // If no seriesInstance (should not happen if config exists), displayValue remains '-'
            } else { // Crosshair is OUT of the chart area
                // Revert to default values, but only if the series is currently visible
                if (seriesVisibility[config.key]) {
                    const defaultVal = defaultDisplayValues[config.key];
                    if (defaultVal !== null && defaultVal !== undefined) {
                        if (config.type === 'candlestick' && typeof defaultVal === 'object') {
                            const open = defaultVal.open !== undefined ? defaultVal.open.toFixed(2) : '-';
                            const high = defaultVal.high !== undefined ? defaultVal.high.toFixed(2) : '-';
                            const low = defaultVal.low !== undefined ? defaultVal.low.toFixed(2) : '-';
                            const close = defaultVal.close !== undefined ? defaultVal.close.toFixed(2) : '-';
                            displayValue = `O:${open} H:${high} L:${low} C:${close}`;
                        } else if (typeof defaultVal === 'number') {
                            displayValue = defaultVal.toFixed(2);
                        }
                    }
                } 
                // If series is hidden, or no default value, displayValue remains '-'
            }

            if (item.valueBox) {
                item.valueBox.textContent = displayValue;
            }
        });
    });

    // --- Cleanup ---
    const currentChart = chart;
    const currentContainer = styledLegendContainer;
    const currentSeriesLegendElements = [...seriesLegendElements];

    return () => {
        currentSeriesLegendElements.forEach(legendItem => {
            if (legendItem.clickHandler) {
                legendItem.element.removeEventListener('click', legendItem.clickHandler);
            }
        });
        if (currentContainer && currentContainer.parentNode) {
            currentContainer.parentNode.removeChild(currentContainer);
        }
        if (currentChart) {
            currentChart.remove();
        }
    };
  }, [chartData, category, dateRange, seriesVisibility]); // Re-run effect if these change

  return <div ref={chartContainerRef} style={{ position: 'relative', width: '100%', height: '100%' }} />;
};

export default Chart;