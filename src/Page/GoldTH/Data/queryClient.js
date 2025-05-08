import { QueryClient } from '@tanstack/react-query';

// สร้าง QueryClient instance สำหรับใช้ใน application
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // คงข้อมูลไว้ในแคชเป็นเวลา 30 วินาที (หน่วยเป็นมิลลิวินาที) เพื่อให้ข้อมูลอัพเดทบ่อยขึ้น
      staleTime: 30 * 1000, 
      // ลองใหม่ 3 ครั้งเมื่อ request ล้มเหลว
      retry: 3,
      // ส่ง request ใหม่อัตโนมัติเมื่อกลับมาที่หน้าต่างหรือกลับมาออนไลน์
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
      // เก็บข้อมูลในแคชเป็นเวลา 24 ชั่วโมง แม้จะไม่ได้ใช้งาน
      cacheTime: 24 * 60 * 60 * 1000,
    },
  },
});

// ฟังก์ชันสำหรับล้างแคชทั้งหมด
export const clearQueryCache = () => {
  return queryClient.clear();
};

export default queryClient;
