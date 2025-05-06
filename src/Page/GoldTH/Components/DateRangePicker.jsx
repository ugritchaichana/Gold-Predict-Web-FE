import React, { useState } from 'react';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import "../tradingview-style.css";
import { addDays, addMonths, startOfYear, endOfDay } from 'date-fns';

/**
 * Component สำหรับเลือกช่วงวันที่ที่ต้องการแสดงข้อมูล (แบบ TradingView Style)
 * 
 * @param {Object} props
 * @param {Date} props.startDate - วันที่เริ่มต้น
 * @param {Date} props.endDate - วันที่สิ้นสุด
 * @param {Function} props.onChange - function ที่จะเรียกเมื่อมีการเปลี่ยนแปลงช่วงวันที่
 */
const DateRangePicker = ({ startDate, endDate, onChange }) => {
  const [range, setRange] = useState('1M');
  const [showDatePicker, setShowDatePicker] = useState(false);
  
  // Preset ranges (TradingView style)
  const presets = [
    { label: '1D', value: '1D', tooltip: '1 day', fn: () => ({ start: addDays(new Date(), -1), end: new Date() }) },
    { label: '5D', value: '5D', tooltip: '5 days', fn: () => ({ start: addDays(new Date(), -5), end: new Date() }) },
    { label: '1M', value: '1M', tooltip: '1 month', fn: () => ({ start: addMonths(new Date(), -1), end: new Date() }) },
    { label: '3M', value: '3M', tooltip: '3 months', fn: () => ({ start: addMonths(new Date(), -3), end: new Date() }) },
    { label: '6M', value: '6M', tooltip: '6 months', fn: () => ({ start: addMonths(new Date(), -6), end: new Date() }) },
    { label: 'YTD', value: 'YTD', tooltip: 'Year to date', fn: () => ({ start: startOfYear(new Date()), end: new Date() }) },
    { label: '1Y', value: '1Y', tooltip: '1 year', fn: () => ({ start: addMonths(new Date(), -12), end: new Date() }) },
    { label: '5Y', value: '5Y', tooltip: '5 years', fn: () => ({ start: addMonths(new Date(), -60), end: new Date() }) },
    { label: 'ALL', value: 'ALL', tooltip: 'All data', fn: () => ({ start: new Date(2010, 0, 1), end: new Date() }) },
  ];  const handlePresetChange = (preset) => {
    setRange(preset);
    
    if (preset === 'CUSTOM') return;
    
    const selectedPreset = presets.find(p => p.value === preset);
    if (selectedPreset) {
      const { start, end } = selectedPreset.fn();
      onChange(start, end);
    }
  };

  // Handle date changes manually to set range to 'custom'
  const handleDateChange = (dates) => {
    const [start, end] = dates;
    
    // Format end date to include the end of day
    const endOfDayDate = end ? endOfDay(end) : null;
    
    setRange('CUSTOM');
    onChange(start, endOfDayDate);
    setShowDatePicker(false); // Hide the date picker after selection
  };

  // Toggle date picker visibility
  const toggleDatePicker = () => {
    setShowDatePicker(!showDatePicker);
  };  return (
    <div className="tradingview-style mt-2 mb-4">
      {/* TradingView-style date range selector */}
      <div className="flex items-center bg-gray-100 rounded-md p-1 shadow-sm">
        <div className="flex flex-wrap">
          {presets.map(preset => (
            <button
              key={preset.value}
              type="button"
              onClick={() => handlePresetChange(preset.value)}
              title={preset.tooltip}
              className={`
                px-3 py-1 text-xs font-medium mx-0.5 rounded tv-animate-hover
                ${range === preset.value 
                  ? 'bg-tradingview-blue text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}
              `}
            >
              {preset.label}
            </button>
          ))}
        </div>
        
        {/* Separator */}
        <span className="mx-2 text-gray-300">|</span>
        
        {/* "Go to" button with improved styling */}
        <button
          type="button"
          onClick={toggleDatePicker}
          className="flex items-center px-3 py-1 rounded hover:bg-gray-200 tv-animate-hover"
          title="Go to specific date range"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 mr-1">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
          </svg>
          <span className="text-xs font-medium">Go to...</span>
        </button>
      </div>
        {/* Date picker popup with TradingView styling */}
      {showDatePicker && (
        <div className="absolute z-10 mt-1 bg-white rounded-md shadow-lg p-3 border border-gray-100 date-picker-container">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium">Select Date Range</span>
            <button 
              onClick={() => setShowDatePicker(false)}
              className="text-gray-400 hover:text-gray-600 focus:outline-none"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
          
          <DatePicker
            inline
            selectsRange={true}
            startDate={startDate}
            endDate={endDate}
            onChange={handleDateChange}
            maxDate={new Date()}
          />
          
          <div className="flex justify-between mt-3 items-center">
            <div className="text-xs text-gray-500">
              {startDate && endDate ? (
                <div className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-tradingview-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  {`${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`}
                </div>
              ) : 'Select date range'}
            </div>
            <div className="flex space-x-2">
              <button 
                className="text-xs px-3 py-1 bg-gray-100 text-gray-600 rounded hover:bg-gray-200 tv-animate-hover"
                onClick={() => setShowDatePicker(false)}
              >
                Cancel
              </button>
              <button 
                className="text-xs px-3 py-1 bg-tradingview-blue text-white rounded hover:bg-blue-600 tv-animate-hover"
                onClick={() => handleDateChange([startDate, endDate])}
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DateRangePicker;
