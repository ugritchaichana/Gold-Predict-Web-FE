"use client";

import * as React from "react";
import { useEffect, useState } from "react";
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { CircularProgress, Box, TextField } from '@mui/material';
import { fetchPredictionWeekDate } from '@/services/apiService';
import dayjs from 'dayjs';
import { useTheme } from '@mui/material/styles'; // ใช้ useTheme จาก MUI

export default function Calendar({ value, onChange }) {
  const theme = useTheme(); // ดึง theme จาก MUI
  const isDarkMode = theme.palette.mode === 'dark'; // ตรวจสอบธีม

  const [availableDates, setAvailableDates] = useState([]);
  const [loading, setLoading] = useState(true);

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

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100%' }}>
          <CircularProgress />
        </Box>
      ) : (
        <DatePicker
          value={value}
          onChange={onChange}
          shouldDisableDate={shouldDisableDate}
          format="DD/MM/YYYY"
          slotProps={{
            textField: {
              fullWidth: true,
              variant: "outlined",
              placeholder: "เลือกวันที่ต้องการดูข้อมูล",
              InputProps: {
                sx: {
                  borderRadius: '8px',
                  height: '48px',
                  backgroundColor: theme.palette.background.paper,
                  color: theme.palette.text.primary,
                  borderColor: theme.palette.divider,
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: theme.palette.primary.main,
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: theme.palette.primary.main,
                    boxShadow: `0 0 0 2px ${theme.palette.primary.main}40`,
                  },
                },
                startAdornment: (
                  <Box 
                    component="span" 
                    sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      mr: 1, 
                      color: theme.palette.primary.main,
                    }}
                  >
                    {/* ไอคอนของคุณ */}
                  </Box>
                )
              }
            },
            day: ({ selected, day, outsideCurrentMonth }) => ({
              sx: {
                color: theme.palette.text.primary,
                backgroundColor: selected
                  ? theme.palette.primary.main
                  : isDarkMode
                  ? theme.palette.background.default
                  : theme.palette.background.paper,
                '&:hover': {
                  backgroundColor: selected
                    ? theme.palette.primary.dark
                    : theme.palette.action.hover,
                },
                ...(outsideCurrentMonth && {
                  color: theme.palette.text.disabled,
                }),
                ...(shouldDisableDate(day) && {
                  pointerEvents: 'none',
                  color: theme.palette.text.disabled,
                  backgroundColor: theme.palette.action.disabledBackground,
                }),
                '&.Mui-selected': {
                  color: theme.palette.primary.contrastText,
                  backgroundColor: theme.palette.primary.main,
                  '&:hover': {
                    backgroundColor: theme.palette.primary.dark,
                  },
                },
              },
            }),
            toolbar: {
              sx: {
                bgcolor: theme.palette.background.paper,
                color: theme.palette.text.primary,
                borderTop: `1px solid ${theme.palette.divider}`,
              },
            },
            popper: {
              sx: {
                '& .MuiPaper-root': {
                  backgroundColor: theme.palette.background.paper,
                  color: theme.palette.text.primary,
                  boxShadow: theme.shadows[8],
                  border: `1px solid ${theme.palette.divider}`,
                  borderRadius: '12px',
                },
                '& .MuiPickersDay-root.Mui-selected': {
                  backgroundColor: theme.palette.primary.main,
                  color: theme.palette.primary.contrastText,
                },
                '& .MuiDayCalendar-weekDayLabel': {
                  color: theme.palette.text.secondary,
                },
                '& .MuiDayCalendar-header': {
                  color: theme.palette.text.primary,
                  fontWeight: 600,
                },
                '& .MuiPickersArrowSwitcher-button': {
                  color: theme.palette.primary.main,
                },
                '& .MuiPickersCalendarHeader-label': {
                  color: theme.palette.text.primary,
                  fontWeight: 600,
                },
              },
            }
          }}
          sx={{
            width: '100%',
            '& .MuiInputBase-root': {
              backgroundColor: theme.palette.background.paper,
              color: theme.palette.text.primary,
              border: `1px solid ${theme.palette.divider}`,
              '&:hover': {
                borderColor: theme.palette.primary.main,
              },
              '&.Mui-focused': {
                borderColor: theme.palette.primary.main,
                boxShadow: `0 0 0 2px ${theme.palette.primary.main}40`,
              },
            },
          }}
        />
      )}
    </LocalizationProvider>
  );
}