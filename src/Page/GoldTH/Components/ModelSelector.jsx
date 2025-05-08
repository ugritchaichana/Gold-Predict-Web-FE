import React from 'react';
import * as Select from '@radix-ui/react-select';
import '../tradingview-style.css';

/**
 * Component สำหรับเลือก Model Prediction (TradingView Style)
 * 
 * @param {Object} props
 * @param {string|number} props.value - ค่า Model ที่เลือกอยู่
 * @param {Function} props.onChange - function ที่จะเรียกเมื่อมีการเปลี่ยน Model
 */
const ModelSelector = ({ value, onChange }) => {
  const models = [
    { value: 1, label: 'Model 1' },
    { value: 2, label: 'Model 2' },
    { value: 3, label: 'Model 3' },
    { value: 4, label: 'Model 4' },
    { value: 5, label: 'Model 5' },
    { value: 6, label: 'Model 6' },
    { value: 7, label: 'Model 7' }
  ];
  // Make sure we have a valid value for the Root component
  const safeValue = value !== null && value !== undefined ? value.toString() : "1";
  
  // Create a ref for portal container
  const [portalContainer, setPortalContainer] = React.useState(null);
  
  // Set up the portal container on mount
  React.useEffect(() => {
    // Create a div that will be our portal container
    const container = document.createElement('div');
    container.setAttribute('data-portal-container', 'true');
    document.body.appendChild(container);
    setPortalContainer(container);
    
    // Clean up on unmount
    return () => {
      document.body.removeChild(container);
    };
  }, []);
  return (
  <div className="flex items-center space-x-3 tradingview-style w-full">
      <label className="text-sm font-medium text-gray-700 cursor-pointer flex items-center">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 text-blue-500">
          <path d="m14 5-3 3 3 3"></path>
          <path d="m10 17 3 3-3 3"></path>
          <circle cx="12" cy="12" r="10"></circle>
        </svg>
        Predict Model
      </label>
      <Select.Root value={safeValue} onValueChange={(newValue) => {
        if (onChange && typeof onChange === 'function') {
          const numericValue = Number(newValue);
          if (!isNaN(numericValue)) {
            onChange(numericValue);
          }
        }
      }}>        <Select.Trigger
          className="inline-flex items-center justify-between rounded-md px-4 py-2 text-sm gap-1 bg-white border border-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-300 min-w-[180px] tv-animate-hover shadow-sm cursor-pointer w-full transition-all"
          aria-label="Select prediction model"
          id="model-selector-trigger"
        >
          <Select.Value placeholder="Select model" className="font-medium" />
          <Select.Icon className="text-blue-500">
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M4.18179 6.18181C4.35753 6.00608 4.64245 6.00608 4.81819 6.18181L7.49999 8.86362L10.1818 6.18181C10.3575 6.00608 10.6424 6.00608 10.8182 6.18181C10.9939 6.35755 10.9939 6.64247 10.8182 6.81821L7.81819 9.81821C7.73379 9.9026 7.61934 9.95001 7.49999 9.95001C7.38064 9.95001 7.26618 9.9026 7.18179 9.81821L4.18179 6.81821C4.00605 6.64247 4.00605 6.35755 4.18179 6.18181Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path>
            </svg>
          </Select.Icon>
        </Select.Trigger>        <Select.Portal container={portalContainer}>          <Select.Content 
            className="overflow-hidden bg-white rounded-lg shadow-xl border border-gray-200 min-w-[220px] animate-fadeIn z-[100]"
            position="popper"
            sideOffset={4}
          >            <Select.ScrollUpButton className="flex items-center justify-center h-7 bg-gray-50 text-gray-700 cursor-default hover:bg-gray-100 transition-colors border-b border-gray-100">
              <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-blue-500">
                <path d="M4.18179 8.81819C4.00605 8.64245 4.00605 8.35753 4.18179 8.18179L7.18179 5.18179C7.26618 5.0974 7.38064 5.04999 7.49999 5.04999C7.61934 5.04999 7.73379 5.0974 7.81819 5.18179L10.8182 8.18179C10.9939 8.35753 10.9939 8.64245 10.8182 8.81819C10.6424 8.99392 10.3575 8.99392 10.1818 8.81819L7.49999 6.13638L4.81819 8.81819C4.64245 8.99392 4.35753 8.99392 4.18179 8.81819Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path>
              </svg>
            </Select.ScrollUpButton>
              <div className="px-3 py-2 border-b border-gray-100 bg-gray-50">
              <div className="text-xs font-medium text-gray-700 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1 text-blue-500">
                  <circle cx="12" cy="12" r="10"></circle>
                  <path d="M12 2a4.5 4.5 0 0 0 0 9 4.5 4.5 0 0 1 0 9 4.5 4.5 0 0 1-4.5-4.5c0-5.5 9-5.5 9 0A9 9 0 0 1 12 21"></path>
                </svg>
                Select Model
              </div>
            </div>
            
            <Select.Viewport className="p-1">
              {models.map((model) => (
                <Select.Item
                  key={model.value}
                  value={model.value.toString()}
                  className="relative flex items-center px-6 py-2.5 text-sm text-gray-700 rounded-md select-none hover:bg-blue-50 hover:text-blue-800 focus:bg-blue-50 focus:text-blue-800 outline-none cursor-pointer tv-animate-hover transition-colors"
                >
                  <Select.ItemText>{model.label}</Select.ItemText>
                  <Select.ItemIndicator className="absolute left-1 inline-flex items-center text-blue-600">
                    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M11.4669 3.72684C11.7558 3.91574 11.8369 4.30308 11.648 4.59198L7.39799 11.092C7.29783 11.2452 7.13556 11.3467 6.95402 11.3699C6.77247 11.3931 6.58989 11.3355 6.45446 11.2124L3.70446 8.71241C3.44905 8.48022 3.43023 8.08494 3.66242 7.82953C3.89461 7.57412 4.28989 7.55529 4.5453 7.78749L6.75292 9.79441L10.6018 3.90792C10.7907 3.61902 11.178 3.53795 11.4669 3.72684Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path>
                    </svg>
                  </Select.ItemIndicator>
                </Select.Item>
              ))}
            </Select.Viewport>
              <Select.ScrollDownButton className="flex items-center justify-center h-7 bg-gray-50 text-gray-700 cursor-default hover:bg-gray-100 transition-colors border-t border-gray-100">
              <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-blue-500">
                <path d="M4.18179 6.18181C4.35753 6.00608 4.64245 6.00608 4.81819 6.18181L7.49999 8.86362L10.1818 6.18181C10.3575 6.00608 10.6424 6.00608 10.8182 6.18181C10.9939 6.35755 10.9939 6.64247 10.8182 6.81821L7.81819 9.81821C7.73379 9.9026 7.61934 9.95001 7.49999 9.95001C7.38064 9.95001 7.26618 9.9026 7.18179 9.81821L4.18179 6.81821C4.00605 6.64247 4.00605 6.35755 4.18179 6.18181Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path>
              </svg>
            </Select.ScrollDownButton>
          </Select.Content>
        </Select.Portal>
      </Select.Root>
    </div>
  );
};

export default ModelSelector;
