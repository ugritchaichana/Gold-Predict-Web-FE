import React, { useEffect, useRef, useState, useContext } from 'react';
import { createChart, LineStyle, CrosshairMode, LineType } from 'lightweight-charts';
import { format as formatDateFns, isValid } from 'date-fns';
import { debugChartData } from './chart.debug.js';
import { useTheme } from '@/components/theme-provider';


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
    },crosshair: {
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
    },    grid: {
        vertLines: {
            color: theme === 'dark' ? '#292929' : '#f0f0f0',
            style: LineStyle.Solid,
        },
        horzLines: {
            color: theme === 'dark' ? '#292929' : '#f0f0f0',
            style: LineStyle.Solid,
        },    },
    animation: {
        duration: 0, // set to zero for instant changes
    },
});

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
  
  // Get current theme from context
  const { theme } = useTheme();
  
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
  }, [category, effectiveChartStyle]);  useEffect(() => {
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

    currentSeriesConfigs.forEach(config => {
        if (!seriesVisibility[config.key] && config.key !== 'priceChangeData') {
             return;
        }

        if (config.addToChart || config.key === 'priceChangeData') {
            let rawSeriesData = [];
            let processedSeriesDataForChart = [];

            if (category === 'GOLD_TH') {
                rawSeriesData = chartDataToUse[config.key] || [];
                processedSeriesDataForChart = processTimeSeriesData(rawSeriesData);
            } else if ((category === 'GOLD_US' || category === 'USD_THB') && config.type === 'candlestick') {
                if (Array.isArray(chartDataToUse.ohlc)) {
                    rawSeriesData = chartDataToUse.ohlc.filter(item => 
                        item && typeof item.time === 'number' && 
                        typeof item.open === 'number' && 
                        typeof item.high === 'number' && 
                        typeof item.low === 'number' && 
                        typeof item.close === 'number' && 
                        typeof item.close === 'number'
                    );
                    
                    processedSeriesDataForChart = rawSeriesData;
                }
            } else if (category === 'GOLD_US' || category === 'USD_THB') {
                // For line chart style with OHLC data
                rawSeriesData = chartDataToUse[config.key] || [];
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
                }
            }
            if (config.key === 'priceChangeData' && chartData[config.key]) {                 
                // This section handles ensuring chartData is properly processed for legend logic
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
    
    if (chartDataToUse?.barBuyPredictData && chartDataToUse.barBuyPredictData.length > 0) {
        const processedPredictions = processTimeSeriesData(chartDataToUse.barBuyPredictData);
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
    };

    currentSeriesConfigs.forEach(config => {
        let legendDataExists = false;
        if (category === 'GOLD_TH' && chartDataToUse[config.key]) {
            legendDataExists = true;
        } else if ((category === 'GOLD_US' || category === 'USD_THB')) {
            if (config.key.startsWith('ohlc_') && effectiveChartStyle === 'candlestick') {
                legendDataExists = chartDataToUse.ohlc && chartDataToUse.ohlc.length > 0;
            } else if (config.type === 'candlestick' && chartDataToUse.ohlc && chartDataToUse.ohlc.length > 0) {
                legendDataExists = true;
            } else if (effectiveChartStyle === 'line' && chartDataToUse[config.key] && chartDataToUse[config.key].length > 0) {
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
            ${effectiveChartStyle === 'candlestick' ? '' : 'cursor: pointer;'} 
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
            updateLegendStyle(legendRow, newVisibilityForKey, config);
            return { ...prevVisibility, [config.key]: newVisibilityForKey };
        });
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
    }, 0);

    let dataForDefaultDate = [];
    if (category === 'GOLD_TH' && chartDataToUse.barBuyData?.length) {
        dataForDefaultDate = chartDataToUse.barBuyData;
    } else if ((category === 'GOLD_US' || category === 'USD_THB')) {
        if (effectiveChartStyle === 'candlestick' && chartDataToUse.ohlc?.length) {
            dataForDefaultDate = chartDataToUse.ohlc;
        } else if (effectiveChartStyle === 'line') {
            if (chartDataToUse.closeData?.length) dataForDefaultDate = chartDataToUse.closeData;
            else if (chartDataToUse.openData?.length) dataForDefaultDate = chartDataToUse.openData;
            else if (chartDataToUse.highData?.length) dataForDefaultDate = chartDataToUse.highData;
            else if (chartDataToUse.lowData?.length) dataForDefaultDate = chartDataToUse.lowData;
        }
    } else if (chartDataToUse.barBuyPredictData?.length) {
        dataForDefaultDate = chartDataToUse.barBuyPredictData;
    } else if (category === 'GOLD_TH' && chartDataToUse.barSellData?.length) {
        dataForDefaultDate = chartDataToUse.barSellData;
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
    });

    const latestPredictionsInRange = chartDataToUse?.barBuyPredictData?.filter(data => {
        const fromTimestamp = dateRange?.from ? Math.floor(dateRange.from.getTime() / 1000) : 0;
        const toTimestamp = dateRange?.to ? Math.floor(dateRange.to.getTime() / 1000) : Infinity;
        return data.time >= fromTimestamp && data.time <= toTimestamp;
    }).slice(-10) || [];

    const displayedPredictions = chartDataToUse?.barBuyPredictData?.filter(data => {
        const fromTimestamp = dateRange?.from ? Math.floor(dateRange.from.getTime() / 1000) : 0;
        const toTimestamp = dateRange?.to ? Math.floor(dateRange.to.getTime() / 1000) : Infinity;
        return data.time >= fromTimestamp && data.time <= toTimestamp;
    }).slice(0, 10) || [];

    chart.subscribeCrosshairMove(param => {
        const currentTimeAtCrosshair = param.time;

        if (dateRightBox && dateRightBox.isConnected) {
            if (currentTimeAtCrosshair !== undefined) {
                dateRightBox.textContent = formatDate(currentTimeAtCrosshair);
            } else {
                dateRightBox.textContent = lastDataPointForDate ? formatDate(lastDataPointForDate.time) : 'N/A';
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
