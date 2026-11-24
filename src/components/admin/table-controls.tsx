"use client";

import { useState } from "react";
import {
  ActionIcon,
  Group,
  Select,
  SortAscendingIcon,
  SortDescendingIcon,
  SortIcon,
  Stack,
  TextInput,
} from "@/components/ui";

export type TableRow = { id: string } & Record<string, string | null>;

export type TableColumn = {
  key: string;
  label: string;
  // Adds a filter in the header: "select" is a dropdown of the column's values,
  // "search" is a text box that keeps rows containing what's typed.
  filter?: "select" | "search";
  // Adds a button in the header that sorts rows by this column.
  sortable?: boolean;
};

type Sort = { key: string; direction: "ascending" | "descending" };

// Numbers and dates are stored as text; numeric compare keeps "9" before "10".
const compareText = (a: string, b: string) =>
  a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" });

// Filter and sort state for a table's header. Returns the rows to show, and the
// header content and aria-sort value for each column.
export function useTableControls<Row extends TableRow>(
  rows: Row[],
  columns: TableColumn[],
) {
  const [filters, setFilters] = useState<Record<string, string | null>>({});
  const [sort, setSort] = useState<Sort | null>(null);

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
  if (sort) {
    const sign = sort.direction === "ascending" ? 1 : -1;
    shownRows.sort((a, b) => {
      const x = a[sort.key] ?? "";
      const y = b[sort.key] ?? "";
      // Empty cells go last whichever way the column is sorted.
      if (!x || !y) return Number(!x) - Number(!y);
      return sign * compareText(x, y);
    });
  }

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
    return [...values].sort(compareText);
  }

  const setFilter = (key: string, value: string | null) =>
    setFilters((current) => ({ ...current, [key]: value }));

  // Each press goes ascending, then descending, then back to unsorted.
  function toggleSort(key: string) {
    setSort((current) => {
      if (current?.key !== key) return { key, direction: "ascending" };
      if (current.direction === "ascending") {
        return { key, direction: "descending" };
      }
      return null;
    });
  }

  function ariaSort(key: string) {
    return sort?.key === key ? sort.direction : undefined;
  }

  function header({ key, label, filter, sortable }: TableColumn) {
    const direction = ariaSort(key);
    const Icon =
      direction === "ascending"
        ? SortAscendingIcon
        : direction === "descending"
          ? SortDescendingIcon
          : SortIcon;

    const title = sortable ? (
      <Group gap={4} wrap="nowrap">
        {label}
        <ActionIcon
          size="sm"
          variant={direction ? "light" : "subtle"}
          color={direction ? undefined : "gray"}
          aria-label={`Sort by ${label.toLowerCase()}`}
          onClick={() => toggleSort(key)}
        >
          <Icon size={14} />
        </ActionIcon>
      </Group>
    ) : (
      label
    );

    if (filter === "search") {
      return (
        <Stack gap={4}>
          {title}
          <TextInput
            size="xs"
            miw={160}
            aria-label={`Search ${label.toLowerCase()}`}
            placeholder="Search"
            value={filters[key] ?? ""}
            onChange={(event) => setFilter(key, event.currentTarget.value)}
          />
        </Stack>
      );
    }
    if (filter === "select") {
      return (
        <Stack gap={4}>
          {title}
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
            onChange={(value) => setFilter(key, value)}
          />
        </Stack>
      );
    }
    return title;
  }

  return { shownRows, header, ariaSort };
}
