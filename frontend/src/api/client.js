import axios from 'axios';
import { notifications } from '@mantine/notifications';

const client = axios.create({
  baseURL: '/api/v1',
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

client.interceptors.request.use((config) => {
  const token = localStorage.getItem('admin_jwt');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

client.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    if (status === 401) {
      // Solo redirigir al login si estamos en una ruta admin
      if (window.location.pathname.startsWith('/admin')) {
        localStorage.removeItem('admin_jwt');
        window.location.href = '/admin/login';
      }
    } else if (status >= 500) {
      notifications.show({
        color: 'red',
        title: 'Error del servidor',
        message: 'Ocurrio un error en el servidor. Intenta nuevamente.',
        autoClose: 5000,
      });
    }
    return Promise.reject(error);
  }
);

export default client;
