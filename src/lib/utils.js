import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Combines multiple class names using clsx and ensures tailwind classes are properly merged.
 * @param {...any} inputs - Class names to be combined.
 * @returns {string} - The combined class string.
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

/**
 * Formats a currency value to a locale string.
 * @param {number|string} value - The value to format.
 * @param {string} currency - The currency code.
 * @param {string} locale - The locale for formatting.
 * @returns {string} - The formatted currency string.
 */
export function formatCurrency(value, currency = 'THB', locale = undefined) {
  if (value === undefined || value === null) return '-';
  
  try {
    // Convert value to number
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    
    // Use the current locale if available, otherwise fallback to 'en-US' or the provided locale
    const currentLocale = locale || (window.i18n?.language === 'th' ? 'th-TH' : 'en-US');
    
    // Format the number only (without currency symbol)
    const formattedNumber = new Intl.NumberFormat(currentLocale, { 
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(numValue);
    
    // Add the appropriate currency text after the number
    const isThai = currentLocale.startsWith('th');
    const currencyText = isThai ? 'บาท' : currency;
    
    return `${formattedNumber} ${currencyText}`;
  } catch (err) {
    console.error('Error formatting currency:', err);
    return '-';
  }
}

/**
 * Formats a date to a locale string.
 * @param {Date|string} date - The date to format.
 * @param {string} locale - The locale for formatting.
 * @returns {string} - The formatted date string.
 */
export function formatDate(date, locale = 'en-US') {
  if (!date) return '-';
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString(locale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch (err) {
    console.error('Error formatting date:', err);
    return '-';
  }
}

/**
 * Calculates the percentage change between two values.
 * @param {number} current - The current value.
 * @param {number} previous - The previous value.
 * @returns {number} - The percentage change.
 */
export function calculatePercentageChange(current, previous) {
  if (!previous || previous === 0) return 0;
  return ((current - previous) / Math.abs(previous)) * 100;
}

/**
 * Formats a percentage value.
 * @param {number} value - The percentage value.
 * @param {number} decimals - The number of decimal places.
 * @returns {string} - The formatted percentage string.
 */
export function formatPercentage(value, decimals = 2) {
  if (value === undefined || value === null) return '-';
  return `${value >= 0 ? '+' : ''}${value.toFixed(decimals)}%`;
} 