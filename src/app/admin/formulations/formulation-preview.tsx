"use client";

import { useState, useTransition } from "react";
import { NoteModal } from "@/components/notes/note-modal";
import {
  AddIcon,
  Alert,
  Button,
  Checkbox,
  EditIcon,
  Group,
  Image,
  NumberInput,
  Paper,
  Pill,
  Select,
  Stack,
  Text,
  Textarea,
  TextInput,
} from "@/components/ui";
import { NoteType } from "@/generated/prisma/enums";
import { createFormulation, updateFormulation } from "./actions";
import type { FormulationRow, NoteOption, PerfumeOption } from "./types";

const NOTE_GROUPS = [
  { type: NoteType.TOP, label: "Top" },
  { type: NoteType.MIDDLE, label: "Middle" },
  { type: NoteType.BASE, label: "Base" },
  { type: NoteType.LINEAR, label: "Linear" },
];

// Shown when there's no image, or the link is broken.
const IMAGE_FALLBACK =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Crect width='160' height='160' fill='%23888' fill-opacity='.2'/%3E%3Ctext x='80' y='84' text-anchor='middle' font-family='sans-serif' font-size='14' fill='%23888'%3ENo image%3C/text%3E%3C/svg%3E";

type DraftNote = { id: string; name: string; type: NoteType };

function draftNotesOf(formulation: FormulationRow | null): DraftNote[] {
  return (formulation?.notes ?? []).map(({ type, note }) => ({
    ...note,
    type,
  }));
}

// With no formulation, this is the form for adding a new one.
export function FormulationPreview({
  formulation,
  allNotes,
  perfumes,
  editing,
  onEditingChange,
  onCreated,
}: {
  formulation: FormulationRow | null;
  allNotes: NoteOption[];
  perfumes: PerfumeOption[];
  editing: boolean;
  onEditingChange: (editing: boolean) => void;
  onCreated: (id: string) => void;
}) {
  const [name, setName] = useState(formulation?.perfume.name ?? "");
  const [perfumeId, setPerfumeId] = useState<string | null>(null);
  const [year, setYear] = useState<string | number>(formulation?.year ?? "");
  const [discontinued, setDiscontinued] = useState(
    formulation?.discontinued ?? false,
  );
  const [remarks, setRemarks] = useState(formulation?.remarks ?? "");
  const [notes, setNotes] = useState(() => draftNotesOf(formulation));
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function startEditing() {
    setName(formulation?.perfume.name ?? "");
    setYear(formulation?.year ?? "");
    setDiscontinued(formulation?.discontinued ?? false);
    setRemarks(formulation?.remarks ?? "");
    setNotes(draftNotesOf(formulation));
    setError(null);
    onEditingChange(true);
  }

  function save() {
    const fields = {
      year: year === "" ? null : Number(year),
      discontinued,
      remarks,
      notes: notes.map(({ id, type }) => ({ noteId: id, type })),
    };
    startTransition(async () => {
      if (!formulation) {
        const created = await createFormulation({ ...fields, perfumeId });
        if (created.ok) onCreated(created.id);
        else setError(created.error);
        return;
      }
      const result = await updateFormulation({
        ...fields,
        id: formulation.id,
        name,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setError(null);
      onEditingChange(false);
    });
  }

  const shownNotes = editing ? notes : draftNotesOf(formulation);
  // Images belong to the perfume; upload them on the Perfumes page.
  const shownImage = formulation?.perfume.images[0]?.url;

  return (
    <Paper withBorder p="md">
      <Group align="flex-start" wrap="nowrap">
        <Image
          src={shownImage || null}
          fallbackSrc={IMAGE_FALLBACK}
          alt={formulation?.perfume.name ?? "New formulation"}
          w={160}
          h={160}
          fit="contain"
        />
        <Stack flex={1} gap="sm">
          {editing ? (
            <>
              {formulation ? (
                <TextInput
                  label="Name"
                  description="Changes the perfume's name for all of its formulations"
                  value={name}
                  onChange={(event) => setName(event.currentTarget.value)}
                />
              ) : (
                <Select
                  label="Perfume"
                  required
                  searchable
                  placeholder="Search perfumes"
                  data={perfumes.map((perfume) => ({
                    value: perfume.id,
                    label: `${perfume.name} - ${perfume.brand.name} (${perfume.formulationType.name})`,
                  }))}
                  value={perfumeId}
                  onChange={setPerfumeId}
                  nothingFoundMessage="No perfumes found"
                />
              )}
              <NumberInput
                label="Year"
                hideControls
                allowDecimal={false}
                allowNegative={false}
                value={year}
                onChange={setYear}
              />
              <Checkbox
                label="Discontinued"
                checked={discontinued}
                onChange={(event) =>
                  setDiscontinued(event.currentTarget.checked)
                }
              />
              <Textarea
                label="Remarks"
                autosize
                minRows={2}
                value={remarks}
                onChange={(event) => setRemarks(event.currentTarget.value)}
              />
            </>
          ) : (
            <>
              <Text fw={700} size="lg">
                {formulation?.perfume.name}
              </Text>
              <Text size="sm">
                {[
                  formulation?.year,
                  formulation?.discontinued ? "Discontinued" : "Available",
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </Text>
              {formulation?.remarks && (
                <Text size="sm">{formulation.remarks}</Text>
              )}
            </>
          )}

          {NOTE_GROUPS.map(({ type, label }) => {
            const groupNotes = shownNotes.filter((note) => note.type === type);
            if (!editing && groupNotes.length === 0) return null;
            return (
              <NoteGroup
                key={type}
                label={label}
                notes={groupNotes}
                allNotes={allNotes}
                editing={editing}
                onAdd={(note) =>
                  setNotes((current) => [...current, { ...note, type }])
                }
                onRemove={(id) =>
                  setNotes((current) =>
                    current.filter(
                      (note) => note.id !== id || note.type !== type,
                    ),
                  )
                }
              />
            );
          })}

          {/* Next to Save: the top of a long form can be scrolled out of view. */}
          {error && <Alert color="red">{error}</Alert>}
          <Group justify="flex-end">
            {editing ? (
              <>
                <Button
                  variant="default"
                  disabled={pending}
                  onClick={() => onEditingChange(false)}
                >
                  Cancel
                </Button>
                <Button loading={pending} onClick={save}>
                  Save
                </Button>
              </>
            ) : (
              <Button
                variant="default"
                leftSection={<EditIcon size={14} />}
                onClick={startEditing}
              >
                Edit
              </Button>
            )}
          </Group>
        </Stack>
      </Group>
    </Paper>
  );
}

function NoteGroup({
  label,
  notes,
  allNotes,
  editing,
  onAdd,
  onRemove,
}: {
  label: string;
  notes: DraftNote[];
  allNotes: NoteOption[];
  editing: boolean;
  onAdd: (note: { id: string; name: string }) => void;
  onRemove: (id: string) => void;
}) {
  const [searching, setSearching] = useState(false);
  const [search, setSearch] = useState("");
  const [creating, setCreating] = useState(false);

  const available = allNotes.filter(
    (option) => !notes.some((note) => note.id === option.id),
  );

  function closeSearch() {
    setSearching(false);
    setSearch("");
  }

  return (
    <Stack gap={4}>
      <Text size="sm" fw={500}>
        {label}
      </Text>
      <Group gap="xs">
        {notes.map((note) => (
          <Pill
            key={note.id}
            size="md"
            bg="var(--mantine-primary-color-light)"
            withRemoveButton={editing}
            removeButtonProps={{
              "aria-label": `Remove ${note.name} from ${label}`,
            }}
            onRemove={() => onRemove(note.id)}
          >
            {note.name}
          </Pill>
        ))}
        {editing && !searching && (
          <Button
            size="compact-xs"
            variant="light"
            leftSection={<AddIcon size={12} />}
            aria-label={`Add ${label} note`}
            onClick={() => setSearching(true)}
          >
            Add
          </Button>
        )}
      </Group>
      {editing && searching && (
        <Stack gap="xs">
          <Group gap="xs">
            {/* Keep focus in the search box: losing it clears the typed name. */}
            <Button
              size="xs"
              variant="light"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => setCreating(true)}
            >
              New note
            </Button>
            <Button size="xs" variant="subtle" onClick={closeSearch}>
              Close
            </Button>
          </Group>
          <Select
            size="xs"
            searchable
            defaultDropdownOpened
            autoFocus
            aria-label={`Search ${label} notes`}
            placeholder="Search notes"
            data={available.map(({ id, name }) => ({ value: id, label: name }))}
            value={null}
            searchValue={search}
            onSearchChange={setSearch}
            nothingFoundMessage="No notes found"
            onChange={(id) => {
              const option = available.find((note) => note.id === id);
              if (option) onAdd(option);
              closeSearch();
            }}
          />
        </Stack>
      )}
      <NoteModal
        opened={creating}
        onClose={() => setCreating(false)}
        aliasTargets={allNotes.filter(
          (note) => note.isMain || note.isStandalone,
        )}
        initialName={search}
        onSaved={(note) => {
          onAdd(note);
          closeSearch();
        }}
      />
    </Stack>
  );
}
