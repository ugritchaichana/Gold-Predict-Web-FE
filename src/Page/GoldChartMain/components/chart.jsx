import React, { useEffect, useRef, useState } from 'react';
import { createChart, LineStyle } from 'lightweight-charts';

const chartOptions = {
    layout: {
        textColor: 'black',
        background: { type: 'solid', color: 'white' },
    },
    crosshair: {
        mode: 0,
    },
};

const baseSeriesConfigs = {
    GOLD_TH: [
        { key: 'barBuyData', color: 'blue', name: 'Bar Buy', addToChart: true, defaultVisible: true, lineStyle: LineStyle.Solid },
        { key: 'barSellData', color: 'red', name: 'Bar Sell', addToChart: true, defaultVisible: true, lineStyle: LineStyle.Solid },
        { key: 'ornamentBuyData', color: 'green', name: 'Ornament Buy', addToChart: true, defaultVisible: true, lineStyle: LineStyle.Solid },
        { key: 'ornamentSellData', color: 'orange', name: 'Ornament Sell', addToChart: true, defaultVisible: true, lineStyle: LineStyle.Solid },
        { key: 'barBuyPredictData', color: '#42a5f5', name: 'Bar Buy (Predict)', addToChart: true, defaultVisible: true, lineStyle: LineStyle.Dashed },
        { key: 'priceChangeData', color: 'purple', name: 'Price Change', addToChart: false, defaultVisible: true },
    ],
    GOLD_US: [
        { key: 'ohlc', name: 'Gold US OHLC', addToChart: true, defaultVisible: true, type: 'candlestick' },
    ],
    USD_THB: [
        { key: 'ohlc', name: 'USD/THB OHLC', addToChart: true, defaultVisible: true, type: 'candlestick' },
    ],
};

// Helper function to process and sort time-series data
const processTimeSeriesData = (data) => {
    if (!Array.isArray(data) || data.length === 0) {
        return [];
    }

    // 1. Remove duplicates by time, keeping the last one encountered (or first, adjust as needed)
    const uniqueTimeData = [];
    const timeMap = new Map();
    // Iterate in reverse to keep the last instance if a simple filter is used,
    // or build map and then extract. For simplicity, let's use a Map to ensure uniqueness.
    for (const item of data) {
        if (item && typeof item.time === 'number') { // Ensure item and time are valid
             // If you want to keep the *last* entry for a duplicate time, you can overwrite.
             // If you want to keep the *first*, check if map already has the time.
            timeMap.set(item.time, item);
        }
    }
    timeMap.forEach(value => uniqueTimeData.push(value));


    // 2. Sort by time in ascending order
    return uniqueTimeData.sort((a, b) => a.time - b.time);
};


const Chart = ({ chartData, category = 'GOLD_TH', symbolName = '' }) => {
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
  }, [category, currentSeriesConfigs]);

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

    const seriesInstances = {};

    currentSeriesConfigs.forEach(config => {
        if (!seriesVisibility[config.key] && config.key !== 'priceChangeData') { // priceChangeData is not on chart but in legend
             // console.log(`Skipping series ${config.key} due to visibility state.`);
             return;
        }

        if (config.addToChart || config.key === 'priceChangeData') { // priceChangeData needs its data for legend even if not on chart
            let rawSeriesData;
            let processedSeriesData;

            if (category === 'GOLD_TH') {
                rawSeriesData = chartData[config.key];
                processedSeriesData = processTimeSeriesData(rawSeriesData);
            } else if ((category === 'GOLD_US' || category === 'USD_THB') && config.type === 'candlestick') {
                if (chartData.open && chartData.high && chartData.low && chartData.close) {
                    // Combine and then process for OHLC
                    // Ensure all arrays have the same length before zipping
                    const minLength = Math.min(
                        chartData.open.length,
                        chartData.high.length,
                        chartData.low.length,
                        chartData.close.length
                    );

                    rawSeriesData = chartData.open.slice(0, minLength).map((o, i) => ({
                        time: o.time, // Assume time is consistent across o,h,l,c for the same index
                        open: o.value,
                        high: chartData.high[i]?.value,
                        low: chartData.low[i]?.value,
                        close: chartData.close[i]?.value,
                    })).filter(d =>
                        d.high !== undefined && d.low !== undefined && d.close !== undefined &&
                        typeof d.time === 'number' && // Ensure time is a number
                        typeof d.open === 'number' &&
                        typeof d.high === 'number' &&
                        typeof d.low === 'number' &&
                        typeof d.close === 'number'
                    );
                    processedSeriesData = processTimeSeriesData(rawSeriesData); // Process combined OHLC data
                }
            } else if (category === 'GOLD_US' || category === 'USD_THB') {
                rawSeriesData = chartData[config.key]; // e.g., chartData.open, chartData.close (if plotting as lines)
                processedSeriesData = processTimeSeriesData(rawSeriesData);
            }


            if (config.addToChart && processedSeriesData && Array.isArray(processedSeriesData) && processedSeriesData.length > 0) {
                // console.log(`Adding series ${config.key} with ${processedSeriesData.length} points. First point time: ${processedSeriesData[0]?.time}`);
                try {
                    if (config.type === 'candlestick') {
                        seriesInstances[config.key] = chart.addCandlestickSeries({
                            upColor: '#26a69a', downColor: '#ef5350',
                            borderDownColor: '#ef5350', borderUpColor: '#26a69a',
                            wickDownColor: '#ef5350', wickUpColor: '#26a69a',
                            visible: seriesVisibility[config.key], // Visibility applied here
                            title: config.name,
                        });
                    } else {
                        seriesInstances[config.key] = chart.addLineSeries({
                            color: config.color,
                            lineWidth: 2,
                            visible: seriesVisibility[config.key], // Visibility applied here
                            title: config.name,
                            lineStyle: config.lineStyle || LineStyle.Solid,
                        });
                    }
                    seriesInstances[config.key].setData(processedSeriesData);
                } catch (e) {
                    console.error(`Error setting data for series ${config.key}:`, e);
                    console.error("Problematic data for this series:", processedSeriesData.slice(0, 10)); // Log first few points
                    // Find the problematic index if possible from error message
                    const match = e.message?.match(/index=(\d+)/);
                    if (match && match[1]) {
                        const problematicIndex = parseInt(match[1], 10);
                        console.error("Data around problematic index:", processedSeriesData.slice(Math.max(0, problematicIndex - 2), problematicIndex + 3));
                    }
                }
            } else if (config.addToChart) {
                // console.log(`No data or empty processed data for series ${config.key} to add to chart.`);
            }
            // Store processed data for legend even if not added to chart (e.g. priceChangeData)
             if (config.key === 'priceChangeData' && processedSeriesData) {
                // This is a bit of a hack, normally legend would use data from seriesInstances
                // But priceChangeData isn't a chart series. We'll need to handle its default value.
                // For now, ensure chartData itself holds the processed version if it's used by legend directly
                if (chartData[config.key]) chartData[config.key] = processedSeriesData;
            }
        }
    });

    // ... (rest of the legend creation and update logic) ...
    // Make sure legend logic uses `currentSeriesConfigs` and `chartData` (which might contain processed data for non-chart series)

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
    dateRightBox.style = `background: black; color: white; padding: 4px 8px; text-align: center; min-width: 80px;`;
    dateRightBox.textContent = 'N/A';
    dateLegendRow.appendChild(dateLeftBox);
    dateLegendRow.appendChild(dateRightBox);
    styledLegendContainer.appendChild(dateLegendRow);

    const seriesLegendElements = [];

    const updateLegendStyle = (legendElement, isVisibleConfig, configForStyle) => {
        const leftBox = legendElement.children[0];
        const rightBox = legendElement.children[1];
        
        const displayColor = configForStyle.type === 'candlestick' ? (isVisibleConfig ? '#26a69a' : 'grey') : configForStyle.color;

        legendElement.style.opacity = isVisibleConfig ? '1' : '0.5';
        legendElement.style.borderColor = isVisibleConfig ? displayColor : 'grey';
        if (leftBox) leftBox.style.textDecoration = isVisibleConfig ? 'none' : 'line-through';
        
        if (rightBox) {
            rightBox.style.textDecoration = isVisibleConfig ? 'none' : 'line-through';
            if (configForStyle.type !== 'candlestick') {
                 rightBox.style.background = isVisibleConfig ? displayColor : 'grey';
                 rightBox.style.color = 'white';
            } else {
                rightBox.style.background = 'transparent';
                rightBox.style.color = isVisibleConfig ? 'black' : 'grey';
            }
        }
    };

    currentSeriesConfigs.forEach(config => {
      let legendDataExists = false;
      if (category === 'GOLD_TH' && chartData[config.key]) {
          legendDataExists = true;
      } else if ((category === 'GOLD_US' || category === 'USD_THB')) {
          if (config.type === 'candlestick' && chartData.open) legendDataExists = true;
          else if (chartData[config.key] && config.type !== 'candlestick') legendDataExists = true;
      }
      // For priceChangeData, it might not have a direct corresponding series on chart, but legend is needed
      if (!legendDataExists && config.key !== 'priceChangeData') return;


      const legendRow = document.createElement('div');
      const legendBorderColor = config.type === 'candlestick' ? (seriesVisibility[config.key] ? '#26a69a' : 'grey') : config.color;
      legendRow.style = `
        display: flex; align-items: center; border: 1px solid ${legendBorderColor};
        border-radius: 4px; overflow: hidden; box-sizing: border-box;
        cursor: pointer; transition: opacity 0.2s ease, border-color 0.2s ease;
      `;
      const leftBox = document.createElement('div');
      leftBox.style = `background: transparent; padding: 4px 8px; text-align: left;`;
      leftBox.textContent = config.name;
      legendRow.appendChild(leftBox);

      if (config.type !== 'candlestick' || category === 'GOLD_TH' || config.key === 'priceChangeData') {
          const rightBox = document.createElement('div');
          const bgColor = config.type === 'candlestick' ? 'transparent' : (config.color || 'transparent');
          const textColor = config.type === 'candlestick' ? 'black' : 'white';
          rightBox.style = `
            background: ${bgColor}; 
            color: ${textColor}; padding: 4px 8px; text-align: center; min-width: 75px;
          `;
          rightBox.textContent = (config.key === 'priceChangeData' && chartData.priceChangeData && chartData.priceChangeData.length > 0)
            ? Number(chartData.priceChangeData[chartData.priceChangeData.length-1].value).toFixed(2)
            : '0.00'; // Default or last value for priceChangeData
          legendRow.appendChild(rightBox);
      } else if (config.type === 'candlestick') { // Specific legend for OHLC
          const rightBox = document.createElement('div');
          rightBox.style = `
            background: transparent; color: black; 
            padding: 4px 8px; text-align: left; min-width: 150px; font-size: 10px;
          `; // Adjusted for OHLC display
          rightBox.textContent = 'O: - H: - L: - C: -'; // Placeholder
          legendRow.appendChild(rightBox);
      }
      
      styledLegendContainer.appendChild(legendRow);
      
      const legendItem = { element: legendRow, config: config, clickHandler: null };
      seriesLegendElements.push(legendItem);

      updateLegendStyle(legendRow, seriesVisibility[config.key], config);

      legendItem.clickHandler = () => {
        setSeriesVisibility(prevVisibility => {
            const newVisibilityForKey = !prevVisibility[config.key];
            const updatedVisibility = { ...prevVisibility, [config.key]: newVisibilityForKey };
            
            // If series is on chart, apply visibility option.
            // For candlestick, it's more complex: ideally, remove/re-add series,
            // or rely on useEffect to re-render based on the new visibility state.
            // The current setup will trigger useEffect re-render, which rebuilds series.
            if (config.addToChart && seriesInstances[config.key] && seriesInstances[config.key].applyOptions) {
                 seriesInstances[config.key].applyOptions({ visible: newVisibilityForKey });
            }
            // For candlestick, the re-render from useEffect will handle its visibility
            // by either adding it or not based on seriesVisibility[config.key].

            return updatedVisibility;
        });
      };
      legendRow.addEventListener('click', legendItem.clickHandler);
    });

    chartContainerRef.current.appendChild(styledLegendContainer);

    requestAnimationFrame(() => {
        if (!dateLegendRow.isConnected) return;
        const dateLegendHeight = dateLegendRow.offsetHeight;
        if (dateLegendHeight > 0) {
            seriesLegendElements.forEach(item => {
                if (item.element.isConnected) {
                    item.element.style.height = `${dateLegendHeight}px`;
                }
            });
        }
    });

    const formatDate = (timestamp) => {
        if (!timestamp && timestamp !==0) return 'N/A';
        const date = new Date(timestamp * 1000);
        if (isNaN(date.getTime())) return 'N/A';
        const day = date.getDate().toString().padStart(2, '0');
        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const month = monthNames[date.getMonth()];
        const year = date.getFullYear().toString().slice(-2);
        return `${day} ${month} '${year}`;
    };
    
    let firstTimeSeriesData = [];
    if (category === 'GOLD_TH' && chartData.barBuyData) {
        firstTimeSeriesData = chartData.barBuyData;
    } else if ((category === 'GOLD_US' || category === 'USD_THB') && chartData.open) {
        firstTimeSeriesData = chartData.open; // Assuming 'open' data is sorted and can be used for default date
    } else if (chartData.barBuyPredictData && chartData.barBuyPredictData.length > 0) {
        firstTimeSeriesData = chartData.barBuyPredictData;
    }
    // Ensure firstTimeSeriesData is sorted if it comes from raw chartData
    const processedFirstTimeSeriesData = processTimeSeriesData(firstTimeSeriesData);
    const lastDataPointForDate = processedFirstTimeSeriesData.length > 0 ? processedFirstTimeSeriesData[processedFirstTimeSeriesData.length - 1] : null;
    const defaultDate = lastDataPointForDate ? formatDate(lastDataPointForDate.time) : 'N/A';
    if (dateRightBox.isConnected) dateRightBox.textContent = defaultDate;

    const getDefaultValue = (dataArray, valueKey = 'value') => {
        const sortedArray = processTimeSeriesData(dataArray); // Ensure it's sorted for reliable last point
        const lastPoint = sortedArray.length > 0 ? sortedArray[sortedArray.length - 1] : null;
        return lastPoint ? lastPoint[valueKey] : 0;
    };
    
    const defaultValues = {};
    currentSeriesConfigs.forEach(config => {
        let dataArrayForKey;
        let valueKey = 'value';

        if (category === 'GOLD_TH') {
            dataArrayForKey = chartData[config.key];
        } else if (category === 'GOLD_US' || category === 'USD_THB') {
            if (config.type === 'candlestick') {
                dataArrayForKey = chartData.close; 
                valueKey = 'value'; 
            } else {
                dataArrayForKey = chartData[config.key];
            }
        } else if (config.key === 'priceChangeData') { // Handle priceChangeData specifically
            dataArrayForKey = chartData[config.key];
        }


        if (dataArrayForKey && Array.isArray(dataArrayForKey)) {
            defaultValues[config.key] = getDefaultValue(dataArrayForKey, valueKey);
        } else {
            defaultValues[config.key] = 0;
        }
    });

    seriesLegendElements.forEach(item => {
      const legendConfig = item.config;
      const rightBox = item.element.querySelector('div:last-child');

      if (rightBox && defaultValues[legendConfig.key] !== undefined) {
        if (legendConfig.type === 'candlestick' && category !== 'GOLD_TH') {
            const closeVal = defaultValues[legendConfig.key]; // This is the default 'close' value
            // For initial display, just show close. Crosshair move will update with OHL C.
            rightBox.textContent = `C: ${Number(closeVal).toFixed(2)}`;
        } else {
            rightBox.textContent = Number(defaultValues[legendConfig.key]).toFixed(2);
        }
      }
    });

    chart.subscribeCrosshairMove(param => {
      const hoveredTime = param.time;
      const currentHoveredDate = hoveredTime ? formatDate(hoveredTime) : defaultDate;
      if (dateRightBox.isConnected) dateRightBox.textContent = currentHoveredDate;

      seriesLegendElements.forEach(item => {
        const legendConfig = item.config;
        const rightBox = item.element.querySelector('div:last-child');
        if (!rightBox || !item.element.isConnected) return;
        
        const isLegendEffectivelyVisible = seriesVisibility[legendConfig.key];
        if (!isLegendEffectivelyVisible) {
            return; 
        }

        let valueToDisplay = defaultValues[legendConfig.key] !== undefined ? defaultValues[legendConfig.key] : 0;
        let ohlcValues = null;

        if (hoveredTime) {
            const seriesInstance = seriesInstances[legendConfig.key];
            // param.seriesData might be an empty map if crosshair is on whitespace
            const seriesPoint = (param.seriesData && seriesInstance && param.seriesData.size > 0) ? param.seriesData.get(seriesInstance) : null;

            if (seriesPoint) {
                if (legendConfig.type === 'candlestick') {
                    ohlcValues = seriesPoint; 
                    valueToDisplay = seriesPoint.close; 
                } else {
                    valueToDisplay = seriesPoint.value !== undefined ? seriesPoint.value : (seriesPoint.close !== undefined ? seriesPoint.close : 0);
                }
            } else { 
                let dataArrayForLookup;
                let valueKeyForLookup = 'value';
                if (category === 'GOLD_TH') {
                    dataArrayForLookup = chartData[legendConfig.key];
                } else if (category === 'GOLD_US' || category === 'USD_THB') {
                    if (legendConfig.type === 'candlestick') {
                        // Construct the full OHLC point from individual arrays for the hoveredTime
                        const openPoint = chartData.open?.find(p => p.time === hoveredTime);
                        const highPoint = chartData.high?.find(p => p.time === hoveredTime);
                        const lowPoint = chartData.low?.find(p => p.time === hoveredTime);
                        const closePoint = chartData.close?.find(p => p.time === hoveredTime);
                        if (openPoint && highPoint && lowPoint && closePoint) {
                            ohlcValues = {
                                time: hoveredTime,
                                open: openPoint.value,
                                high: highPoint.value,
                                low: lowPoint.value,
                                close: closePoint.value,
                            };
                            valueToDisplay = closePoint.value;
                        } else {
                             valueToDisplay = defaultValues[legendConfig.key] !== undefined ? defaultValues[legendConfig.key] : 0; // Fallback if any part of OHLC is missing
                        }
                    } else {
                         dataArrayForLookup = chartData[legendConfig.key];
                    }
                }
                 if (dataArrayForLookup && Array.isArray(dataArrayForLookup)) {
                     const pointFromOriginalData = processTimeSeriesData(dataArrayForLookup).find(p => p.time === hoveredTime); // Search in processed data
                     if (pointFromOriginalData) valueToDisplay = pointFromOriginalData[valueKeyForLookup];
                     else valueToDisplay = defaultValues[legendConfig.key] !== undefined ? defaultValues[legendConfig.key] : 0; // Fallback
                } else if (!ohlcValues) { // If not candlestick and no direct lookup array
                     valueToDisplay = defaultValues[legendConfig.key] !== undefined ? defaultValues[legendConfig.key] : 0; // Fallback
                }
            }
        }
        
        if (legendConfig.type === 'candlestick' && category !== 'GOLD_TH') {
            if (ohlcValues) {
                rightBox.innerHTML = `O:${Number(ohlcValues.open).toFixed(2)} H:${Number(ohlcValues.high).toFixed(2)} L:${Number(ohlcValues.low).toFixed(2)} C:${Number(ohlcValues.close).toFixed(2)}`;
            } else { // Fallback if ohlcValues couldn't be determined for hoveredTime
                 rightBox.textContent = `C: ${Number(valueToDisplay).toFixed(2)}`;
            }
        } else {
            rightBox.textContent = Number(valueToDisplay).toFixed(2);
        }
      });
    });

    chart.timeScale().fitContent();
    const currentChart = chart;
    const currentContainer = styledLegendContainer;
    const currentSeriesLegendElements = [...seriesLegendElements];

    return () => {
      currentSeriesLegendElements.forEach(item => {
        if (item.element && item.clickHandler) {
          item.element.removeEventListener('click', item.clickHandler);
        }
      });
      if (currentChart) currentChart.remove();
      if (chartContainerRef.current && currentContainer && chartContainerRef.current.contains(currentContainer)) {
        chartContainerRef.current.removeChild(currentContainer);
      }
    };
  }, [chartData, category, seriesVisibility, currentSeriesConfigs]);

  return (
    <div
      ref={chartContainerRef}
      style={{
        position: 'relative', width: '100%', height: '400px',
        minWidth: 300, minHeight: 200,
      }}
    />
  );
};

export default Chart;
