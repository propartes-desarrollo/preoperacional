import { useState } from 'react';
import { Container, Card, Title, Text, TextInput, Button, Stack, Alert } from '@mantine/core';
import { sendMagicLink } from '../../api/adminApi.js';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setError('');
    try {
      await sendMagicLink(email.trim());
      setSent(true);
    } catch (err) {
      setError(err.response?.data?.error || 'Error al enviar el enlace. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Container size={400} pt={80}>
      <Card withBorder shadow="sm" p="xl">
        <Title order={3} mb="xs">Panel de administración</Title>
        <Text size="sm" c="dimmed" mb="lg">Ingresa tu email para recibir un enlace de acceso.</Text>

        {sent ? (
          <Alert color="green" title="Enlace enviado">
            Si el email está registrado, recibirás un enlace en tu bandeja de entrada. Revisa también
            la carpeta de spam.
          </Alert>
        ) : (
          <form onSubmit={handleSubmit}>
            <Stack gap="md">
              {error && <Alert color="red">{error}</Alert>}
              <TextInput
                label="Email"
                type="email"
                placeholder="admin@propartes.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                styles={{ input: { fontSize: 16 } }}
              />
              <Button type="submit" loading={loading} fullWidth>
                Enviar enlace de acceso
              </Button>
            </Stack>
          </form>
        )}
      </Card>
    </Container>
  );
}
