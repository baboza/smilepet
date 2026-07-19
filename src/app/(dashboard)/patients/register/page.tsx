"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Save, Camera, User, Dog, Search, ChevronDown } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { uploadImage } from "@/lib/firebase/storage";
import { db } from "@/lib/firebase/config";
import { collection, addDoc, getDocs, orderBy, query } from "firebase/firestore";
import { useQuery } from "@tanstack/react-query";

const registerFormSchema = z.object({
  isNewOwner: z.boolean().default(true),
  ownerId: z.string().optional(),
  name: z.string().optional(),
  phone: z.string().optional(),
  lineId: z.string().optional(),
  emergencyContact: z.string().optional(),
  address: z.string().optional(),
  petName: z.string().min(1, "กรุณาระบุชื่อสัตว์เลี้ยง"),
  petSpecies: z.string().min(1, "กรุณาระบุชนิด (เช่น หมา, แมว)"),
  petBreed: z.string().optional(),
  petBirthDate: z.string().optional(),
  petColor: z.string().optional(),
  petSex: z.string().optional(),
  petSterilization: z.string().optional(),
  petPhotoUrl: z.string().optional(),
}).superRefine((data, ctx) => {
  if (data.isNewOwner) {
    if (!data.name || data.name.length < 2) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "ชื่อต้องมีอย่างน้อย 2 ตัวอักษร", path: ["name"] });
    }
    if (!data.phone || data.phone.length < 9) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "เบอร์โทรศัพท์ไม่ถูกต้อง", path: ["phone"] });
    }
  } else {
    if (!data.ownerId) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "กรุณาเลือกลูกค้าเดิม", path: ["ownerId"] });
    }
  }
});

type RegisterFormValues = z.infer<typeof registerFormSchema>;

export default function RegisterOwnerPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // States for Image Upload
  const [petImageFile, setPetImageFile] = useState<File | null>(null);
  const [petImagePreview, setPetImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // States for Searchable Dropdown
  const [searchQuery, setSearchQuery] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<any>({
    resolver: zodResolver(registerFormSchema),
    defaultValues: {
      isNewOwner: true,
      ownerId: "",
    }
  });

  const isNewOwner = watch("isNewOwner");
  const selectedOwnerId = watch("ownerId");
  
  // Fetch real owners from Firestore
  const { data: ownersList = [] } = useQuery({
    queryKey: ["owners"],
    queryFn: async () => {
      const q = query(collection(db, "owners"), orderBy("createdAt", "desc"));
      const snap = await getDocs(q);
      return snap.docs.map(doc => ({ id: doc.id, ...(doc.data() as any) } as any)) as any[];
    }
  });

  const selectedOwner = ownersList.find((o: any) => o.id === selectedOwnerId);
  const filteredOwners = ownersList.filter((o: any) => 
    o.name?.includes(searchQuery) || o.phone?.includes(searchQuery)
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

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPetImageFile(file);
      setPetImagePreview(URL.createObjectURL(file));
    }
  };

  const onSubmit = async (data: any) => {
    setIsSubmitting(true);
    try {
      let petPhotoUrl = "";
      
      // Generate a document ID for the pet early if we need to store image
      if (petImageFile) {
        const path = `pets/${Date.now()}/profile_${petImageFile.name}`;
        petPhotoUrl = await uploadImage(petImageFile, path);
      }

      let finalOwnerId = data.ownerId;

      if (data.isNewOwner) {
        // Create new owner
        const ownerDoc = await addDoc(collection(db, "owners"), {
          name: data.name,
          phone: data.phone,
          lineId: data.lineId || "",
          emergencyContact: data.emergencyContact || "",
          address: data.address || "",
          createdAt: new Date().toISOString()
        });
        finalOwnerId = ownerDoc.id;
      }

      // Create new pet
      await addDoc(collection(db, "pets"), {
        ownerId: finalOwnerId,
        name: data.petName,
        species: data.petSpecies,
        breed: data.petBreed || "",
        birthDate: data.petBirthDate || "",
        color: data.petColor || "",
        sex: data.petSex || "",
        sterilization: data.petSterilization || "",
        photoUrl: petPhotoUrl,
        createdAt: new Date().toISOString()
      });

      router.push("/patients");
    } catch (error) {
      console.error(error);
      alert("เกิดข้อผิดพลาดในการบันทึกข้อมูล");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 pb-20">
      <div className="bg-white px-4 py-4 shadow-sm sticky top-0 z-30 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/patients" className="p-2 -ml-2 rounded-full hover:bg-gray-100 text-gray-800 transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-lg font-bold text-gray-900">ลงทะเบียน</h1>
        </div>
      </div>

      <div className="p-4 space-y-4">
        <div className="flex bg-gray-200 p-1 rounded-xl">
          <button 
            type="button"
            onClick={() => { setValue("isNewOwner", true); setValue("ownerId", ""); }}
            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${isNewOwner ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"}`}
          >
            ลูกค้าใหม่
          </button>
          <button 
            type="button"
            onClick={() => setValue("isNewOwner", false)}
            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${!isNewOwner ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"}`}
          >
            ลูกค้าเดิมเพิ่มสัตว์เลี้ยง
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <section className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200 space-y-4">
            <div className="flex items-center gap-2 text-gray-900 font-bold mb-2">
              <User size={18} className="text-blue-600" />
              <h2>ข้อมูลเจ้าของ</h2>
            </div>
            
            {isNewOwner ? (
              <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-300">
                <div>
                  <label className="block text-sm font-bold text-gray-800 mb-1">ชื่อ-นามสกุล <span className="text-red-500">*</span></label>
                  <input 
                    {...register("name")}
                    type="text" 
                    className={`w-full p-3 border rounded-xl bg-gray-50 text-gray-900 focus:bg-white focus:outline-none focus:ring-2 transition-colors ${errors.name ? "border-red-300 focus:ring-red-500" : "border-gray-300 focus:ring-blue-500"}`}
                    placeholder="เช่น คุณสมหญิง ใจดี"
                  />
                  {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message as string}</p>}
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-800 mb-1">เบอร์โทรศัพท์ <span className="text-red-500">*</span></label>
                  <input 
                    {...register("phone")}
                    type="tel" 
                    className={`w-full p-3 border rounded-xl bg-gray-50 text-gray-900 focus:bg-white focus:outline-none focus:ring-2 transition-colors ${errors.phone ? "border-red-300 focus:ring-red-500" : "border-gray-300 focus:ring-blue-500"}`}
                    placeholder="08X-XXX-XXXX"
                  />
                  {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone.message as string}</p>}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-bold text-gray-800 mb-1">LINE ID</label>
                    <input 
                      {...register("lineId")}
                      type="text" 
                      className="w-full p-3 border border-gray-300 rounded-xl bg-gray-50 text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-800 mb-1">ติดต่อฉุกเฉิน</label>
                    <input 
                      {...register("emergencyContact")}
                      type="text" 
                      className="w-full p-3 border border-gray-300 rounded-xl bg-gray-50 text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-800 mb-1">ที่อยู่</label>
                  <textarea 
                    {...register("address")}
                    rows={2}
                    className="w-full p-3 border border-gray-300 rounded-xl bg-gray-50 text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors resize-none"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-300" ref={dropdownRef}>
                <div>
                  <label className="block text-sm font-bold text-gray-800 mb-1">ค้นหาลูกค้า <span className="text-red-500">*</span></label>
                  
                  {/* Searchable Dropdown */}
                  <div className="relative">
                    <div 
                      className={`flex items-center justify-between w-full p-3 border rounded-xl bg-gray-50 cursor-pointer transition-colors ${errors.ownerId ? "border-red-300" : "border-gray-300"} ${isDropdownOpen ? "ring-2 ring-blue-500 bg-white" : ""}`}
                      onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    >
                      <span className={`text-sm ${selectedOwner ? "text-gray-900 font-bold" : "text-gray-500"}`}>
                        {selectedOwner ? `${selectedOwner.name} (${selectedOwner.phone})` : "-- พิมพ์ค้นหา หรือ เลือกจากรายชื่อ --"}
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
                              placeholder="ค้นหาชื่อ หรือ เบอร์โทร..."
                              value={searchQuery}
                              onChange={(e) => setSearchQuery(e.target.value)}
                              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                        </div>
                        <ul className="py-1">
                          {filteredOwners.length > 0 ? (
                            filteredOwners.map((owner: any) => (
                              <li
                                key={owner.id}
                                onClick={() => {
                                  setValue("ownerId", owner.id, { shouldValidate: true });
                                  setIsDropdownOpen(false);
                                  setSearchQuery("");
                                }}
                                className={`px-4 py-3 text-sm cursor-pointer hover:bg-blue-50 transition-colors ${selectedOwnerId === owner.id ? "bg-blue-50 text-blue-700 font-bold" : "text-gray-700"}`}
                              >
                                {owner.name} <span className="text-gray-500 font-normal text-xs ml-1">({owner.phone})</span>
                              </li>
                            ))
                          ) : (
                            <li className="px-4 py-3 text-sm text-gray-500 text-center">
                              ไม่พบข้อมูลลูกค้า
                            </li>
                          )}
                        </ul>
                      </div>
                    )}
                  </div>
                  {errors.ownerId && <p className="text-red-500 text-xs mt-1">{errors.ownerId.message as string}</p>}
                </div>
              </div>
            )}
          </section>

          <section className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200 space-y-4">
            <div className="flex items-center gap-2 text-gray-900 font-bold mb-2">
              <Dog size={18} className="text-orange-500" />
              <h2>ข้อมูลสัตว์เลี้ยงตัวใหม่</h2>
            </div>
            <div className="flex flex-col items-center justify-center mb-4">
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="relative w-28 h-28 rounded-full border-2 border-dashed border-gray-300 bg-gray-50 hover:bg-gray-100 flex flex-col items-center justify-center cursor-pointer overflow-hidden transition-colors"
              >
                {petImagePreview ? (
                  <img src={petImagePreview} alt="Pet Preview" className="w-full h-full object-cover" />
                ) : (
                  <>
                    <Camera size={28} className="text-gray-400 mb-1" />
                    <span className="text-[10px] text-gray-500 font-medium">เพิ่มรูปภาพ</span>
                  </>
                )}
              </div>
              <input type="file" ref={fileInputRef} onChange={handleImageChange} accept="image/*" className="hidden" />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-800 mb-1">ชื่อสัตว์เลี้ยง <span className="text-red-500">*</span></label>
              <input 
                {...register("petName")}
                type="text" 
                className={`w-full p-3 border rounded-xl bg-gray-50 text-gray-900 focus:bg-white focus:outline-none focus:ring-2 transition-colors ${errors.petName ? "border-red-300 focus:ring-red-500" : "border-gray-300 focus:ring-orange-500"}`}
              />
              {errors.petName && <p className="text-red-500 text-xs mt-1">{errors.petName.message as string}</p>}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-bold text-gray-800 mb-1">ชนิด <span className="text-red-500">*</span></label>
                <select 
                  {...register("petSpecies")}
                  className={`w-full p-3 border rounded-xl bg-gray-50 text-gray-900 focus:bg-white focus:outline-none focus:ring-2 transition-colors ${errors.petSpecies ? "border-red-300 focus:ring-red-500" : "border-gray-300 focus:ring-orange-500"}`}
                >
                  <option value="">เลือก...</option>
                  <option value="สุนัข">สุนัข</option>
                  <option value="แมว">แมว</option>
                  <option value="กระต่าย">กระต่าย</option>
                  <option value="Exotic">Exotic</option>
                </select>
                {errors.petSpecies && <p className="text-red-500 text-xs mt-1">{errors.petSpecies.message as string}</p>}
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-800 mb-1">พันธุ์</label>
                <input 
                  {...register("petBreed")}
                  type="text" 
                  className="w-full p-3 border border-gray-300 rounded-xl bg-gray-50 text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 transition-colors"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-bold text-gray-800 mb-1">วันเกิด</label>
                <input 
                  {...register("petBirthDate")}
                  type="date" 
                  className="w-full p-3 border border-gray-300 rounded-xl bg-gray-50 text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-800 mb-1">สี</label>
                <input 
                  {...register("petColor")}
                  type="text" 
                  className="w-full p-3 border border-gray-300 rounded-xl bg-gray-50 text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 transition-colors"
                  placeholder="เช่น ขาว, ดำ, น้ำตาล"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-bold text-gray-800 mb-1">เพศ</label>
                <select 
                  {...register("petSex")}
                  className="w-full p-3 border border-gray-300 rounded-xl bg-gray-50 text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 transition-colors"
                >
                  <option value="">เลือก...</option>
                  <option value="ผู้">ผู้</option>
                  <option value="เมีย">เมีย</option>
                  <option value="ไม่ระบุ">ไม่ระบุ</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-800 mb-1">การทำหมัน</label>
                <select 
                  {...register("petSterilization")}
                  className="w-full p-3 border border-gray-300 rounded-xl bg-gray-50 text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 transition-colors"
                >
                  <option value="">เลือก...</option>
                  <option value="ทำแล้ว">ทำแล้ว</option>
                  <option value="ยังไม่ทำ">ยังไม่ทำ</option>
                </select>
              </div>
            </div>
          </section>

          <div className="pt-2">
            <button 
              type="submit" 
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white font-bold py-3.5 rounded-xl hover:bg-blue-700 active:scale-[0.98] transition-all disabled:opacity-70 shadow-sm"
            >
              {isSubmitting ? (
                <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
              ) : (
                <>
                  <Save size={20} />
                  บันทึกข้อมูล
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
