import React from 'react';
import { format } from 'date-fns';

/**
 * Component สำหรับแสดงข้อมูลราคาทอง (left-side display)
 * 
 * @param {Object} props
 * @param {Object} props.data - ข้อมูลทองล่าสุดที่ต้องการแสดง
 */
const PriceDisplay = ({ data }) => {
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
    predictedPrice
  } = data;
  
  const formattedDate = date ? format(new Date(date), 'dd MMM yyyy') : 'N/A';
  
  return (
    <div className="bg-white border rounded-md p-3 shadow-sm">
      <div className="mb-2">
        <span className="text-xs text-gray-500">Date</span>
        <p className="text-sm font-semibold">{formattedDate}</p>
      </div>
      
      <div className="space-y-2">
        {predictedPrice !== undefined && (
          <div className="flex justify-between">
            <span className="text-xs text-blue-600">BP (Predict)</span>
            <span className="text-sm font-medium text-blue-600">{predictedPrice.toLocaleString('th-TH', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2
            })}</span>
          </div>
        )}
        
        {barBuy !== undefined && (
          <div className="flex justify-between">
            <span className="text-xs text-amber-700">BB (Bar Buy)</span>
            <span className="text-sm font-medium">{barBuy.toLocaleString('th-TH', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2
            })}</span>
          </div>
        )}
        
        {barSell !== undefined && (
          <div className="flex justify-between">
            <span className="text-xs text-amber-900">BS (Bar Sell)</span>
            <span className="text-sm font-medium">{barSell.toLocaleString('th-TH', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2
            })}</span>
          </div>
        )}
        
        {ornamentBuy !== undefined && (
          <div className="flex justify-between">
            <span className="text-xs text-teal-700">OB (Ornament Buy)</span>
            <span className="text-sm font-medium">{ornamentBuy.toLocaleString('th-TH', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2
            })}</span>
          </div>
        )}
        
        {ornamentSell !== undefined && (
          <div className="flex justify-between">
            <span className="text-xs text-purple-700">OS (Ornament Sell)</span>
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
