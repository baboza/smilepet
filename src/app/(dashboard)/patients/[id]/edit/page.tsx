"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Save, User } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect, use } from "react";
import { db } from "@/lib/firebase/config";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { useQuery } from "@tanstack/react-query";

const ownerFormSchema = z.object({
  name: z.string().min(1, "กรุณาระบุชื่อลูกค้า"),
  phone: z.string().min(9, "เบอร์โทรศัพท์ไม่ถูกต้อง"),
  lineId: z.string().optional(),
  address: z.string().optional(),
});

const fetchOwner = async (id: string) => {
  const docRef = doc(db, "owners", id);
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) return null;
  return { id: docSnap.id, ...(docSnap.data() as any) };
};

export default function EditOwnerPage({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = use(params);
  const id = unwrappedParams.id;
  const router = useRouter();
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: owner, isLoading } = useQuery({
    queryKey: ["owner", id],
    queryFn: () => fetchOwner(id),
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<any>({
    resolver: zodResolver(ownerFormSchema)
  });

  useEffect(() => {
    if (owner) {
      reset({
        name: owner.name || "",
        phone: owner.phone || "",
        lineId: owner.lineId || "",
        address: owner.address || "",
      });
    }
  }, [owner, reset]);

  const onSubmit = async (data: any) => {
    if (!owner) return;
    setIsSubmitting(true);
    try {
      await updateDoc(doc(db, "owners", id), {
        name: data.name,
        phone: data.phone,
        lineId: data.lineId || "-",
        address: data.address || "-",
        updatedAt: new Date().toISOString()
      });

      router.push(`/patients/${id}`);
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

  if (!owner) {
    return <div className="p-10 text-center">ไม่พบข้อมูลลูกค้า</div>;
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 pb-20">
      <div className="bg-white px-4 py-4 shadow-sm sticky top-0 z-30 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href={`/patients/${id}`} className="p-2 -ml-2 rounded-full hover:bg-gray-100 text-gray-800 transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-lg font-bold text-gray-900">แก้ไขข้อมูลลูกค้า</h1>
        </div>
      </div>

      <div className="p-4 space-y-4">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <section className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200 space-y-4">
            <div className="flex items-center gap-2 text-gray-900 font-bold mb-2">
              <User size={18} className="text-blue-500" />
              <h2>ข้อมูลลูกค้า (เจ้าของ)</h2>
            </div>
            
            <div>
              <label className="block text-sm font-bold text-gray-800 mb-1">ชื่อลูกค้า <span className="text-red-500">*</span></label>
              <input 
                {...register("name")}
                type="text" 
                className={`w-full p-3 border rounded-xl bg-gray-50 text-gray-900 focus:bg-white focus:outline-none focus:ring-2 transition-colors ${errors.name ? "border-red-300 focus:ring-red-500" : "border-gray-300 focus:ring-blue-500"}`}
              />
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message as string}</p>}
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-800 mb-1">เบอร์โทรศัพท์ <span className="text-red-500">*</span></label>
              <input 
                {...register("phone")}
                type="tel" 
                className={`w-full p-3 border rounded-xl bg-gray-50 text-gray-900 focus:bg-white focus:outline-none focus:ring-2 transition-colors ${errors.phone ? "border-red-300 focus:ring-red-500" : "border-gray-300 focus:ring-blue-500"}`}
              />
              {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone.message as string}</p>}
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-800 mb-1">Line ID</label>
              <input 
                {...register("lineId")}
                type="text" 
                className="w-full p-3 border border-gray-300 rounded-xl bg-gray-50 text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-800 mb-1">ที่อยู่</label>
              <textarea 
                {...register("address")}
                rows={3}
                className="w-full p-3 border border-gray-300 rounded-xl bg-gray-50 text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
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
