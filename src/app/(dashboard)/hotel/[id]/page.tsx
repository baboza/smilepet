"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { dailyLogSchema, DailyLogFormValues } from "@/features/hotel/schemas/hotel";
import { ArrowLeft, Save, Camera, Activity, Utensils, Droplets } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { use, useState } from "react";
import { db } from "@/lib/firebase/config";
import { doc, getDoc, collection, addDoc } from "firebase/firestore";
import { useQuery } from "@tanstack/react-query";

const fetchBookingData = async (id: string) => {
  const bookingDoc = await getDoc(doc(db, "hotel_bookings", id));
  if (!bookingDoc.exists()) return null;
  
  const bookingData = bookingDoc.data();
  let petName = "ไม่ทราบชื่อ";
  if (bookingData.petId) {
    const petDoc = await getDoc(doc(db, "pets", bookingData.petId));
    if (petDoc.exists()) petName = petDoc.data().name;
  }
  
  return {
    id: bookingDoc.id,
    roomNumber: bookingData.roomNumber || "-",
    food: bookingData.food || "-",
    petName
  };
};

export default function DailyLogPage({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = use(params);
  const id = unwrappedParams.id;
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: booking, isLoading } = useQuery({
    queryKey: ["hotelBooking", id],
    queryFn: () => fetchBookingData(id),
  });

  const { register, handleSubmit, watch, setValue } = useForm<any>({
    resolver: zodResolver(dailyLogSchema),
    defaultValues: {
      date: new Date().toISOString().split("T")[0],
    }
  });

  const onSubmit = async (data: any) => {
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, "hotel_daily_logs"), {
        bookingId: id,
        ...data,
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

  const renderRadioGroup = (name: keyof DailyLogFormValues, options: string[]) => {
    const currentValue = watch(name);
    return (
      <div className="flex flex-wrap gap-2 mt-2">
        {options.map((opt) => (
          <button
            key={opt}
            type="button"
            onClick={() => setValue(name, opt)}
            className={`px-3 py-1.5 rounded-full text-sm font-bold transition-all ${
              currentValue === opt ? "bg-orange-500 text-white shadow-md" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {opt}
          </button>
        ))}
      </div>
    );
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 pb-20">
      
      {/* Top App Bar */}
      <div className="bg-white px-4 py-4 shadow-sm sticky top-0 z-30 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/hotel" className="p-2 -ml-2 rounded-full hover:bg-gray-100 text-gray-600 transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-lg font-bold text-gray-900">
            อัปเดตรายวัน {booking ? `(${booking.petName})` : ""}
          </h1>
        </div>
      </div>

      <div className="p-4 space-y-4">
        
        {isLoading ? (
          <div className="h-20 bg-white animate-pulse rounded-2xl border border-gray-100"></div>
        ) : booking ? (
          <div className="bg-gradient-to-r from-orange-50 to-yellow-50 p-4 rounded-2xl border border-orange-100 flex items-center gap-4">
            <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center text-2xl shadow-sm shrink-0">
              🐈
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-gray-900 truncate">ห้อง {booking.roomNumber}</h3>
              <p className="text-xs text-orange-700 font-bold truncate">อาหาร: {booking.food}</p>
            </div>
          </div>
        ) : (
          <div className="p-4 text-center text-gray-500 font-bold">ไม่พบข้อมูลการเข้าพัก</div>
        )}

        {booking && (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            
            <section className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">วันที่อัปเดต</label>
                <input 
                  type="date" 
                  {...register("date")}
                  className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 transition-colors"
                />
              </div>
            </section>

            <section className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 space-y-5">
              <div className="flex items-center gap-2 text-gray-900 font-bold mb-2 border-b pb-2">
                <Activity size={18} className="text-orange-500" />
                <h2>Checklist ประจำวัน</h2>
              </div>
              
              <div>
                <label className="text-sm font-bold text-gray-700 flex items-center gap-2"><Utensils size={14}/> การกินอาหาร</label>
                {renderRadioGroup("eating", ["ดีมาก", "ปกติ", "น้อย", "ไม่กิน"])}
              </div>

              <div>
                <label className="text-sm font-bold text-gray-700 flex items-center gap-2"><Droplets size={14}/> การดื่มน้ำ</label>
                {renderRadioGroup("drinking", ["ดีมาก", "ปกติ", "น้อย", "ไม่กิน"])}
              </div>

              <div>
                <label className="text-sm font-bold text-gray-700">การขับถ่าย</label>
                {renderRadioGroup("pooping", ["ก้อนดี", "เหลว", "ไม่ถ่าย"])}
              </div>

              <div>
                <label className="text-sm font-bold text-gray-700">อารมณ์ / การเล่น</label>
                {renderRadioGroup("playing", ["ร่าเริง", "ปกติ", "ซึม"])}
              </div>

              <div className="pt-3 border-t border-gray-50 flex gap-4">
                <label className="flex items-center gap-2 text-sm text-gray-700 font-bold">
                  <input type="checkbox" {...register("vomit")} className="rounded border-gray-300 text-red-500 focus:ring-red-500" />
                  อาเจียน
                </label>
                <label className="flex items-center gap-2 text-sm text-gray-700 font-bold">
                  <input type="checkbox" {...register("diarrhea")} className="rounded border-gray-300 text-red-500 focus:ring-red-500" />
                  ถ่ายเหลว
                </label>
              </div>
            </section>

            <section className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 space-y-4">
              <div className="flex items-center gap-2 text-gray-900 font-bold mb-2">
                <Camera size={18} className="text-blue-500" />
                <h2>รูปถ่ายประจำวัน (ให้เจ้าของดู)</h2>
              </div>
              
              <div className="flex gap-2 overflow-x-auto pb-2">
                <div className="flex-shrink-0 flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-xl w-24 h-24 bg-gray-50 text-gray-400 hover:bg-gray-100 transition-colors cursor-pointer">
                  <Camera size={20} className="mb-1" />
                  <span className="text-[10px] font-bold">เพิ่มรูป</span>
                </div>
              </div>
              
              <div>
                <textarea 
                  {...register("notes")}
                  rows={2}
                  className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 transition-colors resize-none"
                  placeholder="โน้ตเพิ่มเติมถึงเจ้าของ..."
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
                    บันทึกอัปเดต
                  </>
                )}
              </button>
            </div>

          </form>
        )}
      </div>

    </div>
  );
}
