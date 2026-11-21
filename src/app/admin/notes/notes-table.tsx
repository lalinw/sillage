"use client";

import { useState } from "react";
import { ShowDatesButton } from "@/components/admin/show-dates-button";
import { type EditableNote, NoteModal } from "@/components/notes/note-modal";
import {
  ActionIcon,
  AddIcon,
  Button,
  EditIcon,
  Group,
  Select,
  Stack,
  Table,
  TextInput,
} from "@/components/ui";
import { formatDateTime } from "@/lib/format";

const NOTE_KINDS = ["Main", "Alias", "Standalone"] as const;
type NoteKind = (typeof NOTE_KINDS)[number];

type NoteRow = EditableNote & {
  createdAt: Date;
  updatedAt: Date;
  mainAlias: { name: string } | null;
};

// Main notes point to themselves, aliases to another note, standalone notes nowhere.
function kindOf(note: NoteRow): NoteKind {
  if (note.isMain) return "Main";
  return note.mainAliasId ? "Alias" : "Standalone";
}

export function NotesTable({ notes }: { notes: NoteRow[] }) {
  const [nameFilter, setNameFilter] = useState("");
  const [aliasFilter, setAliasFilter] = useState<string | null>(null);
  const [kindFilter, setKindFilter] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  // Kept after closing, so the modal still shows the note while it fades out.
  const [editing, setEditing] = useState<NoteRow | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [showDates, setShowDates] = useState(false);
  const aliasTargets = notes.filter(
    (note) => note.isMain || note.mainAliasId === null,
  );

  const search = nameFilter.trim().toLowerCase();
  const nameMatches = notes.filter(
    (note) =>
      note.name.toLowerCase().includes(search) &&
      (!kindFilter || kindOf(note) === kindFilter),
  );

  // Options follow the other filters. The current selection stays listed so it
  // can still be seen and changed when a name filter leaves no rows for it.
  const aliasOptions = new Set(
    nameMatches.flatMap((note) =>
      note.mainAlias ? [note.mainAlias.name] : [],
    ),
  );
  if (aliasFilter) aliasOptions.add(aliasFilter);

  const rows = aliasFilter
    ? nameMatches.filter((note) => note.mainAlias?.name === aliasFilter)
    : nameMatches;

  return (
    <Stack>
      <Group justify="flex-end" gap="xs">
        <ShowDatesButton shown={showDates} onChange={setShowDates} />
        <Button
          size="xs"
          leftSection={<AddIcon size={14} />}
          onClick={() => setAdding(true)}
        >
          Add note
        </Button>
      </Group>
      <NoteModal
        opened={adding}
        onClose={() => setAdding(false)}
        aliasTargets={aliasTargets}
      />
      <NoteModal
        opened={editOpen}
        onClose={() => setEditOpen(false)}
        aliasTargets={aliasTargets}
        note={editing ?? undefined}
      />
      <Table>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>
              <Stack gap={4}>
                Name
                <TextInput
                  size="xs"
                  aria-label="Filter by name"
                  placeholder="Filter"
                  value={nameFilter}
                  onChange={(event) => setNameFilter(event.currentTarget.value)}
                />
              </Stack>
            </Table.Th>
            <Table.Th>
              <Stack gap={4}>
                Main Alias
                <Select
                  size="xs"
                  aria-label="Filter by main alias"
                  placeholder="All"
                  data={[...aliasOptions].sort()}
                  value={aliasFilter}
                  onChange={setAliasFilter}
                  clearable
                />
              </Stack>
            </Table.Th>
            <Table.Th>
              <Stack gap={4}>
                Main Note?
                <Select
                  size="xs"
                  aria-label="Filter by main note"
                  placeholder="All"
                  data={NOTE_KINDS}
                  value={kindFilter}
                  onChange={setKindFilter}
                  clearable
                />
              </Stack>
            </Table.Th>
            {showDates && (
              <>
                <Table.Th>Updated At</Table.Th>
                <Table.Th>Created At</Table.Th>
              </>
            )}
            <Table.Th />
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {rows.map((note) => (
            <Table.Tr key={note.id}>
              <Table.Td>{note.name}</Table.Td>
              <Table.Td>{note.mainAlias?.name}</Table.Td>
              <Table.Td>{kindOf(note)}</Table.Td>
              {showDates && (
                <>
                  <Table.Td>{formatDateTime(note.updatedAt)}</Table.Td>
                  <Table.Td>{formatDateTime(note.createdAt)}</Table.Td>
                </>
              )}
              <Table.Td>
                <ActionIcon
                  variant="subtle"
                  aria-label={`Edit ${note.name}`}
                  onClick={() => {
                    setEditing(note);
                    setEditOpen(true);
                  }}
                >
                  <EditIcon size={16} />
                </ActionIcon>
              </Table.Td>
            </Table.Tr>
          ))}
          {rows.length === 0 && (
            <Table.Tr>
              <Table.Td colSpan={showDates ? 6 : 4}>No notes found.</Table.Td>
            </Table.Tr>
          )}
        </Table.Tbody>
      </Table>
    </Stack>
  );
}
