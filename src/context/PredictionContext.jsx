import React, { createContext, useContext, useState } from 'react';

export const PredictionContext = createContext();

export const PredictionProvider = ({ children }) => {
  const [predictionErrorStats, setPredictionErrorStats] = useState({
    average: 0,
    high: 0,
    low: 0,
    date: new Date()
  });

  return (
    <PredictionContext.Provider value={{ predictionErrorStats, setPredictionErrorStats }}>
      {children}
    </PredictionContext.Provider>
  );
};

export const usePredictionContext = () => useContext(PredictionContext);
