// src/services/apiService.js
import axios from 'axios';
import { getBaseUrl } from '@/config/apiConfig';

export const fetchGoldTH = async (timeframe = 'all') => {
  try {
    const BASE_URL = getBaseUrl();
    const response = await axios.get(`${BASE_URL}/finnomenaGold/get-gold-data/?db_choice=0&frame=${timeframe}`);
    // const response = await axios.get(`${BASE_URL}/finnomenaGold/get-gold-data/?db_choice=0&frame=${timeframe}&max=100`);
    console.log(`GoldTH : ${BASE_URL}/finnomenaGold/get-gold-data/?db_choice=0&frame=${timeframe}&max=100`);
    return response.data;
  } catch (error) {
    console.error('Error fetching Gold TH data:', error);
    throw error;
  }
};

export const fetchGoldUS = async (timeframe = 'all') => {
  try {
    const BASE_URL = getBaseUrl();
    const response = await axios.get(`${BASE_URL}/finnomenaGold/get-gold-data/?db_choice=1&frame=${timeframe}`);
    // const response = await axios.get(`${BASE_URL}/finnomenaGold/get-gold-data/?db_choice=1&frame=${timeframe}&max=100`);
    console.log(`GoldUS : ${BASE_URL}/finnomenaGold/get-gold-data/?db_choice=1&frame=${timeframe}&max=100`);
    
    return response.data;
  } catch (error) {
    console.error('Error fetching Gold US data:', error);
    throw error;
  }
};

export const fetchUSDTHB = async (timeframe = 'all') => {
  try {
    const BASE_URL = getBaseUrl();
    const response = await axios.get(`${BASE_URL}/currency/get/?frame=${timeframe}`);
    // const response = await axios.get(`${BASE_URL}/currency/get/?frame=${timeframe}&max=100`);
    console.log(`USDTHB : ${BASE_URL}/currency/get/?frame=${timeframe}&max=100`);
    
    return response.data;
  } catch (error) {
    console.error('Error fetching USDTHB data:', error);
    throw error;
  }
};

export const fetchPredictions = async () => {
  try {
    const BASE_URL = getBaseUrl();
    const response = await axios.get(`${BASE_URL}/predicts/week/read&max=100`);
    return response.data;
  } catch (error) {
    console.error('Error fetching Prediction data:', error);
    throw error;
  }
};

export const fetchPredictionsWithParams = async (range = 'sort_all', display = 'chart', startdate, enddate, max = 999999) => {
  try {
    const BASE_URL = getBaseUrl();
    const params = new URLSearchParams({
      range,
      display,
      ...(startdate && { startdate }),
      ...(enddate && { enddate }),
      max
    }).toString();

    const fullUrl = `${BASE_URL}/predicts/week/read?${params}`;
    
    const response = await axios.get(fullUrl);
    // console.log('Full API URL: >> ', fullUrl);
    // console.log('Response: >> ', response.data);
    return response.data;
  } catch (error) {
    console.error('Error fetching Prediction data with params:', error);
    throw error;
  }
};


export const fetchPredictionsMonth = async () => {
  try {
    const BASE_URL = getBaseUrl();
    const response = await axios.get(`${BASE_URL}/predicts/month/read_all`);
    return response.data;
  } catch (error) {
    console.error('Error fetching Prediction data:', error);
    throw error;
  }
};