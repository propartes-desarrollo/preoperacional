import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Title,
  Text,
  Button,
  Paper,
  Group,
  Stack,
  Divider,
  Badge,
  Box,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useInspection } from '../../context/InspectionContext.jsx';
import { submitInspection } from '../../api/publicApi.js';
import { LoadingOverlay } from '../../components/shared/LoadingOverlay.jsx';
import { enqueueInspection } from '../../utils/offlineQueue.js';

export function ReviewPage() {
  const navigate = useNavigate();
  const { state, reset } = useInspection();
  const { cedula, nombre, apellidos, placa, vehicle_type, sections, answers, photos, photo_configs } =
    state;

  const [loading, setLoading] = useState(false);
  const [canRetry, setCanRetry] = useState(false);
  const [lastFd, setLastFd] = useState(null);

  const regularQuestions = sections.flatMap((s) => s.questions.filter((q) => !q.is_other));
  const bueno = regularQuestions.filter((q) => answers[q.id]?.answer === 'bueno').length;
  const malo = regularQuestions.filter((q) => answers[q.id]?.answer === 'malo').length;
  const maloItems = regularQuestions.filter((q) => answers[q.id]?.answer === 'malo');
  const photosUploaded = Object.keys(photos).length;
  const photosRequired = photo_configs.filter((c) => c.is_required).length;

  const buildFormData = () => {
    const fd = new FormData();
    fd.append('cedula', cedula);
    fd.append('nombre', nombre);
    fd.append('apellidos', apellidos);
    fd.append('placa', placa);
    fd.append('vehicle_type', vehicle_type);

    const allAnswers = sections
      .flatMap((s) => s.questions)
      .map((q) => ({
        question_id: q.id,
        answer: answers[q.id]?.answer || null,
        observations: answers[q.id]?.observations || null,
      }));
    fd.append('answers', JSON.stringify(allAnswers));

    for (const [configId, file] of Object.entries(photos)) {
      fd.append(`photo_${configId}`, file);
    }

    return fd;
  };

  const handleSubmit = async (fdOverride) => {
    setLoading(true);
    setCanRetry(false);
    const fd = fdOverride || buildFormData();
    setLastFd(fd);
    try {
      const res = await submitInspection(fd);
      reset();
      navigate('/success', { state: res.data });
    } catch (err) {
      const status = err.response?.status;
      const msg = err.response?.data?.error;

      if (!err.response) {
        // Error de red: encolar para envio automatico posterior
        try {
          await enqueueInspection(fd);
        } catch {
          // Si IndexedDB falla, continuamos igual
        }
        sessionStorage.setItem('offline_inspection_queued', 'true');
        notifications.show({
          color: 'orange',
          title: 'Sin conexion',
          message: 'Tu inspeccion se enviara automaticamente cuando recuperes la red.',
          autoClose: 8000,
        });
        navigate('/success', { state: { offline: true } });
      } else if (status === 409) {
        notifications.show({
          color: 'red',
          title: 'Inspeccion duplicada',
          message: 'Ya existe una inspeccion para esta cedula, placa y fecha.',
          autoClose: 7000,
        });
        reset();
        navigate('/');
      } else if (status === 422) {
        notifications.show({
          color: 'red',
          title: 'Error de validacion',
          message: msg || 'Verifica los datos e imagenes enviadas.',
          autoClose: 7000,
        });
      } else if (status >= 500) {
        setCanRetry(true);
        notifications.show({
          color: 'red',
          title: 'Error del servidor',
          message: 'Error al enviar la inspeccion. Puedes reintentar.',
          autoClose: 6000,
        });
      } else {
        notifications.show({
          color: 'red',
          title: 'Error',
          message: msg || 'Error al enviar la inspeccion. Intenta nuevamente.',
          autoClose: 6000,
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container size={600} py="xl" px="md" style={{ position: 'relative' }}>
      <LoadingOverlay visible={loading} />

      <Title order={2} mb="md">
        Resumen de la inspeccion
      </Title>

      <Paper withBorder p="md" mb="md">
        <Title order={5} mb="xs">
          Datos del colaborador
        </Title>
        <Stack gap={4}>
          <Text size="sm">
            <strong>Nombre:</strong> {nombre} {apellidos}
          </Text>
          <Text size="sm">
            <strong>Cedula:</strong> {cedula}
          </Text>
          <Text size="sm">
            <strong>Placa:</strong> {placa}
          </Text>
          <Text size="sm">
            <strong>Tipo:</strong> {vehicle_type?.toUpperCase()}
          </Text>
        </Stack>
      </Paper>

      <Paper withBorder p="md" mb="md">
        <Title order={5} mb="xs">
          Respuestas
        </Title>
        <Group gap="md" mb="xs">
          <Badge color="green" size="lg">
            Bueno: {bueno}
          </Badge>
          <Badge color="red" size="lg">
            Malo: {malo}
          </Badge>
        </Group>

        {maloItems.length > 0 && (
          <>
            <Divider my="xs" label="Items marcados como Malo" />
            <Stack gap="xs">
              {maloItems.map((q) => (
                <Box key={q.id}>
                  <Text size="sm" fw={500}>
                    {q.text}
                  </Text>
                  {answers[q.id]?.observations && (
                    <Text size="xs" c="dimmed">
                      {answers[q.id].observations}
                    </Text>
                  )}
                </Box>
              ))}
            </Stack>
          </>
        )}
      </Paper>

      <Paper withBorder p="md" mb="xl">
        <Title order={5} mb="xs">
          Fotografias
        </Title>
        <Text size="sm">
          {photosUploaded} foto{photosUploaded !== 1 ? 's' : ''} subida{photosUploaded !== 1 ? 's' : ''}
          {photosRequired > 0 ? ` de ${photosRequired} requeridas` : ''}
        </Text>
      </Paper>

      <Stack gap="sm">
        <Button
          variant="outline"
          fullWidth
          size="lg"
          onClick={() => navigate('/inspection')}
          style={{ minHeight: 48 }}
          disabled={loading}
        >
          Editar respuestas
        </Button>
        <Button fullWidth size="lg" onClick={() => handleSubmit()} loading={loading} style={{ minHeight: 48 }}>
          Enviar inspeccion
        </Button>
        {canRetry && (
          <Button
            fullWidth
            size="lg"
            color="orange"
            variant="outline"
            onClick={() => handleSubmit(lastFd)}
            loading={loading}
            style={{ minHeight: 48 }}
          >
            Reintentar
          </Button>
        )}
      </Stack>
    </Container>
  );
}
