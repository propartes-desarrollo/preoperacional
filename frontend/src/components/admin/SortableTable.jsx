import { useState, useMemo } from 'react';
import { Table, Group } from '@mantine/core';
import { IconChevronUp, IconChevronDown, IconSelector } from '@tabler/icons-react';

/**
 * Hook de ordenamiento del lado del cliente.
 * @param {Array} data filas a ordenar
 * @param {Object} accessors mapa opcional { key: (row) => valor } para columnas calculadas o anidadas
 */
export function useSortableData(data, accessors = {}) {
  const [sort, setSort] = useState({ key: null, dir: 'asc' });

  const sorted = useMemo(() => {
    const rows = data || [];
    if (!sort.key) return rows;
    const get = accessors[sort.key] || ((r) => r?.[sort.key]);
    const copy = [...rows];
    copy.sort((a, b) => {
      const av = get(a);
      const bv = get(b);
      if (av == null && bv == null) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;
      let cmp;
      if (typeof av === 'number' && typeof bv === 'number') cmp = av - bv;
      else if (typeof av === 'boolean' && typeof bv === 'boolean') cmp = av === bv ? 0 : av ? -1 : 1;
      else cmp = String(av).localeCompare(String(bv), 'es', { numeric: true, sensitivity: 'base' });
      return sort.dir === 'asc' ? cmp : -cmp;
    });
    return copy;
    // accessors es puro; se omite de deps a proposito para no re-ordenar en cada render
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, sort]);

  const onSort = (key) =>
    setSort((prev) =>
      prev.key === key ? { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' }
    );

  return { sorted, sort, onSort };
}

export function SortableTh({ label, sortKey, sort, onSort, style, ...props }) {
  const active = sort.key === sortKey;
  const Icon = active ? (sort.dir === 'asc' ? IconChevronUp : IconChevronDown) : IconSelector;
  return (
    <Table.Th
      {...props}
      style={{ cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap', ...style }}
      onClick={() => onSort(sortKey)}
    >
      <Group gap={4} wrap="nowrap">
        <span>{label}</span>
        <Icon size={14} style={{ opacity: active ? 1 : 0.35, flexShrink: 0 }} />
      </Group>
    </Table.Th>
  );
}
