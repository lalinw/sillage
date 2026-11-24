"use client";

import { useState } from "react";
import { Group, Stack, Table, Text } from "@/components/ui";
import { ShowDatesButton } from "./show-dates-button";
import {
  useTableControls,
  type TableColumn,
  type TableRow,
} from "./table-controls";

// Timestamp columns, hidden until "Show dates" is pressed.
const DATE_KEYS = new Set(["updatedAt", "createdAt"]);

// Read-only table of one database table. Pages pass rows already formatted as text.
export function DataTable({
  title,
  action,
  columns,
  rows,
  rowActions,
  cells,
  minWidth = 700,
}: {
  title?: string;
  // Shown at the top right, e.g. an "Add" button.
  action?: React.ReactNode;
  columns: TableColumn[];
  rows: TableRow[];
  // Shown at the end of each row, keyed by row id, e.g. an edit button.
  rowActions?: Record<string, React.ReactNode>;
  // Content that isn't plain text, by column key and then row id, e.g. images.
  cells?: Record<string, Record<string, React.ReactNode>>;
  // Below this width the table scrolls sideways instead of squeezing.
  minWidth?: number;
}) {
  const [showDates, setShowDates] = useState(false);
  const { shownRows, header, ariaSort } = useTableControls(rows, columns);
  const hasDates = columns.some(({ key }) => DATE_KEYS.has(key));
  const shownColumns = showDates
    ? columns
    : columns.filter(({ key }) => !DATE_KEYS.has(key));
  const columnCount = shownColumns.length + (rowActions ? 1 : 0);

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
      <Table.ScrollContainer minWidth={minWidth}>
        <Table>
          <Table.Thead>
            <Table.Tr>
              {shownColumns.map((column) => (
                <Table.Th key={column.key} aria-sort={ariaSort(column.key)}>
                  {header(column)}
                </Table.Th>
              ))}
              {rowActions && <Table.Th />}
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {shownRows.map((row) => (
              <Table.Tr key={row.id}>
                {shownColumns.map(({ key }) => (
                  <Table.Td key={key}>
                    {cells?.[key]?.[row.id] ?? row[key]}
                  </Table.Td>
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
