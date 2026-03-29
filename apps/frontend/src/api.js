import axios from 'axios';
import { useStore } from './store.js';

// We mock an API gateway that routes to the microservices or set direct ports.
// In a real scenario, an API Gateway (like Nginx or a Node proxy) would route /api/auth to 4001, etc.
// For now, we will create separate axios instances or a smart interceptor.

// For simplicity, let's create simple instances:
export const authApi = axios.create({
  baseURL: 'http://localhost:4001/api/auth'
});

export const orgApi = axios.create({
  baseURL: 'http://localhost:4002/api/orgs'
});

export const projectApi = axios.create({
  baseURL: 'http://localhost:4003/api/projects'
});

export const taskApi = axios.create({
  baseURL: 'http://localhost:4004/api/tasks'
});

const interceptorsSetup = (apiInstance) => {
  apiInstance.interceptors.request.use((config) => {
    const token = useStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  apiInstance.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401) {
        useStore.getState().logout();
      }
      return Promise.reject(error);
    }
  );
};

interceptorsSetup(authApi);
interceptorsSetup(orgApi);
interceptorsSetup(projectApi);
interceptorsSetup(taskApi);