"use client";

import { useState, useEffect } from "react";
import { Search, UserPlus, Phone, MapPin, ChevronRight, User, ChevronLeft } from "lucide-react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { db } from "@/lib/firebase/config";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { SearchBar } from "@/components/ui/SearchBar";

const fetchOwnersAndPets = async () => {
  const ownersSnap = await getDocs(query(collection(db, "owners"), orderBy("createdAt", "desc")));
  const petsSnap = await getDocs(collection(db, "pets"));
  
  const petsList = petsSnap.docs.map(doc => ({ id: doc.id, ...(doc.data() as any) } as any));
  
  return ownersSnap.docs.map(doc => {
    const data = doc.data() as any;
    const ownerPets = petsList.filter((p: any) => p.ownerId === doc.id);
    return {
      id: doc.id,
      name: data.name || "ไม่มีชื่อ",
      phone: data.phone || "-",
      address: data.address || "-",
      pets: ownerPets
    };
  });
};

export default function PatientsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 20;
  
  const { data: owners, isLoading } = useQuery({
    queryKey: ["owners-and-pets"],
    queryFn: fetchOwnersAndPets,
  });

  const filteredOwners = owners?.filter(owner => 
    owner.name.includes(searchQuery) || 
    owner.phone.includes(searchQuery) ||
    owner.pets.some((p: any) => p.name.includes(searchQuery) || p.species.includes(searchQuery))
  ) || [];

  // Reset to first page when searching
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const totalPages = Math.ceil(filteredOwners.length / ITEMS_PER_PAGE);
  const paginatedOwners = filteredOwners.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 pb-20">
      
      {/* Top App Bar */}
      <div className="bg-white px-4 py-4 shadow-sm sticky top-0 z-30 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900">ทะเบียนลูกค้า & สัตว์ป่วย</h1>
          <Link 
            href="/patients/register"
            className="flex items-center justify-center w-10 h-10 bg-blue-50 text-blue-600 rounded-full hover:bg-blue-100 transition-colors"
          >
            <UserPlus size={20} />
          </Link>
        </div>

        <SearchBar 
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="ค้นหาชื่อเจ้าของ, เบอร์โทร, หรือชื่อสัตว์..."
        />
      </div>

      {/* List */}
      <div className="p-4 space-y-3">
        {isLoading ? (
          [...Array(4)].map((_, i) => (
            <div key={i} className="bg-white p-4 rounded-2xl h-24 animate-pulse"></div>
          ))
        ) : paginatedOwners.length > 0 ? (
          <>
            {paginatedOwners.map((owner) => (
              <Link 
                href={`/patients/${owner.id}`}
                key={owner.id}
                className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between hover:shadow-md active:scale-[0.98] transition-all cursor-pointer block"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center font-bold text-lg shrink-0">
                    <User size={24} />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-gray-900">{owner.name}</h3>
                    <div className="flex items-center text-xs text-gray-500 mt-1 gap-3">
                      <span className="flex items-center gap-1"><Phone size={12}/> {owner.phone}</span>
                      {owner.address !== "-" && (
                        <span className="flex items-center gap-1 truncate max-w-[120px]"><MapPin size={12}/> {owner.address}</span>
                      )}
                    </div>
                    {owner.pets.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {owner.pets.map((pet: any) => (
                          <div key={pet.id} className="flex flex-col items-center gap-2 bg-gray-50 border border-gray-100 p-3 rounded-2xl min-w-[90px]">
                            {pet.imageUrl ? (
                              <img src={pet.imageUrl} alt={pet.name} className="w-16 h-16 object-cover rounded-full shadow-sm border-2 border-white" />
                            ) : (
                              <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center text-3xl shadow-sm border-2 border-white">
                                {pet.species === "แมว" ? "🐱" : "🐶"}
                              </div>
                            )}
                            <span className="text-sm font-bold text-gray-800">{pet.name}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <ChevronRight size={20} className="text-gray-300" />
              </Link>
            ))}
            
            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between py-4 mt-4">
                <button 
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="flex items-center gap-1 px-4 py-2 text-sm font-bold text-blue-600 bg-blue-50 rounded-xl hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft size={16} /> ก่อนหน้า
                </button>
                <span className="text-sm font-bold text-gray-500">
                  หน้า {currentPage} จาก {totalPages}
                </span>
                <button 
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="flex items-center gap-1 px-4 py-2 text-sm font-bold text-blue-600 bg-blue-50 rounded-xl hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  ถัดไป <ChevronRight size={16} />
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-10">
            <p className="text-gray-500 font-bold mb-2">ไม่พบข้อมูลลูกค้า</p>
            <p className="text-sm text-gray-400">ลองค้นหาด้วยคำอื่น หรือเพิ่มลูกค้าใหม่</p>
          </div>
        )}
      </div>

    </div>
  );
}
