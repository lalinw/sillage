"use client";

import { useState } from "react";
import { ShowDatesButton } from "@/components/admin/show-dates-button";
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
              <Table.Th>Name</Table.Th>
              <Table.Th>Brand</Table.Th>
              <Table.Th>Type</Table.Th>
              <Table.Th>Year</Table.Th>
              <Table.Th>Discontinued</Table.Th>
              <Table.Th>Remarks</Table.Th>
              <Table.Th>Image</Table.Th>
              {showDates && (
                <>
                  <Table.Th>Updated At</Table.Th>
                  <Table.Th>Created At</Table.Th>
                </>
              )}
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {formulations.map((formulation) => (
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
                <Table.Td>{formulation.image}</Table.Td>
                {showDates && (
                  <>
                    <Table.Td>{formatDateTime(formulation.updatedAt)}</Table.Td>
                    <Table.Td>{formatDateTime(formulation.createdAt)}</Table.Td>
                  </>
                )}
              </Table.Tr>
            ))}
            {formulations.length === 0 && (
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
