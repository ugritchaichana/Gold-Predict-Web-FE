import React from 'react';
import { useTranslation } from 'react-i18next';

const CHART_STYLES = {
  LINE: 'line',
  CANDLESTICK: 'candlestick'
};

const SelectStyleChart = ({ selectedCategory, selectedStyle, setSelectedStyle, loading = false }) => {
  const { t } = useTranslation();
  
  // Disable candlestick option for GOLD_TH category
  const isCandlestickDisabled = selectedCategory === 'GOLD_TH';
  
  const chartStyles = [
    { key: CHART_STYLES.LINE, label: t('goldChart.chartTypes.line') },
    { 
      key: CHART_STYLES.CANDLESTICK, 
      label: t('goldChart.chartTypes.candlestick'), 
      disabled: isCandlestickDisabled 
    }
  ];

  return (
    <div className="relative pt-3"> {/* Container with relative positioning for the label */}
      <div className="absolute top-0 left-2 -translate-y-1/2 bg-background px-1 text-xs text-muted-foreground">
        {t('goldChart.chartTypes.title')}
      </div>
      <div className="flex flex-wrap items-center gap-1 p-1 rounded-md border border-border bg-background shadow-sm">
        {chartStyles.map(({ key, label, disabled = false }) => (
          <button
            key={key}
            title={disabled ? `${label} - ${t('goldChart.chartTypes.notAvailable')} ${selectedCategory}` : label}
            onClick={() => !loading && !disabled && setSelectedStyle(key)}
            disabled={loading || disabled}
            className={`inline-flex items-center justify-center whitespace-nowrap rounded-md text-xs font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-7 px-3 py-1 flex-grow sm:flex-grow-0
              ${selectedStyle === key 
                ? 'bg-primary text-primary-foreground hover:bg-primary/90' 
                : 'bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground'}`}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default SelectStyleChart;