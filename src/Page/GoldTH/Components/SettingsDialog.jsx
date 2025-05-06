import React from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import Selector from './Selector';
import ModelSelector from './ModelSelector';

/**
 * Component สำหรับ settings popup ที่รวม ModelSelector และ Chart Display Configuration
 * 
 * @param {Object} props
 * @param {Object} props.selections - สถานะการเลือกของแต่ละชุดข้อมูล
 * @param {Function} props.onToggleSelection - function ที่เรียกเมื่อมีการเปลี่ยนแปลงการเลือก
 * @param {string|number} props.selectedModel - ค่า Model ที่เลือกอยู่
 * @param {Function} props.onModelChange - function ที่เรียกเมื่อมีการเปลี่ยน Model
 */
const SettingsDialog = ({ selections, onToggleSelection, selectedModel, onModelChange }) => {
  return (
    <Dialog.Root>      <Dialog.Trigger asChild>
        <button
          className="flex items-center gap-1 bg-white rounded-md border border-gray-200 px-3 py-2 shadow-sm hover:bg-gray-50 transition-colors"
          title="Chart Settings"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path>
            <circle cx="12" cy="12" r="3"></circle>
          </svg>
          <span className="text-sm font-medium">Settings</span>
        </button>
      </Dialog.Trigger>
      
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed left-[50%] top-[50%] z-50 grid w-full max-w-md translate-x-[-50%] translate-y-[-50%] gap-4 border bg-white p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] rounded-lg">
          <Dialog.Title className="text-lg font-semibold">
            Chart Settings
          </Dialog.Title>
          
          <div className="space-y-6">            <div className="space-y-4">
              <h3 className="text-sm font-medium text-gray-700 cursor-pointer" onClick={() => document.getElementById('model-selector-trigger')?.click()}>Prediction Model</h3>
              <div className="pl-1">
                <ModelSelector value={selectedModel} onChange={onModelChange} id="model-selector" />
              </div>
            </div>
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-gray-700">Configure Chart Display</h3>
              <Selector selections={selections} onToggle={onToggleSelection} />
            </div>
          </div>
          
          <Dialog.Close asChild>
            <button className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                <path d="M18 6 6 18"></path>
                <path d="m6 6 12 12"></path>
              </svg>
              <span className="sr-only">Close</span>
            </button>
          </Dialog.Close>
          
          <div className="flex justify-end">
            <Dialog.Close asChild>
              <button className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-md text-sm font-medium transition-colors">
                Close
              </button>
            </Dialog.Close>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

export default SettingsDialog;
