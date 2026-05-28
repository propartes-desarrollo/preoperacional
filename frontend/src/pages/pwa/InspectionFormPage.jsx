import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Group,
  Title,
  Text,
  Badge,
  Button,
  Accordion,
  Progress,
  ActionIcon,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useInspection } from '../../context/InspectionContext.jsx';
import { QuestionItem } from '../../components/pwa/QuestionItem.jsx';
import { OtherQuestionItem } from '../../components/pwa/OtherQuestionItem.jsx';

export function InspectionFormPage() {
  const navigate = useNavigate();
  const { state, setAnswer, reset } = useInspection();
  const { sections, answers, nombre, apellidos, placa, vehicle_type, photos_required } = state;

  const [defaultValue] = useState(() => sections.map((s) => String(s.id)));

  const regularQuestions = sections.flatMap((s) =>
    s.questions.filter((q) => !q.is_other)
  );
  const answered = regularQuestions.filter((q) => answers[q.id]?.answer).length;
  const total = regularQuestions.length;

  const handleCancel = () => {
    reset();
    navigate('/');
  };

  const handleContinue = () => {
    const missing = regularQuestions.filter((q) => !answers[q.id]?.answer);
    if (missing.length > 0) {
      notifications.show({
        color: 'orange',
        title: 'Preguntas sin responder',
        message: `Falta responder: ${missing[0].text}`,
        autoClose: 5000,
      });
      return;
    }
    navigate(photos_required ? '/photos' : '/review');
  };

  const fullName = `${nombre} ${apellidos}`.trim();

  return (
    <Box style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Box
        px="md"
        py="sm"
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 100,
          backgroundColor: 'var(--mantine-color-body)',
          borderBottom: '1px solid var(--mantine-color-gray-3)',
        }}
      >
        <Group justify="space-between" wrap="nowrap">
          <Box style={{ minWidth: 0 }}>
            <Text fw={600} size="sm" truncate>
              {fullName}
            </Text>
            <Group gap={6} mt={2}>
              <Text size="xs" c="dimmed">
                {placa}
              </Text>
              <Badge size="xs" color={vehicle_type === 'moto' ? 'orange' : 'blue'}>
                {vehicle_type?.toUpperCase()}
              </Badge>
            </Group>
          </Box>
          <ActionIcon variant="subtle" color="red" onClick={handleCancel} size="lg">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <line x1="2" y1="2" x2="16" y2="16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <line x1="16" y1="2" x2="2" y2="16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </ActionIcon>
        </Group>
      </Box>

      <Container size={600} py="md" px="md" style={{ flex: 1 }}>
        <Box mb="md">
          <Group justify="space-between" mb={6}>
            <Text size="sm" c="dimmed">
              Progreso
            </Text>
            <Text size="sm" fw={500}>
              {answered} de {total} respondidas
            </Text>
          </Group>
          <Progress value={total > 0 ? (answered / total) * 100 : 0} size="sm" />
        </Box>

        {sections.length === 0 ? (
          <Text c="dimmed" ta="center" mt="xl">
            No hay secciones disponibles para este tipo de vehiculo.
          </Text>
        ) : (
          <Accordion multiple defaultValue={defaultValue} variant="separated">
            {sections.map((section) => (
              <Accordion.Item key={section.id} value={String(section.id)}>
                <Accordion.Control>
                  <Title order={5}>{section.name}</Title>
                </Accordion.Control>
                <Accordion.Panel>
                  {section.questions.map((question) =>
                    question.is_other ? (
                      <OtherQuestionItem
                        key={question.id}
                        question={question}
                        value={answers[question.id] || {}}
                        onChange={(val) => setAnswer(question.id, val)}
                      />
                    ) : (
                      <QuestionItem
                        key={question.id}
                        question={question}
                        value={answers[question.id] || {}}
                        onChange={(val) => setAnswer(question.id, val)}
                      />
                    )
                  )}
                </Accordion.Panel>
              </Accordion.Item>
            ))}
          </Accordion>
        )}

        <Button
          fullWidth
          size="lg"
          mt="xl"
          mb="xl"
          onClick={handleContinue}
          style={{ minHeight: 48 }}
        >
          Continuar
        </Button>
      </Container>
    </Box>
  );
}
