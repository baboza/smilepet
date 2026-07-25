"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { opdSchema, OpdFormValues } from "@/features/opd/schemas/opd";
import { ArrowLeft, Save, Stethoscope, Activity, FileText, Pill, Search, ChevronDown, CheckCircle2, CalendarPlus, Home, DollarSign } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useRef, useEffect, Suspense } from "react";
import { db } from "@/lib/firebase/config";
import { collection, addDoc, getDocs, query, orderBy } from "firebase/firestore";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/features/auth/contexts/AuthContext";

const CHIEF_COMPLAINTS = [
  "ซึม", "ไม่กินอาหาร", "อาเจียน", "ถ่ายเหลว", "ไอ", "จาม", "คัน", 
  "มีไข้", "หายใจลำบาก", "เดินกะเผลก", "ชัก", "ปัสสาวะผิดปกติ"
];

const DIAGNOSIS_LIST = [
  "Healthy / Routine Care", "Parvovirus", "Pyometra", "Gastroenteritis", "URI", "Otitis", 
  "Dermatitis", "CKD", "FIP", "FeLV", "FIV", "Diabetes"
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

function OpdFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const initialPetId = searchParams.get("petId") || "";

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [savedPetId, setSavedPetId] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<any>({
    resolver: zodResolver(opdSchema),
    defaultValues: {
      petId: initialPetId,
      chiefComplaint: { items: [], others: "" },
      diagnosis: [],
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

  const watchCcItems = watch("chiefComplaint.items") || [];
  const watchDiagnosis = watch("diagnosis") || [];

  const toggleArrayItem = (field: "chiefComplaint.items" | "diagnosis", currentValues: string[], item: string) => {
    if (currentValues.includes(item)) {
      setValue(field, currentValues.filter((v) => v !== item), { shouldDirty: true });
    } else {
      setValue(field, [...currentValues, item], { shouldDirty: true });
    }
  };

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
      const docRef = await addDoc(collection(db, "opd_records"), {
        ...data,
        doctorId: user?.uid || "unknown",
        date: new Date().toISOString().split("T")[0],
        createdAt: new Date().toISOString()
      });
      setSavedPetId(data.petId);
      setShowSuccessModal(true);
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
          <Link href="/dashboard" className="p-2 -ml-2 rounded-full hover:bg-gray-100 text-gray-800 transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-lg font-bold text-gray-900">บันทึกผลการตรวจ (OPD)</h1>
        </div>
        <button 
          onClick={handleSubmit(onSubmit)}
          disabled={isSubmitting}
          className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-blue-700 active:scale-95 transition-all disabled:opacity-70"
        >
          {isSubmitting ? "..." : "บันทึก"}
        </button>
      </div>

      <div className="p-4 space-y-6">
        
        {/* Patient Selection Card */}
        <section className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200 space-y-4" ref={dropdownRef}>
          <label className="block text-sm font-bold text-gray-800 mb-1">สัตว์เลี้ยง (ผู้ป่วย) <span className="text-red-500">*</span></label>
          
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
          {errors.petId && <p className="text-red-500 text-xs mt-1">{errors.petId.message as string}</p>}
        </section>

        {/* 1. Chief Complaint */}
        <section className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200 space-y-4">
          <div className="flex items-center gap-2 text-gray-900 font-bold mb-2">
            <Stethoscope size={18} className="text-blue-600" />
            <h2>อาการสำคัญ (Chief Complaint)</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {CHIEF_COMPLAINTS.map((item) => {
              const isSelected = watchCcItems.includes(item);
              return (
                <button
                  key={item}
                  type="button"
                  onClick={() => toggleArrayItem("chiefComplaint.items", watchCcItems, item)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                    isSelected ? "bg-blue-600 text-white shadow-md border-blue-600" : "bg-gray-100 text-gray-800 hover:bg-gray-200 border border-transparent"
                  }`}
                >
                  {item}
                </button>
              );
            })}
          </div>
          <input 
            {...register("chiefComplaint.others")}
            type="text" 
            placeholder="อาการอื่นๆ..."
            className="w-full p-3 border border-gray-300 rounded-xl bg-gray-50 text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm placeholder-gray-500"
          />
        </section>

        {/* 2. Physical Exam */}
        <section className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200 space-y-4">
          <div className="flex items-center gap-2 text-gray-900 font-bold mb-2">
            <Activity size={18} className="text-orange-500" />
            <h2>การตรวจร่างกาย (Physical Exam)</h2>
          </div>
          
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">Weight (kg) <span className="text-red-500">*</span></label>
              <input 
                {...register("physicalExam.weight")} 
                type="number" 
                step="0.01" 
                placeholder="เช่น 4.5"
                className="w-full p-2.5 border border-gray-300 rounded-lg text-sm bg-gray-50 text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">General</label>
              <select {...register("physicalExam.general")} className="w-full p-2.5 border border-gray-300 rounded-lg text-sm bg-gray-50 text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500">
                <option value="">เลือก...</option>
                <option value="Bright">Bright</option>
                <option value="Depressed">Depressed</option>
                <option value="Coma">Coma</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">Temp.</label>
              <select {...register("physicalExam.temperature")} className="w-full p-2.5 border border-gray-300 rounded-lg text-sm bg-gray-50 text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500">
                <option value="">เลือก...</option>
                <option value="Normal">Normal</option>
                <option value="High">High</option>
                <option value="Low">Low</option>
              </select>
            </div>
          </div>

          <div className="pt-3 border-t border-gray-200">
            <label className="block text-xs font-bold text-gray-700 mb-3">Body System Abnormalities</label>
            <div className="flex flex-wrap gap-x-5 gap-y-3">
              {["Eye", "Ear", "Skin", "Lung", "Heart", "Abdomen", "Other"].map((sys) => (
                <label key={sys} className="flex items-center gap-2 text-sm font-medium text-gray-800 cursor-pointer">
                  <input type="checkbox" {...register(`physicalExam.bodySystem.${sys as any}`)} className="w-4 h-4 rounded border-gray-300 text-orange-500 focus:ring-orange-500" />
                  {sys}
                </label>
              ))}
            </div>
            {watch("physicalExam.bodySystem.Other") && (
              <input 
                {...register("physicalExam.bodySystem.OtherDetail")}
                type="text" 
                placeholder="ระบุความผิดปกติอื่นๆ..."
                className="w-full mt-3 p-3 border border-gray-300 rounded-xl bg-gray-50 text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm placeholder-gray-500"
              />
            )}
          </div>
        </section>

        {/* 3. Diagnosis */}
        <section className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200 space-y-4">
          <div className="flex items-center gap-2 text-gray-900 font-bold mb-2">
            <FileText size={18} className="text-purple-600" />
            <h2>การวินิจฉัย (Diagnosis)</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {DIAGNOSIS_LIST.map((item) => {
              const isSelected = watchDiagnosis.includes(item);
              return (
                <button
                  key={item}
                  type="button"
                  onClick={() => toggleArrayItem("diagnosis", watchDiagnosis, item)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                    isSelected ? "bg-purple-600 text-white shadow-md border-purple-600" : "bg-gray-100 text-gray-800 hover:bg-gray-200 border border-transparent"
                  }`}
                >
                  {item}
                </button>
              );
            })}
          </div>
          <input 
            {...register("diagnosisOthers")}
            type="text" 
            placeholder="การวินิจฉัยอื่นๆ..."
            className="w-full mt-2 p-3 border border-gray-300 rounded-xl bg-gray-50 text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm placeholder-gray-500"
          />
        </section>

        {/* 4. Treatment */}
        <section className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200 space-y-4">
          <div className="flex items-center gap-2 text-gray-900 font-bold mb-2">
            <Pill size={18} className="text-mint-600" />
            <h2>การรักษา (Treatment Plan)</h2>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { id: "Injection", label: "ฉีดยา" },
              { id: "Fluid", label: "ให้น้ำเกลือ" },
              { id: "Medication", label: "จ่ายยา" },
              { id: "Xray", label: "เอกซเรย์" },
              { id: "BloodChemistry", label: "ตรวจเลือด" },
              { id: "Hospitalization", label: "แอดมิท" },
            ].map((item) => (
              <label key={item.id} className="flex items-center gap-3 p-3 border border-gray-200 rounded-xl bg-gray-50 active:bg-gray-100 transition-colors cursor-pointer">
                <input 
                  type="checkbox" 
                  {...register(`treatment.${item.id as any}`)} 
                  className="w-4 h-4 rounded border-gray-300 text-mint-600 focus:ring-mint-600"
                />
                <span className="text-sm font-bold text-gray-800">{item.label}</span>
              </label>
            ))}
          </div>
        </section>

      </div>
      
      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-xl animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-white shadow-sm">
              <CheckCircle2 size={32} />
            </div>
            <h3 className="text-xl font-bold text-center text-gray-900 mb-2">บันทึกผลตรวจสำเร็จ</h3>
            <p className="text-sm text-center text-gray-500 mb-6">คุณต้องการทำอะไรต่อไป?</p>
            
            <div className="space-y-3">
              <button 
                type="button"
                onClick={() => router.push(`/appointments/new?petId=${savedPetId}`)}
                className="w-full flex items-center justify-center gap-2 py-3 bg-mint-50 text-mint-700 font-bold rounded-xl hover:bg-mint-100 transition-colors"
              >
                <CalendarPlus size={18} />
                นัดหมายครั้งต่อไป
              </button>
              <button 
                type="button"
                onClick={() => router.push(`/admit`)}
                className="w-full flex items-center justify-center gap-2 py-3 bg-orange-50 text-orange-700 font-bold rounded-xl hover:bg-orange-100 transition-colors"
              >
                <Home size={18} />
                แอดมิท (Admit)
              </button>
            </div>
            
            <button 
              type="button"
              onClick={() => router.push("/dashboard")}
              className="w-full mt-4 py-3 text-gray-500 font-bold hover:bg-gray-50 rounded-xl transition-colors"
            >
              กลับหน้าแรก
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function NewOpdPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen text-gray-500 font-bold">กำลังโหลด...</div>}>
      <OpdFormContent />
    </Suspense>
  );
}
