import React, { useEffect, useCallback } from 'react';
import { getLegendVisibilityPreference, saveLegendVisibilityPreference } from '../utils/chartPreferences';

/**
 * A custom hook to handle loading and saving legend visibility state to localStorage
 * 
 * @param {string} category - Chart category (GOLD_TH, GOLD_US, or USD_THB)
 * @param {Array} seriesConfigs - Array of series configuration objects
 * @param {string} chartStyle - Current chart style (line or candlestick)
 * @returns {Object} with visibility state and toggle handler
 */
export const useLegendVisibility = (category, seriesConfigs, chartStyle) => {
  // Initialize visibility state from localStorage or defaults
  const initializeVisibilityState = useCallback(() => {
    const initialState = {};
    
    if (!seriesConfigs || !Array.isArray(seriesConfigs)) {
      return initialState;
    }
    
    seriesConfigs.forEach(config => {
      // Different initialization logic for candlestick mode
      if (chartStyle === 'candlestick') {
        if (config.type === 'candlestick') {
          // Always visible in candlestick mode
          initialState[config.key] = true;
        } else if (config.key.startsWith('ohlc_')) {
          initialState[config.key] = true;
        } else {
          initialState[config.key] = false;
        }
      } else {
        // Get saved preference or use default
        initialState[config.key] = getLegendVisibilityPreference(
          category, 
          config.key, 
          config.defaultVisible !== undefined ? config.defaultVisible : true
        );
      }
    });
    
    return initialState;
  }, [category, seriesConfigs, chartStyle]);
  
  // Toggle visibility and save to localStorage
  const toggleSeriesVisibility = useCallback((configKey, currentVisibilityState) => {
    const newVisibility = !currentVisibilityState[configKey];
    
    // Save to localStorage
    saveLegendVisibilityPreference(category, configKey, newVisibility);
    
    // Return new state
    return {
      ...currentVisibilityState,
      [configKey]: newVisibility
    };
  }, [category]);
  
  return {
    initializeVisibilityState,
    toggleSeriesVisibility
  };
};

export default useLegendVisibility;