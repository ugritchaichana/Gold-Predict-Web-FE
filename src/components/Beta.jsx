import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { fetchGoldDataNew, fetchPredictionsNew } from '@/services/betaApiService';
import { GoldCoinIcon, BarChartIcon, InfoIcon } from '@/components/icons';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { cn, formatCurrency, formatDate, calculatePercentageChange, formatPercentage } from '@/lib/utils';
import { subDays, subMonths, subYears, format as formatDateFns, addDays, addYears } from 'date-fns';
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
  Filler,
} from 'chart.js';
import zoomPlugin from 'chartjs-plugin-zoom';
import 'chartjs-adapter-date-fns';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale,
  Filler,
  zoomPlugin
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
  'all': 'All'
};

const AggregationTypes = {
  'all': 'All',
  'day': 'Day',
  'week': 'Week',
  'month': 'Month',
  'quarter': 'Quarter',
  'year': 'Year'
};

const ChartTypes = {
  LINE: 'line',
  BAR: 'bar',
  CANDLE: 'candle'
};

// คอมโพเนนต์กราฟที่ปรับแต่งสำหรับหน้า Beta โดยเฉพาะ
const CustomGoldChart = ({ data, selectedCategory, timeframe, aggregationType }) => {
  const chartRef = useRef(null);
  
  // ฟังก์ชันรีเซ็ตซูม
  const resetZoom = () => {
    const chart = chartRef.current;
    if (chart) {
      chart.resetZoom();
    }
  };

  // ฟังก์ชันการรวมข้อมูลตาม aggregationType
  const aggregateData = (data, aggregationType) => {
    if (!data || data.length === 0 || aggregationType === 'all') {
      return data;
    }

    const aggregatedData = {};

    data.forEach(item => {
      // แปลงวันที่เป็น Date object ที่ถูกต้อง
      let dateStr = item.date.split(' ')[0]; // เอาเฉพาะวันที่ไม่เอาเวลา
      let date;
      
      // ตรวจสอบรูปแบบวันที่ (dd-mm-yyyy หรือ yyyy-mm-dd)
      if (dateStr.includes('-')) {
        const parts = dateStr.split('-');
        // ถ้าเป็นรูปแบบ dd-mm-yyyy
        if (parts[0].length <= 2) {
          date = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
        } else {
          // ถ้าเป็นรูปแบบ yyyy-mm-dd
          date = new Date(dateStr);
        }
      } else {
        // กรณีอื่นๆ ใช้วิธีแปลงปกติ
        date = new Date(dateStr);
      }
      
      let key = '';

      switch (aggregationType) {
        case 'day':
          // ใช้วันที่เป็น key โดยตัดเวลาออก
          key = dateStr;
          break;
        case 'week':
          // คำนวณสัปดาห์
          const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
          const dayOfYear = Math.floor((date - firstDayOfYear) / (24 * 60 * 60 * 1000));
          const weekNumber = Math.floor(dayOfYear / 7) + 1;
          key = `${date.getFullYear()}-W${weekNumber}`;
          break;
        case 'month':
          // ใช้เดือนและปีเป็น key
          key = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
          break;
        case 'quarter':
          // คำนวณไตรมาส
          const quarter = Math.floor(date.getMonth() / 3) + 1;
          key = `${date.getFullYear()}-Q${quarter}`;
          break;
        case 'year':
          // ใช้ปีเป็น key
          key = date.getFullYear().toString();
          break;
        default:
          key = item.date;
      }

      if (!aggregatedData[key]) {
        aggregatedData[key] = {
          count: 0,
          price: 0,
          bar_sell: item.bar_sell ? 0 : null,
          bar_buy: item.bar_buy ? 0 : null,
          ornament_sell: item.ornament_sell ? 0 : null,
          ornament_buy: item.ornament_buy ? 0 : null,
          date: key, // ใช้ key เป็นวันที่แสดงผล
          created_at: key,
          items: []
        };
      }

      aggregatedData[key].count++;
      aggregatedData[key].price += item.price;
      if (item.bar_sell !== null) aggregatedData[key].bar_sell += item.bar_sell;
      if (item.bar_buy !== null) aggregatedData[key].bar_buy += item.bar_buy;
      if (item.ornament_sell !== null) aggregatedData[key].ornament_sell += item.ornament_sell;
      if (item.ornament_buy !== null) aggregatedData[key].ornament_buy += item.ornament_buy;
      aggregatedData[key].items.push(item);
    });

    // คำนวณค่าเฉลี่ย
    return Object.values(aggregatedData).map(group => {
      return {
        ...group,
        price: group.price / group.count,
        bar_sell: group.bar_sell !== null ? group.bar_sell / group.count : null,
        bar_buy: group.bar_buy !== null ? group.bar_buy / group.count : null,
        ornament_sell: group.ornament_sell !== null ? group.ornament_sell / group.count : null,
        ornament_buy: group.ornament_buy !== null ? group.ornament_buy / group.count : null
      };
    }).sort((a, b) => {
      // เรียงลำดับตามวันที่ที่ใช้ในการแสดงผล
      return a.date.localeCompare(b.date);
    });
  };
  
  // เตรียมข้อมูลสำหรับกราฟ
  const prepareChartData = () => {
    if (!data || data.length === 0) {
      return { labels: [], datasets: [] };
    }

    // รวมข้อมูลตาม aggregationType
    const aggregatedData = aggregateData(data, aggregationType);

    // ดึงวันที่สำหรับใช้เป็น labels
    const labels = aggregatedData.map(item => item.date);
    
    // กำหนดสีตามประเภทข้อมูล
    const colors = {
      price: 'rgb(34, 197, 94)', // สีเขียว
      bar_sell: 'rgb(239, 68, 68)', // สีแดง
      ornament_sell: 'rgb(249, 115, 22)', // สีส้ม
      ornament_buy: 'rgb(59, 130, 246)', // สีน้ำเงิน
    };

    // สร้าง datasets สำหรับแต่ละประเภทข้อมูล
    const datasets = [
      {
        label: 'ราคาทอง',
        data: aggregatedData.map(item => item.price),
        borderColor: colors.price,
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        borderWidth: 2,
        tension: 0.1,
        pointRadius: 1,
        pointHoverRadius: 5,
        fill: false,
      }
    ];
    
    // เพิ่มชุดข้อมูลทองคำแท่ง-ขาย หากมีข้อมูล
    if (aggregatedData.some(item => item.bar_sell !== null)) {
      datasets.push({
        label: 'ทองคำแท่ง-ขาย',
        data: aggregatedData.map(item => item.bar_sell),
        borderColor: colors.bar_sell,
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        borderWidth: 2,
        tension: 0.1,
        pointRadius: 0,
        pointHoverRadius: 5,
        borderDash: [5, 5],
        fill: false,
      });
    }
    
    // เพิ่มชุดข้อมูลทองรูปพรรณ-ขาย หากมีข้อมูล
    if (aggregatedData.some(item => item.ornament_sell !== null)) {
      datasets.push({
        label: 'ทองรูปพรรณ-ขาย',
        data: aggregatedData.map(item => item.ornament_sell),
        borderColor: colors.ornament_sell,
        backgroundColor: 'rgba(249, 115, 22, 0.1)',
        borderWidth: 1.5,
        tension: 0.1,
        pointRadius: 0,
        pointHoverRadius: 5,
        borderDash: [3, 3],
        fill: false,
      });
    }
    
    // เพิ่มชุดข้อมูลทองรูปพรรณ-ซื้อ หากมีข้อมูล
    if (aggregatedData.some(item => item.ornament_buy !== null && item.ornament_buy > 0)) {
      datasets.push({
        label: 'ทองรูปพรรณ-ซื้อ',
        data: aggregatedData.map(item => item.ornament_buy),
        borderColor: colors.ornament_buy,
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderWidth: 1.5,
        tension: 0.1,
        pointRadius: 0,
        pointHoverRadius: 5,
        borderDash: [3, 3],
        fill: false,
      });
    }

    return { labels, datasets };
  };

  // กำหนด options สำหรับกราฟ
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 1000,
      easing: 'easeInOutQuad'
    },
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'top',
        labels: {
          boxWidth: 12,
          usePointStyle: true,
          pointStyle: 'circle'
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
              const currency = selectedCategory === DataCategories.GOLD_US ? 'USD' : 'THB';
              label += formatCurrency(context.parsed.y, currency);
            }
            return label;
          }
        }
      },
      zoom: {
        pan: {
          enabled: true,
          mode: 'x',
        },
        zoom: {
          wheel: {
            enabled: true,
          },
          pinch: {
            enabled: true
          },
          mode: 'x',
        }
      }
    },
    scales: {
      x: {
        type: 'category',
        grid: {
          display: false
        },
        ticks: {
          maxRotation: 45,
          minRotation: 45,
          autoSkip: true,
          maxTicksLimit: 20
        }
      },
      y: {
        beginAtZero: false,
        ticks: {
          callback: function(value) {
            const currency = selectedCategory === DataCategories.GOLD_US ? 'USD' : 'THB';
            return formatCurrency(value, currency);
          }
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.05)'
        }
      }
    }
  };

  // แสดงกราฟ
  return (
    <div className="relative h-full">
      <Line 
        ref={chartRef}
        data={prepareChartData()} 
        options={options} 
      />
      <div className="absolute bottom-0 right-0 p-2">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={resetZoom} 
          className="text-xs px-2 py-1 h-auto"
        >
          Reset Zoom
        </Button>
      </div>
    </div>
  );
};

const Beta = () => {
  const [selectedCategory, setSelectedCategory] = useState(DataCategories.GOLD_TH);
  const [timeframe, setTimeframe] = useState('1y');
  const [aggregationType, setAggregationType] = useState('all');
  const [goldThData, setGoldThData] = useState([]);
  const [goldUsData, setGoldUsData] = useState([]);
  const [usdthbData, setUsdthbData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ดึงข้อมูลทองและการทำนาย
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const today = new Date();
        let startDate = null;
        let endDate = formatDateFns(today, 'dd-MM-yy');

        switch (timeframe) {
          case '7d':
            startDate = formatDateFns(subDays(today, 7), 'dd-MM-yy');
            break;
          case '1m':
            startDate = formatDateFns(subMonths(today, 1), 'dd-MM-yy');
            break;
          case '1y':
            startDate = formatDateFns(subYears(today, 1), 'dd-MM-yy');
            break;
          default:
            startDate = null;
            endDate = null;
        }

        // เลือกประเภทข้อมูลตาม selectedCategory
        let dataType;
        if (selectedCategory === DataCategories.GOLD_TH) {
          dataType = 'GOLDTH';
        } else if (selectedCategory === DataCategories.GOLD_US) {
          dataType = 'GOLDUS';
        } else if (selectedCategory === DataCategories.USDTHB) {
          dataType = 'USDTHB';
        }

        const response = await fetchGoldDataNew(dataType, startDate, endDate);
        
        if (response && response.status === 'success') {
          // แปลงข้อมูลให้เข้ากับรูปแบบที่ GoldChart ต้องการ
          const formattedData = formatChartData(response.data, selectedCategory);
          
          if (selectedCategory === DataCategories.GOLD_TH) {
            setGoldThData(formattedData);
          } else if (selectedCategory === DataCategories.GOLD_US) {
            setGoldUsData(formattedData);
          } else if (selectedCategory === DataCategories.USDTHB) {
            setUsdthbData(formattedData);
          }
        } else {
          throw new Error('Failed to fetch data');
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Error loading data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [timeframe, selectedCategory]);

  // ฟังก์ชันแปลงข้อมูลจาก API ให้เข้ากับรูปแบบที่ GoldChart ต้องการ
  const formatChartData = (data, category) => {
    if (!data || !data.datasets || !data.labels) return [];
    
    try {
      // สร้างโครงสร้างข้อมูลเพื่อเก็บชุดข้อมูลทั้งหมด
      let formattedDataSets = [];
      
      // เลือกชุดข้อมูลหลักตามประเภทที่เลือก
      const priceDataset = data.datasets.find(ds => ds.label === 'Price');
      const barSellDataset = data.datasets.find(ds => ds.label === 'Bar Sell Price (ทองคำแท่ง-ขาย)');
      const barBuyDataset = data.datasets.find(ds => ds.label === 'Bar Buy Price (ทองคำแท่ง-ซื้อ)');
      const ornamentBuyDataset = data.datasets.find(ds => ds.label === 'Ornament Buy Price (ทองรูปพรรณ-ซื้อ)');
      const ornamentSellDataset = data.datasets.find(ds => ds.label === 'Ornament Sell Price (ทองรูปพรรณ-ขาย)');
      
      // จับคู่ข้อมูล labels กับชุดข้อมูลแต่ละประเภท
      if (priceDataset && priceDataset.data) {
        priceDataset.data.forEach((price, index) => {
          if (price > 0) {
            formattedDataSets.push({
              price: price,
              date: data.labels[index],
              created_at: data.labels[index],
              bar_sell: barSellDataset ? barSellDataset.data[index] : null,
              bar_buy: barBuyDataset ? barBuyDataset.data[index] : null,
              ornament_buy: ornamentBuyDataset ? ornamentBuyDataset.data[index] : null,
              ornament_sell: ornamentSellDataset ? ornamentSellDataset.data[index] : null
            });
          }
        });
      }

      // เรียงลำดับข้อมูลตามวันที่
      formattedDataSets.sort((a, b) => {
        // แปลงวันที่จากรูปแบบ dd-mm-yyyy เป็น Date object
        let dateA, dateB;
        
        // แปลง dateA
        const dateStrA = a.date.split(' ')[0]; // ตัดส่วนเวลาออก
        const partsA = dateStrA.split('-');
        // ตรวจสอบรูปแบบ dd-mm-yyyy
        if (partsA.length === 3 && partsA[0].length <= 2) {
          // แปลงจาก dd-mm-yyyy เป็น yyyy-mm-dd
          dateA = new Date(`${partsA[2]}-${partsA[1]}-${partsA[0]}`);
        } else {
          // ใช้วันที่แบบปกติ
          dateA = new Date(dateStrA);
        }
        
        // แปลง dateB
        const dateStrB = b.date.split(' ')[0]; // ตัดส่วนเวลาออก
        const partsB = dateStrB.split('-');
        // ตรวจสอบรูปแบบ dd-mm-yyyy
        if (partsB.length === 3 && partsB[0].length <= 2) {
          // แปลงจาก dd-mm-yyyy เป็น yyyy-mm-dd
          dateB = new Date(`${partsB[2]}-${partsB[1]}-${partsB[0]}`);
        } else {
          // ใช้วันที่แบบปกติ
          dateB = new Date(dateStrB);
        }
        
        return dateA - dateB;
      });
      
      return formattedDataSets;
    } catch (error) {
      console.error('Error formatting chart data:', error);
      return [];
    }
  };

  const getLatestPrice = () => {
    let data;
    if (selectedCategory === DataCategories.GOLD_TH) {
      data = goldThData;
    } else if (selectedCategory === DataCategories.GOLD_US) {
      data = goldUsData;
    } else {
      data = usdthbData;
    }
    
    if (loading || !data || data.length === 0) return null;
    return parseFloat(data[data.length - 1].price);
  };

  const getPreviousPrice = () => {
    let data;
    if (selectedCategory === DataCategories.GOLD_TH) {
      data = goldThData;
    } else if (selectedCategory === DataCategories.GOLD_US) {
      data = goldUsData;
    } else {
      data = usdthbData;
    }
    
    if (loading || !data || data.length < 2) return null;
    return parseFloat(data[data.length - 2].price);
  };

  const getLatestDate = () => {
    let data;
    if (selectedCategory === DataCategories.GOLD_TH) {
      data = goldThData;
    } else if (selectedCategory === DataCategories.GOLD_US) {
      data = goldUsData;
    } else {
      data = usdthbData;
    }
    
    if (loading || !data || data.length === 0) return null;
    return data[data.length - 1].date;
  };

  const priceChange = getLatestPrice() !== null && getPreviousPrice() !== null ? 
    getLatestPrice() - getPreviousPrice() : null;
  const percentChange = priceChange !== null ? 
    calculatePercentageChange(getLatestPrice(), getPreviousPrice()) : null;
  const latestDate = getLatestDate();

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4">
        <Card className="flex-1">
          <CardHeader className="pb-2">
            <CardDescription>Latest Price</CardDescription>
            <div className="flex items-center justify-between">
              <CardTitle className="text-2xl md:text-3xl">
                {loading ? (
                  <Skeleton className="h-8 w-36" />
                ) : getLatestPrice() !== null ? (
                  formatCurrency(getLatestPrice(), selectedCategory === DataCategories.GOLD_US ? 'USD' : 'THB')
                ) : (
                  'No data'
                )}
              </CardTitle>
              <Badge 
                variant={priceChange > 0 ? "success" : priceChange < 0 ? "destructive" : "outline"}
                className={cn(
                  "ml-2 px-2 py-1",
                  loading && "invisible"
                )}
              >
                {!loading && priceChange !== null ? (
                  <span className="flex items-center">
                    {priceChange > 0 ? '▲' : priceChange < 0 ? '▼' : '•'}
                    <span className="ml-1">{formatPercentage(percentChange)}</span>
                  </span>
                ) : null}
              </Badge>
            </div>
            {latestDate && (
              <CardDescription>
                Updated: {latestDate}
              </CardDescription>
            )}
          </CardHeader>
        </Card>

        <Card className="flex-1">
          <CardHeader className="pb-4">
            <div className="flex justify-between items-center">
              <CardTitle>Data Type</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue={selectedCategory} onValueChange={setSelectedCategory} className="w-full">
              <TabsList className="w-full">
                {Object.values(DataCategories).map(category => (
                  <TabsTrigger
                    key={category}
                    value={category}
                    className="flex-1"
                    disabled={loading}
                  >
                    {category === DataCategories.GOLD_TH ? 'Gold TH' : 
                     category === DataCategories.GOLD_US ? 'Gold US' : 'USD/THB'}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <CardTitle>Chart Settings</CardTitle>
            <div className="flex flex-wrap gap-2">
              {Object.entries(TimeFrames).map(([key, label]) => (
                <Button
                  key={key}
                  variant={timeframe === key ? "default" : "outline"}
                  size="sm"
                  onClick={() => setTimeframe(key)}
                  disabled={loading}
                >
                  {label}
                </Button>
              ))}
            </div>
          </div>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mt-4 gap-4">
            <CardDescription>Aggregation</CardDescription>
            <div className="flex flex-wrap gap-2">
              {Object.entries(AggregationTypes).map(([key, label]) => (
                <Button
                  key={key}
                  variant={aggregationType === key ? "default" : "outline"}
                  size="sm"
                  onClick={() => setAggregationType(key)}
                  disabled={loading}
                >
                  {label}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-[400px] w-full">
            {loading ? (
              <div className="w-full h-full flex items-center justify-center">
                <Skeleton className="h-full w-full" />
              </div>
            ) : error ? (
              <div className="w-full h-full flex items-center justify-center">
                <p className="text-destructive">{error}</p>
              </div>
            ) : (
              <CustomGoldChart
                data={selectedCategory === DataCategories.GOLD_TH ? goldThData : selectedCategory === DataCategories.GOLD_US ? goldUsData : usdthbData}
                selectedCategory={selectedCategory}
                timeframe={timeframe}
                aggregationType={aggregationType}
              />
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Beta; 