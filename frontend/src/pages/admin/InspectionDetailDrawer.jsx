import { Drawer, Stack, Text, Group, Badge, Title, Divider, Image, SimpleGrid, Alert } from '@mantine/core';

function AnswerBadge({ answer }) {
  if (!answer) return <Badge color="gray" variant="light" size="sm">Sin respuesta</Badge>;
  return <Badge color={answer === 'malo' ? 'red' : 'green'} variant="light" size="sm">{answer}</Badge>;
}

export function InspectionDetailDrawer({ opened, onClose, inspection }) {
  if (!inspection) return null;

  const { collaborator, inspection_date, plate, vehicle_type, sections = [], photos = [] } = inspection;

  return (
    <Drawer opened={opened} onClose={onClose} title="Detalle de inspección" position="right" size="lg">
      <Stack gap="md">
        <Group>
          <div>
            <Text size="xs" c="dimmed">Colaborador</Text>
            <Text fw={600}>{collaborator?.first_name} {collaborator?.last_name}</Text>
            <Text size="sm" c="dimmed">Cedula: {collaborator?.cedula}</Text>
          </div>
          <div>
            <Text size="xs" c="dimmed">Fecha</Text>
            <Text fw={600}>{inspection_date}</Text>
          </div>
          <div>
            <Text size="xs" c="dimmed">Placa</Text>
            <Badge variant="light">{plate}</Badge>
          </div>
          <div>
            <Text size="xs" c="dimmed">Tipo</Text>
            <Badge variant="light" color="orange">{vehicle_type}</Badge>
          </div>
        </Group>

        <Divider />

        {sections.map((section) => (
          <div key={section.id}>
            <Text fw={700} mb="xs">{section.name}</Text>
            <Stack gap={6}>
              {section.answers.map((a) => (
                <div key={a.id} style={a.answer === 'malo' ? { background: '#fff5f5', borderRadius: 6, padding: '4px 8px' } : undefined}>
                  <Group gap="xs" wrap="nowrap" align="flex-start">
                    <AnswerBadge answer={a.answer} />
                    <Text size="sm" style={{ flex: 1 }}>{a.question_text}</Text>
                  </Group>
                  {a.observations && (
                    <Text size="xs" c="dimmed" ml={60}>{a.observations}</Text>
                  )}
                </div>
              ))}
            </Stack>
          </div>
        ))}

        {photos.length > 0 && (
          <>
            <Divider />
            <Title order={5}>Fotos ({photos.length})</Title>
            <SimpleGrid cols={2} spacing="xs">
              {photos.map((p) => (
                <div key={p.id}>
                  <Image
                    src={p.url}
                    alt={p.config_label || 'Foto'}
                    radius="sm"
                    h={140}
                    fit="cover"
                    fallbackSrc="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Crect width='100' height='100' fill='%23eee'/%3E%3C/svg%3E"
                  />
                  <Text size="xs" c="dimmed" mt={2}>{p.config_label || 'Foto'}</Text>
                  {p.exif_available && p.exif_date && (
                    <Text size="xs" c="dimmed">EXIF: {p.exif_date}</Text>
                  )}
                  {p.exif_available && p.exif_lat && (
                    <Text size="xs" c="dimmed">GPS: {Number(p.exif_lat).toFixed(4)}, {Number(p.exif_lng).toFixed(4)}</Text>
                  )}
                </div>
              ))}
            </SimpleGrid>
          </>
        )}
      </Stack>
    </Drawer>
  );
}
