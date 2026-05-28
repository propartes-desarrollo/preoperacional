import client from './client.js';

export const sendMagicLink = (email) =>
  client.post('/auth/magic-link', { email });

export const verifyMagicLink = (token) =>
  client.post('/auth/verify', { token });

export const getMe = () => client.get('/auth/me');
