import React, { useRef, useEffect, useState } from 'react';
import { createChart, CrosshairMode, version } from 'lightweight-charts';
import { useTheme } from 'next-themes';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils';
import { format, parse, isValid } from 'date-fns';

// Constants for data categories
const DataCategories = {
  GOLD_TH: 'Gold TH',
  GOLD_US: 'Gold US',
  USDTHB: 'USD THB'
};

// Constants for chart types
const ChartTypes = {
  LINE: 'line',
  BAR: 'bar',
  CANDLE: 'candle'
};

/**
 * แปลงรูปแบบวันที่ให้เป็นรูปแบบที่ TradingView ยอมรับ
 * @param {string} dateString - สตริงวันที่ในรูปแบบต่างๆ
 * @returns {string} - วันที่ในรูปแบบ yyyy-MM-dd
 */
const formatDateForTradingView = (dateString) => {
  if (!dateString) return '';
  
  try {
    // แบ่งวันที่และเวลา (ถ้ามี)
    const parts = dateString.split(' ');
    const datePart = parts[0];
    
    // ตรวจสอบรูปแบบวันที่
    let date;
    
    // รูปแบบ dd-MM-yyyy
    if (/^\d{2}-\d{2}-\d{4}$/.test(datePart)) {
      date = parse(datePart, 'dd-MM-yyyy', new Date());
    } 
    // รูปแบบ yyyy-MM-dd
    else if (/^\d{4}-\d{2}-\d{2}$/.test(datePart)) {
      date = parse(datePart, 'yyyy-MM-dd', new Date());
    }
    // รูปแบบ dd-MM-yy
    else if (/^\d{2}-\d{2}-\d{2}$/.test(datePart)) {
      date = parse(datePart, 'dd-MM-yy', new Date());
    }
    else {
      // ถ้าไม่ตรงกับรูปแบบใดเลย ใช้ Date constructor
      date = new Date(dateString);
    }
    
    // ตรวจสอบว่าวันที่ถูกต้อง
    if (!isValid(date)) {
      console.warn(`Invalid date format: ${dateString}`);
      return dateString;
    }
    
    // แปลงเป็นรูปแบบที่ TradingView ต้องการ (yyyy-MM-dd)
    return format(date, 'yyyy-MM-dd');
  } catch (error) {
    console.error(`Error formatting date: ${dateString}`, error);
    return dateString;
  }
};

const LightweightTradingViewChart = ({
  chartData,
  chartType,
  selectedCategory,
  loading
}) => {
  const { theme } = useTheme();
  const chartContainerRef = useRef(null);
  const chartInstanceRef = useRef(null);
  const resizeObserver = useRef(null);
  const seriesRef = useRef(null);
  
  // ล็อกเวอร์ชันของ lightweight-charts เมื่อคอมโพเนนต์โหลด
  useEffect(() => {
    console.log(`Using lightweight-charts version: ${version}`);
  }, []);
  
  // สีตามธีม dark หรือ light
  const getChartColors = () => {
    return {
      backgroundColor: theme === 'dark' ? '#1c1c1c' : '#ffffff',
      textColor: theme === 'dark' ? '#d1d4dc' : '#131722',
      gridColor: theme === 'dark' ? '#2e2e2e' : '#e1e3e6',
      crosshairColor: theme === 'dark' ? '#758696' : '#758696',
      upColor: '#26a69a', // สีเขียวสำหรับราคาขึ้น
      downColor: '#ef5350', // สีแดงสำหรับราคาลง
      neutralColor: theme === 'dark' ? '#4d89ff' : '#2962ff', // สีสำหรับกราฟเส้น
      volumeColor: theme === 'dark' ? 'rgba(76, 175, 80, 0.5)' : 'rgba(76, 175, 80, 0.5)',
    };
  };

  // แปลงและเตรียมข้อมูลสำหรับ TradingView
  const prepareChartData = () => {
    if (!chartData || !chartData.Time || !chartData.datasets || chartData.datasets.length === 0) {
      return [];
    }

    const colors = getChartColors();
    
    // สร้างฟังก์ชันเพื่อกรองข้อมูลที่มีเวลาซ้ำกันออก
    const filterUniqueTimeData = (data) => {
      const timeMap = new Map();
      
      // เก็บเฉพาะข้อมูลล่าสุดในแต่ละช่วงเวลา กรณีที่มีเวลาซ้ำกัน
      data.forEach(item => {
        timeMap.set(item.time, item);
      });
      
      // แปลงกลับเป็น array และเรียงตามเวลาจากน้อยไปมาก
      return Array.from(timeMap.values())
        .sort((a, b) => {
          // แปลงเป็นตัวเลขเพื่อการเปรียบเทียบ
          const timeA = new Date(a.time).getTime();
          const timeB = new Date(b.time).getTime();
          return timeA - timeB;
        });
    };
    
    // ตรวจสอบประเภทของชาร์ตและเตรียมข้อมูลตามรูปแบบที่ต้องการ
    if (chartType === ChartTypes.LINE) {
      // หาชุดข้อมูลราคา
      const priceDataset = chartData.datasets.find(d => d.label === 'Price');
      if (!priceDataset) return [];
      
      const rawData = chartData.Time.map((time, index) => ({
        time: formatDateForTradingView(time),
        value: priceDataset.data[index]
      })).filter(item => item.value !== undefined && item.value !== null);
      
      // กรองข้อมูลที่มีเวลาซ้ำกันและเรียงลำดับ
      return filterUniqueTimeData(rawData);
    } 
    else if (chartType === ChartTypes.BAR) {
      // ใช้ข้อมูลราคา
      const priceDataset = chartData.datasets.find(d => d.label === 'Price');
      if (!priceDataset) return [];
      
      const rawData = chartData.Time.map((time, index) => {
        const currentValue = priceDataset.data[index];
        const prevValue = index > 0 ? priceDataset.data[index - 1] : currentValue;
        
        return {
          time: formatDateForTradingView(time),
          value: currentValue,
          color: currentValue >= prevValue ? colors.upColor : colors.downColor
        };
      }).filter(item => item.value !== undefined && item.value !== null);
      
      // กรองข้อมูลที่มีเวลาซ้ำกันและเรียงลำดับ
      return filterUniqueTimeData(rawData);
    } 
    else if (chartType === ChartTypes.CANDLE) {
      // สำหรับแท่งเทียนต้องมีข้อมูล OHLC
      const openDataset = chartData.datasets.find(d => 
        d.label === 'Open' || d.label === 'Open Price');
      const highDataset = chartData.datasets.find(d => 
        d.label === 'High' || d.label === 'High Price');
      const lowDataset = chartData.datasets.find(d => 
        d.label === 'Low' || d.label === 'Low Price');
      const closeDataset = chartData.datasets.find(d => 
        d.label === 'Close' || d.label === 'Close Price' || d.label === 'Price');
      
      // ถ้าไม่มีข้อมูลครบทั้ง OHLC ให้ใช้ฟอล์แบค
      if (!openDataset || !highDataset || !lowDataset || !closeDataset) {
        console.warn('OHLC data is incomplete, falling back to line chart');
        const priceDataset = chartData.datasets.find(d => d.label === 'Price');
        if (!priceDataset) return [];
        
        const rawData = chartData.Time.map((time, index) => ({
          time: formatDateForTradingView(time),
          value: priceDataset.data[index]
        })).filter(item => item.value !== undefined && item.value !== null);
        
        // กรองข้อมูลที่มีเวลาซ้ำกันและเรียงลำดับ
        return filterUniqueTimeData(rawData);
      }
      
      const rawData = chartData.Time.map((time, index) => ({
        time: formatDateForTradingView(time),
        open: openDataset.data[index],
        high: highDataset.data[index],
        low: lowDataset.data[index],
        close: closeDataset.data[index]
      })).filter(item => 
        item.open !== undefined && item.high !== undefined && 
        item.low !== undefined && item.close !== undefined);
      
      // กรองข้อมูลที่มีเวลาซ้ำกันและเรียงลำดับ
      return filterUniqueTimeData(rawData);
    }
    
    return [];
  };

  useEffect(() => {
    // สร้างกราฟใหม่เมื่อโหลดคอมโพเนนต์ หรือเมื่อธีมเปลี่ยน
    if (!chartContainerRef.current || loading) return;

    const colors = getChartColors();
    
    // สร้างกราฟ
    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: chartContainerRef.current.clientHeight,
      layout: {
        backgroundColor: colors.backgroundColor,
        textColor: colors.textColor,
      },
      grid: {
        vertLines: {
          color: colors.gridColor,
        },
        horzLines: {
          color: colors.gridColor,
        },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: {
          color: colors.crosshairColor,
          width: 1,
          style: 0,
          labelBackgroundColor: colors.crosshairColor,
        },
        horzLine: {
          color: colors.crosshairColor,
          width: 1,
          style: 0,
          labelBackgroundColor: colors.crosshairColor,
        },
      },
      timeScale: {
        borderColor: colors.gridColor,
        timeVisible: true,
        secondsVisible: false,
      },
      rightPriceScale: {
        borderColor: colors.gridColor,
      },
    });

    // เพิ่มการปรับขนาดอัตโนมัติ
    resizeObserver.current = new ResizeObserver(entries => {
      if (entries.length === 0 || !entries[0].contentRect) return;
      const { width, height } = entries[0].contentRect;
      chart.applyOptions({ width, height });
      chart.timeScale().fitContent();
    });
    
    resizeObserver.current.observe(chartContainerRef.current);
    
    // ตั้งค่า formatter สำหรับแสดงราคา
    chart.applyOptions({
      localization: {
        priceFormatter: price => formatCurrency(
          price, 
          selectedCategory === DataCategories.GOLD_US ? 'USD' : 'THB'
        ),
      },
    });
    
    chartInstanceRef.current = chart;
    
    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.remove();
        chartInstanceRef.current = null;
      }
      
      if (resizeObserver.current) {
        resizeObserver.current.disconnect();
      }
    };
  }, [theme, loading]); // สร้างกราฟใหม่เมื่อธีมเปลี่ยน

  useEffect(() => {
    // อัปเดตข้อมูลกราฟเมื่อข้อมูลหรือประเภทกราฟเปลี่ยน
    if (!chartInstanceRef.current || loading || !chartData) return;
    
    try {
      const chart = chartInstanceRef.current;
      const colors = getChartColors();
      const data = prepareChartData();
      
      // ลบ series เก่า ถ้ามี
      if (seriesRef.current) {
        try {
          chart.removeSeries(seriesRef.current);
        } catch (error) {
          console.error('Error removing series:', error);
        }
        seriesRef.current = null;
      }
      
      // เลือกประเภทของซีรีส์ตามประเภทของชาร์ต
      try {
        if (chartType === ChartTypes.CANDLE) {
          // สร้าง candlestick series
          const candlestickSeries = chart.addCandlestickSeries({
            upColor: colors.upColor,
            downColor: colors.downColor,
            borderUpColor: colors.upColor,
            borderDownColor: colors.downColor,
            wickUpColor: colors.upColor,
            wickDownColor: colors.downColor,
          });
          candlestickSeries.setData(data);
          seriesRef.current = candlestickSeries;
        } 
        else if (chartType === ChartTypes.BAR) {
          // สร้าง histogram series (bar chart)
          const histogramSeries = chart.addHistogramSeries({
            color: colors.neutralColor,
            priceFormat: {
              type: 'price',
              precision: 2,
            },
          });
          histogramSeries.setData(data);
          seriesRef.current = histogramSeries;
        } 
        else {
          // สร้าง line series (default)
          const lineSeries = chart.addLineSeries({
            color: colors.neutralColor,
            lineWidth: 2,
            lastValueVisible: true,
            priceLineVisible: true,
            crosshairMarkerVisible: true,
            priceLineColor: colors.neutralColor,
            priceLineWidth: 1,
          });
          lineSeries.setData(data);
          seriesRef.current = lineSeries;
        }
      } catch (error) {
        console.error(`Error creating ${chartType} series:`, error);
      }
      
      // ให้กราฟปรับขนาดให้พอดีกับข้อมูล
      chart.timeScale().fitContent();
    } catch (error) {
      console.error('Error updating chart:', error);
    }
    
  }, [chartData, chartType, selectedCategory, theme]);

  // ฟังก์ชันรีเซ็ตการซูม
  const handleResetZoom = () => {
    if (chartInstanceRef.current) {
      chartInstanceRef.current.timeScale().fitContent();
    }
  };

  return (
    <div className="relative h-full">
      {loading ? (
        <div className="flex justify-center items-center h-full">
          <Skeleton className="h-full w-full rounded-lg" />
        </div>
      ) : !chartData || !chartData.datasets || chartData.datasets.length === 0 ? (
        <div className="flex justify-center items-center h-full">
          <p className="text-muted-foreground">No data available for the selected criteria</p>
        </div>
      ) : (
        <>
          <div 
            ref={chartContainerRef} 
            className="h-full w-full"
          />
          <Button
            variant="outline"
            size="sm"
            className="absolute top-2 right-2 z-10"
            onClick={handleResetZoom}
          >
            Reset Zoom
          </Button>
        </>
      )}
    </div>
  );
};

export default LightweightTradingViewChart; 