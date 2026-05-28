import client from './client.js';

export const getInspectionStatus = (cedula, placa) =>
  client.get('/inspection-status', { params: { cedula, placa } });

export const getSections = (vehicle_type) =>
  client.get('/sections', { params: { vehicle_type } });

export const getPhotoConfig = (vehicle_type) =>
  client.get('/photo-config', { params: { vehicle_type } });

export const submitInspection = (formData) =>
  client.post('/inspections', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 60000,
  });
