import { fetchGoldTH } from "./fetchGoldTH";
import * as React from "react";
import ApexCharts from "react-apexcharts";

export default function GoldChartTH() {
    const [loading, setLoading] = React.useState<boolean>(false);
    const [data, setData] = React.useState<object[]>([]); // ข้อมูลทั้งหมด
    const [activeOptionButton, setActiveOptionButton] = React.useState<string>('1m'); // ตั้งค่าเริ่มต้นเป็น '1m'
    const [visibleData, setVisibleData] = React.useState<object[]>([]); // ข้อมูลที่จะแสดงในกราฟ

    const parseDate = (dateString: string) => {
        const [day, month, year] = dateString.split("-");
        const fullYear = year.length === 2 ? `20${year}` : year; 
        return new Date(`${fullYear}-${month}-${day}`).getTime();
    };

    const fetchData = async () => {
        setLoading(true);
        const fetchedData = await fetchGoldTH(); // ดึงข้อมูลทั้งหมด
        setData(fetchedData || []); // เก็บข้อมูลทั้งหมด
        setLoading(false);
    };

    const filterDataByTimeframe = (timeframe: string) => {
        const now = new Date().getTime();
        let filteredData;

        switch(timeframe) {
            case '7d':
                filteredData = data.filter(item => now - parseDate(item.date) <= 7 * 24 * 60 * 60 * 1000);
                break;
            case '15d':
                filteredData = data.filter(item => now - parseDate(item.date) <= 15 * 24 * 60 * 60 * 1000);
                break;
            case '1m':
                filteredData = data.filter(item => now - parseDate(item.date) <= 30 * 24 * 60 * 60 * 1000);
                break;
            case '6m':
                filteredData = data.filter(item => now - parseDate(item.date) <= 6 * 30 * 24 * 60 * 60 * 1000);
                break;
            case '1y':
                filteredData = data.filter(item => now - parseDate(item.date) <= 365 * 24 * 60 * 60 * 1000);
                break;
            default:
                filteredData = data;
                break;
        }

        setVisibleData(filteredData); // ตั้งค่าข้อมูลที่จะแสดงในกราฟ
    };

    React.useEffect(() => {
        fetchData();
    }, []);

    React.useEffect(() => {
        filterDataByTimeframe(activeOptionButton); // กรองข้อมูลตามปุ่มที่เลือก
    }, [activeOptionButton, data]); // เมื่อเปลี่ยนช่วงเวลา หรือข้อมูล

    const chartData = visibleData.map((item: any) => ({
        x: parseDate(item.date),
        y: parseFloat(item.price),
    }));

    const options = {
        chart: {
            type: 'line',
            height: 350,
            toolbar: {
                show: false,
            },
            dropShadow: {
                enabled: true,
                top: 1,
                left: 2,
                blur: 4,
                opacity: 0.6,
            },
            smooth: true,
        },
        tooltip: {
            enabled: true,
            theme: 'dark', // ใช้ 'light' หรือ 'dark' ตามต้องการ
            style: {
              fontSize: '12px', // ปรับขนาดตัวอักษร
              fontFamily: 'Arial, sans-serif',
            },
            marker: {
              show: true, // แสดงหรือไม่แสดงสัญลักษณ์ของจุด
            },
            onDatasetHover: {
              highlightDataSeries: false, // เน้นกราฟในขณะที่ชี้
            },
            // x: {
            //   show: true,
            // },
            // y: {
            //   formatter: (value) => `฿${value}`, // กำหนดรูปแบบการแสดงผลสำหรับแกน y
            // },
        },
        stroke: {
            curve: 'smooth',
            width: 2,
        },
        xaxis: {
            type: 'datetime',
            labels: {
                format: 'dd MMM yy',
                show: true,
                rotate: -45, // หมุนข้อความ
                hideOverlappingLabels: true, // ซ่อน label ที่ทับกัน
                maxHeight: 120, // กำหนดความสูงสูงสุดของ label
                style: {
                    colors: ['#000'],
                    fontSize: '12px', // ลดขนาดฟอนต์
                },
                // ปรับระยะห่างระหว่าง label
                datetimeFormatter: {
                    month: 'MMM yy',
                    day: 'dd MMM yy',
                },
            },
        },
        yaxis: {
            min: Math.min(...chartData.map((item: any) => item.y)) - 100,
            max: Math.max(...chartData.map((item: any) => item.y)) + 100,
            labels: {
                formatter: (value: number) => `${value}`,
            },
        },
        grid: {
            borderColor: '#f1f1f1',
            strokeDashArray: 5,
        },
    };
    

    const series = [
        {
            name: "Price",
            data: chartData,
        },
    ];

    const updateOptions = (option: string) => {
        setActiveOptionButton(option);
    };

    return (
        <div className="w-3/4 mx-auto h-[800px] p-6 bg-white rounded-lg shadow-lg"> {/* เพิ่มความสูงและลดความกว้างของ card */}
            <div className="flex justify-between items-center mb-4">
                {/* ข้อความ "Gold/THB" อยู่ทางซ้าย */}
                <span className="text-lg font-semibold text-gray-700">Gold/THB</span>
                
                {/* กลุ่มปุ่มอยู่ทางขวา */}
                <div className="flex space-x-4">
                    <button
                        onClick={() => updateOptions('7d')}
                        className={`px-2 py-3 rounded-lg text-sm font-medium transition-all duration-300 
                            ${activeOptionButton === '7d' ? 'bg-blue-600 text-white shadow-lg' : 'bg-gray-200 text-gray-800 hover:bg-blue-500 hover:text-white'}`}
                    >
                        7D
                    </button>
                    <button
                        onClick={() => updateOptions('15d')}
                        className={`px-2 py-3 rounded-lg text-sm font-medium transition-all duration-300 
                            ${activeOptionButton === '15d' ? 'bg-blue-600 text-white shadow-lg' : 'bg-gray-200 text-gray-800 hover:bg-blue-500 hover:text-white'}`}
                    >
                        15D
                    </button>
                    <button
                        onClick={() => updateOptions('1m')}
                        className={`px-2 py-3 rounded-lg text-sm font-medium transition-all duration-300 
                            ${activeOptionButton === '1m' ? 'bg-blue-600 text-white shadow-lg' : 'bg-gray-200 text-gray-800 hover:bg-blue-500 hover:text-white'}`}
                    >
                        1M
                    </button>
                    <button
                        onClick={() => updateOptions('6m')}
                        className={`px-2 py-3 rounded-lg text-sm font-medium transition-all duration-300 
                            ${activeOptionButton === '6m' ? 'bg-blue-600 text-white shadow-lg' : 'bg-gray-200 text-gray-800 hover:bg-blue-500 hover:text-white'}`}
                    >
                        6M
                    </button>
                    <button
                        onClick={() => updateOptions('1y')}
                        className={`px-2 py-3 rounded-lg text-sm font-medium transition-all duration-300 
                            ${activeOptionButton === '1y' ? 'bg-blue-600 text-white shadow-lg' : 'bg-gray-200 text-gray-800 hover:bg-blue-500 hover:text-white'}`}
                    >
                        1Y
                    </button>
                    <button
                        onClick={() => updateOptions('all')}
                        className={`px-2 py-3 rounded-lg text-sm font-medium transition-all duration-300 
                            ${activeOptionButton === 'all' ? 'bg-blue-600 text-white shadow-lg' : 'bg-gray-200 text-gray-800 hover:bg-blue-500 hover:text-white'}`}
                    >
                        All
                    </button>
                </div>
            </div>
    
            {loading && <p>Loading...⌛</p>}
            {!loading && (
                <div className="h-full"> {/* ทำให้กราฟสูงเต็มตามขนาดของ card */}
                    <ApexCharts
                        options={options}
                        series={series}
                        type="line"
                        height="90%" // ทำให้กราฟสูงเต็มตามพื้นที่ที่กำหนด
                    />
                </div>
            )}
        </div>
    );
    
    
}
