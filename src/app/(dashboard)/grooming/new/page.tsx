"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { groomingSchema, GroomingFormValues } from "@/features/grooming/schemas/grooming";
import { ArrowLeft, Save, Scissors, Image as ImageIcon, Camera, Search, ChevronDown } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useRef, useEffect, Suspense } from "react";
import { db } from "@/lib/firebase/config";
import { collection, addDoc, getDocs, query, orderBy } from "firebase/firestore";
import { useQuery } from "@tanstack/react-query";

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

const fetchPetsAndOwners = async () => {
  const ownersSnap = await getDocs(collection(db, "owners"));
  const ownersList = ownersSnap.docs.map(doc => ({ id: doc.id, ...(doc.data() as any) } as any));

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

function GroomingFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialPetId = searchParams.get("petId") || "";

  const [isSubmitting, setIsSubmitting] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<any>({
    resolver: zodResolver(groomingSchema),
    defaultValues: {
      petId: initialPetId,
      bookingDate: new Date().toISOString().split("T")[0],
      status: "รอดำเนินการ",
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

  const onSubmit = async (data: any) => {
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, "grooming_queues"), {
        ...data,
        createdAt: new Date().toISOString()
      });
      router.push("/grooming");
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
          <Link href="/grooming" className="p-2 -ml-2 rounded-full hover:bg-gray-100 text-gray-600 transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-lg font-bold text-gray-900">เพิ่มคิวอาบน้ำตัดขน</h1>
        </div>
      </div>

      {/* Form Content */}
      <div className="p-4">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          
          <section className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 space-y-4">
            
            <div ref={dropdownRef}>
              <label className="block text-sm font-bold text-gray-800 mb-1">สัตว์เลี้ยง <span className="text-red-500">*</span></label>
              
              <div className="relative">
                <div 
                  className={`flex items-center justify-between w-full p-3 border rounded-xl bg-gray-50 cursor-pointer transition-colors ${errors.petId ? "border-red-300" : "border-gray-200"} ${isDropdownOpen ? "ring-2 ring-purple-500 bg-white" : ""}`}
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
                          className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
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
                            className={`px-4 py-3 text-sm cursor-pointer hover:bg-purple-50 transition-colors ${selectedPetId === pet.id ? "bg-purple-50 text-purple-700 font-bold" : "text-gray-700"}`}
                          >
                            <span className="font-bold text-gray-900">{pet.name}</span> 
                            <span className="text-gray-500 font-normal text-xs ml-1">({pet.species}) - {pet.owner}</span>
                          </li>
                        ))
                      ) : (
                        <li className="px-4 py-3 text-sm text-gray-500 text-center">
                          ไม่พบข้อมูลผู้ป่วย
                        </li>
                      )}
                    </ul>
                  </div>
                )}
              </div>
              {errors.petId && <p className="text-red-500 text-xs mt-1">{errors.petId.message as string}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-800 mb-1">วันที่</label>
                <input 
                  type="date" 
                  {...register("bookingDate")}
                  className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-800 mb-1">สถานะ</label>
                <select 
                  {...register("status")}
                  className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors"
                >
                  <option value="รอดำเนินการ">รอดำเนินการ</option>
                  <option value="กำลังทำ">กำลังทำ</option>
                  <option value="เสร็จแล้ว">เสร็จแล้ว</option>
                </select>
              </div>
            </div>
          </section>

          <section className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 space-y-4">
            <div className="flex items-center gap-2 text-gray-900 font-bold mb-2">
              <Scissors size={18} className="text-purple-500" />
              <h2>รายการที่ทำ (Services)</h2>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              {GROOMING_SERVICES.map((item) => (
                <label key={item.id} className="flex items-center gap-3 p-3 border border-gray-100 rounded-xl bg-gray-50 active:bg-gray-100 transition-colors cursor-pointer">
                  <input 
                    type="checkbox" 
                    {...register(`services.${item.id as any}`)} 
                    className="w-4 h-4 rounded border-gray-300 text-purple-500 focus:ring-purple-500"
                  />
                  <span className="text-sm font-bold text-gray-800">{item.label}</span>
                </label>
              ))}
            </div>
          </section>

          <section className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 space-y-4">
            <div className="flex items-center gap-2 text-gray-900 font-bold mb-2">
              <ImageIcon size={18} className="text-blue-500" />
              <h2>รูปภาพ (Before & After)</h2>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-xl h-32 bg-gray-50 text-gray-500 hover:bg-gray-100 hover:border-gray-400 transition-colors cursor-pointer">
                <Camera size={24} className="mb-2" />
                <span className="text-xs font-bold">ภาพก่อนทำ</span>
              </div>
              <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-xl h-32 bg-gray-50 text-gray-500 hover:bg-gray-100 hover:border-gray-400 transition-colors cursor-pointer">
                <Camera size={24} className="mb-2" />
                <span className="text-xs font-bold">ภาพหลังทำ</span>
              </div>
            </div>
          </section>

          <section className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 space-y-4">
            <div>
              <label className="block text-sm font-bold text-gray-800 mb-1">ราคาประเมิน (บาท)</label>
              <input 
                type="number" 
                {...register("price", { valueAsNumber: true })}
                className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-800 mb-1">หมายเหตุช่าง</label>
              <textarea 
                {...register("notes")}
                rows={2}
                className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors resize-none"
                placeholder="เช่น ขนสังกะตังเยอะมาก, สัตว์ดุ..."
              />
            </div>
          </section>

          <div className="pt-2">
            <button 
              type="submit" 
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 bg-purple-500 text-white font-bold py-3.5 rounded-xl hover:bg-purple-600 active:scale-[0.98] transition-all disabled:opacity-70"
            >
              {isSubmitting ? (
                <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
              ) : (
                <>
                  <Save size={20} />
                  บันทึกคิว
                </>
              )}
            </button>
          </div>

        </form>
      </div>

    </div>
  );
}

export default function NewGroomingPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen text-gray-500 font-bold">กำลังโหลด...</div>}>
      <GroomingFormContent />
    </Suspense>
  );
}
