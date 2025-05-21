// localStorage utility functions for chart preferences

// Key constants for localStorage
const STORAGE_KEYS = {
  CHART_TYPE: 'gold-predict-chart-type',
  DATE_RANGE: 'gold-predict-date-range',
  ACTIVE_DATE_OPTION: 'gold-predict-active-date-option',
  SELECTED_MODEL: 'gold-predict-selected-model',
  LEGEND_VISIBILITY: 'gold-predict-legend-visibility',
  SELECTED_CATEGORY: 'gold-predict-selected-category',
};

/**
 * Saves chart type (line/candlestick) preference for a specific chart category
 * @param {string} category - GOLD_TH, GOLD_US or USD_THB
 * @param {string} chartType - 'line' or 'candlestick'
 */
export const saveChartTypePreference = (category, chartType) => {
  try {
    const currentPrefs = JSON.parse(localStorage.getItem(STORAGE_KEYS.CHART_TYPE) || '{}');
    currentPrefs[category] = chartType;
    localStorage.setItem(STORAGE_KEYS.CHART_TYPE, JSON.stringify(currentPrefs));
  } catch (error) {
    console.error('Error saving chart type preference:', error);
  }
};

/**
 * Gets saved chart type preference for a specific chart category
 * @param {string} category - GOLD_TH, GOLD_US or USD_THB
 * @param {string} defaultType - Default chart type if none is saved
 * @returns {string} Chart type ('line' or 'candlestick')
 */
export const getChartTypePreference = (category, defaultType = 'line') => {
  try {
    const prefs = JSON.parse(localStorage.getItem(STORAGE_KEYS.CHART_TYPE) || '{}');
    return prefs[category] || defaultType;
  } catch (error) {
    console.error('Error getting chart type preference:', error);
    return defaultType;
  }
};

/**
 * Saves the selected date range for a specific chart category
 * @param {string} category - GOLD_TH, GOLD_US or USD_THB
 * @param {Object} dateRange - { from: Date, to: Date }
 */
export const saveDateRangePreference = (category, dateRange) => {
  try {
    if (dateRange && dateRange.from instanceof Date && dateRange.to instanceof Date) {
      const serializedRange = {
        from: dateRange.from.toISOString(),
        to: dateRange.to.toISOString()
      };
      
      const currentPrefs = JSON.parse(localStorage.getItem(STORAGE_KEYS.DATE_RANGE) || '{}');
      currentPrefs[category] = serializedRange;
      localStorage.setItem(STORAGE_KEYS.DATE_RANGE, JSON.stringify(currentPrefs));
    }
  } catch (error) {
    console.error('Error saving date range preference:', error);
  }
};

/**
 * Gets saved date range preference for a specific chart category
 * @param {string} category - GOLD_TH, GOLD_US or USD_THB
 * @returns {Object|null} Date range object or null if not found
 */
export const getDateRangePreference = (category) => {
  try {
    const prefs = JSON.parse(localStorage.getItem(STORAGE_KEYS.DATE_RANGE) || '{}');
    const savedRange = prefs[category];
    
    if (savedRange && savedRange.from && savedRange.to) {
      return {
        from: new Date(savedRange.from),
        to: new Date(savedRange.to)
      };
    }
    return null;
  } catch (error) {
    console.error('Error getting date range preference:', error);
    return null;
  }
};

/**
 * Saves the active date option (preset) for a specific chart category
 * @param {string} category - GOLD_TH, GOLD_US or USD_THB
 * @param {string} option - Date range option ('7D', '1M', '3M', etc.)
 */
export const saveDateOptionPreference = (category, option) => {
  try {
    const currentPrefs = JSON.parse(localStorage.getItem(STORAGE_KEYS.ACTIVE_DATE_OPTION) || '{}');
    currentPrefs[category] = option;
    localStorage.setItem(STORAGE_KEYS.ACTIVE_DATE_OPTION, JSON.stringify(currentPrefs));
  } catch (error) {
    console.error('Error saving date option preference:', error);
  }
};

/**
 * Gets saved date option preference for a specific chart category
 * @param {string} category - GOLD_TH, GOLD_US or USD_THB
 * @param {string} defaultOption - Default option if none is saved
 * @returns {string} Date option
 */
export const getDateOptionPreference = (category, defaultOption = 'MAX') => {
  try {
    const prefs = JSON.parse(localStorage.getItem(STORAGE_KEYS.ACTIVE_DATE_OPTION) || '{}');
    return prefs[category] || defaultOption;
  } catch (error) {
    console.error('Error getting date option preference:', error);
    return defaultOption;
  }
};

/**
 * Saves the selected prediction model for GOLD_TH
 * @param {string} model - Model ID ('1', '2', '3', etc.)
 */
export const saveSelectedModelPreference = (model) => {
  try {
    localStorage.setItem(STORAGE_KEYS.SELECTED_MODEL, model);
  } catch (error) {
    console.error('Error saving selected model preference:', error);
  }
};

/**
 * Gets saved prediction model preference
 * @param {string} defaultModel - Default model if none is saved
 * @returns {string} Model ID
 */
export const getSelectedModelPreference = (defaultModel = '7') => {
  try {
    return localStorage.getItem(STORAGE_KEYS.SELECTED_MODEL) || defaultModel;
  } catch (error) {
    console.error('Error getting selected model preference:', error);
    return defaultModel;
  }
};

/**
 * Saves legend visibility state for a specific chart category and series
 * @param {string} category - GOLD_TH, GOLD_US or USD_THB
 * @param {string} seriesKey - Series key (e.g., 'barBuyData', 'ohlc')
 * @param {boolean} isVisible - Visibility state
 */
export const saveLegendVisibilityPreference = (category, seriesKey, isVisible) => {
  try {
    const currentPrefs = JSON.parse(localStorage.getItem(STORAGE_KEYS.LEGEND_VISIBILITY) || '{}');
    if (!currentPrefs[category]) {
      currentPrefs[category] = {};
    }
    currentPrefs[category][seriesKey] = isVisible;
    localStorage.setItem(STORAGE_KEYS.LEGEND_VISIBILITY, JSON.stringify(currentPrefs));
  } catch (error) {
    console.error('Error saving legend visibility preference:', error);
  }
};

/**
 * Gets saved legend visibility preference for a specific chart category and series
 * @param {string} category - GOLD_TH, GOLD_US or USD_THB
 * @param {string} seriesKey - Series key (e.g., 'barBuyData', 'ohlc')
 * @param {boolean} defaultVisibility - Default visibility if not saved
 * @returns {boolean} Visibility state
 */
export const getLegendVisibilityPreference = (category, seriesKey, defaultVisibility = true) => {
  try {
    const prefs = JSON.parse(localStorage.getItem(STORAGE_KEYS.LEGEND_VISIBILITY) || '{}');
    return prefs[category]?.[seriesKey] !== undefined ? prefs[category][seriesKey] : defaultVisibility;
  } catch (error) {
    console.error('Error getting legend visibility preference:', error);
    return defaultVisibility;
  }
};

/**
 * Saves the selected chart category
 * @param {string} category - GOLD_TH, GOLD_US, USD_THB, SELECT_PREDICTION, or MONTHLY_PREDICTION
 */
export const saveSelectedCategoryPreference = (category) => {
  try {
    localStorage.setItem(STORAGE_KEYS.SELECTED_CATEGORY, category);
  } catch (error) {
    console.error('Error saving selected category preference:', error);
  }
};

/**
 * Gets saved selected chart category
 * @param {string} defaultCategory - Default category if none is saved
 * @returns {string} Category
 */
export const getSelectedCategoryPreference = (defaultCategory = 'GOLD_TH') => {
  try {
    return localStorage.getItem(STORAGE_KEYS.SELECTED_CATEGORY) || defaultCategory;
  } catch (error) {
    console.error('Error getting selected category preference:', error);
    return defaultCategory;
  }
};
