import { Container, Title, Text } from '@mantine/core';
import { ViewportGuard } from '../../components/pwa/ViewportGuard.jsx';

export function AdminPlaceholder() {
  return (
    <ViewportGuard>
      <Container py="xl">
        <Title order={2}>Panel de administracion</Title>
        <Text c="dimmed" mt="md">
          Panel en construccion - Fase 6
        </Text>
      </Container>
    </ViewportGuard>
  );
}
