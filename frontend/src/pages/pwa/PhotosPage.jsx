import { useNavigate } from 'react-router-dom';
import { Container, Title, Text, Button, Alert, Stack } from '@mantine/core';
import { useInspection } from '../../context/InspectionContext.jsx';
import { PhotoUpload } from '../../components/pwa/PhotoUpload.jsx';

export function PhotosPage() {
  const navigate = useNavigate();
  const { state, setPhoto, removePhoto } = useInspection();
  const { photo_configs, photos, is_first_registration, photos_pending } = state;

  const requiredConfigs = photo_configs.filter((c) => c.is_required);
  const allRequiredPresent = requiredConfigs.every((c) => photos[c.id]);

  const handlePhotoChange = (configId, file) => {
    if (file) setPhoto(configId, file);
    else removePhoto(configId);
  };

  return (
    <Container size={600} py="xl" px="md">
      <Title order={2} mb="xs">
        Fotografias del vehiculo
      </Title>
      <Text c="dimmed" mb="md" size="sm">
        Toma las siguientes fotografias del vehiculo. Asegurate de que sean claras y muestren el
        vehiculo completo.
      </Text>

      <Stack gap="xs" mb="md">
        {is_first_registration && (
          <Alert color="blue" title="Primer registro">
            Este es tu primer registro con esta placa. Las fotos son obligatorias en el primer
            ingreso.
          </Alert>
        )}
        {photos_pending && (
          <Alert color="orange" title="Fotos pendientes">
            Tienes fotografias pendientes desde el inicio de esta semana. Debes subirlas para
            continuar.
          </Alert>
        )}
      </Stack>

      {photo_configs.map((config) => (
        <PhotoUpload
          key={config.id}
          config={config}
          file={photos[config.id] || null}
          onChange={(file) => handlePhotoChange(config.id, file)}
        />
      ))}

      <Button
        fullWidth
        size="lg"
        mt="md"
        disabled={!allRequiredPresent}
        onClick={() => navigate('/review')}
        style={{ minHeight: 48 }}
      >
        Continuar
      </Button>
    </Container>
  );
}
