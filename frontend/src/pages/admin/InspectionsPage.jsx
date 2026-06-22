import { useState, useEffect, useCallback } from 'react';
import {
  Title, Group, Button, TextInput, Select, Table, Badge, ActionIcon,
  Pagination, Text, Center, Loader, Tooltip, Stack, Modal, Textarea
} from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { IconSearch, IconFileExport, IconEye, IconTrash, IconHistory } from '@tabler/icons-react';
import {
  getInspections, getInspectionDetail, exportInspections, deleteInspection, getInspectionDeletions,
} from '../../api/adminApi.js';
import { notifications } from '@mantine/notifications';
import { InspectionDetailDrawer } from './InspectionDetailDrawer.jsx';
import { useSortableData, SortableTh } from '../../components/admin/SortableTable.jsx';

export function InspectionsPage() {
  const [data, setData] = useState({ data: [], total: 0, page: 1, limit: 50 });
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({
    code: '', cedula: '', plate: '', name: '', vehicle_type: '', date_from: null, date_to: null, has_malo: '',
  });
  const [activeFilters, setActiveFilters] = useState({});
  const [drawer, setDrawer] = useState({ opened: false, inspection: null });
  const [exporting, setExporting] = useState(false);
  const [deleteModal, setDeleteModal] = useState({ opened: false, row: null });
  const [deleteReason, setDeleteReason] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [deletionsModal, setDeletionsModal] = useState(false);
  const [deletions, setDeletions] = useState([]);
  const [loadingDeletions, setLoadingDeletions] = useState(false);

  const load = useCallback(async (params) => {
    setLoading(true);
    try {
      const result = await getInspections({ ...params, page });
      setData(result);
    } catch {
      notifications.show({ message: 'Error al cargar inspecciones.', color: 'red' });
    } finally {
      setLoading(false);
    }
  }, [page]);

  // Carga inicial y al cambiar de pagina o de filtros aplicados
  useEffect(() => {
    load(activeFilters);
  }, [load, activeFilters]);

  function handleSearch() {
    const params = {};
    if (filters.code) params.code = filters.code;
    if (filters.cedula) params.cedula = filters.cedula;
    if (filters.plate) params.plate = filters.plate;
    if (filters.name) params.name = filters.name;
    if (filters.vehicle_type) params.vehicle_type = filters.vehicle_type;
    if (filters.date_from) params.date_from = filters.date_from.toISOString().substring(0, 10);
    if (filters.date_to) params.date_to = filters.date_to.toISOString().substring(0, 10);
    if (filters.has_malo === 'true') params.has_malo = 'true';
    setPage(1);
    setActiveFilters(params);
  }

  async function openDetail(row) {
    try {
      const detail = await getInspectionDetail(row.id);
      setDrawer({ opened: true, inspection: detail });
    } catch {
      notifications.show({ message: 'Error al cargar detalle.', color: 'red' });
    }
  }

  function openDelete(row) {
    setDeleteReason('');
    setDeleteModal({ opened: true, row });
  }

  async function confirmDelete() {
    const row = deleteModal.row;
    if (!row) return;
    setDeleting(true);
    try {
      await deleteInspection(row.id, deleteReason.trim() || null);
      setDeleteModal({ opened: false, row: null });
      notifications.show({ message: `Inspeccion ${row.public_code} eliminada.`, color: 'green' });
      load(activeFilters);
    } catch (err) {
      notifications.show({ message: err.response?.data?.error || 'No se pudo eliminar la inspeccion.', color: 'red' });
    } finally {
      setDeleting(false);
    }
  }

  async function openDeletions() {
    setDeletionsModal(true);
    setLoadingDeletions(true);
    try {
      const res = await getInspectionDeletions();
      setDeletions(res.deletions || []);
    } catch {
      notifications.show({ message: 'Error al cargar el historial de eliminaciones.', color: 'red' });
    } finally {
      setLoadingDeletions(false);
    }
  }

  async function handleExport() {
    setExporting(true);
    try {
      const blob = await exportInspections(activeFilters);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `inspecciones_${new Date().toISOString().substring(0, 10)}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      notifications.show({ message: 'Error al exportar.', color: 'red' });
    } finally {
      setExporting(false);
    }
  }

  const { sorted, sort, onSort } = useSortableData(data.data, {
    inspection_date: (r) => r.inspection_date,
    cedula: (r) => r.collaborator?.cedula,
    name: (r) => `${r.collaborator?.last_name || ''} ${r.collaborator?.first_name || ''}`.trim(),
    plate: (r) => r.plate,
    vehicle_type: (r) => r.vehicle_type,
    malo: (r) => r.answers_summary?.malo || 0,
    photos_count: (r) => r.photos_count,
  });
  const totalPages = Math.ceil(data.total / data.limit);

  return (
    <div>
      <Group justify="space-between" mb="md">
        <Title order={3}>Inspecciones</Title>
        <Group gap="xs">
          <Button leftSection={<IconHistory size={14} />} variant="default" onClick={openDeletions}>
            Historial de eliminaciones
          </Button>
          <Button leftSection={<IconFileExport size={14} />} variant="light" onClick={handleExport} loading={exporting}>
            Exportar a Excel
          </Button>
        </Group>
      </Group>

      <Stack gap="xs" mb="md">
        <Group gap="xs" wrap="wrap">
          <TextInput
            placeholder="ID" value={filters.code}
            onChange={(e) => setFilters({ ...filters, code: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '') })}
            style={{ width: 110 }} styles={{ input: { fontSize: 14 } }} maxLength={6}
          />
          <TextInput
            placeholder="Cedula" value={filters.cedula}
            onChange={(e) => setFilters({ ...filters, cedula: e.target.value })}
            style={{ width: 140 }} styles={{ input: { fontSize: 14 } }}
          />
          <TextInput
            placeholder="Placa" value={filters.plate}
            onChange={(e) => setFilters({ ...filters, plate: e.target.value })}
            style={{ width: 120 }} styles={{ input: { fontSize: 14 } }}
          />
          <TextInput
            placeholder="Nombre" value={filters.name}
            onChange={(e) => setFilters({ ...filters, name: e.target.value })}
            style={{ width: 160 }} styles={{ input: { fontSize: 14 } }}
          />
          <Select
            placeholder="Tipo" data={[{ value: 'auto', label: 'Auto' }, { value: 'moto', label: 'Moto' }]}
            value={filters.vehicle_type || null}
            onChange={(v) => setFilters({ ...filters, vehicle_type: v || '' })}
            clearable style={{ width: 120 }}
          />
          <Select
            placeholder="Respuestas" data={[{ value: 'true', label: 'Con malo' }]}
            value={filters.has_malo || null}
            onChange={(v) => setFilters({ ...filters, has_malo: v || '' })}
            clearable style={{ width: 140 }}
          />
        </Group>
        <Group gap="xs">
          <DatePickerInput
            placeholder="Desde" value={filters.date_from}
            onChange={(v) => setFilters({ ...filters, date_from: v })}
            clearable style={{ width: 150 }}
          />
          <DatePickerInput
            placeholder="Hasta" value={filters.date_to}
            onChange={(v) => setFilters({ ...filters, date_to: v })}
            clearable style={{ width: 150 }}
          />
          <Button leftSection={<IconSearch size={14} />} onClick={handleSearch}>
            Buscar
          </Button>
        </Group>
      </Stack>

      {loading ? (
        <Center h={200}><Loader /></Center>
      ) : (
        <>
          <Text size="sm" c="dimmed" mb="xs">{data.total} resultados</Text>
          <Table striped highlightOnHover withTableBorder fz="sm">
            <Table.Thead>
              <Table.Tr>
                <SortableTh label="ID" sortKey="public_code" sort={sort} onSort={onSort} />
                <SortableTh label="Fecha" sortKey="inspection_date" sort={sort} onSort={onSort} />
                <SortableTh label="Cédula" sortKey="cedula" sort={sort} onSort={onSort} />
                <SortableTh label="Nombre" sortKey="name" sort={sort} onSort={onSort} />
                <SortableTh label="Placa" sortKey="plate" sort={sort} onSort={onSort} />
                <SortableTh label="Tipo" sortKey="vehicle_type" sort={sort} onSort={onSort} />
                <SortableTh label="Respuestas (malo)" sortKey="malo" sort={sort} onSort={onSort} />
                <SortableTh label="Fotos" sortKey="photos_count" sort={sort} onSort={onSort} />
                <Table.Th></Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {sorted.map((row) => (
                <Table.Tr key={row.id}>
                  <Table.Td><Badge variant="light" size="sm">{row.public_code}</Badge></Table.Td>
                  <Table.Td>{row.inspection_date}</Table.Td>
                  <Table.Td>{row.collaborator?.cedula}</Table.Td>
                  <Table.Td>{row.collaborator?.first_name} {row.collaborator?.last_name}</Table.Td>
                  <Table.Td><Badge variant="light" size="sm">{row.plate}</Badge></Table.Td>
                  <Table.Td>{row.vehicle_type}</Table.Td>
                  <Table.Td>
                    <Group gap={4}>
                      <Badge color="green" variant="light" size="sm">{row.answers_summary?.bueno || 0}</Badge>
                      <Badge color="red" variant="light" size="sm">{row.answers_summary?.malo || 0}</Badge>
                    </Group>
                  </Table.Td>
                  <Table.Td>{row.photos_count}</Table.Td>
                  <Table.Td>
                    <Group gap={4} wrap="nowrap">
                      <Tooltip label="Ver detalle">
                        <ActionIcon variant="light" onClick={() => openDetail(row)}>
                          <IconEye size={16} />
                        </ActionIcon>
                      </Tooltip>
                      <Tooltip label="Eliminar inspeccion">
                        <ActionIcon variant="light" color="red" onClick={() => openDelete(row)}>
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
            <Text c="dimmed" ta="center" py="xl">No se encontraron inspecciones para los filtros aplicados.</Text>
          )}

          {totalPages > 1 && (
            <Group justify="center" mt="md">
              <Pagination value={page} onChange={setPage} total={totalPages} />
            </Group>
          )}
        </>
      )}

      <InspectionDetailDrawer
        opened={drawer.opened}
        inspection={drawer.inspection}
        onClose={() => setDrawer({ opened: false, inspection: null })}
      />

      <Modal
        opened={deleteModal.opened}
        onClose={() => setDeleteModal({ opened: false, row: null })}
        title="Eliminar inspeccion"
        size="md"
        centered
      >
        <Stack gap="md">
          <Text size="sm">
            ¿Seguro que deseas eliminar la inspeccion{' '}
            <strong>{deleteModal.row?.public_code}</strong> de{' '}
            <strong>{deleteModal.row?.collaborator?.first_name} {deleteModal.row?.collaborator?.last_name}</strong>{' '}
            (placa {deleteModal.row?.plate}, {deleteModal.row?.inspection_date})?
          </Text>
          <Text size="xs" c="dimmed">
            Esta accion no se puede deshacer. Quedara registrada en el historial de eliminaciones con tu usuario y la fecha.
          </Text>
          <Textarea
            label="Motivo (opcional)"
            placeholder="Ej: registro de prueba, datos erroneos..."
            value={deleteReason}
            onChange={(e) => setDeleteReason(e.target.value)}
            autosize minRows={2}
          />
          <Group justify="flex-end">
            <Button variant="default" onClick={() => setDeleteModal({ opened: false, row: null })}>Cancelar</Button>
            <Button color="red" loading={deleting} onClick={confirmDelete}>Eliminar</Button>
          </Group>
        </Stack>
      </Modal>

      <Modal
        opened={deletionsModal}
        onClose={() => setDeletionsModal(false)}
        title="Historial de eliminaciones"
        size="xl"
      >
        {loadingDeletions ? (
          <Center h={150}><Loader /></Center>
        ) : deletions.length === 0 ? (
          <Text c="dimmed" ta="center" py="xl">No hay eliminaciones registradas.</Text>
        ) : (
          <Table striped withTableBorder fz="xs">
            <Table.Thead>
              <Table.Tr>
                <Table.Th>ID</Table.Th>
                <Table.Th>Fecha insp.</Table.Th>
                <Table.Th>Colaborador</Table.Th>
                <Table.Th>Placa</Table.Th>
                <Table.Th>Eliminada por</Table.Th>
                <Table.Th>Fecha eliminacion</Table.Th>
                <Table.Th>Motivo</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {deletions.map((d) => (
                <Table.Tr key={d.id}>
                  <Table.Td><Badge variant="light" size="sm">{d.inspection_public_code}</Badge></Table.Td>
                  <Table.Td>{d.inspection_date}</Table.Td>
                  <Table.Td>{d.collaborator_name}<br /><Text span size="xs" c="dimmed">{d.collaborator_cedula}</Text></Table.Td>
                  <Table.Td>{d.plate}</Table.Td>
                  <Table.Td>{d.deleted_by_name}<br /><Text span size="xs" c="dimmed">{d.deleted_by_email}</Text></Table.Td>
                  <Table.Td>{d.deleted_at}</Table.Td>
                  <Table.Td>{d.reason || '-'}</Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        )}
      </Modal>
    </div>
  );
}
