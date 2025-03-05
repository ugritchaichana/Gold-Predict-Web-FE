// src/components/GoldChart.jsx
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale,
} from 'chart.js';
import 'chartjs-adapter-date-fns';
import { fetchGoldTH, fetchGoldUS, fetchUSDTHB, fetchPredictions } from '../services/apiService';
import { format, isValid } from 'date-fns';
import { enUS } from 'date-fns/locale';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale
);

const DataCategories = {
  GOLD_TH: 'Gold TH',
  GOLD_US: 'Gold US',
  USDTHB: 'USD THB'
};

const TimeFrames = {
  '7d': '7 Days',
  '1m': '1 Month',
  '1y': '1 Year',
  'all': 'All Time'
};

const GoldChart = ({ darkMode }) => {
  const [selectedCategory, setSelectedCategory] = useState(DataCategories.GOLD_TH);
  const [timeframe, setTimeframe] = useState('7d');
  const [goldThData, setGoldThData] = useState([]);
  const [goldUsData, setGoldUsData] = useState([]);
  const [usdthbData, setUsdthbData] = useState([]);
  const [predictData, setPredictData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const chartRef = useRef(null);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        if (selectedCategory === DataCategories.GOLD_TH) {
          const [goldThResponse, predictionResponse] = await Promise.all([
            fetchGoldTH(timeframe),
            fetchPredictions()
          ]);

          if (goldThResponse?.data) {
            const processedData = goldThResponse.data.map(item => ({
              x: item.created_at || item.date,
              y: typeof item.price === 'string' ? parseFloat(item.price) : item.price
            })).filter(item => item.x && !isNaN(item.y));
            
            // เรียงข้อมูลตามวันที่เพื่อให้แสดงข้อมูลล่าสุดได้ถูกต้อง
            const sortedData = [...processedData].sort((a, b) => new Date(a.x) - new Date(b.x));
            // แสดง 3 ข้อมูลล่าสุดของ GoldTH
            console.log('3 Latest GoldTH data:', sortedData.slice(-3));
            
            setGoldThData(processedData);
          }

          if (predictionResponse?.status === 'success' && predictionResponse.week) {
            const processedPredictions = Object.entries(predictionResponse.week)
              .filter(([key]) => /^\d{4}-\d{2}-\d{2}$/.test(key))
              .map(([key, value]) => ({
                x: key,
                y: typeof value === 'string' ? parseFloat(value) : value
              }))
              .filter(item => item.y !== null && !isNaN(item.y))
              .sort((a, b) => new Date(a.x) - new Date(b.x));

            // แสดง 3 ข้อมูลแรกของ Prediction
            console.log('First 3 Prediction data:', processedPredictions.slice(0, 3));
            
            setPredictData(processedPredictions);
          }
        } else if (selectedCategory === DataCategories.GOLD_US) {
          const response = await fetchGoldUS(timeframe);
          if (response?.data) {
            const processedData = response.data.map(item => ({
              x: item.created_at || item.date,
              y: typeof item.price === 'string' ? parseFloat(item.price) : item.price
            })).filter(item => item.x && !isNaN(item.y));
            
            setGoldUsData(processedData);
          }
        } else if (selectedCategory === DataCategories.USDTHB) {
          const response = await fetchUSDTHB(timeframe);
          if (response?.data) {
            const processedData = response.data.map(item => ({
              x: item.created_at || item.date,
              y: typeof item.price === 'string' ? parseFloat(item.price) : item.price
            })).filter(item => item.x && !isNaN(item.y));
            
            setUsdthbData(processedData);
          }
        }
      } catch (err) {
        console.error('Failed to load data:', err);
        setError('Failed to load data. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [selectedCategory, timeframe]);

  const chartData = useMemo(() => {
    let data = [];
    let predictions = [];

    switch (selectedCategory) {
      case DataCategories.GOLD_TH:
        data = goldThData || [];
        predictions = predictData || [];
        break;
      case DataCategories.GOLD_US:
        data = goldUsData || [];
        break;
      case DataCategories.USDTHB:
        data = usdthbData || [];
        break;
      default:
        data = [];
    }

    // ป้องกันการทำงานกับข้อมูลที่เป็น null หรือ undefined
    if (!data || !Array.isArray(data)) {
      console.warn('Invalid data array:', data);
      data = [];
    }

    if (!predictions || !Array.isArray(predictions)) {
      console.warn('Invalid predictions array:', predictions);
      predictions = [];
    }

    // ตรวจสอบว่าข้อมูลมีการทับซ้อนกันหรือไม่
    console.log('Checking for overlapping dates...');
    const dataDateSet = new Set();
    
    // สร้าง Set ของวันที่จากข้อมูลจริง
    data.forEach(item => {
      if (!item || !item.x) return;
      try {
        const dateStr = new Date(item.x).toISOString().split('T')[0];
        dataDateSet.add(dateStr);
      } catch (err) {
        console.error('Error processing data item:', item, err);
      }
    });
    
    // กรองข้อมูล prediction ที่ซ้ำซ้อนกับข้อมูลจริงออก
    let overlappingCount = 0;
    const filteredPredictions = predictions.filter(item => {
      if (!item || !item.x) return false;
      try {
        const dateStr = new Date(item.x).toISOString().split('T')[0];
        if (dataDateSet.has(dateStr)) {
          // แทนที่จะใช้ console.warn ให้ใช้ console.log เพื่อป้องกัน error
          console.log(`Skipping prediction date ${dateStr} (overlaps with actual data)`);
          overlappingCount++;
          return false;
        }
        return true;
      } catch (err) {
        console.error('Error processing prediction item:', item, err);
        return false;
      }
    });
    
    console.log(`Filtered out ${overlappingCount} prediction points that overlap with actual data`);
    
    // เรียงข้อมูลจริงตามวันที่
    const sortedData = [...data].filter(item => item && item.x).sort((a, b) => {
      try {
        return new Date(a.x) - new Date(b.x);
      } catch (err) {
        console.error('Error sorting data:', a, b, err);
        return 0;
      }
    });
    
    // เรียงข้อมูล prediction ตามวันที่
    const sortedPredictions = [...filteredPredictions]
      .filter(item => item && item.x)
      .sort((a, b) => {
        try {
          return new Date(a.x) - new Date(b.x);
        } catch (err) {
          console.error('Error sorting predictions:', a, b, err);
          return 0;
        }
      });
    
    // สร้างข้อมูลสำหรับกราฟที่มีการตรวจสอบความสมบูรณ์
    const chartDatasets = [];
    
    // เพิ่ม dataset สำหรับข้อมูลจริงเฉพาะเมื่อมีข้อมูล
    if (sortedData.length > 0) {
      chartDatasets.push({
        label: selectedCategory,
        data: sortedData
          .filter(item => {
            try {
              return item && item.x && !isNaN(new Date(item.x).getTime()) && !isNaN(item.y);
            } catch (err) {
              console.error('Error validating data item:', item, err);
              return false;
            }
          })
          .map(item => {
            try {
              return { x: new Date(item.x), y: item.y };
            } catch (err) {
              console.error('Error mapping data item:', item, err);
              return null;
            }
          })
          .filter(Boolean), // กรอง null values ออก
        borderColor: darkMode ? 'rgba(255, 99, 132, 1)' : 'rgba(255, 99, 132, 1)',
        backgroundColor: 'transparent',
        tension: 0.4,
      });
    }

    // เพิ่ม dataset สำหรับ prediction ที่ต่อเนื่องจากข้อมูลจริง
    if (sortedPredictions.length > 0 && sortedData.length > 0) {
      try {
        // หาจุดสุดท้ายของข้อมูลจริง
        const lastActualPoint = sortedData[sortedData.length - 1];
        
        if (lastActualPoint && lastActualPoint.x && !isNaN(lastActualPoint.y)) {
          // สร้างชุดข้อมูล prediction ที่เริ่มต้นด้วยจุดสุดท้ายของข้อมูลจริง
          const continuousPredictionData = [];
          
          // เพิ่มจุดสุดท้ายของข้อมูลจริงเป็นจุดแรกของ prediction
          try {
            continuousPredictionData.push({ 
              x: new Date(lastActualPoint.x), 
              y: lastActualPoint.y 
            });
          } catch (err) {
            console.error('Error adding last actual point to prediction data:', lastActualPoint, err);
          }
          
          // เพิ่มข้อมูล prediction ที่เรียงลำดับแล้วเข้าไปในชุดข้อมูล
          sortedPredictions.forEach(item => {
            try {
              if (item && item.x && !isNaN(item.y)) {
                continuousPredictionData.push({ 
                  x: new Date(item.x), 
                  y: item.y 
                });
              }
            } catch (err) {
              console.error('Error adding prediction item to continuous data:', item, err);
            }
          });
          
          // ตรวจสอบก่อนที่จะ log
          if (continuousPredictionData.length > 0) {
            console.log('Continuous prediction data length:', continuousPredictionData.length);
            
            chartDatasets.push({
              label: `${selectedCategory} Prediction`,
              data: continuousPredictionData,
              borderColor: darkMode ? 'rgba(54, 162, 235, 1)' : 'rgba(54, 162, 235, 1)',
              backgroundColor: 'transparent',
              borderDash: [5, 5],
              tension: 0.4,
            });
          }
        } else {
          console.log('Could not create continuous prediction: invalid last actual point', lastActualPoint);
        }
      } catch (err) {
        console.error('Error creating continuous prediction data:', err);
      }
    }

    // สร้าง labels จากข้อมูลที่มีการตรวจสอบความถูกต้องแล้ว
    const allDates = [];
    
    // เพิ่มวันที่จากข้อมูลจริง
    sortedData.forEach(item => {
      try {
        if (item && item.x && !isNaN(new Date(item.x).getTime())) {
          allDates.push(new Date(item.x));
        }
      } catch (err) {
        console.error('Error adding date from actual data:', item, err);
      }
    });
    
    // เพิ่มวันที่จากข้อมูล prediction (ไม่รวมวันที่ซ้ำซ้อน)
    sortedPredictions.forEach(item => {
      try {
        if (item && item.x && !isNaN(new Date(item.x).getTime())) {
          const dateStr = new Date(item.x).toISOString().split('T')[0];
          // ตรวจสอบว่าวันที่นี้มีอยู่ใน dataDateSet หรือไม่
          if (!dataDateSet.has(dateStr)) {
            allDates.push(new Date(item.x));
          }
        }
      } catch (err) {
        console.error('Error adding date from prediction data:', item, err);
      }
    });
    
    // เรียงลำดับวันที่
    allDates.sort((a, b) => a - b);
    
    return {
      labels: allDates,
      datasets: chartDatasets
    };
  }, [selectedCategory, goldThData, goldUsData, usdthbData, predictData, darkMode]);

  const options = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: darkMode ? '#f3f4f6' : '#1f2937',
          font: {
            family: 'Inter',
            size: 12
          },
          usePointStyle: true,
          boxWidth: 6
        }
      },
      tooltip: {
        backgroundColor: darkMode ? 'rgba(31, 41, 55, 0.8)' : 'rgba(255, 255, 255, 0.8)',
        titleColor: darkMode ? '#f3f4f6' : '#1f2937',
        bodyColor: darkMode ? '#d1d5db' : '#4b5563',
        padding: 12,
        cornerRadius: 8,
        displayColors: true,
        callbacks: {
          title: (items) => {
            if (!items || !items.length) return '';
            try {
              const date = new Date(items[0].parsed.x);
              return isValid(date) ? format(date, 'dd MMMM yyyy', { locale: enUS }) : 'Invalid date';
            } catch (err) {
              console.error('Error formatting tooltip title:', err);
              return 'Date error';
            }
          },
          label: (item) => {
            if (!item || item.parsed?.y === undefined) return '';
            try {
              const value = item.parsed.y;
              return `${item.dataset.label}: ${new Intl.NumberFormat('en-US').format(value)}`;
            } catch (err) {
              console.error('Error formatting tooltip label:', err);
              return `${item.dataset?.label || 'Value'}: Error`;
            }
          }
        }
      },
    },
    scales: {
      x: {
        type: 'time',
        time: {
          unit: timeframe === '7d' ? 'day' : timeframe === '1m' ? 'week' : 'month',
          displayFormats: {
            day: 'd MMM',
            week: 'dd MMM',
            month: 'MMM yyyy'
          },
          parser: 'yyyy-MM-dd'
        },
        bounds: 'data',
        adapters: {
          date: {
            locale: enUS
          }
        },
        grid: {
          color: darkMode ? 'rgba(75, 85, 99, 0.15)' : 'rgba(229, 231, 235, 0.5)',
        },
        ticks: {
          color: darkMode ? '#9ca3af' : '#4b5563',
          font: {
            family: 'Inter',
            size: 10
          },
          maxRotation: 45,
          autoSkip: true
        }
      },
      y: {
        grid: {
          color: darkMode ? 'rgba(75, 85, 99, 0.15)' : 'rgba(229, 231, 235, 0.5)',
        },
        ticks: {
          color: darkMode ? '#9ca3af' : '#4b5563',
          font: {
            family: 'Inter',
            size: 10
          },
          callback: (value) => {
            try {
              return new Intl.NumberFormat('en-US').format(value);
            } catch (err) {
              console.error('Error formatting y-axis tick:', err);
              return value;
            }
          }
        }
      }
    }
  }), [timeframe, darkMode]);

  if (error) {
    return (
      <Card className="bg-destructive/10">
        <CardContent className="pt-6">
          <div className="text-center">
            <p className="text-destructive">{error}</p>
            <Button variant="outline" className="mt-4" onClick={() => window.location.reload()}>
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex gap-2">
            {Object.values(DataCategories).map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                onClick={() => setSelectedCategory(category)}
              >
                {category}
              </Button>
            ))}
          </div>
          <Select value={timeframe} onValueChange={setTimeframe}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select timeframe" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(TimeFrames).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative h-[400px]">
          {loading ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <Skeleton className="w-full h-full" />
            </div>
          ) : (
            // ใช้ try-catch เพื่อป้องกัน error ที่อาจเกิดขึ้นจาก Chart.js
            (() => {
              try {
                // ตรวจสอบว่า chartData มีข้อมูลที่ถูกต้องหรือไม่
                if (!chartData || !chartData.datasets || chartData.datasets.length === 0) {
                  return (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <p className="text-muted-foreground">No data available</p>
                    </div>
                  );
                }
                
                // ตรวจสอบว่า chartData.labels มีข้อมูลที่ถูกต้องหรือไม่
                if (!chartData.labels || chartData.labels.length === 0) {
                  console.warn('No labels available for chart');
                }
                
                return <Line data={chartData} options={options} ref={chartRef} />;
              } catch (err) {
                console.error('Error rendering chart:', err);
                return (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <p className="text-destructive">Error rendering chart</p>
                  </div>
                );
              }
            })()
          )}
        </div>
        {selectedCategory === DataCategories.GOLD_TH && predictData?.length > 0 && (
          <div className="mt-4 p-4 bg-muted rounded-lg">
            {/* <p className="text-sm text-muted-foreground">
              Predictions are based on statistical models and should not be considered as investment advice.
            </p> */}
            
            {/* ตารางแสดงข้อมูล */}
            <div className="overflow-x-auto">
              <h3 className="text-lg font-semibold mb-3">ข้อมูลราคาทองและการคาดการณ์</h3>
              <table className="w-full border-collapse bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-sm">
                <thead>
                  <tr>
                    <th className="border border-gray-300 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-center font-semibold text-gray-700 dark:text-gray-300">ประเภท</th>
                    {(() => {
                      try {
                        // สร้างช่วงวันที่สำหรับตาราง
                        let dates = [];
                        
                        // เรียงข้อมูล GoldTH ตามวันที่
                        const sortedData = [...(goldThData || [])].filter(item => item && item.x)
                          .sort((a, b) => new Date(a.x) - new Date(b.x));
                        
                        // เรียงข้อมูล prediction ตามวันที่
                        const sortedPredictions = [...(predictData || [])].filter(item => item && item.x)
                          .sort((a, b) => new Date(a.x) - new Date(b.x));
                        
                        // เลือกข้อมูลจริงล่าสุด
                        if (sortedData.length > 0) {
                          const latestRealIndex = sortedData.length - 1;
                          // เลือกข้อมูลย้อนหลัง 3 วัน และวันล่าสุด
                          const startIndex = Math.max(0, latestRealIndex - 2);
                          for (let i = startIndex; i <= latestRealIndex; i++) {
                            if (sortedData[i] && sortedData[i].x) {
                              dates.push(new Date(sortedData[i].x));
                            }
                          }
                        }
                        
                        // เพิ่มวันที่จากข้อมูลทำนายทั้งหมด
                        sortedPredictions.forEach(item => {
                          if (item && item.x) {
                            const predDate = new Date(item.x);
                            // เช็คว่าวันที่นี้มีอยู่ในรายการหรือไม่
                            const dateExists = dates.some(date => 
                              date.toISOString().split('T')[0] === predDate.toISOString().split('T')[0]
                            );
                            if (!dateExists) {
                              dates.push(predDate);
                            }
                          }
                        });
                        
                        // เรียงวันที่ให้ถูกต้อง
                        dates.sort((a, b) => a - b);
                        
                        // หาข้อมูลจริงล่าสุดเพื่อใช้คำนวณแนวโน้ม
                        const _latestRealData = sortedData.length > 0 ? sortedData[sortedData.length - 1] : null;
                        
                        // สร้างหัวตาราง
                        return dates.map((date, index) => {
                          const isToday = new Date().toISOString().split('T')[0] === date.toISOString().split('T')[0];
                          const isPrediction = sortedData.every(item => {
                            try {
                              return new Date(item.x).toISOString().split('T')[0] !== date.toISOString().split('T')[0];
                            } catch (_) {
                              return true;
                            }
                          });
                          
                          return (
                            <th 
                              key={index} 
                              className={`border border-gray-300 px-4 py-2 text-center text-xs font-semibold
                                ${isToday ? 'bg-yellow-50 dark:bg-yellow-900' : 
                                  isPrediction ? 'bg-blue-50 dark:bg-blue-900 text-blue-700 dark:text-blue-300' : 
                                  'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}
                            >
                              {format(date, 'dd MMM yyyy', { locale: enUS })}
                              {isPrediction && <span className="ml-1 text-xs">(ทำนาย)</span>}
                              {isToday && <span className="ml-1 text-xs">(วันนี้)</span>}
                            </th>
                          );
                        });
                      } catch (err) {
                        console.error('Error creating table headers:', err);
                        return <th className="border border-gray-300 px-4 py-2">Error loading dates</th>;
                      }
                    })()}
                  </tr>
                </thead>
                <tbody>
                  {/* แถวข้อมูล GoldTH */}
                  <tr>
                    <td className="border border-gray-300 px-4 py-2 font-semibold bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                      Gold TH
                    </td>
                    {(() => {
                      try {
                        // ใช้วันที่เดียวกับหัวตาราง
                        let dates = [];
                        
                        // เรียงข้อมูล GoldTH ตามวันที่
                        const sortedData = [...(goldThData || [])].filter(item => item && item.x)
                          .sort((a, b) => new Date(a.x) - new Date(b.x));
                        
                        // เรียงข้อมูล prediction ตามวันที่
                        const sortedPredictions = [...(predictData || [])].filter(item => item && item.x)
                          .sort((a, b) => new Date(a.x) - new Date(b.x));
                        
                        // เลือกข้อมูลจริงล่าสุด
                        if (sortedData.length > 0) {
                          const latestRealIndex = sortedData.length - 1;
                          // เลือกข้อมูลย้อนหลัง 3 วัน และวันล่าสุด
                          const startIndex = Math.max(0, latestRealIndex - 2);
                          for (let i = startIndex; i <= latestRealIndex; i++) {
                            if (sortedData[i] && sortedData[i].x) {
                              dates.push(new Date(sortedData[i].x));
                            }
                          }
                        }
                        
                        // เพิ่มวันที่จากข้อมูลทำนายทั้งหมด
                        sortedPredictions.forEach(item => {
                          if (item && item.x) {
                            const predDate = new Date(item.x);
                            // เช็คว่าวันที่นี้มีอยู่ในรายการหรือไม่
                            const dateExists = dates.some(date => 
                              date.toISOString().split('T')[0] === predDate.toISOString().split('T')[0]
                            );
                            if (!dateExists) {
                              dates.push(predDate);
                            }
                          }
                        });
                        
                        // เรียงวันที่ให้ถูกต้อง
                        dates.sort((a, b) => a - b);
                        
                        // หาข้อมูลจริงล่าสุดเพื่อใช้คำนวณแนวโน้ม
                        const _latestRealData = sortedData.length > 0 ? sortedData[sortedData.length - 1] : null;
                        
                        // สร้างเซลล์ข้อมูลสำหรับ GoldTH
                        return dates.map((date, index) => {
                          const dateStr = date.toISOString().split('T')[0];
                          const matchingData = sortedData.find(item => {
                            try {
                              return new Date(item.x).toISOString().split('T')[0] === dateStr;
                            } catch (_) {
                              return false;
                            }
                          });
                          
                          // คำนวณการเปลี่ยนแปลงเทียบกับข้อมูลก่อนหน้า
                          let change = null;
                          let changePercent = null;
                          
                          if (matchingData && index > 0) {
                            const prevDateStr = dates[index - 1].toISOString().split('T')[0];
                            const prevData = sortedData.find(item => {
                              try {
                                return new Date(item.x).toISOString().split('T')[0] === prevDateStr;
                              } catch (_) {
                                return false;
                              }
                            });
                            
                            if (prevData && prevData.y) {
                              change = matchingData.y - prevData.y;
                              changePercent = (change / prevData.y) * 100;
                            }
                          }
                          
                          const isToday = new Date().toISOString().split('T')[0] === dateStr;
                          
                          return (
                            <td 
                              key={index} 
                              className={`border border-gray-300 px-4 py-2 text-center
                                ${isToday ? 'bg-yellow-50 dark:bg-yellow-900' : ''}`}
                            >
                              {matchingData ? (
                                <div>
                                  <div className="font-semibold">
                                    {new Intl.NumberFormat('en-US').format(matchingData.y)}
                                  </div>
                                  {change !== null && (
                                    <div className={`text-xs ${change >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                      {change >= 0 ? '▲' : '▼'} {Math.abs(change).toFixed(2)}
                                      <span className="ml-1">({changePercent >= 0 ? '+' : ''}{changePercent.toFixed(2)}%)</span>
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </td>
                          );
                        });
                      } catch (err) {
                        console.error('Error creating GoldTH data cells:', err);
                        return <td className="border border-gray-300 px-4 py-2">Error loading data</td>;
                      }
                    })()}
                  </tr>
                  
                  {/* แถวข้อมูล Prediction */}
                  <tr>
                    <td className="border border-gray-300 px-4 py-2 font-semibold bg-blue-50 dark:bg-blue-900 text-blue-700 dark:text-blue-300">
                      Prediction
                    </td>
                    {(() => {
                      try {
                        // ใช้วันที่เดียวกับหัวตาราง
                        let dates = [];
                        
                        // เรียงข้อมูล GoldTH ตามวันที่
                        const sortedData = [...(goldThData || [])].filter(item => item && item.x)
                          .sort((a, b) => new Date(a.x) - new Date(b.x));
                        
                        // เรียงข้อมูล prediction ตามวันที่
                        const sortedPredictions = [...(predictData || [])].filter(item => item && item.x)
                          .sort((a, b) => new Date(a.x) - new Date(b.x));
                        
                        // เลือกข้อมูลจริงล่าสุด
                        if (sortedData.length > 0) {
                          const latestRealIndex = sortedData.length - 1;
                          // เลือกข้อมูลย้อนหลัง 3 วัน และวันล่าสุด
                          const startIndex = Math.max(0, latestRealIndex - 2);
                          for (let i = startIndex; i <= latestRealIndex; i++) {
                            if (sortedData[i] && sortedData[i].x) {
                              dates.push(new Date(sortedData[i].x));
                            }
                          }
                        }
                        
                        // เพิ่มวันที่จากข้อมูลทำนายทั้งหมด
                        sortedPredictions.forEach(item => {
                          if (item && item.x) {
                            const predDate = new Date(item.x);
                            // เช็คว่าวันที่นี้มีอยู่ในรายการหรือไม่
                            const dateExists = dates.some(date => 
                              date.toISOString().split('T')[0] === predDate.toISOString().split('T')[0]
                            );
                            if (!dateExists) {
                              dates.push(predDate);
                            }
                          }
                        });
                        
                        // เรียงวันที่ให้ถูกต้อง
                        dates.sort((a, b) => a - b);
                        
                        // หาข้อมูลจริงล่าสุดเพื่อใช้คำนวณแนวโน้ม
                        const _latestRealData = sortedData.length > 0 ? sortedData[sortedData.length - 1] : null;
                        
                        // สร้างเซลล์ข้อมูลสำหรับ Prediction
                        return dates.map((date, index) => {
                          const dateStr = date.toISOString().split('T')[0];
                          const matchingData = sortedPredictions.find(item => {
                            try {
                              return new Date(item.x).toISOString().split('T')[0] === dateStr;
                            } catch (_) {
                              return false;
                            }
                          });
                          
                          // คำนวณการเปลี่ยนแปลงเทียบกับข้อมูลจริงล่าสุด หรือ prediction ก่อนหน้า
                          let change = null;
                          let changePercent = null;
                          
                          if (matchingData) {
                            let comparisonData = null;
                            
                            // หาข้อมูลเปรียบเทียบ (ล่าสุดก่อนหน้านี้)
                            if (index > 0) {
                              const prevDateStr = dates[index - 1].toISOString().split('T')[0];
                              // ลองค้นหาใน prediction ก่อน
                              comparisonData = sortedPredictions.find(item => {
                                try {
                                  return new Date(item.x).toISOString().split('T')[0] === prevDateStr;
                                } catch (_) {
                                  return false;
                                }
                              });
                              
                              // ถ้าไม่มีใน prediction ให้ค้นหาใน sortedData
                              if (!comparisonData) {
                                comparisonData = sortedData.find(item => {
                                  try {
                                    return new Date(item.x).toISOString().split('T')[0] === prevDateStr;
                                  } catch (_) {
                                    return false;
                                  }
                                });
                              }
                            } else if (_latestRealData) {
                              // ใช้ข้อมูลจริงล่าสุดเป็นข้อมูลเปรียบเทียบ
                              comparisonData = _latestRealData;
                            }
                            
                            if (comparisonData && comparisonData.y) {
                              change = matchingData.y - comparisonData.y;
                              changePercent = (change / comparisonData.y) * 100;
                            }
                          }
                          
                          const isPrediction = sortedData.every(item => {
                            try {
                              return new Date(item.x).toISOString().split('T')[0] !== dateStr;
                            } catch (_) {
                              return true;
                            }
                          });
                          
                          return (
                            <td 
                              key={index} 
                              className={`border border-gray-300 px-4 py-2 text-center
                                ${isPrediction ? 'bg-blue-50 dark:bg-blue-900' : ''}`}
                            >
                              {matchingData ? (
                                <div>
                                  <div className="font-semibold text-blue-600 dark:text-blue-400">
                                    {new Intl.NumberFormat('en-US').format(matchingData.y)}
                                  </div>
                                  {change !== null && (
                                    <div className={`text-xs ${change >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                      {change >= 0 ? '▲' : '▼'} {Math.abs(change).toFixed(2)}
                                      <span className="ml-1">({changePercent >= 0 ? '+' : ''}{changePercent.toFixed(2)}%)</span>
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </td>
                          );
                        });
                      } catch (err) {
                        console.error('Error creating Prediction data cells:', err);
                        return <td className="border border-gray-300 px-4 py-2">Error loading data</td>;
                      }
                    })()}
                  </tr>
                </tbody>
              </table>
              
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
                ข้อมูลการทำนายเป็นเพียงการคาดการณ์ทางสถิติ ไม่ควรใช้เป็นคำแนะนำในการลงทุน
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default GoldChart;