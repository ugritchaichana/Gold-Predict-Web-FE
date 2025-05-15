import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { format as formatDateFns } from 'date-fns';

const formatPrice = (price, showDecimals = false) => {
  if (price === null || price === undefined || isNaN(price)) {
    return '0';
  }
  
  const formattedPrice = price.toLocaleString(undefined, {
    minimumFractionDigits: showDecimals ? 2 : 0,
    maximumFractionDigits: 2
  });
  
  const hasDecimal = formattedPrice.includes('.') || formattedPrice.includes(',');
  const decimalSeparator = formattedPrice.includes('.') ? '.' : ',';
  
  if (hasDecimal) {
    const parts = formattedPrice.split(decimalSeparator);
    const decimalPart = parts[1];
    
    if (decimalPart === '00') {
      return parts[0];
    }
  }
  
  return formattedPrice;
};

const LastPrice = ({ 
  loading = false, 
  price = 0, 
  priceChange = 0, 
  percentChange = 0, 
  date = new Date(), 
  currency = 'THB',
  showDecimals = false
}) => {
  const isLoading = loading || price === null || price === 0;
  // console.log(`LastPrice component - isLoading: ${isLoading}, price: ${price}, priceChange: ${priceChange}, percentChange: ${percentChange}, date: ${date}, currency: ${currency}`);
  
  const isPriceUp = percentChange > 0;
  const isPriceDown = percentChange < 0;
  const priceDirection = isPriceUp ? '▲' : isPriceDown ? '▼' : '•';
  const badgeVariant = isPriceUp ? "success" : isPriceDown ? "destructive" : "outline";
  
  return (
    <Card className="flex-1">
      <CardHeader className="pb-2">
        <CardDescription>Latest Price</CardDescription>
        <div className="flex items-center justify-between">
          <CardTitle className="text-2xl md:text-3xl">
            {isLoading ? (
              <div className="flex flex-col gap-2">
                <Skeleton className="h-8 w-36 rounded-md" />
                <Skeleton className="h-6 w-24 rounded-md" />
              </div>            ) : (
              `${formatPrice(price, showDecimals)} ${currency}`
            )}
          </CardTitle>
          {isLoading ? (
            <Skeleton className="h-6 w-16 rounded-full" />
          ) : (
            <Badge 
              variant={badgeVariant}
              className="ml-2 px-2 py-1"
            >
              <span className="flex items-center">
                {priceDirection}
                <span className="ml-1">{percentChange !== null ? percentChange.toFixed(2) : '0.00'}%</span>
              </span>
            </Badge>
          )}
        </div>
        <div className="text-sm text-muted-foreground">
          {isLoading ? (
            <div className="flex gap-2 items-center">
              <Skeleton className="h-4 w-24 rounded-md" />
              <Skeleton className="h-4 w-16 rounded-md" />
            </div>
          ) : (
            `Updated: ${formatDateFns(date, 'dd MMM yyyy')}`
          )}
        </div>
      </CardHeader>
    </Card>
  );
};

export default LastPrice;
