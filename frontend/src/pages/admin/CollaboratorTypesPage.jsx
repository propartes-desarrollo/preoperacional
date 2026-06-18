import { useEffect, useState } from 'react';
import {
  Title, Group, Button, Table, Badge, ActionIcon, Modal, TextInput, Switch,
  Stack, Center, Loader, Text, Tooltip,
} from '@mantine/core';
import { IconPlus, IconEdit, IconTrash } from '@tabler/icons-react';
import {
  getCollaboratorTypes, createCollaboratorType, updateCollaboratorType, deleteCollaboratorType,
} from '../../api/adminApi.js';
import { notifications } from '@mantine/notifications';
import { useSortableData, SortableTh } from '../../components/admin/SortableTable.jsx';

const EMPTY_FORM = { name: '', uses_company_vehicles: false, is_active: true };

export function CollaboratorTypesPage() {
  const [types, setTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState({ opened: false, type: null });
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const data = await getCollaboratorTypes();
      setTypes(data.types || []);
    } catch {
      notifications.show({ message: 'Error al cargar tipos de usuario.', color: 'red' });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  function openCreate() {
    setForm(EMPTY_FORM);
    setModal({ opened: true, type: null });
  }

  function openEdit(t) {
    setForm({ name: t.name, uses_company_vehicles: t.uses_company_vehicles, is_active: t.is_active });
    setModal({ opened: true, type: t });
  }

  async function handleSave() {
    if (!form.name.trim()) {
      notifications.show({ message: 'El nombre es requerido.', color: 'red' });
      return;
    }
    setSaving(true);
    try {
      if (modal.type) {
        await updateCollaboratorType(modal.type.id, form);
      } else {
        await createCollaboratorType(form);
      }
      notifications.show({ message: 'Tipo guardado.', color: 'green' });
      setModal({ opened: false, type: null });
      load();
    } catch (err) {
      notifications.show({ message: err.response?.data?.error || 'Error al guardar.', color: 'red' });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(t) {
    if (!window.confirm(`Eliminar el tipo "${t.name}"?`)) return;
    try {
      await deleteCollaboratorType(t.id);
      notifications.show({ message: 'Tipo eliminado.', color: 'green' });
      load();
    } catch (err) {
      notifications.show({ message: err.response?.data?.error || 'No se pudo eliminar.', color: 'red' });
    }
  }

  const { sorted, sort, onSort } = useSortableData(types);

  if (loading) return <Center h={200}><Loader /></Center>;

  return (
    <div>
      <Group justify="space-between" mb="md">
        <Title order={3}>Tipos de usuario</Title>
        <Button leftSection={<IconPlus size={14} />} onClick={openCreate}>Nuevo tipo</Button>
      </Group>

      <Text size="sm" c="dimmed" mb="md">
        Los tipos con "usa vehículos de empresa" activado permiten asignar placas al colaborador,
        que luego elige del listado al diligenciar. Los demás escriben su placa manualmente.
      </Text>

      <Table striped withTableBorder fz="sm">
        <Table.Thead>
          <Table.Tr>
            <SortableTh label="Nombre" sortKey="name" sort={sort} onSort={onSort} />
            <SortableTh label="Usa vehículos de empresa" sortKey="uses_company_vehicles" sort={sort} onSort={onSort} />
            <SortableTh label="Colaboradores" sortKey="collaborators_count" sort={sort} onSort={onSort} />
            <SortableTh label="Estado" sortKey="is_active" sort={sort} onSort={onSort} />
            <Table.Th></Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {sorted.map((t) => (
            <Table.Tr key={t.id}>
              <Table.Td>{t.name}</Table.Td>
              <Table.Td>
                <Badge color={t.uses_company_vehicles ? 'blue' : 'gray'} variant="light" size="sm">
                  {t.uses_company_vehicles ? 'Sí' : 'No'}
                </Badge>
              </Table.Td>
              <Table.Td>{t.collaborators_count}</Table.Td>
              <Table.Td>
                <Badge color={t.is_active ? 'green' : 'gray'} variant="light" size="sm">
                  {t.is_active ? 'Activo' : 'Inactivo'}
                </Badge>
              </Table.Td>
              <Table.Td>
                <Group gap={4} wrap="nowrap">
                  <ActionIcon variant="light" size="sm" onClick={() => openEdit(t)}><IconEdit size={14} /></ActionIcon>
                  <Tooltip label={t.collaborators_count > 0 ? 'Tiene colaboradores asociados' : 'Eliminar'}>
                    <ActionIcon
                      variant="light" size="sm" color="red"
                      onClick={() => handleDelete(t)}
                      disabled={t.collaborators_count > 0}
                    >
                      <IconTrash size={14} />
                    </ActionIcon>
                  </Tooltip>
                </Group>
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
      {types.length === 0 && <Text c="dimmed" ta="center" py="xl">No hay tipos de usuario.</Text>}

      <Modal
        opened={modal.opened}
        onClose={() => setModal({ opened: false, type: null })}
        title={modal.type ? 'Editar tipo de usuario' : 'Nuevo tipo de usuario'}
        size="sm"
      >
        <Stack gap="sm">
          <TextInput
            label="Nombre" required value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            styles={{ input: { fontSize: 16 } }}
          />
          <Switch
            label="Usa vehículos de empresa"
            description="Activa el listado de placas asignadas en el formulario"
            checked={form.uses_company_vehicles}
            onChange={(e) => setForm({ ...form, uses_company_vehicles: e.currentTarget.checked })}
          />
          <Switch
            label="Activo"
            checked={form.is_active}
            onChange={(e) => setForm({ ...form, is_active: e.currentTarget.checked })}
          />
          <Group justify="flex-end">
            <Button variant="default" onClick={() => setModal({ opened: false, type: null })}>Cancelar</Button>
            <Button onClick={handleSave} loading={saving}>Guardar</Button>
          </Group>
        </Stack>
      </Modal>
    </div>
  );
}
