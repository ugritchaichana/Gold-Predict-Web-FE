import * as React from "react";
import dayjs, { Dayjs } from "dayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { Box, ToggleButton, ToggleButtonGroup } from "@mui/material";
import ApexCharts from "react-apexcharts";
import { fetchGoldTH } from "./fetchGoldTH";

export default function GoldChart() {
  const today = dayjs();
  const defaultStartDate = today.subtract(1, "month");
  const defaultEndDate = today;

  const [selectedRange, setSelectedRange] = React.useState<string>("1M");
  const [startDate, setStartDate] = React.useState<Dayjs | null>(defaultStartDate);
  const [endDate, setEndDate] = React.useState<Dayjs | null>(defaultEndDate);
  const [showCustomDateRange, setShowCustomDateRange] = React.useState<boolean>(false);
  const [loading, setLoading] = React.useState<boolean>(false);
  const [data, setData] = React.useState<any[]>([]);
  const [chartData, setChartData] = React.useState<any>({
    "7D": [],
    "15D": [],
    "1M": [],
    "3M": [],
    "6M": [],
    "1Y": [],
    "ALL": [],
  });

  // ฟังก์ชันดึงข้อมูลจาก API
  const fetchData = async () => {
    setLoading(true);
    const fetchedData = await fetchGoldTH(); // ฟังก์ชันดึงข้อมูลจาก API
    setData(fetchedData || []);
    setLoading(false);
  };

  React.useEffect(() => {
    fetchData();
  }, []);

  // ฟังก์ชันกรองข้อมูล
  const filterChartData = () => {
    const newChartData = { ...chartData };
    Object.keys(newChartData).forEach((range) => {
      const rangeData = data.filter((item) => {
        const itemDate = dayjs(item.date, "DD-MM-YY");
        let startDate: Dayjs | null = null;
        const endDate: Dayjs | null = today;

        switch (range) {
          case "7D":
            startDate = today.subtract(7, "day");
            break;
          case "15D":
            startDate = today.subtract(15, "day");
            break;
          case "1M":
            startDate = today.subtract(1, "month");
            break;
          case "3M":
            startDate = today.subtract(3, "month");
            break;
          case "6M":
            startDate = today.subtract(6, "month");
            break;
          case "1Y":
            startDate = today.subtract(1, "year");
            break;
          case "ALL":
            startDate = null;
            break;
          default:
            startDate = today.subtract(1, "month");
            break;
        }

        if (startDate) {
          return itemDate.isBetween(startDate, endDate, "day", "[]");
        }
        return true;
      });

      newChartData[range] = rangeData.map((item) => ({
        date: dayjs(item.date, "DD-MM-YY").format("DD-MM-YYYY"),
        price: item.price,
      }));
    });

    setChartData(newChartData);
  };

  React.useEffect(() => {
    filterChartData();
  }, [data]);

  const handleRangeChange = (event: React.MouseEvent<HTMLElement>, newValue: string | null) => {
    if (newValue !== null) {
      setSelectedRange(newValue);
      // แสดงเมนู Custom Date Range เมื่อเลือก Custom
      setShowCustomDateRange(newValue === "Custom");

      let newStartDate: Dayjs | null = null;
      const newEndDate = today;

      switch (newValue) {
        case "7D":
          newStartDate = today.subtract(7, "day");
          break;
        case "15D":
          newStartDate = today.subtract(15, "day");
          break;
        case "1M":
          newStartDate = today.subtract(1, "month");
          break;
        case "3M":
          newStartDate = today.subtract(3, "month");
          break;
        case "6M":
          newStartDate = today.subtract(6, "month");
          break;
        case "1Y":
          newStartDate = today.subtract(1, "year");
          break;
        case "ALL":
          newStartDate = null;
          break;
        case "Custom":
          if (!startDate) {
            newStartDate = today.subtract(1, "month");
          } else {
            newStartDate = startDate;
          }
          break;
        default:
          newStartDate = null;
      }

      setStartDate(newStartDate);
      setEndDate(newEndDate);
    }
  };

  const handleEndDateChange = (newEndDate: Dayjs | null) => {
    if (newEndDate && startDate && newEndDate.isBefore(startDate)) {
      alert("❌ End Date cannot be before Start Date");
      return;
    }
    setEndDate(newEndDate);
  };

  // ฟังก์ชันแสดงกราฟเส้น
  const ApexChart = ({ data }) => {
    const chartOptions = {
      chart: {
        animations: {
            enabled: true,
            speed: 800,
            animateGradually: {
                enabled: true,
                delay: 150
            },
            dynamicAnimation: {
                enabled: true,
                speed: 350
            }
        },
        dropShadow: {
            enabled: true,
            enabledOnSeries: undefined,
            top: 0,
            left: 4,
            blur: 5,
            color: '#000',
            opacity: 0.7
        },
        id: "gold-price-chart",
        type: "line",
      },
      xaxis: {
        categories: data.map((item) => item.date),
      },
      yaxis: {
        // title: {
        //   text: "Price",
        // },
      },
      stroke: {
        curve: "smooth",
      },
    };

    const chartSeries = [
      {
        name: "Price",
        data: data.map((item) => item.price),
      },
    ];

    return <ApexCharts options={chartOptions} series={chartSeries} type="line" height={350} />;
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box display="flex" flexDirection="column" alignItems="flex-start" gap={2}>
        <ToggleButtonGroup value={selectedRange} exclusive onChange={handleRangeChange} aria-label="Date range selection">
          <ToggleButton value="7D">7D</ToggleButton>
          <ToggleButton value="15D">15D</ToggleButton>
          <ToggleButton value="1M">1M</ToggleButton>
          <ToggleButton value="3M">3M</ToggleButton>
          <ToggleButton value="6M">6M</ToggleButton>
          <ToggleButton value="1Y">1Y</ToggleButton>
          <ToggleButton value="ALL">ALL</ToggleButton>
          <ToggleButton value="Custom">Custom</ToggleButton>
        </ToggleButtonGroup>

        {showCustomDateRange && (
          <Box display="flex" gap={2}>
            <DatePicker
              label="Start Date"
              value={startDate || today.subtract(1, "month")}
              onChange={(newValue) => setStartDate(newValue)}
            />
            <DatePicker
              label="End Date"
              value={endDate || today}
              onChange={handleEndDateChange}
            />
          </Box>
        )}
      </Box>

      {loading && <p>Loading...</p>}
      {!loading && data.length > 0 && (
        <Box>
          <ApexChart data={chartData[selectedRange]} />
        </Box>
      )}
    </LocalizationProvider>
  );
}
