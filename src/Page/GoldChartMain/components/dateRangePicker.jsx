import React, { useState, useCallback } from 'react';
import * as Popover from '@radix-ui/react-popover';
import { 
  format, subDays, subMonths, subYears, startOfYear, 
  endOfDay, startOfDay, isEqual, isValid 
} from 'date-fns';
import { DayPicker } from 'react-day-picker';

export const PRESETS = [
  { label: "7D", range: "7D", tooltip: "7 Days" },
  { label: "1M", range: "1M", tooltip: "1 Month" },
  { label: "3M", range: "3M", tooltip: "3 Months" },
  { label: "6M", range: "6M", tooltip: "6 Months" },
  { label: "YTD", range: "YTD", tooltip: "Year to Date" },
  { label: "1Y", range: "1Y", tooltip: "1 Year" },
  { label: "5Y", range: "5Y", tooltip: "5 Years" }, // Assuming 3Y was a typo for 5Y, or you can add 3Y
  { label: "MAX", range: "ALL", tooltip: "All Time" },
];

function DateRangePicker({ 
  currentRange, 
  activeOption = 'ALL',
  onRangeChange,
  align = "end", // Default align for custom popover, "end" is often better if Custom is last
  earliestDate,
  latestDate = new Date(),
  isOpen, // For controlling custom popover visibility externally
  onOpenChange // For controlling custom popover visibility externally
}) {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const isPopoverOpen = isOpen !== undefined ? isOpen : internalIsOpen;
  const setIsPopoverOpen = onOpenChange || setInternalIsOpen;

  const calculatePresetRange = useCallback((presetRange, endDate = latestDate) => {
    const end = endOfDay(endDate);
    let start;

    // Handle YTD and ALL presets directly to ensure specific logic
    if (presetRange === 'YTD') {
      // For YTD, the range is always from the start of the 'endDate'\'s year.
      return { from: startOfYear(end), to: end };
    }
    if (presetRange === 'ALL') {
      if (earliestDate && isValid(earliestDate)) {
        return { from: startOfDay(earliestDate), to: end };
      }
      return { from: startOfYear(new Date(0)), to: end }; // Fallback for ALL
    }

    // Handle other fixed-duration presets
    switch (presetRange) {
      case '7D':
        start = startOfDay(subDays(end, 6));
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
      case '1Y':
        start = startOfDay(subYears(end, 1));
        break;
      case '5Y':
        start = startOfDay(subYears(end, 5));
        break;
      default:
        // This case should ideally not be hit if all PRESETS are covered.
        // If it is, 'start' might be undefined, and !isValid(start) below will handle it.
        console.warn(`Unknown preset range: ${presetRange}`);
        start = startOfYear(new Date(0)); // Fallback for unknown presets
        break;
    }

    // Clamp with earliestDate for presets other than YTD/ALL (this check is now naturally bypassed for YTD/ALL due to early returns)
    if (earliestDate && isValid(earliestDate) && start < earliestDate) {
      start = startOfDay(earliestDate);
    }

    // Validate final start date
    if (!isValid(start)) {
      const fallbackStart = earliestDate && isValid(earliestDate) ? 
        startOfDay(earliestDate) : startOfYear(new Date(0));
      return { from: fallbackStart, to: end };
    }

    return { from: start, to: end };
  }, [earliestDate, latestDate]);

  const handlePresetClick = (preset) => {
    const newRange = calculatePresetRange(preset.range, latestDate);
    onRangeChange(newRange, preset.range);
    setIsPopoverOpen(false); // Close custom popover if it was open
  };
  
  const handleCalendarSelect = (selectedDateRange) => {
    let finalRange = selectedDateRange;

    if (finalRange?.from && finalRange?.to && finalRange.to < finalRange.from) {
      finalRange = { from: finalRange.to, to: finalRange.from };
    }
    
    if (finalRange?.from && isValid(finalRange.from)) {
      finalRange.from = startOfDay(finalRange.from);
    } else {
      // If 'from' is cleared or invalid, treat as no range selected from calendar
      onRangeChange(undefined, activeOption === 'CUSTOM' ? 'ALL' : activeOption); // Revert to ALL or current preset
      setIsPopoverOpen(false);
      return;
    }
    
    if (finalRange?.to && isValid(finalRange.to)) {
      finalRange.to = endOfDay(finalRange.to);
    } else if (finalRange?.from) { // If only 'from' is selected, make 'to' the same day
      finalRange.to = endOfDay(finalRange.from);
    }

    onRangeChange(finalRange, 'CUSTOM');

    if (finalRange?.from && finalRange?.to) {
      setIsPopoverOpen(false);
    }
  };
  
  const handleClearInPopover = () => {
    // Reverts to the 'ALL' preset when "Clear" is clicked in the popover
    const allPreset = PRESETS.find(p => p.range === 'ALL') || PRESETS[PRESETS.length -1];
    if (allPreset) {
      handlePresetClick(allPreset);
    }
    setIsPopoverOpen(false);
  };

  const getCustomButtonLabel = () => {
    if (activeOption === 'CUSTOM' && currentRange?.from && isValid(currentRange.from)) {
      const fromDate = currentRange.from;
      const toDate = currentRange.to && isValid(currentRange.to) ? currentRange.to : fromDate;
      
      if (isEqual(startOfDay(fromDate), startOfDay(toDate))) {
        return format(fromDate, "dd MMM \'\'yy");
      }
      return `${format(fromDate, "dd MMM \'\'yy")} - ${format(toDate, "dd MMM \'\'yy")}`;
    }
    return "Custom";
  };

  return (
    <div className="relative pt-3"> {/* Added relative positioning and top padding */}
      <div className="absolute top-0 left-2 -translate-y-1/2 bg-background px-1 text-xs text-muted-foreground"> {/* Label style */}
        Date Range
      </div>
      <div className="flex flex-wrap items-center gap-1 p-1 rounded-md border border-border bg-background shadow-sm"> {/* Changed border to border-border */}
        {PRESETS.map((preset) => (
          <button
            key={preset.label}
            title={preset.tooltip}
            onClick={() => handlePresetClick(preset)}
            className={`inline-flex items-center justify-center whitespace-nowrap rounded-md text-xs font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-7 px-3 py-1 flex-grow sm:flex-grow-0
              ${activeOption === preset.range 
                ? 'bg-primary text-primary-foreground hover:bg-primary/90' 
                : 'bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground'}`}
          >
            {preset.label === 'MAX' ? 'Max' : preset.label}
          </button>
        ))}
        <Popover.Root open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
          <Popover.Trigger asChild>
            <button
              id="custom-date-range-trigger"
              aria-label="Select custom date range"
              className={`inline-flex items-center justify-center whitespace-nowrap rounded-md text-xs font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-7 px-3 py-1 flex-grow sm:flex-grow-0
                ${activeOption === 'CUSTOM' 
                  ? 'bg-primary text-primary-foreground hover:bg-primary/90' 
                  : 'bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground'}`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1 h-3 w-3 opacity-90">
                 <path d="M8 2v4"></path><path d="M16 2v4"></path><rect width="18" height="18" x="3" y="4" rx="2"></rect><path d="M3 10h18"></path>
              </svg>
              {getCustomButtonLabel()}
            </button>
          </Popover.Trigger>
          <Popover.Portal>
            <Popover.Content 
              className="z-50 rounded-md border bg-popover text-popover-foreground shadow-md outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 w-auto p-0"
              sideOffset={5}
              align={align}
            >
              <div className="p-3"> {/* Added padding around DayPicker and Clear button */}
                <DayPicker
                  mode="range"
                  selected={activeOption === 'CUSTOM' ? currentRange : undefined} // Only show selection in picker if custom is active
                  onSelect={handleCalendarSelect}
                  numberOfMonths={1}
                  showOutsideDays
                  disabled={(date) => 
                    (earliestDate && isValid(earliestDate) && date < startOfDay(earliestDate)) ||
                    (latestDate && isValid(latestDate) && date > endOfDay(latestDate))
                  }
                  fromDate={earliestDate ? startOfDay(earliestDate) : undefined}
                  toDate={latestDate ? endOfDay(latestDate) : undefined}
                  classNames={{
                    caption: 'flex justify-center pt-1 relative items-center',
                    caption_label: 'text-sm font-medium',
                    nav: 'space-x-1 flex items-center',
                    nav_button: 'rdp-button_reset rdp-button inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border border-input hover:bg-accent hover:text-accent-foreground h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 absolute',
                    nav_button_previous: 'left-1',
                    nav_button_next: 'right-1',
                    table: 'w-full border-collapse space-y-1 mt-2', // Added mt-2 for spacing
                    head_row: 'flex',
                    head_cell: 'text-muted-foreground rounded-md w-8 font-normal text-[0.8rem]', // Adjusted width
                    row: 'flex w-full mt-2',
                    cell: 'h-8 w-8 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20', // Adjusted size
                    day: 'rdp-button_reset rdp-button inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-8 w-8 p-0 font-normal aria-selected:opacity-100', // Adjusted size
                    day_range_end: 'day-range-end',
                    day_selected: 'bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground',
                    day_today: 'bg-accent text-accent-foreground',
                    day_outside: 'day-outside text-muted-foreground opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-100', // Ensure selected outside days are visible
                    day_disabled: 'text-muted-foreground opacity-50',
                    day_hidden: 'invisible',
                  }}
                />
                {/* Show clear button only if a custom range is being interacted with or selected */}
                {(isPopoverOpen && currentRange?.from && activeOption === 'CUSTOM') && (
                  <button
                    onClick={handleClearInPopover}
                    className="w-full justify-center text-xs mt-2 pt-1 border-t flex items-center gap-1 text-muted-foreground hover:text-foreground"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3 w-3">
                      <path d="M18 6 6 18"></path>
                      <path d="m6 6 12 12"></path>
                    </svg>
                    Clear Custom Range
                  </button>
                )}
              </div>
            </Popover.Content>
          </Popover.Portal>
        </Popover.Root>
      </div>
    </div>
  );
}

export default DateRangePicker;
