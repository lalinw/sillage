"use client";

import { Button } from "@/components/ui";

// Toggles a table's Updated At and Created At columns, which start hidden.
export function ShowDatesButton({
  shown,
  onChange,
}: {
  shown: boolean;
  onChange: (shown: boolean) => void;
}) {
  return (
    <Button
      size="xs"
      variant="default"
      aria-pressed={shown}
      onClick={() => onChange(!shown)}
    >
      {shown ? "Hide dates" : "Show dates"}
    </Button>
  );
}
