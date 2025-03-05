import React from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "./ui/dropdown-menu";
import { Button } from "./ui/button";
import { ChevronDown } from "lucide-react";

// Data categories from GoldChartRevised.jsx
const DATA_CATEGORIES = [
  { id: "gold_th", label: "ทองคำไทย (บาท)", description: "ราคาทองคำในประเทศไทย" },
  { id: "gold_us", label: "ทองคำสากล (USD)", description: "ราคาทองคำในตลาดโลก" },
  { id: "usd_thb", label: "อัตราแลกเปลี่ยน (USD/THB)", description: "อัตราแลกเปลี่ยนดอลลาร์สหรัฐต่อบาทไทย" },
];

const GoldDataDropdown = ({ selectedCategory, onCategoryChange }) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="w-full justify-between">
          {DATA_CATEGORIES.find(cat => cat.id === selectedCategory)?.label || "เลือกประเภทข้อมูล"}
          <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56">
        <DropdownMenuLabel>ประเภทข้อมูล</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuRadioGroup value={selectedCategory} onValueChange={onCategoryChange}>
          {DATA_CATEGORIES.map((category) => (
            <DropdownMenuRadioItem key={category.id} value={category.id} className="cursor-pointer">
              <div>
                <div>{category.label}</div>
                <p className="text-xs text-muted-foreground">{category.description}</p>
              </div>
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

// Timeframe dropdown component
const TIMEFRAMES = [
  { id: "1d", label: "1 วัน", description: "ข้อมูลย้อนหลัง 1 วัน" },
  { id: "1w", label: "1 สัปดาห์", description: "ข้อมูลย้อนหลัง 1 สัปดาห์" },
  { id: "1m", label: "1 เดือน", description: "ข้อมูลย้อนหลัง 1 เดือน" },
  { id: "3m", label: "3 เดือน", description: "ข้อมูลย้อนหลัง 3 เดือน" },
  { id: "6m", label: "6 เดือน", description: "ข้อมูลย้อนหลัง 6 เดือน" },
  { id: "1y", label: "1 ปี", description: "ข้อมูลย้อนหลัง 1 ปี" },
  { id: "all", label: "ทั้งหมด", description: "ข้อมูลทั้งหมดที่มี" },
];

export const TimeframeDropdown = ({ selectedTimeframe, onTimeframeChange }) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="w-full justify-between">
          {TIMEFRAMES.find(tf => tf.id === selectedTimeframe)?.label || "เลือกช่วงเวลา"}
          <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56">
        <DropdownMenuLabel>ช่วงเวลา</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuRadioGroup value={selectedTimeframe} onValueChange={onTimeframeChange}>
          {TIMEFRAMES.map((timeframe) => (
            <DropdownMenuRadioItem key={timeframe.id} value={timeframe.id} className="cursor-pointer">
              <div>
                <div>{timeframe.label}</div>
                <p className="text-xs text-muted-foreground">{timeframe.description}</p>
              </div>
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default GoldDataDropdown; 