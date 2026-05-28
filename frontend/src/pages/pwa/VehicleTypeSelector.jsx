import { SegmentedControl, Text } from '@mantine/core';

export function VehicleTypeSelector({ value, onChange }) {
  return (
    <>
      <Text size="sm" c="dimmed" mb={4}>
        No se pudo detectar el tipo de vehiculo. Seleccionalo manualmente:
      </Text>
      <SegmentedControl
        fullWidth
        data={[
          { label: 'Auto', value: 'auto' },
          { label: 'Moto', value: 'moto' },
        ]}
        value={value || ''}
        onChange={onChange}
        styles={{ label: { fontSize: 16, minHeight: 40, display: 'flex', alignItems: 'center' } }}
      />
    </>
  );
}
