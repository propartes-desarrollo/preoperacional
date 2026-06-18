import { Paper, Text, SegmentedControl, Textarea, Switch, Group } from '@mantine/core';

export function QuestionItem({ question, value, onChange }) {
  const noAplica = value?.answer === 'no_aplica';
  const isMalo = value?.answer === 'malo';

  const handleToggleAplica = (aplica) => {
    if (aplica) {
      onChange({ ...value, answer: null });
    } else {
      onChange({ ...value, answer: 'no_aplica' });
    }
  };

  return (
    <Paper
      p="md"
      mb="sm"
      withBorder
      style={{
        borderColor: isMalo ? 'var(--mantine-color-red-4)' : undefined,
        borderWidth: isMalo ? 2 : undefined,
      }}
    >
      <Group justify="space-between" align="flex-start" mb="xs" wrap="nowrap">
        <Text fw={500} size="md" style={{ flex: 1 }}>
          {question.text}
        </Text>
        <Switch
          label="Aplica"
          checked={!noAplica}
          onChange={(e) => handleToggleAplica(e.currentTarget.checked)}
          size="sm"
          styles={{ label: { fontSize: 14 } }}
        />
      </Group>

      {!noAplica && (
        <SegmentedControl
          fullWidth
          data={[
            { label: 'Bueno', value: 'bueno' },
            { label: 'Malo', value: 'malo' },
          ]}
          value={value?.answer && value.answer !== 'no_aplica' ? value.answer : ''}
          onChange={(answer) => onChange({ ...value, answer })}
          color={isMalo ? 'red' : 'blue'}
          mb="sm"
          styles={{ label: { fontSize: 16, minHeight: 40, display: 'flex', alignItems: 'center' } }}
        />
      )}

      <Textarea
        placeholder="Observaciones (opcional)"
        value={value?.observations || ''}
        onChange={(e) => onChange({ ...value, observations: e.target.value })}
        autosize
        minRows={2}
        styles={{ input: { fontSize: 16 } }}
      />
    </Paper>
  );
}
