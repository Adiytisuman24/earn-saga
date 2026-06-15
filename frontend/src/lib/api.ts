import axios from 'axios';

export const api = axios.create({
  // In dev, use localhost. In prod, strictly use the Vercel proxy '/api'.
  baseURL: import.meta.env.DEV ? 'http://localhost:3000/api' : '/api',
  withCredentials: true
});
