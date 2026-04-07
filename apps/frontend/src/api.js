import axios from 'axios';
import { useStore } from './store.js';

export const authApi = axios.create({
  baseURL: `${import.meta.env.VITE_AUTH_URL}/api/auth`
});

export const orgApi = axios.create({
  baseURL: `${import.meta.env.VITE_ORG_URL}/api/orgs`
});

export const projectApi = axios.create({
  baseURL: `${import.meta.env.VITE_PROJECT_URL}/api/projects`
});

export const taskApi = axios.create({
  baseURL: `${import.meta.env.VITE_TASK_URL}/api/tasks`
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