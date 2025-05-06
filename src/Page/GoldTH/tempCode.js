// This is a temporary file with the fixed handleCrosshairMove function

// Setup crosshair handler in a separate effect to prevent infinite rerenders
useEffect(() => {
  if (!chart.current) return;
  
  const handleCrosshairMove = (param) => {
    if (
      !param || 
      param.time === undefined || 
      !param.point || 
      param.point.x < 0 || 
      param.point.y < 0
    ) {
      return;
    }
    
    const timestamp = param.time;
    
    // Find closest value helper - with safe handling of various data structures
    const findClosestValue = (dataArray, time) => {
      if (!dataArray || !Array.isArray(dataArray) || dataArray.length === 0) return null;
      
      try {
        const exact = dataArray.find(item => item && item.time === time);
        if (exact) return exact.value;
        
        const closest = dataArray.reduce((prev, curr) => {
          if (!prev || !prev.time) return curr;
          if (!curr || !curr.time) return prev;
          return Math.abs(curr.time - time) < Math.abs(prev.time - time) ? curr : prev;
        });
        
        return closest && closest.value !== undefined ? closest.value : null;
      } catch (error) {
        console.error("Error finding closest value:", error);
        return null;
      }
    };
    
    // Find date string - safely accessing data structures
    const findDateString = () => {
      // Safety check for goldData
      if (!goldData) return "DD-MM-YYYY";
      
      // First check if goldData is an object with dates array
      if (goldData && goldData.dates && Array.isArray(goldData.dates) && goldData.dates.length > 0) {
        try {
          const dateObj = goldData.dates.find(d => d && d.time === timestamp);
          if (dateObj) return dateObj.date;
          
          const closestDateObj = goldData.dates.reduce((prev, curr) => {
            if (!prev || !prev.time) return curr;
            if (!curr || !curr.time) return prev;
            return Math.abs(curr.time - timestamp) < Math.abs(prev.time - timestamp) ? curr : prev;
          });
          
          return closestDateObj && closestDateObj.date ? closestDateObj.date : "DD-MM-YYYY";
        } catch (error) {
          console.error("Error finding date string:", error);
          return "DD-MM-YYYY";
        }
      } 
      // If goldData is an array of objects
      else if (Array.isArray(goldData) && goldData.length > 0) {
        try {
          const dateObj = goldData.find(d => d && (d.time === timestamp || d.time/1000 === timestamp));
          if (dateObj) return dateObj.date || dateObj.time;
          
          const closestDateObj = goldData.reduce((prev, curr) => {
            if (!prev || (!prev.time && !prev.date)) return curr;
            if (!curr || (!curr.time && !curr.date)) return prev;
            const prevTime = prev.time || new Date(prev.date).getTime()/1000;
            const currTime = curr.time || new Date(curr.date).getTime()/1000;
            return Math.abs(currTime - timestamp) < Math.abs(prevTime - timestamp) ? curr : prev;
          });
          
          return closestDateObj && (closestDateObj.date || closestDateObj.time) ? 
            (closestDateObj.date || closestDateObj.time) : "DD-MM-YYYY";
        } catch (error) {
          console.error("Error finding date in array data:", error);
          return "DD-MM-YYYY";
        }
      }
      
      return "DD-MM-YYYY";
    };
    
    try {
      // Extract data based on the structure of goldData
      let barBuy = null;
      let barSell = null;
      let ornamentBuy = null;
      let ornamentSell = null;
      let barPriceChange = null;
      
      if (goldData && typeof goldData === 'object' && !Array.isArray(goldData)) {
        // Object with arrays data structure
        barBuy = findClosestValue(goldData.barBuy, timestamp);
        barSell = findClosestValue(goldData.barSell, timestamp);
        ornamentBuy = findClosestValue(goldData.ornamentBuy, timestamp);
        ornamentSell = findClosestValue(goldData.ornamentSell, timestamp);
        barPriceChange = findClosestValue(goldData.barPriceChange, timestamp);
      } else if (Array.isArray(goldData) && goldData.length > 0) {
        // Array of objects data structure
        const item = goldData.find(d => d && (d.time === timestamp || d.time/1000 === timestamp));
        if (item) {
          barBuy = item.barBuy || item.bar_buy;
          barSell = item.barSell || item.bar_sell;
          ornamentBuy = item.ornamentBuy || item.ornament_buy;
          ornamentSell = item.ornamentSell || item.ornament_sell;
          barPriceChange = item.barPriceChange || item.price_change;
        } else {
          const closest = goldData.reduce((prev, curr) => {
            if (!prev || (!prev.time && !prev.date)) return curr;
            if (!curr || (!curr.time && !curr.date)) return prev;
            const prevTime = prev.time || new Date(prev.date).getTime()/1000;
            const currTime = curr.time || new Date(curr.date).getTime()/1000;
            return Math.abs(currTime - timestamp) < Math.abs(prevTime - timestamp) ? curr : prev;
          });
          
          if (closest) {
            barBuy = closest.barBuy || closest.bar_buy;
            barSell = closest.barSell || closest.bar_sell;
            ornamentBuy = closest.ornamentBuy || closest.ornament_buy;
            ornamentSell = closest.ornamentSell || closest.ornament_sell;
            barPriceChange = closest.barPriceChange || closest.price_change;
          }
        }
      }
      
      // Find prediction value
      const prediction = filteredPredictionData && Array.isArray(filteredPredictionData) && filteredPredictionData.length > 0 
        ? findClosestValue(filteredPredictionData, timestamp) : null;
      
      setHoveredData({
        date: findDateString(),
        barBuy,
        barSell,
        ornamentBuy,
        ornamentSell,
        barPriceChange,
        prediction,
      });
    } catch (error) {
      console.error("Error processing crosshair data:", error);
    }
  };
  
  // Subscribe to crosshair movements
  chart.current.subscribeCrosshairMove(handleCrosshairMove);
  
  // Cleanup
  return () => {
    if (chart.current) {
      chart.current.unsubscribeCrosshairMove(handleCrosshairMove);
    }
  };
}, [goldData, filteredPredictionData]); // Don't include hoveredData here to avoid infinite loop
