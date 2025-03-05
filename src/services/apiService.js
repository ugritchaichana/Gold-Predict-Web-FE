// src/services/apiService.js
import axios from 'axios';

const BASE_URL = 'https://34.117.31.73.nip.io';

export const fetchGoldTH = async (timeframe = 'all') => {
  try {
    const response = await axios.get(`${BASE_URL}/finnomenaGold/get-gold-data/?db_choice=0&frame=${timeframe}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching Gold TH data:', error);
    throw error;
  }
};

export const fetchGoldUS = async (timeframe = 'all') => {
  try {
    const response = await axios.get(`${BASE_URL}/finnomenaGold/get-gold-data/?db_choice=1&frame=${timeframe}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching Gold US data:', error);
    throw error;
  }
};

export const fetchUSDTHB = async (timeframe = 'all') => {
  try {
    // ใช้ endpoint ที่ถูกต้องสำหรับข้อมูล USDTHB
    const response = await axios.get(`${BASE_URL}/currency/get/?frame=${timeframe}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching USDTHB data:', error);
    throw error;
  }
};

export const fetchPredictions = async () => {
  try {
    const response = await axios.get(`${BASE_URL}/predicts/week/read`);
    return response.data;
  } catch (error) {
    console.error('Error fetching Prediction data:', error);
    throw error;
  }
};