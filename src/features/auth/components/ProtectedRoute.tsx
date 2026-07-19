"use client";

import { useAuth } from "@/features/auth/contexts/AuthContext";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (!loading) {
      if (!user && !pathname.startsWith("/login")) {
        router.push("/login");
      } else {
        setIsReady(true);
      }
    }
  }, [user, loading, router, pathname]);

  if (loading || !isReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-mint-500"></div>
      </div>
    );
  }

  return <>{children}</>;
}
