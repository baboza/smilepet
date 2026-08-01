"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Save, Camera, Dog } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useRef, useEffect, use } from "react";
import { uploadImage } from "@/lib/firebase/storage";
import { db } from "@/lib/firebase/config";
import { collection, doc, getDoc, getDocs, updateDoc } from "firebase/firestore";
import { useQuery } from "@tanstack/react-query";

const petFormSchema = z.object({
  name: z.string().min(1, "กรุณาระบุชื่อสัตว์เลี้ยง"),
  species: z.string().min(1, "กรุณาระบุชนิด (เช่น หมา, แมว)"),
  breed: z.string().optional(),
  birthDate: z.string().optional(),
  color: z.string().optional(),
  sex: z.string().optional(),
  sterilization: z.string().optional(),
  weight: z.string().optional(),
  photoUrl: z.string().optional(),
  ownerId: z.string().min(1, "กรุณาระบุเจ้าของ"),
});

type PetFormValues = z.infer<typeof petFormSchema>;

const fetchPet = async (id: string) => {
  const docRef = doc(db, "pets", id);
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) return null;
  return { id: docSnap.id, ...(docSnap.data() as any) };
};

const fetchOwners = async () => {
  const snap = await getDocs(collection(db, "owners"));
  return snap.docs.map(doc => ({ id: doc.id, ...doc.data() as any }));
};

export default function EditPetPage({ params }: { params: Promise<{ petId: string }> }) {
  const unwrappedParams = use(params);
  const petId = unwrappedParams.petId;
  const router = useRouter();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [petImageFile, setPetImageFile] = useState<File | null>(null);
  const [petImagePreview, setPetImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: pet, isLoading } = useQuery({
    queryKey: ["pet", petId],
    queryFn: () => fetchPet(petId),
  });

  const { data: owners, isLoading: isOwnersLoading } = useQuery({
    queryKey: ["owners-list"],
    queryFn: fetchOwners,
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<any>({
    resolver: zodResolver(petFormSchema)
  });

  useEffect(() => {
    if (pet) {
      reset({
        name: pet.name || "",
        species: pet.species || "",
        breed: pet.breed || "",
        birthDate: pet.birthDate || "",
        color: pet.color || "",
        sex: pet.sex || "",
        sterilization: pet.sterilization || "",
        weight: pet.weight || "",
        ownerId: pet.ownerId || "",
      });
      if (pet.photoUrl) {
        setPetImagePreview(pet.photoUrl);
      }
    }
  }, [pet, reset]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPetImageFile(file);
      setPetImagePreview(URL.createObjectURL(file));
    }
  };

  const onSubmit = async (data: any) => {
    if (!pet) return;
    setIsSubmitting(true);
    try {
      let petPhotoUrl = pet.photoUrl || "";
      
      if (petImageFile) {
        const path = `pets/${Date.now()}_${petImageFile.name}`;
        petPhotoUrl = await uploadImage(petImageFile, path);
      }

      await updateDoc(doc(db, "pets", petId), {
        name: data.name,
        species: data.species,
        breed: data.breed || "",
        birthDate: data.birthDate || "",
        color: data.color || "",
        sex: data.sex || "",
        sterilization: data.sterilization || "",
        weight: data.weight || "",
        ownerId: data.ownerId || pet.ownerId,
        photoUrl: petPhotoUrl,
        updatedAt: new Date().toISOString()
      });

      // Navigate back to owner profile (new owner if changed)
      router.push(`/patients/${data.ownerId || pet.ownerId}`);
    } catch (error) {
      console.error(error);
      alert("เกิดข้อผิดพลาดในการบันทึกข้อมูล");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <div className="p-10 text-center">กำลังโหลด...</div>;
  }

  if (!pet) {
    return <div className="p-10 text-center">ไม่พบข้อมูลสัตว์เลี้ยง</div>;
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 pb-20">
      <div className="bg-white px-4 py-4 shadow-sm sticky top-0 z-30 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href={`/patients/${pet.ownerId}`} className="p-2 -ml-2 rounded-full hover:bg-gray-100 text-gray-800 transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-lg font-bold text-gray-900">แก้ไขข้อมูลสัตว์เลี้ยง</h1>
        </div>
      </div>

      <div className="p-4 space-y-4">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <section className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200 space-y-4">
            <div className="flex items-center gap-2 text-gray-900 font-bold mb-2">
              <Dog size={18} className="text-orange-500" />
              <h2>ข้อมูลสัตว์เลี้ยง</h2>
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
                    <span className="text-[10px] text-gray-500 font-medium">เปลี่ยนรูปภาพ</span>
                  </>
                )}
              </div>
              <input type="file" ref={fileInputRef} onChange={handleImageChange} accept="image/*" className="hidden" />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-800 mb-1">ชื่อสัตว์เลี้ยง <span className="text-red-500">*</span></label>
              <input 
                {...register("name")}
                type="text" 
                className={`w-full p-3 border rounded-xl bg-gray-50 text-gray-900 focus:bg-white focus:outline-none focus:ring-2 transition-colors ${errors.name ? "border-red-300 focus:ring-red-500" : "border-gray-300 focus:ring-orange-500"}`}
              />
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message as string}</p>}
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-800 mb-1">เจ้าของ <span className="text-red-500">*</span></label>
              <select 
                {...register("ownerId")}
                className={`w-full p-3 border rounded-xl bg-gray-50 text-gray-900 focus:bg-white focus:outline-none focus:ring-2 transition-colors ${errors.ownerId ? "border-red-300 focus:ring-red-500" : "border-gray-300 focus:ring-orange-500"}`}
                disabled={isOwnersLoading}
              >
                <option value="">เลือกเจ้าของ...</option>
                {owners?.map((owner: any) => (
                  <option key={owner.id} value={owner.id}>
                    {owner.name} {owner.phone ? `(${owner.phone})` : ""}
                  </option>
                ))}
              </select>
              {errors.ownerId && <p className="text-red-500 text-xs mt-1">{errors.ownerId.message as string}</p>}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-bold text-gray-800 mb-1">ชนิด <span className="text-red-500">*</span></label>
                <select 
                  {...register("species")}
                  className={`w-full p-3 border rounded-xl bg-gray-50 text-gray-900 focus:bg-white focus:outline-none focus:ring-2 transition-colors ${errors.species ? "border-red-300 focus:ring-red-500" : "border-gray-300 focus:ring-orange-500"}`}
                >
                  <option value="">เลือก...</option>
                  <option value="สุนัข">สุนัข</option>
                  <option value="แมว">แมว</option>
                  <option value="กระต่าย">กระต่าย</option>
                  <option value="Exotic">Exotic</option>
                </select>
                {errors.species && <p className="text-red-500 text-xs mt-1">{errors.species.message as string}</p>}
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-800 mb-1">พันธุ์</label>
                <input 
                  {...register("breed")}
                  type="text" 
                  className="w-full p-3 border border-gray-300 rounded-xl bg-gray-50 text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 transition-colors"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-bold text-gray-800 mb-1">วันเกิด (โดยประมาณ)</label>
                <input 
                  {...register("birthDate")}
                  type="date" 
                  className="w-full p-3 border border-gray-300 rounded-xl bg-gray-50 text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-800 mb-1">สี</label>
                <input 
                  {...register("color")}
                  type="text" 
                  className="w-full p-3 border border-gray-300 rounded-xl bg-gray-50 text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 transition-colors"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-bold text-gray-800 mb-1">เพศ</label>
                <select 
                  {...register("sex")}
                  className="w-full p-3 border border-gray-300 rounded-xl bg-gray-50 text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 transition-colors"
                >
                  <option value="">เลือก...</option>
                  <option value="ผู้">ตัวผู้</option>
                  <option value="เมีย">ตัวเมีย</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-800 mb-1">การทำหมัน</label>
                <select 
                  {...register("sterilization")}
                  className="w-full p-3 border border-gray-300 rounded-xl bg-gray-50 text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 transition-colors"
                >
                  <option value="">เลือก...</option>
                  <option value="ยังไม่ทำ">ยังไม่ทำ</option>
                  <option value="ทำแล้ว">ทำแล้ว</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-800 mb-1">น้ำหนัก (กิโลกรัม)</label>
              <input 
                {...register("weight")}
                type="text" 
                className="w-full p-3 border border-gray-300 rounded-xl bg-gray-50 text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 transition-colors"
                placeholder="เช่น 5.2"
              />
            </div>
          </section>

          <button 
            type="submit" 
            disabled={isSubmitting}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors disabled:bg-blue-400 shadow-sm"
          >
            {isSubmitting ? (
              <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></span>
            ) : (
              <Save size={20} />
            )}
            {isSubmitting ? "กำลังบันทึก..." : "บันทึกข้อมูล"}
          </button>
        </form>
      </div>
    </div>
  );
}
