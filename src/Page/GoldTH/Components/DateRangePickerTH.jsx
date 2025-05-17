import React, { useState, useCallback } from 'react';
import * as Popover from '@radix-ui/react-popover';
import { 
  format, subDays, subMonths, subYears, startOfYear, 
  endOfDay, startOfDay, isEqual, isValid 
} from 'date-fns';
import { DayPicker } from 'react-day-picker';
// import 'react-day-picker/dist/style.css';

// Define preset ranges to match TradingView example
export const PRESETS = [
  { label: "7D", range: "7D", tooltip: "7 Days" },
  { label: "1M", range: "1M", tooltip: "1 Month" },
  { label: "3M", range: "3M", tooltip: "3 Months" },
  { label: "6M", range: "6M", tooltip: "6 Months" },
  { label: "YTD", range: "YTD", tooltip: "Year to Date" },
  { label: "1Y", range: "1Y", tooltip: "1 Year" },
  { label: "5Y", range: "5Y", tooltip: "5 Years" },
  { label: "MAX", range: "ALL", tooltip: "All Time" },
];

/**
 * Enhanced DateRangePicker component with presets and popup calendar
 * Based on TradingView's date range picker
 */
function DateRangePickerTH({ 
  currentRange, 
  activeOption = 'ALL',
  onRangeChange,
  align = "start",
  earliestDate,
  latestDate = new Date(),
  isOpen,
  onOpenChange 
}) {
  // Local state for managing the popover visibility if not controlled externally
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const isPopoverOpen = isOpen !== undefined ? isOpen : internalIsOpen;
  const setIsPopoverOpen = onOpenChange || setInternalIsOpen;
  // Function to calculate date range based on preset and latestDate
  const calculatePresetRange = useCallback((presetRange, endDate = latestDate) => {
    const end = endOfDay(endDate); // Use end of the latest available day
    let start;

    switch (presetRange) {
      case '7D':
        start = startOfDay(subDays(end, 6)); // 7 days including end date
        break;
      case '1M':
        start = startOfDay(subMonths(end, 1));
        break;
      case '3M':
        start = startOfDay(subMonths(end, 3));
        break;
      case '6M':
        start = startOfDay(subMonths(end, 6));
        break;
      case 'YTD':
        start = startOfYear(end);
        break;      case '1Y':
        start = startOfDay(subYears(end, 1));
        break;
      case '3Y':
        start = startOfDay(subYears(end, 3));
        break;
      case '5Y':
        start = startOfDay(subYears(end, 5));
        break;
      case 'ALL':
      default:
        // ALL means full range from earliest to latest available date
        if (earliestDate && isValid(earliestDate)) {
          return { from: startOfDay(earliestDate), to: end };
        }
        // Fallback to YTD if earliest is bad
        return { from: startOfYear(end), to: end };
    }

    // Adjust start date if it's earlier than the earliest available data point
    if (earliestDate && isValid(earliestDate) && start < earliestDate) {
      start = startOfDay(earliestDate);
    }

    // Make sure start is valid before returning
    if (!isValid(start)) {
      const fallbackStart = earliestDate && isValid(earliestDate) ? 
        startOfDay(earliestDate) : startOfYear(end);
      return { from: fallbackStart, to: end };
    }

    return { from: start, to: end };
  }, [earliestDate, latestDate]);

  // Handler for when a preset button is clicked
  const handlePresetClick = (preset) => {
    const newRange = calculatePresetRange(preset.range, latestDate);
    onRangeChange(newRange, preset.range);
    setIsPopoverOpen(false);
  };
  
  // Handler for when a date or range is selected in the calendar
  const handleCalendarSelect = (selectedDateRange) => {
    let finalRange = selectedDateRange;

    // Ensure 'to' date is not before 'from' date if both exist
    if (finalRange?.from && finalRange?.to && finalRange.to < finalRange.from) {
      // Swap them
      finalRange = { from: finalRange.to, to: finalRange.from };
    }
    
    // Set 'to' to end of day and 'from' to start of day
    if (finalRange?.from && isValid(finalRange.from)) {
      finalRange.from = startOfDay(finalRange.from);
    } else {
      finalRange = { from: undefined, to: undefined }; // Invalidate if 'from' is bad
    }
    
    if (finalRange?.to && isValid(finalRange.to)) {
      finalRange.to = endOfDay(finalRange.to);
    } else if (finalRange?.from) {
      // If only 'from' is selected, set 'to' to the end of the same day
      finalRange.to = endOfDay(finalRange.from);
    }

    // Only proceed if we have a valid 'from' date
    if (finalRange?.from) {
      // When a custom date is selected, notify parent with the range and 'CUSTOM' identifier
      onRangeChange(finalRange, 'CUSTOM');
    } else {
      // Send undefined range if selection is invalid
      onRangeChange(undefined, 'CUSTOM');
    }

    // Close the popover once a complete custom range is selected (from and to)
    if (finalRange?.from && finalRange?.to) {
      setIsPopoverOpen(false);
    }
  };
  
  // Clear Date Selection
  const handleClear = () => {
    onRangeChange(undefined, 'ALL'); // Reset to ALL or a default state
    setIsPopoverOpen(false);
  };

  // Function to determine the label displayed on the trigger button
  const getButtonLabel = () => {
    // If the active option is a preset (not 'CUSTOM')
    if (activeOption && activeOption !== 'CUSTOM') {
      const preset = PRESETS.find(p => p.range === activeOption);
      if (preset) return preset.label === 'MAX' ? 'Max' : preset.label;
    }
    
    // If active option is 'CUSTOM' and a valid range exists
    if (activeOption === 'CUSTOM' && currentRange?.from && isValid(currentRange.from)) {
      if (currentRange.to && isValid(currentRange.to)) {
        // If from and to are the same day
        if (isEqual(startOfDay(currentRange.from), startOfDay(currentRange.to))) {
          return format(currentRange.from, "dd MMM yyyy");
        }
        // It's a different day range
        return `${format(currentRange.from, "dd MMM yyyy")} - ${format(currentRange.to, "dd MMM yyyy")}`;
      }
      // Only 'from' exists (should be handled by handleCalendarSelect, but defensively)
      return format(currentRange.from, "dd MMM yyyy");
    }

    // Fallback label
    return "Date range";
  };

  return (
    <Popover.Root open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
      <Popover.Trigger asChild>
        <button 
          id="date"
          className="inline-flex items-center gap-2 whitespace-nowrap ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 hover:bg-accent hover:text-accent-foreground w-auto justify-start text-left font-normal h-8 px-2 rounded-md text-xs text-muted-foreground"
          aria-label="Select date range"
          type="button"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-calendar mr-1 h-3.5 w-3.5 opacity-70">
            <path d="M8 2v4"></path>
            <path d="M16 2v4"></path>
            <rect width="18" height="18" x="3" y="4" rx="2"></rect>
            <path d="M3 10h18"></path>
          </svg>
          <span>{getButtonLabel()}</span>
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content 
          className="z-50 rounded-md border bg-popover text-popover-foreground shadow-md outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 w-auto p-0"
          sideOffset={5}
          align={align}
        >
          <div className="flex flex-col sm:flex-row">
            <div className="flex flex-wrap items-center gap-1 p-2 border-b sm:border-b-0 sm:border-r sm:flex-col sm:items-stretch sm:gap-1 sm:min-w-[100px]">
              {PRESETS.map((preset) => (
                <button
                  key={preset.label}
                  className={`inline-flex items-center gap-2 whitespace-nowrap font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 hover:bg-accent hover:text-accent-foreground justify-center sm:justify-start w-auto sm:w-full text-xs px-2 py-1 h-7 rounded-md flex-grow sm:flex-grow-0 ${
                    activeOption === preset.range ? 'bg-secondary text-secondary-foreground hover:bg-secondary/80 font-semibold' : ''
                  }`}
                  title={preset.tooltip}
                  onClick={() => handlePresetClick(preset)}
                >
                  {preset.label}
                </button>
              ))}
            </div>
            <div className="p-2">
              <DayPicker
                mode="range"
                selected={currentRange}
                onSelect={handleCalendarSelect}
                numberOfMonths={1}
                showOutsideDays
                classNames={{
                  caption: 'flex justify-center pt-1 relative items-center',
                  caption_label: 'text-sm font-medium',
                  nav: 'space-x-1 flex items-center',
                  nav_button: 'rdp-button_reset rdp-button inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border border-input hover:bg-accent hover:text-accent-foreground h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 absolute',
                  nav_button_previous: 'left-1',
                  nav_button_next: 'right-1',
                  table: 'w-full border-collapse space-y-1',
                  head_row: 'flex',
                  head_cell: 'text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]',
                  row: 'flex w-full mt-2',
                  cell: 'h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20',
                  day: 'rdp-button_reset rdp-button inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 hover:bg-accent hover:text-accent-foreground h-9 w-9 p-0 font-normal aria-selected:opacity-100',
                  day_range_end: 'day-range-end',
                  day_selected: 'bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground',
                  day_today: 'bg-accent text-accent-foreground',
                  day_outside: 'day-outside text-muted-foreground opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground',
                  day_disabled: 'text-muted-foreground opacity-50',
                  day_hidden: 'invisible',
                }}
                disabled={(date) => 
                  (earliestDate && isValid(earliestDate) && date < startOfDay(earliestDate)) ||
                  (latestDate && isValid(latestDate) && date > endOfDay(latestDate))
                }
                fromDate={earliestDate}
                toDate={latestDate}
              />
              {/* Clear button */}
              {currentRange?.from && (
                <button
                  onClick={handleClear}
                  className="w-full justify-center text-xs mt-1 flex items-center gap-1 text-muted-foreground hover:text-foreground"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3 w-3">
                    <path d="M18 6 6 18"></path>
                    <path d="m6 6 12 12"></path>
                  </svg>
                  Clear
                </button>
              )}
            </div>
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}

// Export the component
export default DateRangePickerTH;
