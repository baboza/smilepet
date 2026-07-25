"use client";

import { useState } from "react";
import { Search, Plus, Activity, Calendar, Pill, X } from "lucide-react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { db } from "@/lib/firebase/config";
import { collection, getDocs, query, orderBy, doc, updateDoc } from "firebase/firestore";

const fetchAdmitRecords = async () => {
  const admitSnap = await getDocs(query(collection(db, "admit_records"), orderBy("createdAt", "desc")));
  const petsSnap = await getDocs(collection(db, "pets"));
  const ownersSnap = await getDocs(collection(db, "owners"));

  const petsList = petsSnap.docs.map(doc => ({ id: doc.id, ...(doc.data() as any) } as any));
  const ownersList = ownersSnap.docs.map(doc => ({ id: doc.id, ...(doc.data() as any) } as any));

  return admitSnap.docs.map(doc => {
    const data = doc.data() as any;
    const pet = petsList.find((p: any) => p.id === data.petId);
    const owner = ownersList.find((o: any) => o.id === pet?.ownerId);
    
    return {
      id: doc.id,
      petName: pet ? `${pet.name}` : "ไม่ทราบชื่อสัตว์",
      owner: owner?.name || "ไม่ทราบชื่อเจ้าของ",
      cageNumber: data.cageNumber || "-",
      symptoms: data.symptoms || "-",
      medications: data.medications || "-",
      admitDate: data.admitDate || "-",
      status: data.status || "กำลังรักษา"
    };
  });
};

export default function AdmitPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

  const getLocalDate = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().split("T")[0];
  };

  const [dischargeModalData, setDischargeModalData] = useState<any>(null);
  const [totalCost, setTotalCost] = useState("");
  const [dischargeDate, setDischargeDate] = useState(getLocalDate());
  const [dischargeNotes, setDischargeNotes] = useState("");
  
  const { data: records, isLoading, refetch } = useQuery({
    queryKey: ["admitRecords"],
    queryFn: fetchAdmitRecords,
  });

  const filteredRecords = records?.filter(rec => 
    rec.petName.includes(searchQuery) || 
    rec.owner.includes(searchQuery) ||
    rec.cageNumber.includes(searchQuery)
  );

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      setOpenDropdownId(null);
      await updateDoc(doc(db, "admit_records", id), {
        status: newStatus
      });
      refetch();
    } catch (error) {
      console.error(error);
      alert("เกิดข้อผิดพลาดในการอัปเดตสถานะ");
    }
  };

  const handleDischargeSubmit = async () => {
    if (!dischargeModalData) return;
    try {
      await updateDoc(doc(db, "admit_records", dischargeModalData.id), {
        status: "กลับบ้านแล้ว",
        dischargeDate: dischargeDate,
        totalCost: totalCost || "0",
        dischargeNotes: dischargeNotes
      });
      setDischargeModalData(null);
      setTotalCost("");
      setDischargeNotes("");
      setDischargeDate(getLocalDate());
      refetch();
    } catch (error) {
      console.error(error);
      alert("เกิดข้อผิดพลาดในการบันทึกการจำหน่าย");
    }
  };

  const calculateDays = (inDate: string, outDate: string) => {
    if (!inDate || !outDate || inDate === "-" || outDate === "-") return 0;
    const d1 = new Date(inDate);
    const d2 = new Date(outDate);
    const diff = (d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24);
    return Math.max(1, Math.ceil(diff)); // At least 1 day
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 pb-20">
      
      {/* Top App Bar */}
      <div className="bg-white px-4 py-4 shadow-sm sticky top-0 z-30 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900">ผู้ป่วยใน (Admit แมว)</h1>
          <Link 
            href="/admit/new"
            className="flex items-center justify-center w-10 h-10 bg-red-50 text-red-600 rounded-full hover:bg-red-100 transition-colors"
          >
            <Plus size={20} strokeWidth={2.5} />
          </Link>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={18} className="text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-xl leading-5 bg-gray-50 text-gray-900 placeholder-gray-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-red-500 transition-colors sm:text-sm"
            placeholder="ค้นหาชื่อแมว, เจ้าของ หรือกรง..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Admit List */}
      <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        {isLoading ? (
          [...Array(4)].map((_, i) => (
            <div key={i} className="bg-white p-4 rounded-2xl h-40 animate-pulse border border-gray-100"></div>
          ))
        ) : filteredRecords && filteredRecords.length > 0 ? (
          filteredRecords.map((rec) => (
            <div
              key={rec.id}
              className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-3 relative"
            >
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3 pr-2">
                  <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center text-xl shadow-inner shrink-0">
                    🏥
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-base font-bold text-gray-900 truncate">{rec.petName}</h3>
                    <p className="text-xs text-gray-500 mt-0.5 font-bold">กรง: <span className="text-red-600">{rec.cageNumber}</span></p>
                  </div>
                </div>
                
                <div className="relative">
                  <div 
                    className={`shrink-0 px-2.5 py-1 rounded-full text-xs font-bold border cursor-pointer hover:opacity-80 transition-opacity ${
                      rec.status === "กำลังรักษา" ? "bg-red-50 text-red-700 border-red-200" : "bg-gray-100 text-gray-600 border-gray-200"
                    }`}
                    onClick={() => setOpenDropdownId(openDropdownId === rec.id ? null : rec.id)}
                  >
                    {rec.status}
                  </div>

                  {openDropdownId === rec.id && (
                    <div className="absolute top-8 right-0 bg-white border border-gray-200 rounded-xl shadow-lg z-20 overflow-hidden w-36">
                      <button onClick={() => handleUpdateStatus(rec.id, "กำลังรักษา")} className="w-full text-left px-4 py-3 text-sm font-bold text-red-600 hover:bg-gray-50 border-b border-gray-100">กำลังรักษา</button>
                      <button 
                        onClick={() => {
                          setOpenDropdownId(null);
                          setDischargeModalData(rec);
                          setDischargeDate(getLocalDate());
                          setTotalCost("");
                          setDischargeNotes("");
                        }} 
                        className="w-full text-left px-4 py-3 text-sm font-bold text-gray-600 hover:bg-gray-50"
                      >
                        ทำเรื่องจำหน่าย
                      </button>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="space-y-1.5 pt-2 mt-1 border-t border-gray-50 text-sm">
                <div className="flex items-start gap-2">
                  <Activity size={16} className="text-red-400 shrink-0 mt-0.5" />
                  <p className="text-gray-700 font-medium break-words leading-tight"><span className="font-bold">อาการ:</span> {rec.symptoms}</p>
                </div>
                {rec.medications && rec.medications !== "-" && (
                  <div className="flex items-start gap-2">
                    <Pill size={16} className="text-blue-400 shrink-0 mt-0.5" />
                    <p className="text-gray-700 font-medium break-words leading-tight"><span className="font-bold">ยา:</span> {rec.medications}</p>
                  </div>
                )}
              </div>

              <div className="flex justify-between items-center pt-3 border-t border-gray-50">
                <div className="flex items-center gap-1.5 text-xs text-gray-500 font-bold">
                  <Calendar size={14} className="text-gray-400 shrink-0" />
                  <span className="truncate">แอดมิทเมื่อ: {rec.admitDate}</span>
                </div>
                <div className="text-xs font-bold text-gray-400 shrink-0 ml-2">
                  {rec.owner}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-1 md:col-span-2 text-center py-10">
            <p className="text-gray-500 font-bold mb-2">ไม่มีผู้ป่วยแอดมิท</p>
          </div>
        )}
      </div>

      {/* Discharge Modal */}
      {dischargeModalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between shrink-0">
              <h2 className="font-bold text-gray-900">สรุปการแอดมิท (จำหน่าย/กลับบ้าน)</h2>
              <button onClick={() => setDischargeModalData(null)} className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-4 space-y-4 overflow-y-auto">
              <div className="bg-red-50 p-3 rounded-xl border border-red-100">
                <p className="font-bold text-red-900">{dischargeModalData.petName}</p>
                <p className="text-xs text-red-700 mt-0.5">เจ้าของ: {dischargeModalData.owner}</p>
                <p className="text-xs text-red-700 mt-0.5">วันที่เข้า: {dischargeModalData.admitDate}</p>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-800 mb-1">วันที่จำหน่าย</label>
                <input 
                  type="date" 
                  value={dischargeDate}
                  onChange={(e) => setDischargeDate(e.target.value)}
                  className="w-full p-2.5 border border-gray-300 rounded-xl bg-gray-50 text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  จำนวนวันแอดมิท: <span className="font-bold text-red-600">{calculateDays(dischargeModalData.admitDate, dischargeDate)} วัน</span>
                </p>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-800 mb-1">อาการตอนกลับ (อัปเดต)</label>
                <textarea 
                  rows={2}
                  value={dischargeNotes}
                  onChange={(e) => setDischargeNotes(e.target.value)}
                  placeholder="เช่น ทานอาหารได้ปกติ, แผลแห้งดี..."
                  className="w-full p-2.5 border border-gray-300 rounded-xl bg-gray-50 text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
                ></textarea>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-800 mb-1">ค่าใช้จ่ายรวม (บาท)</label>
                <input 
                  type="number" 
                  placeholder="เช่น 3500"
                  value={totalCost}
                  onChange={(e) => setTotalCost(e.target.value)}
                  className="w-full p-2.5 border border-gray-300 rounded-xl bg-gray-50 text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              <button 
                onClick={handleDischargeSubmit}
                className="w-full py-3 bg-red-600 text-white font-bold rounded-xl shadow-md hover:bg-red-700 active:scale-[0.98] transition-all"
              >
                ยืนยันการจำหน่าย
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
