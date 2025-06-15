import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, useCallback, useEffect } from 'react';
import { logger } from '../../../utils/logger';

// Constants for cache management
const CACHE_VERSION = '1.0';
const CACHE_KEY_PREFIX = 'gold_chart_cache_';
const MAX_CACHE_SIZE_MB = 50; // 50MB limit
const CACHE_EXPIRY_HOURS = 24; // 24 hours
const MAX_ENTRIES_PER_DATASET = 10; // Max entries per dataset type

// Cache key generators
const generateCacheKey = (dataType, params) => {
  const paramString = JSON.stringify(params);
  return `${CACHE_KEY_PREFIX}${dataType}_${btoa(paramString)}`;
};

const generateQueryKey = (dataType, params) => {
  return ['chartData', dataType, params];
};

// Cache utilities
const getCacheStats = () => {
  const stats = {
    totalEntries: 0,
    totalSizeBytes: 0,
    datasets: {},
    version: CACHE_VERSION
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
              stats.datasets[dataset] = { entries: 0, sizeBytes: 0 };
            }
            stats.datasets[dataset].entries++;
            stats.datasets[dataset].sizeBytes += value.length;
          }
        }
      }
    }
  } catch (error) {
    console.warn('Error calculating cache stats:', error);
  }

  return stats;
};

const clearExpiredCache = () => {
  const now = Date.now();
  const expiredKeys = [];

  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(CACHE_KEY_PREFIX)) {
        try {
          const cached = JSON.parse(localStorage.getItem(key));
          if (cached && cached.timestamp) {
            const age = now - cached.timestamp;
            if (age > CACHE_EXPIRY_HOURS * 60 * 60 * 1000) {
              expiredKeys.push(key);
            }
          }
        } catch (error) {
          // Invalid JSON, mark for removal
          expiredKeys.push(key);
        }
      }
    }

    expiredKeys.forEach(key => {
      localStorage.removeItem(key);
    });    if (expiredKeys.length > 0) {
      logger.log(`Cleared ${expiredKeys.length} expired cache entries`);
    }
  } catch (error) {
    logger.warn('Error clearing expired cache:', error);
  }
};

const evictOldestEntries = (dataType, maxEntries = MAX_ENTRIES_PER_DATASET) => {
  const entries = [];
  
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(`${CACHE_KEY_PREFIX}${dataType}_`)) {
        try {
          const cached = JSON.parse(localStorage.getItem(key));
          if (cached && cached.timestamp) {
            entries.push({ key, timestamp: cached.timestamp });
          }
        } catch (error) {
          // Invalid entry, mark for removal
          entries.push({ key, timestamp: 0 });
        }
      }
    }

    // Sort by timestamp and remove oldest entries
    entries.sort((a, b) => a.timestamp - b.timestamp);
    
    const toRemove = Math.max(0, entries.length - maxEntries + 1);
    for (let i = 0; i < toRemove; i++) {
      localStorage.removeItem(entries[i].key);
    }    if (toRemove > 0) {
      logger.log(`Evicted ${toRemove} old cache entries for ${dataType}`);
    }
  } catch (error) {
    logger.warn('Error evicting old cache entries:', error);
  }
};

const handleQuotaExceeded = () => {
  logger.warn('localStorage quota exceeded, clearing oldest cache entries');
  
  // Get all cache entries with timestamps
  const entries = [];
  
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(CACHE_KEY_PREFIX)) {
        try {
          const cached = JSON.parse(localStorage.getItem(key));
          if (cached && cached.timestamp) {
            entries.push({ key, timestamp: cached.timestamp, size: localStorage.getItem(key).length });
          }
        } catch (error) {
          // Invalid entry, mark for removal
          entries.push({ key, timestamp: 0, size: 0 });
        }
      }
    }

    // Sort by timestamp (oldest first) and remove 25% of entries
    entries.sort((a, b) => a.timestamp - b.timestamp);
    const toRemove = Math.ceil(entries.length * 0.25);
    
    for (let i = 0; i < toRemove && i < entries.length; i++) {
      localStorage.removeItem(entries[i].key);
    }    logger.log(`Cleared ${toRemove} cache entries to free up space`);
  } catch (error) {
    logger.error('Error handling quota exceeded:', error);
    // If all else fails, clear all cache
    clearAllCache();
  }
};

const clearAllCache = () => {
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
  } catch (error) {
    logger.error('Error clearing all cache:', error);
  }
};

// Cache operations
const setCache = (key, data) => {
  try {
    const cached = {
      data,
      timestamp: Date.now(),
      version: CACHE_VERSION
    };
    
    const serialized = JSON.stringify(cached);
    localStorage.setItem(key, serialized);
    
    return true;
  } catch (error) {
    if (error.name === 'QuotaExceededError') {
      handleQuotaExceeded();
      
      // Try again after clearing space
      try {
        const cached = {
          data,
          timestamp: Date.now(),
          version: CACHE_VERSION
        };
        
        const serialized = JSON.stringify(cached);
        localStorage.setItem(key, serialized);
        return true;
      } catch (retryError) {
        console.error('Failed to cache data even after quota cleanup:', retryError);        return false;
      }
    } else {
      logger.error('Error setting cache:', error);
      return false;
    }
  }
};

const getCache = (key) => {
  try {
    const cached = localStorage.getItem(key);
    if (!cached) return null;
    
    const parsed = JSON.parse(cached);
    
    // Check version compatibility
    if (parsed.version !== CACHE_VERSION) {
      localStorage.removeItem(key);
      return null;
    }
    
    // Check expiry
    const now = Date.now();
    const age = now - parsed.timestamp;
    if (age > CACHE_EXPIRY_HOURS * 60 * 60 * 1000) {
      localStorage.removeItem(key);
      return null;
    }
      return parsed.data;
  } catch (error) {
    logger.warn('Error getting cache:', error);
    // Remove corrupted cache entry
    try {
      localStorage.removeItem(key);
    } catch (removeError) {
      logger.warn('Error removing corrupted cache:', removeError);
    }
    return null;
  }
};

// Main hook
export const useChartDataCache = (dataType, params, fetcher, options = {}) => {
  const queryClient = useQueryClient();
  const [cacheStats, setCacheStats] = useState(null);
  
  const {
    enabled = true,
    staleTime = 5 * 60 * 1000, // 5 minutes
    cacheTime = 30 * 60 * 1000, // 30 minutes
    refetchOnWindowFocus = false,
    ...queryOptions
  } = options;

  // Clean up expired cache on mount
  useEffect(() => {
    clearExpiredCache();
  }, []);

  // Update cache stats periodically
  useEffect(() => {
    const updateStats = () => {
      setCacheStats(getCacheStats());
    };
    
    updateStats();
    const interval = setInterval(updateStats, 30000); // Update every 30 seconds
    
    return () => clearInterval(interval);
  }, []);

  const cacheKey = generateCacheKey(dataType, params);
  const queryKey = generateQueryKey(dataType, params);

  const query = useQuery({
    queryKey,
    queryFn: async () => {      // Try to get from localStorage first
      const cached = getCache(cacheKey);
      if (cached) {
        logger.log(`Cache hit for ${dataType}:`, params);
        return cached;
      }

      logger.log(`Cache miss for ${dataType}, fetching:`, params);
      
      // Evict old entries before fetching new data
      evictOldestEntries(dataType);
      
      // Fetch fresh data
      const data = await fetcher(params);
        // Cache the result
      const success = setCache(cacheKey, data);
      if (!success) {
        logger.warn(`Failed to cache data for ${dataType}`);
      }
      
      return data;
    },
    enabled,
    staleTime,
    cacheTime,
    refetchOnWindowFocus,
    retry: (failureCount, error) => {
      // Don't retry on quota errors
      if (error?.name === 'QuotaExceededError') {
        return false;
      }
      return failureCount < 3;
    },
    ...queryOptions
  });

  // Cache management functions
  const clearDatasetCache = useCallback((targetDataType = dataType) => {
    try {
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(`${CACHE_KEY_PREFIX}${targetDataType}_`)) {
          keysToRemove.push(key);
        }
      }
      
      keysToRemove.forEach(key => {
        localStorage.removeItem(key);
      });
        // Also invalidate React Query cache
      queryClient.invalidateQueries(['chartData', targetDataType]);
      
      logger.log(`Cleared ${keysToRemove.length} cache entries for ${targetDataType}`);
      setCacheStats(getCacheStats());
    } catch (error) {
      logger.error('Error clearing dataset cache:', error);
    }
  }, [dataType, queryClient]);

  const prefetchData = useCallback(async (prefetchParams) => {
    const prefetchCacheKey = generateCacheKey(dataType, prefetchParams);
    const prefetchQueryKey = generateQueryKey(dataType, prefetchParams);
    
    // Check if already cached
    const cached = getCache(prefetchCacheKey);
    if (cached) {
      return cached;
    }
      // Prefetch with React Query
    return queryClient.prefetchQuery({
      queryKey: prefetchQueryKey,
      queryFn: async () => {
        logger.log(`Prefetching ${dataType}:`, prefetchParams);
        
        evictOldestEntries(dataType);
        const data = await fetcher(prefetchParams);
        setCache(prefetchCacheKey, data);
        
        return data;
      },
      staleTime,
      cacheTime
    });
  }, [dataType, fetcher, queryClient, staleTime, cacheTime]);

  return {
    ...query,
    cacheStats,
    clearDatasetCache,
    clearAllCache,
    prefetchData,
    isCacheHit: query.data && !query.isFetching && !query.isLoading
  };
};

export default useChartDataCache;
