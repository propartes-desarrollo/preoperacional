import { useEffect, useState, useCallback } from 'react';
import {
  Title, Group, Button, TextInput, Select, Table, Badge, ActionIcon,
  Pagination, Text, Center, Loader, Alert, Tooltip, Switch
} from '@mantine/core';
import { IconSearch, IconEdit, IconTrash, IconUpload, IconPlus, IconUserOff, IconUserCheck } from '@tabler/icons-react';
import { getCollaborators, deleteCollaborator, updateCollaborator } from '../../api/adminApi.js';
import { notifications } from '@mantine/notifications';
import { CollaboratorFormModal } from './CollaboratorFormModal.jsx';
import { ImportCsvModal } from './ImportCsvModal.jsx';

export function CollaboratorsPage() {
  const [data, setData] = useState({ data: [], total: 0, page: 1, limit: 50 });
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [isActiveFilter, setIsActiveFilter] = useState('');
  const [frequencyFilter, setFrequencyFilter] = useState('');
  const [page, setPage] = useState(1);
  const [formModal, setFormModal] = useState({ opened: false, collaborator: null });
  const [importModal, setImportModal] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 50 };
      if (search) params.search = search;
      if (isActiveFilter !== '') params.is_active = isActiveFilter;
      if (frequencyFilter !== '') params.frequency = frequencyFilter;
      const result = await getCollaborators(params);
      setData(result);
    } catch {
      notifications.show({ message: 'Error al cargar colaboradores.', color: 'red' });
    } finally {
      setLoading(false);
    }
  }, [page, search, isActiveFilter, frequencyFilter]);

  useEffect(() => { load(); }, [load]);

  async function handleToggleActive(col) {
    try {
      await updateCollaborator(col.id, { is_active: !col.is_active });
      load();
    } catch {
      notifications.show({ message: 'Error al actualizar estado.', color: 'red' });
    }
  }

  async function handleDelete(col) {
    if (!window.confirm(`Desactivar a ${col.first_name} ${col.last_name}?`)) return;
    try {
      await deleteCollaborator(col.id, false);
      load();
      notifications.show({ message: 'Colaborador desactivado.', color: 'green' });
    } catch (err) {
      notifications.show({ message: err.response?.data?.error || 'Error al eliminar.', color: 'red' });
    }
  }

  const totalPages = Math.ceil(data.total / data.limit);

  return (
    <div>
      <Group justify="space-between" mb="md">
        <Title order={3}>Colaboradores</Title>
        <Group gap="xs">
          <Button leftSection={<IconUpload size={14} />} variant="light" onClick={() => setImportModal(true)}>
            Importar CSV
          </Button>
          <Button leftSection={<IconPlus size={14} />} onClick={() => setFormModal({ opened: true, collaborator: null })}>
            Nuevo colaborador
          </Button>
        </Group>
      </Group>

      <Group mb="md" gap="xs">
        <TextInput
          placeholder="Buscar por cedula, nombre..." leftSection={<IconSearch size={14} />}
          value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          style={{ flex: 1 }} styles={{ input: { fontSize: 14 } }}
        />
        <Select
          placeholder="Estado" data={[{ value: 'true', label: 'Activos' }, { value: 'false', label: 'Inactivos' }]}
          value={isActiveFilter || null} onChange={(v) => { setIsActiveFilter(v || ''); setPage(1); }}
          clearable style={{ width: 140 }}
        />
        <Select
          placeholder="Frecuencia"
          data={[{ value: 'daily', label: 'Diario' }, { value: 'eventual', label: 'Eventual' }]}
          value={frequencyFilter || null} onChange={(v) => { setFrequencyFilter(v || ''); setPage(1); }}
          clearable style={{ width: 140 }}
        />
      </Group>

      {loading ? (
        <Center h={200}><Loader /></Center>
      ) : (
        <>
          <Table striped highlightOnHover withTableBorder fz="sm">
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Cedula</Table.Th>
                <Table.Th>Nombre</Table.Th>
                <Table.Th>Telefono</Table.Th>
                <Table.Th>Vehiculos</Table.Th>
                <Table.Th>Frecuencia</Table.Th>
                <Table.Th>Estado</Table.Th>
                <Table.Th>Ultima inspeccion</Table.Th>
                <Table.Th></Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {data.data.map((col) => (
                <Table.Tr key={col.id}>
                  <Table.Td>{col.cedula}</Table.Td>
                  <Table.Td>{col.first_name} {col.last_name}</Table.Td>
                  <Table.Td>{col.phone || '-'}</Table.Td>
                  <Table.Td>
                    <Group gap={4}>
                      {(col.vehicles || []).map((v) => (
                        <Badge key={v.id} variant="light" size="sm" color={v.vehicle_type === 'moto' ? 'orange' : 'blue'}>
                          {v.plate}
                        </Badge>
                      ))}
                    </Group>
                  </Table.Td>
                  <Table.Td>
                    <Badge variant="light" color={col.inspection_frequency === 'eventual' ? 'grape' : 'blue'} size="sm">
                      {col.inspection_frequency === 'eventual' ? 'Eventual' : 'Diario'}
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    <Badge variant="light" color={col.is_active ? 'green' : 'gray'}>
                      {col.is_active ? 'Activo' : 'Inactivo'}
                    </Badge>
                  </Table.Td>
                  <Table.Td>{col.last_inspection_date || '-'}</Table.Td>
                  <Table.Td>
                    <Group gap={4} wrap="nowrap">
                      <Tooltip label="Editar">
                        <ActionIcon variant="light" onClick={() => setFormModal({ opened: true, collaborator: col })}>
                          <IconEdit size={16} />
                        </ActionIcon>
                      </Tooltip>
                      <Tooltip label={col.is_active ? 'Desactivar' : 'Activar'}>
                        <ActionIcon
                          variant="light"
                          color={col.is_active ? 'orange' : 'green'}
                          onClick={() => handleToggleActive(col)}
                        >
                          {col.is_active ? <IconUserOff size={16} /> : <IconUserCheck size={16} />}
                        </ActionIcon>
                      </Tooltip>
                      <Tooltip label="Eliminar (soft delete)">
                        <ActionIcon variant="light" color="red" onClick={() => handleDelete(col)}>
                          <IconTrash size={16} />
                        </ActionIcon>
                      </Tooltip>
                    </Group>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>

          {data.data.length === 0 && (
            <Text c="dimmed" ta="center" py="xl">No se encontraron colaboradores.</Text>
          )}

          {totalPages > 1 && (
            <Group justify="center" mt="md">
              <Pagination value={page} onChange={setPage} total={totalPages} />
            </Group>
          )}
        </>
      )}

      <CollaboratorFormModal
        opened={formModal.opened}
        collaborator={formModal.collaborator}
        onClose={() => setFormModal({ opened: false, collaborator: null })}
        onSaved={load}
      />
      <ImportCsvModal opened={importModal} onClose={() => setImportModal(false)} onImported={load} />
    </div>
  );
}
