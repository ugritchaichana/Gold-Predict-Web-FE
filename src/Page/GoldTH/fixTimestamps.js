/**
 * Helper functions for handling timestamps and date formatting in the Gold Chart application
 * Enhanced to support various formats and ensure data integrity
 */

import { format, parseISO, isValid as isValidDateFns } from 'date-fns';

/**
 * Safely converts a timestamp or date string to a valid Date object
 * Handles various formats and ensures we don't get invalid dates like 1970
 * 
 * @param {number|string|Date} dateInput - The date input to process
 * @returns {Date} - A valid Date object or current date if input is invalid
 */
export const getSafeDate = (dateInput) => {
  try {
    // Handle null or undefined
    if (dateInput === null || dateInput === undefined) {
      return new Date();
    }
    
    // Handle Date object
    if (dateInput instanceof Date) {
      return isValidDate(dateInput) ? dateInput : new Date();
    }
    
    // Handle number (timestamp)
    if (typeof dateInput === 'number') {
      // Check for invalid timestamps (too small or negative - often causes 1970 dates)
      if (dateInput < 10000) {
        console.warn(`Invalid timestamp detected: ${dateInput}, using current time instead`);
        return new Date();
      }
      
      // Check if timestamp is in seconds (10 digits) or milliseconds (13 digits)
      const timestamp = dateInput.toString().length <= 10 ? dateInput * 1000 : dateInput;
      const dateObj = new Date(timestamp);
      
      // Validate the date object - check if it's reasonable (between 2000-2050)
      if (isValidDate(dateObj) && dateObj.getFullYear() >= 2000 && dateObj.getFullYear() <= 2050) {
        return dateObj;
      } else {
        console.warn(`Invalid date from timestamp: ${dateInput}, using current time instead`);
        return new Date();
      }
    } 
    
    // Handle string
    if (typeof dateInput === 'string') {
      // Try parsing as ISO date first
      try {
        const isoParsed = parseISO(dateInput);
        if (isValidDate(isoParsed) && isoParsed.getFullYear() >= 2000) {
          return isoParsed;
        }
      } catch (e) {
        // Continue with other methods if ISO parsing fails
      }
      
      // Try as native Date
      const dateObj = new Date(dateInput);
      if (isValidDate(dateObj) && dateObj.getFullYear() >= 2000) {
        return dateObj;
      }
      
      // Check for DD-MM-YY format
      const ddmmyyRegex = /^(\d{1,2})-(\d{1,2})-(\d{2})$/;
      if (ddmmyyRegex.test(dateInput)) {
        const parts = dateInput.split('-');
        const dateStr = `20${parts[2]}-${parts[1]}-${parts[0]}`;
        try {
          const parsedDate = parseISO(dateStr);
          if (isValidDate(parsedDate)) {
            return parsedDate;
          }
        } catch (e) {
          // Continue if this format fails
        }
      }
      
      // Check for DD-MM-YYYY format
      const ddmmyyyyRegex = /^(\d{1,2})-(\d{1,2})-(\d{4})$/;
      if (ddmmyyyyRegex.test(dateInput)) {
        const parts = dateInput.split('-');
        const dateStr = `${parts[2]}-${parts[1]}-${parts[0]}`;
        try {
          const parsedDate = parseISO(dateStr);
          if (isValidDate(parsedDate)) {
            return parsedDate;
          }
        } catch (e) {
          // Continue if this format fails
        }
      }
      
      // Try to parse Unix timestamp from string
      const parsedTimestamp = parseInt(dateInput, 10);
      if (!isNaN(parsedTimestamp)) {
        return getSafeDate(parsedTimestamp); // Recursive call to handle as number
      }
    }
    
    // Default fallback
    return new Date();
  } catch (e) {
    console.error("Error in getSafeDate:", e);
    return new Date();
  }
};

/**
 * Validates if a date object is valid
 * 
 * @param {Date} date - The date to validate
 * @returns {boolean} - Whether the date is valid
 */
export const isValidDate = (date) => {
  return date instanceof Date && !isNaN(date.getTime());
};

/**
 * Safely process a timestamp value for use in Lightweight Charts
 * Ensures the timestamp is in seconds, as required by the chart library
 * 
 * @param {number|string|Date} timestamp - The timestamp or date to process
 * @returns {number} - A timestamp in seconds for the chart
 */
export const getChartTimestamp = (timestamp) => {
  try {
    // Get a safe date object
    const date = getSafeDate(timestamp);
    
    // Convert to seconds for Lightweight Charts (which expects UNIX timestamp in seconds)
    return Math.floor(date.getTime() / 1000);
  } catch (e) {
    console.error("Error in getChartTimestamp:", e);
    return Math.floor(new Date().getTime() / 1000);
  }
};

/**
 * Format a date or timestamp for display in the UI
 * 
 * @param {Date|number|string} date - Date to format
 * @param {string} formatString - Optional format string (defaults to 'dd-MM-yyyy HH:mm')
 * @returns {string} - Formatted date string
 */
export const formatSafeDate = (date, formatString = 'dd-MM-yyyy HH:mm') => {
  try {
    const safeDate = getSafeDate(date);
    return format(safeDate, formatString);
  } catch (e) {
    console.error("Error formatting date:", e);
    return format(new Date(), formatString);
  }
};
