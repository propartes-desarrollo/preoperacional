import { Paper, Text, Textarea } from '@mantine/core';

export function OtherQuestionItem({ question, value, onChange }) {
  return (
    <Paper p="md" mb="sm" withBorder>
      <Text fw={500} mb="xs" size="md">
        {question.text}
      </Text>
      <Textarea
        placeholder="Describir si aplica"
        value={value?.observations || ''}
        onChange={(e) => onChange({ ...value, observations: e.target.value })}
        autosize
        minRows={2}
        styles={{ input: { fontSize: 16 } }}
      />
    </Paper>
  );
}
