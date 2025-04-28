import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const ApiTesterPage = () => {
  const [apiUrl, setApiUrl] = useState('/predicts/week/get_week?display=chart');
  const [method, setMethod] = useState('GET');
  const [requestBody, setRequestBody] = useState('');
  const [responseData, setResponseData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedEndpoint, setSelectedEndpoint] = useState('/predicts/week/get_week?display=chart');

  const handleApiCall = async () => {
    try {
      setLoading(true);
      setError(null);

      let finalUrl = apiUrl;
      if (!apiUrl.startsWith('http')) {
        // Use relative URL with the configured API base
        const apiBase = import.meta.env.VITE_API_URL || 'https://api.goldpredict.com';
        finalUrl = `${apiBase}${apiUrl.startsWith('/') ? '' : '/'}${apiUrl}`;
      }

      const options = {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
      };

      if (method !== 'GET' && requestBody) {
        try {
          options.body = JSON.stringify(JSON.parse(requestBody));
        } catch (e) {
          setError('Invalid JSON in request body');
          setLoading(false);
          return;
        }
      }

      const response = await fetch(finalUrl, options);
      const data = await response.json();
      setResponseData(data);
    } catch (err) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
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

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="border-b bg-gradient-to-r from-amber-50 to-amber-100/30 dark:from-amber-950/30 dark:to-amber-900/10">
          <CardTitle>API Tester</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <Tabs defaultValue="tester" className="mb-6">
            <TabsList>
              <TabsTrigger value="tester">API Tester</TabsTrigger>
              <TabsTrigger value="endpoints">Example Endpoints</TabsTrigger>
            </TabsList>
            
            <TabsContent value="tester">
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="md:col-span-1">
                    <Label htmlFor="method">Method</Label>
                    <Select value={method} onValueChange={setMethod}>
                      <SelectTrigger id="method">
                        <SelectValue placeholder="Select method" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="GET">GET</SelectItem>
                        <SelectItem value="POST">POST</SelectItem>
                        <SelectItem value="PUT">PUT</SelectItem>
                        <SelectItem value="DELETE">DELETE</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="md:col-span-3">
                    <Label htmlFor="apiUrl">API URL</Label>
                    <Input
                      id="apiUrl"
                      value={apiUrl}
                      onChange={(e) => setApiUrl(e.target.value)}
                      placeholder="/api/endpoint or https://full.url"
                    />
                  </div>
                </div>
                
                {method !== 'GET' && (
                  <div className="space-y-2">
                    <Label htmlFor="requestBody">Request Body (JSON)</Label>
                    <textarea
                      id="requestBody"
                      value={requestBody}
                      onChange={(e) => setRequestBody(e.target.value)}
                      placeholder="{}"
                      className="min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    />
                  </div>
                )}
                
                <Button onClick={handleApiCall} disabled={loading}>
                  {loading ? 'Sending...' : 'Send Request'}
                </Button>
                
                {error && (
                  <div className="p-4 bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400 rounded-md">
                    <p className="font-semibold">Error</p>
                    <p>{error}</p>
                  </div>
                )}
                
                {responseData && (
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold">Response:</h3>
                    <div className="bg-black/80 dark:bg-black/40 p-4 rounded-md overflow-auto max-h-[400px]">
                      <pre className="text-green-400 dark:text-green-300 text-sm">
                        {JSON.stringify(responseData, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="endpoints">
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Here are some example API endpoints you can test. Click on any endpoint to use it in the tester.
                </p>
                
                <div className="space-y-2">
                  {exampleEndpoints.map((endpoint) => (
                    <div
                      key={endpoint.value}
                      className={`p-3 rounded-md cursor-pointer border transition-colors ${
                        selectedEndpoint === endpoint.value
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary hover:bg-primary/5'
                      }`}
                      onClick={() => handleEndpointSelection(endpoint.value)}
                    >
                      <div className="font-medium">{endpoint.label}</div>
                      <div className="text-xs text-muted-foreground mt-1">{endpoint.value}</div>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default ApiTesterPage;
