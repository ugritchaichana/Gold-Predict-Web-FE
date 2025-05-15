import React from 'react';
import { Button } from '@/components/ui/button';

const CHART_STYLES = {
  LINE: 'line',
  CANDLESTICK: 'candlestick'
};

const SelectStyleChart = ({ selectedCategory, selectedStyle, setSelectedStyle }) => {
  // Disable candlestick option for GOLD_TH category
  const isCandlestickDisabled = selectedCategory === 'GOLD_TH';

  return (
    <div className="flex items-center border rounded-md overflow-hidden shadow-sm">
      <Button
        type="button"
        variant={selectedStyle === CHART_STYLES.LINE ? 'default' : 'outline'}
        className={`rounded-none border-0 ${
          selectedStyle === CHART_STYLES.LINE ? 'bg-primary text-white' : 'bg-background'
        }`}
        onClick={() => setSelectedStyle(CHART_STYLES.LINE)}
      >
        Line
      </Button>
      <Button
        type="button"
        disabled={isCandlestickDisabled}
        variant={selectedStyle === CHART_STYLES.CANDLESTICK ? 'default' : 'outline'}
        className={`rounded-none border-0 ${
          selectedStyle === CHART_STYLES.CANDLESTICK ? 'bg-primary text-white' : 'bg-background'
        } ${isCandlestickDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        onClick={() => !isCandlestickDisabled && setSelectedStyle(CHART_STYLES.CANDLESTICK)}
      >
        Candlestick
      </Button>
      {isCandlestickDisabled && (
        <div className="hidden group-hover:block absolute bottom-full mb-2 bg-black text-white text-xs rounded p-1">
          Candlestick not available for GOLD TH
        </div>
      )}
    </div>
  );
};

export default SelectStyleChart;