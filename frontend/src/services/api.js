import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_URL,
});

// Add token to requests if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authService = {
  login: async (username, password) => {
    const response = await api.post('/login', { username, password });
    if (response.data.access_token) {
      localStorage.setItem('token', response.data.access_token);
    }
    return response.data;
  },
  
  logout: () => {
    localStorage.removeItem('token');
  },
  
  isAuthenticated: () => {
    return !!localStorage.getItem('token');
  },
  
  getCurrentUser: async () => {
    const response = await api.get('/me');
    return response.data;
  }
};

export const userService = {
  createUser: async (userData) => {
    const response = await api.post('/users', userData);
    return response.data;
  },
  
  listUsers: async () => {
    const response = await api.get('/users');
    return response.data;
  }
};

export const chatService = {
  sendMessage: async (message, model = 'gpt-3.5-turbo') => {
    const response = await api.post('/chat', { message, model });
    return response.data;
  }
};

export default api;
