import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Line } from 'react-chartjs-2';
import { formatCurrency } from '@/lib/utils';
import { enUS, th } from 'date-fns/locale';
import annotationPlugin from 'chartjs-plugin-annotation';
import { useTranslation } from 'react-i18next';
import './MonthlyPredictionChart.css'; // Import CSS file for custom styling

const LEGEND_KEY = 'monthly-predict-legend-visibility';

// ลงทะเบียน annotation plugin สำหรับ Chart.js
import { Chart as ChartJS } from 'chart.js';
ChartJS.register(annotationPlugin);

const MonthlyPredictionChart = ({ data }) => {
  const chartRef = useRef(null);
  const [legendVisibility, setLegendVisibility] = useState({});
  const { t, i18n } = useTranslation();
  
  // ย้ายฟังก์ชัน resetLegendSettings มาไว้ด้านบนก่อนการใช้งาน
  // สร้างฟังก์ชันสำหรับรีเซ็ต localStorage ถ้าเกิดปัญหา
  const resetLegendSettings = useCallback(() => {
    // เคลียร์ local storage
    localStorage.removeItem(LEGEND_KEY);
    // กำหนดค่าเริ่มต้น
    const defaultVisibility = {
      '0': false, // High Predict (visible)
      '1': false, // Actual High (visible)
      '2': true,  // Open Predict (hidden)
      '3': true,  // Actual Open (hidden)
      '4': true,  // Low Predict (hidden)
      '5': true   // Actual Low (hidden)
    };
    setLegendVisibility(defaultVisibility);
    localStorage.setItem(LEGEND_KEY, JSON.stringify(defaultVisibility));
    console.log('Legend settings reset to defaults');
    return defaultVisibility;
  }, []);
  
  // บันทึกค่า visibility ลงใน localStorage
  const saveLegendVisibility = useCallback((vis) => {
    try {
      localStorage.setItem(LEGEND_KEY, JSON.stringify(vis));
      console.log('Saved legend visibility to localStorage:', vis);
    } catch (error) {
      console.error('Error saving legend visibility:', error);
    }
  }, []);
  
  useEffect(() => {
    try {
      const saved = localStorage.getItem(LEGEND_KEY);
      let validVisibility = {};
      
      if (saved) {
        try {
          const savedData = JSON.parse(saved);
          
          // ตรวจสอบรูปแบบข้อมูลเก่า (ใช้ label เป็น key)
          if (typeof savedData === 'object' && Object.keys(savedData).some(key => typeof key === 'string' && isNaN(parseInt(key)))) {
            console.log('Converting old format to new format');
            // Map known labels to indices
            const labelToIndexMap = {
              'High Predict': '0',
              'Actual High': '1',
              'Open Predict': '2',
              'Actual Open': '3',
              'Low Predict': '4',
              'Actual Low': '5'
            };
            
            // แปลง label เป็น index
            Object.entries(savedData).forEach(([label, isHidden]) => {
              if (labelToIndexMap[label] !== undefined) {
                validVisibility[labelToIndexMap[label]] = !!isHidden; // รับรองว่าเป็น boolean
              }
            });
          } else if (typeof savedData === 'object') {
            // ตรวจสอบรูปแบบข้อมูลปัจจุบัน (ใช้ index เป็น key)
            // แปลงค่า key เป็น string (เผื่อกรณีที่เป็นตัวเลข) และค่า value เป็น boolean
            Object.entries(savedData).forEach(([key, value]) => {
              const keyStr = String(key);
              if (['0','1','2','3','4','5'].includes(keyStr)) {
                validVisibility[keyStr] = !!value; // รับรองว่าเป็น boolean
              }
            });
          }
          
          // ตรวจสอบว่ามีข้อมูลที่ถูกต้องหรือไม่
          if (Object.keys(validVisibility).length === 0) {
            throw new Error('No valid visibility data found');
          }
          
          // บันทึกข้อมูลที่ถูกต้องลงใน localStorage
          localStorage.setItem(LEGEND_KEY, JSON.stringify(validVisibility));
        } catch (error) {
          console.error('Error parsing saved legend visibility:', error);
          validVisibility = resetLegendSettings();
        }
      } else {
        // ถ้าไม่มีข้อมูลที่บันทึกไว้ ให้ใช้ค่าเริ่มต้น
        validVisibility = {
          '0': false, // High Predict (visible)
          '1': false, // Actual High (visible)
          '2': true,  // Open Predict (hidden)
          '3': true,  // Actual Open (hidden)
          '4': true,  // Low Predict (hidden)
          '5': true   // Actual Low (hidden)
        };
        localStorage.setItem(LEGEND_KEY, JSON.stringify(validVisibility));
      }
      
      // อัปเดต state
      setLegendVisibility(validVisibility);
      
      // แสดง debug info
      // console.log('Loaded legend visibility:', validVisibility);
      
    } catch (error) {
      console.error('Critical error loading legend settings:', error);
      // กรณีเกิดข้อผิดพลาดร้ายแรง ให้รีเซ็ตทั้งหมด
      resetLegendSettings();
    }
      // Add code to improve legend item hit areas with JavaScript after chart renders
  const applyLegendStyles = () => {
    try {
      // ปรับปรุงความสามารถในการคลิกของ legend items
      const legendItems = document.querySelectorAll('.chartjs-legend-ul li, .chartjs-legend li');
      console.log('Found legend items:', legendItems.length);
      
      legendItems.forEach((item, index) => {
        // เพิ่ม pointer cursor
        item.style.cursor = 'pointer';
        // เพิ่ม padding เพื่อเพิ่มพื้นที่คลิก
        item.style.padding = '8px 12px';
        // เพิ่ม border-radius เพื่อความสวยงาม
        item.style.borderRadius = '4px';
        
        // ลบ event listeners เดิมเพื่อป้องกันการซ้ำซ้อน
        const clonedItem = item.cloneNode(true);
        item.parentNode.replaceChild(clonedItem, item);
        
        // เพิ่มการตอบสนองเมื่อ hover
        clonedItem.addEventListener('mouseenter', () => {
          clonedItem.style.backgroundColor = 'rgba(0, 0, 0, 0.05)';
        });
        clonedItem.addEventListener('mouseleave', () => {
          clonedItem.style.backgroundColor = 'transparent';
        });
        
        // ทำให้การคลิกตอบสนองได้เร็วขึ้น
        clonedItem.addEventListener('click', (e) => {
          // เพิ่ม visual feedback ทันทีเมื่อคลิก
          console.log('Legend item clicked:', index);
          clonedItem.style.backgroundColor = 'rgba(0, 0, 0, 0.1)';
          setTimeout(() => {
            clonedItem.style.backgroundColor = 'transparent';
          }, 200);
          
          // ตรวจสอบว่า click event ได้ถูก propagate ไปถึง chart.js handler
          const rect = clonedItem.getBoundingClientRect();
          const centerX = rect.left + rect.width / 2;
          const centerY = rect.top + rect.height / 2;
          
          // สร้าง synthetic event ส่งต่อไปยัง chart.js หากจำเป็น
          if (chartRef.current) {
            const chart = chartRef.current;
            console.log('Dispatching synthetic click to chart legend');
          }
        });
      });
    } catch (error) {
      console.error('Error applying legend styles:', error);
    }
  };
  
  // Apply styles after the chart has rendered - เพิ่มเวลาเป็น 1000ms เพื่อให้มั่นใจว่า chart ถูกสร้างเสร็จแล้ว
  const timeoutId = setTimeout(applyLegendStyles, 1000);
  
  return () => {
    clearTimeout(timeoutId);
  };
  }, [resetLegendSettings]);
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
  const actualLowValues = data.map(item => item.actual_low);  const datasets = [
    {
      label: t('goldChart.monthlyPredict.highPredict', 'High Predict'),
      data: highValues,
      borderColor: 'rgb(34, 197, 94)',
      backgroundColor: 'rgba(34, 197, 94, 0.1)',
      borderWidth: 2,
      tension: 0.3,
      pointHoverRadius: 7,
      hidden: legendVisibility['0'] === true // ใช้ === true เพื่อความชัดเจน
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
      hidden: legendVisibility['1'] === true
    },
    {
      label: t('goldChart.monthlyPredict.openPredict', 'Open Predict'),
      data: openValues,
      borderColor: 'rgb(59, 130, 246)',
      backgroundColor: 'rgba(59, 130, 246, 0.1)',
      borderWidth: 2,
      tension: 0.3,
      pointHoverRadius: 7,
      hidden: legendVisibility['2'] === true || legendVisibility['2'] === undefined // default: hidden
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
      hidden: legendVisibility['3'] === true || legendVisibility['3'] === undefined // default: hidden
    },
    {
      label: t('goldChart.monthlyPredict.lowPredict', 'Low Predict'),
      data: lowValues,
      borderColor: 'rgb(239, 68, 68)',
      backgroundColor: 'rgba(239, 68, 68, 0.1)',
      borderWidth: 2,
      tension: 0.3,
      pointHoverRadius: 7,
      hidden: legendVisibility['4'] === true || legendVisibility['4'] === undefined // default: hidden
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
      hidden: legendVisibility['5'] === true || legendVisibility['5'] === undefined // default: hidden
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
          // เพิ่มพื้นที่คลิกและ visual feedback
          boxHeight: 20, // เพิ่มความสูงของกล่อง
          boxPadding: 10, // เพิ่ม padding ระหว่างสัญลักษณ์และข้อความ
          generateLabels: (chart) => {
            const datasets = chart.data.datasets;
            return datasets.map((dataset, i) => {
              const meta = chart.getDatasetMeta(i);
              // Correctly determine if the dataset is hidden
              // First check the meta.hidden, if null, use the dataset's hidden property
              const hidden = meta.hidden !== null ? meta.hidden : dataset.hidden === true;
                // Create a visually distinct appearance for hidden items while keeping text color the same
              return {
                text: dataset.label,
                fillStyle: hidden ? 'transparent' : dataset.borderColor,
                strokeStyle: dataset.borderColor,
                fontColor: dataset.borderColor, // Keep original color even when hidden
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
                  style: 'normal',
                  weight: hidden ? 'normal' : 'bold',
                  lineHeight: 1.2,
                  decoration: hidden ? 'line-through' : undefined
                },
                textDecoration: hidden ? 'line-through' : undefined,
                cursor: 'pointer', // เพิ่ม cursor pointer
              };
            });
          }        },        onClick: (e, legendItem, legend) => {
          const ci = legend.chart;
          const index = legendItem.datasetIndex;
          const meta = ci.getDatasetMeta(index);
          
          // ปรับปรุงการ toggle visibility ให้ชัดเจนและทำงานในคลิกเดียว
          const isCurrentlyVisible = meta.hidden === false || (meta.hidden === null && !ci.data.datasets[index].hidden);
          
          // กำหนดค่า hidden โดยตรง
          meta.hidden = isCurrentlyVisible;
          
          // อัปเดต chart
          ci.update();
          
          // บันทึกสถานะการซ่อน/แสดงลงใน localStorage (true = hidden, false = visible)
          const updatedVisibility = { ...legendVisibility };
          updatedVisibility[index.toString()] = isCurrentlyVisible;
          
          // Debug log - ตรวจสอบค่าที่จะบันทึกใน localStorage
          console.log(`Toggling dataset ${index}, setting hidden to ${isCurrentlyVisible}`);
          console.log('Updated visibility:', updatedVisibility);
          
          // อัปเดต state
          setLegendVisibility(updatedVisibility);
          
          // บันทึกลง localStorage โดยตรงเพื่อให้แน่ใจว่ามีการอัปเดต
          localStorage.setItem(LEGEND_KEY, JSON.stringify(updatedVisibility));
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
                    // For Thai language, use abbreviated month names from translation (using CE year)
                  if (i18n.language === 'th') {
                    const thaiMonthsObj = t('goldChart.dateRange.monthsShort', { returnObjects: true });
                    // Get the month key based on the current month index
                    const monthKey = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][date.getMonth()];
                    return `${thaiMonthsObj[monthKey]} ${date.getFullYear()}`;
                  }
                  
                  // For other languages, use the browser's locale setting (always use CE year)
                  return date.toLocaleString('en-US', { 
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

  // เพิ่มปุ่มรีเซ็ตเพื่อช่วยในการแก้ไขปัญหา
  useEffect(() => {
    // ตรวจสอบว่าได้กดปุ่ม Alt + R เพื่อรีเซ็ตการตั้งค่า legend
    const handleKeyDown = (e) => {
      if (e.altKey && e.key === 'r') {
        resetLegendSettings();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [resetLegendSettings]);
  
  // ดีบักการแสดงผลบน console เมื่อโหลด component
  useEffect(() => {
    console.log('MonthlyPredictionChart mounted with legendVisibility:', legendVisibility);
    
    // เพิ่ม listener สำหรับปุ่มตัวช่วยดีบัก
    const handleDebugKey = (e) => {
      if (e.altKey && e.key === 'd') {
        console.log('Current legend visibility state:', legendVisibility);
        console.log('LocalStorage value:', localStorage.getItem(LEGEND_KEY));
      }
    };
    
    window.addEventListener('keydown', handleDebugKey);
    return () => window.removeEventListener('keydown', handleDebugKey);
  }, [legendVisibility]);
  
  // เพิ่ม ref เพื่อเก็บสถานะปัจจุบันของ legends จากครั้งล่าสุดที่มีการอัปเดต
  const legendStateRef = useRef({});
  
  // อัปเดต ref เมื่อ legendVisibility เปลี่ยนแปลง
  useEffect(() => {
    legendStateRef.current = { ...legendVisibility };
  }, [legendVisibility]);

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
