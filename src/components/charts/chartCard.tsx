import { useEffect, useState } from 'react';
import { Card, CardHeader, CardContent, Button, Box, Tabs, Tab, CircularProgress } from '@mui/material';
import ApexCharts from 'react-apexcharts';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { fetchGoldData } from './fetchGoldCurrency';

dayjs.extend(relativeTime);

export default function ChartCard() {
  const [selectedTab, setSelectedTab] = useState(0);
  const [goldData, setGoldData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState(new Date());

  useEffect(() => {
    const loadData = async () => {
      setLoading(true); // เริ่มโหลดข้อมูล
      try {
        const data = await fetchGoldData();
        setGoldData(data);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false); // หยุดโหลดเมื่อเสร็จสิ้น
      }
    };

    loadData();
  }, []);

  const handleTabChange = (event, newValue) => {
    setSelectedTab(newValue);
  };

  return (
    <Card>
      <CardHeader title="Gold Price Chart" />
      <CardContent>
        <Tabs value={selectedTab} onChange={handleTabChange}>
          <Tab label="Today" />
          <Tab label="This Week" />
          <Tab label="This Month" />
          asdasdasd
          asdasdasdas
        </Tabs>

        <Box mt={2}>
          <DatePicker selected={startDate} onChange={date => setStartDate(date)} />
        </Box>

        {loading ? (
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
            <CircularProgress />
          </Box>
        ) : (
          goldData && (
            <ApexCharts
              options={{
                chart: { id: 'gold-chart' },
                xaxis: { categories: goldData.dates },
              }}
              series={[{ name: 'Gold Price', data: goldData.prices }]}
              type="line"
              height={350}
            />
          )
        )}

        <Button variant="contained" onClick={() => window.location.reload()}>
          Refresh Data
        </Button>
      </CardContent>
    </Card>
  );
}
