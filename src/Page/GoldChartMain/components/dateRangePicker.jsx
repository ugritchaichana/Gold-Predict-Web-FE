import React, { useState, useCallback, useEffect, useMemo } from 'react';
import * as Popover from '@radix-ui/react-popover';
import { 
  format, subDays, subMonths, subYears, startOfYear, 
  endOfDay, startOfDay, isEqual, isValid, getYear, setMonth, setYear,
  getMonth, addYears, addMonths
} from 'date-fns';
import { DayPicker, useNavigation } from 'react-day-picker';
import { useTranslation } from 'react-i18next';

export const PRESETS = [
  { label: "7D", range: "7D" },
  { label: "1M", range: "1M" },
  { label: "3M", range: "3M" },
  { label: "6M", range: "6M" },
  { label: "YTD", range: "YTD" },
  { label: "1Y", range: "1Y" },
  { label: "3Y", range: "3Y" },
  { label: "5Y", range: "5Y" },
  { label: "MAX", range: "ALL" },
];

function DateRangePicker({ 
  currentRange, 
  activeOption = 'ALL',
  onRangeChange,
  align = "end", // Default align for custom popover, "end" is often better if Custom is last
  earliestDate,
  latestDate = new Date(),
  isOpen, // For controlling custom popover visibility externally
  onOpenChange, // For controlling custom popover visibility externally
  singleDateMode = false // New prop for single date selection mode
}) {
  const { t, i18n } = useTranslation();
  
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const isPopoverOpen = isOpen !== undefined ? isOpen : internalIsOpen;
  const setIsPopoverOpen = onOpenChange || setInternalIsOpen;
  // Temporary state to hold range selection before confirming with OK button
  const [tempRange, setTempRange] = useState({
    from: undefined,
    to: new Date()
  });
  // State for calendar view (days, months, years)
  const [calendarView, setCalendarView] = useState('days');
  const [viewDate, setViewDate] = useState(new Date());
  const [decadeStart, setDecadeStart] = useState(Math.floor(getYear(new Date()) / 10) * 10);
  
  // Localization settings for react-day-picker
  const localeSettings = useMemo(() => {
    // Get day names from translations
    const weekdays = t('goldChart.dateRange.weekDaysShort', { returnObjects: true });
    const weekdayLabels = [
      weekdays.Su, weekdays.Mo, weekdays.Tu, weekdays.We, 
      weekdays.Th, weekdays.Fr, weekdays.Sa
    ];
    
    // Get month names from translations
    const months = t('goldChart.dateRange.monthsFull', { returnObjects: true });
    const monthLabels = [
      months.January, months.February, months.March, months.April,
      months.May, months.June, months.July, months.August,
      months.September, months.October, months.November, months.December
    ];
    
    // Create shorthand month labels for the picker
    const monthsShort = t('goldChart.dateRange.monthsShort', { returnObjects: true });
    const monthShortLabels = [
      monthsShort.Jan, monthsShort.Feb, monthsShort.Mar, monthsShort.Apr,
      monthsShort.May, monthsShort.Jun, monthsShort.Jul, monthsShort.Aug,
      monthsShort.Sep, monthsShort.Oct, monthsShort.Nov, monthsShort.Dec
    ];
    
    return {
      weekdays: weekdayLabels,
      months: monthLabels,
      monthsShort: monthShortLabels,
      formatters: {
        formatWeekdayName: (day) => weekdayLabels[day.getDay()],
        formatMonthCaption: (date) => monthLabels[date.getMonth()],
      }
    };
  }, [t, i18n.language]); // Recalculate when language changes
  
  // Update temp range when currentRange or popover opens
  useEffect(() => {
    if (isPopoverOpen) {
      if (activeOption === 'CUSTOM' && currentRange?.from) {
        setTempRange({
          from: startOfDay(currentRange.from),
          to: endOfDay(currentRange.to || new Date())
        });
        setViewDate(currentRange.from); // Set view date to the start date
      } else {
        setTempRange({
          from: undefined,
          to: endOfDay(new Date())
        });
        setViewDate(new Date());
      }
      // Reset to default day view whenever popover opens
      setCalendarView('days');
    }
  }, [isPopoverOpen, currentRange, activeOption]);
  
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
        break;      case '1Y':
        start = startOfDay(subYears(end, 1));
        break;
      case '3Y':
        // Fix for 3Y showing incorrect date range
        // Should show data from 3 years ago, not 7 years ago
        start = startOfDay(subYears(end, 3));
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
    console.log(`Preset ${preset.range} selected:`, {
      from: newRange.from.toISOString(),
      to: newRange.to.toISOString(),
      fromDate: newRange.from.toLocaleDateString(),
      toDate: newRange.to.toLocaleDateString()
    });
    onRangeChange(newRange, preset.range);
    setIsPopoverOpen(false); // Close custom popover if it was open
  };
    const handleCalendarSelect = (selectedDateRange) => {
    // Handle no selection case
    if (!selectedDateRange) {
      setTempRange({
        from: undefined,
        to: endOfDay(new Date())
      });
      return;
    }
    
    // If we have a selected date
    if (selectedDateRange?.from) {
      const fromDate = startOfDay(selectedDateRange.from);
      let toDate;
      
      // If in single date mode, always set both from and to to the same date
      if (singleDateMode) {
        toDate = endOfDay(selectedDateRange.from);
        setTempRange({
          from: fromDate,
          to: toDate
        });
        
        // In single date mode, we can auto-confirm selection immediately
        const from = new Date(fromDate.getFullYear(), fromDate.getMonth(), fromDate.getDate(), 0, 0, 0);
        const validatedRange = {
          from: from,
          to: from
        };
        onRangeChange(validatedRange, 'CUSTOM');
        setIsPopoverOpen(false);
        return;
      }
      
      // For standard range picker, continue with normal behavior
      // If both dates are selected
      if (selectedDateRange.to) {
        // Make sure from < to
        if (selectedDateRange.to < selectedDateRange.from) {
          toDate = endOfDay(selectedDateRange.from);
          setTempRange({ 
            from: startOfDay(selectedDateRange.to),
            to: toDate
          });
        } else {
          toDate = endOfDay(selectedDateRange.to);
          setTempRange({
            from: fromDate,
            to: toDate
          });
        }
      } else {
        // If only from is selected, keep the existing to date if it exists
        // This prevents resetting the end date when selecting a new start date
        toDate = tempRange.to ? tempRange.to : endOfDay(new Date());
        setTempRange({
          from: fromDate,
          to: toDate
        });
      }
    }
  };
  
  const handleConfirm = () => {
    if (tempRange.from) {
      // Create fresh Date objects to avoid reference issues and timezone issues
      // IMPORTANT: Use the exact same method for both date range picker and chart components
      const from = new Date(tempRange.from.getFullYear(), tempRange.from.getMonth(), tempRange.from.getDate(), 0, 0, 0);
      const to = tempRange.to ? 
        new Date(tempRange.to.getFullYear(), tempRange.to.getMonth(), tempRange.to.getDate(), 23, 59, 59, 999) :
        new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate(), 23, 59, 59, 999);
      
      const validatedRange = {
        from: from,
        to: to
      };
      
      // Log the dates for debugging
      console.log('Confirming date range:', {
        from: validatedRange.from.toISOString(),
        to: validatedRange.to.toISOString(),
        fromFormatted: validatedRange.from.toLocaleDateString('en-GB'),
        toFormatted: validatedRange.to.toLocaleDateString('en-GB'),
        fromTime: validatedRange.from.getTime(),
        toTime: validatedRange.to.getTime()
      });
      
      onRangeChange(validatedRange, 'CUSTOM');
      setIsPopoverOpen(false);
    }
  };
  
  const handleReset = () => {
    setTempRange({
      from: undefined,
      to: endOfDay(new Date())
    });
  };
  
  const handleClearInPopover = () => {
    const allPreset = PRESETS.find(p => p.range === 'ALL') || PRESETS[PRESETS.length -1];
    if (allPreset) {
      handlePresetClick(allPreset);
    }
    setIsPopoverOpen(false);
  };  const getCustomButtonLabel = () => {
    if (activeOption === 'CUSTOM' && currentRange?.from && isValid(currentRange.from)) {
      const fromDate = currentRange.from;
      const toDate = currentRange.to && isValid(currentRange.to) ? currentRange.to : fromDate;
      
      // Get localized month names
      const months = t('goldChart.dateRange.monthsShort', { returnObjects: true });
      const monthsArray = [
        months.Jan, months.Feb, months.Mar, months.Apr,
        months.May, months.Jun, months.Jul, months.Aug,
        months.Sep, months.Oct, months.Nov, months.Dec
      ];
      
      // Format dates with localized month names
      const formatLocalDate = (date) => {
        const day = date.getDate().toString().padStart(2, '0');
        const month = monthsArray[date.getMonth()];
        const year = date.getFullYear().toString().slice(-2);
        return `${day} ${month} ${year}`;
      };
      
      if (isEqual(startOfDay(fromDate), startOfDay(toDate))) {
        return formatLocalDate(fromDate);
      }
      return `${formatLocalDate(fromDate)} - ${formatLocalDate(toDate)}`;
    }
    return t('goldChart.dateRange.custom');
  };

  // Month and year selection handlers
  const handleMonthSelect = (month) => {
    const newDate = setMonth(viewDate, month);
    setViewDate(newDate);
    setCalendarView('days');
  };

  const handleYearSelect = (year) => {
    const newDate = setYear(viewDate, year);
    setViewDate(newDate);
    setCalendarView('months');
  };

  // Handler for caption clicks to toggle between views
  const handleCaptionClick = (type) => {
    if (type === 'months') {
      setCalendarView('months');
    } else if (type === 'years') {
      setCalendarView('years');
    }
  };
  // Custom Caption component for DayPicker - with fixed height to match other headers
  const CustomCaption = ({ displayMonth }) => {
    const { goToMonth, nextMonth, previousMonth } = useNavigation();
    
    const handlePreviousClick = () => {
      if (previousMonth) goToMonth(previousMonth);
    };
    
    const handleNextClick = () => {
      if (nextMonth) goToMonth(nextMonth);
    };

    // Get localized month names
    const monthsFull = t('goldChart.dateRange.monthsFull', { returnObjects: true });
    const monthNames = [
      monthsFull.January, monthsFull.February, monthsFull.March, monthsFull.April,
      monthsFull.May, monthsFull.June, monthsFull.July, monthsFull.August,
      monthsFull.September, monthsFull.October, monthsFull.November, monthsFull.December
    ];

    return (
      <div className="flex justify-center items-center w-full relative h-12">
        <button
          title={t('goldChart.dateRange.previousMonth')}
          className="absolute left-1 inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input hover:bg-accent hover:text-accent-foreground h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100"
          onClick={handlePreviousClick}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        
        <div className="flex space-x-1 items-center">
          <button
            onClick={() => handleCaptionClick('months')}
            title={t('goldChart.dateRange.selectMonth')}
            className="text-sm font-medium hover:bg-accent hover:text-accent-foreground rounded-md px-2 py-1"
          >
            {monthNames[displayMonth.getMonth()]}
          </button>
          <button
            onClick={() => handleCaptionClick('years')}
            title={t('goldChart.dateRange.selectYear')}
            className="text-sm font-medium hover:bg-accent hover:text-accent-foreground rounded-md px-2 py-1"
          >
            {displayMonth.getFullYear()}
          </button>
        </div>
        
        <button
          title={t('goldChart.dateRange.nextMonth')}
          className="absolute right-1 inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input hover:bg-accent hover:text-accent-foreground h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100"
          onClick={handleNextClick}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 18l6-6-6-6" />
          </svg>
        </button>
      </div>
    );
  };
    // Month picker component with consistent sizing and alignment
  const MonthPicker = () => {
    // Get localized month names
    const monthsShort = t('goldChart.dateRange.monthsShort', { returnObjects: true });
    const localizedMonths = [
      monthsShort.Jan, monthsShort.Feb, monthsShort.Mar, monthsShort.Apr,
      monthsShort.May, monthsShort.Jun, monthsShort.Jul, monthsShort.Aug,
      monthsShort.Sep, monthsShort.Oct, monthsShort.Nov, monthsShort.Dec
    ];
    
    return (
      <div className="grid grid-cols-3 gap-2 p-2 flex-grow">
        {localizedMonths.map((month, i) => (
          <button
            key={i}
            onClick={() => handleMonthSelect(i)}
            className={`flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 h-10
              ${getMonth(viewDate) === i 
                ? 'bg-primary text-primary-foreground hover:bg-primary/90' 
                : 'bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground'}`}
          >
            {month}
          </button>
        ))}
      </div>
    );
  };
  
  // Year picker component with consistent sizing and alignment
  const YearPicker = () => {
    const years = Array.from({ length: 12 }, (_, i) => decadeStart + i - 1);
    const currentYear = getYear(new Date());
    
    return (
      <div className="flex-grow flex flex-col">
        <div className="flex justify-between items-center h-12 px-2">
          <button
            className="inline-flex items-center justify-center rounded-md p-1 hover:bg-accent h-7 w-7"
            onClick={() => setDecadeStart(decadeStart - 10)}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <span className="text-sm font-medium">
            {decadeStart} - {decadeStart + 9}
          </span>
          <button
            className="inline-flex items-center justify-center rounded-md p-1 hover:bg-accent h-7 w-7"
            onClick={() => setDecadeStart(decadeStart + 10)}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        </div>
        <div className="grid grid-cols-3 gap-2 p-2 flex-grow">
          {years.map(year => (
            <button
              key={year}
              onClick={() => handleYearSelect(year)}
              className={`flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 h-10
                ${getYear(viewDate) === year 
                  ? 'bg-primary text-primary-foreground hover:bg-primary/90' 
                  : year === currentYear 
                    ? 'bg-accent text-accent-foreground' 
                    : 'bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground'}`}
            >
              {year}
            </button>
          ))}
        </div>
      </div>
    );
  };
  // Helper function to format dates with localized month names
  const formatLocalDate = (date) => {
    if (!date || !isValid(date)) return t('common.noData');
    
    // Get localized month names
    const months = t('goldChart.dateRange.monthsShort', { returnObjects: true });
    const monthsArray = [
      months.Jan, months.Feb, months.Mar, months.Apr,
      months.May, months.Jun, months.Jul, months.Aug,
      months.Sep, months.Oct, months.Nov, months.Dec
    ];
    
    const day = date.getDate().toString().padStart(2, '0');
    const month = monthsArray[date.getMonth()];
    const year = date.getFullYear();
    return `${day} ${month} ${year}`;
  };
  return (
    <div className="relative pt-3"> 
      <div className="absolute top-0 left-2 -translate-y-1/2 bg-background px-1 text-xs text-muted-foreground">
        {t('goldChart.dateRange.title')}
      </div>      <div className="flex flex-wrap items-center gap-1 p-1 rounded-md border border-border bg-background shadow-sm">        {PRESETS.map((preset) => (
          <div key={preset.label} className="relative group">
            <button
              title={t(`goldChart.dateRange.quickActions.${preset.label}`)}
              onClick={() => handlePresetClick(preset)}
              className={`inline-flex items-center justify-center whitespace-nowrap rounded-md text-xs font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-7 px-3 py-1 flex-grow sm:flex-grow-0
                ${activeOption === preset.range 
                  ? 'bg-primary text-primary-foreground hover:bg-primary/90' 
                  : 'bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground'}`}
            >              {preset.label === 'MAX' 
                ? t('goldChart.dateRange.quickActions.Max') 
                : t(`goldChart.dateRange.quickActions.${preset.label}`)}
            </button>
            <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-1 whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10 delay-300">
              <div className="bg-popover text-popover-foreground text-xs rounded-md p-2 shadow-md border border-border">
                {t(`goldChart.dateRange.tooltips.${preset.label}`, `Show data for the last ${preset.label}`)}
              </div>
            </div>
          </div>
        ))}        <Popover.Root open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
          <Popover.Trigger asChild>
            <div className="relative group">
              <button
                id="custom-date-range-trigger"
                aria-label="Select custom date range"
                className={`inline-flex items-center justify-center whitespace-nowrap rounded-md text-xs font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-7 px-3 py-1 flex-grow sm:flex-grow-0 w-[150px]
                  ${activeOption === 'CUSTOM' 
                    ? 'bg-primary text-primary-foreground hover:bg-primary/90' 
                    : 'bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground'}`}
              >                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1 h-3 w-3 opacity-90">
                   <path d="M8 2v4"></path><path d="M16 2v4"></path><rect width="18" height="18" x="3" y="4" rx="2"></rect><path d="M3 10h18"></path>
                </svg>
                {getCustomButtonLabel()}
              </button>
              <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-1 whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10 delay-300">
                <div className="bg-popover text-popover-foreground text-xs rounded-md p-2 shadow-md border border-border">
                  {t(`goldChart.dateRange.tooltips.custom`, `Select a custom date range`)}
                </div>
              </div>
            </div>
          </Popover.Trigger>
          <Popover.Portal>
            <Popover.Content 
              className="z-50 rounded-md border bg-popover text-popover-foreground shadow-md outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 w-auto p-0"
              sideOffset={5}
              align={align}
            >
              <div className="p-3">                {tempRange?.from && (
                  <div className="text-xs text-muted-foreground mb-2">
                    {tempRange.from ? formatLocalDate(tempRange.from) : t('goldChart.dateRange.startDate') + ": " + t('common.noData')} - 
                    {tempRange.to ? formatLocalDate(tempRange.to) : t('goldChart.dateRange.endDate') + ": " + t('common.noData')}
                  </div>
                )}
                
                {/* Calendar View Container with consistent width and fixed height */}
                <div className="w-[280px] h-[320px] flex flex-col">
                  {calendarView === 'days' ? (                    <DayPicker
                      mode="range"
                      selected={tempRange}
                      onSelect={handleCalendarSelect}
                      numberOfMonths={1}
                      showOutsideDays
                      month={viewDate}
                      onMonthChange={setViewDate}
                      disabled={(date) => 
                        (earliestDate && isValid(earliestDate) && date < startOfDay(earliestDate)) ||
                        (latestDate && isValid(latestDate) && date > endOfDay(latestDate))
                      }
                      fromDate={earliestDate ? startOfDay(earliestDate) : undefined}
                      toDate={latestDate ? endOfDay(latestDate) : undefined}
                      components={{
                        Caption: CustomCaption
                      }}
                      formatters={{
                        formatWeekdayName: (date) => {
                          const weekdays = t('goldChart.dateRange.weekDaysShort', { returnObjects: true });
                          const dayNames = [weekdays.Su, weekdays.Mo, weekdays.Tu, weekdays.We, weekdays.Th, weekdays.Fr, weekdays.Sa];
                          return dayNames[date.getDay()];
                        }
                      }}
                      classNames={{
                        root: 'w-full h-full flex flex-col',
                        months: 'flex flex-col flex-grow',
                        month: 'flex flex-col flex-grow',
                        caption: 'flex justify-center relative items-center h-12',
                        caption_label: 'text-sm font-medium',
                        nav: 'space-x-1 flex items-center',
                        nav_button: 'rdp-button_reset rdp-button inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border border-input hover:bg-accent hover:text-accent-foreground h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 absolute',
                        nav_button_previous: 'left-1',
                        nav_button_next: 'right-1',
                        table: 'w-full border-collapse space-y-1 flex-grow', 
                        head_row: 'flex w-full h-8',
                        head_cell: 'text-muted-foreground rounded-md w-10 font-normal text-[0.8rem] flex items-center justify-center',
                        row: 'flex w-full h-10',
                        cell: 'h-10 w-10 text-center text-sm p-0 relative flex items-center justify-center [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20',
                        day: 'rdp-button_reset rdp-button inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-8 w-8 p-0 font-normal aria-selected:opacity-100',
                        day_range_end: 'day-range-end',
                        day_selected: 'bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground',
                        day_today: 'bg-accent text-accent-foreground',
                        day_outside: 'day-outside text-muted-foreground opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-100',
                        day_disabled: 'text-muted-foreground opacity-50',
                        day_hidden: 'invisible',
                        foot: 'mt-2',
                        button_reset: 'rdp-button_reset'
                      }}
                    />
                  ) : calendarView === 'months' ? (
                    <div className="h-full flex flex-col">
                      <div className="py-2 h-12">
                        <button 
                          onClick={() => setCalendarView('days')}
                          className="flex items-center text-sm font-medium hover:underline"
                        >                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                            <path d="M15 18l-6-6 6-6" />
                          </svg>
                          {t('goldChart.dateRange.backToCalendar')}
                        </button>
                        <div className="text-center text-sm font-medium">
                          {getYear(viewDate)}
                        </div>
                      </div>
                      <div className="flex-grow flex flex-col justify-center">
                        <MonthPicker />
                      </div>
                    </div>
                  ) : (
                    <div className="h-full flex flex-col">
                      <div className="py-2 h-12">
                        <button 
                          onClick={() => setCalendarView('months')}
                          className="flex items-center text-sm font-medium hover:underline"
                        >                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                            <path d="M15 18l-6-6 6-6" />
                          </svg>
                          {t('goldChart.dateRange.backToMonths')}
                        </button>
                      </div>
                      <div className="flex-grow flex flex-col justify-center">
                        <YearPicker />
                      </div>
                    </div>
                  )}
                </div>
                  <div className="flex justify-between items-center mt-3 pt-2 border-t">
                  <button
                    onClick={handleReset}
                    className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-xs font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-7 px-3 py-1"
                  >
                    {t('goldChart.dateRange.reset')}
                  </button>
                  <button
                    onClick={handleConfirm}
                    className={`inline-flex items-center justify-center whitespace-nowrap rounded-md text-xs font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-7 px-3 py-1 
                    ${!tempRange.from ? 'bg-muted text-muted-foreground' : 'bg-primary text-primary-foreground hover:bg-primary/90'}`}
                    disabled={!tempRange.from}
                  >
                    {t('goldChart.dateRange.apply')}
                  </button>
                </div>
              </div>
            </Popover.Content>
          </Popover.Portal>
        </Popover.Root>
      </div>
    </div>
  );
}

export default DateRangePicker;
