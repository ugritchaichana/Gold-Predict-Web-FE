import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Line } from 'react-chartjs-2';
import { formatCurrency } from '@/lib/utils';

const LEGEND_KEY = 'monthly-predict-legend-visibility';

const MonthlyPredictionChart = ({ data }) => {
  const chartRef = useRef(null);
  const [legendVisibility, setLegendVisibility] = useState({});

  // Load legend visibility from localStorage
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

  // ฟังก์ชันบันทึก legend visibility ลง localStorage
  const saveLegendVisibility = useCallback((vis) => {
    localStorage.setItem(LEGEND_KEY, JSON.stringify(vis));
  }, []);

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48">
        <p className="text-amber-700 dark:text-amber-300">No chart data available</p>
      </div>
    );
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
      label: 'High Predict',
      data: highValues,
      borderColor: 'rgb(34, 197, 94)',
      backgroundColor: 'rgba(34, 197, 94, 0.1)',
      borderWidth: 2,
      tension: 0.3,
      pointHoverRadius: 7,
      hidden: legendVisibility['High Predict'] === undefined ? false : legendVisibility['High Predict']
    },
    {
      label: 'Actual High',
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
      label: 'Open Predict',
      data: openValues,
      borderColor: 'rgb(59, 130, 246)',
      backgroundColor: 'rgba(59, 130, 246, 0.1)',
      borderWidth: 2,
      tension: 0.3,
      pointHoverRadius: 7,
      hidden: legendVisibility['Open Predict'] === undefined ? true : legendVisibility['Open Predict']
    },
    {
      label: 'Actual Open',
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
      label: 'Low Predict',
      data: lowValues,
      borderColor: 'rgb(239, 68, 68)',
      backgroundColor: 'rgba(239, 68, 68, 0.1)',
      borderWidth: 2,
      tension: 0.3,
      pointHoverRadius: 7,
      hidden: legendVisibility['Low Predict'] === undefined ? true : legendVisibility['Low Predict']
    },
    {
      label: 'Actual Low',
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
        callbacks: {
          label: function(context) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              label += formatCurrency(context.parsed.y, 'THB');
            }
            return label;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: false,
        ticks: {
          callback: function(value) {
            return formatCurrency(value, 'THB');
          }
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.05)'
        }
      },
      x: {
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
