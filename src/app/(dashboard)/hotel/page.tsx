"use client";

import { useState } from "react";
import { Search, Plus, Home, Calendar, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { db } from "@/lib/firebase/config";
import { collection, getDocs, query, orderBy, doc, updateDoc } from "firebase/firestore";

const fetchBoardedCats = async () => {
  const bookingsSnap = await getDocs(query(collection(db, "hotel_bookings"), orderBy("createdAt", "desc")));
  const petsSnap = await getDocs(collection(db, "pets"));
  const ownersSnap = await getDocs(collection(db, "owners"));

  const petsList = petsSnap.docs.map(doc => ({ id: doc.id, ...(doc.data() as any) } as any));
  const ownersList = ownersSnap.docs.map(doc => ({ id: doc.id, ...(doc.data() as any) } as any));

  return bookingsSnap.docs.map(doc => {
    const data = doc.data() as any;
    const pet = petsList.find((p: any) => p.id === data.petId);
    const owner = ownersList.find((o: any) => o.id === pet?.ownerId);
    
    return {
      id: doc.id,
      petName: pet ? `${pet.name}` : "ไม่ทราบชื่อสัตว์",
      owner: owner?.name || "ไม่ทราบชื่อเจ้าของ",
      room: data.roomNumber || "-",
      checkIn: data.checkIn || "-",
      checkOut: data.checkOut || "-",
      status: data.status || "เช็คอินแล้ว"
    };
  });
};

export default function HotelPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  
  const { data: cats, isLoading, refetch } = useQuery({
    queryKey: ["hotelCats"],
    queryFn: fetchBoardedCats,
  });

  const filteredCats = cats?.filter(cat => 
    cat.petName.includes(searchQuery) || 
    cat.owner.includes(searchQuery) ||
    cat.room.includes(searchQuery)
  );

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      setOpenDropdownId(null);
      await updateDoc(doc(db, "hotel_bookings", id), {
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
          <h1 className="text-xl font-bold text-gray-900">โรงแรมแมว (Cat Hotel)</h1>
          <Link 
            href="/hotel/new"
            className="flex items-center justify-center w-10 h-10 bg-orange-50 text-orange-600 rounded-full hover:bg-orange-100 transition-colors"
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
            className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-xl leading-5 bg-gray-50 text-gray-900 placeholder-gray-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-orange-500 transition-colors sm:text-sm"
            placeholder="ค้นหาชื่อแมว, เจ้าของ หรือห้องพัก..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Boarding List */}
      <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        {isLoading ? (
          [...Array(4)].map((_, i) => (
            <div key={i} className="bg-white p-4 rounded-2xl h-32 animate-pulse border border-gray-100"></div>
          ))
        ) : filteredCats && filteredCats.length > 0 ? (
          filteredCats.map((cat) => (
            <div
              key={cat.id}
              className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-3 relative"
            >
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3 pr-2">
                  <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center text-xl shadow-inner shrink-0">
                    🏠
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-base font-bold text-gray-900 truncate">{cat.petName}</h3>
                    <p className="text-xs text-gray-500 mt-0.5 font-bold">ห้อง: <span className="text-orange-600">{cat.room}</span></p>
                  </div>
                </div>
                
                <div className="relative">
                  <div 
                    className={`shrink-0 px-2.5 py-1 rounded-full text-xs font-bold border cursor-pointer hover:opacity-80 transition-opacity ${
                      cat.status === "เช็คอินแล้ว" ? "bg-mint-100 text-mint-700 border-mint-200" : "bg-gray-100 text-gray-600 border-gray-200"
                    }`}
                    onClick={() => setOpenDropdownId(openDropdownId === cat.id ? null : cat.id)}
                  >
                    {cat.status}
                  </div>

                  {openDropdownId === cat.id && (
                    <div className="absolute top-8 right-0 bg-white border border-gray-200 rounded-xl shadow-lg z-20 overflow-hidden w-36">
                      <button onClick={() => handleUpdateStatus(cat.id, "เช็คอินแล้ว")} className="w-full text-left px-4 py-3 text-sm font-bold text-mint-600 hover:bg-gray-50">เช็คอินแล้ว</button>
                      <button onClick={() => handleUpdateStatus(cat.id, "เช็คเอาท์แล้ว")} className="w-full text-left px-4 py-3 text-sm font-bold text-gray-600 hover:bg-gray-50 border-t border-gray-100">เช็คเอาท์แล้ว</button>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex justify-between items-center pt-3 border-t border-gray-50">
                <div className="flex items-center gap-1.5 text-xs text-gray-500 font-bold">
                  <Calendar size={14} className="text-gray-400 shrink-0" />
                  <span className="truncate">{cat.checkIn} - {cat.checkOut}</span>
                </div>
                <div className="text-xs font-bold text-gray-400 shrink-0 ml-2">
                  {cat.owner}
                </div>
              </div>

              {/* View Daily Log Link */}
              <Link 
                href={`/hotel/${cat.id}`}
                className="mt-2 w-full py-2 bg-orange-50 text-orange-600 text-sm font-bold rounded-xl text-center hover:bg-orange-100 transition-colors"
              >
                อัปเดต / ดูข้อมูลรายวัน
              </Link>
            </div>
          ))
        ) : (
          <div className="col-span-1 md:col-span-2 text-center py-10">
            <p className="text-gray-500 font-bold mb-2">ไม่มีข้อมูลการเข้าพัก</p>
          </div>
        )}
      </div>

    </div>
  );
}
