"use client";

import { useAuth } from "@/features/auth/contexts/AuthContext";
import { auth, db } from "@/lib/firebase/config";
import { signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import { LogOut, Users, Calendar, Home, Scissors, DollarSign, Activity, Bell, Dog, Cat, CheckCircle2, XCircle, HeartPulse, User } from "lucide-react";
import { StatCard } from "@/components/ui/StatCard";
import { useQuery } from "@tanstack/react-query";
import { collection, query, where, getDocs, orderBy, limit, getCountFromServer, doc, getDoc } from "firebase/firestore";
import { startOfDay, format } from "date-fns";

const fetchDashboardStats = async () => {
  const todayStart = startOfDay(new Date()).toISOString();
  const todayStr = format(new Date(), "yyyy-MM-dd");

  const opdSnap = await getCountFromServer(
    query(collection(db, "opd_records"), where("createdAt", ">=", todayStart))
  );

  const appointmentsTodaySnap = await getCountFromServer(
    query(collection(db, "appointments"), where("date", "==", todayStr))
  );
  
  const boardingSnap = await getCountFromServer(
     query(collection(db, "hotel_bookings"), where("status", "==", "เช็คอินแล้ว"))
  );

  const groomingSnap = await getCountFromServer(
     query(collection(db, "grooming_queues"))
  );
  const admitSnap = await getCountFromServer(
     query(collection(db, "admit_records"), where("status", "==", "กำลังรักษา"))
  );

  // Fetch all pets for statistics
  const petsSnap = await getDocs(collection(db, "pets"));
  const petStats = {
    total: petsSnap.size,
    dogs: 0,
    cats: 0,
    male: 0,
    female: 0,
    sterilized: 0,
    notSterilized: 0,
    totalAgeYears: 0,
    validAgeCount: 0,
  };

  petsSnap.forEach((doc) => {
    const data = doc.data() as any;
    if (data.species === "สุนัข") petStats.dogs++;
    if (data.species === "แมว") petStats.cats++;
    
    if (data.sex === "ผู้") petStats.male++;
    if (data.sex === "เมีย") petStats.female++;
    
    if (data.sterilization === "ทำแล้ว" || data.sterilization === "ทำหมันแล้ว") petStats.sterilized++;
    if (data.sterilization === "ยัง" || data.sterilization === "ยังไม่ทำ") petStats.notSterilized++;
    
    if (data.birthDate) {
      const parts = data.birthDate.split("/");
      if (parts.length === 3) {
        let year = parseInt(parts[2]);
        if (year > 2500) year -= 543;
        const ageYears = new Date().getFullYear() - year;
        if (ageYears >= 0 && ageYears < 50) {
          petStats.totalAgeYears += ageYears;
          petStats.validAgeCount++;
        }
      }
    }
  });

  const avgAge = petStats.validAgeCount > 0 ? (petStats.totalAgeYears / petStats.validAgeCount).toFixed(1) : "0";

  let loyverseRevenue = "0";
  try {
    const revRes = await fetch("/api/loyverse/receipts");
    if (revRes.ok) {
      const revData = await revRes.json();
      if (revData.totalRevenue !== undefined) {
        loyverseRevenue = new Intl.NumberFormat('th-TH').format(revData.totalRevenue);
      }
    }
  } catch (e) {
    console.error("Error fetching Loyverse revenue:", e);
  }

  const stats = {
    patientsToday: opdSnap.data().count,
    appointmentsToday: appointmentsTodaySnap.data().count,
    boarding: boardingSnap.data().count,
    grooming: groomingSnap.data().count,
    revenue: loyverseRevenue === "0" ? "Loyverse" : `฿ ${loyverseRevenue}`,
    admitted: admitSnap.data().count,
    petStats: {
      ...petStats,
      avgAge
    },
    clinicAddress: ""
  };
  
  try {
    const settingsDoc = await getDoc(doc(db, "clinic_settings", "demo-clinic"));
    if (settingsDoc.exists() && settingsDoc.data().address) {
      stats.clinicAddress = settingsDoc.data().address;
    }
  } catch (e) {}

  return stats;
};

export default function DashboardPage() {
  const { user } = useAuth();
  const router = useRouter();

  const { data: stats, isLoading } = useQuery({
    queryKey: ["dashboardStats"],
    queryFn: fetchDashboardStats,
  });

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/login");
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 pb-20">
      {/* Top App Bar */}
      <div className="bg-white px-4 py-4 flex items-center justify-between shadow-sm sticky top-0 z-30">
        <div>
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">SmilePet</h1>
          <p className="text-xs text-gray-500 font-bold">{stats?.clinicAddress || "คลินิกหลัก"}</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="relative p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors">
            <Bell size={20} />
            <span className="absolute top-1.5 right-2 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>
          <div 
            className="w-8 h-8 bg-mint-100 rounded-full flex items-center justify-center text-mint-600 font-bold text-sm cursor-pointer border border-mint-200"
            onClick={handleLogout}
            title="Sign Out"
          >
            {user?.email?.charAt(0).toUpperCase() || "U"}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-4 space-y-6">
        
        {/* Welcome Section */}
        <div>
          <h2 className="text-lg font-bold text-gray-900">
            สวัสดี, {user?.displayName ? user.displayName.split(" ")[0] : "แอดมิน"} 👋
          </h2>
          <p className="text-sm text-gray-500 font-bold">ภาพรวมคลินิกวันนี้</p>
        </div>

        {/* Stats Grid */}
        {isLoading ? (
          <div className="grid grid-cols-2 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-28 bg-gray-200 animate-pulse rounded-2xl border border-gray-100"></div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            <StatCard 
              title="ตรวจรักษา (OPD)" 
              value={stats?.patientsToday || 0} 
              icon={Users} 
              colorScheme="blue"
              onClick={() => router.push("/opd")}
            />
            <StatCard 
              title="นัดหมายวันนี้" 
              value={stats?.appointmentsToday || 0} 
              icon={Calendar} 
              colorScheme="mint"
              onClick={() => router.push("/appointments")}
            />
            <StatCard 
              title="ฝากเลี้ยง (ตัว)" 
              value={stats?.boarding || 0} 
              icon={Home} 
              colorScheme="orange"
              onClick={() => router.push("/hotel")}
            />
            <StatCard 
              title="คิวอาบน้ำตัดขน" 
              value={stats?.grooming || 0} 
              icon={Scissors} 
              colorScheme="purple"
              onClick={() => router.push("/grooming")}
            />
            <StatCard 
              title="แอดมิท (Admit)" 
              value={stats?.admitted || 0} 
              icon={Activity} 
              colorScheme="red"
              onClick={() => router.push("/admit")}
            />
            <StatCard 
              title="รายรับ" 
              value={stats?.revenue || "Loyverse"} 
              icon={DollarSign} 
              colorScheme="mint" 
              onClick={() => router.push("/sales")}
            />
          </div>
        )}

        {/* Pet Statistics Section */}
        <div className="mt-8">
          <h2 className="text-lg font-bold text-gray-900 mb-4">สถิติสัตว์เลี้ยงทั้งหมด ({stats?.petStats?.total || 0} ตัว)</h2>
          
          {isLoading ? (
            <div className="h-32 bg-gray-200 animate-pulse rounded-2xl border border-gray-100"></div>
          ) : (
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 divide-x divide-gray-100">
                <div className="px-2 text-center">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">ประเภท</p>
                  <p className="text-sm font-bold text-gray-800 flex items-center justify-center gap-1"><Dog size={16} className="text-blue-600"/> สุนัข: <span className="text-blue-600">{stats?.petStats?.dogs || 0}</span></p>
                  <p className="text-sm font-bold text-gray-800 flex items-center justify-center gap-1"><Cat size={16} className="text-orange-500"/> แมว: <span className="text-orange-500">{stats?.petStats?.cats || 0}</span></p>
                </div>
                
                <div className="px-2 text-center">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">เพศ</p>
                  <p className="text-sm font-bold text-gray-800 flex items-center justify-center gap-1"><User size={16} className="text-blue-600"/> ตัวผู้: <span className="text-blue-600">{stats?.petStats?.male || 0}</span></p>
                  <p className="text-sm font-bold text-gray-800 flex items-center justify-center gap-1"><User size={16} className="text-pink-500"/> ตัวเมีย: <span className="text-pink-500">{stats?.petStats?.female || 0}</span></p>
                </div>
                
                <div className="px-2 text-center">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">การทำหมัน</p>
                  <p className="text-sm font-bold text-gray-800 flex items-center justify-center gap-1"><CheckCircle2 size={16} className="text-green-600"/> ทำแล้ว: <span className="text-green-600">{stats?.petStats?.sterilized || 0}</span></p>
                  <p className="text-sm font-bold text-gray-800 flex items-center justify-center gap-1"><XCircle size={16} className="text-red-500"/> ยังไม่ทำ: <span className="text-red-500">{stats?.petStats?.notSterilized || 0}</span></p>
                </div>
                
                <div className="px-2 text-center flex flex-col justify-center">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">อายุเฉลี่ย</p>
                  <p className="text-3xl font-black text-gray-900">{stats?.petStats?.avgAge || "0"}</p>
                  <p className="text-xs font-bold text-gray-500">ปี</p>
                </div>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
