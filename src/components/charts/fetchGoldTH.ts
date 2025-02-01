import dayjs from "dayjs";

export const fetchGoldTH = async (range: string) => {
  try {
    // เข้าถึง URL ของ API จาก .env
    const apiUrl = import.meta.env.VITE_GOLD_TH;

    if (!apiUrl) {
      throw new Error("API URL is not defined in .env");
    }

    // ดึงข้อมูลจาก API
    const response = await fetch(apiUrl);
    const data = await response.json();

    if (!response.ok) {
      throw new Error("Failed to fetch data");
    }

    // สร้าง map ใหม่จากข้อมูล โดยจับคู่ date กับ price
    const mappedData = data.data.map((item: any) => {
      const formattedDate = dayjs(item.created_at).format("DD-MM-YY"); // แปลง created_at เป็น date
      const price = item.bar_buy_price;
      return {
        date: formattedDate,
        price: price,
      };
    });

    // กำหนดวันที่ปัจจุบัน
    const today = dayjs();
    let filteredData = mappedData;

    // กรองข้อมูลตามช่วงเวลาที่กำหนด
    switch (range) {
      case "7D":
        filteredData = mappedData.filter((item) => {
          const date = dayjs(item.date, "DD-MM-YY");
          if (!date.isValid()) {
            return false; // ถ้าวันที่ไม่ valid จะไม่ให้แสดง
          }
          return today.diff(date, "day") <= 7;
        });
        break;
      case "15D":
        filteredData = mappedData.filter((item) => {
          const date = dayjs(item.date, "DD-MM-YY");
          if (!date.isValid()) {
            return false;
          }
          return today.diff(date, "day") <= 15;
        });
        break;
      case "1M":
        filteredData = mappedData.filter((item) => {
          const date = dayjs(item.date, "DD-MM-YY");
          if (!date.isValid()) {
            return false;
          }
          return today.diff(date, "day") <= 30;
        });
        break;
      case "3M":
        filteredData = mappedData.filter((item) => {
          const date = dayjs(item.date, "DD-MM-YY");
          if (!date.isValid()) {
            return false;
          }
          return today.diff(date, "day") <= 90;
        });
        break;
      case "6M":
        filteredData = mappedData.filter((item) => {
          const date = dayjs(item.date, "DD-MM-YY");
          if (!date.isValid()) {
            return false;
          }
          return today.diff(date, "day") <= 180;
        });
        break;
      case "1Y":
        filteredData = mappedData.filter((item) => {
          const date = dayjs(item.date, "DD-MM-YY");
          if (!date.isValid()) {
            return false;
          }
          return today.diff(date, "day") <= 365;
        });
        break;
      case "ALL":
        break;
      default:
        break;
    }
    console.log(filteredData);
    return filteredData;

  } catch (error) {
    console.error("Error fetching gold data:", error);
    return null;
  }
};
