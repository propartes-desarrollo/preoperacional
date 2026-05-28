import { LoadingOverlay as MantineLoadingOverlay } from '@mantine/core';

export function LoadingOverlay({ visible }) {
  return (
    <MantineLoadingOverlay
      visible={visible}
      overlayProps={{ radius: 'sm', blur: 2 }}
      loaderProps={{ size: 'lg' }}
    />
  );
}
