"use client";

import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Save, BugOff, Search, ChevronDown, CalendarPlus } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useRef, useEffect, Suspense } from "react";
import { db } from "@/lib/firebase/config";
import { collection, addDoc, getDocs, query, orderBy } from "firebase/firestore";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/features/auth/contexts/AuthContext";

const parasiteSchema = z.object({
  petId: z.string().min(1, "กรุณาเลือกสัตว์เลี้ยง"),
  preventionNames: z.array(z.string()).min(1, "กรุณาเลือกรายการกำจัดปรสิตอย่างน้อย 1 รายการ"),
  weight: z.string().optional(),
  lotNumber: z.string().optional(),
  notes: z.string().optional(),
  nextAppointmentDate: z.string().optional(),
});

type ParasiteFormValues = z.infer<typeof parasiteSchema>;

const DOG_PARASITES = [
  "Bravecto (สุนัข)",
  "NexGard",
  "NexGard Spectra",
  "Simparica Trio",
  "Frontline Plus (สุนัข)",
  "Advocate (สุนัข)",
  "ยาถ่ายพยาธิ (สุนัข)"
];

const CAT_PARASITES = [
  "Bravecto (แมว)",
  "Revolution",
  "Revolution Plus",
  "Broadline",
  "Frontline Plus (แมว)",
  "Advocate (แมว)",
  "ยาถ่ายพยาธิ (แมว)"
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
      breed: data.breed || "-",
      weight: data.weight || "-",
      owner: owner?.name || "ไม่ระบุ",
      phone: owner?.phone || "-",
      imageUrl: data.imageUrl || data.photoUrl || null
    };
  });
};

function ParasiteFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const initialPetId = searchParams.get("petId") || "";

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<ParasiteFormValues>({
    resolver: zodResolver(parasiteSchema),
    defaultValues: {
      petId: initialPetId,
      preventionNames: [],
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
    if (selectedPet && !watch("weight")) {
      setValue("weight", selectedPet.weight === "-" ? "" : selectedPet.weight);
    }
  }, [selectedPet, setValue, watch]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const onSubmit = async (data: ParasiteFormValues) => {
    try {
      setIsSubmitting(true);
      
      const now = new Date();
      const dateStr = `${now.toLocaleDateString('th-TH')} ${now.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}`;

      const parasiteData = {
        petId: data.petId,
        preventionName: data.preventionNames.join(", "),
        weight: data.weight || null,
        lotNumber: data.lotNumber || null,
        notes: data.notes || null,
        nextAppointmentDate: data.nextAppointmentDate || null,
        date: dateStr,
        createdAt: now.toISOString(),
        createdBy: user?.uid || "unknown"
      };

      await addDoc(collection(db, "parasite_preventions"), parasiteData);

      // Create appointment if next appointment date is provided
      if (data.nextAppointmentDate) {
        await addDoc(collection(db, "appointments"), {
          petId: data.petId,
          type: `กำจัดปรสิต ${data.preventionNames.join(", ")} รอบถัดไป`,
          date: data.nextAppointmentDate,
          time: "09:00", // Default time
          status: "pending",
          notes: "นัดหมายอัตโนมัติจากการบันทึกกำจัดปรสิต",
          createdAt: now.toISOString(),
          createdBy: user?.uid || "unknown"
        });
      }

      router.push(`/patients/${selectedPet?.owner ? selectedPetId : ''}`);
    } catch (error) {
      console.error("Error adding parasite prevention:", error);
      alert("เกิดข้อผิดพลาดในการบันทึกข้อมูล");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 pb-20">
      <div className="bg-white px-4 py-4 shadow-sm sticky top-0 z-30 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="p-2 -ml-2 rounded-full hover:bg-gray-100 text-gray-800 transition-colors">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-lg font-bold text-gray-900">บันทึกกำจัดปรสิต</h1>
        </div>
      </div>

      <div className="p-4 flex-1">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-2xl mx-auto">
          {/* Pet Selection */}
          <section className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
            <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span className="bg-blue-100 text-blue-600 p-1.5 rounded-lg"><Search size={18} /></span>
              เลือกสัตว์เลี้ยง
            </h2>

            <div className="relative" ref={dropdownRef}>
              {selectedPet ? (
                <div className="p-4 border-2 border-blue-100 bg-blue-50/50 rounded-xl flex justify-between items-center">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-2xl shadow-sm overflow-hidden border border-gray-100">
                      {selectedPet.imageUrl ? <img src={selectedPet.imageUrl} alt={selectedPet.name} className="w-full h-full object-cover" /> : (selectedPet.species === "แมว" ? "🐱" : "🐶")}
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900">{selectedPet.name}</h3>
                      <p className="text-xs text-gray-600">เจ้าของ: {selectedPet.owner} | {selectedPet.phone}</p>
                    </div>
                  </div>
                  <button type="button" onClick={() => setValue("petId", "", { shouldValidate: true })} className="text-blue-600 text-sm font-bold bg-blue-100 px-3 py-1.5 rounded-lg hover:bg-blue-200">
                    เปลี่ยน
                  </button>
                </div>
              ) : (
                <div 
                  className="relative cursor-pointer"
                  onClick={() => setIsDropdownOpen(true)}
                >
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search size={18} className="text-gray-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="ค้นหาชื่อสัตว์เลี้ยง, เจ้าของ หรือเบอร์โทร..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setIsDropdownOpen(true);
                    }}
                    className={`w-full pl-10 pr-10 py-3 border ${errors.petId ? 'border-red-500' : 'border-gray-200'} rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm`}
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <ChevronDown size={18} className="text-gray-400" />
                  </div>
                </div>
              )}
              {errors.petId && <p className="text-red-500 text-xs mt-1 font-medium">{errors.petId.message}</p>}

              {/* Dropdown Menu */}
              {isDropdownOpen && !selectedPet && (
                <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                  {filteredPets.length > 0 ? (
                    filteredPets.map((pet: any) => (
                      <div 
                        key={pet.id} 
                        className="p-3 border-b border-gray-50 hover:bg-blue-50 cursor-pointer flex items-center gap-3 transition-colors"
                        onClick={() => {
                          setValue("petId", pet.id, { shouldValidate: true });
                          setSearchQuery("");
                          setIsDropdownOpen(false);
                        }}
                      >
                        <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-xl overflow-hidden shrink-0">
                          {pet.imageUrl ? <img src={pet.imageUrl} alt={pet.name} className="w-full h-full object-cover" /> : (pet.species === "แมว" ? "🐱" : "🐶")}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-gray-900 truncate">{pet.name}</p>
                          <p className="text-xs text-gray-500 truncate">{pet.owner} | {pet.phone}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 text-center text-sm text-gray-500">ไม่พบสัตว์เลี้ยง</div>
                  )}
                </div>
              )}
            </div>
          </section>

          {/* Parasite Prevention Info */}
          <section className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
            <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span className="bg-teal-100 text-teal-600 p-1.5 rounded-lg"><BugOff size={18} /></span>
              ข้อมูลการกำจัดปรสิต
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-3">ชื่อยา/ผลิตภัณฑ์ *</label>
                
                {(!selectedPet || selectedPet.species === "สุนัข" || selectedPet.species === "หมา") && (
                  <div className="mb-4">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">ผลิตภัณฑ์สุนัข</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {DOG_PARASITES.map((item) => (
                        <label key={item} className="flex items-center gap-3 p-3 border border-gray-200 rounded-xl bg-gray-50 active:bg-gray-100 transition-colors cursor-pointer hover:border-teal-300">
                          <input 
                            type="checkbox" 
                            value={item}
                            {...register("preventionNames")} 
                            className="w-4 h-4 rounded border-gray-300 text-teal-500 focus:ring-teal-500"
                          />
                          <span className="text-sm font-bold text-gray-800">{item}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {(!selectedPet || selectedPet.species === "แมว") && (
                  <div className="mb-2">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">ผลิตภัณฑ์แมว</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {CAT_PARASITES.map((item) => (
                        <label key={item} className="flex items-center gap-3 p-3 border border-gray-200 rounded-xl bg-gray-50 active:bg-gray-100 transition-colors cursor-pointer hover:border-teal-300">
                          <input 
                            type="checkbox" 
                            value={item}
                            {...register("preventionNames")} 
                            className="w-4 h-4 rounded border-gray-300 text-teal-500 focus:ring-teal-500"
                          />
                          <span className="text-sm font-bold text-gray-800">{item}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
                
                {errors.preventionNames && <p className="text-red-500 text-xs mt-2">{errors.preventionNames.message}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">น้ำหนัก (kg)</label>
                  <input 
                    type="number" step="0.01"
                    {...register("weight")}
                    className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 transition-colors"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">Lot Number</label>
                  <input 
                    type="text" 
                    {...register("lotNumber")}
                    className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 transition-colors"
                    placeholder="Lot No."
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">หมายเหตุ</label>
                <textarea 
                  {...register("notes")}
                  className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 transition-colors"
                  placeholder="อาการข้างเคียง หรือ หมายเหตุเพิ่มเติม"
                  rows={2}
                />
              </div>
            </div>
          </section>

          {/* Next Appointment */}
          <section className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
            <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span className="bg-mint-100 text-mint-600 p-1.5 rounded-lg"><CalendarPlus size={18} /></span>
              นัดหมายครั้งต่อไป
            </h2>
            
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">วันที่นัดหมาย (ถ้ามี)</label>
              <input 
                type="date" 
                {...register("nextAppointmentDate")}
                className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-mint-500 transition-colors"
              />
              <p className="text-xs text-gray-500 mt-2">* ระบบจะสร้างใบนัดหมายอัตโนมัติหากระบุวันที่</p>
            </div>
          </section>

          {/* Submit Button */}
          <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100 z-40 md:relative md:bg-transparent md:border-0 md:p-0">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-teal-500 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 hover:bg-teal-600 active:scale-95 transition-all shadow-sm disabled:opacity-70 disabled:active:scale-100"
            >
              {isSubmitting ? (
                <>กำลังบันทึก...</>
              ) : (
                <>
                  <Save size={20} />
                  บันทึกข้อมูลกำจัดปรสิต
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function NewParasitePage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-gray-50"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500"></div></div>}>
      <ParasiteFormContent />
    </Suspense>
  );
}
