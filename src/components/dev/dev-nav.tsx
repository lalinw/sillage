"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ActionIcon,
  Affix,
  Anchor,
  CloseIcon,
  DevNavIcon,
  Group,
  Paper,
  Stack,
} from "@/components/ui";
import { devNavColumns } from "./dev-nav-links";

// Floating page list for development. Rendered only in dev (see app/layout.tsx).
export function DevNav() {
  const [open, setOpen] = useState(true);

  return (
    <Affix position={{ bottom: 12, right: 12 }}>
      <Paper shadow="md" p={6} withBorder>
        <Group gap="xs" align="flex-end" wrap="nowrap">
          {open && (
            <Group
              component="nav"
              aria-label="Dev navigation"
              gap="sm"
              align="flex-start"
              wrap="nowrap"
            >
              {devNavColumns.map((links) => (
                <Stack key={links[0].href} gap={0}>
                  {links.map(({ href, label }) => (
                    <Anchor key={href} component={Link} href={href} fz={11}>
                      {label}
                    </Anchor>
                  ))}
                </Stack>
              ))}
            </Group>
          )}
          <ActionIcon
            size="xs"
            variant="subtle"
            aria-label={open ? "Close dev navigation" : "Open dev navigation"}
            onClick={() => setOpen(!open)}
          >
            {open ? <CloseIcon size={12} /> : <DevNavIcon size={12} />}
          </ActionIcon>
        </Group>
      </Paper>
    </Affix>
  );
}
