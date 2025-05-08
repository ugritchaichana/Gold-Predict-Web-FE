import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const SelectPredictModel = ({ 
  selectedModel, 
  setSelectedModel, 
  models, 
  loading = false 
}) => {
  return (
    <Card className="relative">
      <div className="absolute top-0 left-4 px-2 bg-background text-xs font-medium -translate-y-1/2">
        Select Prediction Model
      </div>
      <CardContent className="pt-4 p-4">
        <Select
          value={selectedModel}
          onValueChange={setSelectedModel}
          disabled={loading}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue/>
          </SelectTrigger>
          <SelectContent className="w-[160px]">
            {Object.entries(models).map(([key, label]) => (
              <SelectItem key={key} value={key}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardContent>
    </Card>
  );
};

export default SelectPredictModel;
