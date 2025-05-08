import React, { useEffect, useRef } from 'react';
import { createChart } from 'lightweight-charts';
import { useChartData } from '../hook/fetchData';

const chartOptions = {
    layout: {
        textColor: 'black',
        background: { type: 'solid', color: 'white' },
    },
};

const Chart = ({ symbolName = '' }) => {
  const { data, isLoading, isError, error } = useChartData();
  const chartContainerRef = useRef(null);

  useEffect(() => {
    if (isLoading || isError || !data || !data.barBuyData) {
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
    const seriesConfigs = [ 
        { key: 'barBuyData', color: 'blue', name: 'Bar Buy', addToChart: true },
        { key: 'barSellData', color: 'red', name: 'Bar Sell', addToChart: true },
        { key: 'ornamentBuyData', color: 'green', name: 'Ornament Buy', addToChart: true },
        { key: 'ornamentSellData', color: 'orange', name: 'Ornament Sell', addToChart: true },
        { key: 'priceChangeData', color: 'purple', name: 'Price Change', addToChart: false }, 
    ];

    seriesConfigs.forEach(config => {
        if (config.addToChart && data[config.key] && data[config.key].length > 0) {
            seriesInstances[config.key] = chart.addLineSeries({
                color: config.color,
                lineWidth: 2,
            });
            seriesInstances[config.key].setData(data[config.key]);
        }
    });

    const styledLegendContainer = document.createElement('div');
    styledLegendContainer.style = `
      position: absolute;
      left: 12px;
      top: 12px;
      z-index: 1;
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      font-size: 12px;
      font-family: sans-serif;
      line-height: 18px;
      font-weight: 300;
      background: rgba(255, 255, 255, 0.8);
      padding: 8px;
      border-radius: 4px;
    `;

    const dateLegendRow = document.createElement('div');
    dateLegendRow.id = 'date-legend-row';
    dateLegendRow.style = `
      display: flex;
      align-items: center;
      border: 1px solid black;
      border-radius: 4px;
      overflow: hidden;
      box-sizing: border-box;
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
    seriesConfigs.forEach(config => {
      if (!data[config.key] || data[config.key].length === 0) return;

      const legendRow = document.createElement('div');
      legendRow.style = `
        display: flex;
        align-items: center;
        border: 1px solid ${config.color};
        border-radius: 4px;
        overflow: hidden;
        box-sizing: border-box;
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
      seriesLegendElements.push({ element: legendRow, config: config });
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
    dateRightBox.textContent = defaultDate;

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
    });

    chart.subscribeCrosshairMove(param => {
      const hoveredDate = param.time ? formatDate(param.time) : defaultDate;
      if (dateRightBox.isConnected) dateRightBox.textContent = hoveredDate;

      seriesLegendElements.forEach(item => {
        const rightBox = item.element.children[1];
        if (!rightBox || !item.element.isConnected) return;
        
        let value = defaultValues[item.config.key] !== undefined ? defaultValues[item.config.key] : 0;

        if (item.config.addToChart && param.time && param.seriesData && seriesInstances[item.config.key]) {
            const seriesPoint = param.seriesData.get(seriesInstances[item.config.key]);
            if (seriesPoint) {
                 value = seriesPoint.value !== undefined ? seriesPoint.value : (seriesPoint.close !== undefined ? seriesPoint.close : 0);
            }
        } else if (!item.config.addToChart && param.time) {
            const dataArray = data[item.config.key];
            if (dataArray) {
                let foundPoint = null;
                for (let i = dataArray.length - 1; i >= 0; i--) {
                    if (dataArray[i].time === param.time) {
                        foundPoint = dataArray[i];
                        break;
                    }
                }
                if (foundPoint) {
                    value = foundPoint.value;
                } else {
                    value = defaultValues[item.config.key] !== undefined ? defaultValues[item.config.key] : 0;
                }
            }
        }
        rightBox.textContent = value.toFixed(2);
      });
    });

    chart.timeScale().fitContent();

    return () => {
      chart.remove();
      if (chartContainerRef.current && chartContainerRef.current.contains(styledLegendContainer)) {
        chartContainerRef.current.removeChild(styledLegendContainer);
      }
    };
  }, [data, isLoading, isError, symbolName]);

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