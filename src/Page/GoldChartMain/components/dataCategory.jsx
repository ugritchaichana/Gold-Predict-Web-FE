import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from 'react-i18next';

const DataCategory = ({ 
  selectedCategory, 
  setSelectedCategory, 
  dataCategories, 
  loading = false, 
  hasPredictionData = false 
}) => {
  const { t } = useTranslation();
  
  return (
    <Card className="flex-1">
      <CardHeader className="pb-4">
        <div className="flex justify-between items-center">
          <CardTitle>{t('goldChart.categories.title', 'Data Category')}</CardTitle>
          {hasPredictionData && (
            <Badge variant="outline" className="bg-amber-500/10 text-amber-600 dark:text-amber-400 dark:bg-amber-950/20">
              {t('goldChart.predictionAvailable', 'Prediction data available')}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue={selectedCategory} onValueChange={setSelectedCategory} className="w-full">          <TabsList className="w-full">
            {Object.entries(dataCategories).map(([key, label]) => (
              <TabsTrigger
                key={key}
                value={key}
                className="flex-1"
                disabled={loading}
              >
                {t(`goldChart.categories.${key}`, label)}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default DataCategory;
