"use client";

import { useState } from "react";
import { Group, Select, Stack, Table, Text, TextInput } from "@/components/ui";
import { ShowDatesButton } from "./show-dates-button";

// Timestamp columns, hidden until "Show dates" is pressed.
const DATE_KEYS = new Set(["updatedAt", "createdAt"]);

type Row = { id: string } & Record<string, string | null>;

type Column = {
  key: string;
  label: string;
  // Adds a filter in the header: "select" is a dropdown of the column's values,
  // "search" is a text box that keeps rows containing what's typed.
  filter?: "select" | "search";
};

// Read-only table of one database table. Pages pass rows already formatted as text.
export function DataTable({
  title,
  action,
  columns,
  rows,
  rowActions,
}: {
  title?: string;
  // Shown at the top right, e.g. an "Add" button.
  action?: React.ReactNode;
  columns: Column[];
  rows: Row[];
  // Shown at the end of each row, keyed by row id, e.g. an edit button.
  rowActions?: Record<string, React.ReactNode>;
}) {
  const [filters, setFilters] = useState<Record<string, string | null>>({});
  const [showDates, setShowDates] = useState(false);
  const hasDates = columns.some(({ key }) => DATE_KEYS.has(key));
  const shownColumns = showDates
    ? columns
    : columns.filter(({ key }) => !DATE_KEYS.has(key));
  const columnCount = shownColumns.length + (rowActions ? 1 : 0);

  const searchKeys = new Set(
    columns.filter((column) => column.filter === "search").map((c) => c.key),
  );

  // True when the row matches every filter, optionally ignoring one column's.
  const matches = (row: Row, ignoreKey?: string) =>
    Object.entries(filters).every(([key, value]) => {
      if (key === ignoreKey || !value?.trim()) return true;
      if (searchKeys.has(key)) {
        return (row[key] ?? "")
          .toLowerCase()
          .includes(value.trim().toLowerCase());
      }
      return row[key] === value;
    });
  const shownRows = rows.filter((row) => matches(row));

  // Options follow the other filters. The current selection stays listed so it
  // can still be seen and changed when other filters leave no rows for it.
  function filterOptions(key: string) {
    const values = new Set(
      rows
        .filter((row) => matches(row, key))
        .flatMap((row) => (row[key] ? [row[key]] : [])),
    );
    const current = filters[key];
    if (current) values.add(current);
    return [...values].sort((a, b) => a.localeCompare(b));
  }

  return (
    <Stack gap="xs">
      {(title || action || hasDates) && (
        <Group justify="space-between">
          {title ? <Text fw={700}>{title}</Text> : <span />}
          <Group gap="xs">
            {hasDates && (
              <ShowDatesButton shown={showDates} onChange={setShowDates} />
            )}
            {action}
          </Group>
        </Group>
      )}
      <Table.ScrollContainer minWidth={700}>
        <Table>
          <Table.Thead>
            <Table.Tr>
              {shownColumns.map(({ key, label, filter }) => (
                <Table.Th key={key}>
                  {filter === "search" && (
                    <Stack gap={4}>
                      {label}
                      <TextInput
                        size="xs"
                        miw={160}
                        aria-label={`Search ${label.toLowerCase()}`}
                        placeholder="Search"
                        value={filters[key] ?? ""}
                        onChange={(event) => {
                          const { value } = event.currentTarget;
                          setFilters((current) => ({
                            ...current,
                            [key]: value,
                          }));
                        }}
                      />
                    </Stack>
                  )}
                  {filter === "select" && (
                    <Stack gap={4}>
                      {label}
                      <Select
                        size="xs"
                        // Otherwise a short column squeezes it until values wrap.
                        miw={160}
                        aria-label={`Filter by ${label.toLowerCase()}`}
                        placeholder="All"
                        searchable
                        clearable
                        data={filterOptions(key)}
                        value={filters[key] ?? null}
                        onChange={(value) =>
                          setFilters((current) => ({
                            ...current,
                            [key]: value,
                          }))
                        }
                      />
                    </Stack>
                  )}
                  {!filter && label}
                </Table.Th>
              ))}
              {rowActions && <Table.Th />}
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {shownRows.map((row) => (
              <Table.Tr key={row.id}>
                {shownColumns.map(({ key }) => (
                  <Table.Td key={key}>{row[key]}</Table.Td>
                ))}
                {rowActions && <Table.Td>{rowActions[row.id]}</Table.Td>}
              </Table.Tr>
            ))}
            {shownRows.length === 0 && (
              <Table.Tr>
                <Table.Td colSpan={columnCount}>No rows found.</Table.Td>
              </Table.Tr>
            )}
          </Table.Tbody>
        </Table>
      </Table.ScrollContainer>
    </Stack>
  );
}
