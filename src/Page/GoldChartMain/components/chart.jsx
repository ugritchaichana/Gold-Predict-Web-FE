import React, { useEffect, useRef, useState, useMemo } from 'react'; // Added useMemo
import { createChart } from 'lightweight-charts';
import { useChartData } from '../hook/fetchData';

const chartOptions = {
    layout: {
        textColor: 'black',
        background: { type: 'solid', color: 'white' },
    },
};

// Define series configurations outside the component or memoize if derived from props
const staticSeriesConfigs = [
    { key: 'barBuyData', color: 'blue', name: 'Bar Buy', addToChart: true, defaultVisible: true },
    { key: 'barSellData', color: 'red', name: 'Bar Sell', addToChart: true, defaultVisible: true },
    { key: 'ornamentBuyData', color: 'green', name: 'Ornament Buy', addToChart: true, defaultVisible: true },
    { key: 'ornamentSellData', color: 'orange', name: 'Ornament Sell', addToChart: true, defaultVisible: true },
    { key: 'priceChangeData', color: 'purple', name: 'Price Change', addToChart: false, defaultVisible: true },
];

const Chart = ({ symbolName = '' }) => {
  const { data, isLoading, isError, error } = useChartData();
  const chartContainerRef = useRef(null);

  // Use staticSeriesConfigs directly
  const seriesConfigs = staticSeriesConfigs;

  const [seriesVisibility, setSeriesVisibility] = useState(() => {
    const initial = {};
    seriesConfigs.forEach(config => {
        initial[config.key] = config.defaultVisible;
    });
    return initial;
  });

  // Effect to reset visibility when symbolName (and thus data) changes
  useEffect(() => {
    // console.log('SymbolName changed, resetting visibility');
    const initial = {};
    seriesConfigs.forEach(config => {
        initial[config.key] = config.defaultVisible;
    });
    setSeriesVisibility(initial);
  }, [symbolName, seriesConfigs]); // seriesConfigs is stable if defined outside

  // Main effect for chart rendering
  useEffect(() => {
    // console.log('Chart useEffect triggered. isLoading:', isLoading, 'isError:', isError, 'data:', !!data, 'seriesVisibility:', seriesVisibility);
    if (isLoading || isError || !data || !data.barBuyData) {
        // console.log('Chart useEffect: Pre-condition not met, returning.');
        return;
    }
    if (!chartContainerRef.current) {
        // console.log('Chart useEffect: No chart container ref.');
        return;
    }

    // console.log('Chart useEffect: Clearing and creating chart.');
    chartContainerRef.current.innerHTML = '';

    const chart = createChart(chartContainerRef.current, {
      ...chartOptions,
      width: chartContainerRef.current.clientWidth,
      height: chartContainerRef.current.clientHeight,
    });

    const seriesInstances = {};

    seriesConfigs.forEach(config => {
        if (config.addToChart && data[config.key] && data[config.key].length > 0) {
            seriesInstances[config.key] = chart.addLineSeries({
                color: config.color,
                lineWidth: 2,
                visible: seriesVisibility[config.key], // Directly use state
                title: config.name, // For default tooltip
            });
            seriesInstances[config.key].setData(data[config.key]);
            // console.log(`Series ${config.key} added, visible: ${seriesVisibility[config.key]}`);
        }
    });

    const styledLegendContainer = document.createElement('div');
    styledLegendContainer.style = `
      position: absolute;
      left: 12px;
      top: 12px;
      z-index: 1001; /* Ensure legend is on top */
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      font-size: 12px;
      font-family: sans-serif;
      line-height: 18px;
      font-weight: 300;
      background: rgba(255, 255, 255, 0.85); /* Slightly more opaque */
      padding: 8px;
      border-radius: 4px;
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

    const updateLegendStyle = (legendElement, isVisibleConfig, configColor) => {
        const leftBox = legendElement.children[0];
        const rightBox = legendElement.children[1];
        if (isVisibleConfig) {
            legendElement.style.opacity = '1';
            legendElement.style.borderColor = configColor;
            if (leftBox) leftBox.style.textDecoration = 'none';
            if (rightBox) rightBox.style.textDecoration = 'none';
        } else {
            legendElement.style.opacity = '0.5';
            legendElement.style.borderColor = 'grey';
            if (leftBox) leftBox.style.textDecoration = 'line-through';
            if (rightBox) rightBox.style.textDecoration = 'line-through';
        }
    };

    seriesConfigs.forEach(config => {
      if (!data[config.key] || data[config.key].length === 0) return;

      const legendRow = document.createElement('div');
      // Store config key on the element for easier access in handler if needed, or use closure
      // legendRow.dataset.seriesKey = config.key; 
      legendRow.style = `
        display: flex; align-items: center; border: 1px solid ${config.color};
        border-radius: 4px; overflow: hidden; box-sizing: border-box;
        cursor: pointer; transition: opacity 0.2s ease, border-color 0.2s ease;
      `;
      const leftBox = document.createElement('div');
      leftBox.style = `background: transparent; padding: 4px 8px; text-align: left;`;
      leftBox.textContent = config.name;
      const rightBox = document.createElement('div');
      rightBox.style = `background: ${config.color}; color: white; padding: 4px 8px; text-align: center; min-width: 75px;`;
      rightBox.textContent = '0.00';
      
      legendRow.appendChild(leftBox);
      legendRow.appendChild(rightBox);
      styledLegendContainer.appendChild(legendRow);
      
      const legendItem = { element: legendRow, config: config }; // Keep for potential direct manipulation if needed
      seriesLegendElements.push(legendItem);

      updateLegendStyle(legendRow, seriesVisibility[config.key], config.color);

      const clickHandler = () => {
        // console.log(`Legend clicked: ${config.name}`);
        setSeriesVisibility(prevVisibility => {
            const newVisibilityForKey = !prevVisibility[config.key];
            const updatedVisibility = { ...prevVisibility, [config.key]: newVisibilityForKey };
            
            // console.log(`Updating visibility for ${config.key} to ${newVisibilityForKey}`);
            
            if (config.addToChart && seriesInstances[config.key]) {
                seriesInstances[config.key].applyOptions({ visible: newVisibilityForKey });
            }
            // The style update will be handled by the re-render of useEffect,
            // but for instant feedback, we can call it here too.
            // updateLegendStyle(legendRow, newVisibilityForKey, config.color); 
            // However, it's better to let the useEffect re-render handle this for consistency with state.

            return updatedVisibility;
        });
      };
      legendRow.addEventListener('click', clickHandler);
      // Store handler for cleanup
      legendItem.clickHandler = clickHandler;
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
      const date = new Date(timestamp * 1000);
      const day = date.getDate().toString().padStart(2, '0');
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const month = monthNames[date.getMonth()];
      const year = date.getFullYear().toString().slice(-2);
      return `${day} ${month} '${year}`;
    };

    const lastBarBuyDataPoint = data.barBuyData && data.barBuyData.length > 0 ? data.barBuyData[data.barBuyData.length - 1] : null;
    const defaultDate = lastBarBuyDataPoint ? formatDate(lastBarBuyDataPoint.time) : 'N/A';
    if (dateRightBox.isConnected) dateRightBox.textContent = defaultDate;

    const getDefaultValue = (dataArray) => {
        const lastPoint = dataArray && dataArray.length > 0 ? dataArray[dataArray.length - 1] : null;
        return lastPoint ? lastPoint.value : 0;
    };
    
    const defaultValues = {};
    seriesConfigs.forEach(config => {
        if (data[config.key]) {
            defaultValues[config.key] = getDefaultValue(data[config.key]);
        }
    });

    seriesLegendElements.forEach(item => {
      const rightBox = item.element.children[1];
      if (rightBox && defaultValues[item.config.key] !== undefined) {
        rightBox.textContent = defaultValues[item.config.key].toFixed(2);
      }
      // Style is now applied when legend is created based on seriesVisibility state
    });

    chart.subscribeCrosshairMove(param => {
      const hoveredDate = param.time ? formatDate(param.time) : defaultDate;
      if (dateRightBox.isConnected) dateRightBox.textContent = hoveredDate;

      seriesLegendElements.forEach(item => {
        const rightBox = item.element.children[1];
        if (!rightBox || !item.element.isConnected) return;
        
        const isLegendEffectivelyVisible = seriesVisibility[item.config.key];
        if (!isLegendEffectivelyVisible) {
            // Value is kept but text-decoration: line-through is applied by updateLegendStyle
            return; 
        }

        let value = defaultValues[item.config.key] !== undefined ? defaultValues[item.config.key] : 0;

        if (item.config.addToChart && param.time && param.seriesData && seriesInstances[item.config.key]) {
            const seriesPoint = param.seriesData.get(seriesInstances[item.config.key]);
            if (seriesPoint) {
                 value = seriesPoint.value !== undefined ? seriesPoint.value : (seriesPoint.close !== undefined ? seriesPoint.close : 0);
            }
        } else if (!item.config.addToChart && param.time) {
            // Logic for non-chart series (like Price Change)
            const dataArray = data[item.config.key];
            if (dataArray) {
                // Simplified: find exact match or use default.
                const foundPoint = dataArray.find(p => p.time === param.time);
                value = foundPoint ? foundPoint.value : (defaultValues[item.config.key] !== undefined ? defaultValues[item.config.key] : 0);
            }
        }
        rightBox.textContent = value.toFixed(2);
      });
    });

    chart.timeScale().fitContent();

    return () => {
      // console.log('Chart useEffect: Cleanup');
      seriesLegendElements.forEach(item => {
        if (item.element && item.clickHandler) {
          item.element.removeEventListener('click', item.clickHandler);
        }
      });
      chart.remove();
      if (chartContainerRef.current && chartContainerRef.current.contains(styledLegendContainer)) {
        chartContainerRef.current.removeChild(styledLegendContainer);
      }
    };
  }, [data, isLoading, isError, symbolName, seriesVisibility, seriesConfigs]); // seriesVisibility is crucial here

  if (isLoading) return <div>Loading...</div>;
  if (isError) return <div>Error: {error?.message || 'Unknown error'}</div>;

  return (
    <div
      ref={chartContainerRef}
      style={{
        position: 'relative',
        width: '100%',
        height: '400px',
        minWidth: 300,
        minHeight: 200,
      }}
    />
  );
};

export default Chart;