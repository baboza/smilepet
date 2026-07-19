"use client";

import { useState } from "react";
import { Search, Plus, Calendar as CalendarIcon, Clock, User } from "lucide-react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { db } from "@/lib/firebase/config";
import { collection, getDocs, query, orderBy, doc, updateDoc, where } from "firebase/firestore";
import { SearchBar } from "@/components/ui/SearchBar";

const fetchAppointments = async () => {
  const appointmentsSnap = await getDocs(query(collection(db, "appointments"), orderBy("date", "asc")));
  const petsSnap = await getDocs(collection(db, "pets"));
  const ownersSnap = await getDocs(collection(db, "owners"));

  const usersSnap = await getDocs(query(collection(db, "users"), where("role", "==", "doctor")));

  const petsList = petsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  const ownersList = ownersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  const doctorsList = usersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

  return appointmentsSnap.docs.map(doc => {
    const data = doc.data();
    const pet = petsList.find((p: any) => p.id === data.petId);
    const owner = ownersList.find((o: any) => o.id === pet?.ownerId);
    const doctorObj = doctorsList.find((d: any) => d.id === data.doctorId);
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const aptDate = new Date(data.date);
    aptDate.setHours(0, 0, 0, 0);
    
    let displayStatus = data.status;
    if (displayStatus === "pending") displayStatus = "confirmed";
    if (aptDate < today && displayStatus !== "cancelled") {
      displayStatus = "completed";
    }

    let thaiStatus = "ยืนยันแล้ว";
    if (displayStatus === "confirmed") thaiStatus = "ยืนยันแล้ว";
    else if (displayStatus === "completed") thaiStatus = "เสร็จสิ้น";
    else if (displayStatus === "cancelled") thaiStatus = "ยกเลิก";
    else thaiStatus = displayStatus;
    
    return {
      id: doc.id,
      petName: pet ? `${pet.name} (${pet.species})` : "ไม่ทราบชื่อสัตว์",
      owner: owner?.name || "ไม่ทราบชื่อเจ้าของ",
      type: data.type,
      date: data.date,
      time: data.time,
      doctor: doctorObj ? (doctorObj.name || doctorObj.displayName || doctorObj.email) : (data.doctorId || "ไม่ระบุแพทย์"),
      status: thaiStatus
    };
  });
};

export default function AppointmentsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterDate, setFilterDate] = useState("ทั้งหมด");
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  
  const { data: appointments, isLoading, refetch } = useQuery({
    queryKey: ["appointments"],
    queryFn: fetchAppointments,
  });

  const filteredAppointments = appointments?.filter(apt => {
    const matchesSearch = apt.petName.includes(searchQuery) || apt.owner.includes(searchQuery);
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const aptDate = new Date(apt.date);
    aptDate.setHours(0, 0, 0, 0);
    
    let matchesDate = true;
    
    if (filterDate === "วันนี้") {
      matchesDate = aptDate.getTime() === today.getTime();
    } else if (filterDate === "พรุ่งนี้") {
      matchesDate = aptDate.getTime() === tomorrow.getTime();
    } else if (filterDate === "สัปดาห์นี้") {
      // From today to next 7 days
      const endOfWeek = new Date(today);
      endOfWeek.setDate(today.getDate() + 7);
      matchesDate = aptDate >= today && aptDate <= endOfWeek;
    } else if (filterDate === "เดือนนี้") {
      matchesDate = aptDate.getMonth() === today.getMonth() && aptDate.getFullYear() === today.getFullYear();
    }
    
    return matchesSearch && matchesDate;
  });

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      setOpenDropdownId(null);
      await updateDoc(doc(db, "appointments", id), {
        status: newStatus
      });
      refetch();
    } catch (error) {
      console.error(error);
      alert("เกิดข้อผิดพลาดในการอัปเดตสถานะ");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ยืนยันแล้ว": return "bg-mint-50 text-mint-700 border-mint-200";
      case "รอยืนยัน": return "bg-yellow-50 text-yellow-700 border-yellow-200";
      case "เสร็จสิ้น": return "bg-gray-100 text-gray-700 border-gray-300";
      case "ยกเลิก": return "bg-red-50 text-red-700 border-red-200";
      default: return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 pb-20">
      
      {/* Top App Bar */}
      <div className="bg-white px-4 py-4 shadow-sm sticky top-0 z-30 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900">ตารางนัดหมาย</h1>
          <Link 
            href="/appointments/new"
            className="flex items-center justify-center w-10 h-10 bg-blue-50 text-blue-600 rounded-full hover:bg-blue-100 transition-colors"
          >
            <Plus size={20} strokeWidth={2.5} />
          </Link>
        </div>

        <SearchBar 
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="ค้นหาชื่อสัตว์, เจ้าของ..."
        />

        {/* Date Filter */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {["ทั้งหมด", "วันนี้", "พรุ่งนี้", "สัปดาห์นี้", "เดือนนี้"].map((period) => (
            <button 
              key={period}
              onClick={() => setFilterDate(period)}
              className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-colors ${
                filterDate === period ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {period}
            </button>
          ))}
        </div>
      </div>

      {/* Appointment List */}
      <div className="p-4 space-y-4">
        {isLoading ? (
          [...Array(4)].map((_, i) => (
            <div key={i} className="bg-white p-4 rounded-2xl h-28 animate-pulse border border-gray-200"></div>
          ))
        ) : filteredAppointments && filteredAppointments.length > 0 ? (
          filteredAppointments.map((apt) => (
            <div 
              key={apt.id}
              className="bg-white p-4 rounded-2xl shadow-sm border border-gray-200 flex flex-col gap-3 relative"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                    {apt.petName}
                  </h3>
                  <div className="flex items-center gap-2 text-xs font-bold mt-1">
                    <span className="text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">{apt.type}</span>
                  </div>
                </div>

                <div className="relative">
                  <div 
                    className={`px-2.5 py-1 rounded-full text-xs font-bold border cursor-pointer hover:opacity-80 transition-opacity ${getStatusColor(apt.status)}`}
                    onClick={() => setOpenDropdownId(openDropdownId === apt.id ? null : apt.id)}
                  >
                    {apt.status}
                  </div>

                  {openDropdownId === apt.id && (
                    <div className="absolute top-8 right-0 bg-white border border-gray-200 rounded-xl shadow-lg z-20 overflow-hidden w-36">
                      <button onClick={() => handleUpdateStatus(apt.id, "confirmed")} className="w-full text-left px-4 py-3 text-sm font-bold text-mint-600 hover:bg-gray-50 border-b border-gray-100">ยืนยันแล้ว</button>
                      <button onClick={() => handleUpdateStatus(apt.id, "completed")} className="w-full text-left px-4 py-3 text-sm font-bold text-gray-700 hover:bg-gray-50 border-b border-gray-100">เสร็จสิ้น</button>
                      <button onClick={() => handleUpdateStatus(apt.id, "cancelled")} className="w-full text-left px-4 py-3 text-sm font-bold text-red-600 hover:bg-gray-50">ยกเลิก</button>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-2 pt-3 border-t border-gray-100 mt-1">
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center gap-1.5 text-xs text-gray-700 font-bold">
                    <CalendarIcon size={14} className="text-gray-400" />
                    {apt.date}
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-gray-700 font-bold">
                    <User size={14} className="text-gray-400" />
                    {apt.owner}
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center gap-1.5 text-xs text-gray-700 font-bold">
                    <Clock size={14} className="text-gray-400" />
                    {apt.time}
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-gray-700 font-bold">
                    <StethoscopeIcon size={14} className="text-gray-400" />
                    {apt.doctor}
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-10">
            <p className="text-gray-500 font-bold mb-2">ไม่มีข้อมูลนัดหมาย</p>
          </div>
        )}
      </div>

    </div>
  );
}

function StethoscopeIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4.8 2.3A.3.3 0 1 0 5 2H4a2 2 0 0 0-2 2v5a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6V4a2 2 0 0 0-2-2h-1a.2.2 0 1 0 .3.3" />
      <path d="M8 15v1a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6v-4" />
      <circle cx="20" cy="10" r="2" />
    </svg>
  );
}
