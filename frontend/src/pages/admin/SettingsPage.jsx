import { useEffect, useState } from 'react';
import { Title, TextInput, NumberInput, Button, Stack, Paper, Text, Alert, Loader, Center, Divider } from '@mantine/core';
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
      const reminderTime = settings.whatsapp_reminder_time || '07:55';
      if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(reminderTime)) {
        notifications.show({ message: 'La hora de recordatorio debe tener formato HH:MM (ej: 07:55).', color: 'red' });
        setSaving(false);
        return;
      }

      const toUpdate = [
        { key: 'whatsapp_alert_threshold', value: String(settings.whatsapp_alert_threshold || '6') },
        { key: 'whatsapp_reminder_time', value: reminderTime },
      ];
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
              label="Umbral de dias para alerta de inactividad"
              description="Dias habiles consecutivos sin inspeccion para enviar alerta por correo al administrador"
              value={parseInt(settings.whatsapp_alert_threshold || '6')}
              onChange={(v) => setSettings({ ...settings, whatsapp_alert_threshold: String(v) })}
              min={1} max={365} required
            />
            <Divider label="Recordatorio diario WhatsApp" labelPosition="left" />

            <TextInput
              label="Hora de envio del recordatorio"
              description="Hora en que se envia el mensaje diario a colaboradores activos (zona America/Bogota, formato HH:MM)"
              placeholder="07:55"
              value={settings.whatsapp_reminder_time || ''}
              onChange={(e) => setSettings({ ...settings, whatsapp_reminder_time: e.target.value })}
              styles={{ input: { fontSize: 16 } }}
              maxLength={5}
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
