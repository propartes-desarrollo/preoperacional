import { useState } from 'react';
import { Modal, Button, Stack, Text, Alert, Group, Table, Badge, Progress } from '@mantine/core';
import { importCsvDryRun, importCsvConfirm } from '../../api/adminApi.js';
import { notifications } from '@mantine/notifications';

export function ImportCsvModal({ opened, onClose, onImported }) {
  const [step, setStep] = useState(1); // 1: select, 2: preview, 3: result
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  function reset() {
    setStep(1);
    setFile(null);
    setPreview(null);
    setResult(null);
  }

  function handleClose() {
    reset();
    onClose();
  }

  async function handleDryRun() {
    if (!file) return;
    setLoading(true);
    try {
      const data = await importCsvDryRun(file);
      setPreview(data);
      setStep(2);
    } catch (err) {
      notifications.show({ message: err.response?.data?.error || 'Error al procesar CSV.', color: 'red' });
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirm() {
    setLoading(true);
    try {
      const data = await importCsvConfirm(file);
      setResult(data);
      setStep(3);
      onImported();
    } catch (err) {
      notifications.show({ message: err.response?.data?.error || 'Error al importar.', color: 'red' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal opened={opened} onClose={handleClose} title="Importar colaboradores desde CSV" size="lg">
      <Stack gap="md">
        <Progress value={step * 33} />

        {step === 1 && (
          <>
            <Text size="sm">
              Formato CSV esperado: <code>cedula,first_name,last_name,phone,plate,vehicle_type,is_active</code>
            </Text>
            <input
              type="file" accept=".csv,text/csv"
              onChange={(e) => setFile(e.target.files[0])}
              style={{ fontSize: 14 }}
            />
            <Group justify="flex-end">
              <Button variant="default" onClick={handleClose}>Cancelar</Button>
              <Button onClick={handleDryRun} loading={loading} disabled={!file}>
                Analizar archivo
              </Button>
            </Group>
          </>
        )}

        {step === 2 && preview && (
          <>
            <Alert color={preview.invalid_rows > 0 ? 'orange' : 'green'}>
              {preview.total_rows} filas totales &mdash; {preview.valid_rows} válidas &mdash; {preview.invalid_rows} con errores
            </Alert>
            <Text size="sm">Se crearán <strong>{preview.will_create}</strong> colaboradores y se actualizarán <strong>{preview.will_update}</strong>.</Text>

            {preview.errors?.length > 0 && (
              <div>
                <Text size="sm" fw={600} mb="xs">Errores encontrados:</Text>
                <Table fz="xs" striped>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Fila</Table.Th>
                      <Table.Th>Campo</Table.Th>
                      <Table.Th>Valor</Table.Th>
                      <Table.Th>Error</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {preview.errors.slice(0, 20).map((err, i) => (
                      <Table.Tr key={i}>
                        <Table.Td>{err.row}</Table.Td>
                        <Table.Td>{err.field}</Table.Td>
                        <Table.Td>{err.value}</Table.Td>
                        <Table.Td>{err.error}</Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              </div>
            )}

            <Group justify="flex-end">
              <Button variant="default" onClick={reset}>Volver</Button>
              <Button onClick={handleConfirm} loading={loading} disabled={preview.valid_rows === 0}>
                Confirmar importación
              </Button>
            </Group>
          </>
        )}

        {step === 3 && result && (
          <>
            <Alert color="green" title="Importación completada">
              Creados: <strong>{result.created}</strong> &mdash; Actualizados: <strong>{result.updated}</strong>
              {result.errors?.length > 0 && ` — ${result.errors.length} con errores`}
            </Alert>
            <Group justify="flex-end">
              <Button onClick={handleClose}>Cerrar</Button>
            </Group>
          </>
        )}
      </Stack>
    </Modal>
  );
}
