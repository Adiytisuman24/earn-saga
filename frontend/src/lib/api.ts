import axios from 'axios';

export const api = axios.create({
  // In production: Vercel proxies /api → https://earn-saga.onrender.com/api
  // In development: direct to local Go server
  baseURL: import.meta.env.VITE_API_URL || '/api',
  withCredentials: true
});
