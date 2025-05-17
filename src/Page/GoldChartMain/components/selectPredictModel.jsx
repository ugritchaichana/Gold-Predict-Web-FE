import React from 'react';
import { useTranslation } from 'react-i18next';

const SelectPredictModel = ({ 
  selectedModel, 
  setSelectedModel, 
  models,
  loading = false 
}) => {
  const { t } = useTranslation();
  const modelEntries = Object.entries(models);
  return (
    <div className="relative pt-3"> {/* Container with relative positioning for the label */}
      <div className="absolute top-0 left-2 -translate-y-1/2 bg-background px-1 text-xs text-muted-foreground flex items-center gap-1">
        {t('goldChart.predictionModels.title')}
        <div className="relative inline-block group">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-muted-foreground cursor-help"
          >            <circle cx="12" cy="12" r="10" />
            <path d="M12 16v-4" />
            <path d="M12 8h.01" />
          </svg>
          <div className="absolute left-0 bottom-full mb-2 whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
            <div className="bg-popover text-popover-foreground text-xs rounded-md p-2 shadow-md border border-border">
              {t('goldChart.predictionModels.tooltip', 'Select a prediction model to view different forecasting methods for gold prices')}
            </div>
          </div>
        </div>
      </div>      <div className="flex flex-wrap items-center gap-1 p-1 rounded-md border border-border bg-background shadow-sm">
        {modelEntries.map(([modelKey, modelLabel]) => (
          <div key={modelKey} className="relative group">
            <button
              title={modelLabel}
              onClick={() => !loading && setSelectedModel(modelKey)}
              disabled={loading}
              className={`inline-flex items-center justify-center whitespace-nowrap rounded-md text-xs font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-7 px-3 py-1 flex-grow sm:flex-grow-0
                ${selectedModel === modelKey 
                  ? 'bg-primary text-primary-foreground hover:bg-primary/90' 
                  : 'bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground'}`}            >
              {t(`goldChart.predictionModels.${modelKey}`, modelLabel)}
            </button>
            <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-1 whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10 delay-300">
              <div className="bg-popover text-popover-foreground text-xs rounded-md p-2 shadow-md border border-border">
                {t(`goldChart.predictionModels.tooltip_${modelKey}`, `Model ${modelKey}: Predicts gold price`)}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SelectPredictModel;
