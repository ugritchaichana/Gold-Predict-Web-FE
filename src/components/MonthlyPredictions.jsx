import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChartIcon, InfoIcon } from '@/components/icons';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import MonthlyPredictionChart from '@/components/MonthlyPredictionChart';
import { formatCurrency } from '@/lib/utils';
import { ThreeDot } from 'react-loading-indicators';

const MonthlyPredictions = ({ monthlyPredictions, monthlyChartTab, setMonthlyChartTab, loading = false }) => {
  const [tableData, setTableData] = useState([]);
  const [isLoading, setIsLoading] = useState(loading);
  useEffect(() => {
    if (monthlyPredictions && monthlyPredictions.length > 0) {
      const sortedData = [...monthlyPredictions].sort((a, b) => {
        return new Date(b.month_predict) - new Date(a.month_predict);
      });
      setTableData(sortedData);
    } else {
      setTableData([]);
    }
  }, [monthlyPredictions]);
  
  const [currentPage, setCurrentPage] = useState(1);
  const [paginatedData, setPaginatedData] = useState([]);
  const rowsPerPage = 6;
  const totalPages = Math.ceil(tableData.length / rowsPerPage);

  useEffect(() => {
    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    setPaginatedData(tableData.slice(startIndex, endIndex));
  }, [currentPage, tableData]);

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const goToPrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };
  useEffect(() => {
    setCurrentPage(1);
  }, [monthlyChartTab]);
  
  useEffect(() => {
    setIsLoading(loading);
  }, [loading]);
  
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[300px]">
        <ThreeDot color={["#32cd32", "#327fcd", "#cd32cd", "#cd8032"]} />
      </div>
    );
  }

  return (
    <Card className="overflow-hidden border-amber-200/20 dark:border-amber-800/20">
      <CardHeader className="border-b bg-gradient-to-r from-amber-50 to-amber-100/30 dark:from-amber-950/30 dark:to-amber-900/10">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <CardTitle>Monthly Predictions</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Tabs value={monthlyChartTab} onValueChange={setMonthlyChartTab}>
              <TabsList className="h-8">
                <TabsTrigger value="chart" className="text-xs px-2 h-7">
                  <BarChartIcon className="h-3 w-3 mr-1" />
                  Chart
                </TabsTrigger>
                <TabsTrigger value="table" className="text-xs px-2 h-7">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5 4a3 3 0 00-3 3v6a3 3 0 003 3h10a3 3 0 003-3V7a3 3 0 00-3-3H5zm-1 9v-1h5v2H5a1 1 0 01-1-1zm7 1h4a1 1 0 001-1v-1h-5v2zm0-4h5V8h-5v2zM9 8H4v2h5V8z" clipRule="evenodd" />
                  </svg>
                  Table
                </TabsTrigger>
              </TabsList>
            </Tabs>
            <Badge variant="outline" className="bg-amber-500/10 text-amber-600 dark:text-amber-400 dark:bg-amber-950/20">
              Forecast
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <Tabs value={monthlyChartTab} onValueChange={setMonthlyChartTab}>
          <TabsContent value="chart" className="mt-0">
            <div className="p-4">
              {monthlyPredictions.length > 0 ? (
                <MonthlyPredictionChart data={monthlyPredictions} />
              ) : (
                <div className="flex items-center justify-center h-48 bg-amber-50/30 dark:bg-amber-950/10">
                  <div className="text-center">
                    <InfoIcon className="mx-auto h-8 w-8 text-amber-400/60 dark:text-amber-500/40 mb-2" />
                    <p className="text-amber-700 dark:text-amber-300 font-medium">No chart data available</p>
                    <p className="text-xs text-amber-600/80 dark:text-amber-400/60 mt-1">Forecasts will appear here when data is ready</p>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
          <TabsContent value="table" className="mt-0">
            {monthlyPredictions.length > 0 ? (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-gradient-to-r from-amber-50 to-amber-100/30 dark:from-amber-950/30 dark:to-amber-900/10">                        <th className="px-6 py-3 text-center text-xs font-semibold text-amber-800 dark:text-amber-300 uppercase tracking-wider border-b border-amber-200/30 dark:border-amber-800/20">
                          Month
                        </th>
                        <th className="px-6 py-3 text-center text-xs font-semibold text-amber-800 dark:text-amber-300 uppercase tracking-wider border-b border-amber-200/30 dark:border-amber-800/20">
                          Predict Open
                        </th>
                        <th className="px-6 py-3 text-center text-xs font-semibold text-amber-800 dark:text-amber-300 uppercase tracking-wider border-b border-amber-200/30 dark:border-amber-800/20">
                          Actual Open
                        </th>
                        <th className="px-6 py-3 text-center text-xs font-semibold text-amber-800 dark:text-amber-300 uppercase tracking-wider border-b border-amber-200/30 dark:border-amber-800/20">
                          Predict High
                        </th>
                        <th className="px-6 py-3 text-center text-xs font-semibold text-amber-800 dark:text-amber-300 uppercase tracking-wider border-b border-amber-200/30 dark:border-amber-800/20">
                          Actual High
                        </th>
                        <th className="px-6 py-3 text-center text-xs font-semibold text-amber-800 dark:text-amber-300 uppercase tracking-wider border-b border-amber-200/30 dark:border-amber-800/20">
                          Predict Low
                        </th>
                        <th className="px-6 py-3 text-center text-xs font-semibold text-amber-800 dark:text-amber-300 uppercase tracking-wider border-b border-amber-200/30 dark:border-amber-800/20">
                          Actual Low
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-amber-100/50 dark:divide-amber-900/30">
                      {paginatedData.map((prediction, index) => (
                        <tr 
                          key={index} 
                          className="transition-colors hover:bg-amber-50/50 dark:hover:bg-amber-950/20"
                        >
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-amber-900 dark:text-amber-100 text-center">
                            {(() => {
                              try {
                                if (prediction.month_predict) {
                                  const [year, month] = prediction.month_predict.split('-');
                                  // แสดงเดือนในรูปแบบ MM-YYYY เช่น "04-2025"
                                  return month + '-' + year;
                                }
                                return prediction.month_predict;
                              } catch (error) {
                                return prediction.month_predict;
                              }
                            })()}
                          </td>

                          <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                            <span className="font-mono">{prediction.open ? `${prediction.open.toLocaleString(undefined, {maximumFractionDigits:2})} THB` : '-'}</span>
                          </td>

                          <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                            <span className="font-mono">{prediction.actual_open !== null ? `${prediction.actual_open.toLocaleString(undefined, {maximumFractionDigits:2})} THB` : '-'}</span>
                          </td>                          <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-emerald-600 dark:text-emerald-400 font-medium">
                            <span className="font-mono">{prediction.high ? `${prediction.high.toLocaleString(undefined, {maximumFractionDigits:2})} THB` : '-'}</span>
                          </td>

                          <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-emerald-600 dark:text-emerald-400 font-medium">
                            <span className="font-mono">{prediction.actual_high !== null ? `${prediction.actual_high.toLocaleString(undefined, {maximumFractionDigits:2})} THB` : '-'}</span>
                          </td>

                          <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-red-600 dark:text-red-400 font-medium">
                            <span className="font-mono">{prediction.low ? `${prediction.low.toLocaleString(undefined, {maximumFractionDigits:2})} THB` : '-'}</span>
                          </td>

                          <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-red-600 dark:text-red-400 font-medium">
                            <span className="font-mono">{prediction.actual_low !== null ? `${prediction.actual_low.toLocaleString(undefined, {maximumFractionDigits:2})} THB` : '-'}</span>
                          </td>

                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                {totalPages > 1 && (
                  <div className="flex items-center justify-between p-4 border-t border-amber-200/30 dark:border-amber-800/20 bg-gradient-to-r from-amber-50/50 to-amber-100/20 dark:from-amber-950/30 dark:to-amber-900/10">
                    <div className="text-sm text-amber-700 dark:text-amber-300">
                      Page {currentPage} of {totalPages}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={goToPrevPage}
                        disabled={currentPage === 1}
                        className="h-8 px-3 text-xs border-amber-200 dark:border-amber-800 hover:bg-amber-100 dark:hover:bg-amber-900"
                      >
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={goToNextPage}
                        disabled={currentPage === totalPages}
                        className="h-8 px-3 text-xs border-amber-200 dark:border-amber-800 hover:bg-amber-100 dark:hover:bg-amber-900"
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </>
            ) : 
            (
              <div className="flex items-center justify-center h-48 bg-amber-50/30 dark:bg-amber-950/10">
                <div className="text-center">
                  <InfoIcon className="mx-auto h-8 w-8 text-amber-400/60 dark:text-amber-500/40 mb-2" />
                  <p className="text-amber-700 dark:text-amber-300 font-medium">No prediction data available</p>
                  <p className="text-xs text-amber-600/80 dark:text-amber-400/60 mt-1">Forecasts will appear here when data is ready</p>
                </div>
              </div>
            )
            }
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default MonthlyPredictions;
