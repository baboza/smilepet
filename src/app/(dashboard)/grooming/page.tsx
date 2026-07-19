"use client";

import { useState } from "react";
import { Search, Plus, Scissors, Clock, CheckCircle2, MoreVertical } from "lucide-react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { db } from "@/lib/firebase/config";
import { collection, getDocs, query, orderBy, doc, updateDoc } from "firebase/firestore";

const GROOMING_SERVICES = [
  { id: "bath", label: "อาบน้ำ" },
  { id: "haircut", label: "ตัดขน" },
  { id: "nailTrim", label: "ตัดเล็บ" },
  { id: "earClean", label: "เช็ดหู" },
  { id: "analGland", label: "บีบต่อมเหม็น" },
  { id: "teethBrushing", label: "แปรงฟัน" },
  { id: "fleaTick", label: "กำจัดเห็บหมัด" },
  { id: "spa", label: "สปา" },
];

const fetchGroomingQueue = async () => {
  const queuesSnap = await getDocs(query(collection(db, "grooming_queues"), orderBy("createdAt", "desc")));
  const petsSnap = await getDocs(collection(db, "pets"));
  const ownersSnap = await getDocs(collection(db, "owners"));

  const petsList = petsSnap.docs.map(doc => ({ id: doc.id, ...(doc.data() as any) } as any));
  const ownersList = ownersSnap.docs.map(doc => ({ id: doc.id, ...(doc.data() as any) } as any));

  return queuesSnap.docs.map(doc => {
    const data = doc.data() as any;
    const pet = petsList.find((p: any) => p.id === data.petId);
    const owner = ownersList.find((o: any) => o.id === pet?.ownerId);
    
    const services = [];
    if (data.services) {
       for (const key of Object.keys(data.services)) {
         if (data.services[key] === true) {
            const serviceLabel = GROOMING_SERVICES.find(s => s.id === key)?.label || key;
            services.push(serviceLabel);
         }
       }
    }

    return {
      id: doc.id,
      petName: pet ? `${pet.name} (${pet.species})` : "ไม่ทราบชื่อสัตว์",
      owner: owner?.name || "ไม่ทราบชื่อเจ้าของ",
      status: data.status || "รอดำเนินการ",
      time: data.bookingDate || "-",
      services: services
    };
  });
};

const getStatusColor = (status: string) => {
  switch (status) {
    case "กำลังทำ": return "bg-orange-100 text-orange-600 border-orange-200";
    case "รอดำเนินการ": return "bg-blue-100 text-blue-600 border-blue-200";
    case "เสร็จแล้ว": return "bg-mint-100 text-mint-600 border-mint-200";
    default: return "bg-gray-100 text-gray-600 border-gray-200";
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case "กำลังทำ": return <Scissors size={14} />;
    case "รอดำเนินการ": return <Clock size={14} />;
    case "เสร็จแล้ว": return <CheckCircle2 size={14} />;
    default: return null;
  }
};

export default function GroomingPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  
  const { data: queues, isLoading, refetch } = useQuery({
    queryKey: ["groomingQueue"],
    queryFn: fetchGroomingQueue,
  });

  const filteredQueues = queues?.filter(q => 
    q.petName.includes(searchQuery) || q.owner.includes(searchQuery)
  );

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      setOpenDropdownId(null);
      await updateDoc(doc(db, "grooming_queues", id), {
        status: newStatus
      });
      refetch();
    } catch (error) {
      console.error(error);
      alert("เกิดข้อผิดพลาดในการอัปเดตสถานะ");
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 pb-20">
      
      {/* Top App Bar */}
      <div className="bg-white px-4 py-4 shadow-sm sticky top-0 z-30 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900">อาบน้ำตัดขน (Grooming)</h1>
          <Link 
            href="/grooming/new"
            className="flex items-center justify-center w-10 h-10 bg-purple-50 text-purple-600 rounded-full hover:bg-purple-100 transition-colors"
          >
            <Plus size={20} strokeWidth={2.5} />
          </Link>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={18} className="text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-xl leading-5 bg-gray-50 placeholder-gray-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-purple-500 transition-colors sm:text-sm text-gray-900"
            placeholder="ค้นหาชื่อสัตว์, เจ้าของ..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Queue List */}
      <div className="p-4 space-y-4">
        {isLoading ? (
          [...Array(4)].map((_, i) => (
            <div key={i} className="bg-white p-4 rounded-2xl h-28 animate-pulse border border-gray-100"></div>
          ))
        ) : filteredQueues && filteredQueues.length > 0 ? (
          filteredQueues.map((q) => (
            <div 
              key={q.id}
              className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-3 relative"
            >
              <div className="flex justify-between items-start">
                <div className="pr-10">
                  <h3 className="text-base font-bold text-gray-900">{q.petName}</h3>
                  <p className="text-xs text-gray-500 mt-0.5 font-bold">เจ้าของ: {q.owner}</p>
                </div>
                <div 
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border cursor-pointer hover:opacity-80 transition-opacity ${getStatusColor(q.status)}`}
                  onClick={() => setOpenDropdownId(openDropdownId === q.id ? null : q.id)}
                >
                  {getStatusIcon(q.status)}
                  {q.status}
                </div>

                {/* Status Dropdown */}
                {openDropdownId === q.id && (
                  <div className="absolute top-12 right-4 bg-white border border-gray-200 rounded-xl shadow-lg z-20 overflow-hidden w-40">
                    <button onClick={() => handleUpdateStatus(q.id, "รอดำเนินการ")} className="w-full text-left px-4 py-3 text-sm font-bold text-blue-600 hover:bg-gray-50">รอดำเนินการ</button>
                    <button onClick={() => handleUpdateStatus(q.id, "กำลังทำ")} className="w-full text-left px-4 py-3 text-sm font-bold text-orange-600 hover:bg-gray-50 border-t border-gray-100">กำลังทำ</button>
                    <button onClick={() => handleUpdateStatus(q.id, "เสร็จแล้ว")} className="w-full text-left px-4 py-3 text-sm font-bold text-mint-600 hover:bg-gray-50 border-t border-gray-100">เสร็จแล้ว</button>
                  </div>
                )}
              </div>
              
              <div className="flex justify-between items-center pt-2 border-t border-gray-50">
                <div className="flex flex-wrap gap-1">
                  {q.services.length > 0 ? q.services.map(s => (
                    <span key={s} className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-md font-bold">
                      {s}
                    </span>
                  )) : (
                    <span className="text-[10px] bg-gray-100 text-gray-400 px-2 py-0.5 rounded-md font-bold">
                      ไม่ได้เลือกบริการ
                    </span>
                  )}
                </div>
                <div className="text-xs font-bold text-gray-400">
                  {q.time}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-10">
            <p className="text-gray-500 font-bold mb-2">ไม่มีคิวอาบน้ำตัดขน</p>
          </div>
        )}
      </div>

    </div>
  );
}
