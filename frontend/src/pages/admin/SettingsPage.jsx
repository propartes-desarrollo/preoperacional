import { useEffect, useState } from 'react';
import { Title, TextInput, NumberInput, Button, Stack, Paper, Text, Alert, Loader, Center } from '@mantine/core';
import { getSettings, updateSettings } from '../../api/adminApi.js';
import { notifications } from '@mantine/notifications';

export function SettingsPage() {
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const data = await getSettings();
      const map = {};
      for (const s of (data.settings || [])) map[s.key] = s.value;
      setSettings(map);
    } catch {
      notifications.show({ message: 'Error al cargar configuracion.', color: 'red' });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const toUpdate = [
        { key: 'whatsapp_alert_threshold', value: String(settings.whatsapp_alert_threshold || '6') },
        { key: 'report_email', value: settings.report_email || '' },
        { key: 'whatsapp_admin_phone', value: settings.whatsapp_admin_phone || '' },
      ].filter((s) => s.value !== '');
      await updateSettings(toUpdate);
      notifications.show({ message: 'Configuracion guardada.', color: 'green' });
      load();
    } catch (err) {
      notifications.show({ message: err.response?.data?.error || 'Error al guardar.', color: 'red' });
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <Center h={200}><Loader /></Center>;

  return (
    <div>
      <Title order={3} mb="md">Configuracion</Title>
      <Paper withBorder p="xl" maw={500}>
        <form onSubmit={handleSave}>
          <Stack gap="md">
            <NumberInput
              label="Umbral de dias para alerta WhatsApp"
              description="Dias habiles consecutivos sin inspeccion para activar alerta"
              value={parseInt(settings.whatsapp_alert_threshold || '6')}
              onChange={(v) => setSettings({ ...settings, whatsapp_alert_threshold: String(v) })}
              min={1} max={365} required
            />
            <TextInput
              label="Email del administrador para reportes"
              type="email"
              value={settings.report_email || ''}
              onChange={(e) => setSettings({ ...settings, report_email: e.target.value })}
              styles={{ input: { fontSize: 16 } }}
            />
            <TextInput
              label="Telefono WhatsApp del administrador"
              description="Formato internacional sin + (ej: 573001234567)"
              value={settings.whatsapp_admin_phone || ''}
              onChange={(e) => setSettings({ ...settings, whatsapp_admin_phone: e.target.value })}
              styles={{ input: { fontSize: 16 } }}
            />
            <Button type="submit" loading={saving} w="fit-content">
              Guardar cambios
            </Button>
          </Stack>
        </form>
      </Paper>
    </div>
  );
}
