import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Container, Center, Loader, Alert, Button, Stack, Text } from '@mantine/core';
import { verifyMagicLink } from '../../api/adminApi.js';
import { useAdmin } from '../../context/AdminContext.jsx';

export function VerifyTokenPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setUser } = useAdmin();
  const [error, setError] = useState('');

  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) {
      setError('Token no proporcionado.');
      return;
    }
    verifyMagicLink(token)
      .then((data) => {
        localStorage.setItem('admin_jwt', data.token);
        setUser(data.user);
        navigate('/admin/dashboard', { replace: true });
      })
      .catch((err) => {
        setError(err.response?.data?.error || 'El enlace es invalido o ha expirado.');
      });
  }, []);

  if (!error) {
    return (
      <Center h="100vh">
        <Stack align="center" gap="md">
          <Loader />
          <Text size="sm" c="dimmed">Verificando acceso...</Text>
        </Stack>
      </Center>
    );
  }

  return (
    <Container size={400} pt={80}>
      <Alert color="red" title="Error de verificacion" mb="md">
        {error}
      </Alert>
      <Button onClick={() => navigate('/admin/login')}>Volver al login</Button>
    </Container>
  );
}
