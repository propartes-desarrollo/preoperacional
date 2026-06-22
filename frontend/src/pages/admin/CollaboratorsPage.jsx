import { useEffect, useState, useCallback } from 'react';
import {
  Title, Group, Button, TextInput, Select, Table, Badge, ActionIcon,
  Pagination, Text, Center, Loader, Alert, Tooltip, Switch, Modal, Stack
} from '@mantine/core';
import { IconSearch, IconEdit, IconTrash, IconUpload, IconPlus, IconUserOff, IconUserCheck, IconDownload } from '@tabler/icons-react';
import { getCollaborators, deleteCollaborator, updateCollaborator, exportCollaborators } from '../../api/adminApi.js';
import { notifications } from '@mantine/notifications';
import { CollaboratorFormModal } from './CollaboratorFormModal.jsx';
import { ImportCsvModal } from './ImportCsvModal.jsx';
import { useSortableData, SortableTh } from '../../components/admin/SortableTable.jsx';

export function CollaboratorsPage() {
  const [data, setData] = useState({ data: [], total: 0, page: 1, limit: 50 });
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [isActiveFilter, setIsActiveFilter] = useState('');
  const [frequencyFilter, setFrequencyFilter] = useState('');
  const [untypedFilter, setUntypedFilter] = useState('');
  const [page, setPage] = useState(1);
  const [formModal, setFormModal] = useState({ opened: false, collaborator: null });
  const [importModal, setImportModal] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [deleteModal, setDeleteModal] = useState({ opened: false, collaborator: null });
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 50 };
      if (search) params.search = search;
      if (isActiveFilter !== '') params.is_active = isActiveFilter;
      if (frequencyFilter !== '') params.frequency = frequencyFilter;
      if (untypedFilter === 'untyped') params.untyped = 'true';
      const result = await getCollaborators(params);
      setData(result);
    } catch {
      notifications.show({ message: 'Error al cargar colaboradores.', color: 'red' });
    } finally {
      setLoading(false);
    }
  }, [page, search, isActiveFilter, frequencyFilter, untypedFilter]);

  useEffect(() => { load(); }, [load]);

  async function handleToggleActive(col) {
    try {
      await updateCollaborator(col.id, { is_active: !col.is_active });
      load();
    } catch {
      notifications.show({ message: 'Error al actualizar estado.', color: 'red' });
    }
  }

  async function handleExport() {
    setExporting(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (isActiveFilter !== '') params.is_active = isActiveFilter;
      if (frequencyFilter !== '') params.frequency = frequencyFilter;
      const blob = await exportCollaborators(params);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `colaboradores_${new Date().toISOString().substring(0, 10)}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      notifications.show({ message: 'Error al exportar colaboradores.', color: 'red' });
    } finally {
      setExporting(false);
    }
  }

  async function confirmDelete() {
    const col = deleteModal.collaborator;
    if (!col) return;
    setDeleting(true);
    try {
      await deleteCollaborator(col.id, true);
      setDeleteModal({ opened: false, collaborator: null });
      load();
      notifications.show({ message: 'Colaborador eliminado.', color: 'green' });
    } catch (err) {
      notifications.show({
        message: err.response?.data?.error || 'No se pudo eliminar el colaborador.',
        color: 'red',
        autoClose: 7000,
      });
    } finally {
      setDeleting(false);
    }
  }

  const { sorted, sort, onSort } = useSortableData(data.data);
  const totalPages = Math.ceil(data.total / data.limit);

  return (
    <div>
      <Group justify="space-between" mb="md">
        <Title order={3}>Colaboradores</Title>
        <Group gap="xs">
          <Button leftSection={<IconDownload size={14} />} variant="light" color="green" loading={exporting} onClick={handleExport}>
            Exportar Excel
          </Button>
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
        <Select
          placeholder="Tipo"
          data={[{ value: 'untyped', label: 'Sin tipo' }]}
          value={untypedFilter || null} onChange={(v) => { setUntypedFilter(v || ''); setPage(1); }}
          clearable style={{ width: 130 }}
        />
      </Group>

      {loading ? (
        <Center h={200}><Loader /></Center>
      ) : (
        <>
          <Table striped highlightOnHover withTableBorder fz="sm">
            <Table.Thead>
              <Table.Tr>
                <SortableTh label="Cédula" sortKey="cedula" sort={sort} onSort={onSort} />
                <SortableTh label="Nombres" sortKey="first_name" sort={sort} onSort={onSort} />
                <SortableTh label="Apellidos" sortKey="last_name" sort={sort} onSort={onSort} />
                <SortableTh label="Tipo" sortKey="collaborator_type_name" sort={sort} onSort={onSort} />
                <SortableTh label="Teléfono" sortKey="phone" sort={sort} onSort={onSort} />
                <Table.Th>Vehículos</Table.Th>
                <SortableTh label="Frecuencia" sortKey="inspection_frequency" sort={sort} onSort={onSort} />
                <SortableTh label="Estado" sortKey="is_active" sort={sort} onSort={onSort} />
                <SortableTh label="Última inspección" sortKey="last_inspection_date" sort={sort} onSort={onSort} />
                <Table.Th></Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {sorted.map((col) => (
                <Table.Tr key={col.id}>
                  <Table.Td>{col.cedula}</Table.Td>
                  <Table.Td>{col.first_name}</Table.Td>
                  <Table.Td>{col.last_name}</Table.Td>
                  <Table.Td>
                    {col.collaborator_type_name
                      ? <Badge variant="light" color={col.uses_company_vehicles ? 'teal' : 'gray'} size="sm">{col.collaborator_type_name}</Badge>
                      : <Text size="xs" c="dimmed">-</Text>}
                  </Table.Td>
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
                      <Tooltip label="Eliminar colaborador">
                        <ActionIcon variant="light" color="red" onClick={() => setDeleteModal({ opened: true, collaborator: col })}>
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

      <Modal
        opened={deleteModal.opened}
        onClose={() => setDeleteModal({ opened: false, collaborator: null })}
        title="Eliminar colaborador"
        size="sm"
        centered
      >
        <Stack gap="md">
          <Text size="sm">
            ¿Seguro que deseas eliminar a{' '}
            <strong>{deleteModal.collaborator?.first_name} {deleteModal.collaborator?.last_name}</strong>{' '}
            (cédula {deleteModal.collaborator?.cedula})? Esta acción no se puede deshacer.
          </Text>
          <Text size="xs" c="dimmed">
            Si el colaborador tiene inspecciones registradas, no podrá eliminarse; en ese caso usa "Desactivar".
          </Text>
          <Group justify="flex-end">
            <Button variant="default" onClick={() => setDeleteModal({ opened: false, collaborator: null })}>
              Cancelar
            </Button>
            <Button color="red" loading={deleting} onClick={confirmDelete}>
              Eliminar
            </Button>
          </Group>
        </Stack>
      </Modal>
    </div>
  );
}
