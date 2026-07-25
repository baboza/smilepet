"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, CalendarDays, ClipboardList, Menu, Stethoscope, UserPlus, QrCode, Scissors, Home, PieChart, ShieldAlert, Package, Search } from "lucide-react";
import { useAuth } from "@/features/auth/contexts/AuthContext";
import { useSearchStore } from "@/components/ui/GlobalSearchModal";
import { signOut } from "firebase/auth";
import { auth, db } from "@/lib/firebase/config";
import { doc, getDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";

export function SideNav() {
  const pathname = usePathname();
  const { user } = useAuth();
  const router = useRouter();
  const [clinicData, setClinicData] = useState<{name: string, logo: string} | null>(null);
  const { openSearch } = useSearchStore();

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const docSnap = await getDoc(doc(db, "clinic_settings", "demo-clinic"));
        if (docSnap.exists()) {
          setClinicData({
            name: docSnap.data().clinicName,
            logo: docSnap.data().logoUrl
          });
        }
      } catch (err) {}
    };
    fetchSettings();
  }, []);

  const navItems = [
    { label: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
    { label: "Patients / OPD", icon: Users, href: "/patients" },
    { label: "Appointment", icon: CalendarDays, href: "/appointments" },
    { label: "Grooming", icon: Scissors, href: "/grooming" },
    { label: "Cat Hotel", icon: Home, href: "/hotel" },
    { label: "Admit (แมว)", icon: ClipboardList, href: "/admit" },
    { label: "Reports", icon: PieChart, href: "/reports" },
    { label: "Admin", icon: ShieldAlert, href: "/admin" },
  ];

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/login");
  };

  return (
    <div className="hidden md:flex flex-col w-64 bg-white border-r border-gray-100 h-screen sticky top-0 shadow-sm z-40">
      <div className="p-6 flex flex-col items-center">
        {clinicData?.logo ? (
          <img src={clinicData.logo} alt="Clinic Logo" className="w-16 h-16 object-contain mb-2" />
        ) : (
          <div className="w-12 h-12 bg-mint-100 text-mint-600 rounded-full flex items-center justify-center mb-2">
            <Stethoscope size={24} />
          </div>
        )}
        <h1 className="text-xl font-bold text-gray-900 tracking-tight text-center">{clinicData?.name || "SmilePet"}</h1>
      </div>

      <div className="px-4 space-y-2 flex-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                isActive ? "bg-mint-50 text-mint-600 font-bold" : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-sm">{item.label}</span>
            </Link>
          );
        })}

        <div className="pt-6 mt-6 border-t border-gray-100 space-y-2">
          <p className="px-4 text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Quick Actions</p>
          <button onClick={openSearch} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-indigo-600 hover:bg-indigo-50 transition-all font-medium">
            <Search size={20} />
            <span className="text-sm">ค้นหาด่วน (Search)</span>
          </button>
          <Link href="/opd/new" className="flex items-center gap-3 px-4 py-3 rounded-xl text-blue-600 hover:bg-blue-50 transition-all font-medium">
            <Stethoscope size={20} />
            <span className="text-sm">สร้าง OPD ใหม่</span>
          </Link>
          <Link href="/patients/register" className="flex items-center gap-3 px-4 py-3 rounded-xl text-mint-600 hover:bg-mint-50 transition-all font-medium">
            <UserPlus size={20} />
            <span className="text-sm">ลงทะเบียนสัตว์</span>
          </Link>
        </div>
      </div>

      {user && (
        <div className="p-4 border-t border-gray-100">
          <div className="flex items-center gap-3 px-2 py-2">
            {user.photoURL ? (
              <img src={user.photoURL} alt="Profile" className="w-10 h-10 rounded-full object-cover border border-gray-200 shadow-sm" />
            ) : (
              <div className="w-10 h-10 bg-mint-100 rounded-full flex items-center justify-center text-mint-600 font-bold text-sm border border-mint-200">
                {user.email?.charAt(0).toUpperCase() || "U"}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-gray-900 truncate">{user.displayName || user.email}</p>
              <p className="text-xs text-gray-500 truncate cursor-pointer hover:text-red-500" onClick={handleLogout}>Sign Out</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
