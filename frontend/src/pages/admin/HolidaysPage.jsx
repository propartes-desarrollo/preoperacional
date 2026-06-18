import { useEffect, useState } from 'react';
import { Title, Group, Button, Select, Table, Badge, Text, Modal, TextInput, Stack, Center, Loader, SegmentedControl, ActionIcon } from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { IconPlus, IconTrash } from '@tabler/icons-react';
import { getHolidays, getHolidayOverrides, createHolidayOverride, deleteHolidayOverride } from '../../api/adminApi.js';
import { notifications } from '@mantine/notifications';
import { useSortableData, SortableTh } from '../../components/admin/SortableTable.jsx';

const TYPE_LABELS = { fixed: 'Fijo', easter: 'Semana Santa', emiliani: 'Ley Emiliani', override: 'Manual' };

const CURRENT_YEAR = new Date().getFullYear();
const YEAR_OPTIONS = Array.from({ length: 5 }, (_, i) => String(CURRENT_YEAR + i - 1));

export function HolidaysPage() {
  const [year, setYear] = useState(String(CURRENT_YEAR));
  const [holidays, setHolidays] = useState([]);
  const [overrides, setOverrides] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ date: null, action: 'add', description: '' });
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const [hData, oData] = await Promise.all([
        getHolidays(year),
        getHolidayOverrides(),
      ]);
      setHolidays(hData.holidays || []);
      setOverrides(oData.overrides || []);
    } catch {
      notifications.show({ message: 'Error al cargar festivos.', color: 'red' });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [year]);

  async function handleSave() {
    if (!form.date) return;
    setSaving(true);
    try {
      await createHolidayOverride({
        date: form.date.toISOString().substring(0, 10),
        action: form.action,
        description: form.description || null,
      });
      notifications.show({ message: 'Override guardado.', color: 'green' });
      setModal(false);
      setForm({ date: null, action: 'add', description: '' });
      load();
    } catch (err) {
      notifications.show({ message: err.response?.data?.error || 'Error.', color: 'red' });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(override) {
    if (!window.confirm(`Eliminar override para ${override.date}?`)) return;
    try {
      await deleteHolidayOverride(override.id);
      load();
    } catch {
      notifications.show({ message: 'Error al eliminar.', color: 'red' });
    }
  }

  const yearOverrides = overrides.filter((o) => o.date?.startsWith(year));
  const removeSet = new Set(yearOverrides.filter((o) => o.action === 'remove').map((o) => o.date));
  const addSet = new Set(yearOverrides.filter((o) => o.action === 'add').map((o) => o.date));

  const allDates = [
    ...holidays.filter((h) => !removeSet.has(h.date)).map((h) => ({ ...h, source: 'calculated' })),
    ...yearOverrides.filter((o) => o.action === 'add').map((o) => ({ date: o.date, name: o.description || 'Festivo adicional', source: 'added' })),
  ].sort((a, b) => a.date.localeCompare(b.date));

  const removedDates = holidays.filter((h) => removeSet.has(h.date));

  const typeLabel = (h) => (h.source === 'added' ? 'Manual' : TYPE_LABELS[h.type] || 'Calculado');
  const datesSort = useSortableData(allDates, { tipo: typeLabel });
  const ovSort = useSortableData(yearOverrides);

  return (
    <div>
      <Group justify="space-between" mb="md">
        <Title order={3}>Festivos</Title>
        <Group gap="xs">
          <Select data={YEAR_OPTIONS} value={year} onChange={setYear} style={{ width: 100 }} />
          <Button leftSection={<IconPlus size={14} />} onClick={() => setModal(true)}>
            Administrar días festivos
          </Button>
        </Group>
      </Group>

      {loading ? (
        <Center h={200}><Loader /></Center>
      ) : (
        <>
          <Table striped withTableBorder fz="sm" mb="lg">
            <Table.Thead>
              <Table.Tr>
                <SortableTh label="Fecha" sortKey="date" sort={datesSort.sort} onSort={datesSort.onSort} />
                <SortableTh label="Nombre" sortKey="name" sort={datesSort.sort} onSort={datesSort.onSort} />
                <SortableTh label="Tipo" sortKey="tipo" sort={datesSort.sort} onSort={datesSort.onSort} />
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {datesSort.sorted.map((h, i) => (
                <Table.Tr key={i}>
                  <Table.Td>{h.date}</Table.Td>
                  <Table.Td>{h.name}</Table.Td>
                  <Table.Td>
                    <Badge variant="light" color={h.source === 'added' ? 'green' : 'blue'} size="sm">
                      {typeLabel(h)}
                    </Badge>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>

          {removedDates.length > 0 && (
            <>
              <Text fw={600} mb="xs" c="dimmed">Festivos removidos en {year}:</Text>
              <Table striped withTableBorder fz="sm">
                <Table.Tbody>
                  {removedDates.map((h, i) => (
                    <Table.Tr key={i} style={{ opacity: 0.5, textDecoration: 'line-through' }}>
                      <Table.Td>{h.date}</Table.Td>
                      <Table.Td>{h.name}</Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </>
          )}

          {yearOverrides.length > 0 && (
            <>
              <Text fw={600} mb="xs" mt="lg">Festivos Manuales:</Text>
              <Table striped withTableBorder fz="sm">
                <Table.Thead>
                  <Table.Tr>
                    <SortableTh label="Fecha" sortKey="date" sort={ovSort.sort} onSort={ovSort.onSort} />
                    <SortableTh label="Acción" sortKey="action" sort={ovSort.sort} onSort={ovSort.onSort} />
                    <SortableTh label="Descripción" sortKey="description" sort={ovSort.sort} onSort={ovSort.onSort} />
                    <Table.Th></Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {ovSort.sorted.map((o) => (
                    <Table.Tr key={o.id}>
                      <Table.Td>{o.date}</Table.Td>
                      <Table.Td><Badge color={o.action === 'add' ? 'green' : 'red'} variant="light" size="sm">{o.action}</Badge></Table.Td>
                      <Table.Td>{o.description || '-'}</Table.Td>
                      <Table.Td>
                        <ActionIcon variant="light" color="red" size="sm" onClick={() => handleDelete(o)}>
                          <IconTrash size={14} />
                        </ActionIcon>
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </>
          )}
        </>
      )}

      <Modal opened={modal} onClose={() => setModal(false)} title="Administrar días festivos" size="sm">
        <Stack gap="sm">
          <DatePickerInput label="Fecha" required value={form.date}
            onChange={(v) => setForm({ ...form, date: v })} clearable
          />
          <SegmentedControl
            data={[{ value: 'add', label: 'Agregar festivo' }, { value: 'remove', label: 'Remover festivo' }]}
            value={form.action}
            onChange={(v) => setForm({ ...form, action: v })}
            fullWidth
          />
          <TextInput label="Descripción (opcional)" value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            styles={{ input: { fontSize: 16 } }}
          />
          <Group justify="flex-end">
            <Button variant="default" onClick={() => setModal(false)}>Cancelar</Button>
            <Button onClick={handleSave} loading={saving} disabled={!form.date}>Guardar</Button>
          </Group>
        </Stack>
      </Modal>
    </div>
  );
}
