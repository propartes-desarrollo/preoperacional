import { useState, useEffect } from 'react';
import { Modal, TextInput, Switch, Button, Stack, Group, ActionIcon, Text, Divider, Select, SegmentedControl } from '@mantine/core';
import { IconPlus, IconTrash } from '@tabler/icons-react';
import { createCollaborator, updateCollaborator, getCollaboratorTypes } from '../../api/adminApi.js';
import { notifications } from '@mantine/notifications';

const VEHICLE_TYPES = [
  { value: 'auto', label: 'Auto' },
  { value: 'moto', label: 'Moto' },
];

function detectType(plate) {
  const p = plate.toUpperCase().replace(/\s/g, '');
  if (/^[A-Z]{3}\d{3}$/.test(p)) return 'auto';
  if (/^[A-Z]{3}\d{2}[A-Z]$/.test(p)) return 'moto';
  return null;
}

export function CollaboratorFormModal({ opened, onClose, collaborator, onSaved }) {
  const isEdit = !!collaborator;
  const [form, setForm] = useState({ cedula: '', first_name: '', last_name: '', phone: '', is_active: true, inspection_frequency: 'daily', collaborator_type_id: null });
  const [vehicles, setVehicles] = useState([{ plate: '', vehicle_type: '' }]);
  const [types, setTypes] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!opened) return;
    getCollaboratorTypes()
      .then((data) => setTypes((data.types || []).filter((t) => t.is_active)))
      .catch(() => setTypes([]));
  }, [opened]);

  useEffect(() => {
    if (collaborator) {
      setForm({
        cedula: collaborator.cedula || '',
        first_name: collaborator.first_name || '',
        last_name: collaborator.last_name || '',
        phone: collaborator.phone || '',
        is_active: collaborator.is_active ?? true,
        inspection_frequency: collaborator.inspection_frequency || 'daily',
        collaborator_type_id: collaborator.collaborator_type_id ? String(collaborator.collaborator_type_id) : null,
      });
      setVehicles(collaborator.vehicles?.length > 0
        ? collaborator.vehicles.map((v) => ({ plate: v.plate, vehicle_type: v.vehicle_type || '' }))
        : [{ plate: '', vehicle_type: '' }]
      );
    } else {
      setForm({ cedula: '', first_name: '', last_name: '', phone: '', is_active: true, inspection_frequency: 'daily', collaborator_type_id: null });
      setVehicles([{ plate: '', vehicle_type: '' }]);
    }
  }, [collaborator, opened]);

  const selectedType = types.find((t) => String(t.id) === form.collaborator_type_id);
  const usesCompanyVehicles = selectedType?.uses_company_vehicles ?? false;

  function updateVehicle(idx, field, value) {
    setVehicles((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: value };
      if (field === 'plate') {
        const detected = detectType(value);
        if (detected) next[idx].vehicle_type = detected;
      }
      return next;
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        ...form,
        collaborator_type_id: form.collaborator_type_id ? parseInt(form.collaborator_type_id, 10) : null,
        vehicles: vehicles.filter((v) => v.plate.trim()).map((v) => ({
          plate: v.plate.trim().toUpperCase(),
          vehicle_type: v.vehicle_type || null,
        })),
      };
      if (isEdit) {
        await updateCollaborator(collaborator.id, payload);
      } else {
        await createCollaborator(payload);
      }
      notifications.show({ message: isEdit ? 'Colaborador actualizado.' : 'Colaborador creado.', color: 'green' });
      onSaved();
      onClose();
    } catch (err) {
      notifications.show({ message: err.response?.data?.error || 'Error al guardar.', color: 'red' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal opened={opened} onClose={onClose} title={isEdit ? 'Editar colaborador' : 'Nuevo colaborador'} size="md">
      <form onSubmit={handleSubmit}>
        <Stack gap="sm">
          <TextInput
            label="Cédula" required value={form.cedula} disabled={isEdit}
            onChange={(e) => setForm({ ...form, cedula: e.target.value })}
            styles={{ input: { fontSize: 16 } }}
          />
          <Group grow>
            <TextInput label="Nombre" required value={form.first_name}
              onChange={(e) => setForm({ ...form, first_name: e.target.value })}
              styles={{ input: { fontSize: 16 } }}
            />
            <TextInput label="Apellidos" required value={form.last_name}
              onChange={(e) => setForm({ ...form, last_name: e.target.value })}
              styles={{ input: { fontSize: 16 } }}
            />
          </Group>
          <TextInput label="Teléfono" value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            styles={{ input: { fontSize: 16 } }}
          />
          <Switch label="Activo" checked={form.is_active}
            onChange={(e) => setForm({ ...form, is_active: e.currentTarget.checked })}
          />
          <Select
            label="Tipo de usuario"
            placeholder="Seleccionar"
            data={types.map((t) => ({ value: String(t.id), label: t.name }))}
            value={form.collaborator_type_id}
            onChange={(v) => setForm({ ...form, collaborator_type_id: v })}
            clearable
            styles={{ input: { fontSize: 16 } }}
          />
          <Text size="sm" fw={500}>Frecuencia de inspección</Text>
          <SegmentedControl
            fullWidth
            value={form.inspection_frequency}
            onChange={(v) => setForm({ ...form, inspection_frequency: v })}
            data={[
              { value: 'daily', label: 'Diario (días hábiles)' },
              { value: 'eventual', label: 'Eventual' },
            ]}
          />

          <Divider label={usesCompanyVehicles ? 'Placas asignadas (vehículos de empresa)' : 'Vehículos'} labelPosition="left" />
          {usesCompanyVehicles && (
            <Text size="xs" c="dimmed">
              Este colaborador eligirá una de estas placas al diligenciar el formulario.
            </Text>
          )}

          {vehicles.map((v, idx) => (
            <Group key={idx} align="flex-end" gap="xs">
              <TextInput
                label="Placa" placeholder="ABC123" style={{ flex: 1 }}
                value={v.plate}
                onChange={(e) => updateVehicle(idx, 'plate', e.target.value)}
                styles={{ input: { fontSize: 16 } }}
              />
              <Select
                label="Tipo" placeholder="Auto-det." data={VEHICLE_TYPES} style={{ width: 110 }}
                value={v.vehicle_type || null}
                onChange={(val) => updateVehicle(idx, 'vehicle_type', val || '')}
                clearable
              />
              {vehicles.length > 1 && (
                <ActionIcon color="red" variant="light" mb={1}
                  onClick={() => setVehicles((p) => p.filter((_, i) => i !== idx))}>
                  <IconTrash size={16} />
                </ActionIcon>
              )}
            </Group>
          ))}

          <Button
            leftSection={<IconPlus size={14} />} variant="light" size="xs"
            onClick={() => setVehicles((p) => [...p, { plate: '', vehicle_type: '' }])}
          >
            Agregar vehículo
          </Button>

          <Group justify="flex-end" mt="sm">
            <Button variant="default" onClick={onClose}>Cancelar</Button>
            <Button type="submit" loading={loading}>Guardar</Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}
