import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { logger } from '../../../utils/logger';

// Cache statistics utilities
const getCacheStats = () => {
  const CACHE_KEY_PREFIX = 'gold_chart_cache_';
  const stats = {
    totalEntries: 0,
    totalSizeBytes: 0,
    totalSizeMB: 0,
    datasets: {},
    version: '1.0'
  };

  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(CACHE_KEY_PREFIX)) {
        const value = localStorage.getItem(key);
        if (value) {
          stats.totalEntries++;
          stats.totalSizeBytes += value.length;
          
          // Extract dataset type from key
          const datasetMatch = key.match(/gold_chart_cache_([^_]+)_/);
          if (datasetMatch) {
            const dataset = datasetMatch[1];
            if (!stats.datasets[dataset]) {
              stats.datasets[dataset] = { entries: 0, sizeBytes: 0, sizeMB: 0 };
            }
            stats.datasets[dataset].entries++;
            stats.datasets[dataset].sizeBytes += value.length;
            stats.datasets[dataset].sizeMB = (stats.datasets[dataset].sizeBytes / (1024 * 1024)).toFixed(2);
          }
        }
      }
    }    stats.totalSizeMB = (stats.totalSizeBytes / (1024 * 1024)).toFixed(2);
  } catch (error) {
    logger.warn('Error calculating cache stats:', error);
  }

  return stats;
};

const clearAllCache = () => {
  const CACHE_KEY_PREFIX = 'gold_chart_cache_';
  const keysToRemove = [];
  
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(CACHE_KEY_PREFIX)) {
        keysToRemove.push(key);
      }
    }

    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
    });    logger.log(`Cleared all ${keysToRemove.length} cache entries`);
    return keysToRemove.length;
  } catch (error) {
    logger.error('Error clearing all cache:', error);
    return 0;
  }
};

const clearDatasetCache = (dataType) => {
  const CACHE_KEY_PREFIX = 'gold_chart_cache_';
  const keysToRemove = [];
  
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(`${CACHE_KEY_PREFIX}${dataType}_`)) {
        keysToRemove.push(key);
      }
    }
    
    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
    });
      logger.log(`Cleared ${keysToRemove.length} cache entries for ${dataType}`);
    return keysToRemove.length;
  } catch (error) {
    logger.error('Error clearing dataset cache:', error);
    return 0;
  }
};

const CacheStatus = ({ className = '' }) => {
  const [stats, setStats] = useState(null);
  const [isVisible, setIsVisible] = useState(false);

  const updateStats = () => {
    setStats(getCacheStats());
  };

  useEffect(() => {
    updateStats();
    const interval = setInterval(updateStats, 5000); // Update every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const handleClearAll = () => {
    const cleared = clearAllCache();
    updateStats();
    alert(`Cleared ${cleared} cache entries`);
  };

  const handleClearDataset = (dataType) => {
    const cleared = clearDatasetCache(dataType);
    updateStats();
    alert(`Cleared ${cleared} cache entries for ${dataType}`);
  };

  if (!isVisible) {
    return (
      <div className={`fixed bottom-4 right-4 z-50 ${className}`}>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsVisible(true)}
          className="shadow-lg"
        >
          Cache Status
        </Button>
      </div>
    );
  }

  return (
    <div className={`fixed bottom-4 right-4 z-50 w-80 ${className}`}>
      <Card className="shadow-lg">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">Cache Status</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsVisible(false)}
              className="h-6 w-6 p-0"
            >
              ×
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {stats && (
            <>
              <div className="text-xs space-y-1">
                <div className="flex justify-between">
                  <span>Total Entries:</span>
                  <Badge variant="secondary">{stats.totalEntries}</Badge>
                </div>
                <div className="flex justify-between">
                  <span>Total Size:</span>
                  <Badge variant="secondary">{stats.totalSizeMB} MB</Badge>
                </div>
              </div>

              {Object.keys(stats.datasets).length > 0 && (
                <div className="space-y-2">
                  <div className="text-xs font-medium">Datasets:</div>
                  {Object.entries(stats.datasets).map(([dataset, data]) => (
                    <div key={dataset} className="text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{dataset}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleClearDataset(dataset)}
                          className="h-5 px-2 text-xs"
                        >
                          Clear
                        </Button>
                      </div>
                      <div className="flex justify-between text-gray-500">
                        <span>{data.entries} entries</span>
                        <span>{data.sizeMB} MB</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={updateStats}
                  className="flex-1 text-xs"
                >
                  Refresh
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleClearAll}
                  className="flex-1 text-xs"
                >
                  Clear All
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CacheStatus;
