"use client";

import { useState, useTransition } from "react";
import {
  createNote,
  type SavedNote,
  updateNote,
} from "@/app/admin/notes/actions";
import {
  Alert,
  Button,
  Checkbox,
  Group,
  Modal,
  Select,
  Stack,
  TextInput,
} from "@/components/ui";

export type EditableNote = {
  id: string;
  name: string;
  isMain: boolean;
  mainAliasId: string | null;
};

type NoteModalProps = {
  opened: boolean;
  onClose: () => void;
  // Notes that can be chosen as a main alias: main notes, and standalone notes
  // (which become main notes when chosen).
  aliasTargets: { id: string; name: string; isMain: boolean }[];
  // With a note, the modal edits it. Without one, it adds a new note.
  note?: EditableNote;
  initialName?: string;
  onSaved?: (note: SavedNote) => void;
};

export function NoteModal({ opened, onClose, ...formProps }: NoteModalProps) {
  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={formProps.note ? "Edit note" : "Add a new note"}
    >
      {/* Modal unmounts its content once closed, so each open starts a fresh form.
          The key also resets it when another note opens before the close finishes. */}
      <NoteForm key={formProps.note?.id} onClose={onClose} {...formProps} />
    </Modal>
  );
}

function NoteForm({
  onClose,
  aliasTargets,
  note,
  initialName = "",
  onSaved,
}: Omit<NoteModalProps, "opened">) {
  const [name, setName] = useState(note?.name ?? initialName);
  const [isMain, setIsMain] = useState(note?.isMain ?? false);
  const [mainAliasId, setMainAliasId] = useState<string | null>(
    note && !note.isMain ? note.mainAliasId : null,
  );
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  // A note can't be an alias of itself, other than by being main.
  const targets = aliasTargets.filter((option) => option.id !== note?.id);
  const toOption = ({ id, name }: { id: string; name: string }) => ({
    value: id,
    label: name,
  });
  const aliasOptions = [
    {
      group: "Main notes",
      items: targets.filter((option) => option.isMain).map(toOption),
    },
    {
      group: "Standalone notes (will become main)",
      items: targets.filter((option) => !option.isMain).map(toOption),
    },
  ].filter(({ items }) => items.length > 0);

  function removeMainAlias() {
    setIsMain(false);
    setMainAliasId(null);
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    startTransition(async () => {
      const fields = { name, isMain, mainAliasId };
      const result = note
        ? await updateNote({ ...fields, id: note.id })
        : await createNote(fields);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      onSaved?.(result.note);
      onClose();
    });
  }

  return (
    <form onSubmit={handleSubmit}>
      <Stack>
        {error && <Alert color="red">{error}</Alert>}
        <TextInput
          label="Name"
          required
          data-autofocus
          value={name}
          onChange={(event) => setName(event.currentTarget.value)}
        />
        <Checkbox
          label="Main note"
          checked={isMain}
          onChange={(event) => setIsMain(event.currentTarget.checked)}
        />
        {!isMain && (
          <Select
            label="Main alias"
            description="Leave empty if not assigned yet"
            searchable
            placeholder="Search notes"
            data={aliasOptions}
            value={mainAliasId}
            onChange={setMainAliasId}
            nothingFoundMessage="No notes found"
          />
        )}
        <Group justify="space-between">
          {/* Leaves the note unassigned, whether it was main or an alias. */}
          <Button
            variant="subtle"
            color="red"
            disabled={pending || (!isMain && !mainAliasId)}
            onClick={removeMainAlias}
          >
            Remove main alias
          </Button>
          <Group>
            <Button variant="default" onClick={onClose} disabled={pending}>
              Cancel
            </Button>
            <Button type="submit" loading={pending}>
              {note ? "Save" : "Add note"}
            </Button>
          </Group>
        </Group>
      </Stack>
    </form>
  );
}
