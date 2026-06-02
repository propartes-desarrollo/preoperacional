import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { MantineProvider, createTheme } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';
import '@mantine/dates/styles.css';
import App from './App.jsx';
import { ErrorBoundary } from './components/shared/ErrorBoundary.jsx';
import { getPendingInspections, removeInspection, rebuildFormData } from './utils/offlineQueue.js';
import { submitInspection } from './api/publicApi.js';

// Register PWA service worker
if ('serviceWorker' in navigator) {
  import('virtual:pwa-register').then(({ registerSW }) => {
    registerSW({ immediate: true });
  });
}

async function processOfflineQueue() {
  const pending = await getPendingInspections();
  if (pending.length === 0) return;

  for (const entry of pending) {
    try {
      const fd = await rebuildFormData(entry);
      await submitInspection(fd);
      await removeInspection(entry.id);
      // Guardar en sessionStorage para notificar al usuario cuando abra la app
      const sent = JSON.parse(sessionStorage.getItem('offline_sent') || '[]');
      sent.push({ timestamp: entry.timestamp, sent_at: Date.now() });
      sessionStorage.setItem('offline_sent', JSON.stringify(sent));
    } catch {
      // Si falla, dejar en la cola para el proximo intento
    }
  }
}

window.addEventListener('online', processOfflineQueue);
// Intentar al cargar si hay conexion
if (navigator.onLine) processOfflineQueue();

const theme = createTheme({
  primaryColor: 'blue',
  fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
  defaultRadius: 'md',
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <MantineProvider theme={theme}>
        <Notifications position="top-center" />
        <App />
      </MantineProvider>
    </ErrorBoundary>
  </StrictMode>,
);
