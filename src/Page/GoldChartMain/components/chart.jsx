import React, { useEffect, useRef, useState } from 'react';
import { createChart, LineStyle, CrosshairMode, LineType } from 'lightweight-charts'; // Added CrosshairMode
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
    timeScale: {
        fixLeftEdge: true, // Optional: keeps the latest bar from being partially off-screen
        fixRightEdge: true, // Optional
        borderVisible: false,
        tickMarkFormatter: (time, tickMarkType, locale) => {
            const date = new Date(time * 1000);
            // Format: dd MMM 'yy (e.g., 10 May '25)
            return formatDateFns(date, "dd MMM ''yy"); 
        },
        allowTickMarksCompression: false, // Added this line
    },
    // Optional: Price scale options
    priceScale: {
        autoScale: true,
        position: 'right',
    },
};

const baseSeriesConfigs = {
    GOLD_TH: [
        { key: 'barBuyData', color: 'blue', name: 'Bar Buy', addToChart: true, defaultVisible: true, lineStyle: LineStyle.Solid, },
        { key: 'barBuyPredictData', color: '#42a5f5', name: 'Bar Buy (Predict)', addToChart: true, defaultVisible: true, lineStyle: LineStyle.Dashed },
        { key: 'barSellData', color: 'red', name: 'Bar Sell', addToChart: true, defaultVisible: true, lineStyle: LineStyle.Solid },
        { key: 'ornamentBuyData', color: 'green', name: 'Ornament Buy', addToChart: true, defaultVisible: true, lineStyle: LineStyle.Solid },
        { key: 'ornamentSellData', color: 'orange', name: 'Ornament Sell', addToChart: true, defaultVisible: true, lineStyle: LineStyle.Solid },
    ],    GOLD_US: {
        line: [
            { key: 'openData', color: 'blue', name: 'Open', addToChart: true, defaultVisible: true, lineStyle: LineStyle.Solid },
            { key: 'highData', color: 'green', name: 'High', addToChart: true, defaultVisible: true, lineStyle: LineStyle.Solid },
            { key: 'lowData', color: 'red', name: 'Low', addToChart: true, defaultVisible: true, lineStyle: LineStyle.Solid },
            { key: 'closeData', color: '#26a69a', name: 'Close', addToChart: true, defaultVisible: true, lineStyle: LineStyle.Solid },
        ],
        candlestick: [
            { key: 'ohlc', name: 'Close', addToChart: true, defaultVisible: true, type: 'candlestick' },
        ]
    },    USD_THB: {
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
          return {
            time: item.time,
            open: Number(item.open),
            high: Number(item.high),
            low: Number(item.low),
            close: Number(item.close),
          };
        }
        return {
          time: item.time,
          value: Number(item.value),
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
  const chartData = debugChartData(rawChartData, category);
  
  const chartContainerRef = useRef(null);
  
  // For GOLD_TH, we always use line style
  const effectiveChartStyle = category === 'GOLD_TH' ? 'line' : chartStyle;
    // Get the appropriate series configs based on category and chart style
  let currentSeriesConfigs = [];
  if (category === 'GOLD_TH') {
    currentSeriesConfigs = baseSeriesConfigs[category];  } else if (category === 'GOLD_US' || category === 'USD_THB') {
    // For GOLD_US or USD_THB, use different configs based on chart style
    if (effectiveChartStyle === 'line') {
      currentSeriesConfigs = baseSeriesConfigs[category].line;
    } else if (effectiveChartStyle === 'candlestick') {
      // Add separate legend configs for OHLC values (these won't be added to chart)
      const ohlcLegends = [
        { key: 'ohlc_open', name: 'Open', color: 'blue', addToChart: false, defaultVisible: true },
        { key: 'ohlc_high', name: 'High', color: 'green', addToChart: false, defaultVisible: true },
        { key: 'ohlc_low', name: 'Low', color: 'red', addToChart: false, defaultVisible: true },
      ];
      
      // Keep the original candlestick config for the chart and add it at the end
      currentSeriesConfigs = [...ohlcLegends, ...baseSeriesConfigs[category].candlestick];
    }
  }
  
  // Prepare line data if needed for GOLD_US or USD_THB
  useEffect(() => {
    if ((category === 'GOLD_US' || category === 'USD_THB') && effectiveChartStyle === 'line' && chartData && chartData.ohlc) {
      const lineData = convertOhlcDataToLines(chartData.ohlc);
      Object.assign(chartData, lineData);
    }
  }, [category, effectiveChartStyle, chartData]);

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
  }, [category, effectiveChartStyle]);

  useEffect(() => {
    if (!chartData) {
        if (chartContainerRef.current) chartContainerRef.current.innerHTML = '';
        return;
    }
    if (!chartContainerRef.current) {
        return;
    }
    chartContainerRef.current.innerHTML = '';
    
    // Create container for legends that will be placed above the chart
    const styledLegendContainer = document.createElement('div');
    styledLegendContainer.style = `
      position: relative; 
      display: flex; flex-wrap: wrap; gap: 8px; font-size: 12px;
      font-family: sans-serif; line-height: 18px; font-weight: 300;
      background: white; padding: 8px; border-bottom: 1px solid #e5e7eb;
      margin-bottom: 8px;
    `;
    
    // Create a container for the actual chart
    const chartElement = document.createElement('div');
    chartElement.style = `position: relative; width: 100%; height: calc(100% - 40px);`;
    
    // Add the legend container first, followed by the chart container
    chartContainerRef.current.appendChild(styledLegendContainer);
    chartContainerRef.current.appendChild(chartElement);
    
    const chart = createChart(chartElement, {
      ...chartOptions,
      width: chartElement.clientWidth,
      height: chartElement.clientHeight,
    });

    const seriesInstances = {};
    // Removed debug log

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
                if (Array.isArray(chartData.ohlc)) {
                    rawSeriesData = chartData.ohlc.filter(item => 
                        item && typeof item.time === 'number' && 
                        typeof item.open === 'number' && 
                        typeof item.high === 'number' && 
                        typeof item.low === 'number' && 
                        typeof item.close === 'number'
                    );
                    
                    processedSeriesDataForChart = rawSeriesData;
                }
            } else if (category === 'GOLD_US' || category === 'USD_THB') {
                // For line chart style with OHLC data
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
            if (config.key === 'priceChangeData' && chartData[config.key]) {                 // This section handles ensuring chartData is properly processed for legend logic
            }
        }
    });

    const formatDate = (timestamp) => {
        if (!timestamp && timestamp !== 0) return 'N/A';
        const date = new Date(timestamp * 1000);
        if (!isValid(date)) return 'N/A';

        return formatDateFns(date, 'EEE d MMM yy');
    };

    let effectiveToTimestamp;
    const originalToTimestamp = dateRange?.to ? Math.floor(dateRange.to.getTime() / 1000) : null;

    let maxPredictionTimestamp = null;
    if (chartData?.barBuyPredictData && chartData.barBuyPredictData.length > 0) {
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
    }    // Removed VertLine implementation

    const currentDateTimestamp = Math.floor(new Date(new Date().setHours(17, 0, 0, 0)).getTime() / 1000);
    // const lastestDateTimestampGoldTH = chartData?.barBuyData?.length ? chartData.barBuyData[chartData.barBuyData.length - 1].time : null; // Original line
    if (seriesInstances.barBuyPredictData) {
        seriesInstances.barBuyPredictData.setMarkers([
            {
                time: currentDateTimestamp, // Changed from lastestDateTimestampGoldTH
                position: 'aboveBar',
                color: '#23b8a6',
                shape: 'arrowDown',
                text: 'Current Day',
                size: 1.3,
            },
            {
                time: currentDateTimestamp, // Changed from lastestDateTimestampGoldTH
                position: 'inBar',
                color: '#23b8a6',
                shape: 'circle',
                size: 0.2,
            },
        ]);
    }

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

    const seriesLegendElements = [];    const updateLegendStyle = (legendElement, isVisibleConfig, configForStyle) => {
        const leftBox = legendElement.children[0];
        const valueBox = legendElement.children[1];
        const displayColor = configForStyle.type === 'candlestick' ? (isVisibleConfig ? '#26a69a' : 'grey') : (configForStyle.color || 'grey');

        legendElement.style.opacity = isVisibleConfig ? '1' : '0.5';
        legendElement.style.borderColor = isVisibleConfig ? displayColor : 'grey';
        if (leftBox) leftBox.style.textDecoration = isVisibleConfig ? 'none' : 'line-through';
        
        if (valueBox) {
            valueBox.style.textDecoration = isVisibleConfig ? 'none' : 'line-through';
            valueBox.style.background = isVisibleConfig ? displayColor : 'grey';
            valueBox.style.color = 'white';
        }
    };

    currentSeriesConfigs.forEach(config => {
        let legendDataExists = false;
        if (category === 'GOLD_TH' && chartData[config.key]) {
            legendDataExists = true;
        } else if ((category === 'GOLD_US' || category === 'USD_THB')) {
            if (config.key.startsWith('ohlc_') && effectiveChartStyle === 'candlestick') {
                legendDataExists = chartData.ohlc && chartData.ohlc.length > 0;
            } else if (config.type === 'candlestick' && chartData.ohlc && chartData.ohlc.length > 0) {
                legendDataExists = true;
            } else if (effectiveChartStyle === 'line' && chartData[config.key] && chartData[config.key].length > 0) {
                legendDataExists = true;
            }
        }
        if (!legendDataExists && config.key !== 'priceChangeData') return;

        const legendRow = document.createElement('div');
        const legendBorderColor = config.type === 'candlestick' ? (seriesVisibility[config.key] ? '#26a69a' : 'grey') : (config.color || 'grey');
        legendRow.style = `
            display: flex; align-items: center; border: 1px solid ${legendBorderColor};
            border-radius: 4px; overflow: hidden; box-sizing: border-box;
            ${effectiveChartStyle === 'candlestick' ? '' : 'cursor: pointer;'} transition: opacity 0.2s ease, border-color 0.2s ease;
        `;
      const nameBox = document.createElement('div');
      nameBox.style = `background: transparent; padding: 4px 8px; text-align: left;`;
      nameBox.textContent = config.name;
      legendRow.appendChild(nameBox);      const valueBox = document.createElement('div');
      valueBox.style = `
        background: ${config.color || (config.type === 'candlestick' ? '#26a69a' : 'transparent')}; 
        color: white; padding: 4px 8px; text-align: center; min-width: 75px;
      `;
      
      if (config.type === 'candlestick' && effectiveChartStyle === 'candlestick') {
          valueBox.textContent = 'OHLC';
      } else {
          valueBox.textContent = '0.00';
      }
      legendRow.appendChild(valueBox);
      styledLegendContainer.appendChild(legendRow);
      
      const legendItem = { element: legendRow, config: config, nameBox, valueBox, clickHandler: null };
      seriesLegendElements.push(legendItem);
      updateLegendStyle(legendRow, seriesVisibility[config.key], config);
      legendItem.clickHandler = () => {
        if (effectiveChartStyle === 'candlestick') return;
        
        setSeriesVisibility(prevVisibility => {
            const newVisibilityForKey = !prevVisibility[config.key];
            if (config.addToChart && seriesInstances[config.key] && seriesInstances[config.key].applyOptions) {
                seriesInstances[config.key].applyOptions({ visible: newVisibilityForKey });
            }
            return { ...prevVisibility, [config.key]: newVisibilityForKey };
        });
    };
        legendRow.addEventListener('click', legendItem.clickHandler);
    });    requestAnimationFrame(() => {
        if (!dateLegendRow || !dateLegendRow.isConnected) return;
        const dateLegendHeight = dateLegendRow.offsetHeight;
        if (dateLegendHeight > 0) {
            seriesLegendElements.forEach(item => {
                if (item.element.isConnected) {
                    item.element.style.height = `${dateLegendHeight}px`;
                }
            });
        }
    });    let dataForDefaultDate = [];
    if (category === 'GOLD_TH' && chartData.barBuyData?.length) {
        dataForDefaultDate = chartData.barBuyData;
    } else if ((category === 'GOLD_US' || category === 'USD_THB')) {
        if (effectiveChartStyle === 'candlestick' && chartData.ohlc?.length) {
            dataForDefaultDate = chartData.ohlc;
        } else if (effectiveChartStyle === 'line') {
            if (chartData.closeData?.length) dataForDefaultDate = chartData.closeData;
            else if (chartData.openData?.length) dataForDefaultDate = chartData.openData;
            else if (chartData.highData?.length) dataForDefaultDate = chartData.highData;
            else if (chartData.lowData?.length) dataForDefaultDate = chartData.lowData;
        }
    } else if (chartData.barBuyPredictData?.length) {
        dataForDefaultDate = chartData.barBuyPredictData;
    } else if (category === 'GOLD_TH' && chartData.barSellData?.length) {
        dataForDefaultDate = chartData.barSellData;
    }

    const processedDataForDefaultDate = processTimeSeriesData(dataForDefaultDate);
    const lastDataPointForDate = processedDataForDefaultDate.length > 0 ? processedDataForDefaultDate[processedDataForDefaultDate.length - 1] : null;
    if (dateRightBox) {
        dateRightBox.textContent = lastDataPointForDate ? formatDate(lastDataPointForDate.time) : 'N/A';
    }

    const getDefaultValue = (dataArrayInput, valueKey = 'value') => {
        const sortedArray = processTimeSeriesData(dataArrayInput || []);
        const lastPoint = sortedArray.length > 0 ? sortedArray[sortedArray.length - 1] : null;
        return lastPoint ? lastPoint[valueKey] : null;
    };
    
    const defaultDisplayValues = {};
    seriesLegendElements.forEach(item => {
        const config = item.config;
        let val = null;        if (config.type === 'candlestick' && effectiveChartStyle === 'candlestick' && (category === 'GOLD_US' || category === 'USD_THB')) {
            const ohlcArr = chartData.ohlc || [];
            const last = ohlcArr.length > 0 ? ohlcArr[ohlcArr.length - 1] : null;
            if (last) {
                const { close } = last;
                item.valueBox.textContent = close.toFixed(2);
            } else {
                item.valueBox.textContent = '-';
            }
            defaultDisplayValues[config.key] = last || {};        } else if (config.key.startsWith('ohlc_') && effectiveChartStyle === 'candlestick' && (category === 'GOLD_US' || category === 'USD_THB')) {
            const ohlcArr = chartData.ohlc || [];
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
            val = getDefaultValue(chartData[config.key], 'value');
            if (val !== null) item.valueBox.textContent = Number(val).toFixed(2);
            else item.valueBox.textContent = '-';
            defaultDisplayValues[config.key] = val;
        }
    });

    const latestPredictionsInRange = chartData?.barBuyPredictData?.filter(data => {
        const fromTimestamp = dateRange?.from ? Math.floor(dateRange.from.getTime() / 1000) : 0;
        const toTimestamp = dateRange?.to ? Math.floor(dateRange.to.getTime() / 1000) : Infinity;
        return data.time >= fromTimestamp && data.time <= toTimestamp;
    }).slice(-10) || [];

    const displayedPredictions = chartData?.barBuyPredictData?.filter(data => {
        const fromTimestamp = dateRange?.from ? Math.floor(dateRange.from.getTime() / 1000) : 0;
        const toTimestamp = dateRange?.to ? Math.floor(dateRange.to.getTime() / 1000) : Infinity;
        return data.time >= fromTimestamp && data.time <= toTimestamp;
    }).slice(0, 10) || [];

    chart.subscribeCrosshairMove(param => {
        const currentTimeAtCrosshair = param.time;

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
  }, [chartData, category, chartStyle, effectiveChartStyle, dateRange, seriesVisibility]);
  return <div ref={chartContainerRef} style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }} />;
};

export default Chart;
