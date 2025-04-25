import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const GoldUsVolumeChart = ({ data, chartTab, setChartTab }) => {
  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Trading Volume Data</CardTitle>
          <CardDescription>No volume data available</CardDescription>
        </CardHeader>
      </Card>
    );
  }
  // Process data for volume chart
  const chartData = (() => {
    // Debug actual data format
    // console.log("Sample data item for debugging:", data[0]);
    
    // Sort data by date - using safer parsing like in the table view
    const sortedData = [...data].sort((a, b) => {
      // Get date strings or timestamps
      const aDate = getDateFromItem(a);
      const bDate = getDateFromItem(b);
      
      // Sort by timestamp (will be 0 for invalid dates)
      return aDate - bDate;
    });
    
    // Extract the last 30 data points or less if fewer are available
    const limitedData = sortedData.slice(Math.max(sortedData.length - 30, 0));
    
    const labels = limitedData.map(item => {
      const dateObj = new Date(getDateFromItem(item));
      if (isNaN(dateObj.getTime())) return "Unknown";
      return dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    });
    
    // Helper function to properly extract date from various formats
    function getDateFromItem(item) {
      try {
        const dateValue = item.date || item.created_at;
        
        if (!dateValue) return 0;
        
        // Handle timestamp in milliseconds
        if (typeof dateValue === 'number') {
          return dateValue;
        }
        // Handle DD-MM-YYYY format
        else if (typeof dateValue === 'string' && dateValue.match(/^\d{2}-\d{2}-\d{2,4}$/)) {
          const [day, month, year] = dateValue.split('-');
          // Make sure year has 4 digits
          const fullYear = year.length === 2 ? `20${year}` : year;
          return new Date(`${fullYear}-${month}-${day}`).getTime();
        }
        // Standard date parsing
        else if (typeof dateValue === 'string') {
          return new Date(dateValue).getTime();
        }
        
        return 0;
      } catch (error) {
        console.error("Date parsing error:", error);
        return 0;
      }
    }
    
    const volumeData = limitedData.map(item => item.volume || 0);
    const transactionsData = limitedData.map(item => item.number_of_transactions || 0);
      return {
      labels,
      datasets: [
        {
          label: 'Volume',
          data: volumeData,
          backgroundColor: 'rgba(139, 92, 246, 0.7)',  // Purple
          borderColor: 'rgb(139, 92, 246)',
          borderWidth: 1,
        }
      ]
    };
  })();

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: 'white',
        bodyColor: 'rgba(255, 255, 255, 0.8)',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        padding: 10,
        cornerRadius: 6,
      }
    },
    scales: {
      x: {
        grid: {
          display: false
        }
      },
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)'
        }
      }
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Trading Volume Data</CardTitle>
          <Tabs value={chartTab} onValueChange={setChartTab} className="w-[240px]">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="chart">Chart</TabsTrigger>
              <TabsTrigger value="table">Table</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        <CardDescription>
          Recent trading volume and transaction data for Gold US
        </CardDescription>
      </CardHeader>      <CardContent>
        <Tabs value={chartTab} onValueChange={setChartTab}>
          <TabsContent value="chart" className="h-[300px]">
            <Bar data={chartData} options={options} />
          </TabsContent>
          <TabsContent value="table">
            <div className="rounded-md border mt-4 overflow-hidden">
              <table className="w-full text-sm">                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="h-10 px-4 text-left font-medium">Date</th>
                    <th className="h-10 px-4 text-right font-medium">Volume</th>
                  </tr>
                </thead>
                <tbody>
                  {data.slice(-10).reverse().map((item, idx) => {
                    // Consistent date handling using the same function as for chart labels
                    let displayDate = "N/A";
                    try {
                      // Use same helper function as chart data for consistency
                      function getDateFromItem(item) {
                        try {
                          const dateValue = item.date || item.created_at;
                          
                          if (!dateValue) return 0;
                          
                          // Handle timestamp in milliseconds
                          if (typeof dateValue === 'number') {
                            return dateValue;
                          }
                          // Handle DD-MM-YYYY format
                          else if (typeof dateValue === 'string' && dateValue.match(/^\d{2}-\d{2}-\d{2,4}$/)) {
                            const [day, month, year] = dateValue.split('-');
                            // Make sure year has 4 digits
                            const fullYear = year.length === 2 ? `20${year}` : year;
                            return new Date(`${fullYear}-${month}-${day}`).getTime();
                          }
                          // Standard date parsing
                          else if (typeof dateValue === 'string') {
                            return new Date(dateValue).getTime();
                          }
                          
                          return 0;
                        } catch (error) {
                          console.error("Date parsing error:", error);
                          return 0;
                        }
                      }

                      const timestamp = getDateFromItem(item);
                      
                      if (timestamp > 0) {
                        const date = new Date(timestamp);
                        if (!isNaN(date.getTime())) {
                          displayDate = date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
                        }
                      }
                      
                      // Add direct debugging output for this item
                      // console.log(`Date debug: item=${JSON.stringify(item)}, parsed timestamp=${timestamp}, display=${displayDate}`);
                      
                    } catch (error) {
                      console.error("Error formatting date:", error);
                    }
                    
                    return (                      <tr key={idx} className="border-b transition-colors hover:bg-muted/50">
                        <td className="p-4 align-middle font-medium">
                          {displayDate}
                        </td>
                        <td className="p-4 align-middle text-right">
                          {item.volume ? item.volume.toLocaleString() : 'N/A'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default GoldUsVolumeChart;
