import { useEffect, useState } from 'react';
import { Title, Tabs, Table, Badge, ActionIcon, Button, Modal, TextInput, Switch, Group, Stack, Center, Loader, Text, Tooltip } from '@mantine/core';
import { IconPlus, IconEdit, IconTrash, IconToggleRight, IconToggleLeft } from '@tabler/icons-react';
import { getPhotoConfigs, createPhotoConfig, updatePhotoConfig, deletePhotoConfig } from '../../api/adminApi.js';
import { notifications } from '@mantine/notifications';
import { useSortableData, SortableTh } from '../../components/admin/SortableTable.jsx';

const EMPTY_FORM = { label: '', is_required: true, display_order: '' };

export function PhotoConfigsPage() {
  const [configs, setConfigs] = useState({ auto: [], moto: [] });
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('auto');
  const [modal, setModal] = useState({ opened: false, config: null });
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const data = await getPhotoConfigs();
      setConfigs(data.photo_configs || { auto: [], moto: [] });
    } catch {
      notifications.show({ message: 'Error al cargar configuraciones.', color: 'red' });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  function openCreate() {
    setForm(EMPTY_FORM);
    setModal({ opened: true, config: null });
  }

  function openEdit(cfg) {
    setForm({ label: cfg.label, is_required: cfg.is_required, display_order: cfg.display_order });
    setModal({ opened: true, config: cfg });
  }

  async function handleSave() {
    setSaving(true);
    try {
      if (modal.config) {
        await updatePhotoConfig(modal.config.id, { ...form, display_order: form.display_order ? parseInt(form.display_order) : undefined });
      } else {
        await createPhotoConfig({ vehicle_type: activeTab, ...form, display_order: form.display_order ? parseInt(form.display_order) : undefined });
      }
      notifications.show({ message: 'Guardado correctamente.', color: 'green' });
      setModal({ opened: false, config: null });
      load();
    } catch (err) {
      notifications.show({ message: err.response?.data?.error || 'Error.', color: 'red' });
    } finally {
      setSaving(false);
    }
  }

  async function toggleConfig(cfg) {
    try {
      await updatePhotoConfig(cfg.id, { is_active: !cfg.is_active });
      notifications.show({ message: cfg.is_active ? 'Configuración desactivada.' : 'Configuración reactivada.', color: 'green' });
      load();
    } catch (err) {
      notifications.show({ message: err.response?.data?.error || 'Error.', color: 'red' });
    }
  }

  async function hardDeleteConfig(cfg) {
    if (!window.confirm(`Eliminar permanentemente "${cfg.label}"? Esta accion no se puede deshacer.`)) return;
    try {
      await deletePhotoConfig(cfg.id, true);
      notifications.show({ message: 'Configuración eliminada permanentemente.', color: 'green' });
      load();
    } catch (err) {
      notifications.show({ message: err.response?.data?.error || 'No se pudo eliminar: puede tener fotos asociadas.', color: 'red' });
    }
  }

  const rows = configs[activeTab] || [];
  const { sorted, sort, onSort } = useSortableData(rows);

  return (
    <div>
      <Group justify="space-between" mb="md">
        <Title order={3}>Configuración de fotos</Title>
        <Button leftSection={<IconPlus size={14} />} onClick={openCreate}>Nueva config</Button>
      </Group>

      <Tabs value={activeTab} onChange={setActiveTab} mb="md">
        <Tabs.List>
          <Tabs.Tab value="auto">Auto</Tabs.Tab>
          <Tabs.Tab value="moto">Moto</Tabs.Tab>
        </Tabs.List>
      </Tabs>

      {loading ? (
        <Center h={200}><Loader /></Center>
      ) : (
        <>
          <Table striped withTableBorder fz="sm">
            <Table.Thead>
              <Table.Tr>
                <SortableTh label="Orden" sortKey="display_order" sort={sort} onSort={onSort} />
                <SortableTh label="Etiqueta" sortKey="label" sort={sort} onSort={onSort} />
                <SortableTh label="Requerida" sortKey="is_required" sort={sort} onSort={onSort} />
                <SortableTh label="Estado" sortKey="is_active" sort={sort} onSort={onSort} />
                <Table.Th></Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {sorted.map((cfg) => (
                <Table.Tr key={cfg.id}>
                  <Table.Td>{cfg.display_order}</Table.Td>
                  <Table.Td>{cfg.label}</Table.Td>
                  <Table.Td><Badge color={cfg.is_required ? 'blue' : 'gray'} variant="light" size="sm">{cfg.is_required ? 'Sí' : 'No'}</Badge></Table.Td>
                  <Table.Td><Badge color={cfg.is_active ? 'green' : 'gray'} variant="light" size="sm">{cfg.is_active ? 'Activa' : 'Inactiva'}</Badge></Table.Td>
                  <Table.Td>
                    <Group gap={4} wrap="nowrap">
                      <ActionIcon variant="light" size="sm" onClick={() => openEdit(cfg)}><IconEdit size={14} /></ActionIcon>
                      <Tooltip label={cfg.is_active ? 'Desactivar' : 'Reactivar'}>
                        <ActionIcon variant="light" size="sm" color={cfg.is_active ? 'orange' : 'green'} onClick={() => toggleConfig(cfg)}>
                          {cfg.is_active ? <IconToggleRight size={14} /> : <IconToggleLeft size={14} />}
                        </ActionIcon>
                      </Tooltip>
                      {!cfg.is_active && (
                        <Tooltip label="Eliminar permanentemente">
                          <ActionIcon variant="light" size="sm" color="red" onClick={() => hardDeleteConfig(cfg)}><IconTrash size={14} /></ActionIcon>
                        </Tooltip>
                      )}
                    </Group>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
          {rows.length === 0 && <Text c="dimmed" ta="center" py="xl">Sin configuraciones para {activeTab}.</Text>}
        </>
      )}

      <Modal opened={modal.opened} onClose={() => setModal({ opened: false, config: null })}
        title={modal.config ? 'Editar configuración' : 'Nueva configuración'} size="sm">
        <Stack gap="sm">
          <TextInput label="Etiqueta" required value={form.label}
            onChange={(e) => setForm({ ...form, label: e.target.value })}
            styles={{ input: { fontSize: 16 } }}
          />
          <TextInput label="Orden de visualización" type="number" value={form.display_order}
            onChange={(e) => setForm({ ...form, display_order: e.target.value })}
            styles={{ input: { fontSize: 16 } }}
          />
          <Switch label="Es requerida" checked={form.is_required}
            onChange={(e) => setForm({ ...form, is_required: e.currentTarget.checked })}
          />
          <Group justify="flex-end">
            <Button variant="default" onClick={() => setModal({ opened: false, config: null })}>Cancelar</Button>
            <Button onClick={handleSave} loading={saving}>Guardar</Button>
          </Group>
        </Stack>
      </Modal>
    </div>
  );
}
