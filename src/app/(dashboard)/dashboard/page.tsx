"use client";

import { useAuth } from "@/features/auth/contexts/AuthContext";
import { auth, db } from "@/lib/firebase/config";
import { signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import { LogOut, Users, Calendar, Home, Scissors, DollarSign, Activity, Bell, Dog, Cat, CheckCircle2, XCircle, HeartPulse, User, Search } from "lucide-react";
import { StatCard } from "@/components/ui/StatCard";
import { useQuery } from "@tanstack/react-query";
import { collection, query, where, getDocs, orderBy, limit, getCountFromServer, doc, getDoc } from "firebase/firestore";
import { startOfDay, format, isToday } from "date-fns";
import Link from "next/link";
import { useSearchStore } from "@/components/ui/GlobalSearchModal";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const fetchAgendaData = async () => {
  const todayStr = format(new Date(), "yyyy-MM-dd");
  const [aptSnap, admitSnap, petsSnap, ownersSnap] = await Promise.all([
    getDocs(query(collection(db, "appointments"), where("date", "==", todayStr))),
    getDocs(query(collection(db, "admit_records"), where("status", "==", "กำลังรักษา"))),
    getDocs(collection(db, "pets")),
    getDocs(collection(db, "owners"))
  ]);

  const petsList = petsSnap.docs.map(doc => ({ id: doc.id, ...(doc.data() as any) } as any));
  const ownersList = ownersSnap.docs.map(doc => ({ id: doc.id, ...(doc.data() as any) } as any));

  const appointments = aptSnap.docs.map(doc => {
    const data = doc.data() as any;
    const pet = petsList.find((p: any) => p.id === data.petId);
    const owner = ownersList.find((o: any) => o.id === pet?.ownerId);
    return {
      id: doc.id,
      petName: pet?.name || "ไม่ทราบชื่อ",
      petSpecies: pet?.species || "สุนัข",
      petImageUrl: pet?.imageUrl || pet?.photoUrl || null,
      ownerName: owner?.name || "ไม่ทราบ",
      ownerId: owner?.id || null,
      type: data.type || "นัดหมาย",
      time: data.time || "-"
    };
  }).sort((a, b) => a.time.localeCompare(b.time));

  const admits = admitSnap.docs.map(doc => {
    const data = doc.data() as any;
    const pet = petsList.find((p: any) => p.id === data.petId);
    const owner = ownersList.find((o: any) => o.id === pet?.ownerId);
    return {
      id: doc.id,
      petName: pet?.name || "ไม่ทราบชื่อ",
      petSpecies: pet?.species || "สุนัข",
      petImageUrl: pet?.imageUrl || pet?.photoUrl || null,
      ownerName: owner?.name || "ไม่ทราบ",
      ownerId: owner?.id || null,
      reason: data.reason || "แอดมิท",
      room: data.room || "-"
    };
  });

  return { appointments, admits };
};

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

  // --- Fetch last 7 days chart data ---
  const chartData = [];
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
  sevenDaysAgo.setHours(0, 0, 0, 0);

  const [opdDocs, vacDocs, paraDocs] = await Promise.all([
    getDocs(query(collection(db, "opd_records"), where("createdAt", ">=", sevenDaysAgo.toISOString()))),
    getDocs(query(collection(db, "vaccinations"), where("createdAt", ">=", sevenDaysAgo.toISOString()))),
    getDocs(query(collection(db, "parasite_preventions"), where("createdAt", ">=", sevenDaysAgo.toISOString())))
  ]);

  // Group by day
  const casesByDay: Record<string, { opd: number, vaccine: number, parasite: number }> = {};
  
  // Initialize last 7 days
  for (let i = 0; i < 7; i++) {
    const d = new Date(sevenDaysAgo);
    d.setDate(d.getDate() + i);
    const dateStr = format(d, "dd/MM");
    casesByDay[dateStr] = { opd: 0, vaccine: 0, parasite: 0 };
  }

  opdDocs.forEach(doc => {
    const data = doc.data();
    if (data.createdAt) {
      const dateStr = format(new Date(data.createdAt), "dd/MM");
      if (casesByDay[dateStr]) casesByDay[dateStr].opd++;
    }
  });
  
  vacDocs.forEach(doc => {
    const data = doc.data();
    if (data.createdAt) {
      const dateStr = format(new Date(data.createdAt), "dd/MM");
      if (casesByDay[dateStr]) casesByDay[dateStr].vaccine++;
    }
  });
  
  paraDocs.forEach(doc => {
    const data = doc.data();
    if (data.createdAt) {
      const dateStr = format(new Date(data.createdAt), "dd/MM");
      if (casesByDay[dateStr]) casesByDay[dateStr].parasite++;
    }
  });

  for (const [date, counts] of Object.entries(casesByDay)) {
    chartData.push({
      name: date,
      OPD: counts.opd,
      Vaccine: counts.vaccine,
      Parasite: counts.parasite
    });
  }
  // ------------------------------------

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
    chartData,
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

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["dashboardStats"],
    queryFn: fetchDashboardStats,
  });

  const { data: agenda, isLoading: agendaLoading } = useQuery({
    queryKey: ["dashboardAgenda"],
    queryFn: fetchAgendaData,
  });

  const { openSearch } = useSearchStore();

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
          <button onClick={openSearch} className="flex items-center justify-center p-2 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-full transition-colors">
            <Search size={20} />
          </button>
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

        {/* Today's Agenda Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Calendar size={20} className="text-blue-500" /> นัดหมายวันนี้ 
              {!agendaLoading && agenda?.appointments && agenda.appointments.length > 0 && (
                <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs font-bold">{agenda.appointments.length}</span>
              )}
            </h2>
            <Link href="/appointments" className="text-sm font-bold text-blue-600 hover:underline">ดูทั้งหมด</Link>
          </div>
          
          <div className="flex overflow-x-auto pb-2 gap-3 hide-scrollbar">
            {agendaLoading ? (
               [...Array(2)].map((_, i) => (
                 <div key={i} className="min-w-[240px] bg-white p-4 rounded-2xl h-24 animate-pulse border border-gray-100"></div>
               ))
            ) : agenda?.appointments && agenda.appointments.length > 0 ? (
              agenda.appointments.map((apt: any) => (
                <Link key={apt.id} href={apt.ownerId ? `/patients/${apt.ownerId}` : "#"} className="min-w-[240px] bg-white p-4 rounded-2xl shadow-sm border border-gray-100 block hover:shadow-md transition-shadow active:scale-[0.98]">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-3">
                      {apt.petImageUrl ? (
                        <img src={apt.petImageUrl} alt={apt.petName} className="w-10 h-10 object-cover rounded-full shadow-sm" />
                      ) : (
                        <div className="w-10 h-10 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center text-lg shadow-sm">
                          {apt.petSpecies === "แมว" ? "🐱" : "🐶"}
                        </div>
                      )}
                      <div>
                        <h3 className="font-bold text-gray-900 leading-tight">{apt.petName}</h3>
                        <p className="text-[10px] text-gray-500">เจ้าของ: {apt.ownerName}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50">
                     <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-md">{apt.type}</span>
                     <span className="text-xs font-bold text-gray-700 flex items-center gap-1">⏰ {apt.time}</span>
                  </div>
                </Link>
              ))
            ) : (
              <div className="w-full bg-gray-50 border border-gray-100 border-dashed rounded-2xl p-6 text-center text-gray-500 text-sm font-bold">
                 ไม่มีนัดหมายในวันนี้
              </div>
            )}
          </div>
        </div>

        {/* Admitted Pets Section */}
        {(!agendaLoading && agenda?.admits && agenda.admits.length > 0) && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <HeartPulse size={20} className="text-rose-500" /> สัตว์แอดมิท 
                <span className="bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full text-xs font-bold">{agenda.admits.length}</span>
              </h2>
              <Link href="/admit" className="text-sm font-bold text-rose-600 hover:underline">ไปห้องแอดมิท</Link>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {agenda.admits.map((admit: any) => (
                <Link key={admit.id} href={admit.ownerId ? `/patients/${admit.ownerId}` : "#"} className="bg-white p-4 rounded-2xl shadow-sm border border-rose-100 block hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      {admit.petImageUrl ? (
                        <img src={admit.petImageUrl} alt={admit.petName} className="w-12 h-12 object-cover rounded-full shadow-sm border-2 border-white" />
                      ) : (
                        <div className="w-12 h-12 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center text-xl shadow-sm border-2 border-white">
                          {admit.petSpecies === "แมว" ? "🐱" : "🐶"}
                        </div>
                      )}
                      <div>
                        <h3 className="font-bold text-gray-900">{admit.petName}</h3>
                        <p className="text-xs text-gray-500 mb-1">เจ้าของ: {admit.ownerName}</p>
                        <div className="flex gap-2">
                          <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md">{admit.reason}</span>
                          <span className="text-[10px] font-bold text-gray-600 bg-gray-100 px-2 py-0.5 rounded-md">ห้อง: {admit.room}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Stats Grid */}
        {statsLoading ? (
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

        {/* Analytics Chart */}
        <div className="mt-8 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Activity size={20} className="text-blue-500" /> สถิติเคสย้อนหลัง 7 วัน
            </h2>
          </div>
          
          {statsLoading ? (
            <div className="h-64 bg-gray-200 animate-pulse rounded-2xl border border-gray-100"></div>
          ) : (
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats?.chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorOPD" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorVaccine" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorParasite" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} />
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    labelStyle={{ fontWeight: 'bold', color: '#111827', marginBottom: '4px' }}
                  />
                  <Area type="monotone" dataKey="OPD" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorOPD)" />
                  <Area type="monotone" dataKey="Vaccine" name="วัคซีน" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorVaccine)" />
                  <Area type="monotone" dataKey="Parasite" name="กำจัดปรสิต" stroke="#f59e0b" strokeWidth={2} fillOpacity={1} fill="url(#colorParasite)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Pet Statistics Section */}
        <div className="mt-8">
          <h2 className="text-lg font-bold text-gray-900 mb-4">สถิติสัตว์เลี้ยงทั้งหมด ({stats?.petStats?.total || 0} ตัว)</h2>
          
          {statsLoading ? (
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
