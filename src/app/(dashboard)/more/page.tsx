"use client";

import Link from "next/link";
import { useAuth } from "@/features/auth/contexts/AuthContext";
import { signOut } from "firebase/auth";
import { auth, db } from "@/lib/firebase/config";
import { doc, getDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { ClipboardList, Stethoscope, UserPlus, QrCode, Home, PieChart, ShieldAlert, LogOut } from "lucide-react";

export default function MorePage() {
  const { user } = useAuth();
  const router = useRouter();
  const [clinicData, setClinicData] = useState<{name: string, logo: string} | null>(null);

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

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/login");
  };

  const moreItems = [
    { label: "Cat Hotel", icon: Home, href: "/hotel", color: "text-orange-500", bg: "bg-orange-50" },
    { label: "Admit (แมว)", icon: ClipboardList, href: "/admit", color: "text-blue-500", bg: "bg-blue-50" },
    { label: "Reports", icon: PieChart, href: "/reports", color: "text-purple-500", bg: "bg-purple-50" },
    { label: "Admin", icon: ShieldAlert, href: "/admin", color: "text-red-500", bg: "bg-red-50" },
  ];

  const quickActions = [
    { label: "สร้าง OPD ใหม่", icon: Stethoscope, href: "/opd/new", color: "text-blue-600", bg: "bg-blue-50" },
    { label: "ลงทะเบียนสัตว์", icon: UserPlus, href: "/patients/register", color: "text-mint-600", bg: "bg-mint-50" },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 pb-24">
      {/* Header Profile */}
      <div className="bg-white p-6 shadow-sm border-b border-gray-100 flex items-center gap-4">
        {user?.photoURL ? (
          <img src={user.photoURL} alt="Profile" className="w-16 h-16 rounded-full object-cover border border-gray-200 shadow-sm" />
        ) : (
          <div className="w-16 h-16 bg-mint-100 rounded-full flex items-center justify-center text-mint-600 font-bold text-2xl border border-mint-200 shadow-sm">
            {user?.email?.charAt(0).toUpperCase() || "U"}
          </div>
        )}
        <div>
          <h2 className="text-xl font-bold text-gray-900">{user?.displayName || user?.email?.split('@')[0] || "User"}</h2>
          <p className="text-sm text-gray-500 font-medium">{user?.email}</p>
          <div className="flex items-center gap-1 mt-1 text-xs font-bold text-mint-600">
            {clinicData?.name || "SmilePet Clinic"}
          </div>
        </div>
      </div>

      <div className="p-4 space-y-6">
        
        {/* Main Additional Menus */}
        <section>
          <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3 px-2">เมนูเพิ่มเติม</h3>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            {moreItems.map((item, index) => {
              const Icon = item.icon;
              return (
                <Link key={item.href} href={item.href} className={`flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors ${index !== moreItems.length - 1 ? 'border-b border-gray-50' : ''}`}>
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${item.bg} ${item.color}`}>
                    <Icon size={20} />
                  </div>
                  <span className="font-bold text-gray-800">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </section>

        {/* Quick Actions */}
        <section>
          <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3 px-2">Quick Actions</h3>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            {quickActions.map((item, index) => {
              const Icon = item.icon;
              return (
                <Link key={item.href} href={item.href} className={`flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors ${index !== quickActions.length - 1 ? 'border-b border-gray-50' : ''}`}>
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${item.bg} ${item.color}`}>
                    <Icon size={20} />
                  </div>
                  <span className="font-bold text-gray-800">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </section>

        {/* Logout */}
        <button 
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 bg-red-50 text-red-600 font-bold py-4 rounded-2xl hover:bg-red-100 transition-colors border border-red-100 shadow-sm"
        >
          <LogOut size={20} />
          ออกจากระบบ
        </button>
        
        <div className="text-center pb-6">
          <p className="text-xs font-bold text-gray-400">SmilePet Clinic System v1.0</p>
        </div>
      </div>
    </div>
  );
}
