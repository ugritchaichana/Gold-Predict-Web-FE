import React, { useState, useEffect } from 'react';

/**
 * Component สำหรับแสดงเวลาปัจจุบัน (เช่น 17:14 (+7))
 */
const CurrentTime = () => {
  const [time, setTime] = useState('');
  
  useEffect(() => {
    // Function to update time
    const updateTime = () => {
      const now = new Date();
      const hours = now.getHours().toString().padStart(2, '0');
      const minutes = now.getMinutes().toString().padStart(2, '0');
      const timeString = `${hours}:${minutes} (+7)`;
      setTime(timeString);
    };
    
    // Update time immediately
    updateTime();
    
    // Set interval to update time every minute
    const interval = setInterval(updateTime, 60000); // 60000ms = 1 minute
    
    // Cleanup interval on component unmount
    return () => clearInterval(interval);
  }, []);
  
  return (
    <div className="text-sm font-medium text-gray-600">
      {time}
    </div>
  );
};

export default CurrentTime;
