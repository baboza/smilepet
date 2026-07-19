"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { appointmentSchema, AppointmentFormValues } from "@/features/appointments/schemas/appointment";
import { ArrowLeft, Save, Search, ChevronDown } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useRef, useEffect, Suspense } from "react";
import { db } from "@/lib/firebase/config";
import { collection, addDoc, getDocs, query, orderBy, where } from "firebase/firestore";
import { useQuery } from "@tanstack/react-query";

const fetchPetsAndOwners = async () => {
  const ownersSnap = await getDocs(collection(db, "owners"));
  const ownersList = ownersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

  const petsSnap = await getDocs(query(collection(db, "pets"), orderBy("createdAt", "desc")));
  return petsSnap.docs.map(doc => {
    const data = doc.data();
    const owner = ownersList.find((o: any) => o.id === data.ownerId);
    return {
      id: doc.id,
      name: data.name,
      species: data.species,
      owner: owner?.name || "ไม่ระบุ",
      phone: owner?.phone || "-",
      imageUrl: data.imageUrl || data.photoUrl || null
    };
  });
};

const fetchDoctors = async () => {
  const q = query(collection(db, "users"), where("role", "==", "doctor"));
  const snap = await getDocs(q);
  return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

function AppointmentFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialPetId = searchParams.get("petId") || "";

  const [isSubmitting, setIsSubmitting] = useState(false);

  // States for Searchable Dropdown
  const [searchQuery, setSearchQuery] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<AppointmentFormValues>({
    resolver: zodResolver(appointmentSchema),
    defaultValues: {
      petId: initialPetId,
      date: new Date().toISOString().split("T")[0],
      time: "10:00",
      status: "confirmed"
    }
  });

  const { data: petsList = [] } = useQuery({
    queryKey: ["petsWithOwners"],
    queryFn: fetchPetsAndOwners
  });

  const { data: doctorsList = [] } = useQuery({
    queryKey: ["doctors"],
    queryFn: fetchDoctors
  });

  const selectedPetId = watch("petId");
  const selectedPet = petsList.find((p: any) => p.id === selectedPetId);
  const filteredPets = petsList.filter((p: any) => 
    p.name?.includes(searchQuery) || 
    p.owner?.includes(searchQuery) || 
    p.phone?.includes(searchQuery)
  );

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const onSubmit = async (data: AppointmentFormValues) => {
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, "appointments"), {
        ...data,
        status: "pending",
        createdAt: new Date().toISOString()
      });
      router.push("/appointments");
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
          <Link href="/appointments" className="p-2 -ml-2 rounded-full hover:bg-gray-100 text-gray-800 transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-lg font-bold text-gray-900">นัดหมายใหม่</h1>
        </div>
      </div>

      {/* Form Content */}
      <div className="p-4">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          
          <section className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200 space-y-4">
            
            <div ref={dropdownRef}>
              <label className="block text-sm font-bold text-gray-800 mb-1">สัตว์เลี้ยง (ผู้ป่วย) <span className="text-red-500">*</span></label>
              
              {/* Searchable Dropdown */}
              <div className="relative">
                <div 
                  className={`flex items-center justify-between w-full p-3 border rounded-xl bg-gray-50 cursor-pointer transition-colors ${errors.petId ? "border-red-300" : "border-gray-200"} ${isDropdownOpen ? "ring-2 ring-blue-500 bg-white" : ""}`}
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                >
                  <div className="flex items-center gap-2">
                    {selectedPet && (
                      selectedPet.imageUrl ? (
                        <img src={selectedPet.imageUrl} alt={selectedPet.name} className="w-6 h-6 object-cover rounded-full" />
                      ) : (
                        <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center text-[10px]">
                          {selectedPet.species === "แมว" ? "🐱" : "🐶"}
                        </div>
                      )
                    )}
                    <span className={`text-sm ${selectedPet ? "text-gray-900 font-bold" : "text-gray-500"}`}>
                      {selectedPet ? `${selectedPet.name} (${selectedPet.species}) - ${selectedPet.owner}` : "ค้นหาชื่อสัตว์เลี้ยง, เจ้าของ หรือเบอร์โทร..."}
                    </span>
                  </div>
                  <ChevronDown size={18} className="text-gray-400 shrink-0" />
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
                          className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                            className={`px-4 py-3 text-sm cursor-pointer hover:bg-blue-50 transition-colors flex items-center gap-3 ${selectedPetId === pet.id ? "bg-blue-50 text-blue-700 font-bold" : "text-gray-700"}`}
                          >
                            {pet.imageUrl ? (
                              <img src={pet.imageUrl} alt={pet.name} className="w-8 h-8 object-cover rounded-full shrink-0" />
                            ) : (
                              <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-sm shrink-0">
                                {pet.species === "แมว" ? "🐱" : "🐶"}
                              </div>
                            )}
                            <div>
                              <span className="font-bold text-gray-900">{pet.name}</span> 
                              <span className="text-gray-500 font-normal text-xs ml-1">({pet.species}) - {pet.owner}</span>
                            </div>
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
              {errors.petId && <p className="text-red-500 text-xs mt-1">{errors.petId.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-800 mb-1">ประเภทการนัดหมาย <span className="text-red-500">*</span></label>
              <select 
                {...register("type")}
                className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
              >
                <option value="ตรวจรักษาทั่วไป">ตรวจรักษาทั่วไป</option>
                <option value="วัคซีน">วัคซีน</option>
                <option value="กำจัดเห็บหมัด">กำจัดเห็บหมัด</option>
                <option value="ถ่ายพยาธิ">ถ่ายพยาธิ</option>
                <option value="ผ่าตัด">ผ่าตัด</option>
                <option value="Follow up">Follow up</option>
                <option value="อื่นๆ">อื่นๆ</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-800 mb-1">วันที่ <span className="text-red-500">*</span></label>
                <input 
                  type="date" 
                  {...register("date")}
                  className={`w-full p-3 border rounded-xl bg-gray-50 text-gray-900 focus:bg-white focus:outline-none focus:ring-2 transition-colors ${errors.date ? "border-red-300 focus:ring-red-500" : "border-gray-200 focus:ring-blue-500"}`}
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-800 mb-1">เวลา <span className="text-red-500">*</span></label>
                <input 
                  type="time" 
                  {...register("time")}
                  className={`w-full p-3 border rounded-xl bg-gray-50 text-gray-900 focus:bg-white focus:outline-none focus:ring-2 transition-colors ${errors.time ? "border-red-300 focus:ring-red-500" : "border-gray-200 focus:ring-blue-500"}`}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-800 mb-1">สัตวแพทย์ที่รับผิดชอบ</label>
              <select 
                {...register("doctorId")}
                className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
              >
                <option value="">(ไม่ระบุ)</option>
                {doctorsList.map((doc: any) => (
                  <option key={doc.id} value={doc.id}>{doc.name || doc.displayName || doc.email}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-800 mb-1">หมายเหตุเพิ่มเติม</label>
              <textarea 
                {...register("notes")}
                rows={2}
                className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors resize-none"
                placeholder="เช่น นัดดูอาการหลังผ่าตัด..."
              />
            </div>
          </section>

          <div className="pt-2">
            <button 
              type="submit" 
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white font-bold py-3.5 rounded-xl hover:bg-blue-700 active:scale-[0.98] transition-all disabled:opacity-70"
            >
              {isSubmitting ? (
                <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
              ) : (
                <>
                  <Save size={20} />
                  บันทึกนัดหมาย
                </>
              )}
            </button>
          </div>

        </form>
      </div>

    </div>
  );
}

export default function NewAppointmentPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen text-gray-500 font-bold">กำลังโหลด...</div>}>
      <AppointmentFormContent />
    </Suspense>
  );
}
