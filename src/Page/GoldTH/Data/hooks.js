import { useQuery } from '@tanstack/react-query';
import { fetchGoldData, fetchPredictionData, fetchGoldUsData, fetchUsdThbData } from './fetchData';
import { transformGoldData, transformPredictionData } from './manageData';
import { transformGoldUsData, transformUsdThbData } from './dataTransformers';

// ค่า key สำหรับ query ต่างๆ
export const queryKeys = {
  goldTh: 'goldTh',
  prediction: 'prediction',
  goldUs: 'goldUs',
  usdThb: 'usdThb'
};

/**
 * Hook สำหรับดึงข้อมูลราคาทองไทย
 * @param {Object} options - ตัวเลือกเพิ่มเติมสำหรับ useQuery
 * @returns {Object} ผลลัพธ์จาก useQuery
 */
export const useGoldThData = (options = {}) => {
  return useQuery({
    queryKey: [queryKeys.goldTh],
    queryFn: async () => {
      const data = await fetchGoldData();
      return transformGoldData(data);
    },
    // Merge any additional options passed in
    ...options
  });
};

/**
 * Hook สำหรับดึงข้อมูลการทำนาย
 * @param {number} modelId - ID ของโมเดลที่ต้องการใช้
 * @param {Object} options - ตัวเลือกเพิ่มเติมสำหรับ useQuery
 * @returns {Object} ผลลัพธ์จาก useQuery
 */
export const usePredictionData = (modelId, options = {}) => {
  return useQuery({
    queryKey: [queryKeys.prediction, modelId],
    queryFn: async () => {
      const data = await fetchPredictionData(modelId);
      return transformPredictionData(data);
    },
    enabled: !!modelId, // ทำงานเฉพาะเมื่อมีการระบุ modelId
    // Merge any additional options passed in
    ...options
  });
};

/**
 * Hook สำหรับดึงข้อมูลราคาทองสากล
 * @param {Object} options - ตัวเลือกเพิ่มเติมสำหรับ useQuery
 * @returns {Object} ผลลัพธ์จาก useQuery
 */
export const useGoldUsData = (options = {}) => {
  return useQuery({
    queryKey: [queryKeys.goldUs],    queryFn: async () => {
      const data = await fetchGoldUsData();
      return transformGoldUsData(data);
    },
    // Merge any additional options passed in
    ...options
  });
};

/**
 * Hook สำหรับดึงข้อมูลอัตราแลกเปลี่ยน USD/THB
 * @param {Object} options - ตัวเลือกเพิ่มเติมสำหรับ useQuery
 * @returns {Object} ผลลัพธ์จาก useQuery
 */
export const useUsdThbData = (options = {}) => {
  return useQuery({
    queryKey: [queryKeys.usdThb],    queryFn: async () => {
      const data = await fetchUsdThbData();
      return transformUsdThbData(data);
    },
    // Merge any additional options passed in
    ...options
  });
};
