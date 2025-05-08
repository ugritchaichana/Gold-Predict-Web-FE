import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const DateRange = ({ 
  timeframe, 
  setTimeframe, 
  timeFrames, 
  loading = false 
}) => {
  return (
    <Card className="relative">
      <div className="absolute top-0 left-4 px-2 bg-background text-xs font-medium -translate-y-1/2">
        Date Range
      </div>
      <CardContent className="pt-4 p-4 flex items-center gap-2">
        {Object.entries(timeFrames).map(([key, label]) => (
          <Button
            key={key}
            variant={timeframe === key ? "default" : "outline"}
            size="sm"
            onClick={() => setTimeframe(key)}
            disabled={loading}
          >
            {label}
          </Button>
        ))}
      </CardContent>
    </Card>
  );
};

export default DateRange;
