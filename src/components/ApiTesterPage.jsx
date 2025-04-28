import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format, subMonths } from 'date-fns';
import CalendarApiPage from '@/components/ui/calendar_api_page';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Switch } from '@/components/ui/switch';
import { getBaseUrl } from '@/config/apiConfig';
import { CopyIcon } from 'lucide-react';
import { ThreeDot } from 'react-loading-indicators';
import '@/styles/custom-scrollbar.css';

const ApiTesterPage = () => {
  const [apiUrl, setApiUrl] = useState('/predicts/week/get_week?display=chart');
  const [responseData, setResponseData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedEndpoint, setSelectedEndpoint] = useState('/predicts/week/get_week?display=chart');
  const [selectedModule, setSelectedModule] = useState('goldth');
  const [selectedTimeframe, setSelectedTimeframe] = useState('1m'); // Changed default timeframe to 1m
  
  // Default today for end date and one month ago for start date
  const [startDate, setStartDate] = useState(subMonths(new Date(), 1));
  const [endDate, setEndDate] = useState(new Date());
  const [enableMaxResults, setEnableMaxResults] = useState(true);
  const [maxResults, setMaxResults] = useState(100);
  const [isMonthly, setIsMonthly] = useState(false);
  const [showChart, setShowChart] = useState(true);
  const [useCache, setUseCache] = useState(true);
  
  // Refs to track the latest date values
  const startDateRef = useRef(startDate);
  const endDateRef = useRef(endDate);
  
  // Update refs when state changes
  useEffect(() => {
    startDateRef.current = startDate;
  }, [startDate]);
  
  useEffect(() => {
    endDateRef.current = endDate;
  }, [endDate]);
  
  // API call handler function
  const handleApiCall = async () => {
    try {
      setLoading(true);
      setError(null);

      let finalUrl = apiUrl;
      if (!apiUrl.startsWith('http')) {
        // Use relative URL with the configured API base from apiConfig
        const apiBase = getBaseUrl();
        finalUrl = `${apiBase}${apiUrl.startsWith('/') ? '' : '/'}${apiUrl}`;
      }

      // Display the full URL
      console.log(`Sending request to: ${finalUrl}`);

      const options = {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      };

      const response = await fetch(finalUrl, options);
      const data = await response.json();
      setResponseData(data);
    } catch (err) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };  
  
  // Function to update API URL based on all parameters
  const updateApiUrl = (module, timeframe, forceStartDate, forceEndDate) => {
    // Always use the parameters passed in or fall back to current refs (not state)
    const currentStartDate = forceStartDate !== undefined ? forceStartDate : startDateRef.current;
    const currentEndDate = forceEndDate !== undefined ? forceEndDate : endDateRef.current;
    
    let url = '';
    let queryChar = '?';
    
    if (module === 'goldth') {
      url = `/finnomenaGold/get-gold-data/?db_choice=0`;
      queryChar = '&';
    } else if (module === 'goldus') {
      url = `/finnomenaGold/get-gold-data/?db_choice=1`;
      queryChar = '&';
    } else if (module === 'usdthb') {
      url = `/usdthb/get_usdthb`;
    } else if (module === 'goldth-prediction') {
      url = `/predicts/week/get_week`;
    } else if (module === 'monthly-prediction') {
      url = `/predicts/month/get_months`;
    }

    if (timeframe) {
      url += `${queryChar}frame=${timeframe}`;
      queryChar = '&';
    } else if (currentStartDate && currentEndDate) {
      // Ensure we have valid date objects before formatting
      try {
        // Make sure we're working with proper Date objects
        const startObj = currentStartDate instanceof Date ? currentStartDate : new Date(currentStartDate);
        const endObj = currentEndDate instanceof Date ? currentEndDate : new Date(currentEndDate);
        
        // Format dates as dd-MM-yyyy for the API
        const formattedStartDate = format(startObj, 'dd-MM-yyyy');
        const formattedEndDate = format(endObj, 'dd-MM-yyyy');
        
        url += `${queryChar}start=${formattedStartDate}&end=${formattedEndDate}`;
        queryChar = '&';
        
        // Log the dates for debugging
        console.log('Date range for URL:', { 
          startDate: startObj, 
          endDate: endObj, 
          formattedStart: formattedStartDate, 
          formattedEnd: formattedEndDate 
        });
      } catch (error) {
        console.error("Date formatting error:", error);
        // Fall back to 7d if dates are invalid
        url += `${queryChar}frame=7d`;
        queryChar = '&';
      }
    }
    
    // Only add max parameter if it's enabled
    if (enableMaxResults) {
      // Convert maxResults to number and handle empty string/non-numeric values
      const maxValueStr = String(maxResults).trim();
      const maxValue = parseInt(maxValueStr);
      if (!isNaN(maxValue)) {
        url += `&max=${maxValue}`;
      }
    }
    
    url += `&group_by=${isMonthly ? 'monthly' : 'daily'}`;
    
    if (showChart) {
      url += '&display=chart';
    }
    
    url += `&cache=${useCache ? 'True' : 'False'}`;
    
    console.log("Setting API URL to:", url);
    setApiUrl(url);
  };

  const handleEndpointSelection = (value) => {
    setSelectedEndpoint(value);
    setApiUrl(value);
  };

  const exampleEndpoints = [
    { value: '/predicts/week/get_week?display=chart', label: 'Weekly Predictions' },
    { value: '/goldth/get_gold_th', label: 'Gold TH Data' },
    { value: '/goldus/get_gold_us', label: 'Gold US Data' },
    { value: '/usdthb/get_usdthb', label: 'USD/THB Data' },
    { value: '/predicts/month/get_months', label: 'Monthly Predictions' },
  ];
  
  // Add useEffect to update API URL and automatically send request when component mounts
  useEffect(() => {
    // Initialize API URL with the default module and timeframe
    updateApiUrl(selectedModule, selectedTimeframe);
    
    // Send API request automatically when the component loads
    const autoSendRequest = async () => {
      await handleApiCall();
    };
    
    // Small delay to ensure everything is set up properly
    setTimeout(() => {
      autoSendRequest();
    }, 100);
  }, []);

  // Add useEffect to ensure URL is updated whenever any relevant state changes (except dates)
  useEffect(() => {
    updateApiUrl(selectedModule, selectedTimeframe);
  }, [selectedModule, selectedTimeframe, maxResults, enableMaxResults, isMonthly, showChart, useCache]);
  
  // Separate useEffect specifically for date changes
  useEffect(() => {
    // This useEffect should specifically handle date changes
    if (startDate && endDate && !selectedTimeframe) {
      console.log("Date selection triggered URL update:", { startDate, endDate });
      updateApiUrl(selectedModule, null, startDate, endDate);
    }
  }, [startDate, endDate]);

  return (
    <div className="space-y-6">
      {/* Use flex container to ensure equal heights */}
      <div className="flex flex-col md:flex-row gap-6 max-w-[1600px] mx-auto" style={{ height: 'calc(100vh - 12rem)' }}>
        {/* Left Card - API Configuration */}
        <Card className="flex-1 flex flex-col overflow-hidden">
          <CardHeader className="border-b bg-gradient-to-r from-amber-50 to-amber-100/30 dark:from-amber-950/30 dark:to-amber-900/10 shrink-0">
            <CardTitle>API Configuration</CardTitle>
          </CardHeader>
          <CardContent className="pt-6 flex-1 overflow-hidden flex flex-col">
            {/* Make this a scrollable container that takes available space */}
            <div className="overflow-auto flex-1 pr-1 custom-scrollbar">
              <div className="space-y-4">
                {/* Method และ Module - แสดงในบรรทัดเดียวกัน */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Method */}
                  <div>
                    <Label htmlFor="method" className="block mb-1">Method</Label>
                    <div className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background flex items-center">
                      GET
                    </div>
                  </div>
                  
                  {/* Module */}
                  <div>
                    <Label htmlFor="module" className="block mb-1">Module</Label>
                    <Select value={selectedModule} onValueChange={(value) => {
                      setSelectedModule(value);
                      // The URL will be automatically updated by the useEffect dependency
                    }}>
                      <SelectTrigger id="module" className="h-10">
                        <SelectValue placeholder="Select module" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="goldth">Gold TH</SelectItem>
                        <SelectItem value="goldus">Gold US</SelectItem>
                        <SelectItem value="usdthb">USD/THB</SelectItem>
                        <SelectItem value="goldth-prediction">Gold TH Prediction</SelectItem>
                        <SelectItem value="monthly-prediction">Monthly Prediction</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div className="space-y-4 border-t pt-4 mt-4">
                <h3 className="text-sm font-medium">Data Filters</h3>
                <div className="grid grid-cols-1 gap-4">
                  {/* Timeframe Section */}
                  <div 
                    className={`border rounded-lg p-3 ${(!(startDate && endDate) || selectedTimeframe) ? 'bg-white dark:bg-gray-800 border-primary shadow-sm' : 'bg-gray-900/20 dark:bg-gray-900/40'} cursor-pointer hover:border-primary transition-all`}
                    onClick={() => {
                      // First update states
                      setSelectedTimeframe('1m');
                      setStartDate(null);
                      setEndDate(null);
                      // The URL will be automatically updated by the useEffect dependency
                    }}
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <Label className="text-sm font-medium">Timeframe</Label>
                      <div className={`h-3 w-3 rounded-full ${!(startDate && endDate) || selectedTimeframe ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                    </div>
                    <Select 
                      value={selectedTimeframe || "7d"} 
                      onValueChange={(value) => {
                        setSelectedTimeframe(value);
                        setStartDate(null);
                        setEndDate(null);
                        // The URL will be automatically updated by the useEffect dependency
                      }}
                    >
                      <SelectTrigger id="timeframe">
                        <SelectValue placeholder="Select timeframe" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="7d">7 Day</SelectItem>
                        <SelectItem value="15d">15 Day</SelectItem>
                        <SelectItem value="1m">1 Month</SelectItem>
                        <SelectItem value="3m">3 Month</SelectItem>
                        <SelectItem value="1y">1 Year</SelectItem>
                        <SelectItem value="3y">3 Year</SelectItem>
                        <SelectItem value="all">All Time</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div 
                    className={`border rounded-lg p-3 ${(startDate && endDate && !selectedTimeframe) ? 'bg-white dark:bg-gray-800 border-primary shadow-sm' : 'bg-gray-900/20 dark:bg-gray-900/40'} cursor-pointer hover:border-primary transition-all`}
                    onClick={() => {
                      // First update states
                      setSelectedTimeframe(null);
                      
                      // Always ensure dates are proper Date objects
                      const now = new Date();
                      const oneMonthAgo = subMonths(now, 1);
                      
                      const newStartDate = startDate || oneMonthAgo;
                      const newEndDate = endDate || now;
                      
                      setStartDate(newStartDate);
                      setEndDate(newEndDate);
                    }}
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <Label className="text-sm font-medium">Custom Date Range</Label>
                      <div className={`h-3 w-3 rounded-full ${(startDate && endDate && !selectedTimeframe) ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <CalendarApiPage 
                          label="Start"
                          value={startDate}
                          onChange={(date) => {
                            console.log("Start date selected:", date);
                            setStartDate(date);
                            startDateRef.current = date; // Update ref immediately
                            setSelectedTimeframe(null);
                            
                            // Force an immediate URL update if both dates are present
                            // Use the ref for endDate to get the latest value
                            if (date && endDateRef.current) {
                              updateApiUrl(selectedModule, null, date, endDateRef.current);
                            }
                          }}
                        />
                      </div>
                      
                      <div>
                        <CalendarApiPage 
                          label="End"
                          value={endDate}
                          onChange={(date) => {
                            console.log("End date selected:", date);
                            setEndDate(date);
                            endDateRef.current = date; // Update ref immediately
                            setSelectedTimeframe(null);
                            
                            // Force an immediate URL update if both dates are present
                            // Use the ref for startDate to get the latest value
                            if (startDateRef.current && date) {
                              updateApiUrl(selectedModule, null, startDateRef.current, date);
                            }
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 gap-4 mt-4">
                  <div className="border rounded-md p-3">
                    <div>
                      <Label htmlFor="maxResultsToggle" className="font-medium block mb-1">
                        Max Results
                      </Label>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-sm">{enableMaxResults ? `Enabled (${maxResults})` : "Disabled"}</span>
                        <Switch
                          id="maxResultsToggle"
                          checked={enableMaxResults}
                          onCheckedChange={(checked) => {
                            setEnableMaxResults(checked);
                            // Reset to default if re-enabled
                            if (checked && (!maxResults || maxResults === "")) {
                              setMaxResults(100);
                            }
                            // The URL will be automatically updated by the useEffect dependency
                          }}
                        />
                      </div>
                    </div>
                    
                    {enableMaxResults && (
                      <div className="mt-3">
                        <Input
                          id="maxResults"
                          type="text"
                          value={maxResults}
                          placeholder="100"
                          className="mt-1"
                          onChange={(e) => {
                            const value = e.target.value;
                            // Always update the state with the raw input value
                            setMaxResults(value);
                            // The URL will be automatically updated by the useEffect dependency
                          }}
                          onBlur={(e) => {
                            const value = e.target.value.trim();
                            if (value === '' || isNaN(value)) {
                              setMaxResults(100);
                              // The URL will be automatically updated by the useEffect dependency
                            }
                          }}
                        />
                      </div>
                    )}
                  </div>
                </div>

              <div className="border-t pt-4 mt-4">
                <h3 className="text-sm font-medium mb-3">Display Options</h3>
                
                <div className="grid grid-cols-3 gap-3">
                  <div className="border rounded-md p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Label htmlFor="groupBy" className="font-medium mr-1">Group :</Label>
                        <span className="text-sm">{isMonthly ? "Monthly" : "Daily"}</span>
                      </div>
                      <Switch
                        id="groupBy"
                        checked={isMonthly}
                        onCheckedChange={(checked) => {
                          setIsMonthly(checked);
                        }}
                      />
                    </div>
                  </div>
                  
                  {/* Chart Display option - แบบใหม่ */}
                  <div className="border rounded-md p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Label htmlFor="chartDisplay" className="font-medium mr-1">Chart Display :</Label>
                        <span className="text-sm">{showChart ? "ON" : "OFF"}</span>
                      </div>
                      <Switch
                        id="chartDisplay"
                        checked={showChart}
                        onCheckedChange={(checked) => {
                          setShowChart(checked);
                        }}
                      />
                    </div>
                  </div>

                  {/* Use Cache option - แบบใหม่ */}
                  <div className="border rounded-md p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Label htmlFor="useCache" className="font-medium mr-1">Use Cache :</Label>
                        <span className="text-sm">{useCache ? "ON" : "OFF"}</span>
                      </div>
                      <Switch
                        id="useCache"
                        checked={useCache}
                        onCheckedChange={(checked) => {
                          setUseCache(checked);
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Right Card - Request and Response */}
        <Card className="flex-1 flex flex-col overflow-hidden">
          <CardHeader className="border-b bg-gradient-to-r from-amber-50 to-amber-100/30 dark:from-amber-950/30 dark:to-amber-900/10 shrink-0">
            <CardTitle>Request and Response</CardTitle>
          </CardHeader>
          <CardContent className="pt-6 flex-1 overflow-hidden flex flex-col">
            {/* Make this a scrollable container that takes available space */}
            <div className="flex flex-col space-y-4 overflow-hidden flex-1">
              <div>
                <Label htmlFor="apiUrl" className="block mb-2">API URL</Label>
                <div className="flex items-center">
                  <div className="relative w-full">
                    <div className="p-2 border rounded-md bg-gray-50 dark:bg-gray-900 flex justify-between items-center">
                      <code className="text-sm font-mono break-all pr-2 w-full overflow-x-auto">
                        {!apiUrl.startsWith('http') ? `${getBaseUrl()}${apiUrl.startsWith('/') ? '' : '/'}${apiUrl}` : apiUrl}
                      </code>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const fullUrl = !apiUrl.startsWith('http') ? 
                            `${getBaseUrl()}${apiUrl.startsWith('/') ? '' : '/'}${apiUrl}` : 
                            apiUrl;
                          
                          navigator.clipboard.writeText(fullUrl);
                          
                          // Show notification
                          const notification = document.createElement('div');
                          notification.textContent = 'URL copied to clipboard!';
                          notification.style.position = 'fixed';
                          notification.style.bottom = '20px';
                          notification.style.right = '20px';
                          notification.style.backgroundColor = '#4CAF50';
                          notification.style.color = 'white';
                          notification.style.padding = '10px';
                          notification.style.borderRadius = '5px';
                          notification.style.zIndex = '1000';
                          document.body.appendChild(notification);
                          setTimeout(() => {
                            document.body.removeChild(notification);
                          }, 2000);
                        }}
                        className="shrink-0 ml-2"
                      >
                        Copy
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
              
              <Button onClick={handleApiCall} disabled={loading} className="w-full">
                {loading ? (
                  <div className="flex items-center justify-center">
                    <ThreeDot color="#ffffff" size="small" />
                    <span className="ml-2">Sending...</span>
                  </div>
                ) : 'Send Request'}
              </Button>
              
              {error && (
                <div className="p-4 bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400 rounded-md">
                  <p className="font-semibold">Error</p>
                  <p>{error}</p>
                </div>
              )}
              
              {/* Make response box take remaining space and scroll internally */}
              <div className="flex-1 overflow-hidden flex flex-col min-h-0">
                {responseData && (
                  <div className="flex flex-col h-full">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="text-lg font-semibold">Response:</h3>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          navigator.clipboard.writeText(JSON.stringify(responseData, null, 2));
                          
                          // Show notification
                          const notification = document.createElement('div');
                          notification.textContent = 'Response copied to clipboard!';
                          notification.style.position = 'fixed';
                          notification.style.bottom = '20px';
                          notification.style.right = '20px';
                          notification.style.backgroundColor = '#4CAF50';
                          notification.style.color = 'white';
                          notification.style.padding = '10px';
                          notification.style.borderRadius = '5px';
                          notification.style.zIndex = '1000';
                          document.body.appendChild(notification);
                          setTimeout(() => {
                            document.body.removeChild(notification);
                          }, 2000);
                        }}
                      >
                        Copy Response
                      </Button>
                    </div>
                    <div className="bg-black/80 dark:bg-black/40 p-4 rounded-lg border border-gray-700 dark:border-gray-600 flex-1 overflow-hidden">
                      <div className="h-full overflow-auto pr-2 custom-scrollbar">
                        <pre className="text-green-400 dark:text-green-300 text-sm whitespace-pre-wrap break-all">
                          {JSON.stringify(responseData, null, 2)}
                        </pre>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ApiTesterPage;