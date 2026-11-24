"use client";

import { useState } from "react";
import { ShowDatesButton } from "@/components/admin/show-dates-button";
import {
  useTableControls,
  type TableColumn,
} from "@/components/admin/table-controls";
import {
  AddIcon,
  Anchor,
  Button,
  Group,
  Stack,
  Table,
  Text,
} from "@/components/ui";
import { formatDateTime } from "@/lib/format";
import { FormulationPreview } from "./formulation-preview";
import type { FormulationRow, NoteOption, PerfumeOption } from "./types";

const COLUMNS: TableColumn[] = [
  { key: "name", label: "Name" },
  { key: "brand", label: "Brand", filter: "select", sortable: true },
  { key: "type", label: "Type", filter: "select", sortable: true },
  { key: "year", label: "Year", filter: "select", sortable: true },
  {
    key: "discontinued",
    label: "Discontinued",
    filter: "select",
    sortable: true,
  },
  { key: "remarks", label: "Remarks" },
];

export function FormulationsAdmin({
  formulations,
  allNotes,
  perfumes,
}: {
  formulations: FormulationRow[];
  allNotes: NoteOption[];
  perfumes: PerfumeOption[];
}) {
  const [selectedId, setSelectedId] = useState(formulations[0]?.id ?? null);
  const [mode, setMode] = useState<"view" | "edit" | "add">("view");
  const [showDates, setShowDates] = useState(false);
  const editing = mode !== "view";
  const selected = formulations.find(({ id }) => id === selectedId);

  // The filter and sort controls work on text, so give them each row as text.
  const byId = new Map(formulations.map((f) => [f.id, f]));
  const { shownRows, header, ariaSort } = useTableControls(
    formulations.map((f) => ({
      id: f.id,
      brand: f.perfume.brand.name,
      type: f.perfume.formulationType.name,
      year: f.year === null ? null : String(f.year),
      discontinued: f.discontinued ? "Yes" : "No",
    })),
    COLUMNS,
  );
  const shownFormulations = shownRows.map(({ id }) => byId.get(id)!);

  return (
    <Stack>
      <Group justify="flex-end" gap="xs">
        <ShowDatesButton shown={showDates} onChange={setShowDates} />
        <Button
          size="xs"
          leftSection={<AddIcon size={14} />}
          disabled={editing}
          onClick={() => setMode("add")}
        >
          Add formulation
        </Button>
      </Group>

      {mode === "add" || selected ? (
        <FormulationPreview
          key={mode === "add" ? "new" : selected?.id}
          formulation={mode === "add" ? null : (selected ?? null)}
          allNotes={allNotes}
          perfumes={perfumes}
          editing={editing}
          onEditingChange={(next) => setMode(next ? "edit" : "view")}
          onCreated={(id) => {
            setSelectedId(id);
            setMode("view");
          }}
        />
      ) : (
        <Text>Select a formulation to preview it.</Text>
      )}

      <Table.ScrollContainer minWidth={900}>
        <Table>
          <Table.Thead>
            <Table.Tr>
              {COLUMNS.map((column) => (
                <Table.Th key={column.key} aria-sort={ariaSort(column.key)}>
                  {header(column)}
                </Table.Th>
              ))}
              {showDates && (
                <>
                  <Table.Th>Updated At</Table.Th>
                  <Table.Th>Created At</Table.Th>
                </>
              )}
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {shownFormulations.map((formulation) => (
              <Table.Tr
                key={formulation.id}
                bg={
                  formulation.id === selectedId
                    ? "var(--mantine-primary-color-light)"
                    : undefined
                }
              >
                <Table.Td>
                  {/* Switching rows is locked while editing so a draft isn't lost. */}
                  <Anchor
                    component="button"
                    type="button"
                    disabled={editing}
                    onClick={() => setSelectedId(formulation.id)}
                  >
                    {formulation.perfume.name}
                  </Anchor>
                </Table.Td>
                <Table.Td>{formulation.perfume.brand.name}</Table.Td>
                <Table.Td>{formulation.perfume.formulationType.name}</Table.Td>
                <Table.Td>{formulation.year}</Table.Td>
                <Table.Td>{formulation.discontinued ? "Yes" : "No"}</Table.Td>
                <Table.Td>{formulation.remarks}</Table.Td>
                {showDates && (
                  <>
                    <Table.Td>{formatDateTime(formulation.updatedAt)}</Table.Td>
                    <Table.Td>{formatDateTime(formulation.createdAt)}</Table.Td>
                  </>
                )}
              </Table.Tr>
            ))}
            {shownFormulations.length === 0 && (
              <Table.Tr>
                <Table.Td colSpan={showDates ? 9 : 7}>
                  No formulations found.
                </Table.Td>
              </Table.Tr>
            )}
          </Table.Tbody>
        </Table>
      </Table.ScrollContainer>
    </Stack>
  );
}
