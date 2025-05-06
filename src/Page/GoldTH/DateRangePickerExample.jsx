import React, { useState } from 'react';
import EnhancedDateRangePicker from './Components/EnhancedDateRangePicker';

/**
 * Example component demonstrating how to use the EnhancedDateRangePicker
 */
const DateRangePickerExample = () => {
  // State for storing the selected date range
  const [dateRange, setDateRange] = useState({
    from: new Date(new Date().setMonth(new Date().getMonth() - 1)), // Default to 1 month ago
    to: new Date() // Current date
  });
  
  // State for storing the active option ('5D', '1M', etc. or 'CUSTOM')
  const [activeOption, setActiveOption] = useState('1M');
  
  // State for controlling the date picker popover
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  
  // Define the earliest and latest possible dates
  const earliestDate = new Date(2010, 0, 1); // Jan 1, 2010
  const latestDate = new Date(); // Current date
  
  // Handler for date range changes
  const handleRangeChange = (newRange, newOption) => {
    console.log('Range changed:', newRange);
    console.log('Selected option:', newOption);
    setDateRange(newRange);
    setActiveOption(newOption);
  };
  
  return (
    <div className="p-4">
      <h2 className="text-lg font-semibold mb-2">Date Range Picker Example</h2>
      
      {/* The Enhanced Date Range Picker component */}
      <EnhancedDateRangePicker 
        currentRange={dateRange} 
        activeOption={activeOption} 
        onRangeChange={handleRangeChange} 
        earliestDate={earliestDate} 
        latestDate={latestDate}
        align="start"
        isOpen={isDatePickerOpen}
        onOpenChange={setIsDatePickerOpen}
      />
      
      {/* Display the current selection */}
      <div className="mt-4 p-3 bg-gray-100 rounded">
        <p className="font-medium">Current Selection:</p>
        <p>From: {dateRange?.from ? dateRange.from.toLocaleDateString() : 'Not selected'}</p>
        <p>To: {dateRange?.to ? dateRange.to.toLocaleDateString() : 'Not selected'}</p>
        <p>Option: {activeOption}</p>
      </div>
    </div>
  );
};

export default DateRangePickerExample;
