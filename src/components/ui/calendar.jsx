"use client";

import * as React from "react";
import { useEffect, useState, useRef } from "react";
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { CircularProgress, Box } from '@mui/material';
import { fetchPredictionWeekDate } from '@/services/apiService';
import dayjs from 'dayjs';
import { useTheme as useMuiTheme, createTheme, ThemeProvider } from '@mui/material/styles';
import { useTheme } from '@/components/theme-provider';

function Calendar({ value, onChange }) {
  const { theme: appTheme } = useTheme();
  const datePickerRef = useRef(null);
  
  const customMuiTheme = React.useMemo(() => createTheme({
    palette: {
      mode: appTheme === 'dark' ? 'dark' : 'light',
      primary: {
        main: appTheme === 'dark' ? '#f59e0b' : '#f59e0b',
      },
      background: {
        default: appTheme === 'dark' ? '#09090b' : '#ffffff',
        paper: appTheme === 'dark' ? '#1a1a1a' : '#ffffff',
      },
      text: {
        primary: appTheme === 'dark' ? '#ffffff' : '#09090b',
        secondary: appTheme === 'dark' ? '#a1a1aa' : '#71717a',
      },
      divider: appTheme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
    },
  }), [appTheme]);
    const isDarkMode = customMuiTheme.palette.mode === 'dark';

  const [availableDates, setAvailableDates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    async function loadDates() {
      setLoading(true);
      try {
        const res = await fetchPredictionWeekDate();
        const dates = Array.isArray(res)
          ? res.map(item => item.date)
          : (Array.isArray(res.data) ? res.data.map(item => item.date) : []);
        setAvailableDates(dates);
      } catch (e) {
        setAvailableDates([]);
      } finally {
        setLoading(false);
      }
    }
    loadDates();
  }, []);

  const isAvailable = (date) => {
    const d = dayjs(date).format('YYYY-MM-DD');
    return availableDates.includes(d);
  };

  const shouldDisableDate = (date) => !isAvailable(date);

  const handleInputClick = () => {
    setOpen(true);
  };

  return (
    <ThemeProvider theme={customMuiTheme}>
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100%' }}>
            <CircularProgress 
              sx={{ 
                color: customMuiTheme.palette.primary.main 
              }} 
            />
          </Box>
        ) : (
          <DatePicker
            ref={datePickerRef}
            value={value}
            onChange={onChange}
            shouldDisableDate={shouldDisableDate}
            format="DD/MM/YYYY"
            open={open}
            onOpen={() => setOpen(true)}
            onClose={() => setOpen(false)}
            slotProps={{
              textField: {
                fullWidth: true,
                variant: "outlined",
                placeholder: "เลือกวันที่",
                InputProps: {
                  readOnly: true,
                  onClick: handleInputClick,
                  sx: {
                    cursor: 'pointer',
                    borderRadius: '8px',
                    height: '48px',
                    backgroundColor: customMuiTheme.palette.background.paper,
                    color: customMuiTheme.palette.text.primary,
                    borderColor: customMuiTheme.palette.divider,
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: customMuiTheme.palette.primary.main,
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: customMuiTheme.palette.primary.main,
                      boxShadow: `0 0 0 2px ${customMuiTheme.palette.primary.main}40`,
                    },
                  }
                }
              },
              day: ({ selected, day, outsideCurrentMonth }) => ({
                sx: {
                  color: customMuiTheme.palette.text.primary,
                  backgroundColor: selected
                    ? customMuiTheme.palette.primary.main
                    : isDarkMode
                    ? customMuiTheme.palette.background.default
                    : customMuiTheme.palette.background.paper,
                  '&:hover': {
                    backgroundColor: selected
                      ? customMuiTheme.palette.primary.dark
                      : customMuiTheme.palette.action.hover,
                  },
                  ...(outsideCurrentMonth && {
                    color: customMuiTheme.palette.text.disabled,
                  }),
                  ...(shouldDisableDate(day) && {
                    pointerEvents: 'none',
                    color: customMuiTheme.palette.text.disabled,
                    backgroundColor: customMuiTheme.palette.action.disabledBackground,
                  }),
                  '&.Mui-selected': {
                    color: customMuiTheme.palette.primary.contrastText,
                    backgroundColor: customMuiTheme.palette.primary.main,
                    '&:hover': {
                      backgroundColor: customMuiTheme.palette.primary.dark,
                    },
                  },
                },
              }),
              toolbar: {
                sx: {
                  bgcolor: customMuiTheme.palette.background.paper,
                  color: customMuiTheme.palette.text.primary,
                  borderTop: `1px solid ${customMuiTheme.palette.divider}`,
                },
              },
              popper: {
                sx: {
                  '& .MuiPaper-root': {
                    backgroundColor: customMuiTheme.palette.background.paper,
                    color: customMuiTheme.palette.text.primary,
                    boxShadow: customMuiTheme.shadows[8],
                    border: `1px solid ${customMuiTheme.palette.divider}`,
                    borderRadius: '12px',
                  },
                  '& .MuiPickersDay-root.Mui-selected': {
                    backgroundColor: customMuiTheme.palette.primary.main,
                    color: customMuiTheme.palette.primary.contrastText,
                  },
                  '& .MuiDayCalendar-weekDayLabel': {
                    color: customMuiTheme.palette.text.secondary,
                  },
                  '& .MuiDayCalendar-header': {
                    color: customMuiTheme.palette.text.primary,
                    fontWeight: 600,
                  },
                  '& .MuiPickersArrowSwitcher-button': {
                    color: customMuiTheme.palette.primary.main,
                  },
                  '& .MuiPickersCalendarHeader-label': {
                    color: customMuiTheme.palette.text.primary,
                    fontWeight: 600,
                  },
                },
              }
            }}
            sx={{
              width: '60%',
              '& .MuiInputBase-root': {
                backgroundColor: customMuiTheme.palette.background.paper,
                color: customMuiTheme.palette.text.primary,
                border: `1px solid ${customMuiTheme.palette.divider}`,
                '&:hover': {
                  borderColor: customMuiTheme.palette.primary.main,
                },
                '&.Mui-focused': {
                  borderColor: customMuiTheme.palette.primary.main,
                  boxShadow: `0 0 0 2px ${customMuiTheme.palette.primary.main}40`,
                },
              },
            }}
          />
        )}
      </LocalizationProvider>
    </ThemeProvider>
  );
}
export default Calendar;