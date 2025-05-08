import React from 'react';

const SelectPredictModel = ({ 
  selectedModel, 
  setSelectedModel, 
  models,
  loading = false 
}) => {
  const modelEntries = Object.entries(models);

  return (
    <div className="relative pt-3"> {/* Container with relative positioning for the label */}
      <div className="absolute top-0 left-2 -translate-y-1/2 bg-background px-1 text-xs text-muted-foreground">
        Prediction Models
      </div>
      <div className="flex flex-wrap items-center gap-1 p-1 rounded-md border border-border bg-background shadow-sm"> {/* Changed border to border-border */}
        {modelEntries.map(([modelKey, modelLabel]) => (
          <button
            key={modelKey}
            title={modelLabel}
            onClick={() => !loading && setSelectedModel(modelKey)}
            disabled={loading}
            className={`inline-flex items-center justify-center whitespace-nowrap rounded-md text-xs font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-7 px-3 py-1 flex-grow sm:flex-grow-0
              ${selectedModel === modelKey 
                ? 'bg-primary text-primary-foreground hover:bg-primary/90' 
                : 'bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground'}`}
          >
            {modelLabel}
          </button>
        ))}
      </div>
    </div>
  );
};

export default SelectPredictModel;
