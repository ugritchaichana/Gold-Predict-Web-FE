import React, { useState, useCallback } from 'react';
import * as Popover from '@radix-ui/react-popover';
import { 
  format, subDays, subMonths, subYears, startOfYear, 
  endOfDay, startOfDay, isEqual, isValid 
} from 'date-fns';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';

// Define preset ranges to match TradingView example
export const PRESETS = [
  { label: "1D", range: "1D", tooltip: "1 Day" },
  { label: "5D", range: "5D", tooltip: "5 Days" },
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
const EnhancedDateRangePicker = ({ 
  currentRange, 
  activeOption = 'ALL',
  onRangeChange,
  align = "start",
  earliestDate,
  latestDate = new Date(),
  isOpen,
  onOpenChange 
}) => {
  // Local state for managing the popover visibility if not controlled externally
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const isPopoverOpen = isOpen !== undefined ? isOpen : internalIsOpen;
  const setIsPopoverOpen = onOpenChange || setInternalIsOpen;

  // Function to calculate date range based on preset and latestDate
  const calculatePresetRange = useCallback((presetRange, endDate = latestDate) => {
    const end = endOfDay(endDate); // Use end of the latest available day
    let start;

    switch (presetRange) {
      case '1D':
        // For 1D, we show just today
        start = startOfDay(end);
        break;
      case '5D':
        start = startOfDay(subDays(end, 4)); // 5 days including end date
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
        break;
      case '1Y':
        start = startOfDay(subYears(end, 1));
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
              <style>{`
                .rdp {
                  --rdp-cell-size: 32px;
                  --rdp-accent-color: #0000ff;
                  --rdp-background-color: #e7edff;
                  margin: 0;
                }
                
                .rdp-months {
                  display: flex;
                  justify-content: center;
                }
                
                .rdp-month {
                  background-color: var(--rdp-background-color);
                  border-radius: 6px;
                  width: 100%;
                  max-width: 300px;
                }
                
                .rdp-table {
                  width: 100%;
                  max-width: 300px;
                  border-collapse: collapse;
                  border-spacing: 0;
                }
                
                .rdp-caption {
                  display: flex;
                  align-items: center;
                  justify-content: space-between;
                  padding: 0 0.5em;
                  text-align: center;
                  border-radius: 6px;
                }
                
                .rdp-nav {
                  white-space: nowrap;
                }
                
                .rdp-head {
                  border-bottom: 1px solid #e2e8f0;
                }
                
                .rdp-head_row,
                .rdp-row {
                  display: flex;
                  width: 100%;
                }
                
                .rdp-head_cell {
                  flex: 1;
                  text-align: center;
                  font-weight: 600;
                  font-size: 0.75rem;
                  padding: 0.5rem 0;
                  text-transform: uppercase;
                }
                
                .rdp-cell {
                  flex: 1;
                  text-align: center;
                  padding: 0.25rem 0;
                  height: var(--rdp-cell-size);
                  width: var(--rdp-cell-size);
                  display: flex;
                  align-items: center;
                  justify-content: center;
                }
                
                .rdp-day {
                  width: 100%;
                  height: 100%;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  border-radius: 4px;
                  font-size: 0.85rem;
                  cursor: pointer;
                  border: 0;
                  background: transparent;
                }
                
                .rdp-day:hover {
                  background-color: var(--rdp-background-color);
                }
                
                .rdp-day_selected {
                  background-color: var(--rdp-accent-color);
                  color: #fff;
                }
                
                .rdp-day_selected:hover {
                  background-color: var(--rdp-accent-color);
                  opacity: 0.8;
                }
                
                .rdp-day_outside {
                  opacity: 0.5;
                }
                
                .rdp-button {
                  background: none;
                  border: 0;
                  cursor: pointer;
                  padding: 0.5rem;
                }
              `}</style>
              <DayPicker
                mode="range"
                selected={currentRange}
                onSelect={handleCalendarSelect}
                numberOfMonths={1}
                showOutsideDays
                classNames={{
                  root: 'rdp',
                  months: 'rdp-months',
                  month: 'rdp-month',
                  caption: 'rdp-caption flex justify-between items-center py-2 relative',
                  caption_label: 'rdp-caption_label text-sm font-medium text-center flex-grow text-center',
                  nav: 'rdp-nav flex space-x-1',
                  nav_button: 'rdp-nav_button flex items-center justify-center w-7 h-7 bg-transparent p-0 opacity-75 hover:opacity-100',
                  nav_button_previous: 'rdp-nav_button_previous',
                  nav_button_next: 'rdp-nav_button_next',
                  table: 'rdp-table w-full',
                  head: 'rdp-head',
                  head_row: 'rdp-head_row flex w-full',
                  head_cell: 'rdp-head_cell flex-1 text-center text-xs font-medium text-muted-foreground',
                  tbody: 'rdp-tbody',
                  row: 'rdp-row flex w-full mt-0.5',
                  cell: 'rdp-cell relative p-0 text-center text-sm focus-within:relative focus-within:z-20 [&:has([aria-selected])]:bg-accent/50',
                  day: 'rdp-day relative inline-flex h-8 w-8 items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 aria-selected:opacity-100',
                  day_range_start: 'rdp-day_range_start',
                  day_range_end: 'rdp-day_range_end',
                  day_selected: 'rdp-day_selected bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground',
                  day_today: 'rdp-day_today border border-primary',
                  day_outside: 'rdp-day_outside text-muted-foreground opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-30',
                  day_disabled: 'rdp-day_disabled text-muted-foreground opacity-50',
                  day_hidden: 'rdp-day_hidden invisible',
                }}
                disabled={(date) => 
                  (earliestDate && isValid(earliestDate) && date < startOfDay(earliestDate)) ||
                  (latestDate && isValid(latestDate) && date > endOfDay(latestDate))
                }
                fromDate={earliestDate}
                toDate={latestDate}
                formatters={{
                  formatCaption: (date, options) => {
                    return format(date, 'MMMM yyyy', { locale: options?.locale });
                  },
                  formatWeekdayName: (weekday, options) => {
                    return format(weekday, 'EEE', { locale: options?.locale }).substring(0, 2);
                  }
                }}
              />
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
};

// Export both as default and named export
export default EnhancedDateRangePicker;
export { EnhancedDateRangePicker };
