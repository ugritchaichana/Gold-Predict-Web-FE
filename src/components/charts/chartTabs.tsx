import { useEffect, useState } from 'react';
import { Card, CardHeader, CardContent, Button, Box, Tabs, Tab, CircularProgress } from '@mui/material';
import ApexCharts from 'react-apexcharts';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { fetchGoldData } from './fetchGoldCurrency';

dayjs.extend(relativeTime);

export default function ChartTabs() {
  const [selectedTab, setSelectedTab] = useState(0);
  const [timeframe, setTimeframe] = useState('1M');
  const [startDate, setStartDate] = useState('20-01-2025');
  const [endDate, setEndDate] = useState(dayjs().format('DD-MM-YYYY'));
  const [goldData, setGoldData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDatePicker, setShowDatePicker] = useState(false);
  console.log('startDate:', startDate);
  console.log('endDate:', endDate);
  console.log('selectedTab:',selectedTab);
  
  
  

  useEffect(() => {
    setLoading(true);
    fetchGoldData(startDate, endDate, selectedTab)
      .then((data) => {
        console.log('Fetched Gold Data:', data);
        setGoldData(data);
        setLoading(false);
      })
      .catch((error) => {
        console.error('Error:', error);
        setLoading(false);
      });
  }, [startDate, endDate, selectedTab]);

  const handleTabChange = (event, newValue) => {
    setSelectedTab(newValue);
  };

  const handleTimeframeChange = (value) => {
    setTimeframe(value);
    let newStartDate;
    switch (value) {
      case '7D':
        newStartDate = dayjs().subtract(7, 'day').format('DD-MM-YYYY');
        break;
      case '15D':
        newStartDate = dayjs().subtract(15, 'day').format('DD-MM-YYYY');
        break;
      case '1M':
        newStartDate = dayjs().subtract(1, 'month').format('DD-MM-YYYY');
        break;
      case '3M':
        newStartDate = dayjs().subtract(3, 'month').format('DD-MM-YYYY');
        break;
      case '6M':
        newStartDate = dayjs().subtract(6, 'month').format('DD-MM-YYYY');
        break;
      case '1Y':
        newStartDate = dayjs().subtract(1, 'year').format('DD-MM-YYYY');
        break;
      default:
        newStartDate = dayjs().format('DD-MM-YYYY');
        break;
    }
    setStartDate(newStartDate);
  };

  const handleDateRangeChange = (dates) => {
    const [start, end] = dates;
    setStartDate(start);
    setEndDate(end);
  };

  const toggleDatePicker = () => {
    setShowDatePicker(!showDatePicker);
  };

  const handleAllTime = () => {
    setStartDate('01-02-2005');  // ตั้งค่า startDate เป็น '01-02-05'
    setEndDate(dayjs().format('DD-MM-YYYY'));  // ตั้งค่า endDate เป็นวันที่ปัจจุบัน
    // เมื่อเลือก ALL จะดึงข้อมูลทั้งหมดและกรองให้แสดงทุก 3 วัน
};


  const chartOptions = {
    chart: {
      id: 'line-chart',
      toolbar: {
        show: false,
      },
    },
    xaxis: {
      categories: goldData.map((data) => data.date),
      labels: {
        rotate: -45, 
      },
      tickAmount: Math.min(8, goldData.length), // ปรับให้แสดงแค่ 8 จุดจากข้อมูลที่กรองแล้ว
    },
    yaxis: {
      title: {},
    },
    tooltip: {
      shared: true,
      intersect: false,
    },
  };

  const chartData = [
    {
      name: 'Gold Price',
      data: goldData.map((data) => data.price),
    },
  ];

  return (
    <div className="w-full h-full max-w-4xl mx-auto mt-8">
      <Card sx={{ minHeight: '500px' }}>
        <CardHeader
          title={
            <Box className="flex justify-between items-center w-full">
              <Tabs value={selectedTab} onChange={handleTabChange} aria-label="chart tabs">
                <Tab label="XAU/USD" />
                <Tab label="Gold/THB" />
                <Tab label="Currency" />
              </Tabs>
              <Box className="flex space-x-2">
                <Button variant={timeframe === '7D' ? 'contained' : 'outlined'} onClick={() => handleTimeframeChange('7D')}>7D</Button>
                <Button variant={timeframe === '15D' ? 'contained' : 'outlined'} onClick={() => handleTimeframeChange('15D')}>15D</Button>
                <Button variant={timeframe === '1M' ? 'contained' : 'outlined'} onClick={() => handleTimeframeChange('1M')}>1M</Button>
                <Button variant={timeframe === '3M' ? 'contained' : 'outlined'} onClick={() => handleTimeframeChange('3M')}>3M</Button>
                <Button variant={timeframe === '6M' ? 'contained' : 'outlined'} onClick={() => handleTimeframeChange('6M')}>6M</Button>
                <Button variant={timeframe === '1Y' ? 'contained' : 'outlined'} onClick={() => handleTimeframeChange('1Y')}>1Y</Button>
                <Button variant="outlined" onClick={handleAllTime}>ALL</Button>
              </Box>
            </Box>
          }
        />
        <CardContent sx={{ minHeight: '350px' }}>
          <Box className="mt-4">
            {loading ? (
              <Box className="flex justify-center items-center h-full">
                <CircularProgress />
              </Box>
            ) : (
              <ApexCharts options={chartOptions} series={chartData} type="line" height={350} />
            )}
          </Box>
        </CardContent>
      </Card>
    </div>
  );
}
