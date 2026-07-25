"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, CalendarDays, Scissors, Menu, Search } from "lucide-react";
import { useSearchStore } from "@/components/ui/GlobalSearchModal";

export function BottomNav() {
  const pathname = usePathname();

  const { openSearch } = useSearchStore();

  const navItems = [
    { label: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
    { label: "Patients", icon: Users, href: "/patients" },
    { label: "Search", icon: Search, action: openSearch },
    { label: "Appointment", icon: CalendarDays, href: "/appointments" },
    { label: "Grooming", icon: Scissors, href: "/grooming" },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-md border-t border-gray-100 pb-safe z-40">
      <div className="flex justify-around items-center h-16 px-2 max-w-md mx-auto relative">
        {navItems.map((item, idx) => {
          if (item.action) {
            return (
              <button
                key="search-btn"
                onClick={item.action}
                className="flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors text-gray-400 hover:text-gray-600"
              >
                <div className="p-1.5 rounded-full transition-all duration-300 bg-transparent">
                  <item.icon size={24} strokeWidth={2} />
                </div>
                <span className="text-[10px] font-medium transition-all text-gray-400">
                  {item.label}
                </span>
              </button>
            );
          }

          const isActive = pathname.startsWith(item.href || "");
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${
                isActive ? "text-mint-600" : "text-gray-400 hover:text-gray-600"
              }`}
            >
              <div
                className={`p-1.5 rounded-full transition-all duration-300 ${
                  isActive ? "bg-mint-50" : "bg-transparent"
                }`}
              >
                <Icon
                  size={24}
                  strokeWidth={isActive ? 2.5 : 2}
                  className={isActive ? "scale-110 transition-transform" : ""}
                />
              </div>
              <span
                className={`text-[10px] font-medium transition-all ${
                  isActive ? "text-mint-600" : "text-gray-400"
                }`}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
