import client from './client.js';

// Auth
export const sendMagicLink = (email) => client.post('/auth/magic-link', { email }).then((r) => r.data);
export const verifyMagicLink = (token) => client.post('/auth/verify', { token }).then((r) => r.data);
export const getMe = () => client.get('/auth/me').then((r) => r.data);

// Dashboard
export const getDashboard = () => client.get('/admin/dashboard').then((r) => r.data);

// Collaborators
export const getCollaborators = (params) => client.get('/admin/collaborators', { params }).then((r) => r.data);
export const createCollaborator = (data) => client.post('/admin/collaborators', data).then((r) => r.data);
export const updateCollaborator = (id, data) => client.put(`/admin/collaborators/${id}`, data).then((r) => r.data);
export const deleteCollaborator = (id, hard = false) =>
  client.delete(`/admin/collaborators/${id}`, { params: hard ? { hard: 'true' } : {} }).then((r) => r.data);
export const exportCollaborators = (params) =>
  client.get('/admin/collaborators/export', { params, responseType: 'blob' }).then((r) => r.data);

export const importCsvDryRun = (file) => {
  const fd = new FormData();
  fd.append('file', file);
  return client.post('/admin/collaborators/import-csv', fd, { headers: { 'Content-Type': 'multipart/form-data' } }).then((r) => r.data);
};
export const importCsvConfirm = (file) => {
  const fd = new FormData();
  fd.append('file', file);
  return client.post('/admin/collaborators/import-csv?confirm=true', fd, { headers: { 'Content-Type': 'multipart/form-data' } }).then((r) => r.data);
};

// Sections
export const getSections = () => client.get('/admin/sections').then((r) => r.data);
export const createSection = (data) => client.post('/admin/sections', data).then((r) => r.data);
export const updateSection = (id, data) => client.put(`/admin/sections/${id}`, data).then((r) => r.data);
export const deleteSection = (id, hard = false) =>
  client.delete(`/admin/sections/${id}`, { params: hard ? { hard: 'true' } : {} }).then((r) => r.data);
export const reorderSections = (id, section_ids) => client.post(`/admin/sections/${id}/reorder`, { section_ids }).then((r) => r.data);

// Questions
export const createQuestion = (data) => client.post('/admin/questions', data).then((r) => r.data);
export const updateQuestion = (id, data) => client.put(`/admin/questions/${id}`, data).then((r) => r.data);
export const deleteQuestion = (id, hard = false) =>
  client.delete(`/admin/questions/${id}`, { params: hard ? { hard: 'true' } : {} }).then((r) => r.data);
export const reorderQuestions = (section_id, question_ids) =>
  client.post('/admin/questions/reorder', { section_id, question_ids }).then((r) => r.data);

// Photo configs
export const getPhotoConfigs = () => client.get('/admin/photo-configs').then((r) => r.data);
export const createPhotoConfig = (data) => client.post('/admin/photo-configs', data).then((r) => r.data);
export const updatePhotoConfig = (id, data) => client.put(`/admin/photo-configs/${id}`, data).then((r) => r.data);
export const deletePhotoConfig = (id) => client.delete(`/admin/photo-configs/${id}`).then((r) => r.data);

// Admin users
export const getAdminUsers = () => client.get('/admin/users').then((r) => r.data);
export const createAdminUser = (data) => client.post('/admin/users', data).then((r) => r.data);
export const updateAdminUser = (id, data) => client.put(`/admin/users/${id}`, data).then((r) => r.data);
export const deleteAdminUser = (id) => client.delete(`/admin/users/${id}`).then((r) => r.data);

// Holiday overrides
export const getHolidayOverrides = () => client.get('/admin/holiday-overrides').then((r) => r.data);
export const createHolidayOverride = (data) => client.post('/admin/holiday-overrides', data).then((r) => r.data);
export const deleteHolidayOverride = (id) => client.delete(`/admin/holiday-overrides/${id}`).then((r) => r.data);

// Holidays (public endpoint, for calendar display)
export const getHolidays = (year) => client.get('/holidays', { params: { year } }).then((r) => r.data);

// Settings
export const getSettings = () => client.get('/admin/settings').then((r) => r.data);
export const updateSettings = (settings) => client.put('/admin/settings', { settings }).then((r) => r.data);

// Inspections
export const getInspections = (params) => client.get('/admin/inspections', { params }).then((r) => r.data);
export const getInspectionDetail = (id) => client.get(`/admin/inspections/${id}`).then((r) => r.data);
export const exportInspections = (params) =>
  client.get('/admin/inspections/export', { params, responseType: 'blob' }).then((r) => r.data);

// Alerts
export const getAlerts = () => client.get('/admin/alerts').then((r) => r.data);
