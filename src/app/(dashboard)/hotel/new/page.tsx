"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { hotelSchema, HotelFormValues } from "@/features/hotel/schemas/hotel";
import { ArrowLeft, Save, Home, Utensils, Syringe, Search, ChevronDown } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useRef, useEffect, Suspense } from "react";
import { db } from "@/lib/firebase/config";
import { collection, addDoc, getDocs, query, orderBy } from "firebase/firestore";
import { useQuery } from "@tanstack/react-query";

const fetchPetsAndOwners = async () => {
  const ownersSnap = await getDocs(collection(db, "owners"));
  const ownersList = ownersSnap.docs.map(doc => ({ id: doc.id, ...(doc.data() as any) }));

  const petsSnap = await getDocs(query(collection(db, "pets"), orderBy("createdAt", "desc")));
  return petsSnap.docs.map(doc => {
    const data = doc.data() as any;
    const owner = ownersList.find((o: any) => o.id === data.ownerId);
    return {
      id: doc.id,
      name: data.name,
      species: data.species,
      owner: owner?.name || "ไม่ระบุ",
      phone: owner?.phone || "-"
    };
  });
};

function HotelFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialPetId = searchParams.get("petId") || "";

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<HotelFormValues>({
    resolver: zodResolver(hotelSchema),
    defaultValues: {
      petId: initialPetId,
    }
  });

  const { data: petsList = [] } = useQuery({
    queryKey: ["petsWithOwners"],
    queryFn: fetchPetsAndOwners
  });

  const selectedPetId = watch("petId");
  const selectedPet = petsList.find((p: any) => p.id === selectedPetId);
  const filteredPets = petsList.filter((p: any) => 
    p.name?.includes(searchQuery) || 
    p.owner?.includes(searchQuery) || 
    p.phone?.includes(searchQuery)
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const onSubmit = async (data: HotelFormValues) => {
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, "hotel_bookings"), {
        ...data,
        status: "เช็คอินแล้ว", // Default MVP status
        createdAt: new Date().toISOString()
      });
      router.push("/hotel");
    } catch (error) {
      console.error(error);
      alert("เกิดข้อผิดพลาดในการบันทึกข้อมูล");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 pb-20">
      
      {/* Top App Bar */}
      <div className="bg-white px-4 py-4 shadow-sm sticky top-0 z-30 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/hotel" className="p-2 -ml-2 rounded-full hover:bg-gray-100 text-gray-600 transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-lg font-bold text-gray-900">Check-In โรงแรม</h1>
        </div>
      </div>

      {/* Form Content */}
      <div className="p-4">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          
          <section className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 space-y-4">
            <div className="flex items-center gap-2 text-gray-900 font-bold mb-2">
              <Home size={18} className="text-orange-500" />
              <h2>ข้อมูลการเข้าพัก</h2>
            </div>

            <div ref={dropdownRef}>
              <label className="block text-sm font-bold text-gray-800 mb-1">สัตว์เลี้ยงที่ต้องการฝาก <span className="text-red-500">*</span></label>
              
              <div className="relative">
                <div 
                  className={`flex items-center justify-between w-full p-3 border rounded-xl bg-gray-50 cursor-pointer transition-colors ${errors.petId ? "border-red-300" : "border-gray-200"} ${isDropdownOpen ? "ring-2 ring-orange-500 bg-white" : ""}`}
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                >
                  <span className={`text-sm ${selectedPet ? "text-gray-900 font-bold" : "text-gray-500"}`}>
                    {selectedPet ? `${selectedPet.name} (${selectedPet.species}) - ${selectedPet.owner}` : "ค้นหาชื่อสัตว์เลี้ยง, เจ้าของ หรือเบอร์โทร..."}
                  </span>
                  <ChevronDown size={18} className="text-gray-400" />
                </div>

                {isDropdownOpen && (
                  <div className="absolute z-40 w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                    <div className="sticky top-0 bg-white p-2 border-b border-gray-100">
                      <div className="relative">
                        <Search size={16} className="absolute left-3 top-3 text-gray-400" />
                        <input
                          type="text"
                          autoFocus
                          placeholder="ค้นหาชื่อสัตว์, เจ้าของ..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                        />
                      </div>
                    </div>
                    <ul className="py-1">
                      {filteredPets.length > 0 ? (
                        filteredPets.map((pet: any) => (
                          <li
                            key={pet.id}
                            onClick={() => {
                              setValue("petId", pet.id, { shouldValidate: true });
                              setIsDropdownOpen(false);
                              setSearchQuery("");
                            }}
                            className={`px-4 py-3 text-sm cursor-pointer hover:bg-orange-50 transition-colors ${selectedPetId === pet.id ? "bg-orange-50 text-orange-700 font-bold" : "text-gray-700"}`}
                          >
                            <span className="font-bold text-gray-900">{pet.name}</span> 
                            <span className="text-gray-500 font-normal text-xs ml-1">({pet.species}) - {pet.owner}</span>
                          </li>
                        ))
                      ) : (
                        <li className="px-4 py-3 text-sm text-gray-500 text-center">
                          ไม่พบข้อมูล
                        </li>
                      )}
                    </ul>
                  </div>
                )}
              </div>
              {errors.petId && <p className="text-red-500 text-xs mt-1">{errors.petId.message as string}</p>}
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-800 mb-1">ห้องพัก <span className="text-red-500">*</span></label>
              <select 
                {...register("roomNumber")}
                className={`w-full p-3 border rounded-xl bg-gray-50 text-gray-900 focus:bg-white focus:outline-none focus:ring-2 transition-colors ${errors.roomNumber ? "border-red-300 focus:ring-red-500" : "border-gray-200 focus:ring-orange-500"}`}
              >
                <option value="">เลือกห้องพัก...</option>
                <option value="VIP-01">VIP-01 (ห้องแอร์)</option>
                <option value="Standard-03">Standard-03 (พัดลม)</option>
              </select>
              {errors.roomNumber && <p className="text-red-500 text-xs mt-1">{errors.roomNumber.message as string}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-800 mb-1">Check In <span className="text-red-500">*</span></label>
                <input 
                  type="date" 
                  {...register("checkIn")}
                  className={`w-full p-3 border rounded-xl bg-gray-50 text-gray-900 focus:bg-white focus:outline-none focus:ring-2 transition-colors ${errors.checkIn ? "border-red-300 focus:ring-red-500" : "border-gray-200 focus:ring-orange-500"}`}
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-800 mb-1">Check Out <span className="text-red-500">*</span></label>
                <input 
                  type="date" 
                  {...register("checkOut")}
                  className={`w-full p-3 border rounded-xl bg-gray-50 text-gray-900 focus:bg-white focus:outline-none focus:ring-2 transition-colors ${errors.checkOut ? "border-red-300 focus:ring-red-500" : "border-gray-200 focus:ring-orange-500"}`}
                />
              </div>
            </div>
          </section>

          <section className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 space-y-4">
            <div className="flex items-center gap-2 text-gray-900 font-bold mb-2">
              <Utensils size={18} className="text-mint-500" />
              <h2>อาหารและการดูแล</h2>
            </div>
            
            <div>
              <label className="block text-sm font-bold text-gray-800 mb-1">อาหาร (เจ้าของเตรียมมา หรือ ของคลินิก)</label>
              <textarea 
                {...register("food")}
                rows={2}
                className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-mint-500 transition-colors resize-none"
                placeholder="เช่น Royal Canin แมวโต, ทานวันละ 2 มื้อ..."
              />
            </div>
          </section>

          <section className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 space-y-4">
            <div className="flex items-center gap-2 text-gray-900 font-bold mb-2">
              <Syringe size={18} className="text-blue-500" />
              <h2>ยาและโรคประจำตัว (ถ้ามี)</h2>
            </div>
            
            <div>
              <label className="block text-sm font-bold text-gray-800 mb-1">ยาที่ต้องป้อน</label>
              <input 
                type="text" 
                {...register("medicine")}
                className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                placeholder="ชื่อยา และขนาด"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-800 mb-1">เวลาป้อนยา</label>
              <input 
                type="text" 
                {...register("medTime")}
                className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                placeholder="เช่น เช้า-เย็น หลังอาหาร"
              />
            </div>
          </section>

          <div className="pt-2">
            <button 
              type="submit" 
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 bg-orange-500 text-white font-bold py-3.5 rounded-xl hover:bg-orange-600 active:scale-[0.98] transition-all disabled:opacity-70"
            >
              {isSubmitting ? (
                <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
              ) : (
                <>
                  <Save size={20} />
                  ยืนยันการ Check In
                </>
              )}
            </button>
          </div>

        </form>
      </div>

    </div>
  );
}

export default function NewHotelPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen text-gray-500 font-bold">กำลังโหลด...</div>}>
      <HotelFormContent />
    </Suspense>
  );
}
