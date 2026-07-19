"use client";

import { useState } from "react";
import { ArrowLeft, Search, Plus, Save } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { useQuery } from "@tanstack/react-query";
import { db } from "@/lib/firebase/config";
import { collection, getDocs, addDoc } from "firebase/firestore";

export default function NewAdmitPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPet, setSelectedPet] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, handleSubmit } = useForm({
    defaultValues: {
      cageNumber: "",
      symptoms: "",
      medications: "",
    }
  });

  const { data: searchResults, isLoading: isSearching } = useQuery({
    queryKey: ["searchPetsAdmit", searchQuery],
    queryFn: async () => {
      if (searchQuery.length < 2) return [];
      
      const petsSnap = await getDocs(collection(db, "pets"));
      const ownersSnap = await getDocs(collection(db, "owners"));
      
      const ownersList = ownersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      return petsSnap.docs
        .map(doc => {
          const data = doc.data();
          const owner = ownersList.find((o: any) => o.id === data.ownerId);
          return { id: doc.id, ...data, ownerName: owner?.name || "ไม่ทราบชื่อ" };
        })
        .filter((pet: any) => 
          // filter ONLY cats as per requirement
          pet.species === "แมว" &&
          (pet.name.includes(searchQuery) || pet.ownerName.includes(searchQuery))
        );
    },
    enabled: searchQuery.length >= 2
  });

  const onSubmit = async (data: any) => {
    if (!selectedPet) {
      alert("กรุณาเลือกแมวที่ต้องการแอดมิท");
      return;
    }

    setIsSubmitting(true);
    try {
      const now = new Date();
      await addDoc(collection(db, "admit_records"), {
        petId: selectedPet.id,
        cageNumber: data.cageNumber,
        symptoms: data.symptoms,
        medications: data.medications,
        admitDate: now.toISOString().split("T")[0],
        status: "กำลังรักษา",
        createdAt: now.toISOString(),
      });
      
      alert("รับแอดมิทเรียบร้อยแล้ว");
      router.push("/admit");
    } catch (error) {
      console.error(error);
      alert("เกิดข้อผิดพลาด กรุณาลองใหม่");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 pb-20">
      
      {/* Top App Bar */}
      <div className="bg-white px-4 py-4 shadow-sm sticky top-0 z-30 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/admit" className="p-2 -ml-2 rounded-full hover:bg-gray-100 text-gray-800 transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-lg font-bold text-gray-900">รับแอดมิท (Admit แมว)</h1>
        </div>
      </div>

      <div className="p-4 space-y-6">
        
        {/* Step 1: Select Pet */}
        <section className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
          <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-xs">1</span>
            เลือกแมวป่วย
          </h2>

          {!selectedPet ? (
            <div className="space-y-4">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search size={18} className="text-gray-400" />
                </div>
                <input
                  type="text"
                  className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors"
                  placeholder="ค้นหาชื่อแมว หรือ เจ้าของ..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              {searchQuery.length > 0 && searchQuery.length < 2 && (
                <p className="text-xs text-gray-500 text-center py-2">พิมพ์อย่างน้อย 2 ตัวอักษรเพื่อค้นหา</p>
              )}

              {isSearching ? (
                <div className="flex justify-center py-4"><div className="w-6 h-6 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div></div>
              ) : searchResults && searchResults.length > 0 ? (
                <div className="space-y-2 mt-2 max-h-60 overflow-y-auto">
                  {searchResults.map((pet: any) => (
                    <div 
                      key={pet.id}
                      onClick={() => setSelectedPet(pet)}
                      className="p-3 border border-gray-100 rounded-xl hover:bg-red-50 hover:border-red-200 cursor-pointer transition-colors flex items-center gap-3"
                    >
                      {pet.imageUrl ? (
                        <img src={pet.imageUrl} alt={pet.name} className="w-10 h-10 object-cover rounded-full shadow-sm" />
                      ) : (
                        <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center text-xl">🐱</div>
                      )}
                      <div>
                        <p className="font-bold text-gray-900 text-sm">{pet.name}</p>
                        <p className="text-xs text-gray-500 font-medium">เจ้าของ: {pet.ownerName}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : searchQuery.length >= 2 ? (
                <div className="text-center py-4 space-y-3">
                  <p className="text-sm text-gray-500 font-bold">ไม่พบข้อมูลแมว</p>
                  <Link href="/patients/register" className="inline-flex items-center gap-2 text-sm text-blue-600 bg-blue-50 px-4 py-2 rounded-full font-bold">
                    <Plus size={16} /> ลงทะเบียนลูกค้าใหม่
                  </Link>
                </div>
              ) : null}
            </div>
          ) : (
            <div className="flex items-center justify-between p-4 bg-red-50 border border-red-100 rounded-xl">
              <div className="flex items-center gap-3">
                {selectedPet.imageUrl ? (
                  <img src={selectedPet.imageUrl} alt={selectedPet.name} className="w-12 h-12 object-cover rounded-full shadow-sm" />
                ) : (
                  <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-2xl shadow-sm">🐱</div>
                )}
                <div>
                  <p className="font-bold text-red-900">{selectedPet.name}</p>
                  <p className="text-xs text-red-700 font-medium">เจ้าของ: {selectedPet.ownerName}</p>
                </div>
              </div>
              <button 
                onClick={() => {
                  setSelectedPet(null);
                  setSearchQuery("");
                }}
                className="text-xs font-bold text-red-600 bg-white px-3 py-1.5 rounded-full shadow-sm hover:bg-red-50 transition-colors"
              >
                เปลี่ยน
              </button>
            </div>
          )}
        </section>

        {/* Step 2: Admit Details */}
        {selectedPet && (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <section className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 space-y-4">
              <h2 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-xs">2</span>
                รายละเอียดการแอดมิท
              </h2>

              <div>
                <label className="block text-sm font-bold text-gray-800 mb-1">หมายเลขกรง / ห้อง</label>
                <input 
                  type="text"
                  {...register("cageNumber", { required: true })}
                  className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors"
                  placeholder="เช่น กรง A1"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-800 mb-1">อาการสำคัญ / ข้อควรระวัง</label>
                <textarea 
                  {...register("symptoms", { required: true })}
                  rows={3}
                  className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors resize-none"
                  placeholder="เช่น ซึม ไม่กินอาหาร ระวังดุ"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-800 mb-1">ยาที่ต้องให้ / การรักษา (ถ้ามี)</label>
                <textarea 
                  {...register("medications")}
                  rows={2}
                  className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors resize-none"
                  placeholder="เช่น ให้น้ำเกลือ, ป้อนยาฆ่าเชื้อเช้า-เย็น"
                />
              </div>
            </section>

            <button 
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 bg-red-600 text-white font-bold py-4 rounded-xl hover:bg-red-700 active:scale-[0.98] transition-all shadow-sm disabled:opacity-70 mt-6"
            >
              {isSubmitting ? "กำลังบันทึก..." : <><Save size={20} /> บันทึกการแอดมิท</>}
            </button>
          </form>
        )}

      </div>
    </div>
  );
}
