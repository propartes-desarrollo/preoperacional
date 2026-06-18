import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { AppShell, Group, Text, Button, NavLink, Stack } from '@mantine/core';
import {
  IconChartBar,
  IconClipboardList,
  IconUsers,
  IconUserCog,
  IconList,
  IconCamera,
  IconCalendar,
  IconUserShield,
  IconSettings,
} from '@tabler/icons-react';
import { useAdmin } from '../../context/AdminContext.jsx';

const NAV_LINKS = [
  { path: '/admin/dashboard', label: 'Dashboard', icon: IconChartBar },
  { path: '/admin/inspections', label: 'Inspecciones', icon: IconClipboardList },
  { path: '/admin/collaborators', label: 'Colaboradores', icon: IconUsers },
  { path: '/admin/collaborator-types', label: 'Tipos de usuario', icon: IconUserCog },
  { path: '/admin/sections', label: 'Secciones y preguntas', icon: IconList },
  { path: '/admin/photo-configs', label: 'Config. de fotos', icon: IconCamera },
  { path: '/admin/settings', label: 'Configuración', icon: IconSettings },
];

const SUPERADMIN_LINKS = [
  { path: '/admin/holidays', label: 'Festivos', icon: IconCalendar },
  { path: '/admin/users', label: 'Usuarios admin', icon: IconUserShield },
];

export function AdminLayout() {
  const { user } = useAdmin();
  const navigate = useNavigate();
  const location = useLocation();

  function logout() {
    localStorage.removeItem('admin_jwt');
    navigate('/admin/login', { replace: true });
  }

  const links = user?.role === 'superadmin' ? [...NAV_LINKS, ...SUPERADMIN_LINKS] : NAV_LINKS;

  return (
    <AppShell
      navbar={{ width: 230, breakpoint: 'md' }}
      header={{ height: 56 }}
      padding="md"
    >
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between">
          <Text fw={700} size="sm">Preoperacional Propartes - Admin</Text>
          <Group gap="xs">
            <Text size="sm" c="dimmed">{user?.name}</Text>
            <Button variant="light" size="xs" color="red" onClick={logout}>
              Cerrar sesión
            </Button>
          </Group>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="xs">
        <Stack gap={2}>
          {links.map((link) => (
            <NavLink
              key={link.path}
              label={link.label}
              leftSection={<link.icon size={16} stroke={1.5} />}
              active={location.pathname === link.path}
              onClick={() => navigate(link.path)}
              styles={{ root: { borderRadius: 6 } }}
            />
          ))}
        </Stack>
      </AppShell.Navbar>

      <AppShell.Main>
        <Outlet />
      </AppShell.Main>
    </AppShell>
  );
}
