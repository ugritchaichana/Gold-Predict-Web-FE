import * as React from 'react';
import { useEffect, useState } from 'react';
import { StaticDatePicker } from '@mui/x-date-pickers/StaticDatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { Box, CircularProgress } from '@mui/material';
import thLocale from 'date-fns/locale/th';
import { fetchPredictionWeekDate } from '@/services/apiService';

export default function BigPredictionCalendar({ value, onChange }) {
  const [availableDates, setAvailableDates] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDates() {
      setLoading(true);
      try {
        const res = await fetchPredictionWeekDate();
        const dates = Array.isArray(res.data)
          ? res.data.map(item => item.date)
          : [];
        setAvailableDates(dates);
        console.log('[BigPredictionCalendar] Available dates:', dates);
      } catch (e) {
        console.error('[BigPredictionCalendar] Error loading dates:', e);
        setAvailableDates([]);
      } finally {
        setLoading(false);
      }
    }
    loadDates();
  }, []);

  const isAvailable = (date) => {
    const d = date.toISOString().split('T')[0];
    return availableDates.includes(d);
  };

  const shouldDisableDate = (date) => !isAvailable(date);
  const handleDateChange = (newDate) => {
    console.log('[BigPredictionCalendar] Date selected:', newDate);
    if (onChange) {
      if (newDate && isAvailable(newDate)) {
        onChange(newDate);
      } else {
        console.warn('[BigPredictionCalendar] Selected date not available:', newDate);
      }
    }
  };

  return (
    <Box sx={{ maxWidth: 420, mx: 'auto', my: 2 }}>
      <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={thLocale}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
            <CircularProgress />
          </Box>
        ) : (
          <StaticDatePicker
            displayStaticWrapperAs="desktop"
            value={value}
            onChange={handleDateChange}
            shouldDisableDate={shouldDisableDate}
            sx={{
              '& .MuiPickersDay-root.Mui-disabled': {
                backgroundColor: '#e5e7eb',
                color: '#9ca3af',
                pointerEvents: 'none',
              },
              '& .MuiPickersDay-root': {
                fontWeight: 500,
                fontSize: '1rem',
              },
            }}
          />
        )}
      </LocalizationProvider>
    </Box>
  );
}
