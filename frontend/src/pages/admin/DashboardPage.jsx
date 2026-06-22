import { useEffect, useState } from 'react';
import { Grid, Card, Title, Text, Group, Badge, Table, Loader, Center, Alert, Stack } from '@mantine/core';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { getDashboard } from '../../api/adminApi.js';

function StatCard({ title, value, color, daily, eventual }) {
  return (
    <Card withBorder p="md">
      <Text size="xs" c="dimmed" tt="uppercase" fw={700}>{title}</Text>
      <Text size="2rem" fw={900} c={color || 'blue'}>{value ?? '-'}</Text>
      <Stack gap={2} mt={4}>
        <Text size="xs" c="dimmed">Diarios: <b>{daily ?? 0}</b></Text>
        <Text size="xs" c="dimmed">Eventuales: <b>{eventual ?? 0}</b></Text>
      </Stack>
    </Card>
  );
}

export function DashboardPage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    getDashboard()
      .then(setData)
      .catch((err) => setError(err.response?.data?.error || 'Error al cargar el dashboard.'));
  }, []);

  if (error) return <Alert color="red">{error}</Alert>;
  if (!data) return <Center h={200}><Loader /></Center>;

  const missing = data.missing_today || [];
  const chart = data.inspections_last_7_days || [];

  const missingDaily = missing.filter((m) => m.inspection_frequency === 'daily').length;
  const missingEventual = missing.filter((m) => m.inspection_frequency !== 'daily').length;

  return (
    <div>
      <Title order={3} mb="md">Dashboard</Title>
      <Text size="sm" c="dimmed" mb="lg">
        {data.today} &mdash; {data.is_business_day ? 'Día hábil' : 'No hábil'}
        {data.is_photo_day && <Badge ml="xs" color="orange" variant="light">Día de fotos</Badge>}
      </Text>

      {data.untyped_active > 0 && (
        <Alert color="orange" title="Colaboradores sin tipo asignado" mb="md">
          Hay <strong>{data.untyped_active}</strong> colaborador(es) activo(s) sin tipo de usuario.
          No reciben recordatorio, no se vigilan en alertas de inactividad ni aparecen en "faltan hoy".
          Asígnales un tipo en <strong>Colaboradores</strong> (filtro "Sin tipo").
        </Alert>
      )}

      <Grid mb="md">
        <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
          <StatCard
            title="Inspecciones hoy"
            value={data.inspections_today}
            color="blue"
            daily={data.inspections_today_daily}
            eventual={data.inspections_today_eventual}
          />
        </Grid.Col>
        <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
          <StatCard
            title="Colaboradores activos"
            value={data.active_collaborators_total}
            daily={data.active_collaborators_daily}
            eventual={data.active_collaborators_eventual}
          />
        </Grid.Col>
        <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
          <StatCard
            title="Faltan hoy"
            value={missing.length}
            color={missing.length > 0 ? 'orange' : 'green'}
            daily={missingDaily}
            eventual={missingEventual}
          />
        </Grid.Col>
      </Grid>

      <Grid>
        <Grid.Col span={{ base: 12, md: 7 }}>
          <Card withBorder p="md">
            <Title order={5} mb="md">Inspecciones - últimos 7 días</Title>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={chart}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Line type="monotone" dataKey="count" stroke="#1c7ed6" strokeWidth={2} dot={{ r: 4 }} name="Inspecciones" />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </Grid.Col>

        <Grid.Col span={{ base: 12, md: 5 }}>
          <Card withBorder p="md" h="100%">
            <Title order={5} mb="md">Colaboradores que faltan hoy</Title>
            {missing.length === 0 ? (
              <Text size="sm" c="dimmed">Todos registraron inspección.</Text>
            ) : (
              <Table striped fz="sm" withTableBorder={false}>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Nombre</Table.Th>
                    <Table.Th>Cédula</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {missing.slice(0, 15).map((m, i) => (
                    <Table.Tr key={i}>
                      <Table.Td>{m.name}</Table.Td>
                      <Table.Td>{m.cedula}</Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            )}
          </Card>
        </Grid.Col>
      </Grid>
    </div>
  );
}
