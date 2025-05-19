import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Line } from 'react-chartjs-2';
import { formatCurrency } from '@/lib/utils';
import { enUS, th } from 'date-fns/locale';
import annotationPlugin from 'chartjs-plugin-annotation';
import { useTranslation } from 'react-i18next';

const LEGEND_KEY = 'monthly-predict-legend-visibility';

// ลงทะเบียน annotation plugin สำหรับ Chart.js
import { Chart as ChartJS } from 'chart.js';
ChartJS.register(annotationPlugin);

const MonthlyPredictionChart = ({ data }) => {
  const chartRef = useRef(null);
  const [legendVisibility, setLegendVisibility] = useState({});
  const { t, i18n } = useTranslation();

  useEffect(() => {
    const saved = localStorage.getItem(LEGEND_KEY);
    if (saved) {
      try {
        setLegendVisibility(JSON.parse(saved));
      } catch {
        setLegendVisibility({});
      }
    } else {
      setLegendVisibility({});
    }
  }, []);

  const saveLegendVisibility = useCallback((vis) => {
    localStorage.setItem(LEGEND_KEY, JSON.stringify(vis));
  }, []);
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48">
        <p className="text-amber-700 dark:text-amber-300">{t('goldChart.monthlyPredict.noChartData', 'No chart data available')}</p>
      </div>
    );
  }

  let currentMonth = null;
  let isFoundNull = false;

  const sortedData = [...data].sort((a, b) => {
    return new Date(b.month_predict) - new Date(a.month_predict);
  });

  for (let i = 0; i < sortedData.length; i++) {
    if (sortedData[i].actual_open === null && sortedData[i].actual_high === null && sortedData[i].actual_low === null) {
      isFoundNull = true;
    } else if (isFoundNull) {
      currentMonth = sortedData[i].month_predict;
      break;
    }
  }

  if (!isFoundNull && sortedData.length > 0) {
    currentMonth = sortedData[0].month_predict;
  }

  const months = data.map(item => item.month_predict);
  const highValues = data.map(item => item.high);
  const lowValues = data.map(item => item.low);
  const openValues = data.map(item => item.open);
  const actualHighValues = data.map(item => item.actual_high);
  const actualOpenValues = data.map(item => item.actual_open);
  const actualLowValues = data.map(item => item.actual_low);

  const datasets = [
    {
      label: t('goldChart.monthlyPredict.highPredict', 'High Predict'),
      data: highValues,
      borderColor: 'rgb(34, 197, 94)',
      backgroundColor: 'rgba(34, 197, 94, 0.1)',
      borderWidth: 2,
      tension: 0.3,
      pointHoverRadius: 7,
      hidden: legendVisibility['High Predict'] === undefined ? false : legendVisibility['High Predict']
    },
    {
      label: t('goldChart.monthlyPredict.actualHigh', 'Actual High'),
      data: actualHighValues,
      borderColor: 'rgb(16, 185, 129)',
      backgroundColor: 'rgba(16, 185, 129, 0.15)',
      borderWidth: 2,
      borderDash: [4,2],
      tension: 0.3,
      pointHoverRadius: 7,
      spanGaps: true,
      hidden: legendVisibility['Actual High'] === undefined ? false : legendVisibility['Actual High']
    },
    {
      label: t('goldChart.monthlyPredict.openPredict', 'Open Predict'),
      data: openValues,
      borderColor: 'rgb(59, 130, 246)',
      backgroundColor: 'rgba(59, 130, 246, 0.1)',
      borderWidth: 2,
      tension: 0.3,
      pointHoverRadius: 7,
      hidden: legendVisibility['Open Predict'] === undefined ? true : legendVisibility['Open Predict']
    },
    {
      label: t('goldChart.monthlyPredict.actualOpen', 'Actual Open'),
      data: actualOpenValues,
      borderColor: 'rgb(37, 99, 235)',
      backgroundColor: 'rgba(37, 99, 235, 0.15)',
      borderWidth: 2,
      borderDash: [4,2],
      tension: 0.3,
      pointHoverRadius: 7,
      spanGaps: true,
      hidden: legendVisibility['Actual Open'] === undefined ? true : legendVisibility['Actual Open']
    },
    {
      label: t('goldChart.monthlyPredict.lowPredict', 'Low Predict'),
      data: lowValues,
      borderColor: 'rgb(239, 68, 68)',
      backgroundColor: 'rgba(239, 68, 68, 0.1)',
      borderWidth: 2,
      tension: 0.3,
      pointHoverRadius: 7,
      hidden: legendVisibility['Low Predict'] === undefined ? true : legendVisibility['Low Predict']
    },
    {
      label: t('goldChart.monthlyPredict.actualLow', 'Actual Low'),
      data: actualLowValues,
      borderColor: 'rgb(220, 38, 38)',
      backgroundColor: 'rgba(220, 38, 38, 0.15)',
      borderWidth: 2,
      borderDash: [4,2],
      tension: 0.3,
      pointHoverRadius: 7,
      spanGaps: true,
      hidden: legendVisibility['Actual Low'] === undefined ? true : legendVisibility['Actual Low']
    }
  ];

  const chartData = {
    labels: months,
    datasets
  };
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      annotation: {
        annotations: {
          currentMonthLine: currentMonth ? {
            type: 'line',
            xMin: currentMonth,
            xMax: currentMonth,
            borderColor: document.documentElement.classList.contains('dark') ? '#fff' : '#222',
            borderWidth: 2,
            borderDash: [6, 6],
            label: {
              display: true,
              content: t('goldChart.monthlyPredict.currentMonth', 'C\u00A0u\u00A0r\u00A0r\u00A0e\u00A0n\u00A0t  \u00A0M\u00A0o\u00A0n\u00A0t\u00A0h'),
              color: document.documentElement.classList.contains('dark') ? '#fff' : '#222',
              backgroundColor: document.documentElement.classList.contains('dark') ? 'rgba(34,34,34,0.9)' : 'rgba(255,255,255,0.9)',
              position: 'start',
              rotation: -90,
              font: {
                size: 14,
                weight: 'bold',
                family: 'Inter, Arial, sans-serif',
                lineHeight: 1.2,
              },
              xAdjust: 20,
              yAdjust: -20,
              padding: { top: 8, bottom: 8, left: 12, right: 12 },
              cornerRadius: 6,
            },
            z: 99,
          } : {}
        }
      },
      legend: {
        position: 'top',
        labels: {
          boxWidth: 16,
          usePointStyle: true,
          pointStyle: 'circle',
          padding: 16,
          font: {
            family: 'Inter',
            size: 13
          },
          generateLabels: (chart) => {
            const datasets = chart.data.datasets;
            return datasets.map((dataset, i) => {
              const meta = chart.getDatasetMeta(i);
              const hidden = meta.hidden === true || chart.data.datasets[i].hidden === true;
              return {
                text: dataset.label,
                fillStyle: hidden ? 'transparent' : dataset.borderColor,
                strokeStyle: dataset.borderColor,
                fontColor: dataset.borderColor,
                lineWidth: hidden ? 2 : 0,
                pointStyle: 'circle',
                borderRadius: 8,
                hidden: hidden,
                datasetIndex: i,
                borderWidth: hidden ? 2 : 0,
                borderColor: dataset.borderColor,
                backgroundColor: hidden ? 'transparent' : dataset.borderColor,
                font: {
                  family: 'Inter',
                  size: 13,
                  style: hidden ? 'normal' : 'normal',
                  weight: hidden ? 'normal' : 'bold',
                  lineHeight: 1.2,
                  decoration: hidden ? 'line-through' : undefined
                },
                textDecoration: hidden ? 'line-through' : undefined
              };
            });
          }
        },
        onClick: (e, legendItem, legend) => {
          const ci = legend.chart;
          const index = legendItem.datasetIndex;
          const meta = ci.getDatasetMeta(index);
          // toggle visibility
          meta.hidden = meta.hidden === null ? !ci.data.datasets[index].hidden : null;
          ci.update();
          // update state & localStorage
          const label = ci.data.datasets[index].label;
          const newVis = { ...legendVisibility, [label]: !(meta.hidden === null ? !ci.data.datasets[index].hidden : !meta.hidden) };
          setLegendVisibility(newVis);
          saveLegendVisibility(newVis);
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: 'white',
        bodyColor: 'rgba(255, 255, 255, 0.8)',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        padding: 10,
        cornerRadius: 6,
        mode: 'index',
        intersect: false,
        callbacks: {          title: function(tooltipItems) {
            // แปลงรูปแบบเดือนจาก YYYY-MM เป็น MMMM YYYY or MMM YYYY (abbreviated)
            if (tooltipItems.length > 0) {
              const month = tooltipItems[0].label;
              if (month && month.includes('-')) {
                const [year, monthNum] = month.split('-');
                if (year && monthNum) {
                  const date = new Date(year, monthNum - 1, 1);
                    // For Thai language, use abbreviated month names from translation
                  if (i18n.language === 'th') {
                    const thaiMonthsObj = t('goldChart.dateRange.monthsShort', { returnObjects: true });
                    // Get the month key based on the current month index
                    const monthKey = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][date.getMonth()];
                    return `${thaiMonthsObj[monthKey]} ${date.getFullYear() + 543}`;
                  }
                  
                  // For other languages, use the browser's locale setting
                  return date.toLocaleString(i18n.language === 'th' ? 'th-TH' : 'en-US', { 
                    month: 'short',
                    year: 'numeric'
                  });
                }
              }
            }
            return tooltipItems[0].label;
          },label: function(context) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }            if (context.parsed.y !== null) {
              // Format currency with the appropriate currency code
              label += formatCurrency(context.parsed.y, 'THB', i18n.language === 'th' ? 'th-TH' : 'en-US');
            }
            return label;
          }
        }
      }
    },    scales: {
      y: {
        beginAtZero: false,        ticks: {
          callback: function(value) {
            return formatCurrency(value, 'THB', i18n.language === 'th' ? 'th-TH' : 'en-US');
          }
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.05)'
        }
      },
      x: {
        type: 'time',        time: {
          unit: 'month',
          displayFormats: {
            month: i18n.language === 'th' ? 'MMM yyyy' : 'MMM yyyy'
          },
          tooltipFormat: i18n.language === 'th' ? 'MMM yyyy' : 'MMM yyyy'
        },adapters: {
          date: {
            locale: i18n.language === 'th' ? th : enUS
          }
        },
        grid: {
          display: false
        }
      }
    }
  };

  return (
    <div className="h-96">
      <Line 
        ref={chartRef}
        data={chartData} 
        options={options} 
      />
    </div>
  );
};

export default MonthlyPredictionChart;
