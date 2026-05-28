import { Container, Paper, Title, Text, Button } from '@mantine/core';
import { useViewport } from '../../hooks/useViewport.js';

export function ViewportGuard({ children }) {
  const { width } = useViewport();

  if (width < 1024) {
    return (
      <Container size="sm" pt="xl">
        <Paper p="xl" withBorder>
          <Title order={3}>Panel de administracion</Title>
          <Text mt="md">
            El panel de administracion esta optimizado para computadores de escritorio. Para una
            mejor experiencia, accede desde un dispositivo con pantalla de al menos 1024 pixeles de
            ancho.
          </Text>
          <Text mt="md" size="sm" c="dimmed">
            Si necesitas registrar una inspeccion, regresa a la pagina principal.
          </Text>
          <Button mt="lg" component="a" href="/">
            Ir al formulario
          </Button>
        </Paper>
      </Container>
    );
  }

  return children;
}
