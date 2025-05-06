import React from 'react';
import * as Checkbox from '@radix-ui/react-checkbox';
import '../tradingview-style.css';

/**
 * Component สำหรับเลือกข้อมูลที่ต้องการแสดงบนกราฟ (TradingView Style)
 * 
 * @param {Object} props
 * @param {Object} props.selections - สถานะการเลือกของแต่ละชุดข้อมูล
 * @param {Function} props.onToggle - function ที่จะเรียกเมื่อมีการเปลี่ยนแปลงการเลือก
 */
const Selector = ({ selections, onToggle }) => {
  // Define colors for each series to match the chart
  const seriesColors = {
    prediction: '#2962FF', // TradingView blue
    barBuy: '#D4AF37',     // Gold color
    barSell: '#8B4513',    // Brown
    ornamentBuy: '#00796B', // Teal
    ornamentSell: '#6A1B9A', // Purple
    priceChange: '#4CAF50', // Green
  };
  
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-2">      <div className={`flex items-center gap-2 p-2 rounded tv-animate-hover ${selections.prediction ? 'bg-gray-100' : ''} cursor-pointer`} onClick={() => onToggle('prediction')}>
        <div className="flex items-center justify-center">
          <span className="block w-3 h-3 rounded-full mr-2" style={{ backgroundColor: seriesColors.prediction }}></span>
          <Checkbox.Root
            className="flex h-5 w-5 appearance-none items-center justify-center rounded bg-white border border-gray-300 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-200 cursor-pointer"
            checked={selections.prediction}
            onCheckedChange={() => onToggle('prediction')}
            id="prediction"
          >
            <Checkbox.Indicator className="text-blue-600">
              <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M11.4669 3.72684C11.7558 3.91574 11.8369 4.30308 11.648 4.59198L7.39799 11.092C7.29783 11.2452 7.13556 11.3467 6.95402 11.3699C6.77247 11.3931 6.58989 11.3355 6.45446 11.2124L3.70446 8.71241C3.44905 8.48022 3.43023 8.08494 3.66242 7.82953C3.89461 7.57412 4.28989 7.55529 4.5453 7.78749L6.75292 9.79441L10.6018 3.90792C10.7907 3.61902 11.178 3.53795 11.4669 3.72684Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path>
              </svg>
            </Checkbox.Indicator>
          </Checkbox.Root>
        </div>
        <label className="text-sm font-medium text-gray-700 select-none cursor-pointer" htmlFor="prediction">
          Predict (BP)
        </label>
      </div>      <div className={`flex items-center gap-2 p-2 rounded tv-animate-hover ${selections.barBuy ? 'bg-gray-100' : ''} cursor-pointer`} onClick={() => onToggle('barBuy')}>
        <div className="flex items-center justify-center">
          <span className="block w-3 h-3 rounded-full mr-2" style={{ backgroundColor: seriesColors.barBuy }}></span>
          <Checkbox.Root
            className="flex h-5 w-5 appearance-none items-center justify-center rounded bg-white border border-gray-300 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-amber-200 cursor-pointer"
            checked={selections.barBuy}
            onCheckedChange={() => onToggle('barBuy')}
            id="barBuy"
          >
            <Checkbox.Indicator style={{ color: seriesColors.barBuy }}>
              <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M11.4669 3.72684C11.7558 3.91574 11.8369 4.30308 11.648 4.59198L7.39799 11.092C7.29783 11.2452 7.13556 11.3467 6.95402 11.3699C6.77247 11.3931 6.58989 11.3355 6.45446 11.2124L3.70446 8.71241C3.44905 8.48022 3.43023 8.08494 3.66242 7.82953C3.89461 7.57412 4.28989 7.55529 4.5453 7.78749L6.75292 9.79441L10.6018 3.90792C10.7907 3.61902 11.178 3.53795 11.4669 3.72684Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path>
              </svg>
            </Checkbox.Indicator>
          </Checkbox.Root>
        </div>
        <label className="text-sm font-medium text-gray-700 select-none cursor-pointer" htmlFor="barBuy">
          Bar Buy (BB)
        </label>
      </div>

      <div className={`flex items-center gap-2 p-2 rounded tv-animate-hover ${selections.barSell ? 'bg-gray-100' : ''} cursor-pointer`} onClick={() => onToggle('barSell')}>
        <div className="flex items-center justify-center">
          <span className="block w-3 h-3 rounded-full mr-2" style={{ backgroundColor: seriesColors.barSell }}></span>
          <Checkbox.Root
            className="flex h-5 w-5 appearance-none items-center justify-center rounded bg-white border border-gray-300 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-amber-200 cursor-pointer"
            checked={selections.barSell}
            onCheckedChange={() => onToggle('barSell')}
            id="barSell"
          >
            <Checkbox.Indicator style={{ color: seriesColors.barSell }}>
              <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M11.4669 3.72684C11.7558 3.91574 11.8369 4.30308 11.648 4.59198L7.39799 11.092C7.29783 11.2452 7.13556 11.3467 6.95402 11.3699C6.77247 11.3931 6.58989 11.3355 6.45446 11.2124L3.70446 8.71241C3.44905 8.48022 3.43023 8.08494 3.66242 7.82953C3.89461 7.57412 4.28989 7.55529 4.5453 7.78749L6.75292 9.79441L10.6018 3.90792C10.7907 3.61902 11.178 3.53795 11.4669 3.72684Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path>
              </svg>
            </Checkbox.Indicator>
          </Checkbox.Root>
        </div>
        <label className="text-sm font-medium text-gray-700 select-none cursor-pointer" htmlFor="barSell">
          Bar Sell (BS)
        </label>
      </div>

      <div className={`flex items-center gap-2 p-2 rounded tv-animate-hover ${selections.ornamentBuy ? 'bg-gray-100' : ''} cursor-pointer`} onClick={() => onToggle('ornamentBuy')}>
        <div className="flex items-center justify-center">
          <span className="block w-3 h-3 rounded-full mr-2" style={{ backgroundColor: seriesColors.ornamentBuy }}></span>
          <Checkbox.Root
            className="flex h-5 w-5 appearance-none items-center justify-center rounded bg-white border border-gray-300 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-teal-200 cursor-pointer"
            checked={selections.ornamentBuy}
            onCheckedChange={() => onToggle('ornamentBuy')}
            id="ornamentBuy"
          >
            <Checkbox.Indicator style={{ color: seriesColors.ornamentBuy }}>
              <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M11.4669 3.72684C11.7558 3.91574 11.8369 4.30308 11.648 4.59198L7.39799 11.092C7.29783 11.2452 7.13556 11.3467 6.95402 11.3699C6.77247 11.3931 6.58989 11.3355 6.45446 11.2124L3.70446 8.71241C3.44905 8.48022 3.43023 8.08494 3.66242 7.82953C3.89461 7.57412 4.28989 7.55529 4.5453 7.78749L6.75292 9.79441L10.6018 3.90792C10.7907 3.61902 11.178 3.53795 11.4669 3.72684Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path>
              </svg>
            </Checkbox.Indicator>
          </Checkbox.Root>
        </div>
        <label className="text-sm font-medium text-gray-700 select-none cursor-pointer" htmlFor="ornamentBuy">
          Ornament Buy (OB)
        </label>
      </div>

      <div className={`flex items-center gap-2 p-2 rounded tv-animate-hover ${selections.ornamentSell ? 'bg-gray-100' : ''} cursor-pointer`} onClick={() => onToggle('ornamentSell')}>
        <div className="flex items-center justify-center">
          <span className="block w-3 h-3 rounded-full mr-2" style={{ backgroundColor: seriesColors.ornamentSell }}></span>
          <Checkbox.Root
            className="flex h-5 w-5 appearance-none items-center justify-center rounded bg-white border border-gray-300 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-200 cursor-pointer"
            checked={selections.ornamentSell}
            onCheckedChange={() => onToggle('ornamentSell')}
            id="ornamentSell"
          >
            <Checkbox.Indicator style={{ color: seriesColors.ornamentSell }}>
              <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M11.4669 3.72684C11.7558 3.91574 11.8369 4.30308 11.648 4.59198L7.39799 11.092C7.29783 11.2452 7.13556 11.3467 6.95402 11.3699C6.77247 11.3931 6.58989 11.3355 6.45446 11.2124L3.70446 8.71241C3.44905 8.48022 3.43023 8.08494 3.66242 7.82953C3.89461 7.57412 4.28989 7.55529 4.5453 7.78749L6.75292 9.79441L10.6018 3.90792C10.7907 3.61902 11.178 3.53795 11.4669 3.72684Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path>
              </svg>
            </Checkbox.Indicator>
          </Checkbox.Root>
        </div>
        <label className="text-sm font-medium text-gray-700 select-none cursor-pointer" htmlFor="ornamentSell">
          Ornament Sell (OS)
        </label>
      </div>

      <div className={`flex items-center gap-2 p-2 rounded tv-animate-hover ${selections.priceChange ? 'bg-gray-100' : ''} cursor-pointer`} onClick={() => onToggle('priceChange')}>
        <div className="flex items-center justify-center">
          <span className="block w-3 h-3 rounded-full mr-2" style={{ backgroundColor: seriesColors.priceChange }}></span>
          <Checkbox.Root
            className="flex h-5 w-5 appearance-none items-center justify-center rounded bg-white border border-gray-300 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-200 cursor-pointer"
            checked={selections.priceChange}
            onCheckedChange={() => onToggle('priceChange')}
            id="priceChange"
          >
            <Checkbox.Indicator style={{ color: seriesColors.priceChange }}>
              <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M11.4669 3.72684C11.7558 3.91574 11.8369 4.30308 11.648 4.59198L7.39799 11.092C7.29783 11.2452 7.13556 11.3467 6.95402 11.3699C6.77247 11.3931 6.58989 11.3355 6.45446 11.2124L3.70446 8.71241C3.44905 8.48022 3.43023 8.08494 3.66242 7.82953C3.89461 7.57412 4.28989 7.55529 4.5453 7.78749L6.75292 9.79441L10.6018 3.90792C10.7907 3.61902 11.178 3.53795 11.4669 3.72684Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path>
              </svg>
            </Checkbox.Indicator>
          </Checkbox.Root>
        </div>
        <label className="text-sm font-medium text-gray-700 select-none cursor-pointer" htmlFor="priceChange">
          Price Change (BC)
        </label>
      </div>
    </div>
  );
};

export default Selector;
