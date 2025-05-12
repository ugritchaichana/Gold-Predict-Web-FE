import { useEffect, useRef } from 'react';
import { createChart } from 'lightweight-charts';


// ================================================
// VerticalLineChart Component - สำหรับแสดงกราฟเส้นพร้อมเส้นแนวตั้งที่จุดสำคัญ
// ================================================
// Dependencies:
// 1. lightweight-charts: version 4.1.0
//    npm install lightweight-charts@4.1.0
//
// 2. React: version 18+
//    npm install react react-dom
//
// สนับสนุนข้อมูล 2 รูปแบบ:
// 1. แบบมี time field: [{ time: '2024-01-01', value: 10 }, ...]
// 2. แบบไม่มี time field: [{ value: 10 }, { value: 15 }, ...]
// 
// วิธีใช้งาน - แบบเดิม (แสดงเส้นแนวตั้งเดียว):
// <VerticalLineChart 
//   data={chartData}           // ข้อมูลกราฟทั้งแบบมี time field และไม่มี time field
//   height={300}               // ความสูงของกราฟ (optional, default: 300)
//   width="100%"               // ความกว้างของกราฟ (optional, default: "100%")
//   verticalLineIndex={2}      // ตำแหน่ง index ของข้อมูลที่ต้องการแสดงเส้นแนวตั้ง (optional, default: 2)
//   verticalLineTime="2024-01-03" // หรือระบุเวลาโดยตรง มีความสำคัญมากกว่า verticalLineIndex (optional)
//   verticalLineColor="red"    // สีของเส้นแนวตั้ง (optional, default: "red")
//   verticalLineWidth={2}      // ความหนาของเส้นแนวตั้ง (optional, default: 2)
//   verticalLineDash={[5,5]}   // รูปแบบเส้นประ [5,5] หรือ [] สำหรับเส้นทึบ (optional, default: [])
//   showLabel={true}           // แสดงป้ายกำกับที่เส้นแนวตั้งหรือไม่ (optional, default: true)
//   showValueInLabel={true}    // แสดงค่าในป้ายกำกับหรือไม่ (optional, default: true)
//   labelText="จุดสำคัญ"       // ข้อความที่แสดงบนป้ายกำกับ (optional, default: "จุดสำคัญ")
//   labelColor="white"         // สีข้อความบนป้ายกำกับ (optional, default: "white")
//   labelBgColor="red"         // สีพื้นหลังของป้ายกำกับ (optional, default: "red")
//
// วิธีใช้งาน - แบบใหม่ (แสดงหลายเส้นแนวตั้ง):
// <VerticalLineChart 
//   data={chartData}
//   // เพิ่มหลายเส้นแนวตั้ง - จะมีความสำคัญกว่า verticalLineIndex, verticalLineTime
//   verticalLines={[
//     { 
//       time: "2024-01-03", // หรือใช้ index: 2 เพื่อชี้ตำแหน่งจาก data
//       color: "red", 
//       width: 2, 
//       dash: [], 
//       label: {
//         text: "จุดสำคัญ 1", 
//         show: true, 
//         showValue: true,
//         color: "white", 
//         bgColor: "red"
//       }
//     },
//     { 
//       time: "2024-01-05", 
//       color: "green", 
//       width: 2, 
//       dash: [5,5], 
//       label: {
//         text: "จุดสำคัญ 2", 
//         show: true, 
//         showValue: false,
//         color: "white", 
//         bgColor: "green"
//       }
//     }
//   ]}
//   chartBgColor="#ffffff"     // สีพื้นหลังของกราฟ (optional, default: "#ffffff")
//   chartTextColor="#333"      // สีข้อความในกราฟ (optional, default: "#333")
//   seriesColor="#2962FF"      // สีของเส้นกราฟ (optional, default: "#2962FF")
//   seriesLineWidth={2}        // ความหนาของเส้นกราฟ (optional, default: 2)
//   gridLinesVisible={true}    // แสดงเส้นตาราง (optional, default: true)
//   gridColor="#e0e0e0"        // สีของเส้นตาราง (optional, default: "#e0e0e0")
//   timeVisible={true}         // แสดงเวลาบนแกน x (optional, default: true)
//   className=""               // class ของ div ที่เก็บกราฟ (optional, default: "")
//   style={{}}                 // React style object สำหรับ div ที่เก็บกราฟ (optional, default: {})
//   onChartReady={callback}    // callback function เมื่อกราฟพร้อม (chart, series) => void (optional)
//   crosshairEnabled={true}    // เปิดใช้ crosshair หรือไม่ (optional, default: true)
//   disablePointHover={false}  // ปิดการแสดงจุดเมื่อชี้เมาส์ (optional, default: false)
// />



export const VerticalLineChart = ({
  data,
  height = 300,
  width = "100%",
  // รูปแบบเดิม - แสดงเส้นแนวตั้งเดียว
  verticalLineIndex = 2,
  verticalLineTime = null, // ใหม่: กำหนดเวลาโดยตรง (มีความสำคัญกว่า index)
  verticalLineColor = "red",
  verticalLineWidth = 2,
  verticalLineDash = [], // เพิ่มรูปแบบเส้น เช่น [5, 5] จะเป็นเส้นประ
  showLabel = true,
  showValueInLabel = true, // แสดงค่าในป้ายกำกับหรือไม่
  labelText = "จุดสำคัญ",
  labelColor = "white",
  labelBgColor = "red",
  // รูปแบบใหม่ - แสดงหลายเส้นแนวตั้ง
  verticalLines = null, // ใหม่: กำหนดหลายเส้นพร้อมกันได้
  // การตั้งค่ากราฟ
  chartBgColor = "#ffffff",
  chartTextColor = "#333",
  seriesColor = "#2962FF",
  seriesLineWidth = 2,
  gridLinesVisible = true,
  gridColor = "#e0e0e0",
  timeVisible = true,
  className = "",
  style = {},
  onChartReady = null, // Callback when chart is ready
  crosshairEnabled = true,
  disablePointHover = false // ใหม่: ปิดการแสดง point เมื่อชี้เมาส์
}) => {
  const chartContainerRef = useRef(null);

  useEffect(() => {
    // ตรวจสอบว่ามีข้อมูล
    if (!data || data.length === 0) {
      // console.error("ไม่มีข้อมูลหรือข้อมูลว่างเปล่า");
      return;
    }
    
    // ตรวจสอบว่า verticalLineIndex ถูกต้อง (กรณีใช้รูปแบบเดิม และไม่ได้ใช้ verticalLines)
    if (!verticalLines && verticalLineIndex >= data.length) {
      // console.error("ค่า verticalLineIndex เกินขอบเขตของข้อมูล");
      return;
    }
    
    // ตรวจสอบรูปแบบข้อมูล - มี time หรือไม่
    const hasTimeField = data.length > 0 && 'time' in data[0];
    // สร้างรูปแบบข้อมูลที่เหมาะสม
    let processedData;
    // Lightweight charts จำเป็นต้องมี time และต้องเป็นรูปแบบ yyyy-mm-dd เท่านั้น
    if (!hasTimeField) {
      // กรณีไม่มี time field ให้สร้างข้อมูลที่มี time เป็น "yyyy-mm-dd" โดยใช้วันที่ปัจจุบัน + index
      // เริ่มต้นจากวันปัจจุบันและเพิ่มทีละวัน
      const baseDate = new Date();
      processedData = data.map((item, index) => {
        const currentDate = new Date(baseDate);
        currentDate.setDate(baseDate.getDate() + index);
        // Format to YYYY-MM-DD
        const formattedDate = currentDate.toISOString().split('T')[0];
        return {
          ...item,
          time: formattedDate, // ใช้วันที่ในรูปแบบ yyyy-mm-dd
          originalIndex: index // เก็บ index ต้นฉบับไว้อ้างอิง
        };
      });
      
      // แสดง log เพื่อแจ้งเตือน
      // console.info("ข้อมูลไม่มี time field - ใช้วันที่แทน โดยเริ่มจากวันปัจจุบัน", processedData);
    } else {
      // กรณีมี time field ก็ใช้ข้อมูลเดิม
      processedData = data;
    }

    // สร้างกราฟ
    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { color: chartBgColor },
        textColor: chartTextColor,
      },
      grid: {
        vertLines: { color: gridColor, visible: gridLinesVisible },
        horzLines: { color: gridColor, visible: gridLinesVisible },
      },
      timeScale: {
        timeVisible: timeVisible,
        secondsVisible: false,
      },
      rightPriceScale: {
        borderColor: gridColor,
        // Disable all colored elements on the price axis
        ticksVisible: false, // Remove ticks with colors
        entireTextOnly: true, // Show whole numbers only
        borderVisible: true, // Still show border
        drawTicks: false, // Remove tick marks
        scaleMargins: {
          top: 0.1,
          bottom: 0.1,
        },
      },
      height,
      width: width !== "100%" ? width : undefined,
      crosshair: {
        mode: crosshairEnabled ? 1 : 0, // 0 = none, 1 = normal
      },
    });

    // เพิ่ม line series
    const lineSeries = chart.addLineSeries({
      color: seriesColor,
      lineWidth: seriesLineWidth,
      lastValueVisible: false, // ไม่แสดงค่าล่าสุดบนแกนราคา
      priceLineVisible: false, // ไม่แสดงเส้นราคาปัจจุบัน
      // ปิดการแสดง point เมื่อชี้เมาส์ถ้าต้องการ
      pointMarkersVisible: !disablePointHover,
      crosshairMarkerVisible: !disablePointHover,
      // ตั้งค่าจุดที่แสดงเมื่อชี้
      pointMarkersRadius: disablePointHover ? 0 : 4,
    });

    // ใส่ข้อมูลกราฟ
    lineSeries.setData(processedData);
    
    // เรียก callback เมื่อชาร์ตพร้อม
    if (onChartReady && typeof onChartReady === 'function') {
      onChartReady(chart, lineSeries);
    }
      
    // เตรียมข้อมูลเส้นแนวตั้ง
    let verticalLinesData = [];
    
    // กรณีที่ใช้ verticalLines (รูปแบบใหม่)
    if (verticalLines && Array.isArray(verticalLines) && verticalLines.length > 0) {
      // แปลงข้อมูลจาก prop ให้เป็นรูปแบบที่ใช้งานได้
      verticalLinesData = verticalLines.map(line => {
        let timeValue;
        let dataPoint;
        
        // หาค่าเวลาจาก index หรือ time ที่ระบุ
        if (line.index !== undefined && line.index < processedData.length) {
          timeValue = processedData[line.index].time;
          dataPoint = processedData[line.index];
        } else if (line.time && hasTimeField) {
          timeValue = line.time;
          // หาข้อมูลที่ใกล้เคียงกับเวลาที่กำหนด
          dataPoint = processedData.find(d => d.time === line.time) || 
                     processedData.reduce((prev, curr) => 
                       Math.abs(new Date(curr.time) - new Date(line.time)) < 
                       Math.abs(new Date(prev.time) - new Date(line.time)) ? curr : prev
                     );
        } else if (line.time && !hasTimeField) {
          // ในกรณีที่ไม่มี time ในข้อมูล แต่กำหนด time มา ให้แปลงเป็น index
          // สำหรับรูปแบบที่ส่ง time เป็นตัวเลข (เช่น "2") ให้ใช้เป็น index
          const timeIndex = Math.min(Math.max(0, parseInt(line.time) || 0), processedData.length - 1);
          // ใช้ค่า time ที่แปลงจาก index แล้ว
          timeValue = processedData[timeIndex].time;
          dataPoint = processedData[timeIndex];
        } else {
          return null; // ข้ามถ้าไม่มีทั้ง index และ time
        }
        
        return {
          time: timeValue,
          dataPoint: dataPoint,
          color: line.color || verticalLineColor,
          width: line.width || verticalLineWidth,
          dash: line.dash || verticalLineDash,
          label: {
            text: line.label?.text || labelText,
            show: line.label?.show !== undefined ? line.label.show : showLabel,
            showValue: line.label?.showValue !== undefined ? line.label.showValue : showValueInLabel,
            color: line.label?.color || labelColor,
            bgColor: line.label?.bgColor || labelBgColor
          }
        };
      }).filter(line => line !== null);
    }
    // กรณีที่ใช้ verticalLineIndex หรือ verticalLineTime (รูปแบบเดิม)
    else {
      let timeValue;
      let dataPoint;
      
      // กรณีที่ใช้ verticalLineTime ถ้ามี มิฉะนั้นใช้ verticalLineIndex
      if (verticalLineTime && hasTimeField) {
        timeValue = verticalLineTime;
        // หาข้อมูลที่ใกล้เคียงกับเวลาที่กำหนด
        dataPoint = processedData.find(d => d.time === verticalLineTime);
          // ถ้าไม่พบค่าตรงกัน ให้หาค่าใกล้เคียง
        if (!dataPoint) {
          try {
            dataPoint = processedData.reduce((prev, curr) => 
              Math.abs(new Date(curr.time) - new Date(verticalLineTime)) < 
              Math.abs(new Date(prev.time) - new Date(verticalLineTime)) ? curr : prev
            );
          } catch (_) {
            // หากเปรียบเทียบวันที่ไม่ได้ ให้ใช้ข้อมูลแรกแทน
            dataPoint = processedData[0];
            console.warn("ไม่สามารถเปรียบเทียบวันที่ได้", _);
          }
        }
      } else if (verticalLineTime && !hasTimeField) {
        // ในกรณีที่ไม่มี time ในข้อมูล แต่กำหนด time มา
        let timeIndex;
        
        // ตรวจสอบว่า time เป็นตัวเลขได้หรือไม่
        if (!isNaN(Number(verticalLineTime))) {
          // ถ้า time เป็นตัวเลข (เช่น "3") ให้ใช้เป็น index ได้เลย
          timeIndex = Math.min(Math.max(0, parseInt(verticalLineTime) || 0), processedData.length - 1);
        } else {
          // ถ้า time ไม่เป็นตัวเลข (เช่น "2024-01-01") ให้ใช้ index ตรงกลางข้อมูล
          timeIndex = Math.floor(processedData.length / 2);
          console.warn("ไม่สามารถแปลงค่า time '" + verticalLineTime + "' เป็น index ได้ ใช้ค่ากลางแทน");
        }
        
        // ใช้ค่า time ที่แปลงจาก index แล้ว
        timeValue = processedData[timeIndex].time;
        dataPoint = processedData[timeIndex];
      } else {
        // กรณีใช้ index
        timeValue = processedData[verticalLineIndex].time;
        dataPoint = processedData[verticalLineIndex];
      }
      
      verticalLinesData = [{
        time: timeValue,
        dataPoint: dataPoint,
        color: verticalLineColor,
        width: verticalLineWidth,
        dash: verticalLineDash,
        label: {
          text: labelText,
          show: showLabel,
          showValue: showValueInLabel,
          color: labelColor,
          bgColor: labelBgColor
        }
      }];
    }
    
    // สร้างป้ายกำกับ (label) สำหรับแต่ละเส้น
    verticalLinesData.forEach(line => {
      if (line.label.show) {
        lineSeries.createPriceLine({
          price: line.dataPoint.value,
          color: line.color,
          lineWidth: line.width,
          lineStyle: 0, // เส้นทึบ
          axisLabelVisible: false, // ไม่แสดงป้ายสีที่แกนราคา
          title: line.label.text,
          lineVisible: false, // ไม่ต้องการเส้นแนวนอน
        });
      }
    });
    
    // เก็บ reference ของ DOM element เพื่อใช้ตอน cleanup
    const chartElement = chartContainerRef.current;
    
    // ฟังก์ชันสำหรับอัพเดทเส้นแนวตั้ง
    const updateVerticalLines = () => {
      // ดึง canvas และ context สำหรับวาด
      const canvas = chartElement.querySelector('canvas');
      if (!canvas) return;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      // ล้างพื้นที่ทั้งหมดที่อาจมีการวาดเส้นแนวตั้งไว้ก่อน
      // ทำการบันทึกรูปกราฟปัจจุบัน และวาดทับด้วยเส้นใหม่
      const timeScale = chart.timeScale();
      const chartHeight = canvas.height - 30; // เว้นพื้นที่สำหรับแกนเวลา
      // วาดแต่ละเส้นตามข้อมูลใน verticalLinesData
      verticalLinesData.forEach(line => {
        try {
          // หาพิกัด x จากค่าเวลา - ทุกกรณีใช้ timeToCoordinate ได้เพราะเราแปลงข้อมูลให้มี time field หมดแล้ว
          let x = timeScale.timeToCoordinate(line.time);
          
          // ข้ามถ้าไม่สามารถคำนวณตำแหน่งได้
          if (x === null || x === undefined) return;
          
          // วาดเส้นแนวตั้ง
          ctx.save();
          ctx.strokeStyle = line.color;
          ctx.lineWidth = line.width;
          ctx.setLineDash(line.dash); // ใช้รูปแบบเส้นตามที่กำหนด
          
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, chartHeight);
          ctx.stroke();
          
          // แสดงป้ายกำกับถ้ากำหนดให้แสดง
          if (line.label && line.label.show) {
            const value = line.dataPoint.value;
            
            try {
              // คำนวณตำแหน่ง y โดยตรงจากสัดส่วนของข้อมูล
              
              // หาค่าสูงสุด/ต่ำสุดจากข้อมูล series โดยตรง
              const values = processedData.map(item => item.value);
              const minValue = Math.min(...values);
              const maxValue = Math.max(...values);
              const valueRange = maxValue - minValue;
              
              // ป้องกันการหารด้วย 0
              if (valueRange === 0) return;
              
              // คำนวณสัดส่วนของค่าในช่วงราคา (0-1)
              const valueRatio = 1 - ((value - minValue) / valueRange);
              
              // แปลงเป็นพิกัด y บนหน้าจอ (0 = บนสุด, height = ล่างสุด)
              const displayHeight = canvas.height - 30; // ลบความสูงของแกน x
              
              // บวก padding ด้านบนและล่าง
              const topPadding = displayHeight * 0.1; // padding 10%
              const bottomPadding = displayHeight * 0.1;
              const adjustedHeight = displayHeight - topPadding - bottomPadding;
              
              const y = Math.round(topPadding + (valueRatio * adjustedHeight));
              
              if (y !== null) {
                // กำหนดข้อความที่จะแสดงในป้าย
                const labelContent = line.label.showValue ? 
                                    `${line.label.text}: ${value}` : 
                                    line.label.text;
                
                // วาดพื้นหลังป้ายกำกับ
                ctx.fillStyle = line.label.bgColor;
                const labelWidth = ctx.measureText(labelContent).width + 10;
                const labelHeight = 20;
                
                // ตำแหน่งป้ายกำกับ - ปรับตามตำแหน่งของค่า
                const labelX = x + 5;
                const labelY = y < displayHeight / 2 ? y + 10 : y - labelHeight - 5;
                
                // วาดกรอบมน
                ctx.beginPath();
                const radius = 4;
                ctx.moveTo(labelX + radius, labelY);
                ctx.lineTo(labelX + labelWidth - radius, labelY);
                ctx.arcTo(labelX + labelWidth, labelY, labelX + labelWidth, labelY + radius, radius);
                ctx.lineTo(labelX + labelWidth, labelY + labelHeight - radius);
                ctx.arcTo(labelX + labelWidth, labelY + labelHeight, labelX + labelWidth - radius, labelY + labelHeight, radius);
                ctx.lineTo(labelX + radius, labelY + labelHeight);
                ctx.arcTo(labelX, labelY + labelHeight, labelX, labelY + labelHeight - radius, radius);
                ctx.lineTo(labelX, labelY + radius);
                ctx.arcTo(labelX, labelY, labelX + radius, labelY, radius);
                ctx.fill();
                
                // วาดข้อความ
                ctx.fillStyle = line.label.color;
                ctx.font = '12px Arial';
                ctx.textBaseline = 'middle';
                ctx.fillText(labelContent, labelX + 5, labelY + labelHeight / 2);
              }
            } catch (labelErr) {
              console.warn("Error drawing label:", labelErr);
            }
          }
          
          ctx.restore();
        } catch (err) {
          console.warn("Error drawing vertical line:", err);
        }
      });
    };
    
    // อัพเดทเส้นเมื่อมีการโต้ตอบกับกราฟ
    chart.subscribeClick(() => {
      setTimeout(updateVerticalLines, 50);
    });
    
    // อัพเดทเมื่อช่วงที่มองเห็นเปลี่ยน (เลื่อน, ซูม)
    chart.timeScale().subscribeVisibleLogicalRangeChange(() => {
      requestAnimationFrame(() => {
        updateVerticalLines();
        // วาดซ้ำอีกครั้งหลังจากผ่านไปเล็กน้อย เพื่อให้แน่ใจว่าเส้นแสดง
        setTimeout(updateVerticalLines, 100);
      });
    });
    
    // อัพเดทเมื่อ crosshair เคลื่อนที่
    chart.subscribeCrosshairMove(() => {
      requestAnimationFrame(updateVerticalLines);
    });
    
    // อัพเดทเมื่อช่วงเวลาที่มองเห็นเปลี่ยน
    chart.timeScale().subscribeVisibleTimeRangeChange(() => {
      requestAnimationFrame(() => {
        updateVerticalLines();
        // วาดซ้ำอีกครั้งหลังจากผ่านไปเล็กน้อย
        setTimeout(updateVerticalLines, 100);
      });
    });
    
    // อัพเดทเมื่อใช้เมาส์เลื่อน/ซูม
    const wheelHandler = () => {
      setTimeout(updateVerticalLines, 50);
    };
    chartElement.addEventListener('wheel', wheelHandler);
    
    // อัพเดทเมื่อหน้าจอเปลี่ยนขนาด
    window.addEventListener('resize', updateVerticalLines);
    
    // วาดครั้งแรก - เพิ่มดีเลย์เพื่อให้แน่ใจว่า DOM และ canvas พร้อม
    setTimeout(updateVerticalLines, 300);
    
    // กำหนดให้มีการวาดซ้ำทุกๆ 1 วินาที เพื่อให้แน่ใจว่าเส้นแนวตั้งแสดง
    const intervalId = setInterval(updateVerticalLines, 1000);
    
    // ปรับขนาดเมื่อหน้าจอเปลี่ยน
    const handleResize = () => {
      chart.resize();
      setTimeout(updateVerticalLines, 50);
    };
    window.addEventListener('resize', handleResize);
    
    // Cleanup เมื่อ component unmount
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('resize', updateVerticalLines);
      chartElement?.removeEventListener('wheel', wheelHandler);
      clearInterval(intervalId); // ล้าง interval เพื่อป้องกันการรั่วไหลของหน่วยความจำ
      chart.remove();
    };
  }, [
    data, height, width, 
    verticalLineIndex, verticalLineTime, verticalLineColor, verticalLineWidth, verticalLineDash,
    showLabel, showValueInLabel, labelText, labelColor, labelBgColor,
    verticalLines,
    chartBgColor, chartTextColor, seriesColor, seriesLineWidth,
    gridLinesVisible, gridColor, timeVisible,
    onChartReady, crosshairEnabled, disablePointHover
  ]);

  return <div 
    ref={chartContainerRef} 
    className={className}
    style={{ width: width, ...style }} 
  />;
};

// ตัวอย่างการใช้งาน:
/*
import { VerticalLineChart } from './components/VerticalLineChart';
import { chartData } from './data/chartData';

function App() {
  return (
    <div style={{ width: '800px', margin: '0 auto' }}>
      <h2>แสดงกราฟพร้อมเส้นแนวตั้งที่จุดสำคัญ</h2>
      <VerticalLineChart 
        data={chartData} 
        height={400}
        verticalLineIndex={2}
        labelText="จุดสำคัญ" 
      />
    </div>
  );
}
*/
