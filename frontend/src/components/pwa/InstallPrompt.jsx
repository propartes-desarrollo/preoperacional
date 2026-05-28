import { Button } from '@mantine/core';
import { useInstallPrompt } from '../../hooks/useInstallPrompt.js';

export function InstallPrompt() {
  const { canInstall, install } = useInstallPrompt();

  if (!canInstall) return null;

  return (
    <Button variant="light" onClick={install} fullWidth mt="xs">
      Instalar aplicacion
    </Button>
  );
}
