import { useLocation, useNavigate } from 'react-router-dom';
import { Container, Title, Text, Button, Paper, Stack, Group } from '@mantine/core';

function CheckIcon() {
  return (
    <svg
      width="72"
      height="72"
      viewBox="0 0 72 72"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <circle cx="36" cy="36" r="36" fill="#e6f9f0" />
      <path
        d="M20 36L30 46L52 24"
        stroke="#2f9e44"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function SuccessPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const data = location.state || {};

  return (
    <Container size={500} py="xl" px="md">
      <Paper shadow="sm" p="xl" radius="md" withBorder>
        <Stack align="center" gap="md">
          <CheckIcon />

          <Title order={2} ta="center">
            Inspección registrada
          </Title>

          <Text c="dimmed" ta="center" size="sm">
            La inspección preoperacional fue enviada correctamente.
          </Text>

          {data.inspection_id && (
            <Paper withBorder p="md" w="100%">
              <Stack gap={6}>
                <Group justify="space-between">
                  <Text size="sm" c="dimmed">
                    ID de inspección
                  </Text>
                  <Text size="sm" fw={600}>
                    {data.inspection_id}
                  </Text>
                </Group>
                {data.inspection_date && (
                  <Group justify="space-between">
                    <Text size="sm" c="dimmed">
                      Fecha
                    </Text>
                    <Text size="sm" fw={600}>
                      {data.inspection_date}
                    </Text>
                  </Group>
                )}
                {data.photos_uploaded !== undefined && (
                  <Group justify="space-between">
                    <Text size="sm" c="dimmed">
                      Fotos subidas
                    </Text>
                    <Text size="sm" fw={600}>
                      {data.photos_uploaded}
                    </Text>
                  </Group>
                )}
              </Stack>
            </Paper>
          )}

          <Button fullWidth size="lg" onClick={() => navigate('/')} style={{ minHeight: 48 }}>
            Volver al inicio
          </Button>
        </Stack>
      </Paper>
    </Container>
  );
}
