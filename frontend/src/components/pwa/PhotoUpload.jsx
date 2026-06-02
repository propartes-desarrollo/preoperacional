import { useRef } from 'react';
import { Paper, Text, Button, Group, Badge, Image, Stack } from '@mantine/core';
import { notifications } from '@mantine/notifications';

const MAX_FILE_SIZE = 10 * 1024 * 1024;

export function PhotoUpload({ config, file, onChange }) {
  const inputRef = useRef(null);

  const handleChange = (e) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    if (!selected.type.startsWith('image/')) {
      notifications.show({
        color: 'red',
        title: 'Archivo no válido',
        message: 'Solo se permiten imagenes.',
      });
      e.target.value = '';
      return;
    }

    if (selected.size > MAX_FILE_SIZE) {
      notifications.show({
        color: 'red',
        title: 'Archivo demasiado grande',
        message: 'El tamaño máximo permitido es 10 MB.',
      });
      e.target.value = '';
      return;
    }

    onChange(selected);
    e.target.value = '';
  };

  const preview = file ? URL.createObjectURL(file) : null;
  const sizeKb = file ? Math.round(file.size / 1024) : 0;

  return (
    <Paper p="md" withBorder mb="sm">
      <Group justify="space-between" mb="xs">
        <Text fw={500}>{config.label}</Text>
        {config.is_required && !file && (
          <Badge color="red" variant="light">
            Requerida
          </Badge>
        )}
        {file && (
          <Badge color="green" variant="light">
            Cargada
          </Badge>
        )}
      </Group>

      {!file ? (
        <Button
          fullWidth
          variant="outline"
          size="lg"
          style={{ minHeight: 80 }}
          onClick={() => inputRef.current?.click()}
        >
          Tomar foto
        </Button>
      ) : (
        <Stack gap="xs">
          <Image
            src={preview}
            alt={config.label}
            mah={200}
            fit="contain"
            radius="sm"
          />
          <Text size="sm" c="dimmed">
            {file.name} &mdash; {sizeKb} KB
          </Text>
          <Group gap="xs">
            <Button variant="outline" size="sm" onClick={() => inputRef.current?.click()}>
              Reemplazar
            </Button>
            <Button variant="outline" color="red" size="sm" onClick={() => onChange(null)}>
              Eliminar
            </Button>
          </Group>
        </Stack>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        style={{ display: 'none' }}
        onChange={handleChange}
      />
    </Paper>
  );
}
