import React, { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../Data/hooks';

/**
 * Component สำหรับแสดงเวลาปัจจุบันและปุ่ม Refresh (เช่น 17:14 (+7))
 */
const CurrentTime = () => {
  const [time, setTime] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const queryClient = useQueryClient();
  
  useEffect(() => {
    // Function to update time
    const updateTime = () => {
      const now = new Date();
      const hours = now.getHours().toString().padStart(2, '0');
      const minutes = now.getMinutes().toString().padStart(2, '0');
      const seconds = now.getSeconds().toString().padStart(2, '0');
      const timeString = `${hours}:${minutes}:${seconds} (+7)`;
      setTime(timeString);
    };
    
    // Update time immediately
    updateTime();
    
    // Set interval to update time every second for more accurate display
    const interval = setInterval(updateTime, 1000); // 1000ms = 1 second
    
    // Cleanup interval on component unmount
    return () => clearInterval(interval);
  }, []);

  // Function to manually refresh all data
  const handleRefresh = () => {
    setRefreshing(true);
    
    // Invalidate all queries to force a refetch
    queryClient.invalidateQueries({ queryKey: [queryKeys.goldTh] });
    queryClient.invalidateQueries({ queryKey: [queryKeys.prediction] });
    queryClient.invalidateQueries({ queryKey: [queryKeys.goldUs] });
    queryClient.invalidateQueries({ queryKey: [queryKeys.usdThb] });
    
    // Reset refreshing state after a short delay
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };
  
  return (
    <div className="flex items-center text-sm font-medium text-gray-600">
      <button 
        onClick={handleRefresh} 
        disabled={refreshing}
        className={`mr-2 p-1 rounded-full ${refreshing ? 'bg-blue-100 text-blue-400' : 'hover:bg-blue-100 text-blue-500'}`}
        title="Refresh data"
      >
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" 
          />
        </svg>
      </button>
      {time}
    </div>
  );
};

export default CurrentTime;
