import { useState, useCallback } from 'react';
import {
  Title, Group, Button, TextInput, Select, Table, Badge, ActionIcon,
  Pagination, Text, Center, Loader, Tooltip, Stack
} from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { IconSearch, IconFileExport, IconEye } from '@tabler/icons-react';
import { getInspections, getInspectionDetail, exportInspections } from '../../api/adminApi.js';
import { notifications } from '@mantine/notifications';
import { InspectionDetailDrawer } from './InspectionDetailDrawer.jsx';

export function InspectionsPage() {
  const [data, setData] = useState({ data: [], total: 0, page: 1, limit: 50 });
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({
    cedula: '', plate: '', name: '', vehicle_type: '', date_from: null, date_to: null, has_malo: '',
  });
  const [activeFilters, setActiveFilters] = useState({});
  const [drawer, setDrawer] = useState({ opened: false, inspection: null });
  const [exporting, setExporting] = useState(false);

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

  function handleSearch() {
    const params = {};
    if (filters.cedula) params.cedula = filters.cedula;
    if (filters.plate) params.plate = filters.plate;
    if (filters.name) params.name = filters.name;
    if (filters.vehicle_type) params.vehicle_type = filters.vehicle_type;
    if (filters.date_from) params.date_from = filters.date_from.toISOString().substring(0, 10);
    if (filters.date_to) params.date_to = filters.date_to.toISOString().substring(0, 10);
    if (filters.has_malo === 'true') params.has_malo = 'true';
    setActiveFilters(params);
    setPage(1);
    load(params);
  }

  async function openDetail(row) {
    try {
      const detail = await getInspectionDetail(row.id);
      setDrawer({ opened: true, inspection: detail });
    } catch {
      notifications.show({ message: 'Error al cargar detalle.', color: 'red' });
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

  const totalPages = Math.ceil(data.total / data.limit);

  return (
    <div>
      <Group justify="space-between" mb="md">
        <Title order={3}>Inspecciones</Title>
        <Button leftSection={<IconFileExport size={14} />} variant="light" onClick={handleExport} loading={exporting}>
          Exportar a Excel
        </Button>
      </Group>

      <Stack gap="xs" mb="md">
        <Group gap="xs" wrap="wrap">
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
                <Table.Th>Fecha</Table.Th>
                <Table.Th>Cedula</Table.Th>
                <Table.Th>Nombre</Table.Th>
                <Table.Th>Placa</Table.Th>
                <Table.Th>Tipo</Table.Th>
                <Table.Th>Respuestas</Table.Th>
                <Table.Th>Fotos</Table.Th>
                <Table.Th></Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {data.data.map((row) => (
                <Table.Tr key={row.id}>
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
                    <Tooltip label="Ver detalle">
                      <ActionIcon variant="light" onClick={() => openDetail(row)}>
                        <IconEye size={16} />
                      </ActionIcon>
                    </Tooltip>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>

          {data.data.length === 0 && (
            <Text c="dimmed" ta="center" py="xl">No se encontraron inspecciones. Usa los filtros y presiona Buscar.</Text>
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
    </div>
  );
}
