import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Card,
  Title,
  Text,
  TextInput,
  Button,
  Stack,
  Badge,
  Box,
  Alert,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useInspection } from '../../context/InspectionContext.jsx';
import { getInspectionStatus, getSections } from '../../api/publicApi.js';
import { detectVehicleType, normalizePlate } from '../../utils/plateDetector.js';
import { validateCedula, validateNombre, validateApellidos, validatePlaca } from '../../utils/validators.js';
import { VehicleTypeSelector } from './VehicleTypeSelector.jsx';
import { InstallPrompt } from '../../components/pwa/InstallPrompt.jsx';

function getBogotaDateTime() {
  return new Intl.DateTimeFormat('es-CO', {
    timeZone: 'America/Bogota',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date());
}

export function IdentificationPage() {
  const navigate = useNavigate();
  const { state, updateIdentification, updateStatus, updateSections } = useInspection();

  const [nombre, setNombre] = useState(state.nombre || '');
  const [apellidos, setApellidos] = useState(state.apellidos || '');
  const [cedula, setCedula] = useState(state.cedula || '');
  const [placa, setPlaca] = useState(state.placa || '');
  const [manualVehicleType, setManualVehicleType] = useState(null);
  const [currentTime, setCurrentTime] = useState(getBogotaDateTime());
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [networkError, setNetworkError] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(getBogotaDateTime()), 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const sent = JSON.parse(sessionStorage.getItem('offline_sent') || '[]');
    if (sent.length > 0) {
      sessionStorage.removeItem('offline_sent');
      notifications.show({
        color: 'green',
        title: 'Inspección enviada',
        message: 'Tu inspección guardada sin conexión fue enviada correctamente.',
        autoClose: 6000,
      });
    }
  }, []);

  const normalizedPlaca = normalizePlate(placa);
  const detectedType = normalizedPlaca.length === 6 ? detectVehicleType(normalizedPlaca) : null;
  const showManualSelector = normalizedPlaca.length === 6 && detectedType === null;
  const vehicle_type = detectedType || manualVehicleType;

  const validate = useCallback(() => {
    const errs = {};
    const cErr = validateCedula(cedula);
    const nErr = validateNombre(nombre);
    const aErr = validateApellidos(apellidos);
    const pErr = validatePlaca(placa);
    if (cErr) errs.cedula = cErr;
    if (nErr) errs.nombre = nErr;
    if (aErr) errs.apellidos = aErr;
    if (pErr) errs.placa = pErr;
    if (!vehicle_type) errs.vehicle_type = 'Selecciona el tipo de vehículo';
    return errs;
  }, [cedula, nombre, apellidos, placa, vehicle_type]);

  const isValid = Object.keys(validate()).length === 0;

  const handleContinue = async () => {
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setLoading(true);
    try {
      const plate = normalizePlate(placa);
      const [statusRes, sectionsRes] = await Promise.all([
        getInspectionStatus(cedula, plate),
        getSections(vehicle_type),
      ]);

      if (statusRes.data.already_submitted) {
        notifications.show({
          color: 'red',
          title: 'Inspección ya registrada',
          message: 'Ya se registró una inspección para esta cédula y placa hoy.',
          autoClose: 6000,
        });
        setLoading(false);
        return;
      }

      updateIdentification({ cedula, nombre: nombre.trim(), apellidos: apellidos.trim(), placa: plate, vehicle_type });
      updateStatus(statusRes.data);
      updateSections(sectionsRes.data.sections || []);

      navigate('/inspection');
    } catch (err) {
      if (!err.response) {
        setNetworkError(true);
      } else {
        const msg = err.response?.data?.error || 'Error al verificar el estado. Intenta nuevamente.';
        notifications.show({ color: 'red', title: 'Error', message: msg, autoClose: 6000 });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container size={500} py="xl" px="md">
      <Card shadow="sm" padding="xl" radius="md" withBorder>
        <Stack gap="md">
          <Box ta="center">
            <img
              src="/logo-propartes.png"
              alt="Propartes"
              style={{ maxWidth: 220, width: '100%', marginBottom: 8 }}
            />
            <Title order={2} ta="center">
              Seguridad Vial
            </Title>
            <Text c="dimmed" ta="center" size="sm" mt={4}>
              Inspección preoperacional diaria
            </Text>
          </Box>

          <TextInput
            label="Nombres"
            placeholder="Ingresa tus nombres"
            value={nombre}
            onChange={(e) => { setNombre(e.target.value); setErrors((p) => ({ ...p, nombre: undefined })); }}
            error={errors.nombre}
            required
            styles={{ input: { fontSize: 16, minHeight: 44 } }}
          />

          <TextInput
            label="Apellidos"
            placeholder="Ingresa tus apellidos"
            value={apellidos}
            onChange={(e) => { setApellidos(e.target.value); setErrors((p) => ({ ...p, apellidos: undefined })); }}
            error={errors.apellidos}
            required
            styles={{ input: { fontSize: 16, minHeight: 44 } }}
          />

          <TextInput
            label="Cédula"
            placeholder="Número de cédula"
            value={cedula}
            inputMode="numeric"
            onChange={(e) => {
              const v = e.target.value.replace(/\D/g, '');
              setCedula(v);
              setErrors((p) => ({ ...p, cedula: undefined }));
            }}
            error={errors.cedula}
            required
            styles={{ input: { fontSize: 16, minHeight: 44 } }}
          />

          <Box>
            <TextInput
              label="Placa"
              placeholder="Ej: ABC123"
              value={placa}
              maxLength={6}
              onChange={(e) => {
                const v = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
                setPlaca(v);
                setManualVehicleType(null);
                setErrors((p) => ({ ...p, placa: undefined, vehicle_type: undefined }));
              }}
              error={errors.placa}
              required
              styles={{ input: { fontSize: 16, minHeight: 44, textTransform: 'uppercase' } }}
            />

            {normalizedPlaca.length === 6 && (
              <Box mt="xs">
                {detectedType === 'auto' && (
                  <Badge color="blue" size="md">
                    Vehículo detectado: AUTO
                  </Badge>
                )}
                {detectedType === 'moto' && (
                  <Badge color="orange" size="md">
                    Vehículo detectado: MOTO
                  </Badge>
                )}
                {showManualSelector && (
                  <VehicleTypeSelector value={manualVehicleType} onChange={setManualVehicleType} />
                )}
              </Box>
            )}
            {errors.vehicle_type && (
              <Text size="xs" c="red" mt={4}>
                {errors.vehicle_type}
              </Text>
            )}
          </Box>

          <TextInput
            label="Fecha y hora"
            value={currentTime}
            readOnly
            styles={{ input: { fontSize: 16, minHeight: 44 } }}
          />

          {networkError && (
            <Alert
              color="red"
              title="Sin conexión"
              withCloseButton
              onClose={() => setNetworkError(false)}
            >
              <Stack gap="xs">
                <Text size="sm">No se pudo conectar al servidor. Verifica tu conexión a internet.</Text>
                <Button
                  size="sm"
                  variant="outline"
                  color="red"
                  onClick={() => { setNetworkError(false); handleContinue(); }}
                  style={{ alignSelf: 'flex-start' }}
                >
                  Reintentar
                </Button>
              </Stack>
            </Alert>
          )}

          <Button
            fullWidth
            size="lg"
            onClick={handleContinue}
            loading={loading}
            disabled={!isValid && Object.keys(errors).length > 0}
            style={{ minHeight: 48 }}
          >
            Continuar
          </Button>

          <InstallPrompt />
        </Stack>
      </Card>
    </Container>
  );
}
