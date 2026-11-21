import { Text } from "@/components/ui";

// Strip across the top of every admin page (see app/admin/layout.tsx).
export function AdminBanner() {
  return (
    <Text
      role="note"
      bg="violet.1"
      c="violet.9"
      ta="center"
      fz={11}
      fw={700}
      lts={1}
      py={2}
    >
      ADMIN PAGE
    </Text>
  );
}
