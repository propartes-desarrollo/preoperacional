import { useEffect, useState } from 'react';
import {
  Title, Tabs, Stack, Card, Group, Text, Badge, Button, ActionIcon, Modal,
  TextInput, Switch, Loader, Center, Tooltip
} from '@mantine/core';
import {
  IconPlus, IconEdit, IconTrash, IconChevronUp, IconChevronDown, IconToggleRight
} from '@tabler/icons-react';
import {
  getSections, createSection, updateSection, deleteSection, reorderSections,
  createQuestion, updateQuestion, deleteQuestion, reorderQuestions,
} from '../../api/adminApi.js';
import { notifications } from '@mantine/notifications';

function QuestionRow({ q, onEdit, onDelete, onMoveUp, onMoveDown, isFirst, isLast }) {
  return (
    <Group gap="xs" wrap="nowrap" py={4} px="xs" style={{ borderBottom: '1px solid var(--mantine-color-gray-2)' }}>
      <Group gap={2}>
        <ActionIcon size="xs" variant="subtle" disabled={isFirst} onClick={onMoveUp}><IconChevronUp size={12} /></ActionIcon>
        <ActionIcon size="xs" variant="subtle" disabled={isLast} onClick={onMoveDown}><IconChevronDown size={12} /></ActionIcon>
      </Group>
      <Text size="sm" style={{ flex: 1 }} c={q.is_active ? undefined : 'dimmed'}>{q.text}</Text>
      {q.is_other && <Badge size="xs" color="violet">Otro</Badge>}
      {!q.is_active && <Badge size="xs" color="gray">Inactiva</Badge>}
      <ActionIcon size="xs" variant="light" onClick={onEdit}><IconEdit size={12} /></ActionIcon>
      <ActionIcon size="xs" variant="light" color="red" onClick={onDelete}><IconTrash size={12} /></ActionIcon>
    </Group>
  );
}

function SectionCard({ section, vehicleType, onReload, onMoveUp, onMoveDown, isFirst, isLast, allSectionIds }) {
  const [qModal, setQModal] = useState({ opened: false, question: null });
  const [qForm, setQForm] = useState({ text: '', is_other: false });
  const [sModal, setSModal] = useState(false);
  const [sForm, setSForm] = useState({ name: section.name, is_active: section.is_active });
  const [loading, setLoading] = useState(false);

  async function saveQuestion() {
    setLoading(true);
    try {
      if (qModal.question) {
        await updateQuestion(qModal.question.id, qForm);
      } else {
        await createQuestion({ section_id: section.id, ...qForm });
      }
      notifications.show({ message: 'Pregunta guardada.', color: 'green' });
      setQModal({ opened: false, question: null });
      onReload();
    } catch (err) {
      notifications.show({ message: err.response?.data?.error || 'Error.', color: 'red' });
    } finally {
      setLoading(false);
    }
  }

  async function delQuestion(q) {
    if (!window.confirm(`Eliminar pregunta: "${q.text}"?`)) return;
    try {
      await deleteQuestion(q.id);
      onReload();
    } catch (err) {
      notifications.show({ message: err.response?.data?.error || 'Error.', color: 'red' });
    }
  }

  async function moveQuestion(questions, idx, dir) {
    const ids = [...questions.map((q) => q.id)];
    const swapIdx = idx + dir;
    if (swapIdx < 0 || swapIdx >= ids.length) return;
    [ids[idx], ids[swapIdx]] = [ids[swapIdx], ids[idx]];
    await reorderQuestions(section.id, ids);
    onReload();
  }

  async function saveSection() {
    setLoading(true);
    try {
      await updateSection(section.id, sForm);
      notifications.show({ message: 'Seccion actualizada.', color: 'green' });
      setSModal(false);
      onReload();
    } catch (err) {
      notifications.show({ message: err.response?.data?.error || 'Error.', color: 'red' });
    } finally {
      setLoading(false);
    }
  }

  async function delSection() {
    if (!window.confirm(`Desactivar seccion "${section.name}"?`)) return;
    try {
      await deleteSection(section.id);
      onReload();
    } catch (err) {
      notifications.show({ message: err.response?.data?.error || 'Error.', color: 'red' });
    }
  }

  const questions = section.questions || [];

  return (
    <Card withBorder p="sm" mb="sm">
      <Group justify="space-between" mb="xs">
        <Group gap="xs">
          <Group gap={2}>
            <ActionIcon size="xs" variant="subtle" disabled={isFirst} onClick={onMoveUp}><IconChevronUp size={14} /></ActionIcon>
            <ActionIcon size="xs" variant="subtle" disabled={isLast} onClick={onMoveDown}><IconChevronDown size={14} /></ActionIcon>
          </Group>
          <Text fw={600}>{section.name}</Text>
          {!section.is_active && <Badge size="xs" color="gray">Inactiva</Badge>}
        </Group>
        <Group gap={4}>
          <ActionIcon size="sm" variant="light" onClick={() => { setSForm({ name: section.name, is_active: section.is_active }); setSModal(true); }}>
            <IconEdit size={14} />
          </ActionIcon>
          <ActionIcon size="sm" variant="light" color="red" onClick={delSection}><IconTrash size={14} /></ActionIcon>
        </Group>
      </Group>

      <Stack gap={0}>
        {questions.map((q, idx) => (
          <QuestionRow
            key={q.id} q={q}
            isFirst={idx === 0} isLast={idx === questions.length - 1}
            onEdit={() => { setQForm({ text: q.text, is_other: q.is_other }); setQModal({ opened: true, question: q }); }}
            onDelete={() => delQuestion(q)}
            onMoveUp={() => moveQuestion(questions, idx, -1)}
            onMoveDown={() => moveQuestion(questions, idx, 1)}
          />
        ))}
      </Stack>

      <Button
        size="xs" variant="light" mt="xs" leftSection={<IconPlus size={12} />}
        onClick={() => { setQForm({ text: '', is_other: false }); setQModal({ opened: true, question: null }); }}
      >
        Agregar pregunta
      </Button>

      <Modal opened={qModal.opened} onClose={() => setQModal({ opened: false, question: null })}
        title={qModal.question ? 'Editar pregunta' : 'Nueva pregunta'} size="sm">
        <Stack gap="sm">
          <TextInput label="Texto de la pregunta" required value={qForm.text}
            onChange={(e) => setQForm({ ...qForm, text: e.target.value })}
            styles={{ input: { fontSize: 16 } }}
          />
          <Switch label="Es pregunta 'Otro - Cual'" checked={qForm.is_other}
            onChange={(e) => setQForm({ ...qForm, is_other: e.currentTarget.checked })}
          />
          <Group justify="flex-end">
            <Button variant="default" onClick={() => setQModal({ opened: false, question: null })}>Cancelar</Button>
            <Button onClick={saveQuestion} loading={loading}>Guardar</Button>
          </Group>
        </Stack>
      </Modal>

      <Modal opened={sModal} onClose={() => setSModal(false)} title="Editar seccion" size="sm">
        <Stack gap="sm">
          <TextInput label="Nombre" required value={sForm.name}
            onChange={(e) => setSForm({ ...sForm, name: e.target.value })}
            styles={{ input: { fontSize: 16 } }}
          />
          <Switch label="Activa" checked={sForm.is_active}
            onChange={(e) => setSForm({ ...sForm, is_active: e.currentTarget.checked })}
          />
          <Group justify="flex-end">
            <Button variant="default" onClick={() => setSModal(false)}>Cancelar</Button>
            <Button onClick={saveSection} loading={loading}>Guardar</Button>
          </Group>
        </Stack>
      </Modal>
    </Card>
  );
}

export function SectionsPage() {
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('auto');
  const [newModal, setNewModal] = useState(false);
  const [newForm, setNewForm] = useState({ name: '' });
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const data = await getSections();
      setSections(data.sections || []);
    } catch {
      notifications.show({ message: 'Error al cargar secciones.', color: 'red' });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleCreateSection() {
    setSaving(true);
    try {
      await createSection({ vehicle_type: activeTab, name: newForm.name });
      notifications.show({ message: 'Seccion creada.', color: 'green' });
      setNewModal(false);
      setNewForm({ name: '' });
      load();
    } catch (err) {
      notifications.show({ message: err.response?.data?.error || 'Error.', color: 'red' });
    } finally {
      setSaving(false);
    }
  }

  async function moveSection(filteredSections, idx, dir) {
    const swapIdx = idx + dir;
    if (swapIdx < 0 || swapIdx >= filteredSections.length) return;
    const ids = filteredSections.map((s) => s.id);
    [ids[idx], ids[swapIdx]] = [ids[swapIdx], ids[idx]];
    await reorderSections(filteredSections[idx].id, ids);
    load();
  }

  const filtered = sections.filter((s) => s.vehicle_type === activeTab);

  return (
    <div>
      <Group justify="space-between" mb="md">
        <Title order={3}>Secciones y preguntas</Title>
        <Button leftSection={<IconPlus size={14} />} onClick={() => setNewModal(true)}>
          Nueva seccion
        </Button>
      </Group>

      <Tabs value={activeTab} onChange={setActiveTab} mb="md">
        <Tabs.List>
          <Tabs.Tab value="auto">Auto</Tabs.Tab>
          <Tabs.Tab value="moto">Moto</Tabs.Tab>
        </Tabs.List>
      </Tabs>

      {loading ? (
        <Center h={200}><Loader /></Center>
      ) : (
        <div>
          {filtered.map((s, idx) => (
            <SectionCard
              key={s.id} section={s} vehicleType={activeTab}
              isFirst={idx === 0} isLast={idx === filtered.length - 1}
              onReload={load}
              onMoveUp={() => moveSection(filtered, idx, -1)}
              onMoveDown={() => moveSection(filtered, idx, 1)}
              allSectionIds={filtered.map((x) => x.id)}
            />
          ))}
          {filtered.length === 0 && <Text c="dimmed" ta="center" py="xl">No hay secciones para {activeTab}.</Text>}
        </div>
      )}

      <Modal opened={newModal} onClose={() => setNewModal(false)} title="Nueva seccion" size="sm">
        <Stack gap="sm">
          <TextInput label="Nombre de la seccion" required value={newForm.name}
            onChange={(e) => setNewForm({ name: e.target.value })}
            styles={{ input: { fontSize: 16 } }}
          />
          <Text size="sm" c="dimmed">Tipo de vehiculo: <strong>{activeTab}</strong></Text>
          <Group justify="flex-end">
            <Button variant="default" onClick={() => setNewModal(false)}>Cancelar</Button>
            <Button onClick={handleCreateSection} loading={saving}>Crear</Button>
          </Group>
        </Stack>
      </Modal>
    </div>
  );
}
