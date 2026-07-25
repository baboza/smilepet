"use client";

import { BottomNav } from "./BottomNav";
import { FloatingActionButton } from "./FloatingActionButton";
import { SideNav } from "./SideNav";
import { GlobalSearchModal } from "@/components/ui/GlobalSearchModal";

interface MobileShellProps {
  children: React.ReactNode;
  hideFab?: boolean;
  hideBottomNav?: boolean;
}

export function MobileShell({ children, hideFab = false, hideBottomNav = false }: MobileShellProps) {
  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Desktop Sidebar (hidden on mobile) */}
      <SideNav />

      {/* Main Content wrapper */}
      <div className="flex-1 flex flex-col mx-auto w-full md:max-w-full max-w-md relative md:shadow-none shadow-2xl overflow-hidden">
        {/* Main Scrollable Content Area */}
        <main className="flex-1 w-full overflow-y-auto pb-24 md:pb-8 relative">
          {children}
        </main>

        {/* Floating Action Button (hidden on desktop via its own component) */}
        {!hideFab && <FloatingActionButton />}

        {/* Bottom Navigation (hidden on desktop via its own component) */}
        {!hideBottomNav && <BottomNav />}
      </div>
      <GlobalSearchModal />
    </div>
  );
}
