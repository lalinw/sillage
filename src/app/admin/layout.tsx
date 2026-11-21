import { AdminBanner } from "@/components/admin/admin-banner";
import { Box } from "@/components/ui";

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <>
      {/* Outside the padding, so the banner stays full width. */}
      <AdminBanner />
      <Box px={48} py="md">
        {children}
      </Box>
    </>
  );
}
