import { MobileShell } from "@/components/layout/MobileShell";
import { ProtectedRoute } from "@/features/auth/components/ProtectedRoute";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute>
      <MobileShell>{children}</MobileShell>
    </ProtectedRoute>
  );
}
