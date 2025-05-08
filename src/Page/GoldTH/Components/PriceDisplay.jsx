import React from 'react';
import { format } from 'date-fns';
import { formatSafeDate, getSafeDate } from '../fixTimestamps';

/**
 * Component สำหรับแสดงข้อมูลราคา (left-side display)
 * 
 * @param {Object} props
 * @param {Object} props.data - ข้อมูลล่าสุดที่ต้องการแสดง
 * @param {string} props.category - ประเภทของข้อมูล (gold_th, gold_us, usd_thb)
 */
const PriceDisplay = ({ data, category }) => {
  if (!data) return (
    <div className="text-sm p-2 bg-gray-50 border rounded-md">
      <p className="text-gray-500">No data available</p>
    </div>
  );
  
  const {
    date,
    barBuy,
    barSell,
    ornamentBuy,
    ornamentSell,
    predictedPrice,
    goldUsPrice,
    usdThbRate
  } = data;  // Format the date with time to show when it was last updated - using our helper function
  let formattedDate;
  try {
    // Use the formatSafeDate helper which handles all the validation internally
    formattedDate = formatSafeDate(date, 'dd MMM yyyy HH:mm:ss');
  } catch (e) {
    console.error("Error formatting date in PriceDisplay:", e);
    formattedDate = format(new Date(), 'dd MMM yyyy HH:mm:ss');
  }
    // Get last updated time if available - using our helper function
  const lastUpdated = data.lastUpdated ? 
    `Updated: ${formatSafeDate(data.lastUpdated, 'HH:mm:ss')}` : 
    `Updated: ${format(new Date(), 'HH:mm:ss')}`;
  
  return (
    <div className="bg-white border rounded-md p-3 shadow-sm">      <div className="mb-2">
        <span className="text-xs text-gray-500">Date</span>
        <p className="text-sm font-semibold">{formattedDate}</p>
        <p className="text-xs text-blue-500">{lastUpdated}</p>
      </div>
      
      <div className="space-y-2">
        {predictedPrice !== undefined && (
          <div className="flex justify-between">
            <span className="text-xs text-blue-600">Bar Buy (Predict)</span>
            <span className="text-sm font-medium text-blue-600">{predictedPrice.toLocaleString('th-TH', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2
            })}</span>
          </div>
        )}
          {barBuy !== undefined && (
          <div className="flex justify-between">
            <span className="text-xs text-amber-700">Bar Buy</span>
            <span className="text-sm font-medium">{barBuy.toLocaleString('th-TH', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2
            })}</span>
          </div>
        )}
          {barSell !== undefined && (
          <div className="flex justify-between">
            <span className="text-xs text-amber-900">Bar Sell</span>
            <span className="text-sm font-medium">{barSell.toLocaleString('th-TH', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2
            })}</span>
          </div>
        )}
          {ornamentBuy !== undefined && (
          <div className="flex justify-between">
            <span className="text-xs text-teal-700">Ornament Buy</span>
            <span className="text-sm font-medium">{ornamentBuy.toLocaleString('th-TH', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2
            })}</span>
          </div>
        )}
          {ornamentSell !== undefined && (
          <div className="flex justify-between">
            <span className="text-xs text-purple-700">Ornament Sell</span>
            <span className="text-sm font-medium">{ornamentSell.toLocaleString('th-TH', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2
            })}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default PriceDisplay;
