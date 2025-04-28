"use client";

import * as React from "react";
import { useEffect, useState, useRef } from "react";
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { Box } from '@mui/material';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import { useTheme as useMuiTheme, createTheme, ThemeProvider } from '@mui/material/styles';
import { useTheme } from '@/components/theme-provider';

// เพิ่ม plugin สำหรับการจัดรูปแบบวันที่
dayjs.extend(customParseFormat);

function CalendarApiPage({ value, onChange, disabled = false, label = "" }) {
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
  const [open, setOpen] = useState(false);

  // แปลงค่าวันที่ให้อยู่ในรูปแบบที่ถูกต้อง
  const formatValue = value ? dayjs(value) : null;  return (
    <ThemeProvider theme={customMuiTheme}>
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <Box sx={{ position: 'relative' }}>
          <DatePicker
            label={label}
            ref={datePickerRef}
            value={formatValue}
            open={open}
            onOpen={() => setOpen(true)}
            onClose={() => setOpen(false)}            onChange={(newDate) => {
              const dateObj = newDate ? newDate.toDate() : null;
              onChange(dateObj);
              // Log the exact moment value is changed
              if (dateObj) {
                console.log('Date changed in calendar component:', dateObj);
              }
              setOpen(false);
            }}
            format="DD-MM-YYYY"
            disabled={disabled}
            slotProps={{
              textField: {
                size: "small",
                fullWidth: true,
                onClick: () => setOpen(true),
                sx: {
                  '.MuiInputBase-root': {
                    fontSize: '0.875rem',
                    borderRadius: '8px',
                    height: '36px',
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
                  color: isDarkMode 
                    ? selected ? '#09090b' : '#ffffff'
                    : selected ? '#ffffff' : '#09090b',
                  backgroundColor: selected
                    ? customMuiTheme.palette.primary.main
                    : 'transparent',
                  '&:hover': {
                    backgroundColor: selected 
                      ? customMuiTheme.palette.primary.main 
                      : isDarkMode 
                        ? 'rgba(255, 255, 255, 0.1)'
                        : 'rgba(0, 0, 0, 0.05)',
                  }
                }
              }),
              popper: {
                sx: {
                  zIndex: 1300,
                  '& .MuiPickersCalendarHeader-label': {
                    color: customMuiTheme.palette.text.primary,
                  },
                  '& .MuiDayCalendar-weekDayLabel': {
                    color: customMuiTheme.palette.text.secondary,
                  },
                  '& .MuiPickersDay-dayOutsideMonth': {
                    color: customMuiTheme.palette.text.disabled,
                  },
                  '& .MuiPickersCalendarHeader-switchViewButton': {
                    color: customMuiTheme.palette.text.primary,
                  },
                  '& .MuiPickersArrowSwitcher-button': {
                    color: customMuiTheme.palette.text.primary,
                  },
                  '& .MuiPaper-root': {
                    backgroundColor: customMuiTheme.palette.background.paper,
                    backgroundImage: 'none',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                    borderRadius: '12px',
                    border: `1px solid ${customMuiTheme.palette.divider}`,
                  }
                }
              },
              actionBar: {
                sx: {
                  '& .MuiButtonBase-root': {
                    color: customMuiTheme.palette.primary.main,
                  }
                }
              },
              field: {
                sx: {
                  '& .MuiOutlinedInput-root': {
                    borderColor: customMuiTheme.palette.divider,
                    '&:hover': {
                      borderColor: customMuiTheme.palette.primary.main,
                    },
                    '&.Mui-focused': {
                      borderColor: customMuiTheme.palette.primary.main,
                      boxShadow: `0 0 0 2px ${customMuiTheme.palette.primary.main}40`,
                    },
                  },
                }
              }
            }}
          />
        </Box>
      </LocalizationProvider>
    </ThemeProvider>
  );
}

export default CalendarApiPage;
