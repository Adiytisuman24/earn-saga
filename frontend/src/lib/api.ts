import axios from 'axios';

export const api = axios.create({
  // In dev, use localhost:8080. In prod, strictly use the Vercel proxy '/api'.
  baseURL: import.meta.env.DEV ? 'http://localhost:8080/api' : '/api',
  withCredentials: true
});

