import { useEffect, useState } from 'react';
import { Title, Table, Badge, ActionIcon, Button, Modal, TextInput, Select, Group, Stack, Center, Loader, Text, Alert } from '@mantine/core';
import { IconPlus, IconEdit, IconTrash } from '@tabler/icons-react';
import { getAdminUsers, createAdminUser, updateAdminUser, deleteAdminUser } from '../../api/adminApi.js';
import { notifications } from '@mantine/notifications';
import { useAdmin } from '../../context/AdminContext.jsx';
import { useSortableData, SortableTh } from '../../components/admin/SortableTable.jsx';

const EMPTY_FORM = { email: '', name: '', role: 'admin' };
const ROLES = [{ value: 'admin', label: 'Admin' }, { value: 'superadmin', label: 'Superadmin' }];

export function AdminUsersPage() {
  const { user: currentUser } = useAdmin();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState({ opened: false, user: null });
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const data = await getAdminUsers();
      setUsers(data.users || []);
    } catch {
      notifications.show({ message: 'Error al cargar usuarios.', color: 'red' });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  function openCreate() {
    setForm(EMPTY_FORM);
    setModal({ opened: true, user: null });
  }

  function openEdit(u) {
    setForm({ email: u.email, name: u.name, role: u.role });
    setModal({ opened: true, user: u });
  }

  async function handleSave() {
    setSaving(true);
    try {
      if (modal.user) {
        await updateAdminUser(modal.user.id, { name: form.name, role: form.role });
      } else {
        await createAdminUser(form);
      }
      notifications.show({ message: 'Usuario guardado.', color: 'green' });
      setModal({ opened: false, user: null });
      load();
    } catch (err) {
      notifications.show({ message: err.response?.data?.error || 'Error.', color: 'red' });
    } finally {
      setSaving(false);
    }
  }

  const { sorted, sort, onSort } = useSortableData(users);

  async function handleDelete(u) {
    if (u.id === currentUser?.id) {
      notifications.show({ message: 'No puedes eliminarte a ti mismo.', color: 'orange' });
      return;
    }
    if (!window.confirm(`Eliminar usuario ${u.email}?`)) return;
    try {
      await deleteAdminUser(u.id);
      load();
    } catch (err) {
      notifications.show({ message: err.response?.data?.error || 'Error.', color: 'red' });
    }
  }

  return (
    <div>
      <Group justify="space-between" mb="md">
        <Title order={3}>Usuarios administradores</Title>
        <Button leftSection={<IconPlus size={14} />} onClick={openCreate}>Nuevo admin</Button>
      </Group>

      {loading ? (
        <Center h={200}><Loader /></Center>
      ) : (
        <Table striped withTableBorder fz="sm">
          <Table.Thead>
            <Table.Tr>
              <SortableTh label="Email" sortKey="email" sort={sort} onSort={onSort} />
              <SortableTh label="Nombre" sortKey="name" sort={sort} onSort={onSort} />
              <SortableTh label="Rol" sortKey="role" sort={sort} onSort={onSort} />
              <SortableTh label="Estado" sortKey="is_active" sort={sort} onSort={onSort} />
              <Table.Th></Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {sorted.map((u) => (
              <Table.Tr key={u.id}>
                <Table.Td>{u.email}</Table.Td>
                <Table.Td>{u.name}</Table.Td>
                <Table.Td><Badge color={u.role === 'superadmin' ? 'violet' : 'blue'} variant="light">{u.role}</Badge></Table.Td>
                <Table.Td><Badge color={u.is_active ? 'green' : 'gray'} variant="light" size="sm">{u.is_active ? 'Activo' : 'Inactivo'}</Badge></Table.Td>
                <Table.Td>
                  <Group gap={4}>
                    <ActionIcon variant="light" size="sm" onClick={() => openEdit(u)}><IconEdit size={14} /></ActionIcon>
                    <ActionIcon variant="light" size="sm" color="red" onClick={() => handleDelete(u)}
                      disabled={u.id === currentUser?.id}>
                      <IconTrash size={14} />
                    </ActionIcon>
                  </Group>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      )}

      <Modal opened={modal.opened} onClose={() => setModal({ opened: false, user: null })}
        title={modal.user ? 'Editar usuario' : 'Nuevo administrador'} size="sm">
        <Stack gap="sm">
          <TextInput label="Email" type="email" required value={form.email} disabled={!!modal.user}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            styles={{ input: { fontSize: 16 } }}
          />
          <TextInput label="Nombre" required value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            styles={{ input: { fontSize: 16 } }}
          />
          <Select label="Rol" data={ROLES} value={form.role}
            onChange={(v) => setForm({ ...form, role: v })}
            disabled={modal.user?.id === currentUser?.id}
          />
          {modal.user?.id === currentUser?.id && (
            <Text size="xs" c="dimmed">No puedes cambiar tu propio rol.</Text>
          )}
          <Group justify="flex-end">
            <Button variant="default" onClick={() => setModal({ opened: false, user: null })}>Cancelar</Button>
            <Button onClick={handleSave} loading={saving}>Guardar</Button>
          </Group>
        </Stack>
      </Modal>
    </div>
  );
}
