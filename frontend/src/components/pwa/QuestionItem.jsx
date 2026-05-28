import { Paper, Text, SegmentedControl, Textarea } from '@mantine/core';

export function QuestionItem({ question, value, onChange }) {
  const isMalo = value?.answer === 'malo';

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
      <Text fw={500} mb="xs" size="md">
        {question.text}
      </Text>
      <SegmentedControl
        fullWidth
        data={[
          { label: 'Bueno', value: 'bueno' },
          { label: 'Malo', value: 'malo' },
        ]}
        value={value?.answer || ''}
        onChange={(answer) => onChange({ ...value, answer })}
        color={isMalo ? 'red' : 'blue'}
        mb="sm"
        styles={{ label: { fontSize: 16, minHeight: 40, display: 'flex', alignItems: 'center' } }}
      />
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
