import { useEffect, useState } from 'react';

const PredictionErrorStatsStore = {
  listeners: [],
  errorStats: {
    average: 0,
    high: 0,
    low: 0,
    date: new Date()
  },
  predictionData: null,
  selectedDate: null,
  
  getErrorStats() {
    return this.errorStats;
  },
  
  setErrorStats(stats) {
    this.errorStats = stats;
    this.notifyListeners();
  },
  
  getPredictionData() {
    return this.predictionData;
  },
  
  setPredictionData(data) {
    this.predictionData = data;
    this.notifyListeners();
  },
  
  getSelectedDate() {
    return this.selectedDate;
  },
  
  setSelectedDate(date) {
    this.selectedDate = date;
    this.notifyListeners();
  },
  
  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  },
  
  notifyListeners() {
    this.listeners.forEach(listener => listener(this.errorStats));
  }
};

export function usePredictionErrorStats() {
  const [errorStats, setErrorStats] = useState(PredictionErrorStatsStore.getErrorStats());
  const [predictionData, setPredictionData] = useState(PredictionErrorStatsStore.getPredictionData());
  const [selectedDate, setSelectedDate] = useState(PredictionErrorStatsStore.getSelectedDate());
  
  useEffect(() => {
    const unsubscribe = PredictionErrorStatsStore.subscribe(stats => {
      setErrorStats(stats);
      setPredictionData(PredictionErrorStatsStore.getPredictionData());
      setSelectedDate(PredictionErrorStatsStore.getSelectedDate());
    });
    
    return unsubscribe;
  }, []);
  
  return {
    errorStats,
    predictionData,
    selectedDate,
    setErrorStats: (stats) => PredictionErrorStatsStore.setErrorStats(stats),
    setPredictionData: (data) => PredictionErrorStatsStore.setPredictionData(data),
    setSelectedDate: (date) => PredictionErrorStatsStore.setSelectedDate(date)
  };
}

export default PredictionErrorStatsStore;
