import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
});

// Attach the JWT to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Pull a readable message out of an axios error
export const errorMessage = (err) =>
  err.response?.data?.message || (err.request ? 'Cannot reach the server' : err.message);

export default api;