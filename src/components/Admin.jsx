import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertCircle, AlertTriangle, Database, RefreshCw, Clock, BarChart4, Calendar, Globe, Server } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/components/ui/use-toast";
import {
  setDatabase,
  updateDailyData,
  getDataForDashboard,
  createDataSetInChunks,
  saveDailyDataSettings,
  getDailyDataSettings
} from '../services/adminApiService';
import { API_ENVIRONMENTS, getCurrentEnvironment, setEnvironment } from '../config/apiConfig';

const Admin = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("database");
  
  // สถานะสำหรับ API Environment
  const [apiEnvironment, setApiEnvironment] = useState(getCurrentEnvironment());
  
  // สถานะสำหรับส่วน Set Database
  const [dbLoading, setDbLoading] = useState(false);
  const [selectedDbType, setSelectedDbType] = useState("ALL");
  const [dbResult, setDbResult] = useState(null);
  
  // สถานะสำหรับส่วน Daily Data
  const [dailyDataLoading, setDailyDataLoading] = useState(false);
  const [dailyDataResult, setDailyDataResult] = useState(null);
  const [frequencyHours, setFrequencyHours] = useState(getDailyDataSettings());
  const [lastUpdateTime, setLastUpdateTime] = useState(localStorage.getItem('lastDailyDataUpdate') || null);
  
  // สถานะสำหรับส่วน Create Data
  const [createDataLoading, setCreateDataLoading] = useState(false);
  const [createDataProgress, setCreateDataProgress] = useState(0);
  const [selectedDataType, setSelectedDataType] = useState("GOLDTH");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [chunkDays, setChunkDays] = useState(30);
  const [createDataResult, setCreateDataResult] = useState(null);
  
  // สถานะสำหรับส่วน Dashboard
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [dashboardDataType, setDashboardDataType] = useState("GOLDTH");
  const [dashboardTimeframe, setDashboardTimeframe] = useState("day");
  
  // ตั้งค่าการทำงานประจำของ Daily Data
  useEffect(() => {
    // ตรวจสอบเวลาล่าสุดที่อัปเดต Daily Data
    const checkLastUpdate = () => {
      const lastUpdate = localStorage.getItem('lastDailyDataUpdate');
      if (lastUpdate) {
        setLastUpdateTime(lastUpdate);
        
        // ตรวจสอบว่าถึงเวลาอัปเดตหรือยัง
        const lastUpdateTime = new Date(lastUpdate).getTime();
        const currentTime = new Date().getTime();
        const hoursSinceLastUpdate = (currentTime - lastUpdateTime) / (1000 * 60 * 60);
        
        if (hoursSinceLastUpdate >= frequencyHours) {
          updateDailyDataHandler();
        }
      } else {
        // ถ้าไม่เคยอัปเดตมาก่อน ให้อัปเดตทันที
        updateDailyDataHandler();
      }
    };
    
    checkLastUpdate();
    
    // ตั้งเวลาตรวจสอบทุก 15 นาที
    const intervalId = setInterval(checkLastUpdate, 15 * 60 * 1000);
    
    return () => clearInterval(intervalId);
  }, [frequencyHours]);
  
  // โหลดข้อมูลสำหรับ Dashboard เมื่อเริ่มต้น
  useEffect(() => {
    if (activeTab === "dashboard") {
      loadDashboardData();
    }
  }, [activeTab, dashboardDataType, dashboardTimeframe]);
  
  // ฟังก์ชันโหลดข้อมูลสำหรับ Dashboard
  const loadDashboardData = async () => {
    setDashboardLoading(true);
    try {
      // ใช้ข้อมูล 30 วันล่าสุด
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);
      
      // แปลงวันที่เป็นรูปแบบ dd-mm-yy
      const formatDate = (date) => {
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = String(date.getFullYear()).slice(-2);
        return `${day}-${month}-${year}`;
      };
      
      const response = await getDataForDashboard(
        dashboardDataType,
        formatDate(startDate),
        formatDate(endDate),
        'chart',
        dashboardTimeframe
      );
      
      setDashboardData(response);
    } catch (error) {
      toast({
        title: "ข้อผิดพลาด",
        description: "ไม่สามารถโหลดข้อมูลสำหรับแดชบอร์ดได้",
        variant: "destructive",
      });
      console.error(error);
    } finally {
      setDashboardLoading(false);
    }
  };
  
  // ฟังก์ชันเรียกใช้ set_database
  const setDatabaseHandler = async () => {
    setDbLoading(true);
    setDbResult(null);
    
    try {
      const result = await setDatabase(selectedDbType);
      setDbResult(result);
      
      toast({
        title: "สำเร็จ",
        description: `ตรวจสอบและเติมข้อมูล ${selectedDbType} เรียบร้อยแล้ว`,
      });
    } catch (error) {
      toast({
        title: "ข้อผิดพลาด",
        description: "ไม่สามารถตรวจสอบและเติมข้อมูลได้",
        variant: "destructive",
      });
      console.error(error);
    } finally {
      setDbLoading(false);
    }
  };
  
  // ฟังก์ชันเรียกใช้ daily_data
  const updateDailyDataHandler = async () => {
    setDailyDataLoading(true);
    setDailyDataResult(null);
    
    try {
      const result = await updateDailyData();
      setDailyDataResult(result);
      
      // บันทึกเวลาที่อัปเดตล่าสุด
      const now = new Date().toISOString();
      localStorage.setItem('lastDailyDataUpdate', now);
      setLastUpdateTime(now);
      
      toast({
        title: "สำเร็จ",
        description: "อัปเดตข้อมูลประจำวันเรียบร้อยแล้ว",
      });
    } catch (error) {
      toast({
        title: "ข้อผิดพลาด",
        description: "ไม่สามารถอัปเดตข้อมูลประจำวันได้",
        variant: "destructive",
      });
      console.error(error);
    } finally {
      setDailyDataLoading(false);
    }
  };
  
  // ฟังก์ชันบันทึกความถี่ในการอัปเดต Daily Data
  const saveFrequencyHandler = () => {
    if (saveDailyDataSettings(frequencyHours)) {
      toast({
        title: "สำเร็จ",
        description: `บันทึกความถี่ในการอัปเดตเป็นทุก ${frequencyHours} ชั่วโมงแล้ว`,
      });
    } else {
      toast({
        title: "ข้อผิดพลาด",
        description: "ไม่สามารถบันทึกการตั้งค่าได้",
        variant: "destructive",
      });
    }
  };
  
  // ฟังก์ชันสร้างชุดข้อมูลแบบแบ่งช่วง
  const createDataHandler = async () => {
    setCreateDataLoading(true);
    setCreateDataProgress(0);
    setCreateDataResult(null);
    
    try {
      const simulateProgress = setInterval(() => {
        setCreateDataProgress(prev => {
          const newProgress = prev + 5;
          return newProgress < 90 ? newProgress : prev;
        });
      }, 1000);
      
      const result = await createDataSetInChunks(selectedDataType, startDate, endDate, chunkDays);
      setCreateDataResult(result);
      
      clearInterval(simulateProgress);
      setCreateDataProgress(100);
      
      toast({
        title: "สำเร็จ",
        description: `สร้างชุดข้อมูล ${selectedDataType} เรียบร้อยแล้ว จำนวน ${result.chunks} ช่วง`,
      });
    } catch (error) {
      toast({
        title: "ข้อผิดพลาด",
        description: "ไม่สามารถสร้างชุดข้อมูลได้",
        variant: "destructive",
      });
      console.error(error);
    } finally {
      setCreateDataLoading(false);
    }
  };
  
  // ฟังก์ชันแสดงเวลาล่าสุดที่อัปเดตในรูปแบบที่อ่านง่าย
  const formatLastUpdateTime = () => {
    if (!lastUpdateTime) return "ไม่เคย";
    
    const lastUpdate = new Date(lastUpdateTime);
    const now = new Date();
    const diffMs = now - lastUpdate;
    
    // แปลงเป็นนาที/ชั่วโมง/วัน
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffMinutes < 60) {
      return `${diffMinutes} นาทีที่แล้ว`;
    } else if (diffHours < 24) {
      return `${diffHours} ชั่วโมงที่แล้ว`;
    } else {
      return `${diffDays} วันที่แล้ว`;
    }
  };
  
  // ฟังก์ชันเปลี่ยน API Environment
  const handleApiEnvironmentChange = (value) => {
    if (setEnvironment(value)) {
      setApiEnvironment(value);
      toast({
        title: "เปลี่ยน API Environment สำเร็จ",
        description: `ตั้งค่า backend URL เป็น ${API_ENVIRONMENTS[value]}`,
      });
      
      // รีเฟรชหน้าเพื่อให้การเปลี่ยนแปลงมีผล
      window.location.reload();
    } else {
      toast({
        title: "ข้อผิดพลาด",
        description: "ไม่สามารถเปลี่ยน API Environment ได้",
        variant: "destructive",
      });
    }
  };
  
  // ฟังก์ชันแสดงกราฟข้อมูลอย่างง่าย
  const renderSimpleChart = () => {
    if (!dashboardData || !dashboardData.data || !dashboardData.data.datasets || !dashboardData.data.datasets[0]) {
      return (
        <div className="flex items-center justify-center h-48">
          <p className="text-muted-foreground">ไม่มีข้อมูล</p>
        </div>
      );
    }
    
    const dataset = dashboardData.data.datasets[0];
    const values = dataset.data || [];
    const max = Math.max(...values.filter(v => typeof v === 'number' && !isNaN(v)));
    const min = Math.min(...values.filter(v => typeof v === 'number' && !isNaN(v)));
    
    return (
      <div className="rounded-md border p-4 h-48">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-sm font-medium">{dataset.label || dashboardDataType}</h3>
          <span className="text-sm text-muted-foreground">Min: {min.toFixed(2)} / Max: {max.toFixed(2)}</span>
        </div>
        <div className="flex items-end h-32 gap-1">
          {values.map((value, index) => {
            const height = ((value - min) / (max - min)) * 100;
            return (
              <div 
                key={index} 
                className="bg-primary/80 rounded-t w-full" 
                style={{ 
                  height: `${Math.max(5, height)}%`,
                  minWidth: '3px'
                }}
                title={`${dashboardData.data.labels ? dashboardData.data.labels[index] : index}: ${value}`}
              />
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="container max-w-6xl mx-auto py-8">
      <div className="flex flex-col space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-yellow-500 to-amber-600 text-transparent bg-clip-text">
            Admin Dashboard
          </h1>
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-3 mb-8">
            <TabsTrigger value="database">
              <Database className="mr-2 h-4 w-4" />
              จัดการฐานข้อมูล
            </TabsTrigger>
            <TabsTrigger value="dailyData">
              <RefreshCw className="mr-2 h-4 w-4" />
              อัปเดตข้อมูลอัตโนมัติ
            </TabsTrigger>
            <TabsTrigger value="dashboard">
              <BarChart4 className="mr-2 h-4 w-4" />
              แดชบอร์ด
            </TabsTrigger>
          </TabsList>
          
          {/* ส่วนจัดการฐานข้อมูล */}
          <TabsContent value="database" className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>ตรวจสอบและเติมข้อมูลที่ขาดหาย</CardTitle>
                <CardDescription>
                  ระบบจะตรวจสอบข้อมูลในฐานข้อมูลและเติมข้อมูลในช่วงวันที่ขาดหายโดยอัตโนมัติ
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="dbType">ประเภทข้อมูล</Label>
                    <Select value={selectedDbType} onValueChange={setSelectedDbType}>
                      <SelectTrigger id="dbType">
                        <SelectValue placeholder="เลือกประเภทข้อมูล" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ALL">ทั้งหมด</SelectItem>
                        <SelectItem value="USDTHB">USD/THB</SelectItem>
                        <SelectItem value="GOLDTH">ทองคำไทย</SelectItem>
                        <SelectItem value="GOLDUS">ทองคำสากล</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <Button 
                  onClick={setDatabaseHandler} 
                  disabled={dbLoading}
                  className="w-full"
                >
                  {dbLoading ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      กำลังตรวจสอบและเติมข้อมูล...
                    </>
                  ) : (
                    <>
                      <Database className="mr-2 h-4 w-4" />
                      ตรวจสอบและเติมข้อมูล
                    </>
                  )}
                </Button>
              </CardContent>
              <CardFooter className="flex flex-col items-start">
                {dbResult && (
                  <Alert className="w-full">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>ดำเนินการเสร็จสิ้น</AlertTitle>
                    <AlertDescription>
                      <div className="mt-2 space-y-2">
                        {dbResult.data_created && dbResult.data_created.length > 0 ? (
                          <>
                            <p>สร้างข้อมูลเพิ่มเติมในช่วงต่อไปนี้:</p>
                            <ul className="space-y-1 list-disc list-inside">
                              {dbResult.data_created.map((item, index) => (
                                <li key={index}>{item.type}: {item.range}</li>
                              ))}
                            </ul>
                          </>
                        ) : (
                          <p>ไม่พบช่วงข้อมูลที่ขาดหาย</p>
                        )}
                      </div>
                    </AlertDescription>
                  </Alert>
                )}
              </CardFooter>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>สร้างชุดข้อมูลใหม่</CardTitle>
                <CardDescription>
                  สร้างชุดข้อมูลใหม่ตามช่วงเวลาที่กำหนด โดยแบ่งการดึงข้อมูลเป็นช่วงเพื่อป้องกันการทำงานล้มเหลว
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="dataType">ประเภทข้อมูล</Label>
                    <Select value={selectedDataType} onValueChange={setSelectedDataType}>
                      <SelectTrigger id="dataType">
                        <SelectValue placeholder="เลือกประเภทข้อมูล" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USDTHB">USD/THB</SelectItem>
                        <SelectItem value="GOLDTH">ทองคำไทย</SelectItem>
                        <SelectItem value="GOLDUS">ทองคำสากล</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="chunkDays">จำนวนวันต่อช่วง</Label>
                    <Select value={chunkDays.toString()} onValueChange={value => setChunkDays(parseInt(value, 10))}>
                      <SelectTrigger id="chunkDays">
                        <SelectValue placeholder="เลือกจำนวนวันต่อช่วง" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="15">15 วัน</SelectItem>
                        <SelectItem value="30">30 วัน</SelectItem>
                        <SelectItem value="60">60 วัน</SelectItem>
                        <SelectItem value="90">90 วัน</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="startDate">วันเริ่มต้น (dd-mm-yy)</Label>
                    <Input
                      id="startDate"
                      value={startDate}
                      onChange={e => setStartDate(e.target.value)}
                      placeholder="01-01-20"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="endDate">วันสิ้นสุด (dd-mm-yy)</Label>
                    <Input
                      id="endDate"
                      value={endDate}
                      onChange={e => setEndDate(e.target.value)}
                      placeholder="31-12-20"
                    />
                  </div>
                </div>
                
                <Button
                  onClick={createDataHandler}
                  disabled={createDataLoading}
                  className="w-full"
                >
                  {createDataLoading ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      กำลังสร้างชุดข้อมูล...
                    </>
                  ) : (
                    <>
                      <Calendar className="mr-2 h-4 w-4" />
                      สร้างชุดข้อมูล
                    </>
                  )}
                </Button>
                
                {createDataLoading && (
                  <div className="space-y-2">
                    <Progress value={createDataProgress} className="w-full" />
                    <p className="text-sm text-muted-foreground text-center">{createDataProgress}%</p>
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex flex-col items-start">
                {createDataResult && (
                  <Alert className="w-full">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>ดำเนินการเสร็จสิ้น</AlertTitle>
                    <AlertDescription>
                      <div className="mt-2">
                        <p>สร้างข้อมูลเรียบร้อยแล้ว {createDataResult.chunks} ช่วง</p>
                        <p>จำนวนข้อมูลทั้งหมด: {createDataResult.data?.length || 0} รายการ</p>
                      </div>
                    </AlertDescription>
                  </Alert>
                )}
              </CardFooter>
            </Card>
          </TabsContent>
          
          {/* ส่วนอัปเดตข้อมูลอัตโนมัติ */}
          <TabsContent value="dailyData" className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>ตั้งค่า Backend URL</CardTitle>
                <CardDescription>
                  เลือกใช้ URL ของ backend ในโหมด production หรือ development
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="apiEnvironment">เลือก Environment</Label>
                    <Select value={apiEnvironment} onValueChange={handleApiEnvironmentChange}>
                      <SelectTrigger id="apiEnvironment">
                        <SelectValue placeholder="เลือก Environment" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="production">Production</SelectItem>
                        <SelectItem value="development">Development</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <Alert>
                  <Server className="h-4 w-4" />
                  <AlertTitle>Backend URL ปัจจุบัน</AlertTitle>
                  <AlertDescription>
                    <div className="mt-2">
                      <p>Environment: <span className="font-medium">{apiEnvironment}</span></p>
                      <p>URL: <span className="font-medium">{API_ENVIRONMENTS[apiEnvironment]}</span></p>
                    </div>
                  </AlertDescription>
                </Alert>
                
                <Button 
                  onClick={() => {
                    toast({
                      title: "ทดสอบการเชื่อมต่อ",
                      description: `กำลังทดสอบการเชื่อมต่อกับ ${API_ENVIRONMENTS[apiEnvironment]}`,
                    });
                    
                    // ทดสอบการเชื่อมต่อโดยเรียกใช้ API อย่างง่าย
                    updateDailyData()
                      .then(() => {
                        toast({
                          title: "เชื่อมต่อสำเร็จ",
                          description: `สามารถเชื่อมต่อกับ backend ได้`,
                        });
                      })
                      .catch(error => {
                        toast({
                          title: "เชื่อมต่อล้มเหลว",
                          description: `ไม่สามารถเชื่อมต่อกับ backend ได้: ${error.message}`,
                          variant: "destructive",
                        });
                      });
                  }}
                  className="w-full"
                >
                  <Globe className="mr-2 h-4 w-4" />
                  ทดสอบการเชื่อมต่อ
                </Button>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>ตั้งค่าการอัปเดตข้อมูลอัตโนมัติ</CardTitle>
                <CardDescription>
                  ตั้งค่าความถี่ในการอัปเดตข้อมูลประจำวันโดยอัตโนมัติ
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="frequency">ความถี่ในการอัปเดต (ชั่วโมง)</Label>
                    <Select value={frequencyHours.toString()} onValueChange={value => setFrequencyHours(parseInt(value, 10))}>
                      <SelectTrigger id="frequency">
                        <SelectValue placeholder="เลือกความถี่" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">ทุก 1 ชั่วโมง</SelectItem>
                        <SelectItem value="3">ทุก 3 ชั่วโมง</SelectItem>
                        <SelectItem value="6">ทุก 6 ชั่วโมง</SelectItem>
                        <SelectItem value="12">ทุก 12 ชั่วโมง</SelectItem>
                        <SelectItem value="24">ทุก 24 ชั่วโมง</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-end">
                    <Button onClick={saveFrequencyHandler} className="w-full">
                      <Clock className="mr-2 h-4 w-4" />
                      บันทึกความถี่
                    </Button>
                  </div>
                </div>
                
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>การอัปเดตล่าสุด</AlertTitle>
                  <AlertDescription>
                    <div className="mt-2">
                      <p>อัปเดตล่าสุดเมื่อ: {formatLastUpdateTime()}</p>
                      <p>ตั้งค่าการอัปเดตทุก: {frequencyHours} ชั่วโมง</p>
                    </div>
                  </AlertDescription>
                </Alert>
                
                <Button
                  onClick={updateDailyDataHandler}
                  disabled={dailyDataLoading}
                  className="w-full"
                >
                  {dailyDataLoading ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      กำลังอัปเดตข้อมูล...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      อัปเดตข้อมูลตอนนี้
                    </>
                  )}
                </Button>
              </CardContent>
              <CardFooter className="flex flex-col items-start">
                {dailyDataResult && (
                  <Alert className="w-full">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>อัปเดตข้อมูลเรียบร้อยแล้ว</AlertTitle>
                    <AlertDescription>
                      <div className="mt-2">
                        <p>สถานะ: {dailyDataResult.status}</p>
                        <p>ช่วงเวลา: {dailyDataResult.start_date} ถึง {dailyDataResult.end_date}</p>
                      </div>
                    </AlertDescription>
                  </Alert>
                )}
              </CardFooter>
            </Card>
          </TabsContent>
          
          {/* ส่วนแดชบอร์ด */}
          <TabsContent value="dashboard" className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>ภาพรวมข้อมูล</CardTitle>
                <CardDescription>
                  แสดงข้อมูลล่าสุดในรูปแบบกราฟอย่างง่าย
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="dashboardDataType">ประเภทข้อมูล</Label>
                    <Select value={dashboardDataType} onValueChange={setDashboardDataType}>
                      <SelectTrigger id="dashboardDataType">
                        <SelectValue placeholder="เลือกประเภทข้อมูล" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USDTHB">USD/THB</SelectItem>
                        <SelectItem value="GOLDTH">ทองคำไทย</SelectItem>
                        <SelectItem value="GOLDUS">ทองคำสากล</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dashboardTimeframe">ช่วงเวลา</Label>
                    <Select value={dashboardTimeframe} onValueChange={setDashboardTimeframe}>
                      <SelectTrigger id="dashboardTimeframe">
                        <SelectValue placeholder="เลือกช่วงเวลา" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="day">รายวัน</SelectItem>
                        <SelectItem value="week">รายสัปดาห์</SelectItem>
                        <SelectItem value="month">รายเดือน</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="pt-4">
                  {dashboardLoading ? (
                    <div className="space-y-3">
                      <Skeleton className="h-[200px] w-full" />
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-full" />
                      </div>
                    </div>
                  ) : (
                    <>
                      {renderSimpleChart()}
                      <div className="mt-4">
                        {dashboardData && (
                          <Alert>
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>ข้อมูลล่าสุด</AlertTitle>
                            <AlertDescription>
                              <div className="mt-2">
                                <p>ช่วงเวลา: {dashboardData.start_date} ถึง {dashboardData.end_date}</p>
                                <p>จำนวนข้อมูล: {dashboardData.data?.datasets?.[0]?.data?.length || 0} รายการ</p>
                              </div>
                            </AlertDescription>
                          </Alert>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
              <CardFooter>
                <Button onClick={loadDashboardData} className="w-full">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  โหลดข้อมูลใหม่
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Admin; 