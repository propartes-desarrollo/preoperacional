import { Component } from 'react';
import { Center, Stack, Title, Text, Button } from '@mantine/core';

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary]', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <Center h="100vh">
          <Stack align="center" gap="md" maw={400} ta="center">
            <Title order={3}>Ocurrio un error inesperado</Title>
            <Text c="dimmed">La aplicacion encontro un problema. Por favor recarga la pagina.</Text>
            <Button onClick={() => window.location.reload()}>Recargar</Button>
          </Stack>
        </Center>
      );
    }
    return this.props.children;
  }
}
