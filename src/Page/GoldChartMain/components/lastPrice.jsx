import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { format as formatDateFns } from 'date-fns';

const LastPrice = ({ 
  loading = false, 
  price = 0, 
  priceChange = 0, 
  percentChange = 0, 
  date = new Date(), 
  currency = 'THB' 
}) => {
  return (
    <Card className="flex-1">
      <CardHeader className="pb-2">
        <CardDescription>Latest Price</CardDescription>
        <div className="flex items-center justify-between">
          <CardTitle className="text-2xl md:text-3xl">
            {loading ? (
              <Skeleton className="h-8 w-36" />
            ) : (
              `${price.toLocaleString(undefined, {maximumFractionDigits:2})} ${currency}`
            )}
          </CardTitle>
          <Badge 
            variant={priceChange > 0 ? "success" : priceChange < 0 ? "destructive" : "outline"}
            className={cn(
              "ml-2 px-2 py-1",
              loading && "invisible"
            )}
          >
            {!loading && (
              <span className="flex items-center">
                {priceChange > 0 ? '▲' : priceChange < 0 ? '▼' : '•'}
                <span className="ml-1">{percentChange.toFixed(2)}%</span>
              </span>
            )}
          </Badge>
        </div>
        <CardDescription>
          Updated: {formatDateFns(date, 'dd MMM yyyy HH:mm')}
        </CardDescription>
      </CardHeader>
    </Card>
  );
};

export default LastPrice;
